import { OrderStatusBadge } from "./OrderStatusBadge.jsx";

export function OrderTable({ orders, onAdvance, onSelect }) {
  if (!orders.length) {
    return (
      <div className="table-card empty-state">
        <p>Nenhum pedido encontrado.</p>
      </div>
    );
  }

  return (
    <div className="table-card">
      <table>
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Data</th>
            <th>Cliente</th>
            <th>Total</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="order-row" onClick={() => onSelect && onSelect(order)} style={{ cursor: "pointer" }}>
              <td>
                <strong>{order.orderNumberFormatted || order.id?.slice(0, 8)}</strong>
              </td>
              <td style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) +
                    " - " +
                    new Date(order.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                  : "—"}
              </td>
              <td>{order.customer?.name || "Cliente"}</td>
              <td>R$ {Number(order.amountTotal || 0).toFixed(2).replace(".", ",")}</td>
              <td>
                <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                  <OrderStatusBadge status={order.status} />
                  {order.hiddenInAdmin && <span className="status-badge" style={{ background: "rgba(255,255,255,0.06)", fontSize: "0.75rem" }}>Arquivada</span>}
                </div>
              </td>
              <td onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onAdvance(order)}
                  type="button"
                  style={{ fontSize: "0.8rem", padding: "0.35rem 0.7rem" }}
                >
                  Avançar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
