import { useCallback, useEffect, useState } from "react";

import { apiFetch } from "../services/api.js";
import { useAuth } from "./useAuth.js";

export function useOrders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);

  const load = useCallback(async () => {
    const data = await apiFetch("/api/admin/orders?limit=100", { headers: { Authorization: `Bearer ${token}` } });
    setOrders(data.items || data.orders || data);
  }, [token]);

  useEffect(() => {
    if (token) load().catch(console.error);
  }, [load, token]);

  return { orders, reload: load };
}
