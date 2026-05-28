import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import logo from "../assets/logo_sem_fundo.png";
import { OrderStatusBadge } from "../components/orders/OrderStatusBadge.jsx";
import { useOrders } from "../hooks/useOrders.js";
import { useProducts } from "../hooks/useProducts.js";
import { getStoreUrl } from "../services/storeUrl.js";

const paidStatuses = ["paid", "processing", "shipped", "fulfilled", "delivered"];
const categoryColors = ["#22d3ee", "#4ade80", "#facc15", "#a78bfa", "#fb7185", "#fb923c"];
const tooltipStyle = {
  background: "#f5f0e8",
  border: "1px solid rgba(245,240,232,.55)",
  borderRadius: "10px",
  color: "#070707",
  boxShadow: "0 18px 38px rgba(0,0,0,.35)",
};

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function orderTotal(order) {
  return Number(order.amountTotal || order.total || order.totalAmount || 0);
}

function productImage(product) {
  return product?.image || product?.image_url || (Array.isArray(product?.images) ? product.images[0] : "") || logo;
}

function orderImage(order) {
  const items = order.items || order.products || order.orderItems || [];
  const first = Array.isArray(items) ? items[0] : null;
  return productImage(first?.product || first || {});
}

function orderCustomer(order) {
  return order.customer?.name || order.customerName || order.name || "Cliente";
}

