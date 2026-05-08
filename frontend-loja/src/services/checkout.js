import { apiFetch } from "./api.js";

export async function startStripeCheckout(items, couponCode = "") {
  const payloadItems = items
    .filter((item) => item?.id && Number(item.quantity || 0) > 0)
    .map((item) => ({
      id: item.id,
      quantity: Number(item.quantity || 1),
      size: item.size || "",
    }));

  if (!payloadItems.length) {
    throw new Error("Seu carrinho esta vazio.");
  }

  const data = await apiFetch("/api/checkout/session", {
    method: "POST",
    body: JSON.stringify({
      deliveryMethod: "stripe_checkout",
      couponCode,
      items: payloadItems,
    }),
  });

  if (!data?.url) {
    throw new Error("Não foi possível iniciar o pagamento.");
  }

  if (data.id) {
    localStorage.setItem("bigsmoke-last-order-session", data.id);
  }

  window.location.href = data.url;
}
