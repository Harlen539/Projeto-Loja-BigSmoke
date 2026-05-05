import { useState } from "react";
import { Link } from "react-router-dom";

import logo from "../../assets/logo_sem_fundo.png";
import { useCart } from "../../hooks/useCart.js";
import { useLocale } from "../../hooks/useLocale.js";
import { Badge } from "../ui/Badge.jsx";

export function ProductCard({ product }) {
  const cart = useCart();
  const { copy } = useLocale();
  const sizes = Array.isArray(product.sizes) ? product.sizes : String(product.sizes || "Único").split(",").map((item) => item.trim()).filter(Boolean);
  const [size, setSize] = useState(sizes[0] || "Único");

  return (
    <article className="product-card">
      <Link to={`/produto/${product.id}`} className="product-image-wrap">
        <img src={product.image || logo} alt={product.name} onError={(event) => { event.currentTarget.src = logo; }} />
        {product.badge ? <Badge>{product.badge}</Badge> : null}
      </Link>
      <div className="product-card-body">
        <span>{product.category}</span>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <strong>R$ {Number(product.price || 0).toFixed(2).replace(".", ",")}</strong>
        <div className="size-row">
          {sizes.map((option) => (
            <button className={option === size ? "active" : ""} key={option} onClick={() => setSize(option)} type="button">{option}</button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => cart.add(product, size)} type="button">{copy.addToCart}</button>
      </div>
    </article>
  );
}
