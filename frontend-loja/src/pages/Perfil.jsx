import { useState, useEffect } from "react";
import { apiFetch } from "../services/api.js";

const STORAGE_KEY = "bigsmoke_customer";

function getStored() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { return null; }
}
function saveStored(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (_) {} 
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`perfil-tab${active ? " active" : ""}`}
    >
      {children}
    </button>
  );
}

function OrderCard({ order }) {
  const statusMap = {
    pending: { label: "Pendente", color: "#c9a84c" },
    paid: { label: "Pago", color: "#4caf81" },
    processing: { label: "Em separação", color: "#5c9bd1" },
    shipped: { label: "Enviado", color: "#5c9bd1" },
    delivered: { label: "Entregue", color: "#4caf81" },
    canceled: { label: "Cancelado", color: "#d15c5c" },
  };
  const st = statusMap[order.status] || { label: order.status, color: "var(--muted)" };

  return (
    <article className="perfil-order-card">
      <div className="perfil-order-head">
        <strong>{order.orderNumberFormatted || order.id?.slice(0, 8)}</strong>
        <span className="perfil-order-status" style={{ color: st.color }}>{st.label}</span>
      </div>
      <div className="perfil-order-meta">
        <span>Total: R$ {Number(order.amountTotal || 0).toFixed(2).replace(".", ",")}</span>
        {order.createdAt && (
          <span>{new Date(order.createdAt).toLocaleDateString("pt-BR")}</span>
        )}
      </div>
      {order.items?.length > 0 && (
        <div className="perfil-order-items">
          {order.items.map((item, i) => (
            <span key={i} className="perfil-order-item">
              {item.name}{item.size ? ` (${item.size})` : ""} ×{item.quantity}
            </span>
          ))}
        </div>
      )}
      {order.trackingCode && (
        <div className="perfil-tracking">
          <span>Rastreio: <strong>{order.trackingCode}</strong></span>
        </div>
      )}
    </article>
  );
}

