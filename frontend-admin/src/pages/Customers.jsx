import { useMemo, useState } from "react";

import { OrderStatusBadge } from "../components/orders/OrderStatusBadge.jsx";
import { useOrders } from "../hooks/useOrders.js";

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function keyFor(order) {
  return String(order.customer?.email || order.customer?.phone || order.customer?.name || "cliente").toLowerCase();
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

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <p className="section-kicker">Relacionamento</p>
          <h2>Clientes</h2>
        </div>
        <input className="orders-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cliente" type="search" />
      </div>

      <section className="stats-grid">
        <article className="stat-card"><span>Clientes</span><strong>{customers.length}</strong></article>
        <article className="stat-card"><span>Pedidos</span><strong>{orders.length}</strong></article>
        <article className="stat-card"><span>Receita</span><strong>{money(customers.reduce((sum, item) => sum + item.total, 0))}</strong></article>
        <article className="stat-card"><span>Ticket cliente</span><strong>{money(customers.length ? customers.reduce((sum, item) => sum + item.total, 0) / customers.length : 0)}</strong></article>
      </section>

      <div className="table-card">
        <table>
          <thead>
            <tr><th>Cliente</th><th>Contato</th><th>Pedidos</th><th>Total</th><th>Ultimo status</th></tr>
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
