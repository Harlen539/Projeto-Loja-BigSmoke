import { useEffect, useState } from "react";

const empty = { name: "", category: "", price: "", stock: "", image: "", description: "", sizes: "P, M, G", badge: "BigSmoke", active: true };

export function ProductForm({ product, onCancel, onSubmit }) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    setForm(product ? { ...empty, ...product, sizes: Array.isArray(product.sizes) ? product.sizes.join(", ") : product.sizes || "" } : empty);
  }, [product]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    onSubmit({
      ...form,
      price: Number(form.price || 0),
      stock: Number(form.stock || 0),
      active: Boolean(form.active)
    });
  }

  return (
    <form className="drawer-form" onSubmit={submit}>
      <h2>{product ? "Editar produto" : "Novo produto"}</h2>
      <input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Nome" required />
      <input value={form.category} onChange={(event) => update("category", event.target.value)} placeholder="Categoria" required />
      <input value={form.price} onChange={(event) => update("price", event.target.value)} placeholder="Preço" required type="number" step="0.01" />
      <input value={form.stock} onChange={(event) => update("stock", event.target.value)} placeholder="Estoque" type="number" />
      <input value={form.image} onChange={(event) => update("image", event.target.value)} placeholder="URL da imagem" />
      <input value={form.sizes} onChange={(event) => update("sizes", event.target.value)} placeholder="Tamanhos" />
      <textarea value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Descrição" />
      <label><input checked={form.active} onChange={(event) => update("active", event.target.checked)} type="checkbox" /> Ativo</label>
      <div className="form-actions">
        <button type="submit">Salvar</button>
        <button onClick={onCancel} type="button">Cancelar</button>
      </div>
    </form>
  );
}
