import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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
              <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={105} label>
                {statusData.map((entry, index) => <Cell fill={["#f4c542", "#42ff9e", "#00e5ff", "#8b5cf6", "#ff4d6d"][index % 5]} key={entry.name} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#071116", border: "1px solid rgba(0,229,255,.25)", color: "#fff" }} />
            </PieChart>
          </ResponsiveContainer>
        </article>

        <article className="chart-card">
          <div className="chart-head"><h3>Produtos por categoria</h3><span>{products.length} produtos</span></div>
          <ResponsiveContainer height={300} width="100%">
            <BarChart data={categoryData}>
              <CartesianGrid stroke="rgba(180,245,255,.08)" vertical={false} />
              <XAxis dataKey="name" stroke="#8aa4ad" />
              <YAxis stroke="#8aa4ad" />
              <Tooltip contentStyle={{ background: "#071116", border: "1px solid rgba(0,229,255,.25)", color: "#fff" }} />
              <Bar dataKey="value" fill="#00e5ff" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="chart-card">
          <div className="chart-head"><h3>Estoque por produto</h3><span>Rastreabilidade</span></div>
          <ResponsiveContainer height={300} width="100%">
            <BarChart data={stockData}>
              <CartesianGrid stroke="rgba(180,245,255,.08)" vertical={false} />
              <XAxis dataKey="name" stroke="#8aa4ad" />
              <YAxis stroke="#8aa4ad" />
              <Tooltip contentStyle={{ background: "#071116", border: "1px solid rgba(0,229,255,.25)", color: "#fff" }} />
              <Bar dataKey="estoque" fill="#42ff9e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>
      </section>
    </main>
  );
}
