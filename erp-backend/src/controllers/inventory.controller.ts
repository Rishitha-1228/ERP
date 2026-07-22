import { Request, Response } from "express";
import { query, withTransaction } from "../config/database";
import { AppError } from "../utils/AppError";
import { parsePagination, buildMeta } from "../utils/helpers";

export async function list(req: Request, res: Response) {
  const { page, limit, offset } = parsePagination(req.query);
  const productId = (req.query.productId as string) || "";

  const where = productId ? `WHERE sm.product_id = $1` : "";
  const params = productId ? [productId] : [];

  const totalRes = await query(`SELECT COUNT(*)::int AS count FROM stock_movements sm ${where}`, params);
  const dataRes = await query(
    `SELECT sm.*, p.name AS product_name, u.name AS created_by_name
     FROM stock_movements sm
     JOIN products p ON p.id = sm.product_id
     LEFT JOIN users u ON u.id = sm.created_by
     ${where}
     ORDER BY sm.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  res.status(200).json({
    success: true,
    data: dataRes.rows.map(toMovementDto),
    meta: buildMeta(totalRes.rows[0].count, page, limit),
  });
}

/**
 * Records a stock movement and updates the product's current_stock
 * atomically. Stock can never go negative — IN and ADJUST(+) increase it,
 * OUT and ADJUST(-) decrease it and are rejected if insufficient.
 * For simplicity, ADJUST always means "set to a corrected IN-style add";
 * use OUT for reductions.
 */
export async function create(req: Request, res: Response) {
  const { productId, quantity, movementType, reason } = req.body;

  const result = await withTransaction(async (client) => {
    const productRes = await client.query(
      `SELECT id, name, current_stock FROM products WHERE id = $1 FOR UPDATE`,
      [productId]
    );
    const product = productRes.rows[0];
    if (!product) throw AppError.notFound("Product not found");

    const delta = movementType === "OUT" ? -quantity : quantity;
    const newStock = product.current_stock + delta;

    if (newStock < 0) {
      throw AppError.badRequest(
        `Insufficient stock for '${product.name}'. Available: ${product.current_stock}, requested OUT: ${quantity}`
      );
    }

    await client.query(`UPDATE products SET current_stock = $1, updated_at = now() WHERE id = $2`, [
      newStock,
      productId,
    ]);

    const movementRes = await client.query(
      `INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [productId, quantity, movementType, reason, req.user!.id]
    );

    return { ...movementRes.rows[0], product_name: product.name };
  });

  res.status(201).json({
  success: true,
  message: "Stock movement recorded successfully.",
  data: toMovementDto(result),
});
}

function toMovementDto(row: any) {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    quantity: row.quantity,
    movementType: row.movement_type,
    reason: row.reason,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
  };
}
