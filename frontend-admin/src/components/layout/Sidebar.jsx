import { NavLink } from "react-router-dom";

import brFlag from "../../assets/bandeira_BRA.jpg";
import usFlag from "../../assets/bandeira_EUA.jpg";
import accountIcon from "../../assets/icone_bigsmoke_conta.png";
import instagramIcon from "../../assets/instagram_logo.png";
import logo from "../../assets/logo.png";
import whatsappIcon from "../../assets/Whatsapp_logo.png";

const items = [
  {
    to: "/",
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    to: "/produtos",
    label: "Produtos",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M20 7H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1Z" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
  },
  {
    to: "/pedidos",
    label: "Pedidos",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    ),
  },
  {
    to: "/graficos",
    label: "Graficos",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
  },
];

export function Sidebar() {
  return (
    <aside className="sidebar soc-sidebar">
      <div className="soc-sidebar-logo">
        <img src={logo} alt="BigSmoke" />
        <span>Admin</span>
      </div>

      <nav className="soc-sidebar-nav">
        {items.map((item) => (
          <NavLink end={item.to === "/"} key={item.to} to={item.to}>
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}

        <NavLink to="/clientes">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>Clientes</span>
        </NavLink>

        <NavLink to="/configuracoes">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.38 1.05V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8.6 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1.05-.38H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 8.6a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6 1.65 1.65 0 0 0 .38-1.05V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.6.2 1.02.76 1.02 1.42v.16c0 .66-.42 1.22-1.02 1.42Z" />
          </svg>
          <span>Configuracoes</span>
        </NavLink>
      </nav>

      <div className="soc-sidebar-footer">
        <div className="soc-socials" aria-label="Canais BigSmoke">
          <img src={instagramIcon} alt="Instagram" />
          <img src={whatsappIcon} alt="WhatsApp" />
          <img src={brFlag} alt="Portugues" />
          <img src={usFlag} alt="English" />
        </div>
        <div className="soc-profile">
          <img src={accountIcon} alt="" />
          <div>
            <strong>BigSmoke Admin</strong>
            <small>Administrador</small>
          </div>
        </div>
      </div>
    </aside>
  );
}
