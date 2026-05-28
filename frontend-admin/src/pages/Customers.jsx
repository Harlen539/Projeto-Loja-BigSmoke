import { useMemo, useState } from "react";

import { OrderStatusBadge } from "../components/orders/OrderStatusBadge.jsx";
import { useOrders } from "../hooks/useOrders.js";

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function keyFor(order) {
  return String(order.customer?.email || order.customer?.phone || order.customer?.name || "cliente").toLowerCase();
}

function Icon({ name }) {
  const icons = {
    filter: <><path d="M3 5h18l-7 8v5l-4 2v-7L3 5Z" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    search: <><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /></>,
    bag: <><path d="M6 8h12l1 13H5L6 8Z" /><path d="M9 8a3 3 0 0 1 6 0" /></>,
    revenue: <><circle cx="12" cy="12" r="8" /><path d="M12 7v10M15 9.2h-4a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H9" /></>,
    ticket: <><path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z" /><path d="M9 9h.01M15 15h.01M15 9l-6 6" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">{icons[name]}</svg>;
}

function CustomerMetric({ icon, title, value, tone = "cyan" }) {
  return (
    <article className="admin-summary-card customer-metric-card">
      <span className={`summary-icon ${tone}`}><Icon name={icon} /></span>
      <small>{title}</small>
      <strong>{value}</strong>
      <em>0% vs mês anterior</em>
    </article>
  );
}

export function Customers() {
  const { orders } = useOrders();
  const [query, setQuery] = useState("");

  const customers = useMemo(() => {
    const map = new Map();
    orders.forEach((order) => {
      const key = keyFor(order);
      const current = map.get(key) || {
        key,
        name: order.customer?.name || "Cliente",
        email: order.customer?.email || "",
        phone: order.customer?.phone || "",
        orders: 0,
        total: 0,
        lastOrder: order,
      };
      current.orders += 1;
      current.total += Number(order.amountTotal || order.total || 0);
      if (new Date(order.createdAt || 0) > new Date(current.lastOrder?.createdAt || 0)) {
        current.lastOrder = order;
      }
      map.set(key, current);
    });
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [orders]);

  const filtered = customers.filter((customer) => {
    const needle = query.toLowerCase();
    return !needle || `${customer.name} ${customer.email} ${customer.phone}`.toLowerCase().includes(needle);
  });
  const totalRevenue = customers.reduce((sum, item) => sum + item.total, 0);

  return (
    <main className="page admin-customers-page">
      <div className="page-head admin-page-head customers-head">
        <div>
          <p className="section-kicker">Relacionamento</p>
          <h2>Clientes</h2>
          <span>Gerencie seus clientes e acompanhe seus resultados em tempo real.</span>
        </div>
      </div>

      <section className="admin-controls customers-controls">
        <label className="admin-search-bar">
          <Icon name="search" />
          <input className="orders-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cliente..." type="search" />
        </label>
        <button className="admin-filter-button" type="button" aria-label="Filtrar clientes">
          <Icon name="filter" />
        </button>
      </section>

      <section className="admin-summary-grid customers-metrics-grid">
        <CustomerMetric icon="users" title="Clientes" value={customers.length} />
        <CustomerMetric icon="bag" title="Pedidos" value={orders.length} tone="purple" />
        <CustomerMetric icon="revenue" title="Receita" value={money(totalRevenue)} tone="green" />
        <CustomerMetric icon="ticket" title="Ticket médio" value={money(customers.length ? totalRevenue / customers.length : 0)} tone="yellow" />
      </section>

      {filtered.length ? (
        <section className="admin-customer-card-list">
          {filtered.map((customer) => (
            <article className="admin-customer-card" key={customer.key}>
              <span className="summary-icon cyan"><Icon name="users" /></span>
              <div>
                <strong>{customer.name}</strong>
                <small>{customer.email || customer.phone || "Contato não informado"}</small>
              </div>
              <div className="admin-customer-meta">
                <span>{customer.orders} pedido{customer.orders === 1 ? "" : "s"}</span>
                <b>{money(customer.total)}</b>
              </div>
              <OrderStatusBadge status={customer.lastOrder?.status} />
            </article>
          ))}
        </section>
      ) : (
        <section className="admin-empty-card admin-empty-large">
          <span className="empty-illustration"><Icon name="users" /></span>
          <strong>Nenhum cliente cadastrado ainda.</strong>
          <span>Comece adicionando seu primeiro cliente.</span>
          <button className="admin-primary-button" type="button">
            <Icon name="plus" />
            Novo cliente
          </button>
        </section>
      )}

      <div className="table-card admin-desktop-table customers-table">
        <table>
          <thead>
            <tr><th>Cliente</th><th>Contato</th><th>Pedidos</th><th>Total</th><th>Último status</th></tr>
          </thead>
          <tbody>
            {filtered.map((customer) => (
              <tr key={customer.key}>
                <td><strong>{customer.name}</strong></td>
                <td><span>{customer.email || "-"}</span><br /><small className="muted-cell">{customer.phone || "-"}</small></td>
                <td>{customer.orders}</td>
                <td>{money(customer.total)}</td>
                <td><OrderStatusBadge status={customer.lastOrder?.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
