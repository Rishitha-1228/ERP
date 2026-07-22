import { pool } from "../config/database";
import { logger } from "../utils/logger";

/** Drops all 10 tables in dependency order. Destructive — local/dev use only. */
async function reset() {
  const client = await pool.connect();
  try {
    logger.warn("Dropping all tables...");
    await client.query(`
      DROP TABLE IF EXISTS challan_items CASCADE;
      DROP TABLE IF EXISTS challans CASCADE;
      DROP TABLE IF EXISTS stock_movements CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
      DROP TABLE IF EXISTS warehouses CASCADE;
      DROP TABLE IF EXISTS categories CASCADE;
      DROP TABLE IF EXISTS follow_up_notes CASCADE;
      DROP TABLE IF EXISTS customers CASCADE;
      DROP TABLE IF EXISTS refresh_tokens CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);
    logger.info("✅ All tables dropped. Run 'npm run db:migrate' to recreate them.");
  } finally {
    client.release();
    await pool.end();
  }
}

reset().catch(() => process.exit(1));
