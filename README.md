# StoreLedger — Inventory & Business Management

Production-ready inventory, sales, expenses, and profit tracking for a single retail store in Pakistan. Built with Next.js (App Router), Prisma, PostgreSQL, NextAuth, and Tailwind CSS.

All money values are shown in PKR (e.g. `Rs. 125,000`).

## Stack

- **Next.js 16** (App Router, Server Actions, TypeScript)
- **Prisma** + **PostgreSQL**
- **NextAuth v5** (Auth.js) — email/password for the store owner
- **react-hook-form** + **zod**
- **Recharts** for dashboard charts
- **Tailwind CSS 4** + shadcn-style UI
- **jsPDF** / **xlsx** for report exports

## Prerequisites

- Node.js 20+
- A PostgreSQL database — **Supabase (free)** recommended for production, or Docker/local for development

## Quick start

### 1. Install dependencies

```bash
cd inventory-app
npm install
```

If `prisma generate` fails with an SSL certificate error (common on some Windows networks), run:

```bash
# PowerShell
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"
npx prisma generate
```

### 2. Environment

```bash
cp .env.example .env
```

Required variables:

```
DATABASE_URL="..."
DIRECT_URL="..."
NEXTAUTH_SECRET="change-me-to-a-long-random-secret-key-at-least-32-chars"
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="change-me-to-a-long-random-secret-key-at-least-32-chars"
```

Change `AUTH_SECRET` / `NEXTAUTH_SECRET` before any real deployment.

### 3. Database — Supabase (recommended)

1. Create a free project at [https://supabase.com](https://supabase.com)
2. Open **Project Settings → Database** (or **Connect**)
3. Copy the **Prisma** connection strings:
   - **Transaction pooler** (port `6543`) → `DATABASE_URL` (append `?pgbouncer=true` if missing)
   - **Session pooler** (port `5432`) → `DIRECT_URL`
4. Paste both into `.env` and into **Vercel → Project → Settings → Environment Variables**
5. Then run schema + seed (step 4)

See also: [Supabase + Prisma docs](https://supabase.com/docs/guides/database/prisma)

**Local alternative — Docker**

```bash
docker compose up -d
```

Use the local URLs from `.env.example` for both `DATABASE_URL` and `DIRECT_URL`.

### 4. Schema + seed

```bash
npm run db:push
npm run db:seed
```

Or in one step:

```bash
npm run setup
```

To apply the checked-in migration instead of `db push`:

```bash
npm run db:migrate
npm run db:seed
```

Seed login:

| Field    | Value            |
|----------|------------------|
| Email    | `owner@store.pk` |
| Password | `Store@123`      |

Also seeds sample Pakistani store settings, categories, suppliers, products, sales, expenses, and stock movements.

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to login.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | Start production server |
| `npm run setup` | Generate client, push schema, seed |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Apply migrations (`migrate deploy`) |
| `npm run db:migrate:dev` | Create/apply migrations in development |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio |

## Modules

1. **Authentication** — single-owner login, protected routes, forgot/reset password
2. **Products & inventory** — CRUD, categories, low-stock alerts, stock IN/OUT, CSV/Excel import
3. **Sales** — quick multi-item sale, discounts, cash/card/online, auto stock deduction, history filters
4. **Expenses** — categories, recurring flag, optional receipt URL, pie chart breakdown
5. **Profit & loss** — daily / monthly / yearly / custom; gross vs net; loss alerts
6. **Dashboard** — today’s sales, expenses, profit/loss, stock value; 30-day charts; top products; low stock; recent activity
7. **Reports** — PDF / Excel export and printable summaries
8. **Suppliers** — contacts, amount owed, linked products
9. **Settings** — store name/logo/address, PKR currency, tax/GST, change password

## Project structure

```
prisma/
  schema.prisma
  seed.ts
  migrations/
src/
  app/
    (auth)/          login, forgot-password, reset-password
    (dashboard)/     dashboard, products, sales, expenses, reports, …
    api/auth/        NextAuth route handlers
  components/
    ui/              shadcn-style primitives
    layout/          sidebar, header, app-shell
  lib/
    actions/         Server Actions
    validations/     Zod schemas
    auth.ts
    prisma.ts
    currency.ts
middleware.ts        Route protection
```

## Notes

- Forgot-password shows a reset link in the UI for local/dev use (no email provider configured).
- After a product is created, quantity changes go through **Stock IN/OUT**, not the edit form.
- Bulk import columns: `name`, `sku`, `category`, `purchasePrice`, `sellingPrice`, `quantity`, `reorderLevel`, `unit`, `supplier`, `barcode`.

## License

Private — for your store use.