export function Perfil() {
  const [tab, setTab] = useState("account");
  const [customer, setCustomer] = useState(getStored());
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    cpf: "",
    cep: "",
    state: "",
    city: "",
    neighborhood: "",
    street: "",
    number: "",
    complement: "",
  });
  const [saved, setSaved] = useState(false);
  const [trackingQuery, setTrackingQuery] = useState("");
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [trackingStatus, setTrackingStatus] = useState("");
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (customer) {
      setForm({
        firstName: customer.firstName || "",
        lastName: customer.lastName || "",
        email: customer.email || "",
        phone: customer.phone || "",
        cpf: customer.cpf || "",
        cep: customer.address?.cep || "",
        state: customer.address?.state || "",
        city: customer.address?.city || "",
        neighborhood: customer.address?.neighborhood || "",
        street: customer.address?.street || "",
        number: customer.address?.number || "",
        complement: customer.address?.complement || "",
      });
    }
  }, [customer]);

  function update(field, value) {
    setForm((c) => ({ ...c, [field]: value }));
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

  function saveProfile(e) {
    e.preventDefault();
    const data = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      cpf: form.cpf,
      address: {
        cep: form.cep,
        state: form.state,
        city: form.city,
        neighborhood: form.neighborhood,
        street: form.street,
        number: form.number,
        complement: form.complement,
      },
    };
    saveStored(data);
    setCustomer(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function searchOrder(e) {
    e.preventDefault();
    setTrackingStatus("");
    setTrackingOrder(null);
    try {
      const data = await apiFetch(`/api/orders/public/${encodeURIComponent(trackingQuery)}`);
      setTrackingOrder(data);
    } catch (err) {
      setTrackingStatus(err.message || "Pedido não encontrado.");
    }
  }

  async function loadMyOrders() {
    if (!customer?.email) return;
    setLoadingOrders(true);
    try {
      const data = await apiFetch(`/api/orders/public/${encodeURIComponent(customer.email)}`);
      setOrders(Array.isArray(data) ? data : [data]);
    } catch (_) {
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }

  useEffect(() => {
    if (tab === "orders") loadMyOrders();
  }, [tab]);

  const isLoggedIn = Boolean(customer?.email);

  return (
    <main className="page-shell">
      <div className="perfil-hero">
        <div className="perfil-avatar">
          {isLoggedIn
            ? (customer.firstName?.[0] || customer.email?.[0] || "B").toUpperCase()
            : "B"}
        </div>
        <div>
          <h1 className="perfil-name">
            {isLoggedIn
              ? `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "BigSmoke Member"
              : "Minha conta"}
          </h1>
          {isLoggedIn && <p className="eyebrow">{customer.email}</p>}
        </div>
      </div>

      <div className="perfil-tabs">
        <TabButton active={tab === "account"} onClick={() => setTab("account")}>Minha conta</TabButton>
        <TabButton active={tab === "orders"} onClick={() => setTab("orders")}>Meus pedidos</TabButton>
        <TabButton active={tab === "tracking"} onClick={() => setTab("tracking")}>Rastrear pedido</TabButton>
      </div>

      {/* CONTA */}
      {tab === "account" && (
        <section className="perfil-section">
          <form onSubmit={saveProfile} className="perfil-form">
            <div className="panel" style={{ marginBottom: "1.5rem" }}>
              <strong style={{ color: "var(--gold)", textTransform: "uppercase", fontSize: "0.8rem", letterSpacing: "0.1em" }}>Dados pessoais</strong>
              <div className="form-grid" style={{ marginTop: "1rem" }}>
                <div className="perfil-field">
                  <label>Nome</label>
                  <input value={form.firstName} onChange={(e) => update("firstName", e.target.value)} placeholder="Seu nome" />
                </div>
                <div className="perfil-field">
                  <label>Sobrenome</label>
                  <input value={form.lastName} onChange={(e) => update("lastName", e.target.value)} placeholder="Seu sobrenome" />
                </div>
              </div>
              <div className="perfil-field">
                <label>E-mail</label>
                <input value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="seu@email.com" type="email" />
              </div>
              <div className="form-grid">
                <div className="perfil-field">
                  <label>Telefone</label>
                  <input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+55 83 9..." />
                </div>
                <div className="perfil-field">
                  <label>CPF ou CNPJ</label>
                  <input value={form.cpf} onChange={(e) => update("cpf", e.target.value)} placeholder="000.000.000-00" />
                </div>
              </div>
            </div>

            <div className="panel">
              <strong style={{ color: "var(--gold)", textTransform: "uppercase", fontSize: "0.8rem", letterSpacing: "0.1em" }}>Endereço de entrega</strong>
              <div className="perfil-field" style={{ marginTop: "1rem" }}>
                <label>CEP</label>
                <input
                  value={form.cep}
                  onChange={(e) => { update("cep", e.target.value); lookupCep(e.target.value); }}
                  placeholder="00000-000"
                />
              </div>
              <div className="form-grid">
                <div className="perfil-field">
                  <label>Estado</label>
                  <input value={form.state} onChange={(e) => update("state", e.target.value)} />
                </div>
                <div className="perfil-field">
                  <label>Cidade</label>
                  <input value={form.city} onChange={(e) => update("city", e.target.value)} />
                </div>
              </div>
              <div className="perfil-field">
                <label>Bairro</label>
                <input value={form.neighborhood} onChange={(e) => update("neighborhood", e.target.value)} />
              </div>
              <div className="perfil-field">
                <label>Rua</label>
                <input value={form.street} onChange={(e) => update("street", e.target.value)} />
              </div>
              <div className="form-grid">
                <div className="perfil-field">
                  <label>Número</label>
                  <input value={form.number} onChange={(e) => update("number", e.target.value)} />
                </div>
                <div className="perfil-field">
                  <label>Complemento</label>
                  <input value={form.complement} onChange={(e) => update("complement", e.target.value)} placeholder="Opcional" />
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary full-width" style={{ marginTop: "1.5rem" }}>
              {saved ? "✓ Dados salvos!" : "Salvar dados"}
            </button>
            {isLoggedIn && (
              <button
                type="button"
                className="btn btn-outline full-width"
                style={{ marginTop: "0.75rem" }}
                onClick={() => { saveStored(null); localStorage.removeItem(STORAGE_KEY); setCustomer(null); setForm({ firstName:"",lastName:"",email:"",phone:"",cpf:"",cep:"",state:"",city:"",neighborhood:"",street:"",number:"",complement:"" }); }}
              >
                Sair da conta
              </button>
            )}
          </form>
        </section>
      )}

      {/* MEUS PEDIDOS */}
      {tab === "orders" && (
        <section className="perfil-section">
          {!isLoggedIn ? (
            <div className="panel" style={{ textAlign: "center" }}>
              <p>Para ver seus pedidos, salve seu e-mail na aba <strong>Minha conta</strong>.</p>
              <button className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={() => setTab("account")}>
                Completar cadastro
              </button>
            </div>
          ) : loadingOrders ? (
            <div className="panel"><p>Carregando...</p></div>
          ) : orders.length === 0 ? (
            <div className="panel" style={{ textAlign: "center" }}>
              <p>Nenhum pedido encontrado para <strong>{customer.email}</strong>.</p>
              <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Use a aba de rastreamento para buscar pelo código do pedido.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "1rem" }}>
              {orders.map((o) => <OrderCard key={o.id} order={o} />)}
            </div>
          )}
        </section>
      )}

      {/* RASTREAR */}
      {tab === "tracking" && (
        <section className="perfil-section">
          <div className="panel">
            <h2 style={{ margin: "0 0 1rem", font: "400 2rem 'Bebas Neue', sans-serif" }}>Rastrear pedido</h2>
            <p style={{ color: "var(--muted)" }}>Digite o número, código de acesso ou e-mail do pedido.</p>
            <form className="tracking-search" onSubmit={searchOrder} style={{ marginTop: "1rem" }}>
              <input
                value={trackingQuery}
                onChange={(e) => setTrackingQuery(e.target.value)}
                placeholder="#00001, código ou e-mail"
              />
              <button className="btn btn-primary" type="submit">Buscar</button>
            </form>
            {trackingStatus && <p className="form-status">{trackingStatus}</p>}
            {trackingOrder && <OrderCard order={trackingOrder} />}
          </div>
        </section>
      )}
    </main>
  );
}
