# Sofiyaa12 Store Scaffold

This repository contains a starter e-commerce store built with Next.js, TypeScript, Tailwind CSS, Prisma (Postgres), and Paystack payments. The scaffold includes:

- Prisma schema and seed to create 10 products × 5 color variants (inventory per variant).
- API routes: /api/products, /api/checkout, /api/webhook, /api/paystack/callback
- Paystack helper to initialize and verify transactions, and webhook verification
- Cart context (localStorage) and pages: index, product/[slug], cart
- Tailwind CSS configuration

Important environment variables (.env.local / Vercel):

- DATABASE_URL  (Postgres connection string)
- NEXT_PUBLIC_APP_URL  (https://your-vercel-domain or http://localhost:3000)
- PAYSTACK_SECRET_KEY
- PAYSTACK_PUBLIC_KEY

Local setup

1. Install dependencies

   npm install

2. Generate Prisma client and run migrations

   npx prisma generate
   npx prisma migrate dev --name init

3. Seed the database

   npx ts-node --transpile-only prisma/seed.ts

4. Run the dev server

   npm run dev

Vercel deployment

- Import this repo into Vercel.
- Add environment variables in Vercel Project Settings (DATABASE_URL, NEXT_PUBLIC_APP_URL, PAYSTACK_SECRET_KEY, PAYSTACK_PUBLIC_KEY).
- Set Paystack webhook URL to: https://<your-vercel-domain>/api/webhook and enable charge.success events.

Notes

- The scaffold uses optimistic order creation and decrements inventory when Paystack confirms payment via webhook or when the callback verifies success. For high concurrency, add inventory reservation/locking logic.
- Keep secret keys secure in Vercel environment variables.
