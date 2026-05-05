import { useNavigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth.js";

export function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function exit() {
    logout();
    navigate("/login");
  }

  return (
    <header className="topbar">
      <div>
        <p>Painel privado</p>
        <h1>BigSmoke Admin</h1>
      </div>
      <input placeholder="Buscar produtos, pedidos..." type="search" />
      <div className="topbar-actions">
        <span>{user?.email || "admin"}</span>
        <a href="http://localhost:5173" target="_blank" rel="noreferrer">Abrir loja</a>
        <button onClick={exit} type="button">Sair</button>
      </div>
    </header>
  );
}
