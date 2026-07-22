import { PoolClient } from "pg";

/** Parses page/limit query params into safe integers with sane defaults/bounds. */
export function parsePagination(query: Record<string, unknown>) {
  const page = Math.max(1, parseInt(String(query.page ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? "10"), 10) || 10));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function buildMeta(total: number, page: number, limit: number) {
  return { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

/**
 * Generates a sequential, human-readable challan number per year,
 * e.g. CH-2026-00001. Must be called inside the same transaction that
 * creates the challan row, to avoid a race between the count and insert.
 */
export async function generateChallanNumber(client: PoolClient): Promise<string> {
  const year = new Date().getFullYear();
  const result = await client.query(
    `SELECT COUNT(*)::int AS count FROM challans WHERE challan_number LIKE $1`,
    [`CH-${year}-%`]
  );
  const next = String(result.rows[0].count + 1).padStart(5, "0");
  return `CH-${year}-${next}`;
}
