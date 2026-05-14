import { useState } from "react";

export function PaymentStep({ total, onMethodChange }) {
  const [method, setMethod] = useState("pix");

  function select(nextMethod) {
    setMethod(nextMethod);
    onMethodChange?.(nextMethod);
  }

  return (
    <div className="payment-step">
      <strong>Forma de pagamento</strong>
      <div style={{ display: "flex", gap: "12px", margin: "12px 0" }}>
        <button
          type="button"
          className={`btn ${method === "pix" ? "btn-primary" : "btn-outline"}`}
          onClick={() => select("pix")}
        >
          PIX
        </button>
        <button
          type="button"
          className={`btn ${method === "card" ? "btn-primary" : "btn-outline"}`}
          onClick={() => select("card")}
        >
          Cartao de credito
        </button>
      </div>
      <span>Total: R$ {total.toFixed(2).replace(".", ",")}</span>
    </div>
  );
}
