import React, { createContext, useContext, useEffect, useState } from 'react';

type Item = { variantId: number; quantity: number; title?: string; price?: number };

type CartContextValue = {
  items: Item[];
  add: (item: Item) => void;
  remove: (variantId: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Item[]>(() => {
    try {
      return JSON.parse(typeof window !== 'undefined' ? localStorage.getItem('cart') || '[]' : '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => { localStorage.setItem('cart', JSON.stringify(items)); }, [items]);

  const add = (item: Item) => {
    setItems((prev) => {
      const found = prev.find((p) => p.variantId === item.variantId);
      if (found) return prev.map((p) => p.variantId === item.variantId ? { ...p, quantity: p.quantity + item.quantity } : p);
      return [...prev, item];
    });
  };
  const remove = (variantId: number) => setItems((prev) => prev.filter((p) => p.variantId !== variantId));
  const clear = () => setItems([]);

  return <CartContext.Provider value={{ items, add, remove, clear }}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};
