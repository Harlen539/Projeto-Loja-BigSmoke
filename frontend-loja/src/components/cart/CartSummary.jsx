export function CartSummary({ discount = 0, shippingDiscount = 0, subtotal }) {
  const total = Math.max(0, Number(subtotal || 0) - Number(discount || 0));
  return (
    <div className="cart-summary">
      <div className="cart-summary-discount">
        <span>Desconto</span>
        <strong>- R$ {Number(discount || 0).toFixed(2).replace(".", ",")}</strong>
      </div>
      {shippingDiscount > 0 ? (
        <small>Inclui R$ {Number(shippingDiscount || 0).toFixed(2).replace(".", ",")} de desconto no frete.</small>
      ) : null}
      <div className="cart-summary-total">
        <span>Total</span>
        <strong>R$ {total.toFixed(2).replace(".", ",")}</strong>
      </div>
    </div>
  );
}
