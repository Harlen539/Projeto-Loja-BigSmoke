function money(value) {
  return Number(value || 0).toFixed(2).replace(".", ",");
}

export function CartSummary({ discount = 0, shippingDiscount = 0, subtotal }) {
  const safeSubtotal = Number(subtotal || 0);
  const safeDiscount = Number(discount || 0);
  const total = Math.max(0, safeSubtotal - safeDiscount);

  return (
    <section className="cart-summary" aria-label="Resumo do pedido">
      <div className="cart-summary-line">
        <span>Subtotal</span>
        <strong>R$ {money(safeSubtotal)}</strong>
      </div>
      <div className="cart-summary-line cart-summary-discount">
        <span>Desconto</span>
        <strong>- R$ {money(safeDiscount)}</strong>
      </div>
      {shippingDiscount > 0 ? (
        <small>Inclui R$ {money(shippingDiscount)} de desconto no frete.</small>
      ) : null}
      <div className="cart-summary-total">
        <span>Total</span>
        <strong>R$ {money(total)}</strong>
      </div>
    </section>
  );
}
