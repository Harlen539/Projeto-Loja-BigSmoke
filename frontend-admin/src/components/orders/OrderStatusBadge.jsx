export function OrderStatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}>{status || "pending"}</span>;
}
