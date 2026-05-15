const crypto = require("node:crypto");

const DEFAULT_API_URL = "https://api.abacatepay.com/v2";

function apiBaseUrl() {
  return (process.env.ABACATEPAY_API_URL || DEFAULT_API_URL).replace(/\/$/, "");
}

function apiKey() {
  return String(process.env.ABACATEPAY_API_KEY || "").trim();
}

function isConfigured() {
  return Boolean(apiKey());
}

function webhookVerificationKey() {
  return String(process.env.ABACATEPAY_WEBHOOK_PUBLIC_KEY || "").trim();
}

function toCents(value) {
  return Math.max(1, Math.round(Number(value || 0) * 100));
}

function sanitizeText(value, max = 500) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function getOrderDescription(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const details = items
    .map((item) => `${Number(item.quantity || 1)}x ${sanitizeText(item.name, 120)}${item.size ? ` ${sanitizeText(item.size, 20)}` : ""}`)
    .join(", ");
  return sanitizeText(details || `Pedido ${order.orderNumberFormatted || order.id}`, 500);
}

function normalizePaymentData(payload) {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data || {};
  }
  return payload || {};
}

async function readApiResponse(response) {
  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { error: text };
    }
  }

  if (!response.ok || payload?.success === false || payload?.error) {
    const message = typeof payload?.error === "string"
      ? payload.error
      : payload?.error?.message || text || "Erro ao chamar a AbacatePay.";
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload || {};
}

async function abacateRequest(path, body) {
  if (!isConfigured()) {
    const error = new Error("ABACATEPAY_API_KEY nao configurada no backend.");
    error.status = 400;
    throw error;
  }

  const response = await fetch(`${apiBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  return readApiResponse(response);
}

function normalizePixPayment(data) {
  return {
    id: data.id || "",
    status: data.status || "PENDING",
    amount: data.amount || 0,
    url: data.url || "",
    expiresAt: data.expiresAt || "",
    raw: data,
    pix: {
      qrCode: data.brCodeBase64 || data.qrCode || data.qr_code || "",
      copyPaste: data.brCode || data.copyPaste || data.copy_paste || ""
    }
  };
}

function normalizeCheckoutPayment(data) {
  return {
    id: data.id || "",
    status: data.status || "PENDING",
    amount: data.amount || 0,
    url: data.url || data.checkoutUrl || data.paymentUrl || data.payment_url || "",
    raw: data
  };
}

async function createPixPayment(order) {
  const payload = await abacateRequest("/transparents/create", {
    method: "PIX",
    data: {
      amount: toCents(order.amountTotal),
      expiresIn: 3600,
      description: `Pedido ${order.orderNumberFormatted || order.id} - BigSmoke`,
      externalId: order.id,
      customer: {
        name: sanitizeText(order.customer?.name, 180),
        email: sanitizeText(order.customer?.email, 180),
        phone: sanitizeText(order.customer?.phone, 40)
      },
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumberFormatted || "",
        provider: "abacatepay",
        paymentMethod: "pix"
      }
    }
  });

  return normalizePixPayment(normalizePaymentData(payload));
}

async function createCheckoutProduct(order) {
  const productPayload = {
    externalId: `bigsmoke-${order.id}-${crypto.randomBytes(4).toString("hex")}`,
    name: `Pedido ${order.orderNumberFormatted || order.id} - BigSmoke`,
    description: getOrderDescription(order),
    price: toCents(order.amountTotal),
    currency: "BRL"
  };

  const payload = await abacateRequest("/products/create", productPayload);
  const product = normalizePaymentData(payload);
  if (!product.id) {
    const error = new Error("A AbacatePay nao retornou o ID do produto para o checkout.");
    error.status = 502;
    throw error;
  }
  return product;
}

async function createCardCheckout(order, { baseUrl }) {
  const product = await createCheckoutProduct(order);
  const total = Number(order.amountTotal || 0);
  const maxInstallments = Math.max(
    1,
    Math.min(12, Number(process.env.ABACATEPAY_CARD_MAX_INSTALLMENTS || 6), Math.floor(total / 10) || 1)
  );
  const tracking = encodeURIComponent(order.orderAccessCode || order.trackingCode || order.orderNumberFormatted || order.id);
  const payload = await abacateRequest("/checkouts/create", {
    items: [{ id: product.id, quantity: 1 }],
    externalId: order.id,
    returnUrl: `${String(baseUrl || process.env.SITE_URL || "").replace(/\/$/, "")}/`,
    completionUrl: `${String(baseUrl || process.env.SITE_URL || "").replace(/\/$/, "")}/pedidos?tracking=${tracking}`,
    methods: ["CARD"],
    card: { maxInstallments },
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumberFormatted || "",
      provider: "abacatepay",
      paymentMethod: "card"
    }
  });

  return normalizeCheckoutPayment(normalizePaymentData(payload));
}

async function createAbacatePayment(order, paymentMethod, options = {}) {
  if (paymentMethod === "pix") {
    return createPixPayment(order);
  }
  if (paymentMethod === "card") {
    return createCardCheckout(order, options);
  }
  const error = new Error("Metodo de pagamento invalido.");
  error.status = 400;
  throw error;
}

function verifyWebhookSignature(rawBody, signatureFromHeader) {
  if (!signatureFromHeader) return false;
  const publicKey = webhookVerificationKey();
  if (!publicKey) return false;
  const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody || ""), "utf8");
  const expectedSig = crypto.createHmac("sha256", publicKey).update(body).digest("base64");
  const expected = Buffer.from(expectedSig);
  const received = Buffer.from(String(signatureFromHeader));
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

module.exports = {
  DEFAULT_API_URL,
  createAbacatePayment,
  createCardCheckout,
  createPixPayment,
  isConfigured,
  verifyWebhookSignature
};
