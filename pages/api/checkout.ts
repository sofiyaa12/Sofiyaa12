import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';
import { initializeTransaction } from '../../lib/paystack';

const RESERVATION_TTL_MINUTES = 15; // hold inventory for 15 minutes

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { items, email } = req.body as { items: Array<{ variantId: number; quantity: number }>; email: string };
    if (!items || !email) return res.status(400).json({ error: 'Missing items or email' });

    // cleanup expired reservations before checking availability
    await prisma.reservation.deleteMany({ where: { expiresAt: { lt: new Date() } } });

    // check availability and compute total
    let total = 0;
    const orderItemsData: any[] = [];

    for (const it of items) {
      const variant = await prisma.variant.findUnique({ where: { id: it.variantId } });
      if (!variant) return res.status(400).json({ error: 'Variant not found: ' + it.variantId });

      // sum active reservations for this variant
      const agg = await prisma.reservation.aggregate({ where: { variantId: it.variantId, expiresAt: { gt: new Date() } }, _sum: { quantity: true } });
      const reservedQty = agg._sum.quantity ?? 0;
      const available = variant.inventory - reservedQty;
      if (available < it.quantity) return res.status(400).json({ error: `Not enough inventory for variant ${it.variantId}. Available: ${available}` });

      total += variant.price * it.quantity;
      orderItemsData.push({ variantId: it.variantId, quantity: it.quantity, price: variant.price });
    }

    // create PENDING order and reservation entries tied to the order
    const order = await prisma.order.create({ data: { email, amount: total, status: 'PENDING', items: { create: orderItemsData } }, include: { items: true } });

    const expiresAt = new Date(Date.now() + RESERVATION_TTL_MINUTES * 60 * 1000);
    const reservations = items.map((it) => ({ variantId: it.variantId, quantity: it.quantity, expiresAt, orderId: order.id }));
    await prisma.reservation.createMany({ data: reservations });

    // Initialize Paystack transaction
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.VERCEL_URL}` || 'http://localhost:3000'}/api/paystack/callback`;
    const init = await initializeTransaction({ email, amount: total, callback_url: callbackUrl, metadata: { orderId: order.id } });

    if (!init || !init.status) {
      // cleanup: mark order failed and remove reservations
      await prisma.order.update({ where: { id: order.id }, data: { status: 'FAILED' } });
      await prisma.reservation.deleteMany({ where: { orderId: order.id } });
      return res.status(500).json({ error: 'Failed to initialize payment' });
    }

    if (init.data && init.data.reference) {
      await prisma.order.update({ where: { id: order.id }, data: { reference: init.data.reference } });
    }

    return res.status(200).json({ authorization_url: init.data.authorization_url });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
