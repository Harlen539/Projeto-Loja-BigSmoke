import { useEffect, useState } from "react";
import { useProducts } from "../../hooks/useProducts.js";
import { apiFetch } from "../../services/api.js";

const STATUS_OPTIONS = [
  {
    value: "pending",
    label: "Pagamento não realizado",
    icon: "☐",
    desc: "Quero deixar o estoque sem alterações.",
  },
  {
    value: "paid",
    label: "Pagamento pendente",
    icon: "$",
    desc: "Ainda não recebi o dinheiro, mas quero reservar o estoque para meu cliente.",
  },
  {
    value: "processing",
    label: "Pagamento recebido",
    icon: "✓",
    desc: "Tudo certo! Já recebi o dinheiro e quero descontar o produto do meu estoque.",
  },
];

function StatusIcon({ status }) {
  const props = {
    "aria-hidden": "true",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.9",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  if (status === "paid") {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v8M15 10.5c-.6-.7-1.5-1-2.7-1-1.4 0-2.3.6-2.3 1.6 0 2.5 5 1 5 3.6 0 1.1-1 1.8-2.6 1.8-1.3 0-2.4-.4-3.1-1.2" />
      </svg>
    );
  }

  if (status === "processing") {
    return (
      <svg {...props}>
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }

  return (
    <svg {...props}>
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function ProductSelector({ products, selected, onToggle, onClose }) {
  const [search, setSearch] = useState("");
  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="ps-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ps-drawer">
        <div className="od-header">
          <h2>Produtos</h2>
          <button className="pf-close" type="button" onClick={onClose}>✓</button>
        </div>
        <input
          className="orders-search"
          placeholder="Pesquisar"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ margin: "0.75rem 1rem" }}
        />
        {selected.length > 0 && (
          <div className="ps-selected-badge">
            {selected.length} produto{selected.length > 1 ? "s" : ""} selecionado{selected.length > 1 ? "s" : ""} ✕
          </div>
        )}
        <div className="ps-list">
          {filtered.map((p) => {
            const isSelected = selected.some((s) => s.id === p.id);
            const inStock = p.stock === -1 || (p.stock || 0) > 0;
            return (
              <label key={p.id} className="ps-item">
                {p.image && <img src={p.image} alt={p.name} />}
                {!p.image && <div className="ps-no-img" />}
                <div className="ps-item-info">
                  <strong>{p.name}</strong>
                  {!inStock && <span className="ps-no-stock">⚠ Sem estoque</span>}
                </div>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(p)}
                />
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ManualOrder({ onClose, onSuccess, token }) {
  const { products } = useProducts();
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [showSelector, setShowSelector] = useState(false);
  const [form, setForm] = useState({
    name: "", lastName: "", email: "", phone: "", cpf: "",
    status: "pending",
    cep: "", state: "", city: "", neighborhood: "", street: "", number: "", complement: "",
    shipping: "0",
    origin: "",
    notes: "",
    discountType: "percentage",
    discount: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((c) => ({ ...c, [field]: value }));
  }

  function toggleProduct(p) {
    setSelectedProducts((cur) => {
      const exists = cur.find((s) => s.id === p.id);
      if (exists) return cur.filter((s) => s.id !== p.id);
      return [...cur, p];
    });
    setQuantities((cur) => ({ ...cur, [p.id]: cur[p.id] || 1 }));
  }

  async function lookupCep(cep) {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm((c) => ({
          ...c,
          state: data.uf || c.state,
          city: data.localidade || c.city,
          neighborhood: data.bairro || c.neighborhood,
          street: data.logradouro || c.street,
        }));
      }
    } catch (_) {}
  }

  const subtotal = selectedProducts.reduce((sum, p) => sum + (p.price || 0) * (quantities[p.id] || 1), 0);
  const discountValue = form.discount
    ? form.discountType === "percentage"
      ? subtotal * (Number(form.discount) / 100)
      : Number(form.discount)
    : 0;
  const shipping = Number(form.shipping || 0);
  const total = Math.max(0, subtotal - discountValue + shipping);

  async function submit(e) {
    e.preventDefault();
    if (!selectedProducts.length) { setError("Adicione pelo menos um produto."); return; }
    setSaving(true);
    setError("");
    try {
      const items = selectedProducts.map((p) => ({
        id: p.id, name: p.name, price: p.price, quantity: quantities[p.id] || 1, image: p.image,
      }));
      await apiFetch("/api/admin/orders/manual", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items,
          customer: { name: `${form.name} ${form.lastName}`.trim(), email: form.email, phone: form.phone, cpf: form.cpf },
          address: { cep: form.cep, state: form.state, city: form.city, neighborhood: form.neighborhood, street: form.street, number: form.number, complement: form.complement },
          status: form.status,
          shippingAmount: shipping,
          amountSubtotal: subtotal,
          amountTotal: total,
          origin: form.origin,
          notes: form.notes,
          deliveryMethod: shipping > 0 ? "envio" : "retirada",
        }),
      });
      onSuccess();
    } catch (err) {
      // Fallback: create via regular order endpoint
      try {
        const items = selectedProducts.map((p) => ({
          id: p.id, name: p.name, price: p.price, quantity: quantities[p.id] || 1, image: p.image,
        }));
        // Use direct upsert with admin endpoint for products that exist
        await apiFetch("/api/admin/orders", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            items,
            customer: { name: `${form.name} ${form.lastName}`.trim(), email: form.email, phone: form.phone },
            address: { cep: form.cep, state: form.state, city: form.city, neighborhood: form.neighborhood, street: form.street, number: form.number, complement: form.complement },
            status: form.status,
            shippingAmount: shipping,
            amountSubtotal: subtotal,
            amountTotal: total,
            deliveryMethod: shipping > 0 ? "envio" : "retirada",
          }),
        });
        onSuccess();
      } catch (err2) {
        setError(err2.message || "Erro ao criar pedido.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pf-overlay">
      <div className="pf-drawer">
        <div className="pf-header">
          <h2>Novo pedido manual</h2>
          <button className="pf-close" type="button" onClick={onClose}>✕</button>
        </div>
        <form className="pf-body" onSubmit={submit}>
          {error && <div className="pf-error">{error}</div>}

          {/* Produtos */}
          <div className="pf-section">
            <div className="pf-section-toggle" style={{ pointerEvents: "none" }}>
              <span>Produtos</span>
            </div>
            <div className="pf-section-body">
              <p style={{ color: "var(--muted)", margin: "0 0 0.75rem", fontSize: "0.9rem" }}>Adicione produtos ao seu pedido manual.</p>
              <button type="button" className="btn-add-product" onClick={() => setShowSelector(true)}>
                ⊕ Adicionar produtos
              </button>

              {selectedProducts.length > 0 && (
                <div style={{ marginTop: "1rem", display: "grid", gap: "0.5rem" }}>
                  {selectedProducts.map((p) => (
                    <div key={p.id} className="mo-product-row">
                      {p.image && <img src={p.image} alt={p.name} className="mo-product-img" />}
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: "0.9rem" }}>{p.name}</strong>
                        <span style={{ display: "block", color: "var(--muted)", fontSize: "0.8rem" }}>
                          R$ {Number(p.price || 0).toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                      <div className="qty-controls">
                        <button type="button" onClick={() => setQuantities((c) => ({ ...c, [p.id]: Math.max(1, (c[p.id] || 1) - 1) }))}>−</button>
                        <span>{quantities[p.id] || 1}</span>
                        <button type="button" onClick={() => setQuantities((c) => ({ ...c, [p.id]: (c[p.id] || 1) + 1 }))}>+</button>
                      </div>
                      <button type="button" className="pf-img-remove" onClick={() => toggleProduct(p)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Resumo */}
          {selectedProducts.length > 0 && (
            <div className="pf-section">
              <div className="pf-section-toggle" style={{ pointerEvents: "none" }}>
                <span>Resumo do pedido</span>
              </div>
              <div className="pf-section-body">
                <div className="od-row"><span>Subtotal:</span><span><strong>R$ {subtotal.toFixed(2).replace(".", ",")}</strong></span></div>
                <div className="od-row" style={{ marginTop: "0.75rem", flexDirection: "column", gap: "0.5rem" }}>
                  <span>Desconto:</span>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <button type="button" className={`tab-small${form.discountType === "percentage" ? " active" : ""}`} onClick={() => update("discountType", "percentage")}>Porcentagem</button>
                    <button type="button" className={`tab-small${form.discountType === "fixed" ? " active" : ""}`} onClick={() => update("discountType", "fixed")}>Valor fixo</button>
                    <div className="pf-input-suffix" style={{ flex: 1 }}>
                      <input value={form.discount} onChange={(e) => update("discount", e.target.value)} placeholder="-" type="number" min="0" style={{ minHeight: "36px" }} />
                      <span>{form.discountType === "percentage" ? "%" : "R$"}</span>
                    </div>
                  </div>
                </div>
                <div className="od-row" style={{ marginTop: "0.5rem" }}>
                  <span>Envio:</span>
                  <div className="pf-input-prefix" style={{ width: "140px" }}>
                    <span>R$</span>
                    <input value={form.shipping} onChange={(e) => update("shipping", e.target.value)} type="number" min="0" step="0.01" style={{ minHeight: "36px" }} />
                  </div>
                </div>
                <div className="od-row od-total" style={{ marginTop: "0.5rem" }}>
                  <span>Total</span>
                  <span>R$ {total.toFixed(2).replace(".", ",")}</span>
                </div>
              </div>
            </div>
          )}

          {/* Dados do cliente */}
          <div className="pf-section">
            <div className="pf-section-toggle" style={{ pointerEvents: "none" }}><span>Dados do cliente</span></div>
            <div className="pf-section-body">
              <div className="pf-row-2">
                <div className="pf-field"><label>Nome</label><input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Nome" /></div>
                <div className="pf-field"><label>Sobrenome</label><input value={form.lastName} onChange={(e) => update("lastName", e.target.value)} placeholder="Sobrenome" /></div>
              </div>
              <div className="pf-field"><label>E-mail</label><input value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="cliente@email.com" type="email" /></div>
              <div className="pf-field"><label>Telefone (opcional)</label><input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+55..." /></div>
              <div className="pf-field"><label>CPF ou CNPJ (opcional)</label><input value={form.cpf} onChange={(e) => update("cpf", e.target.value)} placeholder="000.000.000-00" /></div>
            </div>
          </div>

          {/* Estado do pedido */}
          <div className="pf-section">
            <div className="pf-section-toggle" style={{ pointerEvents: "none" }}><span>Estado do pedido</span></div>
            <div className="pf-section-body">
              <div className="od-status-list">
                {STATUS_OPTIONS.map((opt) => (
                  <label key={opt.value} className={`od-status-option${form.status === opt.value ? " active" : ""}`}>
                    <div className="od-status-icon"><StatusIcon status={opt.value} /></div>
                    <div className="od-status-text"><strong>{opt.label}</strong><span>{opt.desc}</span></div>
                    <input type="radio" name="moStatus" value={opt.value} checked={form.status === opt.value} onChange={() => update("status", opt.value)} />
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Informações de entrega */}
          <div className="pf-section">
            <div className="pf-section-toggle" style={{ pointerEvents: "none" }}><span>Informações de entrega</span></div>
            <div className="pf-section-body">
              <div className="pf-field">
                <label>CEP</label>
                <input value={form.cep} onChange={(e) => { update("cep", e.target.value); lookupCep(e.target.value); }} placeholder="00000-000" />
              </div>
              <div className="pf-field"><label>Estado</label><input value={form.state} onChange={(e) => update("state", e.target.value)} /></div>
              <div className="pf-field"><label>Cidade</label><input value={form.city} onChange={(e) => update("city", e.target.value)} /></div>
              <div className="pf-field"><label>Bairro</label><input value={form.neighborhood} onChange={(e) => update("neighborhood", e.target.value)} /></div>
              <div className="pf-field"><label>Rua</label><input value={form.street} onChange={(e) => update("street", e.target.value)} /></div>
              <div className="pf-row-2">
                <div className="pf-field"><label>Número</label><input value={form.number} onChange={(e) => update("number", e.target.value)} /></div>
                <div className="pf-field"><label>Complemento (opcional)</label><input value={form.complement} onChange={(e) => update("complement", e.target.value)} /></div>
              </div>
            </div>
          </div>

          {/* Origem do pedido */}
          <div className="pf-section">
            <div className="pf-section-toggle" style={{ pointerEvents: "none" }}><span>Origem do pedido</span></div>
            <div className="pf-section-body">
              <div className="pf-field">
                <label>Origem</label>
                <select value={form.origin} onChange={(e) => update("origin", e.target.value)}>
                  <option value="">Selecione a origem</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="instagram">Instagram</option>
                  <option value="loja_fisica">Loja física</option>
                  <option value="telefone">Telefone</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
            </div>
          </div>

          {/* Anotações */}
          <div className="pf-section">
            <div className="pf-section-toggle" style={{ pointerEvents: "none" }}><span>Suas anotações</span></div>
            <div className="pf-section-body">
              <div className="pf-field">
                <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Anotações internas sobre este pedido..." rows={3} />
              </div>
            </div>
          </div>

          <div className="pf-footer">
            <button type="button" className="pf-btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="pf-btn-save" disabled={saving}>
              {saving ? "Salvando..." : "Adicionar pedido"}
            </button>
          </div>
        </form>
      </div>

      {showSelector && (
        <ProductSelector
          products={products}
          selected={selectedProducts}
          onToggle={toggleProduct}
          onClose={() => setShowSelector(false)}
        />
      )}
    </div>
  );
}
