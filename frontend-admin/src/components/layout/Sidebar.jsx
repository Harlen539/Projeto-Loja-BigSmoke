import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import accountIcon from "../../assets/icone_bigsmoke_conta.png";
import adminLogo from "../../assets/logo_bigsmoke_admin.jpg";
import { useAuth } from "../../hooks/useAuth.js";

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
];

function UserIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const email = user?.email || "admin";
  const adminName = user?.name || user?.fullName || user?.username || "Admin";
  const adminRole = user?.role || "admin";
  const avatarKey = useMemo(() => `bigsmoke-admin-avatar:${email}`, [email]);
  const accountRef = useRef(null);
  const [avatar, setAvatar] = useState(() => localStorage.getItem(avatarKey) || "");
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    function refreshAvatar() {
      setAvatar(localStorage.getItem(avatarKey) || "");
    }
    refreshAvatar();
    window.addEventListener("storage", refreshAvatar);
    window.addEventListener("bigsmoke-admin-avatar-updated", refreshAvatar);
    return () => {
      window.removeEventListener("storage", refreshAvatar);
      window.removeEventListener("bigsmoke-admin-avatar-updated", refreshAvatar);
    };
  }, [avatarKey]);

  useEffect(() => {
    if (!accountOpen) return;

    function closeAccountMenu(event) {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountOpen(false);
      }
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setAccountOpen(false);
      }
    }

    document.addEventListener("mousedown", closeAccountMenu);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeAccountMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [accountOpen]);

  function exit() {
    logout();
    navigate("/login");
  }

  function openSettings() {
    setAccountOpen(false);
    navigate("/configuracoes");
  }

  return (
    <aside className="sidebar soc-sidebar">
      <div className="soc-sidebar-inner">
        <NavLink className="soc-sidebar-logo" to="/" aria-label="BigSmoke Admin">
          <span className="soc-logo-card">
            <img src={adminLogo} alt="BigSmoke Admin" />
          </span>
        </NavLink>

        <nav className="soc-sidebar-nav" aria-label="Menu administrativo">
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

        <div className="soc-sidebar-footer" ref={accountRef}>
          <button
            aria-expanded={accountOpen}
            aria-haspopup="menu"
            className="soc-profile"
            onClick={() => setAccountOpen((open) => !open)}
            type="button"
          >
            <span className="soc-profile-avatar">
              {avatar ? (
                <img src={avatar || accountIcon} alt="" onError={(event) => { event.currentTarget.src = accountIcon; }} />
              ) : (
                <UserIcon />
              )}
            </span>
            <span className="soc-profile-copy">
              <strong>{adminName}</strong>
              <small>{email}</small>
            </span>
            <span className="soc-profile-chevron">
              <ChevronDownIcon />
            </span>
          </button>

          {accountOpen ? (
            <div className="soc-account-menu" role="menu">
              <div className="soc-account-head">
                <span>Minha conta admin</span>
                <strong>{adminName}</strong>
                <small>{email}</small>
              </div>
              <div className="soc-account-meta">
                <span>Perfil</span>
                <strong>{adminRole}</strong>
              </div>
              <button onClick={openSettings} role="menuitem" type="button">
                Configuracoes
              </button>
              <button className="soc-account-logout" onClick={exit} role="menuitem" type="button">
                Sair da conta
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
