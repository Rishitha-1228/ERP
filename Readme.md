# VertexERP — Operations Portal

A full-stack ERP system for wholesale & distribution businesses — manage customers, products, inventory, and sales challans (delivery notes) in one place, with role-based dashboards for Admin, Sales, Warehouse, and Accounts teams.

**Live app:** https://erp-frontend-three-gamma.vercel.app
**Live API:** https://vertexerp-backend.onrender.com

---

## Features

- **Authentication** — JWT-based login with short-lived access tokens and automatic silent refresh (no forced re-login mid-session)
- **Role-based access control** — Admin, Sales, Warehouse, and Accounts each see a tailored dashboard and permission set
- **Customer management** — create, edit, activate/deactivate wholesale and retail customers
- **Product catalogue** — products with category, warehouse, pricing, and stock, with auto-created categories/warehouses on the fly
- **Inventory ledger** — every stock change (sale, restock, correction) is recorded in an auditable movements log, with quantity, reason, and who made the change
- **Sales challans (delivery notes)**
  - Draft → Confirm → Cancel workflow
  - Confirming a challan **atomically** reduces stock across all line items — the whole transaction rolls back if any item has insufficient stock
  - Product name, SKU, and price are **snapshotted** onto the challan at creation time, so historical challans stay accurate even if a product's price changes later
  - **PDF export** — download any challan as a formatted delivery challan PDF
- **Low-stock alerts** — dashboard surfaces products at or below their reorder threshold
- **Role-specific dashboards** — Admin sees business-wide stats (sales, revenue, inventory, users, pending orders, low stock); Sales sees today's sales/leads/quotes; Warehouse sees low stock/incoming stock/pending dispatch; Accounts sees revenue/outstanding invoices

## Tech Stack

**Backend:** Node.js, Express, TypeScript, PostgreSQL (raw `pg`, no ORM), Zod validation, JWT auth, Helmet, rate limiting, Morgan logging
**Frontend:** React, TypeScript, Vite, React Router, Axios
**Deployment:** Backend on Render, Frontend on Vercel

## Architecture Notes / Design Decisions

- **Raw SQL over an ORM** — chosen for full control over query shape and to make transactional stock logic (row locking, atomic multi-table writes) explicit and easy to reason about.
- **Row-level locking (`SELECT ... FOR UPDATE`) on stock updates** — prevents race conditions where two challans confirmed at the same moment could both read stale stock and oversell the same inventory.
- **Price/name/SKU snapshotting on challan line items** — a challan is a historical record; if a product's price changes after the fact, past challans must not silently change. Snapshotting at creation time preserves an accurate paper trail.
- **Stock movements as an append-only ledger** — every increase/decrease in stock is logged with a reason and the user who caused it, rather than only storing a running total. This gives a full audit trail, not just a current snapshot.
- **JWT access + refresh token pattern** — short-lived access tokens limit the exposure window if a token leaks, while a refresh flow (with request queueing during refresh) keeps the user experience seamless.

## Project Structure

```
ERP/
├── erp-backend/     # Express + TypeScript REST API, PostgreSQL, JWT auth
├── erp-frontend/     # React + TypeScript + Vite UI
└── screenshorts/     # Application screenshots
```

## Getting Started

### Prerequisites
- Node.js v18+
- PostgreSQL running locally or a connection string (e.g. from Render/Supabase/Neon)

### Backend setup
```bash
cd erp-backend
npm install
```

Create a `.env` file in `erp-backend`:
```
PORT=5000
DATABASE_URL=your_postgres_connection_string
JWT_SECRET=your_secret
JWT_REFRESH_SECRET=your_refresh_secret
FRONTEND_URL=http://localhost:5173
```

```bash
npm run dev
```

### Frontend setup
```bash
cd erp-frontend
npm install
```

Create a `.env` file in `erp-frontend`:
```
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev
```

Visit `http://localhost:5173`.

## Screenshots

See the `screenshorts/` folder for images of:
- Login / role-based welcome screen
- Dashboard (Admin view)
- Customers
- Products
- Inventory movements ledger
- Challan detail with PDF export

## API Overview

| Module | Base route | Notes |
|---|---|---|
| Auth | `/api/auth` | login, register, refresh |
| Users | `/api/users` | user management (Admin) |
| Customers | `/api/customers` | CRM |
| Products | `/api/products` | catalogue, categories, warehouses, low-stock |
| Inventory | `/api/inventory` | stock movement ledger |
| Challans | `/api/challans` | create/confirm/cancel, PDF export |
| Dashboard | `/api/dashboard` | role-based summary stats |

A Postman collection is included in the repo (`vertexerp-postman-collection.json`) for exploring the full API.

## Future Improvements

- Global search across customers/products/challans
- CSV/Excel export for reports
- Real-time notifications (e.g. low-stock, new challan) via WebSockets
- Multi-warehouse transfer tracking
- GST-compliant invoice generation

## Author

Rishitha Kaluvala