# Supabase setup for StoreLedger

## 1. Create project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **New project**
3. Name: `storeledger` (or any name)
4. Set a strong database password — **save it**
5. Choose a region close to you (e.g. Singapore / Mumbai if available)
6. Wait until the project is ready

## 2. Get connection strings

1. In the project, click **Connect**
2. Choose **ORMs → Prisma**
3. Copy:
   - **Transaction** pooler → `DATABASE_URL` (port **6543**, should include `pgbouncer=true`)
   - **Session** pooler → `DIRECT_URL` (port **5432**)

Example shape (yours will differ):

```
DATABASE_URL="postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

## 3. Local `.env`

Put both URLs into `inventory-app/.env` (keep your existing `AUTH_SECRET` / `NEXTAUTH_*`).

## 4. Push schema + seed

```powershell
cd inventory-app
$env:NODE_TLS_REJECT_UNAUTHORIZED="0"
npx prisma db push
npm run db:seed
```

Login after seed: `owner@store.pk` / `Store@123`

## 5. Vercel production

In [Vercel env settings](https://vercel.com/ali-zaidis-projects-6760b54c/retail-store/settings/environment-variables):

1. Set / update `DATABASE_URL` (Production + Preview)
2. Set / update `DIRECT_URL` (Production + Preview)
3. Redeploy the project

Without `DIRECT_URL`, Prisma migrate/`db push` from CI may fail; the app needs the pooled `DATABASE_URL` on Vercel.
