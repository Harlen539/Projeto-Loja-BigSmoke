import { useNavigate } from "react-router-dom";

import logo from "../../assets/logo.png";
import { NotificationCenter } from "./NotificationCenter.jsx";
import { getStoreUrl } from "../../services/storeUrl.js";

export function Topbar() {
  const navigate = useNavigate();

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
        <NotificationCenter />
        <a className="soc-store-btn" href={getStoreUrl("/")} target="_blank" rel="noreferrer">Abrir loja</a>
        <button className="soc-new-btn" onClick={() => navigate("/produtos")} type="button">+ Novo produto</button>
      </div>
    </header>
  );
}
