import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import logo from "../assets/logo_sem_fundo.png";
import { OrderStatusBadge } from "../components/orders/OrderStatusBadge.jsx";
import { useOrders } from "../hooks/useOrders.js";
import { useProducts } from "../hooks/useProducts.js";

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function orderTotal(order) {
  return Number(order.amountTotal || order.total || order.totalAmount || 0);
}

function productImage(product) {
  return product.image || product.image_url || (Array.isArray(product.images) ? product.images[0] : "") || logo;
}

function filterByRange(items, range) {
  const now = new Date();
  const days = Number(range);
  if (!days) return items;
  const min = new Date(now);
  min.setDate(now.getDate() - days);
  return items.filter((item) => new Date(item.createdAt || item.updatedAt || 0) >= min);
}

function KpiCard({ icon, label, value, delta, tone = "good", onClick }) {
  return (
    <button className="soc-kpi kpi-button" onClick={onClick} type="button">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <p className={`soc-delta ${tone}`}>{delta}</p>
      </div>
      <i>{icon}</i>
    </button>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { orders } = useOrders();
  const [range, setRange] = useState("7");

  const filteredOrders = useMemo(() => filterByRange(orders, range), [orders, range]);
  const paid = filteredOrders.filter((order) => ["paid", "processing", "shipped", "delivered"].includes(order.status));
  const revenue = paid.reduce((sum, order) => sum + orderTotal(order), 0);
  const activeProducts = products.filter((product) => product.active !== false);
  const featuredProducts = products.filter((product) => product.featured);
  const stockTotal = products.reduce((sum, product) => sum + Number(product.stock || 0), 0);
  const latestOrders = filteredOrders.slice(0, 5);
  const topProducts = products.slice(0, 4);
  const lowStock = products.filter((product) => Number(product.stock || 0) <= 6).slice(0, 3);
  const rangeLabel = range === "0" ? "Todo periodo" : `Ultimos ${range} dias`;

  return (
    <main className="page soc-dashboard">
      <section className="soc-hero">
        <label className="soc-date-pill">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <select value={range} onChange={(event) => setRange(event.target.value)} aria-label="Periodo do dashboard">
            <option value="7">Ultimos 7 dias</option>
            <option value="15">Ultimos 15 dias</option>
            <option value="30">Ultimos 30 dias</option>
            <option value="0">Todo periodo</option>
          </select>
        </label>
      </section>

      <section className="soc-kpi-grid">
        <KpiCard icon="$" label="Receita bruta" value={money(revenue)} delta={rangeLabel} onClick={() => navigate("/graficos")} />
        <KpiCard icon="+" label="Pedidos pagos" value={paid.length} delta="Abrir pedidos" onClick={() => navigate("/pedidos")} />
        <KpiCard icon="R$" label="Ticket medio" value={money(paid.length ? revenue / paid.length : 0)} delta="Calculado por pedido pago" onClick={() => navigate("/pedidos")} />
        <KpiCard icon="%" label="Conversao" value={filteredOrders.length ? `${((paid.length / filteredOrders.length) * 100).toFixed(2)}%` : "0,00%"} delta="Pedidos pagos / total" onClick={() => navigate("/graficos")} />
        <KpiCard icon="P" label="Produtos" value={products.length} delta="Ver catalogo" tone="neutral" onClick={() => navigate("/produtos")} />
        <KpiCard icon="OK" label="Ativos" value={activeProducts.length} delta="Produtos publicados" onClick={() => navigate("/produtos")} />
        <KpiCard icon="*" label="Em destaque" value={featuredProducts.length} delta="Destaques da loja" tone="neutral" onClick={() => navigate("/produtos")} />
        <KpiCard icon="#" label="Estoque total" value={stockTotal.toLocaleString("pt-BR")} delta="Rastrear estoque" onClick={() => navigate("/produtos")} />
      </section>

      <section className="soc-grid">
        <article className="soc-panel soc-line-panel">
          <div className="soc-panel-head">
            <div>
              <span>Vendas</span>
              <strong>{money(revenue)} <em>{rangeLabel}</em></strong>
            </div>
            <button onClick={() => navigate("/graficos")} type="button">Ver graficos</button>
          </div>
          <div className="soc-line-chart" aria-hidden="true">
            {[78, 56, 53, 31, 44, 39, 15].map((y, index) => <span key={index} style={{ "--x": `${index * 16.66}%`, "--y": `${y}%` }} />)}
            {["D-6", "D-5", "D-4", "D-3", "D-2", "Ontem", "Hoje"].map((day) => <small key={day}>{day}</small>)}
          </div>
        </article>

        <article className="soc-panel soc-bars-panel">
          <div className="soc-panel-head">
            <div>
              <span>Pedidos por dia</span>
              <strong>{filteredOrders.length} <em>{rangeLabel}</em></strong>
            </div>
            <button onClick={() => navigate("/pedidos")} type="button">Ver pedidos</button>
          </div>
          <div className="soc-bars" aria-hidden="true">
            {[46, 62, 43, 54, 37, 47, 82].map((height, index) => <i key={index} style={{ "--h": `${height}%` }} />)}
            {["D-6", "D-5", "D-4", "D-3", "D-2", "Ontem", "Hoje"].map((day) => <small key={day}>{day}</small>)}
          </div>
        </article>

        <article className="soc-panel soc-orders-panel">
          <div className="soc-panel-head">
            <span>Ultimos pedidos</span>
            <button onClick={() => navigate("/pedidos")} type="button">Ver todos</button>
          </div>
          <table className="soc-orders-table">
            <thead><tr><th>Pedido</th><th>Cliente</th><th>Valor</th><th>Status</th></tr></thead>
            <tbody>
              {latestOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.orderNumberFormatted || order.id?.slice(0, 8)}</td>
                  <td>{order.customer?.name || "Cliente"}</td>
                  <td>{money(orderTotal(order))}</td>
                  <td><OrderStatusBadge status={order.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="soc-panel soc-list-panel">
          <div className="soc-panel-head">
            <span>Produtos para rastrear</span>
            <button onClick={() => navigate("/produtos")} type="button">Ver todos</button>
          </div>
          <div className="soc-ranked-list">
            {topProducts.map((product, index) => (
              <div key={product.id || product.name}>
                <em>{index + 1}</em>
                <img src={productImage(product)} alt="" onError={(event) => { event.currentTarget.src = logo; }} />
                <span>{product.name}<small>{Number(product.stock || 0)} em estoque</small></span>
                <strong>{money(product.price || 0)}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="soc-panel soc-list-panel">
          <div className="soc-panel-head">
            <span>Alertas de estoque</span>
            <button onClick={() => navigate("/produtos")} type="button">Ver todos</button>
          </div>
          <div className="soc-stock-alerts">
            {lowStock.map((product) => (
              <div className={Number(product.stock || 0) <= 0 ? "danger" : ""} key={product.id || product.name}>
                <em>!</em>
                <img src={productImage(product)} alt="" onError={(event) => { event.currentTarget.src = logo; }} />
                <span>{product.name}<small>{Number(product.stock || 0) <= 0 ? "Sem estoque" : `Estoque baixo: ${product.stock} unidades`}</small></span>
              </div>
            ))}
          </div>
        </article>

        <article className="soc-panel soc-stripe-panel">
          <div className="soc-panel-head"><span>Status da integracao</span></div>
          <div className="soc-stripe-box">
            <div className="soc-stripe-title"><strong>stripe</strong><i /><span>Stripe Live <small>Ativo</small></span></div>
            <p>Pagamentos reais estaveis e funcionando.</p>
            <button onClick={() => window.open("https://dashboard.stripe.com/", "_blank", "noreferrer")} type="button">Abrir painel do Stripe</button>
          </div>
        </article>
      </section>
    </main>
  );
}
