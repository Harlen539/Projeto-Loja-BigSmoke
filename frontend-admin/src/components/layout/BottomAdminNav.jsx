import { NavLink } from "react-router-dom";

const items = [
  {
    to: "/",
    label: "Dashboard",
    icon: <><path d="M4 19v-5M10 19V9M16 19V5M21 19H3" /><path d="m5 12 5-4 4 3 5-7" /></>,
  },
  {
    to: "/produtos",
    label: "Produtos",
    icon: <><path d="M6 8h12l1 13H5L6 8Z" /><path d="M9 8a3 3 0 0 1 6 0" /></>,
  },
  {
    to: "/pedidos",
    label: "Pedidos",
    icon: <><path d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="8" y="3" width="8" height="4" rx="1" /><path d="M8 12h8M8 16h5" /></>,
  },
  {
    to: "/clientes",
    label: "Clientes",
    icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /></>,
  },
  {
    to: "/configuracoes",
    label: "Config.",
    icon: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-.6 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1H3a2 2 0 0 1 0-4h1a1.65 1.65 0 0 0 .6-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6V3a2 2 0 0 1 4 0v1a1.65 1.65 0 0 0 1 .6 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.6.2 1.02.76 1.02 1.42v.16c0 .66-.42 1.22-1.02 1.42Z" /></>,
  },
];

export function BottomAdminNav() {
  return (
    <nav className="bottom-admin-nav" aria-label="Navegacao principal mobile">
      {items.map((item) => (
        <NavLink end={item.to === "/"} key={item.to} to={item.to}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            {item.icon}
          </svg>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