function formatDate(value) {
  if (!value) return "Agora";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Agora";
  return date.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function filterByRange(items, range) {
  if (range === "today") {
    const today = new Date().toISOString().slice(0, 10);
    return items.filter((item) => new Date(item.createdAt || item.updatedAt || 0).toISOString().slice(0, 10) === today);
  }
  if (range === "month") {
    const now = new Date();
    return items.filter((item) => {
      const date = new Date(item.createdAt || item.updatedAt || 0);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
  }
  const days = Number(range);
  if (!days) return items;
  const min = new Date();
  min.setDate(min.getDate() - days);
  return items.filter((item) => new Date(item.createdAt || item.updatedAt || 0) >= min);
}

function buildDailySeries(orders, range) {
  const days = range === "today" ? 1 : range === "month" ? new Date().getDate() : Number(range) || 7;
  const labels = Array.from({ length: Math.min(days, 14) }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (Math.min(days, 14) - 1 - index));
    const key = date.toISOString().slice(0, 10);
    return {
      key,
      name: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      receita: 0,
      pedidos: 0,
    };
  });
  const byDay = new Map(labels.map((item) => [item.key, item]));

  orders.forEach((order) => {
    const date = new Date(order.createdAt || order.updatedAt || Date.now());
    const key = date.toISOString().slice(0, 10);
    const item = byDay.get(key);
    if (!item) return;
    item.receita += orderTotal(order);
    item.pedidos += 1;
  });

  return labels;
}

function normalizeCategory(category) {
  const value = String(category || "Sem categoria").trim();
  const lower = value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (lower.includes("bone")) return "Bonés";
  if (lower.includes("moletom")) return "Moletons";
  if (lower.includes("camiseta") || lower.includes("shirt")) return "Camisetas";
  if (lower.includes("acessor")) return "Acessórios";
  return value || "Sem categoria";
}

function Icon({ name }) {
  const icons = {
    revenue: <><circle cx="12" cy="12" r="8" /><path d="M12 7v10M15 9.2h-4a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H9" /></>,
    paid: <><rect x="6" y="5" width="12" height="16" rx="2" /><path d="M9 5V3h6v2M9.5 13l2 2 3.5-5" /></>,
    ticket: <><path d="M5 8.5 16.8 5l2.2 7.5-11.8 3.5L5 8.5Z" /><path d="m9 10 6-1.8" /></>,
    conversion: <><path d="M19 5 5 19" /><circle cx="7" cy="7" r="2" /><circle cx="17" cy="17" r="2" /></>,
    box: <><path d="m21 8-9-5-9 5 9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8M12 13v8" /></>,
    active: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
    search: <><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
    external: <><path d="M14 3h7v7" /><path d="M10 14 21 3" /><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">{icons[name]}</svg>;
}

function AdminSearchBar() {
  return (
    <label className="admin-search-bar">
      <Icon name="search" />
      <input placeholder="Buscar produtos, pedidos ou clientes..." type="search" />
    </label>
  );
}

function PeriodFilter({ value, onChange }) {
  return (
    <label className="period-filter">
      <Icon name="calendar" />
      <select value={value} onChange={(event) => onChange(event.target.value)} aria-label="Período do dashboard">
        <option value="today">Hoje</option>
        <option value="7">Últimos 7 dias</option>
        <option value="30">Últimos 30 dias</option>
        <option value="month">Este mês</option>
      </select>
    </label>
  );
}

function MetricCard({ icon, title, value, subtext, tone = "default", onClick }) {
  return (
    <button className={`metric-card-v2 ${tone}`} onClick={onClick} type="button">
      <span className="metric-icon"><Icon name={icon} /></span>
      <span className="metric-title">{title}</span>
      <strong>{value}</strong>
      <small>{subtext}</small>
    </button>
  );
}

function DashboardChartCard({ title, action, children }) {
  return (
    <article className="dashboard-chart-card">
      <div className="dashboard-card-head">
        <h3>{title}</h3>
        {action}
      </div>
      {children}
    </article>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="dashboard-empty-state">
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

function RecentOrderCard({ order }) {
  return (
    <article className="recent-order-card">
      <img src={orderImage(order)} alt="" onError={(event) => { event.currentTarget.src = logo; }} />
      <div className="recent-order-main">
        <strong>{order.orderNumberFormatted || `#${String(order.id || "").slice(0, 6) || "0000"}`}</strong>
        <span>{orderCustomer(order)}</span>
        <small>{formatDate(order.createdAt || order.updatedAt)}</small>
      </div>
      <div className="recent-order-side">
        <strong>{money(orderTotal(order))}</strong>
        <OrderStatusBadge status={order.status} />
      </div>
    </article>
  );
}

function StockAlertCard({ product, onRestock }) {
  const stock = Number(product.stock || 0);
  return (
    <article className="stock-alert-card">
      <img src={productImage(product)} alt="" onError={(event) => { event.currentTarget.src = logo; }} />
      <div>
        <strong>{product.name || "Produto"}</strong>
        <span>Estoque baixo</span>
        <small>{stock} restantes</small>
      </div>
      <button onClick={onRestock} type="button">Repor estoque</button>
    </article>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { orders } = useOrders();
  const [range, setRange] = useState("7");
  const [chartMetric, setChartMetric] = useState("receita");

  const filteredOrders = useMemo(() => filterByRange(orders, range), [orders, range]);
  const paid = filteredOrders.filter((order) => paidStatuses.includes(String(order.status || "").toLowerCase()));
  const revenue = paid.reduce((sum, order) => sum + orderTotal(order), 0);
  const latestOrders = filteredOrders.slice(0, 3);
  const lowStock = products.filter((product) => Number(product.stock || 0) <= 30).slice(0, 3);
  const dailySeries = useMemo(() => buildDailySeries(paid, range), [paid, range]);
  const dailyHasData = dailySeries.some((item) => item.receita > 0 || item.pedidos > 0);
  const categoryData = useMemo(() => {
    const map = new Map([
      ["Bonés", 0],
      ["Moletons", 0],
      ["Camisetas", 0],
      ["Acessórios", 0],
    ]);
    products.forEach((product) => {
      const name = normalizeCategory(product.category);
      map.set(name, (map.get(name) || 0) + 1);
    });
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [products]);
  const categoryTotal = categoryData.reduce((sum, item) => sum + item.value, 0);
  const categoryChartData = categoryData.filter((item) => item.value > 0);

  return (
    <main className="page admin-dashboard-page">
      <section className="dashboard-topline">
        <div className="dashboard-title">
          <h1>Dashboard</h1>
          <p>Visão geral da loja</p>
        </div>
        <div className="dashboard-actions">
          <button className="dashboard-btn primary" onClick={() => navigate("/produtos")} type="button">
            <Icon name="plus" />
            Novo produto
          </button>
          <a className="dashboard-btn secondary" href={getStoreUrl("/")} target="_blank" rel="noreferrer">
            <Icon name="external" />
            Abrir loja
          </a>
        </div>
      </section>

      <section className="dashboard-toolbar">
        <AdminSearchBar />
        <PeriodFilter value={range} onChange={setRange} />
      </section>

      <section className="metrics-grid-v2" aria-label="Metricas do dashboard">
        <MetricCard icon="revenue" title="Receita bruta" value={money(revenue)} subtext="0% vs período anterior" tone="positive" />
        <MetricCard icon="paid" title="Pedidos pagos" value={paid.length} subtext="0% vs período anterior" />
        <MetricCard icon="ticket" title="Ticket médio" value={money(paid.length ? revenue / paid.length : 0)} subtext="0% vs período anterior" />
        <MetricCard icon="conversion" title="Conversão" value={filteredOrders.length ? `${((paid.length / filteredOrders.length) * 100).toFixed(2).replace(".", ",")}%` : "0,00%"} subtext="0% vs período anterior" />
      </section>

      <section className="dashboard-chart-grid">
        <DashboardChartCard
          title="Receita por dia"
          action={
            <div className="dashboard-segments">
              <button className={chartMetric === "receita" ? "active" : ""} onClick={() => setChartMetric("receita")} type="button">Receita</button>
              <button className={chartMetric === "pedidos" ? "active" : ""} onClick={() => setChartMetric("pedidos")} type="button">Pedidos</button>
            </div>
          }
        >
          {dailyHasData ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={dailySeries} margin={{ top: 12, right: 8, bottom: 0, left: -24 }}>
                <defs>
                  <linearGradient id="dashboardRevenue" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#20e7df" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#20e7df" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(245,240,232,.1)" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis stroke="#9ca3af" tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => chartMetric === "receita" ? money(value) : value} />
                <Area dataKey={chartMetric} stroke="#20e7df" strokeWidth={3} fill="url(#dashboardRevenue)" dot={{ r: 3, fill: "#20e7df" }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="Sem vendas neste período" text="Quando pedidos forem pagos, o gráfico será atualizado automaticamente." />
          )}
        </DashboardChartCard>

        <DashboardChartCard title="Produtos por categoria" action={<button onClick={() => navigate("/produtos")} type="button">Ver todos</button>}>
          {categoryTotal ? (
            <div className="category-donut-layout">
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={categoryChartData} dataKey="value" nameKey="name" innerRadius={54} outerRadius={84} paddingAngle={3}>
                    {categoryChartData.map((item, index) => <Cell key={item.name} fill={categoryColors[index % categoryColors.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} produto${value === 1 ? "" : "s"}`, "Total"]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-total">
                <strong>{categoryTotal}</strong>
                <span>produtos</span>
              </div>
              <div className="category-legend">
                {categoryData.map((item, index) => (
                  <div key={item.name}>
                    <i style={{ background: categoryColors[index % categoryColors.length] }} />
                    <span>{item.name}</span>
                    <strong>{categoryTotal ? Math.round((item.value / categoryTotal) * 100) : 0}% ({item.value})</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState title="Nenhuma categoria cadastrada" text="Cadastre produtos para ver a distribuição por categoria." />
          )}
        </DashboardChartCard>
      </section>

      <section className="dashboard-list-grid">
        <article className="dashboard-list-card">
          <div className="dashboard-card-head">
            <h3>Últimos pedidos</h3>
            <button onClick={() => navigate("/pedidos")} type="button">Ver todos</button>
          </div>
          <div className="dashboard-card-list">
            {latestOrders.length ? latestOrders.map((order) => <RecentOrderCard key={order.id || order.orderNumberFormatted} order={order} />) : (
              <EmptyState title="Nenhum pedido recente" text="Quando novos pedidos chegarem, eles aparecerão aqui." />
            )}
          </div>
        </article>

        <article className="dashboard-list-card">
          <div className="dashboard-card-head">
            <h3>Alertas de estoque</h3>
            <button onClick={() => navigate("/produtos")} type="button">Ver todos</button>
          </div>
          <div className="dashboard-card-list">
            {lowStock.length ? lowStock.map((product) => (
              <StockAlertCard key={product.id || product.name} product={product} onRestock={() => navigate("/produtos")} />
            )) : (
              <EmptyState title="Nenhum alerta de estoque" text="Todos os produtos estão com estoque controlado." />
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
