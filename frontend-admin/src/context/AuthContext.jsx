import { createContext, useEffect, useMemo, useState } from "react";

import { apiFetch } from "../services/api.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("bigsmoke-admin-token") || "");
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!token) return;
    apiFetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((data) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem("bigsmoke-admin-token");
        setToken("");
      });
  }, [token]);

  const value = useMemo(() => ({
    token,
    user,
    isAdmin: user?.role === "admin",
    async login(email, password) {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem("bigsmoke-admin-token", data.token);
      setToken(data.token);
      setUser(data.user);
    },
    logout() {
      localStorage.removeItem("bigsmoke-admin-token");
      setToken("");
      setUser(null);
    }
  }), [token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
