import { useState } from "react";

import { ProductForm } from "../components/products/ProductForm.jsx";
import { ProductTable } from "../components/products/ProductTable.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useProducts } from "../hooks/useProducts.js";
import { apiFetch } from "../services/api.js";

export function Products() {
  const { token } = useAuth();
  const { products, reload } = useProducts();
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  async function save(payload) {
    const method = editing ? "PUT" : "POST";
    const path = editing ? `/api/admin/products/${editing.id}` : "/api/admin/products";
    await apiFetch(path, { method, headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
    setFormOpen(false);
    setEditing(null);
    await reload();
  }

  async function remove(product) {
    await apiFetch(`/api/admin/products/${product.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    await reload();
  }

  return (
    <main className="page">
      <div className="page-head">
        <h2>Produtos</h2>
        <button onClick={() => { setEditing(null); setFormOpen(true); }} type="button">Novo produto</button>
      </div>
      <ProductTable products={products} onDelete={remove} onEdit={(product) => { setEditing(product); setFormOpen(true); }} />
      {formOpen ? <ProductForm product={editing} onCancel={() => setFormOpen(false)} onSubmit={save} /> : null}
    </main>
  );
}
