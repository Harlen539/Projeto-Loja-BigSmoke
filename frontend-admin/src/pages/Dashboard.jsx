import { StatsCards } from "../components/dashboard/StatsCards.jsx";
import { useOrders } from "../hooks/useOrders.js";
import { useProducts } from "../hooks/useProducts.js";

export function Dashboard() {
  const { products } = useProducts();
  const { orders } = useOrders();

  return (
    <main className="page">
      <StatsCards orders={orders} products={products} />
      <section className="panel">
        <h2>Resumo operacional</h2>
        <p>Dados carregados da API Express com autenticação JWT.</p>
      </section>
    </main>
  );
}
