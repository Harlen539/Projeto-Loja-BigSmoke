import { createContext, useContext, useState, useCallback } from "react";

const AUTH_KEY = "bigsmoke_customer";
const TOKEN_KEY = "bigsmoke_customer_token";

function readUser() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
  } catch {
    return null;
  }
}

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser);
  const [authOpen, setAuthOpen] = useState(false);

  const login = useCallback((userData, token = "") => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(userData));
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
    setUser(userData);
    setAuthOpen(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const openAuth = useCallback(() => setAuthOpen(true), []);
  const closeAuth = useCallback(() => setAuthOpen(false), []);

  const token = localStorage.getItem(TOKEN_KEY) || "";

  return (
    <AuthContext.Provider value={{ user, token, login, logout, authOpen, openAuth, closeAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
