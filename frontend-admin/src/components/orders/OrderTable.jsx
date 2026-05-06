import { useEffect, useState } from "react";

import { OrderStatusBadge } from "./OrderStatusBadge.jsx";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pendente" },
  { value: "paid", label: "Pago" },
  { value: "processing", label: "Embalado" },
  { value: "shipped", label: "Enviado" },
  { value: "delivered", label: "Entregue" },
  { value: "canceled", label: "Cancelado" },
];

export function OrderTable({ orders, onSelect, onUpdateStatus }) {
  const [draftStatus, setDraftStatus] = useState({});
  const [optimisticStatus, setOptimisticStatus] = useState({});

  useEffect(() => {
    setDraftStatus((current) => {
      const next = {};
      orders.forEach((order) => {
        next[order.id] = current[order.id] || order.status || "pending";
      });
      return next;
    });
    setOptimisticStatus((current) => {
      const next = {};
      orders.forEach((order) => {
        next[order.id] = current[order.id] || order.status || "pending";
      });
      return next;
    });
  }, [orders]);

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
            <tr key={order.id} className="order-row" onClick={() => onSelect?.({ ...order, status: optimisticStatus[order.id] || order.status })} style={{ cursor: "pointer" }}>
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
                  <OrderStatusBadge status={optimisticStatus[order.id] || order.status} />
                  {order.hiddenInAdmin && <span className="status-badge status-muted">Arquivada</span>}
                  <select
                    className="order-status-select"
                    value={draftStatus[order.id] || order.status || "pending"}
                    onChange={(event) => setDraftStatus((current) => ({ ...current, [order.id]: event.target.value }))}
                    onClick={(event) => event.stopPropagation()}
                    aria-label="Alterar status do pedido"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </td>
              <td onClick={(event) => event.stopPropagation()}>
                <button
                  className="compact-action"
                  onClick={async () => {
                    const status = draftStatus[order.id] || order.status || "pending";
                    setOptimisticStatus((current) => ({ ...current, [order.id]: status }));
                    await onUpdateStatus(order, status);
                  }}
                  type="button"
                >
                  Atualizar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
