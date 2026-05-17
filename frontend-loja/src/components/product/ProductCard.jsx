import { useState } from "react";
import { Link } from "react-router-dom";

import logo from "../../assets/logo_sem_fundo.png";
import { useCart } from "../../hooks/useCart.js";
import { useLocale } from "../../hooks/useLocale.js";
import { resolveProductImage } from "../../services/images.js";
import { Badge } from "../ui/Badge.jsx";

function parseSizes(value) {
  if (Array.isArray(value)) return value;
  return String(value || "Unico").split(",").map((item) => item.trim()).filter(Boolean);
}

export function ProductCard({ product }) {
  const cart = useCart();
  const { copy } = useLocale();
  const sizes = parseSizes(product.sizes);
  const [size, setSize] = useState(sizes[0] || "Unico");
  const imageSrc = resolveProductImage(product, logo);

  function addSelectedProductToCart() {
    cart.add({ ...product, sizes }, size);
  }

  return (
    <article className="product-card">
      <Link to={`/produto/${product.id}`} className="product-image-wrap">
        <img
          src={imageSrc}
          alt={product.name}
          onError={(event) => {
            if (event.currentTarget.dataset.fallbackApplied === "true") return;
            event.currentTarget.dataset.fallbackApplied = "true";
            event.currentTarget.src = logo;
          }}
        />
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
        <button className="btn btn-primary" onClick={addSelectedProductToCart} type="button">
          {copy.addToCart}
        </button>
      </div>
    </article>
  );
}
