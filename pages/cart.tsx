import { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useRouter } from 'next/router';

export default function CartPage() {
  const { items, clear } = useCart();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const checkout = async () => {
    if (!email) return alert('Enter email for receipt');
    setLoading(true);
    const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })), email }) });
    const data = await res.json();
    setLoading(false);
    if (data.authorization_url) {
      window.location.href = data.authorization_url;
    } else {
      alert('Checkout initialization failed: ' + (data.error||'unknown'));
    }
  };

  const total = items.reduce((s, i) => s + (i.price || 0) * i.quantity, 0);

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Cart</h1>
      {items.length === 0 ? <p>Your cart is empty</p> : (
        <>
          <ul>
            {items.map((it) => (
              <li key={it.variantId} className="flex justify-between py-2">
                <span>{it.title ?? `Variant ${it.variantId}`}</span>
                <span>{it.quantity} × ₦{((it.price ?? 0) / 100).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between">
            <strong>Total</strong>
            <strong>₦{(total / 100).toFixed(2)}</strong>
          </div>
          <div className="mt-4">
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email for receipt" className="border p-2 w-full mb-2" />
            <div className="flex gap-2">
              <button disabled={loading} onClick={checkout} className="bg-green-600 text-white px-4 py-2 rounded">Checkout with Paystack</button>
              <button onClick={() => { clear(); router.reload(); }} className="px-4 py-2 border rounded">Clear</button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
