import { useEffect, useState } from "react";

import logo from "../assets/logo_sem_fundo.png";
import { apiFetch } from "../services/api.js";

const FALLBACK_PRODUCTS = [
  {
    id: "moletom-classic",
    name: "Moletom Classic BigSmoke",
    category: "Moletons",
    price: 199.9,
    image: logo,
    badge: "BigSmoke",
    sizes: ["P", "M", "G", "GG"],
    description: "Peça streetwear BigSmoke com presença e conforto.",
    stock: 10
  }
];

export function useProducts() {
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    apiFetch("/api/products")
      .then((data) => alive && setProducts(Array.isArray(data) && data.length ? data : FALLBACK_PRODUCTS))
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return { products, loading, error };
}
