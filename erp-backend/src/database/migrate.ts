import { pool } from "../config/database";
import { logger } from "../utils/logger";

/**
 * Creates all 11 tables for the Mini ERP + CRM system, using raw SQL
 * (no ORM). Safe to re-run: every statement uses IF NOT EXISTS.
 */
const statements: string[] = [
  `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`, // for gen_random_uuid()

  // 1. users
  `CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN','SALES','WAREHOUSE','ACCOUNTS')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );`,

  // 2. refresh_tokens - lets logout / token rotation actually revoke a token
  `CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );`,

  // 3. customers
  `CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    email VARCHAR(150),
    business_name VARCHAR(150),
    gst_number VARCHAR(30),
    customer_type VARCHAR(20) NOT NULL DEFAULT 'RETAIL' CHECK (customer_type IN ('RETAIL','WHOLESALE','DISTRIBUTOR')),
    address TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'LEAD' CHECK (status IN ('LEAD','ACTIVE','INACTIVE')),
    follow_up_date TIMESTAMPTZ,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );`,

  // 4. follow_up_notes
  `CREATE TABLE IF NOT EXISTS follow_up_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );`,

  // 5. categories (lookup table for products)
  `CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL
  );`,

  // 6. warehouses (lookup table for products)
  `CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    location VARCHAR(150)
  );`,

  // 7. products
  `CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    category_id UUID REFERENCES categories(id),
    warehouse_id UUID REFERENCES warehouses(id),
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    current_stock INTEGER NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    min_stock_alert INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );`,

  // 8. stock_movements
  `CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    movement_type VARCHAR(10) NOT NULL CHECK (movement_type IN ('IN','OUT','ADJUST')),
    reason TEXT NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );`,

  // 9. challans
  `CREATE TABLE IF NOT EXISTS challans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challan_number VARCHAR(30) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    total_quantity INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(15) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','CONFIRMED','CANCELLED')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );`,

  // 10. challan_items - snapshots product name/sku/price at time of sale
  `CREATE TABLE IF NOT EXISTS challan_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challan_id UUID NOT NULL REFERENCES challans(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    product_name_snap VARCHAR(150) NOT NULL,
    product_sku_snap VARCHAR(50) NOT NULL,
    unit_price_snap NUMERIC(12,2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0)
  );`,

  // 11. payments - records money received against a customer's confirmed challans
  `CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    note TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );`,

  // Indexes for common lookups
  `CREATE INDEX IF NOT EXISTS idx_customers_name ON customers (name);`,
  `CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers (mobile);`,
  `CREATE INDEX IF NOT EXISTS idx_products_sku ON products (sku);`,
  `CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements (product_id);`,
  `CREATE INDEX IF NOT EXISTS idx_challans_status ON challans (status);`,
  `CREATE INDEX IF NOT EXISTS idx_challan_items_challan ON challan_items (challan_id);`,
  `CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments (customer_id);`,
];

async function migrate() {
  const client = await pool.connect();
  try {
    logger.info("Running migrations...");
    for (const sql of statements) {
      await client.query(sql);
    }
    logger.info("✅ All 11 tables created (or already existed).");
  } catch (err) {
    logger.error("Migration failed", { err });
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(() => process.exit(1));