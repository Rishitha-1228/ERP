import bcrypt from "bcryptjs";
import { pool } from "../config/database";
import { logger } from "../utils/logger";

async function seed() {
  const client = await pool.connect();
  try {
    const passwordHash = await bcrypt.hash("Password123!", 10);

    // --- Users: one per role ---
    const users = [
      { name: "Admin User", email: "admin@erp.test", role: "ADMIN" },
      { name: "Sales User", email: "sales@erp.test", role: "SALES" },
      { name: "Warehouse User", email: "warehouse@erp.test", role: "WAREHOUSE" },
      { name: "Accounts User", email: "accounts@erp.test", role: "ACCOUNTS" },
    ];

    const userIds: Record<string, string> = {};
    for (const u of users) {
      const res = await client.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, role`,
        [u.name, u.email, passwordHash, u.role]
      );
      userIds[u.role] = res.rows[0].id;
    }

    // --- Categories & warehouses ---
    const categoryRes = await client.query(
      `INSERT INTO categories (name) VALUES ('Hardware'), ('Electrical')
       ON CONFLICT (name) DO NOTHING RETURNING id, name`
    );
    const hardwareCat = (
      await client.query(`SELECT id FROM categories WHERE name = 'Hardware'`)
    ).rows[0].id;

    const warehouseRes = await client.query(
      `INSERT INTO warehouses (name, location) VALUES ('Warehouse A', 'Rack 3')
       ON CONFLICT (name) DO NOTHING RETURNING id`
    );
    const warehouseA = (
      await client.query(`SELECT id FROM warehouses WHERE name = 'Warehouse A'`)
    ).rows[0].id;

    // --- Sample product ---
    await client.query(
      `INSERT INTO products (name, sku, category_id, warehouse_id, unit_price, current_stock, min_stock_alert)
       VALUES ('Steel Bolt 10mm', 'SB-10MM', $1, $2, 5.50, 500, 50)
       ON CONFLICT (sku) DO NOTHING`,
      [hardwareCat, warehouseA]
    );

    // --- Sample customer ---
    await client.query(
      `INSERT INTO customers (name, mobile, email, business_name, customer_type, status, address, created_by)
       VALUES ('Ravi Traders', '9876543210', 'ravi@traders.com', 'Ravi Traders Pvt Ltd', 'WHOLESALE', 'ACTIVE', 'MG Road, Hyderabad', $1)
       ON CONFLICT DO NOTHING`,
      [userIds.SALES]
    );

    logger.info("✅ Seed complete.");
    logger.info("Test logins (password: Password123!):");
    users.forEach((u) => logger.info(`  ${u.role.padEnd(10)} ${u.email}`));
  } catch (err) {
    logger.error("Seed failed", { err });
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(() => process.exit(1));
