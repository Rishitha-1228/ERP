import { Request, Response } from "express";
import { query } from "../config/database";
import { AppError } from "../utils/AppError";
import { parsePagination, buildMeta } from "../utils/helpers";

export async function list(req: Request, res: Response) {
  const { page, limit, offset } = parsePagination(req.query);

  const search = (req.query.search as string) || "";
  const category = (req.query.category as string) || "";

  const conditions: string[] = [
    "p.is_active = TRUE",
  ];

  const params: unknown[] = [];

  if (search) {
    params.push(`%${search}%`);

    conditions.push(
      `(p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length})`
    );
  }

  if (category) {
    params.push(category);

    conditions.push(
      `cat.name = $${params.length}`
    );
  }

  const where = `WHERE ${conditions.join(" AND ")}`;

  const totalRes = await query(
    `SELECT COUNT(*)::int AS count
     FROM products p
     LEFT JOIN categories cat
     ON cat.id = p.category_id
     ${where}`,
    params
  );

  const dataRes = await query(
    `SELECT
        p.*,
        cat.name AS category_name,
        w.name AS warehouse_name
     FROM products p
     LEFT JOIN categories cat
        ON cat.id = p.category_id
     LEFT JOIN warehouses w
        ON w.id = p.warehouse_id
     ${where}
     ORDER BY p.created_at DESC
     LIMIT $${params.length + 1}
     OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  res.status(200).json({
    success: true,
    data: dataRes.rows.map(toProductDto),
    meta: buildMeta(
      totalRes.rows[0].count,
      page,
      limit
    ),
  });
}

export async function getById(
  req: Request,
  res: Response
) {
  const { id } = req.params;

  const productRes = await query(
    `SELECT
        p.*,
        cat.name AS category_name,
        w.name AS warehouse_name
     FROM products p
     LEFT JOIN categories cat
        ON cat.id = p.category_id
     LEFT JOIN warehouses w
        ON w.id = p.warehouse_id
     WHERE p.id = $1`,
    [id]
  );

  const product = productRes.rows[0];

  if (!product) {
    throw AppError.notFound(
      "Product not found"
    );
  }

  const movementsRes = await query(
    `SELECT
        sm.*,
        u.name AS created_by_name
     FROM stock_movements sm
     LEFT JOIN users u
        ON u.id = sm.created_by
     WHERE sm.product_id = $1
     ORDER BY sm.created_at DESC
     LIMIT 25`,
    [id]
  );

  res.status(200).json({
    success: true,
    data: {
      ...toProductDto(product),
      stockMovements:
        movementsRes.rows.map(
          toMovementDto
        ),
    },
  });
}

/**
 * Finds or creates category/warehouse.
 */
async function resolveLookup(
  table: "categories" | "warehouses",
  name: string | undefined
) {
  if (!name) return null;

  const existing = await query(
    `SELECT id FROM ${table}
     WHERE name = $1`,
    [name]
  );

  if (existing.rows[0]) {
    return existing.rows[0].id;
  }

  const created = await query(
    `INSERT INTO ${table}
     (name)
     VALUES ($1)
     RETURNING id`,
    [name]
  );

  return created.rows[0].id;
}

export async function create(
  req: Request,
  res: Response
) {
  const b = req.body;

  const existingSku = await query(
    `SELECT id
     FROM products
     WHERE sku = $1`,
    [b.sku]
  );

  if (existingSku.rows.length > 0) {
    throw AppError.conflict(
      "A product with this SKU already exists"
    );
  }

  const categoryId =
    await resolveLookup(
      "categories",
      b.category
    );

  const warehouseId =
    await resolveLookup(
      "warehouses",
      b.warehouse
    );

  const result = await query(
    `INSERT INTO products
    (
      name,
      sku,
      category_id,
      warehouse_id,
      unit_price,
      current_stock,
      min_stock_alert
    )
    VALUES
    ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *`,
    [
      b.name,
      b.sku,
      categoryId,
      warehouseId,
      b.unitPrice ?? 0,
      b.currentStock ?? 0,
      b.minStockAlert ?? 0,
    ]
  );

  res.status(201).json({
    success: true,
    message: "Product created successfully.",
    data: toProductDto({
      ...result.rows[0],
      category_name: b.category,
      warehouse_name: b.warehouse,
    }),
  });
}

export async function update(
  req: Request,
  res: Response
) {
  const { id } = req.params;
  const b = req.body;

  const existing = await query(
    `SELECT id
     FROM products
     WHERE id = $1`,
    [id]
  );

  if (existing.rows.length === 0) {
    throw AppError.notFound("Product not found");
  }

  const categoryId = b.category
    ? await resolveLookup("categories", b.category)
    : null;

  const warehouseId = b.warehouse
    ? await resolveLookup("warehouses", b.warehouse)
    : null;

  const result = await query(
    `UPDATE products
     SET
       name = COALESCE($1,name),
       category_id = COALESCE($2,category_id),
       warehouse_id = COALESCE($3,warehouse_id),
       unit_price = COALESCE($4,unit_price),
       min_stock_alert = COALESCE($5,min_stock_alert),
       updated_at = NOW()
     WHERE id = $6
     RETURNING *`,
    [
      b.name ?? null,
      categoryId,
      warehouseId,
      b.unitPrice ?? null,
      b.minStockAlert ?? null,
      id,
    ]
  );

  res.status(200).json({
    success: true,
    message: "Product updated successfully.",
    data: toProductDto(result.rows[0]),
  });
}

// ==========================
// Soft Delete Product
// ==========================
export async function deactivate(
  req: Request,
  res: Response
) {
  const { id } = req.params;

  const existing = await query(
    `SELECT id
     FROM products
     WHERE id = $1`,
    [id]
  );

  if (existing.rows.length === 0) {
    throw AppError.notFound("Product not found");
  }

  await query(
    `UPDATE products
     SET
       is_active = FALSE,
       updated_at = NOW()
     WHERE id = $1`,
    [id]
  );

  res.status(200).json({
    success: true,
    message: "Product deactivated successfully.",
  });
}

export async function listCategories(
  _req: Request,
  res: Response
) {
  const result = await query(
    `SELECT name
     FROM categories
     ORDER BY name`
  );

  res.status(200).json({
    success: true,
    data: result.rows.map((r) => r.name),
  });
}

export async function listWarehouses(
  _req: Request,
  res: Response
) {
  const result = await query(
    `SELECT name
     FROM warehouses
     ORDER BY name`
  );

  res.status(200).json({
    success: true,
    data: result.rows.map((r) => r.name),
  });
}

function toProductDto(row: any) {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: row.category_name || null,
    warehouse: row.warehouse_name || null,
    unitPrice: row.unit_price,
    currentStock: row.current_stock,
    minStockAlert: row.min_stock_alert,
    isActive:
      row.is_active === undefined
        ? true
        : row.is_active,
  };
}

function toMovementDto(row: any) {
  return {
    id: row.id,
    productId: row.product_id,
    quantity: row.quantity,
    movementType: row.movement_type,
    reason: row.reason,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
  };
}