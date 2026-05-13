import { useState } from "react";
import { OrderTable } from "../components/orders/OrderTable.jsx";
import { OrderDetail } from "../components/orders/OrderDetail.jsx";
import { ManualOrder } from "../components/orders/ManualOrder.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useOrders } from "../hooks/useOrders.js";
import { apiFetch } from "../services/api.js";

const STATUS_FILTERS = [
  { key: "all", label: "Todos" },
  { key: "pending", label: "Por cobrar" },
  { key: "processing", label: "Por embalar" },
  { key: "shipped", label: "Por enviar" },
  { key: "delivered", label: "Entregues" },
  { key: "canceled", label: "Cancelados" },
];

export function Orders() {
  const { token } = useAuth();
  const { orders, reload } = useOrders();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showManual, setShowManual] = useState(false);

  async function updateStatus(order, status, trackingCode = order.trackingCode || "") {
    const updated = await apiFetch(`/api/admin/orders/${order.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status, trackingCode }),
    });
    await reload();
    setSelectedOrder((current) => (current?.id === order.id ? updated : current));
  }

  async function updateOrder(order, patch) {
    await apiFetch(`/api/admin/orders/${order.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(patch),
    });
    await reload();
    setSelectedOrder(null);
  }

  async function deleteOrder(order) {
    const label = order.orderNumberFormatted || order.id?.slice(0, 8) || "este pedido";
    if (!window.confirm(`Excluir ${label}? Essa ação não pode ser desfeita.`)) return;

    await apiFetch(`/api/admin/orders/${order.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    await reload();
    setSelectedOrder((current) => (current?.id === order.id ? null : current));
  }

  const filtered = orders.filter((o) => {
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && (o.status === "pending" || o.status === "paid") && !o.hiddenInAdmin) ||
      (statusFilter === "processing" && o.status === "processing") ||
      (statusFilter === "shipped" && o.status === "shipped") ||
      (statusFilter === "delivered" && o.status === "delivered") ||
      (statusFilter === "canceled" && o.status === "canceled");
    const needle = search.toLowerCase();
    const hay = `${o.orderNumberFormatted || ""} ${o.customer?.name || ""} ${o.customer?.email || ""} ${o.id || ""}`.toLowerCase();
    return matchStatus && (!needle || hay.includes(needle));
  });

  // Count per filter
  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending" || o.status === "paid").length,
    processing: orders.filter((o) => o.status === "processing").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    canceled: orders.filter((o) => o.status === "canceled").length,
  };

  return (
    <main className="page">
      <div className="page-head">
        <h2>Pedidos</h2>
        <button
          type="button"
          className="btn-manual-order"
          onClick={() => setShowManual(true)}
        >
          + Novo pedido manual
        </button>
      </div>

      <div className="orders-toolbar">
        <input
          className="orders-search"
          placeholder="Buscar"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          type="search"
        />
        <div className="orders-status-tabs">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`orders-tab${statusFilter === f.key ? " active" : ""}`}
              onClick={() => setStatusFilter(f.key)}
            >
              {f.label}
              {counts[f.key] > 0 && (
                <span className="orders-tab-count">{counts[f.key]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <OrderTable
        orders={filtered}
        onDelete={deleteOrder}
        onSelect={setSelectedOrder}
        onUpdateStatus={updateStatus}
      />

      {selectedOrder && (
        <OrderDetail
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdate={updateOrder}
        />
      )}

      {showManual && (
        <ManualOrder
          onClose={() => setShowManual(false)}
          onSuccess={() => { setShowManual(false); reload(); }}
          token={token}
        />
      )}
    </main>
  );
}
