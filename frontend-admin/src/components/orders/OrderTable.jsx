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

export function OrderTable({ orders, onDelete, onSelect, onUpdateStatus }) {
  const [draftStatus, setDraftStatus] = useState({});
  const [draftTracking, setDraftTracking] = useState({});
  const [optimisticStatus, setOptimisticStatus] = useState({});

  useEffect(() => {
    setDraftStatus(() => {
      const next = {};
      orders.forEach((order) => {
        next[order.id] = order.status || "pending";
      });
      return next;
    });
    setDraftTracking(() => {
      const next = {};
      orders.forEach((order) => {
        next[order.id] = order.trackingCode || "";
      });
      return next;
    });
    setOptimisticStatus(() => {
      const next = {};
      orders.forEach((order) => {
        next[order.id] = order.status || "pending";
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
            <th>Ações</th>
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
                  <input
                    className="order-tracking-input"
                    value={draftTracking[order.id] || ""}
                    onChange={(event) => setDraftTracking((current) => ({ ...current, [order.id]: event.target.value }))}
                    onClick={(event) => event.stopPropagation()}
                    placeholder="Rastreio Correios"
                    aria-label="Código de rastreio dos Correios"
                  />
                </div>
              </td>
              <td onClick={(event) => event.stopPropagation()}>
                <div className="order-actions">
                  <button
                    className="compact-action"
                    onClick={async () => {
                      const status = draftStatus[order.id] || order.status || "pending";
                      const trackingCode = draftTracking[order.id] || "";
                      const previousStatus = optimisticStatus[order.id] || order.status || "pending";
                      setOptimisticStatus((current) => ({ ...current, [order.id]: status }));
                      try {
                        await onUpdateStatus(order, status, trackingCode);
                      } catch (error) {
                        setOptimisticStatus((current) => ({ ...current, [order.id]: previousStatus }));
                        setDraftStatus((current) => ({ ...current, [order.id]: previousStatus }));
                        window.alert(error?.message || "Não foi possível atualizar o status do pedido.");
                      }
                    }}
                    type="button"
                  >
                    Atualizar
                  </button>
                  <button
                    className="compact-action danger-action"
                    onClick={() => onDelete?.(order)}
                    type="button"
                  >
                    Excluir
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
