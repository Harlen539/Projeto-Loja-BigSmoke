import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { useOrders } from "../hooks/useOrders.js";
import { useProducts } from "../hooks/useProducts.js";

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function statusLabel(status) {
  const labels = {
    pending: "Pendente",
    paid: "Pago",
    processing: "Em separacao",
    shipped: "Enviado",
    delivered: "Entregue",
    canceled: "Cancelado",
  };
  return labels[status] || "Pendente";
}

const CATEGORY_COLORS = ["#00e5ff", "#42ff9e", "#f4c542", "#8b5cf6", "#ff4d6d", "#ff8a3d"];
const STATUS_COLORS = ["#f4c542", "#42ff9e", "#00e5ff", "#8b5cf6", "#ff4d6d", "#ff8a3d"];

export function Charts() {
  const { orders } = useOrders();
  const { products } = useProducts();
  const [metric, setMetric] = useState("revenue");

  const orderSeries = useMemo(() => orders.slice(-10).map((order, index) => ({
    name: order.orderNumberFormatted || `#${index + 1}`,
    receita: Number(order.amountTotal || 0),
    pedidos: 1,
  })), [orders]);

  const statusData = useMemo(() => {
    const map = new Map();
    orders.forEach((order) => map.set(statusLabel(order.status), (map.get(statusLabel(order.status)) || 0) + 1));
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [orders]);

  const categoryData = useMemo(() => {
    const map = new Map();
    products.forEach((product) => map.set(product.category || "Sem categoria", (map.get(product.category || "Sem categoria") || 0) + 1));
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [products]);

  const stockData = products.slice(0, 8).map((product) => ({
    name: product.name?.slice(0, 16) || "Produto",
    estoque: Number(product.stock || 0),
  }));
  const categoryTotal = categoryData.reduce((sum, item) => sum + item.value, 0);

  return (
    <main className="page charts-page">
      <div className="page-head">
        <div>
          <p className="section-kicker">Analise</p>
          <h2>Graficos</h2>
        </div>
        <div className="segmented-control">
          <button className={metric === "revenue" ? "active" : ""} onClick={() => setMetric("revenue")} type="button">Receita</button>
          <button className={metric === "orders" ? "active" : ""} onClick={() => setMetric("orders")} type="button">Pedidos</button>
        </div>
      </div>

      <section className="chart-grid">
        <article className="chart-card chart-card-wide">
          <div className="chart-head"><h3>{metric === "revenue" ? "Receita por pedido" : "Volume de pedidos"}</h3><span>{money(orderSeries.reduce((sum, item) => sum + item.receita, 0))}</span></div>
          <ResponsiveContainer height={300} width="100%">
            <AreaChart data={orderSeries}>
              <defs>
                <linearGradient id="cyanArea" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#00e5ff" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#00e5ff" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(180,245,255,.08)" vertical={false} />
              <XAxis dataKey="name" stroke="#8aa4ad" />
              <YAxis stroke="#8aa4ad" />
              <Tooltip contentStyle={{ background: "#071116", border: "1px solid rgba(0,229,255,.25)", color: "#fff" }} />
              <Area dataKey={metric === "revenue" ? "receita" : "pedidos"} stroke="#00e5ff" strokeWidth={3} fill="url(#cyanArea)" />
            </AreaChart>
          </ResponsiveContainer>
        </article>

        <article className="chart-card">
          <div className="chart-head"><h3>Status dos pedidos</h3><span>{orders.length} pedidos</span></div>
          <ResponsiveContainer height={300} width="100%">
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={64} outerRadius={106} paddingAngle={4}>
                {statusData.map((entry, index) => <Cell fill={STATUS_COLORS[index % STATUS_COLORS.length]} key={entry.name} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#071116", border: "1px solid rgba(0,229,255,.25)", color: "#fff" }} formatter={(value) => [`${value} pedido${value === 1 ? "" : "s"}`, "Total"]} />
            </PieChart>
          </ResponsiveContainer>
        </article>

        <article className="chart-card chart-card-polished">
          <div className="chart-head"><h3>Produtos por categoria</h3><span>{products.length} produtos</span></div>
          {categoryData.length ? (
            <div className="donut-layout">
              <ResponsiveContainer height={260} width="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    innerRadius={62}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    nameKey="name"
                    outerRadius={100}
                    paddingAngle={4}
                  >
                    {categoryData.map((entry, index) => <Cell fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} key={entry.name} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#071116", border: "1px solid rgba(0,229,255,.25)", color: "#fff" }} formatter={(value) => [`${value} produto${value === 1 ? "" : "s"}`, "Categoria"]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="chart-legend">
                {categoryData.map((item, index) => (
                  <div className="chart-legend-row" key={item.name}>
                    <span className="chart-legend-dot" style={{ background: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }} />
                    <span>{item.name}</span>
                    <strong>{Math.round((item.value / categoryTotal) * 100)}%</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="chart-empty">Nenhuma categoria cadastrada.</div>
          )}
        </article>

        <article className="chart-card chart-card-polished">
          <div className="chart-head"><h3>Estoque por produto</h3><span>Rastreabilidade</span></div>
          <ResponsiveContainer height={300} width="100%">
            <BarChart data={stockData} layout="vertical" margin={{ top: 8, right: 34, bottom: 8, left: 8 }}>
              <defs>
                <linearGradient id="stockBar" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#42ff9e" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#00e5ff" stopOpacity={0.95} />
                </linearGradient>
              </defs>
              <CartesianGrid horizontal={false} stroke="rgba(180,245,255,.08)" />
              <XAxis allowDecimals={false} stroke="#8aa4ad" type="number" />
              <YAxis axisLine={false} dataKey="name" stroke="#c5d8de" tickLine={false} type="category" width={124} />
              <Tooltip contentStyle={{ background: "#071116", border: "1px solid rgba(0,229,255,.25)", color: "#fff" }} formatter={(value) => [`${value} unidade${value === 1 ? "" : "s"}`, "Estoque"]} />
              <Bar barSize={22} dataKey="estoque" fill="url(#stockBar)" radius={[0, 8, 8, 0]}>
                <LabelList dataKey="estoque" fill="#f4fbff" fontSize={12} position="right" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </article>
      </section>
    </main>
  );
}
