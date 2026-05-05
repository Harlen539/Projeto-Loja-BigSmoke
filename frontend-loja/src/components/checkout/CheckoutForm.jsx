import { useState } from "react";

import { useCart } from "../../hooks/useCart.js";
import { apiFetch } from "../../services/api.js";
import { AddressStep } from "./AddressStep.jsx";
import { PaymentStep } from "./PaymentStep.jsx";

const emptyForm = { name: "", email: "", phone: "", cep: "", street: "", number: "", neighborhood: "", city: "", state: "" };

export function CheckoutForm() {
  const cart = useCart();
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setStatus("");
    try {
      const data = await apiFetch("/api/checkout/session", {
        method: "POST",
        body: JSON.stringify({
          items: cart.items.map((item) => ({ id: item.id, quantity: item.quantity, size: item.size })),
          customer: { name: form.name, email: form.email, phone: form.phone },
          address: form,
          deliveryMethod: "national"
        })
      });
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setStatus(`Pedido criado: ${data?.orderNumberFormatted || data?.orderId || "ok"}`);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="checkout-form" onSubmit={submit}>
      <AddressStep form={form} setForm={setForm} />
      <PaymentStep total={cart.total} />
      <button className="btn btn-primary full-width" disabled={!cart.items.length || loading} type="submit">
        {loading ? "Aguarde..." : "PAGAMENTO"}
      </button>
      {status ? <p className="form-status">{status}</p> : null}
    </form>
  );
}
