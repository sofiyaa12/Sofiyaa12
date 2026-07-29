import { GetStaticProps } from 'next';
import Link from 'next/link';
import React from 'react';

export const getStaticProps: GetStaticProps = async () => {
  // We use client-side fetch in this scaffold but keep SSG placeholder
  return { props: {} };
};

export default function Home() {
  const [products, setProducts] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetch('/api/products').then((r) => r.json()).then(setProducts);
  }, []);

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Store</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {products.map((p) => (
          <div key={p.id} className="border rounded p-4">
            <img src={p.images[0] || '/images/placeholder.jpg'} alt={p.title} className="w-full h-56 object-cover mb-4" />
            <h2 className="font-semibold">{p.title}</h2>
            <p className="text-sm text-gray-600">From ₦{(Math.min(...p.variants.map((v:any)=>v.price))/100).toFixed(2)}</p>
            <Link href={`/product/${p.slug}`} className="mt-3 inline-block text-blue-600">View product</Link>
          </div>
        ))}
      </div>
    </main>
  );
}
