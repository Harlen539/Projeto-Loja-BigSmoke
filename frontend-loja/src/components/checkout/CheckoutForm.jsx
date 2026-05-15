import { useEffect, useState } from "react";

import { useCart } from "../../hooks/useCart.js";
import { apiFetch } from "../../services/api.js";
import { showPixPayment } from "../../services/checkout.js";
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

function normalizeCheckoutData(data) {
  return {
    ...data,
    checkoutUrl: data?.paymentUrl || data?.checkoutUrl || data?.url || data?.data?.paymentUrl || data?.data?.checkoutUrl || data?.data?.url || data?.data?.payment_url || "",
    brCode: data?.pix?.copyPaste || data?.brCode || data?.pixCopyPaste || data?.data?.pix?.copyPaste || data?.data?.brCode || data?.data?.pixCopyPaste || "",
    brCodeBase64: data?.pix?.qrCode || data?.brCodeBase64 || data?.qrCode || data?.data?.pix?.qrCode || data?.data?.brCodeBase64 || data?.data?.qrCode || "",
    orderId: data?.orderId || data?.paymentId || data?.id || data?.data?.orderId || data?.data?.paymentId || data?.data?.id || "",
    orderNumberFormatted: data?.orderNumberFormatted || data?.data?.orderNumberFormatted || ""
  };
}

function CheckoutSuccess() {
  return (
    <div className="checkout-feedback checkout-success">
      <span className="checkout-feedback-icon">✓</span>
      <h2>Pagamento confirmado!</h2>
      <p>Obrigado pela compra. A BigSmoke já recebeu seu pedido.</p>
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
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [checkoutState, setCheckoutState] = useState("idle"); // idle | success | cancelled

  // Detecta retorno do provedor de pagamento via query string.
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
      const data = normalizeCheckoutData(await apiFetch("/api/checkout/session", {
        method: "POST",
        body: JSON.stringify({
          items: cart.items.map((item) => ({
            id: item.id || item.productId,
            quantity: item.quantity,
            size: item.size,
          })),
          customer: {
            name: form.name,
            email: form.email,
            phone: form.phone,
          },
          address: form,
          deliveryMethod: paymentMethod === "card" ? "card_checkout" : "pix_checkout",
          paymentMethod,
          couponCode: "",
        }),
      }));

      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      if (data?.brCode || data?.brCodeBase64) {
        showPixPayment(data);
        setStatus(`PIX gerado: ${data?.orderNumberFormatted || data?.orderId || "ok"}`);
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
      <PaymentStep total={cart.total} onMethodChange={setPaymentMethod} />

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
