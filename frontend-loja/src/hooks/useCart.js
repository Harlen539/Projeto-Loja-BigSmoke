import { useContext } from "react";

import { CartContext } from "../context/CartContext.jsx";

export function useCart() {
  const value = useContext(CartContext);
  if (!value) {
    throw new Error("useCart precisa estar dentro de CartProvider.");
  }
  return value;
}
