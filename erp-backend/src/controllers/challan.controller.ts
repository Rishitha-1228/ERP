import { Request, Response } from "express";
import { query, withTransaction } from "../config/database";
import { AppError } from "../utils/AppError";
import { parsePagination, buildMeta, generateChallanNumber } from "../utils/helpers";

export async function list(req: Request, res: Response) {
  const { page, limit, offset } = parsePagination(req.query);
  const status = (req.query.status as string) || "";

  const where = status ? `WHERE ch.status = $1` : "";
  const params = status ? [status] : [];

  const totalRes = await query(`SELECT COUNT(*)::int AS count FROM challans ch ${where}`, params);
  const dataRes = await query(
    `SELECT ch.*, c.name AS customer_name, c.mobile AS customer_mobile, u.name AS created_by_name
     FROM challans ch
     JOIN customers c ON c.id = ch.customer_id
     LEFT JOIN users u ON u.id = ch.created_by
     ${where}
     ORDER BY ch.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  const challans = await attachItems(dataRes.rows);

  res.status(200).json({
    success: true,
    data: challans,
    meta: buildMeta(totalRes.rows[0].count, page, limit),
  });
}

export async function getById(req: Request, res: Response) {
  const { id } = req.params;
  const result = await query(
    `SELECT ch.*, c.name AS customer_name, c.mobile AS customer_mobile, u.name AS created_by_name
     FROM challans ch
     JOIN customers c ON c.id = ch.customer_id
     LEFT JOIN users u ON u.id = ch.created_by
     WHERE ch.id = $1`,
    [id]
  );
  const challan = result.rows[0];
  if (!challan) throw AppError.notFound("Challan not found");

  const [withItems] = await attachItems([challan]);
  res.status(200).json({ success: true, data: withItems });
}

/**
 * Creates a challan with product snapshots.
 * DRAFT: stock untouched. CONFIRMED: stock reduced immediately and
 * atomically — the whole transaction rolls back if any line item has
 * insufficient stock.
 */
export async function create(req: Request, res: Response) {
  const { customerId, items, status } = req.body;

  const challan = await withTransaction(async (client) => {
    const customerRes = await client.query(`SELECT id FROM customers WHERE id = $1`, [customerId]);
    if (!customerRes.rows[0]) throw AppError.notFound("Customer not found");

    const productIds = items.map((i: { productId: string }) => i.productId);
    const productsRes = await client.query(
      `SELECT id, name, sku, unit_price, current_stock FROM products WHERE id = ANY($1::uuid[])`,
      [productIds]
    );
    if (productsRes.rows.length !== items.length) {
      throw AppError.badRequest("One or more products were not found");
    }

    const challanNumber = await generateChallanNumber(client);
    const totalQuantity = items.reduce((sum: number, i: { quantity: number }) => sum + i.quantity, 0);
    const finalStatus = status === "CONFIRMED" ? "CONFIRMED" : "DRAFT";

    const challanRes = await client.query(
      `INSERT INTO challans (challan_number, customer_id, total_quantity, status, created_by)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [challanNumber, customerId, totalQuantity, finalStatus, req.user!.id]
    );
    const challanRow = challanRes.rows[0];

    for (const item of items as { productId: string; quantity: number }[]) {
      const product = productsRes.rows.find((p) => p.id === item.productId);
      await client.query(
        `INSERT INTO challan_items (challan_id, product_id, product_name_snap, product_sku_snap, unit_price_snap, quantity)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [challanRow.id, product.id, product.name, product.sku, product.unit_price, item.quantity]
      );
    }

    if (finalStatus === "CONFIRMED") {
      await reduceStockForItems(client, items, req.user!.id, challanNumber);
    }

    return challanRow;
  });

  const result = await query(
    `SELECT ch.*, c.name AS customer_name, c.mobile AS customer_mobile, u.name AS created_by_name
     FROM challans ch JOIN customers c ON c.id = ch.customer_id
     LEFT JOIN users u ON u.id = ch.created_by WHERE ch.id = $1`,
    [challan.id]
  );
  const [withItems] = await attachItems(result.rows);
  res.status(201).json({ success: true, data: withItems });
}

async function reduceStockForItems(
  client: import("pg").PoolClient,
  items: { productId: string; quantity: number }[],
  userId: string,
  challanNumber: string
) {
  for (const item of items) {
    const productRes = await client.query(
      `SELECT id, name, current_stock FROM products WHERE id = $1 FOR UPDATE`,
      [item.productId]
    );
    const product = productRes.rows[0];
    if (!product) throw AppError.notFound("Product not found");

    const newStock = product.current_stock - item.quantity;
    if (newStock < 0) {
      throw AppError.badRequest(
        `Insufficient stock for '${product.name}'. Available: ${product.current_stock}, required: ${item.quantity}`
      );
    }

    await client.query(`UPDATE products SET current_stock = $1, updated_at = now() WHERE id = $2`, [
      newStock,
      item.productId,
    ]);
    await client.query(
      `INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by)
       VALUES ($1,$2,'OUT',$3,$4)`,
      [item.productId, item.quantity, `Sales challan ${challanNumber}`, userId]
    );
  }
}

export async function confirm(req: Request, res: Response) {
  const { id } = req.params;

  await withTransaction(async (client) => {
    const challanRes = await client.query(`SELECT * FROM challans WHERE id = $1 FOR UPDATE`, [id]);
    const challan = challanRes.rows[0];
    if (!challan) throw AppError.notFound("Challan not found");
    if (challan.status !== "DRAFT") {
      throw AppError.badRequest(`Only DRAFT challans can be confirmed (current: ${challan.status})`);
    }

    const itemsRes = await client.query(
      `SELECT product_id, quantity FROM challan_items WHERE challan_id = $1`,
      [id]
    );
    await reduceStockForItems(
      client,
      itemsRes.rows.map((r) => ({ productId: r.product_id, quantity: r.quantity })),
      req.user!.id,
      challan.challan_number
    );

    await client.query(`UPDATE challans SET status = 'CONFIRMED', updated_at = now() WHERE id = $1`, [id]);
  });

  const result = await query(
    `SELECT ch.*, c.name AS customer_name, c.mobile AS customer_mobile, u.name AS created_by_name
     FROM challans ch JOIN customers c ON c.id = ch.customer_id
     LEFT JOIN users u ON u.id = ch.created_by WHERE ch.id = $1`,
    [id]
  );
  const [withItems] = await attachItems(result.rows);
  res.status(200).json({ success: true, data: withItems });
}

export async function cancel(req: Request, res: Response) {
  const { id } = req.params;

  await withTransaction(async (client) => {
    const challanRes = await client.query(`SELECT * FROM challans WHERE id = $1 FOR UPDATE`, [id]);
    const challan = challanRes.rows[0];
    if (!challan) throw AppError.notFound("Challan not found");
    if (challan.status === "CANCELLED") throw AppError.badRequest("Challan is already cancelled");

    if (challan.status === "CONFIRMED") {
      const itemsRes = await client.query(
        `SELECT product_id, quantity FROM challan_items WHERE challan_id = $1`,
        [id]
      );
      for (const item of itemsRes.rows) {
        await client.query(
          `UPDATE products SET current_stock = current_stock + $1, updated_at = now() WHERE id = $2`,
          [item.quantity, item.product_id]
        );
        await client.query(
          `INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by)
           VALUES ($1,$2,'IN',$3,$4)`,
          [item.product_id, item.quantity, `Cancelled challan ${challan.challan_number} - stock restored`, req.user!.id]
        );
      }
    }

    await client.query(`UPDATE challans SET status = 'CANCELLED', updated_at = now() WHERE id = $1`, [id]);
  });

  res.status(200).json({ success: true, message: "Challan cancelled" });
}

async function attachItems(challanRows: any[]) {
  const results = [];
  for (const row of challanRows) {
    const itemsRes = await query(
      `SELECT id, product_id, product_name_snap, product_sku_snap, unit_price_snap, quantity
       FROM challan_items WHERE challan_id = $1`,
      [row.id]
    );
    results.push({
      id: row.id,
      challanNumber: row.challan_number,
      customerId: row.customer_id,
      customerName: row.customer_name,
      customerMobile: row.customer_mobile,
      totalQuantity: row.total_quantity,
      status: row.status,
      createdByName: row.created_by_name,
      createdAt: row.created_at,
      items: itemsRes.rows.map((i) => ({
        id: i.id,
        productId: i.product_id,
        productName: i.product_name_snap,
        productSku: i.product_sku_snap,
        unitPrice: i.unit_price_snap,
        quantity: i.quantity,
      })),
    });
  }
  return results;
}
