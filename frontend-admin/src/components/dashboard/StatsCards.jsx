export function StatsCards({ products = [], orders = [] }) {
  const paid = orders.filter((order) => order.status === "paid");
  const revenue = paid.reduce((sum, order) => sum + Number(order.amountTotal || 0), 0);
  const cards = [
    ["Produtos", products.length],
    ["Ativos", products.filter((product) => product.active !== false).length],
    ["Pedidos", orders.length],
    ["Receita", `R$ ${revenue.toFixed(2).replace(".", ",")}`]
  ];

  return (
    <div className="stats-grid">
      {cards.map(([label, value]) => (
        <article className="stat-card" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </article>
      ))}
    </div>
  );
}
