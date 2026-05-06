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
            <th>Acoes</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="order-row" onClick={() => onSelect?.(order)} style={{ cursor: "pointer" }}>
              <td><strong>{order.orderNumberFormatted || order.id?.slice(0, 8)}</strong></td>
              <td className="muted-cell">
                {order.createdAt
                  ? `${new Date(order.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} - ${new Date(order.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                  : "-"}
              </td>
              <td>{order.customer?.name || "Cliente"}</td>
              <td>R$ {Number(order.amountTotal || 0).toFixed(2).replace(".", ",")}</td>
              <td>
                <div className="status-stack">
                  <OrderStatusBadge status={order.status} />
                  {order.hiddenInAdmin && <span className="status-badge status-muted">Arquivada</span>}
                </div>
              </td>
              <td onClick={(event) => event.stopPropagation()}>
                <button className="compact-action" onClick={() => onAdvance(order)} type="button">
                  Avancar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
