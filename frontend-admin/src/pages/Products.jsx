import { useMemo, useState } from "react";

import logo from "../assets/logo_sem_fundo.png";
import { ProductForm } from "../components/products/ProductForm.jsx";
import { ProductTable } from "../components/products/ProductTable.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useProducts } from "../hooks/useProducts.js";
import { apiFetch } from "../services/api.js";

const PRODUCT_FILTERS = ["Todos", "Bonés", "Moletons", "Camisetas"];

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function productImage(product) {
  return product?.image || product?.image_url || (Array.isArray(product?.images) ? product.images[0] : "") || logo;
}

function normalizeCategory(category) {
  const value = String(category || "Sem categoria").trim();
  const lower = value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (lower.includes("bone")) return "Bonés";
  if (lower.includes("moletom")) return "Moletons";
  if (lower.includes("camiseta") || lower.includes("shirt")) return "Camisetas";
  return value || "Sem categoria";
}

function Icon({ name }) {
  const icons = {
    search: <><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></>,
    trash: <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v5M14 11v5" /></>,
    box: <><path d="m21 8-9-5-9 5 9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8M12 13v8" /></>,
    tag: <><path d="M20.5 13.5 13.5 20.5a2 2 0 0 1-2.8 0L3 12.8V3h9.8l7.7 7.7a2 2 0 0 1 0 2.8Z" /><circle cx="7.5" cy="7.5" r="1" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">{icons[name]}</svg>;
}

export function Products() {
  const { token } = useAuth();
  const { products, reload } = useProducts();
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");

  const filteredProducts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) => {
      const normalizedCategory = normalizeCategory(product.category);
      const matchesCategory = category === "Todos" || normalizedCategory === category;
      const haystack = `${product.name || ""} ${product.category || ""}`.toLowerCase();
      return matchesCategory && (!needle || haystack.includes(needle));
    });
  }, [category, products, query]);

  async function save(payload) {
    const method = editing ? "PUT" : "POST";
    const path = editing ? `/api/admin/products/${editing.id}` : "/api/admin/products";
    await apiFetch(path, { method, headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
    setFormOpen(false);
    setEditing(null);
    await reload();
    window.dispatchEvent(new Event("bigsmoke-admin-data-updated"));
  }

  async function remove(product) {
    await apiFetch(`/api/admin/products/${product.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    await reload();
    window.dispatchEvent(new Event("bigsmoke-admin-data-updated"));
  }

  return (
    <main className="page admin-products-page">
      <div className="page-head admin-page-head">
        <h2>Produtos</h2>
        <button className="product-new-button admin-primary-button" onClick={() => { setEditing(null); setFormOpen(true); }} type="button">
          <Icon name="plus" />
          Novo produto
        </button>
      </div>

      <section className="admin-controls">
        <label className="admin-search-bar">
          <Icon name="search" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar produtos..." type="search" />
        </label>
        <div className="admin-filter-row" aria-label="Filtros de categoria">
          {PRODUCT_FILTERS.map((item) => (
            <button className={category === item ? "active" : ""} key={item} onClick={() => setCategory(item)} type="button">
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="admin-product-card-list">
        {filteredProducts.length ? filteredProducts.map((product) => (
          <article className="admin-product-card" key={product.id || product.name}>
            <img src={productImage(product)} alt={product.name || "Produto BigSmoke"} onError={(event) => { event.currentTarget.src = logo; }} />
            <div className="admin-product-info">
              <strong>{product.name}</strong>
              <span className="admin-category-badge">{normalizeCategory(product.category)}</span>
              <div className="admin-product-meta">
                <span><Icon name="box" />Estoque: <b>{product.stock ?? 0}</b></span>
                <span><Icon name="tag" /><b>{money(product.price)}</b></span>
              </div>
            </div>
            <div className="admin-card-actions">
              <button className="admin-icon-action edit" onClick={() => { setEditing(product); setFormOpen(true); }} type="button">
                <Icon name="edit" />
                Editar
              </button>
              <button className="admin-icon-action danger" onClick={() => remove(product)} type="button">
                <Icon name="trash" />
                Excluir
              </button>
            </div>
          </article>
        )) : (
          <div className="admin-empty-card">
            <strong>Nenhum produto encontrado</strong>
            <span>Ajuste a busca ou crie um novo produto para o catálogo.</span>
          </div>
        )}
      </section>

      <div className="admin-desktop-table">
        <ProductTable products={filteredProducts} onDelete={remove} onEdit={(product) => { setEditing(product); setFormOpen(true); }} />
      </div>
      {formOpen ? <ProductForm product={editing} onCancel={() => setFormOpen(false)} onSubmit={save} /> : null}
    </main>
  );
}
