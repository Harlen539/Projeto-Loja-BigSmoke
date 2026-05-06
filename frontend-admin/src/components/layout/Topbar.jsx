import { useNavigate } from "react-router-dom";

import logo from "../../assets/logo.png";
import { useAuth } from "../../hooks/useAuth.js";

const storeUrl = import.meta.env.VITE_STORE_URL || "http://localhost:5173";

export function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function exit() {
    logout();
    navigate("/login");
  }

  return (
    <header className="topbar soc-topbar">
      <div className="soc-mobile-brand">
        <img src={logo} alt="BigSmoke" />
      </div>

      <label className="soc-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input placeholder="Buscar produtos, pedidos..." type="search" />
      </label>

      <div className="topbar-actions soc-topbar-actions">
        <button className="soc-bell" title={user?.email || "admin"} type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
        <a className="soc-store-btn" href={storeUrl} target="_blank" rel="noreferrer">Abrir loja</a>
        <button className="soc-new-btn" onClick={() => navigate("/produtos")} type="button">+ Novo produto</button>
        <button className="soc-logout-btn" onClick={exit} type="button">Sair</button>
      </div>
    </header>
  );
}
