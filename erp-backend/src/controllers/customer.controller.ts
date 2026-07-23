import { Request, Response } from "express";
import { query } from "../config/database";
import { AppError } from "../utils/AppError";
import { parsePagination, buildMeta } from "../utils/helpers";

export async function list(req: Request, res: Response) {
  const { page, limit, offset } = parsePagination(req.query);
  const search = (req.query.search as string) || "";
  const status = (req.query.status as string) || "";

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(
      `(name ILIKE $${params.length} OR mobile ILIKE $${params.length} OR business_name ILIKE $${params.length})`
    );
  }

  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const totalRes = await query(
    `SELECT COUNT(*)::int AS count FROM customers ${where}`,
    params
  );

  const dataRes = await query(
    `SELECT c.*, u.name AS created_by_name
     FROM customers c
     LEFT JOIN users u ON u.id = c.created_by
     ${where}
     ORDER BY c.created_at DESC
     LIMIT $${params.length + 1}
     OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  res.status(200).json({
    success: true,
    data: dataRes.rows.map(toCustomerDto),
    meta: buildMeta(totalRes.rows[0].count, page, limit),
  });
}

export async function getById(req: Request, res: Response) {
  const { id } = req.params;

  const customerRes = await query(
    `SELECT c.*, u.name AS created_by_name
     FROM customers c
     LEFT JOIN users u ON u.id = c.created_by
     WHERE c.id = $1`,
    [id]
  );

  const customer = customerRes.rows[0];

  if (!customer) {
    throw AppError.notFound("Customer not found");
  }

  const notesRes = await query(
    `SELECT n.*, u.name AS created_by_name
     FROM follow_up_notes n
     LEFT JOIN users u ON u.id = n.created_by
     WHERE n.customer_id = $1
     ORDER BY n.created_at DESC`,
    [id]
  );

  const totalBilledRes = await query(
    `SELECT COALESCE(SUM(ci.unit_price_snap * ci.quantity), 0)::numeric AS total
     FROM challans ch
     JOIN challan_items ci ON ci.challan_id = ch.id
     WHERE ch.customer_id = $1 AND ch.status = 'CONFIRMED'`,
    [id]
  );

  const totalPaidRes = await query(
    `SELECT COALESCE(SUM(amount), 0)::numeric AS total
     FROM payments
     WHERE customer_id = $1`,
    [id]
  );

  const paymentsRes = await query(
    `SELECT p.*, u.name AS created_by_name
     FROM payments p
     LEFT JOIN users u ON u.id = p.created_by
     WHERE p.customer_id = $1
     ORDER BY p.payment_date DESC`,
    [id]
  );

  const totalBilled = Number(totalBilledRes.rows[0].total);
  const totalPaid = Number(totalPaidRes.rows[0].total);

  res.status(200).json({
    success: true,
    data: {
      ...toCustomerDto(customer),
      followUpNotes: notesRes.rows.map(toNoteDto),
      totalBilled,
      totalPaid,
      outstandingBalance: totalBilled - totalPaid,
      payments: paymentsRes.rows.map(toPaymentDto),
    },
  });
}



export async function create(req: Request, res: Response) {
  const b = req.body;

  const result = await query(
    `INSERT INTO customers
    (
      name,
      mobile,
      email,
      business_name,
      gst_number,
      customer_type,
      address,
      status,
      follow_up_date,
      notes,
      created_by
    )
    VALUES
    ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING *`,
    [
      b.name,
      b.mobile,
      b.email || null,
      b.businessName || null,
      b.gstNumber || null,
      b.customerType || "RETAIL",
      b.address || null,
      b.status || "LEAD",
      b.followUpDate || null,
      b.notes || null,
      req.user!.id,
    ]
  );

  res.status(201).json({
    success: true,
    message: "Customer created successfully.",
    data: toCustomerDto(result.rows[0]),
  });
}

export async function update(req: Request, res: Response) {
  const { id } = req.params;
  const b = req.body;

  const existing = await query(
    `SELECT id FROM customers WHERE id = $1`,
    [id]
  );

  if (existing.rows.length === 0) {
    throw AppError.notFound("Customer not found");
  }

  const result = await query(
    `UPDATE customers
     SET
       name = COALESCE($1, name),
       mobile = COALESCE($2, mobile),
       email = COALESCE($3, email),
       business_name = COALESCE($4, business_name),
       gst_number = COALESCE($5, gst_number),
       customer_type = COALESCE($6, customer_type),
       address = COALESCE($7, address),
       status = COALESCE($8, status),
       follow_up_date = COALESCE($9, follow_up_date),
       notes = COALESCE($10, notes),
       updated_at = NOW()
     WHERE id = $11
     RETURNING *`,
    [
      b.name ?? null,
      b.mobile ?? null,
      b.email ?? null,
      b.businessName ?? null,
      b.gstNumber ?? null,
      b.customerType ?? null,
      b.address ?? null,
      b.status ?? null,
      b.followUpDate ?? null,
      b.notes ?? null,
      id,
    ]
  );

  res.status(200).json({
    success: true,
    message: "Customer updated successfully.",
    data: toCustomerDto(result.rows[0]),
  });
}

export async function deactivate(req: Request, res: Response) {
  const { id } = req.params;

  const existing = await query(
    `SELECT id,status
     FROM customers
     WHERE id = $1`,
    [id]
  );

  if (existing.rows.length === 0) {
    throw AppError.notFound("Customer not found");
  }

  await query(
    `UPDATE customers
     SET
       status='INACTIVE',
       updated_at=NOW()
     WHERE id=$1`,
    [id]
  );

  res.status(200).json({
    success: true,
    message: "Customer deactivated successfully.",
  });
}

export async function addNote(req: Request, res: Response) {
  const { id } = req.params;
  const { note } = req.body;

  const existing = await query(
    `SELECT id FROM customers WHERE id=$1`,
    [id]
  );

  if (existing.rows.length === 0) {
    throw AppError.notFound("Customer not found");
  }

  const result = await query(
    `INSERT INTO follow_up_notes
    (customer_id,note,created_by)
    VALUES($1,$2,$3)
    RETURNING *`,
    [id, note, req.user!.id]
  );

  res.status(201).json({
    success: true,
    data: toNoteDto(result.rows[0]),
  });
}
export async function addPayment(req: Request, res: Response) {
  const { id } = req.params;
  const { amount, note, paymentDate } = req.body;

  const existing = await query(
    `SELECT id FROM customers WHERE id=$1`,
    [id]
  );

  if (existing.rows.length === 0) {
    throw AppError.notFound("Customer not found");
  }

  const result = await query(
    `INSERT INTO payments
    (customer_id, amount, payment_date, note, created_by)
    VALUES($1,$2,COALESCE($3, now()),$4,$5)
    RETURNING *`,
    [id, amount, paymentDate || null, note || null, req.user!.id]
  );

  res.status(201).json({
    success: true,
    message: "Payment recorded successfully.",
    data: toPaymentDto(result.rows[0]),
  });
}
function toCustomerDto(row: any) {
  return {
    id: row.id,
    name: row.name,
    mobile: row.mobile,
    email: row.email,
    businessName: row.business_name,
    gstNumber: row.gst_number,
    customerType: row.customer_type,
    address: row.address,
    status: row.status,
    followUpDate: row.follow_up_date,
    notes: row.notes,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
  };
}

function toNoteDto(row: any) {
  return {
    id: row.id,
    note: row.note,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
  };
}
function toPaymentDto(row: any) {
  return {
    id: row.id,
    amount: Number(row.amount),
    paymentDate: row.payment_date,
    note: row.note,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
  };
}