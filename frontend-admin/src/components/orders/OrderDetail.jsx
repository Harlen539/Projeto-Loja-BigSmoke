import { useState } from "react";
import { OrderStatusBadge } from "./OrderStatusBadge.jsx";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pagamento não realizado", icon: "☐", desc: "Quero deixar o estoque sem alterações." },
  { value: "paid", label: "Pagamento pendente", icon: "$", desc: "Ainda não recebi o dinheiro, mas quero reservar o estoque para meu cliente." },
  { value: "processing", label: "Pagamento recebido", icon: "✓", desc: "Tudo certo! Já recebi o dinheiro e quero descontar o produto do meu estoque." },
  { value: "shipped", label: "Enviado", icon: "🚚", desc: "Produto enviado para o cliente." },
  { value: "delivered", label: "Entregue", icon: "✅", desc: "Produto entregue com sucesso." },
];

const EVENTS_LABELS = {
  "admin.order.updated": "Status atualizado",
  "admin.order.reset": "Pedido redefinido",
  "checkout.session.completed": "Pagamento recebido",
  "checkout.session.expired": "Sessão expirada",
};

export function OrderDetail({ order, onClose, onUpdate }) {
  const [status, setStatus] = useState(order.status || "pending");
  const [trackingCode, setTrackingCode] = useState(order.trackingCode || "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await onUpdate(order, { status, trackingCode });
    } finally {
      setSaving(false);
    }
  }

  const events = [
    ...(order.events || []).map((e) => ({
      label: EVENTS_LABELS[e.type] || e.type,
      date: e.created,
      icon: "●",
      color: "var(--gold)",
    })),
  ].reverse();

  return (
    <div className="od-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="od-drawer">
        <div className="od-header">
          <div>
            <h2>{order.orderNumberFormatted || order.id?.slice(0, 8)}</h2>
            <OrderStatusBadge status={order.status} />
            {order.hiddenInAdmin && <span className="status-badge" style={{ marginLeft: "0.35rem", fontSize: "0.75rem" }}>Arquivada</span>}
          </div>
          <button className="pf-close" type="button" onClick={onClose}>✕</button>
        </div>

        <div className="od-body">
          {/* Itens */}
          {order.items?.length > 0 && (
            <div className="od-section">
              <h3>#{1} <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: "0.9rem" }}>{order.items.length} unidade(s)</span></h3>
              {order.items.map((item, i) => (
                <div key={i} className="od-item">
                  {item.image && <img src={item.image} alt={item.name} />}
                  <div className="od-item-info">
                    <strong>{item.name}</strong>
                    {item.size && <span className="od-item-size">Tam {item.size}</span>}
                    <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{item.quantity}x R$ {Number(item.price || 0).toFixed(2).replace(".", ",")}</span>
                  </div>
                  <span className="od-item-total">R$ {(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2).replace(".", ",")}</span>
                </div>
              ))}
            </div>
          )}

          {/* Pagamento */}
          <div className="od-section od-payment">
            <div className="od-row"><span>Subtotal</span><span>R$ {Number(order.amountSubtotal || 0).toFixed(2).replace(".", ",")}</span></div>
            <div className="od-row"><span>Envio</span><span>R$ {Number(order.shippingAmount || 0).toFixed(2).replace(".", ",")}</span></div>
            <div className="od-row od-total"><span>Total</span><span>R$ {Number(order.amountTotal || 0).toFixed(2).replace(".", ",")}</span></div>
          </div>

          {/* Estado do pedido */}
          <div className="od-section">
            <h3>Estado do pedido</h3>
            <div className="od-status-list">
              {STATUS_OPTIONS.map((opt) => (
                <label key={opt.value} className={`od-status-option${status === opt.value ? " active" : ""}`}>
                  <div className="od-status-icon">{opt.icon}</div>
                  <div className="od-status-text">
                    <strong>{opt.label}</strong>
                    <span>{opt.desc}</span>
                  </div>
                  <input type="radio" name="orderStatus" value={opt.value} checked={status === opt.value} onChange={() => setStatus(opt.value)} />
                </label>
              ))}
            </div>
          </div>

          {/* Código de rastreio */}
          <div className="od-section">
            <h3>Rastreamento</h3>
            <div className="pf-field">
              <label>Código de rastreio</label>
              <input value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} placeholder="Ex: BR123456789BR" />
            </div>
          </div>

          {/* Endereço de entrega */}
          {order.address?.city && (
            <div className="od-section od-address">
              <h3>Endereço de entrega e cobrança</h3>
              <p><strong>{order.customer?.name}</strong></p>
              {order.customer?.phone && <p>{order.customer.phone}</p>}
              <p>
                {order.address.street && `Endereço: ${order.address.street}, ${order.address.number}`}
                {order.address.neighborhood && <><br />Bairro: {order.address.neighborhood}</>}
                {order.address.cep && <><br />CEP: {order.address.cep}</>}
                {order.address.city && <><br />Cidade: {order.address.city}</>}
                {order.address.state && <><br />Estado: {order.address.state}</>}
                <br />País: BR
              </p>
            </div>
          )}

          {/* Histórico */}
          {events.length > 0 && (
            <div className="od-section">
              <h3>Histórico</h3>
              <div className="od-timeline">
                {events.map((ev, i) => (
                  <div key={i} className="od-timeline-item">
                    <div className="od-timeline-dot" style={{ background: ev.color || "var(--muted)" }} />
                    <div className="od-timeline-content">
                      <strong>{ev.label}</strong>
                      {ev.date && (
                        <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
                          {new Date(ev.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                          {" "}{new Date(ev.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="od-footer">
          <button type="button" className="pf-btn-cancel" onClick={onClose}>Cancelar</button>
          <button type="button" className="pf-btn-save" onClick={save} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
