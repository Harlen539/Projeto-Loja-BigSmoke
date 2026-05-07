import { createContext, useContext, useState, useCallback } from "react";

const AUTH_KEY = "bigsmoke_customer";

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

  const login = useCallback((userData) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(userData));
    setUser(userData);
    setAuthOpen(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
  }, []);

  const openAuth = useCallback(() => setAuthOpen(true), []);
  const closeAuth = useCallback(() => setAuthOpen(false), []);

  return (
    <AuthContext.Provider value={{ user, login, logout, authOpen, openAuth, closeAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
