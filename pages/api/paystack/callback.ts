import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';
import { verifyTransaction } from '../../lib/paystack';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const reference = req.query.reference as string | undefined;
  if (!reference) return res.redirect('/cart');

  try {
    const verifyResp = await verifyTransaction(reference);
    if (!verifyResp || !verifyResp.status || !verifyResp.data) return res.redirect('/cart');

    const metadataOrderId = verifyResp.data.metadata?.orderId;
    if (!metadataOrderId) return res.redirect('/cart');

    const order = await prisma.order.findUnique({ where: { id: Number(metadataOrderId) }, include: { items: true } });
    if (!order) return res.redirect('/cart');

    if (verifyResp.data.status === 'success') {
      if (order.status !== 'COMPLETED') {
        await prisma.$transaction(
          order.items.map((it) =>
            prisma.variant.updateMany({ where: { id: it.variantId, inventory: { gte: it.quantity } }, data: { inventory: { decrement: it.quantity } } })
          )
        );
        await prisma.order.update({ where: { id: order.id }, data: { status: 'COMPLETED', reference } });
      }
      return res.redirect('/success');
    } else {
      await prisma.order.update({ where: { id: order.id }, data: { status: 'FAILED' } });
      return res.redirect('/cart?payment=failed');
    }
  } catch (err) {
    console.error(err);
    return res.redirect('/cart');
  }
}
