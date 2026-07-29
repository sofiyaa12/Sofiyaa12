import crypto from 'crypto';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || '';

export async function initializeTransaction({ email, amount, callback_url, metadata }: { email: string; amount: number; callback_url: string; metadata?: any; }) {
  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, amount, callback_url, metadata })
  });
  return res.json();
}

export async function verifyTransaction(reference: string) {
  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
  });
  return res.json();
}

export function verifyWebhookSignature(rawBody: string | Buffer, signature: string | undefined) {
  const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(Buffer.from(rawBody as any)).digest('hex');
  return signature === hash;
}
