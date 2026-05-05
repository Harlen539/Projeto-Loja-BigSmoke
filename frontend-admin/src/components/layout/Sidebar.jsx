import { NavLink } from "react-router-dom";

import logo from "../../assets/logo.png";

export function Sidebar() {
  return (
    <aside className="sidebar">
      <img src={logo} alt="BigSmoke" />
      <nav>
        <NavLink to="/">Dashboard</NavLink>
        <NavLink to="/produtos">Produtos</NavLink>
        <NavLink to="/pedidos">Pedidos</NavLink>
        <NavLink to="/graficos">Gráficos</NavLink>
      </nav>
    </aside>
  );
}
