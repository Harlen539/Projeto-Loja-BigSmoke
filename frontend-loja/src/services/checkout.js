import { apiFetch } from "./api.js";

export function showPixPayment(data) {
  document.querySelector(".pix-payment-overlay")?.remove();

  const overlay = document.createElement("div");
  overlay.className = "pix-payment-overlay";
  overlay.style.cssText = "position:fixed;inset:0;z-index:5000;display:grid;place-items:center;padding:16px;background:rgba(0,0,0,.76);backdrop-filter:blur(8px);";
  overlay.innerHTML = `
    <section style="width:min(440px,100%);max-height:calc(100vh - 32px);overflow:auto;border:1px solid rgba(245,240,232,.16);border-radius:10px;background:#141414;color:#f5f0e8;padding:20px;box-shadow:0 24px 80px rgba(0,0,0,.6);">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:14px;">
        <div>
          <small style="color:#c9a84c;text-transform:uppercase;font-weight:800;">Pagamento PIX</small>
          <h2 style="margin:4px 0 0;font:400 2rem 'Bebas Neue', Oswald, sans-serif;">${data.orderNumberFormatted || "Pedido BigSmoke"}</h2>
        </div>
        <button type="button" data-pix-close style="border:1px solid rgba(245,240,232,.16);border-radius:999px;background:transparent;color:#f5f0e8;width:36px;height:36px;">x</button>
      </div>
      ${data.brCodeBase64 ? `<img src="${data.brCodeBase64}" alt="QR Code PIX" style="display:block;width:min(280px,100%);margin:0 auto 14px;border-radius:8px;background:#fff;padding:10px;">` : ""}
      <label style="display:grid;gap:8px;color:#b7b0a5;font-size:.85rem;">
        Copia e cola PIX
        <textarea readonly style="min-height:110px;resize:vertical;border:1px solid rgba(245,240,232,.16);border-radius:8px;background:#0d0d0d;color:#f5f0e8;padding:10px;">${data.brCode || ""}</textarea>
      </label>
      <button type="button" data-pix-copy class="btn btn-primary full-width" style="margin-top:14px;">Copiar codigo PIX</button>
      <a href="/pedidos?tracking=${encodeURIComponent(data.id || data.orderId || "")}" class="btn btn-outline full-width" style="margin-top:10px;display:flex;align-items:center;justify-content:center;">Acompanhar pedido</a>
    </section>
  `;
  overlay.querySelector("[data-pix-close]")?.addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.remove();
  });
  overlay.querySelector("[data-pix-copy]")?.addEventListener("click", async () => {
    await navigator.clipboard?.writeText(data.brCode || "");
    overlay.querySelector("[data-pix-copy]").textContent = "Codigo copiado";
  });
  document.body.appendChild(overlay);
}

export async function startPaymentCheckout(items, couponCode = "", paymentMethod = "pix") {
  const method = paymentMethod === "card" ? "card" : "pix";
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
      deliveryMethod: method === "card" ? "card_checkout" : "pix_checkout",
      paymentMethod: method,
      couponCode,
      items: payloadItems,
    }),
  });

  if (data.id) {
    localStorage.setItem("bigsmoke-last-order-session", data.id);
  }

  if (data?.url) {
    window.location.href = data.url;
    return;
  }
  if (data?.brCode || data?.brCodeBase64) {
    showPixPayment(data);
    return;
  }

  throw new Error(method === "card" ? "Nao foi possivel iniciar o pagamento no cartao." : "Nao foi possivel iniciar o pagamento.");
}

export const startStripeCheckout = startPaymentCheckout;
