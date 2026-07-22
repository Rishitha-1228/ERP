import { Request, Response } from "express";
import { query } from "../config/database";

export async function summary(req: Request, res: Response) {
  const role = req.user!.role;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  if (role === "ADMIN") {
    const [totalSales, revenue, totalProducts, totalUsers, pendingOrders] = await Promise.all([
      query(`SELECT COUNT(*)::int AS c FROM challans WHERE status = 'CONFIRMED'`),
      query(
        `SELECT COALESCE(SUM(ci.quantity),0)::int AS c FROM challan_items ci
         JOIN challans ch ON ch.id = ci.challan_id WHERE ch.status = 'CONFIRMED'`
      ),
      query(`SELECT COUNT(*)::int AS c FROM products`),
      query(`SELECT COUNT(*)::int AS c FROM users`),
      query(`SELECT COUNT(*)::int AS c FROM challans WHERE status = 'DRAFT'`),
    ]);
    return res.json({
      success: true,
      data: {
        cards: [
          { label: "Total Sales", value: totalSales.rows[0].c },
          { label: "Revenue (units shipped)", value: revenue.rows[0].c },
          { label: "Inventory (products)", value: totalProducts.rows[0].c },
          { label: "Users", value: totalUsers.rows[0].c },
          { label: "Pending Orders", value: pendingOrders.rows[0].c },
        ],
      },
    });
  }

  if (role === "SALES") {
    const [todaysSales, newLeads, pendingQuotes] = await Promise.all([
      query(`SELECT COUNT(*)::int AS c FROM challans WHERE status = 'CONFIRMED' AND created_at >= $1`, [
        startOfToday,
      ]),
      query(`SELECT COUNT(*)::int AS c FROM customers WHERE status = 'LEAD'`),
      query(`SELECT COUNT(*)::int AS c FROM challans WHERE status = 'DRAFT'`),
    ]);
    return res.json({
      success: true,
      data: {
        cards: [
          { label: "Today's Sales", value: todaysSales.rows[0].c },
          { label: "New Leads", value: newLeads.rows[0].c },
          { label: "Pending Quotes", value: pendingQuotes.rows[0].c },
        ],
      },
    });
  }

  if (role === "WAREHOUSE") {
    const [lowStock, incomingStock, pendingDispatch] = await Promise.all([
      query(`SELECT COUNT(*)::int AS c FROM products WHERE current_stock <= min_stock_alert`),
      query(`SELECT COUNT(*)::int AS c FROM stock_movements WHERE movement_type = 'IN' AND created_at >= $1`, [
        startOfToday,
      ]),
      query(`SELECT COUNT(*)::int AS c FROM challans WHERE status = 'DRAFT'`),
    ]);
    return res.json({
      success: true,
      data: {
        cards: [
          { label: "Low Stock Items", value: lowStock.rows[0].c },
          { label: "Incoming Stock (today)", value: incomingStock.rows[0].c },
          { label: "Pending Dispatch", value: pendingDispatch.rows[0].c },
        ],
      },
    });
  }

  // ACCOUNTS
  const [revenue, outstanding] = await Promise.all([
    query(
      `SELECT COALESCE(SUM(ci.quantity),0)::int AS c FROM challan_items ci
       JOIN challans ch ON ch.id = ci.challan_id WHERE ch.status = 'CONFIRMED'`
    ),
    query(`SELECT COUNT(*)::int AS c FROM challans WHERE status = 'CONFIRMED'`),
  ]);
  res.json({
    success: true,
    data: {
      cards: [
        { label: "Revenue (units shipped)", value: revenue.rows[0].c },
        { label: "Expenses", value: 0 },
        { label: "Outstanding Invoices", value: outstanding.rows[0].c },
      ],
    },
  });
}
