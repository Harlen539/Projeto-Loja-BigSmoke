export function CartSummary({ discount = 0, shippingDiscount = 0, subtotal }) {
  const total = Math.max(0, Number(subtotal || 0) - Number(discount || 0));
  return (
    <div className="cart-summary">
      <div>
        <span>Subtotal</span>
        <strong>R$ {Number(subtotal || 0).toFixed(2).replace(".", ",")}</strong>
      </div>
      {discount > 0 ? (
        <div>
          <span>Desconto</span>
          <strong>- R$ {Number(discount || 0).toFixed(2).replace(".", ",")}</strong>
        </div>
      ) : null}
      {shippingDiscount > 0 ? (
        <small>Inclui R$ {Number(shippingDiscount || 0).toFixed(2).replace(".", ",")} de desconto no frete.</small>
      ) : null}
      <div>
        <span>Total</span>
        <strong>R$ {total.toFixed(2).replace(".", ",")}</strong>
      </div>
    </div>
  );
}
