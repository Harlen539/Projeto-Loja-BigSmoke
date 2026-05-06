import { useEffect, useState } from "react";

import { useCart } from "../../hooks/useCart.js";
import { apiFetch } from "../../services/api.js";
import { AddressStep } from "./AddressStep.jsx";
import { PaymentStep } from "./PaymentStep.jsx";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

function CheckoutSuccess() {
  return (
    <div className="checkout-feedback checkout-success">
      <span className="checkout-feedback-icon">✓</span>
      <h2>Pagamento confirmado!</h2>
      <p>Obrigado pela sua compra. Você receberá atualizações do seu pedido.</p>
      <a className="btn btn-primary" href="/pedidos">
        Acompanhar pedido
      </a>
    </div>
  );
}

function CheckoutCancelled({ onRetry }) {
  return (
    <div className="checkout-feedback checkout-cancelled">
      <span className="checkout-feedback-icon">✕</span>
      <h2>Pagamento cancelado</h2>
      <p>Seu pedido não foi concluído. Você pode tentar novamente.</p>
      <button className="btn btn-primary" onClick={onRetry} type="button">
        Tentar novamente
      </button>
    </div>
  );
}

export function CheckoutForm() {
  const cart = useCart();
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkoutState, setCheckoutState] = useState("idle"); // idle | success | cancelled

  // Detecta retorno do Stripe via query string
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    if (checkout === "success") {
      setCheckoutState("success");
      // Limpa a query string da URL sem recarregar
      const url = new URL(window.location.href);
      url.searchParams.delete("checkout");
      url.searchParams.delete("session_id");
      window.history.replaceState({}, "", url.toString());
    } else if (checkout === "cancelled") {
      setCheckoutState("cancelled");
      const url = new URL(window.location.href);
      url.searchParams.delete("checkout");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      const data = await apiFetch("/api/checkout/session", {
        method: "POST",
        body: JSON.stringify({
          items: cart.items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            size: item.size,
          })),
          customer: {
            name: form.name,
            email: form.email,
            phone: form.phone,
          },
          address: form,
          deliveryMethod: "national",
        }),
      });

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      setStatus(
        `Pedido criado: ${data?.orderNumberFormatted || data?.orderId || "ok"}`
      );
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  if (checkoutState === "success") {
    return <CheckoutSuccess />;
  }

  if (checkoutState === "cancelled") {
    return <CheckoutCancelled onRetry={() => setCheckoutState("idle")} />;
  }

  return (
    <form className="checkout-form" onSubmit={submit} noValidate>
      <AddressStep form={form} setForm={setForm} />
      <PaymentStep total={cart.total} />

      <button
        className="btn btn-primary full-width"
        disabled={!cart.items.length || loading}
        type="submit"
      >
        {loading ? "Aguarde..." : "IR PARA PAGAMENTO"}
      </button>

      {status && (
        <p className={`form-status ${status.toLowerCase().includes("erro") || status.toLowerCase().includes("inválid") ? "form-status--error" : ""}`}>
          {status}
        </p>
      )}
    </form>
  );
}
