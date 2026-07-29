import type { NextApiRequest, NextApiResponse } from 'next';
import getRawBody from 'raw-body';
import { verifyWebhookSignature, verifyTransaction } from '../../lib/paystack';
import prisma from '../../lib/prisma';

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const sig = req.headers['x-paystack-signature'] as string | undefined;
    const raw = (await getRawBody(req)).toString();
    if (!verifyWebhookSignature(raw, sig)) {
      return res.status(401).send('Invalid signature');
    }

    const event = JSON.parse(raw);
    if (event.event === 'charge.success') {
      const reference = event.data.reference;
      const metadataOrderId = event.data.metadata?.orderId;

      const verifyResp = await verifyTransaction(reference);
      if (!verifyResp || !verifyResp.status) {
        console.warn('Paystack verify failed for reference', reference);
        return res.status(400).send('verify-failed');
      }

      let order = null;
      if (metadataOrderId) {
        order = await prisma.order.findUnique({ where: { id: Number(metadataOrderId) }, include: { items: true } });
      } else {
        order = await prisma.order.findUnique({ where: { reference }, include: { items: true } });
      }
      if (!order) {
        console.warn('Order not found for webhook', metadataOrderId, reference);
        return res.status(404).send('order-not-found');
      }

      if (order.status === 'COMPLETED') return res.status(200).send('already-processed');

      await prisma.$transaction(
        order.items.map((it) =>
          prisma.variant.updateMany({ where: { id: it.variantId, inventory: { gte: it.quantity } }, data: { inventory: { decrement: it.quantity } } })
        )
      );

      await prisma.order.update({ where: { id: order.id }, data: { status: 'COMPLETED', reference } });
      return res.status(200).send('processed');
    }

    res.status(200).send('ignored');
  } catch (err: any) {
    console.error(err);
    res.status(500).send('error');
  }
}
