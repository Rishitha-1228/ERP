# VertexERP Frontend

React + TypeScript + Vite frontend for the Mini ERP + CRM Operations Portal,
built to match a backend with this shape:

```
backend/src/controllers/
  auth.controller.ts       -> Login, refresh, logout, getMe
  user.controller.ts       -> Full CRUD + password reset
  customer.controller.ts   -> CRM + follow-up notes
  product.controller.ts    -> Products + categories + warehouses
  inventory.controller.ts  -> Stock movements (IN/OUT/ADJUST)
  challan.controller.ts    -> Sales challan + stock deduction on confirm
  dashboard.controller.ts  -> KPI stats for all roles
```

## Design direction

"Operations ledger" — ledger-navy + manifest-amber palette, IBM Plex Mono
for data (SKUs, challan numbers, stock quantities, timestamps), Space
Grotesk for headings/UI, Inter for body text. The sidebar uses ERP-style
module codes (`DSH`, `CRM`, `PRD`, `INV`, `SLS`, `USR`) instead of generic
icons. The "manifest tag" chip (perforated-edge badge) is the signature
element — used for the logged-in user/role badge and for challan numbers.

## IMPORTANT — API assumptions to verify against your actual backend

I do not have your actual route/controller code, only the file list you
shared. I built the API layer (`src/api/*.ts`) against these assumed REST
conventions. **Check each against your real routes and adjust the `api/*.ts`
files if anything differs:**

| Frontend calls                         | Assumed backend route                          |
|-----------------------------------------|--------------------------------------------------|
| `loginRequest`                          | `POST /api/auth/login` -> `{ accessToken, refreshToken, user }` |
| token refresh (in `api/client.ts`)      | `POST /api/auth/refresh` -> `{ accessToken, refreshToken }` |
| `logoutRequest`                         | `POST /api/auth/logout` `{ refreshToken }`        |
| `getMe`                                 | `GET /api/auth/me`                                |
| `fetchUsers` / `createUser` / `updateUser` | `GET/POST/PUT /api/users`                     |
| `resetUserPassword`                     | `POST /api/users/:id/reset-password`             |
| `fetchCustomers` / `createCustomer` / `updateCustomer` | `GET/POST/PUT /api/customers`     |
| `addFollowUpNote`                       | `POST /api/customers/:id/notes`                   |
| `fetchProducts` / `createProduct` / `updateProduct` | `GET/POST/PUT /api/products`       |
| `fetchCategories` / `fetchWarehouses`   | `GET /api/products/categories`, `/api/products/warehouses` |
| `fetchStockMovements` / `createStockMovement` | `GET/POST /api/inventory`                  |
| `fetchChallans` / `fetchChallanById` / `createChallan` | `GET/POST /api/challans`, `GET /api/challans/:id` |
| `confirmChallan` / `cancelChallan`      | `POST /api/challans/:id/confirm`, `/cancel`      |
| `getDashboardSummary`                   | `GET /api/dashboard/summary` -> `{ cards: [{label, value}] }` |

All list endpoints are assumed to return:
```json
{ "success": true, "data": [...], "meta": { "total": 0, "page": 1, "limit": 10, "totalPages": 0 } }
```
and single-resource endpoints:
```json
{ "success": true, "data": { ... } }
```

If your backend's response shape or field names differ (e.g. `customerName`
vs a nested `customer: { name }` object), the quickest fix is either to
adjust the corresponding `api/*.ts` file to reshape the response, or add
`customerName`/`productName` etc. as flat fields in your SQL `SELECT`/joins
so the frontend types line up as-is.

## Setup

```bash
cp .env.example .env      # point VITE_API_URL at your backend
npm install
npm run dev                # http://localhost:5173
```
