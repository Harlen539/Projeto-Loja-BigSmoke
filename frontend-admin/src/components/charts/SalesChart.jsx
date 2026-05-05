import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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
          <Tooltip />
          <Bar dataKey="total" fill="#c9a84c" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
