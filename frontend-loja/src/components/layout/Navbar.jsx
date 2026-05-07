import { Link } from "react-router-dom";

import logo from "../../assets/logo_sem_fundo.png";
import perfil from "../../assets/icone_bigsmoke_conta.png";
import { useCart } from "../../hooks/useCart.js";
import { useLocale } from "../../hooks/useLocale.js";
import { LanguageSwitcher } from "../ui/LanguageSwitcher.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export function Navbar() {
  const cart = useCart();
  const { copy } = useLocale();
  const { user, openAuth } = useAuth();

  return (
    <header className="navbar">
      <Link className="brand" to="/">
        <img className="logo-img" src={logo} alt="BigSmoke" />
      </Link>
      <nav className="nav-links">
        <a href="/#products">{copy.nav.drops}</a>
        <a href="/#about">{copy.nav.brand}</a>
        <Link to="/pedidos">{copy.nav.orders}</Link>
        <a href="/#contact">{copy.nav.contact}</a>
        <Link to="/politica">{copy.nav.policy}</Link>
      </nav>
      <div className="header-actions">
        <LanguageSwitcher />

        {user ? (
          <Link className="profile-icon-link profile-logged" to="/perfil" aria-label="Perfil">
            <span className="profile-initials">
              {(user.firstName?.[0] || user.email?.[0] || "B").toUpperCase()}
            </span>
          </Link>
        ) : (
          <button
            className="profile-icon-link"
            type="button"
            onClick={openAuth}
            aria-label="Entrar na conta"
          >
            <img src={perfil} alt="" />
          </button>
        )}

        <button className="cart-toggle" type="button" onClick={() => cart.setOpen(true)}>
          <span>{copy.cart}</span>
          <strong>{cart.count}</strong>
        </button>
      </div>
    </header>
  );
}
