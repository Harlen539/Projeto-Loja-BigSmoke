import { useMemo, useState } from "react";

import logo from "../assets/logo_sem_fundo.png";
import { ProductGrid } from "../components/product/ProductGrid.jsx";
import { ProductSearch } from "../components/product/ProductSearch.jsx";
import { Button } from "../components/ui/Button.jsx";
import { useLocale } from "../hooks/useLocale.js";
import { useProducts } from "../hooks/useProducts.js";

export function Home() {
  const { copy } = useLocale();
  const { products, loading, error } = useProducts();
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) => `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(term));
  }, [products, query]);

  return (
    <main>
      <section className="hero" id="hero">
        <div className="hero-copy">
          <p className="eyebrow">BigSmoke Streetwear</p>
          <h1>{copy.heroTitle}</h1>
          <p>{copy.heroText}</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#products">{copy.seeCatalog}</a>
            <a className="btn btn-outline" href="#contact">{copy.talkToBrand}</a>
          </div>
        </div>
        <div className="hero-brand-panel">
          <img src={logo} alt="BigSmoke" />
          <span>Brasil • Stripe • Identidade própria</span>
        </div>
      </section>

      <section className="trust-bar">
        <article><strong>Rua e cultura</strong><span>Peças com atitude</span></article>
        <article><strong>Checkout seguro</strong><span>Fluxo integrado à API</span></article>
        <article><strong>Atendimento direto</strong><span>WhatsApp da marca</span></article>
      </section>

      <section className="section-shell" id="products">
        <div className="section-heading">
          <p className="eyebrow">Catálogo</p>
          <h2>Drops BigSmoke</h2>
          <ProductSearch value={query} onChange={setQuery} />
        </div>
        {loading ? <p>Carregando produtos...</p> : null}
        {error ? <p className="form-status">{error}</p> : null}
        <ProductGrid products={filtered} />
      </section>

      <section className="split-section" id="about">
        <div>
          <p className="eyebrow">Marca</p>
          <h2>Visual escuro, presença forte, assinatura própria.</h2>
        </div>
        <p>A BigSmoke mistura streetwear, cultura urbana e operação digital com catálogo dinâmico, carrinho persistente e checkout preparado para Stripe.</p>
      </section>

      <section className="section-shell" id="faq">
        <h2>Perguntas frequentes</h2>
        <details><summary>Como acompanho meu pedido?</summary><p>Use a página Meus pedidos com código, número ou session id.</p></details>
        <details><summary>O checkout é seguro?</summary><p>Sim. O pagamento é redirecionado para a Stripe quando configurado.</p></details>
        <Button variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Voltar ao topo</Button>
      </section>
    </main>
  );
}
