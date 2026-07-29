import { useRouter } from 'next/router';
import React from 'react';
import { useCart } from '../../contexts/CartContext';

export default function ProductPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [product, setProduct] = React.useState<any>(null);
  const [selectedVariant, setSelectedVariant] = React.useState<number | null>(null);
  const { add } = useCart();

  React.useEffect(() => {
    if (!slug) return;
    fetch('/api/products').then((r) => r.json()).then((ps) => {
      const p = ps.find((x: any) => x.slug === slug);
      setProduct(p);
      if (p && p.variants && p.variants.length) setSelectedVariant(p.variants[0].id);
    });
  }, [slug]);

  if (!product) return <div className="p-6">Loading...</div>;

  const variant = product.variants.find((v: any) => v.id === selectedVariant);

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{product.title}</h1>
      <img src={product.images[0] || '/images/placeholder.jpg'} alt={product.title} className="w-full h-96 object-cover mb-4" />
      <p className="mb-4">{product.description}</p>
      <div className="mb-4">
        <label className="block mb-2">Color</label>
        <select value={selectedVariant ?? ''} onChange={(e) => setSelectedVariant(Number(e.target.value))} className="border p-2">
          {product.variants.map((v: any) => (
            <option key={v.id} value={v.id}>{v.color} — ₦{(v.price/100).toFixed(2)} ({v.inventory} in stock)</option>
          ))}
        </select>
      </div>
      <p className="font-semibold mb-4">₦{(variant?.price/100).toFixed(2)}</p>
      <button className="bg-black text-white px-4 py-2 rounded" onClick={() => { if (!variant) return; add({ variantId: variant.id, quantity: 1, title: product.title, price: variant.price }); router.push('/cart'); }}>Add to cart</button>
    </main>
  );
}
