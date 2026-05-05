import { Link } from "react-router-dom";

import logo from "../../assets/logo_sem_fundo.png";
import perfil from "../../assets/icone_bigsmoke_conta.png";
import { useCart } from "../../hooks/useCart.js";
import { useLocale } from "../../hooks/useLocale.js";
import { LanguageSwitcher } from "../ui/LanguageSwitcher.jsx";

export function Navbar() {
  const cart = useCart();
  const { copy } = useLocale();
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
        <Link className="profile-icon-link" to="/perfil" aria-label="Perfil">
          <img src={perfil} alt="" />
        </Link>
        <button className="cart-toggle" type="button" onClick={() => cart.setOpen(true)}>
          <span>{copy.cart}</span>
          <strong>{cart.count}</strong>
        </button>
      </div>
    </header>
  );
}
