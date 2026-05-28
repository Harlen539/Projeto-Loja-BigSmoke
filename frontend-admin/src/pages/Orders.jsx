import { useMemo, useState } from "react";

import { ManualOrder } from "../components/orders/ManualOrder.jsx";
import { OrderDetail } from "../components/orders/OrderDetail.jsx";
import { OrderStatusBadge } from "../components/orders/OrderStatusBadge.jsx";
import { OrderTable } from "../components/orders/OrderTable.jsx";
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

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function orderTotal(order) {
  return Number(order.amountTotal || order.total || order.totalAmount || 0);
}

function orderCustomer(order) {
  return order.customer?.name || order.customerName || "Cliente";
}

function formatOrderDate(value) {
  if (!value) return "Agora";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Agora";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function isToday(value) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);
}

function Icon({ name }) {
  const icons = {
    bag: <><path d="M6 8h12l1 13H5L6 8Z" /><path d="M9 8a3 3 0 0 1 6 0" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h5" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    revenue: <><circle cx="12" cy="12" r="8" /><path d="M12 7v10M15 9.2h-4a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H9" /></>,
    search: <><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">{icons[name]}</svg>;
}

function BigSmokeBagIcon() {
  return (
    <svg className="bigsmoke-bag-icon" aria-hidden="true" viewBox="0 0 96 96" fill="none">
      <path className="bag-shell" d="M21 32h54l5 43.5C81 82.8 75.7 88 68.5 88h-41C20.3 88 15 82.8 16 75.5L21 32Z" />
      <path className="bag-lid" d="M24 32 33.5 18h29L72 32" />
      <path className="bag-lip" d="M21 32h54" />
      <path className="bag-handle" d="M35 42c3 15 12.5 23 26 0" />
      <circle className="bag-ring" cx="35" cy="42" r="4.5" />
      <circle className="bag-ring" cx="61" cy="42" r="4.5" />
      <path className="bag-logo" d="M42 58v18l15-10-8-7 9-7V70M42 58l13 10M42 76l18-24" />
    </svg>
  );
}

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
    window.dispatchEvent(new Event("bigsmoke-admin-data-updated"));
    setSelectedOrder((current) => (current?.id === order.id ? updated : current));
  }

  async function updateOrder(order, patch) {
    await apiFetch(`/api/admin/orders/${order.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(patch),
    });
    await reload();
    window.dispatchEvent(new Event("bigsmoke-admin-data-updated"));
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
    window.dispatchEvent(new Event("bigsmoke-admin-data-updated"));
    setSelectedOrder((current) => (current?.id === order.id ? null : current));
  }

  const filtered = orders.filter((order) => {
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && (order.status === "pending" || order.status === "paid") && !order.hiddenInAdmin) ||
      (statusFilter === "processing" && order.status === "processing") ||
      (statusFilter === "shipped" && order.status === "shipped") ||
      (statusFilter === "delivered" && order.status === "delivered") ||
      (statusFilter === "canceled" && order.status === "canceled");
    const needle = search.toLowerCase();
    const hay = `${order.orderNumberFormatted || ""} ${order.customer?.name || ""} ${order.customer?.email || ""} ${order.id || ""}`.toLowerCase();
    return matchStatus && (!needle || hay.includes(needle));
  });

  const counts = {
    all: orders.length,
    pending: orders.filter((order) => order.status === "pending" || order.status === "paid").length,
    processing: orders.filter((order) => order.status === "processing").length,
    shipped: orders.filter((order) => order.status === "shipped").length,
    delivered: orders.filter((order) => order.status === "delivered").length,
    canceled: orders.filter((order) => order.status === "canceled").length,
  };
  const todayOrders = useMemo(() => orders.filter((order) => isToday(order.createdAt || order.updatedAt)), [orders]);
  const todayRevenue = todayOrders.reduce((sum, order) => sum + orderTotal(order), 0);

  return (
    <main className="page admin-orders-page">
      <div className="page-head admin-page-head">
        <h2>Pedidos</h2>
        <button className="btn-manual-order admin-primary-button" onClick={() => setShowManual(true)} type="button">
          <Icon name="plus" />
          Novo pedido manual
        </button>
      </div>

      <div className="orders-toolbar admin-controls">
        <label className="admin-search-bar">
          <Icon name="search" />
          <input
            placeholder="Buscar pedido, cliente ou código..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            type="search"
          />
        </label>

        <section className="admin-summary-grid orders-summary-grid" aria-label="Resumo de pedidos">
          <article className="admin-summary-card">
            <span className="summary-icon cyan"><Icon name="bag" /></span>
            <small>Pedidos hoje</small>
            <strong>{todayOrders.length}</strong>
            <em>0% vs ontem</em>
          </article>
          <article className="admin-summary-card">
            <span className="summary-icon yellow"><Icon name="clock" /></span>
            <small>Pendentes</small>
            <strong>{counts.pending}</strong>
            <em>Ver todos</em>
          </article>
          <article className="admin-summary-card">
            <span className="summary-icon green"><Icon name="revenue" /></span>
            <small>Receita hoje</small>
            <strong>{money(todayRevenue)}</strong>
            <em>0% vs ontem</em>
          </article>
        </section>

        <div className="orders-status-tabs">
          {STATUS_FILTERS.map((filter) => (
            <button
              className={`orders-tab${statusFilter === filter.key ? " active" : ""}`}
              key={filter.key}
              onClick={() => setStatusFilter(filter.key)}
              type="button"
            >
              {filter.label}
              {counts[filter.key] > 0 ? <span className="orders-tab-count">{counts[filter.key]}</span> : null}
            </button>
          ))}
        </div>
      </div>

      {filtered.length ? (
        <section className="admin-order-card-list">
          {filtered.map((order) => (
            <button className="admin-order-card" key={order.id || order.orderNumberFormatted} onClick={() => setSelectedOrder(order)} type="button">
              <span className="summary-icon cyan"><Icon name="file" /></span>
              <span>
                <strong>{order.orderNumberFormatted || `#${String(order.id || "").slice(0, 8)}`}</strong>
                <small>{orderCustomer(order)}</small>
              </span>
              <span className="admin-order-side">
                <b>{money(orderTotal(order))}</b>
                <small>{formatOrderDate(order.createdAt || order.updatedAt)}</small>
              </span>
              <OrderStatusBadge status={order.status} />
              <Icon name="chevron" />
            </button>
          ))}
        </section>
      ) : (
        <section className="admin-empty-card admin-empty-large">
          <span className="empty-illustration bigsmoke-bag-mark"><BigSmokeBagIcon /></span>
          <strong>Nenhum pedido encontrado</strong>
          <span>Parece que ainda não existem pedidos com os filtros selecionados.</span>
          <button className="admin-primary-button" onClick={() => setShowManual(true)} type="button">
            <Icon name="file" />
            Criar pedido manual
          </button>
        </section>
      )}

      <div className="admin-desktop-table">
        <OrderTable
          orders={filtered}
          onDelete={deleteOrder}
          onSelect={setSelectedOrder}
          onUpdateStatus={updateStatus}
        />
      </div>

      {selectedOrder ? (
        <OrderDetail
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdate={updateOrder}
        />
      ) : null}

      {showManual ? (
        <ManualOrder
          onClose={() => setShowManual(false)}
          onSuccess={() => {
            setShowManual(false);
            reload();
            window.dispatchEvent(new Event("bigsmoke-admin-data-updated"));
          }}
          token={token}
        />
      ) : null}
    </main>
  );
}
