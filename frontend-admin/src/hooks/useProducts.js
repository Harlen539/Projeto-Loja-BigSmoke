import { useCallback, useEffect, useState } from "react";

import { useAuth } from "./useAuth.js";
import { apiFetch } from "../services/api.js";

export function useProducts() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState({});

  const load = useCallback(async () => {
    const data = await apiFetch("/api/admin/products?limit=100", { headers: { Authorization: `Bearer ${token}` } });
    setProducts(data.items || data.products || data);
    setSummary(data.summary || {});
  }, [token]);

  useEffect(() => {
    if (token) load().catch(console.error);
  }, [load, token]);

  return { products, summary, reload: load };
}
