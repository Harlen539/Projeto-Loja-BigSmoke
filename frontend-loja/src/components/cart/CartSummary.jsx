export function CartSummary({ total }) {
  return (
    <div className="cart-summary">
      <span>Total</span>
      <strong>R$ {total.toFixed(2).replace(".", ",")}</strong>
    </div>
  );
}
