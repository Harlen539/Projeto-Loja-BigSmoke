import { useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import logo from "../assets/logo_sem_fundo.png";
import { ProductCard } from "../components/product/ProductCard.jsx";
import { useProducts } from "../hooks/useProducts.js";

export function Produto() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { products } = useProducts();
  const productId = id || params.get("id") || products[0]?.id;
  const product = useMemo(() => products.find((item) => item.id === productId) || products[0], [productId, products]);

  if (!product) {
    return <main className="page-shell"><p>Produto não encontrado.</p></main>;
  }

  return (
    <main className="page-shell">
      <div className="product-detail">
        <img src={product.image || logo} alt={product.name} onError={(event) => { event.currentTarget.src = logo; }} />
        <div>
          <p className="eyebrow">{product.category}</p>
          <h1>{product.name}</h1>
          <strong>R$ {Number(product.price || 0).toFixed(2).replace(".", ",")}</strong>
          <p>{product.description}</p>
          <ProductCard product={product} />
        </div>
      </div>
    </main>
  );
}
