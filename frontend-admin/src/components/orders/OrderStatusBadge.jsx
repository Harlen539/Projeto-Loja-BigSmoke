export const ORDER_STATUS = {
  pending: { label: "Pendente", tone: "warning" },
  pending_payment: { label: "Aguardando pagamento", tone: "warning" },
  paid: { label: "Pago", tone: "success" },
  processing: { label: "Em separacao", tone: "info" },
  shipped: { label: "Enviado", tone: "success" },
  fulfilled: { label: "Enviado", tone: "success" },
  delivered: { label: "Entregue", tone: "success" },
  canceled: { label: "Cancelado", tone: "danger" },
  cancelled: { label: "Cancelado", tone: "danger" },
  refunded: { label: "Reembolsado", tone: "danger" },
};

export function getOrderStatusInfo(status) {
  const key = String(status || "pending").toLowerCase();
  return ORDER_STATUS[key] || { label: "Pendente", tone: "warning" };
}

export function OrderStatusBadge({ status }) {
  const info = getOrderStatusInfo(status);
  return <span className={`status-badge status-${info.tone}`}>{info.label}</span>;
}
