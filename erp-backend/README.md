# VertexERP Backend

Node.js + TypeScript + Express API for the Mini ERP + CRM Operations Portal,
using raw `pg` (node-postgres) — no ORM — with access + refresh JWT auth,
Winston logging, and rate limiting.

## Tech stack

- Express.js + TypeScript
- PostgreSQL via `pg` (raw SQL, connection pool, transactions with BEGIN/COMMIT/ROLLBACK)
- JWT access + refresh tokens (refresh tokens stored in DB so logout actually revokes them)
- Zod for request validation
- Winston for logging, `express-rate-limit` for rate limiting, Helmet for security headers

## Folder structure

```
backend/
├── src/
│   ├── server.ts                    Express app (CORS, rate limit, helmet)
│   ├── config/
│   │   └── database.ts              PostgreSQL pool + query/withTransaction helpers
│   ├── controllers/
│   │   ├── auth.controller.ts       Login, refresh, logout, getMe
│   │   ├── user.controller.ts       Full CRUD + password reset
│   │   ├── customer.controller.ts   CRM + follow-up notes
│   │   ├── product.controller.ts    Products + categories + warehouses
│   │   ├── inventory.controller.ts  Stock movements (IN/OUT/ADJUST)
│   │   ├── challan.controller.ts    Sales challan + stock deduction on confirm
│   │   └── dashboard.controller.ts  KPI stats for all roles
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── customer.routes.ts
│   │   ├── product.routes.ts
│   │   ├── inventory.routes.ts
│   │   ├── challan.routes.ts
│   │   └── dashboard.routes.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts       JWT verify + role-based guard
│   │   ├── errorHandler.ts
│   │   ├── notFound.ts
│   │   └── validate.ts
│   ├── database/
│   │   ├── migrate.ts               Creates all 10 tables
│   │   ├── seed.ts                  Seeds users, products, customers
│   │   └── reset.ts                 Drops all tables
│   └── utils/
│       ├── jwt.ts                   Access + refresh token utils
│       ├── logger.ts                Winston logger
│       ├── AppError.ts              Custom error class
│       └── helpers.ts               Pagination, challan number gen
├── docker-compose.yml               Local PostgreSQL
├── package.json
├── tsconfig.json
└── README.md
```

## Database (10 tables)

`users`, `refresh_tokens`, `customers`, `follow_up_notes`, `categories`,
`warehouses`, `products`, `stock_movements`, `challans`, `challan_items`.

Key rules:
- Stock can never go negative — `inventory.controller.ts` and
  `challan.controller.ts` both lock the product row (`SELECT ... FOR UPDATE`)
  inside a transaction, check the resulting stock, and roll back the whole
  transaction with a 400 error if it would go below zero.
- Challan line items snapshot the product's name/SKU/price at the time of
  sale (`product_name_snap`, `product_sku_snap`, `unit_price_snap`), so a
  later price or name change doesn't rewrite history.
- Refresh tokens are stored in the `refresh_tokens` table so `/auth/logout`
  and token rotation on `/auth/refresh` can actually revoke a token, not
  just rely on it expiring.

## Setup

### 1. Start PostgreSQL
```bash
docker compose up -d
```

### 2. Configure environment
```bash
cp .env.example .env
# edit DB_PASSWORD, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
```

### 3. Install, migrate, seed
```bash
npm install
npm run db:migrate
npm run db:seed
```

### 4. Run
```bash
npm run dev        # http://localhost:5000
```

## Test logins (from seed)

| Role       | Email               | Password       |
|------------|----------------------|----------------|
| Admin      | admin@erp.test       | Password123!   |
| Sales      | sales@erp.test       | Password123!   |
| Warehouse  | warehouse@erp.test   | Password123!   |
| Accounts   | accounts@erp.test    | Password123!   |

## API summary

| Method | Route                       | Roles                     |
|--------|-------------------------------|----------------------------|
| POST   | /api/auth/login                | Public                     |
| POST   | /api/auth/refresh               | Public (valid refresh token) |
| POST   | /api/auth/logout                | Public                     |
| GET    | /api/auth/me                    | Any logged-in user         |
| GET/POST/PUT | /api/users                | Admin                      |
| POST   | /api/users/:id/reset-password    | Admin                      |
| GET/POST/PUT | /api/customers            | Admin, Sales (write); any (read) |
| POST   | /api/customers/:id/notes         | Admin, Sales               |
| GET/POST/PUT | /api/products             | Admin, Warehouse (write); any (read) |
| GET    | /api/products/categories         | Any logged-in user         |
| GET    | /api/products/warehouses         | Any logged-in user         |
| GET/POST | /api/inventory                | Admin, Warehouse (write); any (read) |
| GET/POST | /api/challans                  | Admin, Sales (write); any (read) |
| POST   | /api/challans/:id/confirm        | Admin, Sales, Warehouse    |
| POST   | /api/challans/:id/cancel         | Admin, Sales, Warehouse    |
| GET    | /api/dashboard/summary           | Any logged-in user         |

This matches the frontend at `erp-frontend/src/api/*.ts` exactly — no
adjustments should be needed on either side.

## Known limitations

- No automated test suite (unit/integration) — noted as a next step.
- `ADJUST` movement type is treated as a straightforward add; a more
  complete implementation might support setting an absolute count.
- No file/PDF export or S3 upload (bonus items, not implemented).
