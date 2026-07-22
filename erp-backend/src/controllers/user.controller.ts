import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { query } from "../config/database";
import { AppError } from "../utils/AppError";
import { parsePagination, buildMeta } from "../utils/helpers";

export async function list(req: Request, res: Response) {
  const { page, limit, offset } = parsePagination(req.query);
  const search = (req.query.search as string) || "";

  const where = search ? `WHERE name ILIKE $1 OR email ILIKE $1` : "";
  const params = search ? [`%${search}%`] : [];

  const totalRes = await query(`SELECT COUNT(*)::int AS count FROM users ${where}`, params);
  const dataRes = await query(
    `SELECT id, name, email, role, is_active, created_at FROM users ${where}
     ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  res.status(200).json({
    success: true,
    data: dataRes.rows.map(toUserDto),
    meta: buildMeta(totalRes.rows[0].count, page, limit),
  });
}

export async function create(req: Request, res: Response) {
  const { name, email, password, role } = req.body;

  const existing = await query(`SELECT id FROM users WHERE email = $1`, [email]);
  if (existing.rows.length > 0) throw AppError.conflict("A user with this email already exists");

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, is_active, created_at`,
    [name, email, passwordHash, role]
  );

  res.status(201).json({ success: true, data: toUserDto(result.rows[0]) });
}

export async function update(req: Request, res: Response) {
  const { id } = req.params;
  const { name, role, isActive } = req.body;

  const existing = await query(`SELECT id FROM users WHERE id = $1`, [id]);
  if (existing.rows.length === 0) throw AppError.notFound("User not found");

  const result = await query(
    `UPDATE users SET
       name = COALESCE($1, name),
       role = COALESCE($2, role),
       is_active = COALESCE($3, is_active),
       updated_at = now()
     WHERE id = $4
     RETURNING id, name, email, role, is_active, created_at`,
    [name ?? null, role ?? null, isActive ?? null, id]
  );

  res.status(200).json({ success: true, data: toUserDto(result.rows[0]) });
}

export async function resetPassword(req: Request, res: Response) {
  const { id } = req.params;
  const { newPassword } = req.body;

  const existing = await query(`SELECT id FROM users WHERE id = $1`, [id]);
  if (existing.rows.length === 0) throw AppError.notFound("User not found");

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await query(`UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2`, [
    passwordHash,
    id,
  ]);

  res.status(200).json({ success: true, message: "Password reset successfully" });
}

function toUserDto(row: any) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}
