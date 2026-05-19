import { useMemo, useState } from "react";

import comunidadeBg from "../assets/fundo-comunidade.png";
import dropBg from "../assets/fundo-drop-constante.png";
import ruaBg from "../assets/fundo-rua-cultura.png";
import logo from "../assets/logo_sem_fundo.png";
import { ProductGrid } from "../components/product/ProductGrid.jsx";
import { ProductSearch } from "../components/product/ProductSearch.jsx";
import { Button } from "../components/ui/Button.jsx";
import { useLocale } from "../hooks/useLocale.js";
import { useProducts } from "../hooks/useProducts.js";

const featureCards = [
  {
    title: "RUA E CULTURA",
    description: "Peças que carregam atitude e presença.",
    image: ruaBg,
    icon: "globe",
  },
  {
    title: "COMUNIDADE",
    description: "Quem veste BigSmoke representa um movimento.",
    image: comunidadeBg,
    icon: "users",
  },
  {
    title: "DROP CONSTANTE",
    description: "Novas peças, novas histórias, mesma identidade.",
    image: dropBg,
    icon: "bolt",
  },
];

function FeatureIcon({ name }) {
  if (name === "users") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M16 19c0-2.2-1.8-4-4-4s-4 1.8-4 4" />
        <circle cx="12" cy="8" r="3" />
        <path d="M21 19c0-1.8-1.2-3.3-2.8-3.8" />
        <path d="M17 5.2a3 3 0 0 1 0 5.6" />
        <path d="M3 19c0-1.8 1.2-3.3 2.8-3.8" />
        <path d="M7 5.2a3 3 0 0 0 0 5.6" />
      </svg>
    );
  }

  if (name === "bolt") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M13 2 4 14h7l-1 8 10-13h-7l0-7Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16" />
      <path d="M12 4c2 2.2 3 4.9 3 8s-1 5.8-3 8c-2-2.2-3-4.9-3-8s1-5.8 3-8Z" />
    </svg>
  );
}

function ProductSkeleton() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "1.5rem",
      }}
      aria-label="Carregando produtos..."
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          style={{
            borderRadius: 12,
            overflow: "hidden",
            background: "var(--color-background-secondary)",
            animation: "pulse 1.4s ease-in-out infinite",
          }}
        >
          <div style={{ height: 280, background: "var(--color-background-tertiary, #e0e0e0)" }} />
          <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ height: 14, borderRadius: 6, background: "var(--color-background-tertiary, #e0e0e0)", width: "70%" }} />
            <div style={{ height: 12, borderRadius: 6, background: "var(--color-background-tertiary, #e0e0e0)", width: "40%" }} />
          </div>
        </div>
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
    </div>
  );
}

export function Home() {
  const { copy } = useLocale();
  const { products, loading, error } = useProducts();
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) =>
      `${product.name} ${product.category} ${product.description}`
        .toLowerCase()
        .includes(term)
    );
  }, [products, query]);

  return (
    <main>
      <section className="hero" id="hero">
        <div className="hero-copy">
          <p className="eyebrow">BigSmoke Streetwear</p>
          <h1>{copy.heroTitle}</h1>
          <p>{copy.heroText}</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#products">
              {copy.seeCatalog}
            </a>
            <a className="btn btn-outline" href="#contact">
              {copy.talkToBrand}
            </a>
          </div>
        </div>
        <div className="hero-brand-panel">
          <img src={logo} alt="BigSmoke" />
          <span>Brasil • PIX • Identidade propria</span>
        </div>
      </section>

      <section id="brand-cards" className="trust-bar" aria-label="Destaques da marca">
        {featureCards.map((card) => (
          <article className="trust-card" key={card.title}>
            <div
              className="trust-card-bg"
              style={{ backgroundImage: `url(${card.image})` }}
              aria-hidden="true"
            />
            <div className="trust-card-icon" aria-hidden="true">
              <FeatureIcon name={card.icon} />
            </div>
            <div className="trust-card-copy">
              <strong>{card.title}</strong>
              <span className="trust-card-text">{card.description}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="section-shell" id="products">
        <div className="section-heading">
          <p className="eyebrow">Catálogo</p>
          <h2>Drops BigSmoke</h2>
          <ProductSearch value={query} onChange={setQuery} />
        </div>

        {loading && <ProductSkeleton />}
        {error && <p className="form-status">{error}</p>}
        {!loading && !error && <ProductGrid products={filtered} />}
        {!loading && !error && filtered.length === 0 && query && (
          <p style={{ textAlign: "center", color: "var(--color-text-secondary)", padding: "2rem" }}>
            Nenhum produto encontrado para "{query}".
          </p>
        )}
      </section>

      <section className="section-shell" id="faq">
        <h2>Perguntas frequentes</h2>
        <details>
          <summary>Como acompanho meu pedido?</summary>
          <p>
            Use a página <a href="/pedidos">Meus pedidos</a> com código, número
            ou session id.
          </p>
        </details>
        <details>
          <summary>O checkout é seguro?</summary>
          <p>
            Sim. O pagamento e gerado via PIX pela Abacate Pay, e a loja recebe
            a confirmacao pelo provedor de pagamento.
          </p>
        </details>
        <details>
          <summary>Qual o prazo de entrega?</summary>
          <p>
            Para João Pessoa, Bayeux e Cabedelo o frete é grátis. Para o resto
            do Brasil, o prazo varia conforme a região e os Correios.
          </p>
        </details>
        <Button
          variant="outline"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          Voltar ao topo
        </Button>
      </section>
    </main>
  );
}
