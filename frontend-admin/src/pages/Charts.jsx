import { SalesChart } from "../components/charts/SalesChart.jsx";
import { useOrders } from "../hooks/useOrders.js";

export function Charts() {
  const { orders } = useOrders();
  return (
    <main className="page">
      <div className="page-head"><h2>Gráficos</h2></div>
      <SalesChart orders={orders} />
    </main>
  );
}
