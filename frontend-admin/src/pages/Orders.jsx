import { OrderTable } from "../components/orders/OrderTable.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useOrders } from "../hooks/useOrders.js";
import { apiFetch } from "../services/api.js";

const flow = ["pending", "paid", "processing", "shipped", "delivered"];

export function Orders() {
  const { token } = useAuth();
  const { orders, reload } = useOrders();

  async function advance(order) {
    const index = flow.indexOf(order.status);
    const status = flow[Math.min(index + 1, flow.length - 1)] || "processing";
    await apiFetch(`/api/admin/orders/${order.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    await reload();
  }

  return (
    <main className="page">
      <div className="page-head"><h2>Pedidos</h2></div>
      <OrderTable orders={orders} onAdvance={advance} />
    </main>
  );
}
