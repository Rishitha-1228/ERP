# VertexERP — Mini ERP + CRM Operations Portal

Case study submission — Fundsroom Full Stack Developer Round 1.

---

## 1. Links

| Item | URL |
|---|---|
| GitHub repository | https://github.com/Rishitha-1228/ERP |
| Live frontend | https://erp-frontend-three-gamma.vercel.app |
| Live backend API | https://vertexerp-backend.onrender.com/api |
| Backend health check | https://vertexerp-backend.onrender.com/health |

> Note: the free Render instance spins down after inactivity, so the **first**
> request after a period of no traffic can take 30–50 seconds to respond
> while it wakes back up. This is expected — just wait for it once.

---

## 2. Test Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@erp.test | Password123! |
| Sales | sales@erp.test | Password123! |
| Warehouse | warehouse@erp.test | Password123! |
| Accounts | accounts@erp.test | Password123! |

**Important:** on the login screen, click the role card that matches the
account (Admin / Sales / Warehouse / Accounts) before signing in — the
backend validates that the selected role matches the account's actual role,
and will reject the login otherwise as an extra safety check.

New accounts can also self-register from the "Create Account" tab, for the
Sales, Warehouse, and Accounts roles (Admin accounts are not self-serviceable
by design — see Known Limitations).

---

## 3. API Documentation

A full Postman collection covering every endpoint (auth, users, customers,
products, inventory, challans, dashboard) is included:
[`vertexerp-postman-collection.json`](./vertexerp-postman-collection.json)

Import it into Postman, set the `baseUrl` variable if needed (it already
defaults to the live Render URL), run **Auth → Login (Admin)** first, then
copy the returned `accessToken` into the `accessToken` collection variable
to authenticate subsequent requests.

### Endpoint summary

| Method | Route | Roles |
|---|---|---|
| POST | /auth/login | Public |
| POST | /auth/register | Public (Sales/Warehouse/Accounts only) |
| POST | /auth/refresh | Public (valid refresh token) |
| POST | /auth/logout | Public |
| GET | /auth/me | Any logged-in user |
| GET/POST/PUT | /users | Admin |
| POST | /users/:id/reset-password | Admin |
| GET/POST/PUT | /customers | Read: any; Write: Admin, Sales |
| POST | /customers/:id/notes | Admin, Sales |
| GET/POST/PUT | /products | Read: any; Write: Admin, Warehouse |
| GET | /products/categories, /products/warehouses | Any logged-in user |
| GET/POST | /inventory | Read: any; Write: Admin, Warehouse |
| GET/POST | /challans | Read: any; Write: Admin, Sales |
| POST | /challans/:id/confirm, /:id/cancel | Admin, Sales, Warehouse |
| GET | /dashboard/summary | Any logged-in user |

---

## 4. Architecture

**Backend:** Node.js + TypeScript + Express, using raw `pg` (node-postgres) —
no ORM — against a Supabase-hosted PostgreSQL database. Auth uses JWT access
+ refresh tokens, with refresh tokens stored server-side (`refresh_tokens`
table) so logout and token rotation can actually revoke them, not just rely
on expiry. Routes are organized by domain (`auth`, `users`, `customers`,
`products`, `inventory`, `challans`, `dashboard`), each split into
`routes → controller → raw SQL queries`. All stock-affecting operations
(direct stock adjustments, challan confirm/cancel) run inside a Postgres
transaction with row locking (`SELECT ... FOR UPDATE`), so stock can never go
negative even under concurrent requests, and a failed step rolls back the
whole operation.

**Frontend:** React + TypeScript + Vite. One shared dashboard layout renders
different sidebar menus and dashboard KPI cards depending on the logged-in
user's role, driven by a single `roleMenus.ts` config rather than four
separate dashboard implementations. Role-based page access is enforced twice:
visually (role-specific sidebar links) and functionally (a route guard that
redirects to an "Access Denied" page if a role navigates directly to a URL
it isn't permitted to use).

**Deployment:** backend on Render (free tier, Node web service), frontend on
Vercel (static/Vite build with an SPA rewrite so client-side routes like
`/dashboard` or `/customers/:id` don't 404 on direct navigation or refresh),
database on Supabase (managed PostgreSQL).

---

## 5. Local Setup

See `erp-backend/README.md` and `erp-frontend/README.md` for full local
setup instructions (env vars, migration, seeding, running both sides
locally). Quick version:

```bash
# Backend
cd erp-backend
cp .env.example .env   # fill in your own Postgres connection details
npm install
npm run db:migrate
npm run db:seed
npm run dev             # http://localhost:5000

# Frontend
cd erp-frontend
cp .env.example .env    # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev              # http://localhost:5173
```

---

## 6. Known Limitations / Incomplete Parts

- No automated test suite (unit/integration tests) — next step if this
  moves forward.
- Bonus items from the brief — Docker Compose (included for local Postgres
  only, not full containerization), GitHub Actions CI/CD, PDF invoice
  export, and S3 image upload — are not implemented.
- Self-registration intentionally excludes the Admin role; the only Admin
  account is the seeded one. A production system would likely gate Admin
  creation behind an invite/approval flow instead of open self-signup for
  any role at all.
- `ADJUST` stock movement type behaves as a straightforward increase, not a
  "set absolute count" operation.
- The free hosting tiers (Render + Supabase + Vercel) mean the backend can
  take 30–50 seconds to respond on the very first request after a period of
  inactivity, as noted above.
