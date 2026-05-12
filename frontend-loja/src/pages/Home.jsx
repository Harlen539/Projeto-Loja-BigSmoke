import { useMemo, useState } from "react";

import logo from "../assets/logo_sem_fundo.png";
import { ProductGrid } from "../components/product/ProductGrid.jsx";
import { ProductSearch } from "../components/product/ProductSearch.jsx";
import { Button } from "../components/ui/Button.jsx";
import { useLocale } from "../hooks/useLocale.js";
import { useProducts } from "../hooks/useProducts.js";

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

      <section className="trust-bar">
        <article>
          <strong>Rua e cultura</strong>
          <span>Peças com atitude</span>
        </article>
        <article>
          <strong>Checkout seguro</strong>
          <span>Fluxo integrado à API</span>
        </article>
        <article>
          <strong>Atendimento direto</strong>
          <span>WhatsApp da marca</span>
        </article>
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

      <section className="split-section" id="about">
        <div>
          <p className="eyebrow">Marca</p>
          <h2>Visual escuro, presença forte, assinatura própria.</h2>
        </div>
        <p>
          A BigSmoke mistura streetwear, cultura urbana e operação digital com
          catálogo dinâmico, carrinho persistente e checkout preparado para
          PIX.
        </p>
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
