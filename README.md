# Sofiyaa12 Store Scaffold

This repository contains a starter e-commerce store built with Next.js, TypeScript, Tailwind CSS, Prisma (Postgres), and Paystack payments. The scaffold includes:

- Prisma schema and seed to create 10 products × 5 color variants (inventory per variant).
- Reservation-based inventory hold to avoid overselling: when a user starts checkout we create short-lived reservations tied to the order (15 minutes). Webhook/callback finalization decrements inventory and removes reservations; expired reservations are cleaned up.
- API routes: /api/products, /api/checkout, /api/webhook, /api/paystack/callback, /api/release-reservations
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
- Add environment variables in Vercel Project Settings (DATABASE_URL, NEXT_PUBLIC_APP_URL with your Vercel domain, PAYSTACK keys).
- Set Paystack webhook URL to: https://<your-vercel-domain>/api/webhook and enable charge.success events.

Reservation & cleanup notes

- Reservations hold inventory for a short TTL (15 minutes by default) while a customer completes payment.
- Expired reservations are deleted by the release endpoint (/api/release-reservations). You can call this endpoint from a cron job (Vercel Scheduled Functions or an external scheduler) every few minutes to keep inventory accurate.
- If a reservation expires and the order remains PENDING, the release endpoint marks the order FAILED (configurable cutoff).

Notes

- For high-concurrency scenarios prefer a stronger reservation system (e.g., Redis locks or immediate inventory decrement with compensation) but this model prevents most oversells.
- Keep secret keys secure in Vercel environment variables.
