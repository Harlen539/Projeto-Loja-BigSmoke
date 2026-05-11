import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const TOOLTIP_STYLE = {
  background: "#f5f0e8",
  border: "1px solid rgba(245,240,232,.55)",
  borderRadius: "8px",
  color: "#090909",
  boxShadow: "0 12px 28px rgba(0,0,0,.32)",
};
const TOOLTIP_LABEL_STYLE = { color: "#090909", fontWeight: 800 };
const TOOLTIP_ITEM_STYLE = { color: "#090909", fontWeight: 700 };

export function SalesChart({ orders = [] }) {
  const data = orders.map((order, index) => ({
    name: order.orderNumberFormatted || `#${index + 1}`,
    total: Number(order.amountTotal || 0)
  }));

  return (
    <div className="chart-card">
      <ResponsiveContainer height={320} width="100%">
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} />
          <Bar dataKey="total" fill="#c9a84c" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
