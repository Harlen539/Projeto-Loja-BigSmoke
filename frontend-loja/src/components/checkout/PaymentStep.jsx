export function PaymentStep({ total }) {
  return (
    <div className="payment-step">
      <strong>Pagamento seguro via Stripe</strong>
      <span>Total: R$ {total.toFixed(2).replace(".", ",")}</span>
    </div>
  );
}
