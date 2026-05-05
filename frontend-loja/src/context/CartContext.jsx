import { createContext, useEffect, useMemo, useState } from "react";

export const CartContext = createContext(null);

function readCart() {
  try {
    return JSON.parse(localStorage.getItem("bigsmoke-cart") || "[]");
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("bigsmoke-cart", JSON.stringify(items));
  }, [items]);

  const value = useMemo(() => ({
    items,
    open,
    setOpen,
    add(product, size = product.sizes?.[0] || "Único") {
      setItems((current) => {
        const key = `${product.id}-${size}`;
        const found = current.find((item) => item.key === key);
        if (found) {
          return current.map((item) => item.key === key ? { ...item, quantity: item.quantity + 1 } : item);
        }
        return [...current, { key, id: product.id, name: product.name, price: Number(product.price || 0), image: product.image, size, quantity: 1 }];
      });
      setOpen(true);
    },
    updateQuantity(key, quantity) {
      setItems((current) => current.flatMap((item) => item.key === key ? (quantity > 0 ? [{ ...item, quantity }] : []) : [item]));
    },
    remove(key) {
      setItems((current) => current.filter((item) => item.key !== key));
    },
    clear() {
      setItems([]);
    },
    total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    count: items.reduce((sum, item) => sum + item.quantity, 0)
  }), [items, open]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
