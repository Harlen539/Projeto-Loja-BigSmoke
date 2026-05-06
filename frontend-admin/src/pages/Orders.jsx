import { useState } from "react";
import { OrderTable } from "../components/orders/OrderTable.jsx";
import { OrderDetail } from "../components/orders/OrderDetail.jsx";
import { ManualOrder } from "../components/orders/ManualOrder.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useOrders } from "../hooks/useOrders.js";
import { apiFetch } from "../services/api.js";

const flow = ["pending", "paid", "processing", "shipped", "delivered"];

const STATUS_FILTERS = [
  { key: "all", label: "Todos" },
  { key: "pending", label: "Por cobrar" },
  { key: "processing", label: "Por embalar" },
  { key: "shipped", label: "Por enviar" },
  { key: "delivered", label: "Entregues" },
];

export function Orders() {
  const { token } = useAuth();
  const { orders, reload } = useOrders();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showManual, setShowManual] = useState(false);

  async function advance(order) {
    const index = flow.indexOf(order.status);
    const status = flow[Math.min(index + 1, flow.length - 1)] || "processing";
    await apiFetch(`/api/admin/orders/${order.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    await reload();
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

  const filtered = orders.filter((o) => {
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && (o.status === "pending" || o.status === "paid") && !o.hiddenInAdmin) ||
      (statusFilter === "processing" && o.status === "processing") ||
      (statusFilter === "shipped" && o.status === "shipped") ||
      (statusFilter === "delivered" && o.status === "delivered");
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
        onAdvance={advance}
        onSelect={setSelectedOrder}
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
