import { OrderStatusBadge } from "./OrderStatusBadge.jsx";

export function OrderTable({ orders, onAdvance }) {
  return (
    <div className="table-card">
      <table>
        <thead>
          <tr><th>Pedido</th><th>Cliente</th><th>Total</th><th>Status</th><th>Ações</th></tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.orderNumberFormatted || order.id}</td>
              <td>{order.customer?.name || "Cliente"}</td>
              <td>R$ {Number(order.amountTotal || 0).toFixed(2).replace(".", ",")}</td>
              <td><OrderStatusBadge status={order.status} /></td>
              <td><button onClick={() => onAdvance(order)} type="button">Avançar</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
