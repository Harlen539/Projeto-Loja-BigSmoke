const crypto = require("node:crypto");
const { existsSync } = require("node:fs");
const fs = require("node:fs/promises");
const path = require("node:path");

const bcrypt = require("bcryptjs");
const cors = require("cors");
const express = require("express");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const sharp = require("sharp");
const Twilio = require("twilio");
const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const repoRoot = path.resolve(__dirname, "..", "..");
const frontendLojaDir = path.join(repoRoot, "frontend-loja", "src");
const frontendAdminDir = path.join(repoRoot, "frontend-admin", "src");
const frontendLojaDistDir = path.join(repoRoot, "frontend-loja", "dist");
const frontendAdminDistDir = path.join(repoRoot, "frontend-admin", "dist");
const dataDir = path.resolve(process.env.BIGSMOKE_DATA_DIR || path.join(__dirname, "data"));
const uploadsDir = path.resolve(process.env.BIGSMOKE_UPLOADS_DIR || path.join(__dirname, "uploads"));
const productsFile = path.join(dataDir, "products.json");
const ordersFile = path.join(dataDir, "orders.json");
const orderCounterFile = path.join(dataDir, "order_counter.json");
const PRODUCT_TABLE = process.env.SUPABASE_PRODUCTS_TABLE || "products";
const ORDER_TABLE = process.env.SUPABASE_ORDERS_TABLE || "orders";
const JWT_SECRET = process.env.JWT_SECRET || "bigsmoke-local-secret";
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const MOCK_STRIPE = process.env.STRIPE_MOCK === "true";
const STRIPE_LIVE_MODE = STRIPE_SECRET_KEY.startsWith("sk_live_") && !MOCK_STRIPE;

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2026-02-25.clover" })
  : null;

const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

const useSupabase = Boolean(supabase);
const DEFAULT_STORE = {
  city: process.env.STORE_CITY || "Fortaleza",
  state: process.env.STORE_STATE || "CE",
  originCep: process.env.STORE_ORIGIN_CEP || "60000000"
};
const FREE_SHIPPING_CITIES = new Set(["joao pessoa", "joão pessoa", "bayeux", "cabedelo"]);
const ORDER_STATUS_FLOW = ["pending", "paid", "processing", "shipped", "delivered"];
const ORDER_STATUS_LABELS = {
  pending: "Pendente",
  paid: "Pago",
  processing: "Em separação",
  shipped: "Enviado",
  delivered: "Entregue",
  canceled: "Cancelado"
};
const DEFAULT_WHATSAPP = process.env.WHATSAPP_NUMBER || "5583986494691";
const LEGACY_PRODUCT_ALIASES = {
  "camiseta-oversized": "moletom-classic"
};
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || "";
const TWILIO_WHATSAPP_TO = process.env.TWILIO_WHATSAPP_TO || DEFAULT_WHATSAPP;
const TWILIO_MESSAGING_SERVICE_SID = process.env.TWILIO_MESSAGING_SERVICE_SID || "";
const TWILIO_WHATSAPP_CONTENT_SID = process.env.TWILIO_WHATSAPP_CONTENT_SID || "";
const TWILIO_CUSTOMER_CONFIRMATION_ENABLED = process.env.TWILIO_CUSTOMER_CONFIRMATION_ENABLED !== "false";
const WHATSAPP_WEBHOOK_URL = process.env.WHATSAPP_WEBHOOK_URL || "";
const WHATSAPP_WEBHOOK_SECRET = process.env.WHATSAPP_WEBHOOK_SECRET || "";
const WHATSAPP_WEBHOOK_TIMEOUT_MS = Math.max(1000, Number(process.env.WHATSAPP_WEBHOOK_TIMEOUT_MS || 8000));
const twilioClient = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN ? Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) : null;
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, callback) => {
    if (String(file?.mimetype || "").startsWith("image/")) {
      callback(null, true);
      return;
    }
    callback(new Error("Apenas imagens são aceitas."));
  },
  limits: {
    fileSize: 8 * 1024 * 1024
  }
});

const app = express();
app.set("trust proxy", 1);

function validateRuntimeConfig() {
  const issues = [];

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    issues.push("JWT_SECRET precisa ter pelo menos 32 caracteres.");
  }

  const adminPassword = process.env.ADMIN_PASSWORD || "";
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || "";
  if (!adminPasswordHash && adminPassword && adminPassword.length < 12) {
    issues.push("ADMIN_PASSWORD deve ter pelo menos 12 caracteres quando ADMIN_PASSWORD_HASH não estiver definido.");
  }

  const isProduction = process.env.NODE_ENV === "production";
  if (issues.length) {
    const message = `Configuração inválida: ${issues.join(" ")}`;
    if (isProduction) {
      throw new Error(message);
    }
    console.warn(message);
  }
}

// Rate limiting geral
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas requisições. Tente novamente em alguns minutos." }
});

// Rate limiting para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas de login. Aguarde 15 minutos." }
});

// Rate limiting para checkout
const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas de checkout. Aguarde um momento." }
});

const seedProducts = [
  {
    id: "moletom-classic",
    name: "Moletom Classic BigSmoke",
    category: "Moletons",
    description: "Peça premium para dias frios, pronta para campanha e venda assistida.",
    price: 249.9,
    stock: 18,
    image: "https://placehold.co/900x1200/141414/F5F0E8?text=Moletom+Classic",
    sizes: "M, G, GG",
    badge: "Mais pedido",
    active: true,
    featured: true,
    createdAt: "2026-04-27T00:00:00.000Z",
    updatedAt: "2026-04-27T00:00:00.000Z"
  }
];
const REMOVED_PRODUCT_IDS = new Set(["camiseta-oversized"]);

function nowIso() {
  return new Date().toISOString();
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeStock(value, fallback = 0) {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed) || parsed < 0) {
    return Math.max(0, Math.floor(Number(fallback) || 0));
  }
  return parsed;
}

function normalizeCityName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return fallback;
}

function normalizeColors(input, fallback) {
  if (!input && fallback) return fallback;
  if (!input) return [];
  if (typeof input === "string") {
    try {
      input = JSON.parse(input);
    } catch {
      return fallback || [];
    }
  }
  if (!Array.isArray(input)) return fallback || [];
  return input
    .map((c) => ({
      name: String(c.name || "").trim(),
      hex: String(c.hex || "#888888").trim(),
      images: Array.isArray(c.images) ? c.images.map((u) => String(u || "").trim()).filter(Boolean) : [],
      stock: c.stock !== undefined ? Number(c.stock) : undefined
    }))
    .filter((c) => c.name);
}

function normalizeOrderStatus(value, fallback = "pending") {
  const raw = normalizeText(value).toLowerCase();
  const aliases = {
    pending_payment: "pending",
    pending: "pending",
    paid: "paid",
    processing: "processing",
    shipped: "shipped",
    fulfilled: "shipped",
    delivered: "delivered",
    cancelled: "canceled",
    canceled: "canceled",
    refunded: "canceled"
  };
  return aliases[raw] || aliases[normalizeText(fallback).toLowerCase()] || "pending";
}

function toPublicProduct(product) {
  const images = Array.isArray(product.images) ? product.images.map((url) => normalizeText(url)).filter(Boolean) : [];
  const image = normalizeText(product.image || product.image_url || images[0] || "");
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    description: product.description,
    price: product.price,
    image,
    image_url: product.image_url || image || "",
    images: images.length ? [...new Set([image, ...images].filter(Boolean))] : [image].filter(Boolean),
    sizes: product.sizes,
    badge: product.badge,
    active: product.active,
    featured: product.featured,
    colors: Array.isArray(product.colors) ? product.colors : []
  };
}

function normalizeProductImages(input = {}, current = {}) {
  const rawImages = Array.isArray(input.images)
    ? input.images
    : Array.isArray(current.images)
      ? current.images
      : [];
  const mainImage = normalizeText(input.image || input.image_url || current.image || current.image_url || rawImages[0] || "");
  const extraImages = rawImages.map((value) => normalizeText(value)).filter(Boolean);
  const mergedImages = [mainImage, ...extraImages].filter(Boolean);
  return {
    image: mainImage,
    image_url: mainImage,
    images: [...new Set(mergedImages)]
  };
}

function normalizeProduct(input = {}, current = {}) {
  const createdAt = current.createdAt || input.createdAt || nowIso();
  const normalizedImages = normalizeProductImages(input, current);
  return {
    id: normalizeText(input.id) || current.id || crypto.randomUUID(),
    name: normalizeText(input.name),
    category: normalizeText(input.category),
    description: normalizeText(input.description),
    price: Math.max(0, normalizeNumber(input.price, 0)),
    stock: normalizeStock(input.stock, current.stock ?? 0),
    image: normalizedImages.image,
    image_url: normalizedImages.image_url,
    images: normalizedImages.images,
    sizes: normalizeText(input.sizes) || "P, M, G, GG",
    badge: normalizeText(input.badge) || normalizeText(input.category) || "BigSmoke",
    active: normalizeBoolean(input.active, current.active !== false),
    featured: normalizeBoolean(input.featured, Boolean(current.featured)),
    colors: normalizeColors(input.colors, current.colors),
    createdAt,
    updatedAt: nowIso()
  };
}

function normalizeOrder(input = {}, current = {}) {
  const status = normalizeOrderStatus(input.status || current.status, current.status || "pending");
  const orderNumber = input.orderNumber || current.orderNumber || null;
  return {
    id: normalizeText(input.id) || current.id || `order_${crypto.randomUUID()}`,
    orderNumber,
    orderNumberFormatted: input.orderNumberFormatted || current.orderNumberFormatted || formatOrderNumberValue(orderNumber),
    orderAccessCode: normalizeText(input.orderAccessCode || current.orderAccessCode) || null,
    hiddenInAdmin: normalizeBoolean(input.hiddenInAdmin, current.hiddenInAdmin || false),
    stripeSessionId: normalizeText(input.stripeSessionId) || current.stripeSessionId || "",
    paymentIntentId: normalizeText(input.paymentIntentId) || current.paymentIntentId || "",
    stripeEventId: normalizeText(input.stripeEventId) || current.stripeEventId || "",
    status,
    currency: normalizeText(input.currency) || current.currency || "brl",
    amountSubtotal: normalizeNumber(input.amountSubtotal, current.amountSubtotal || 0),
    shippingAmount: normalizeNumber(input.shippingAmount, current.shippingAmount || 0),
    amountTotal: normalizeNumber(input.amountTotal, current.amountTotal || 0),
    paymentConfirmed: normalizeBoolean(input.paymentConfirmed, current.paymentConfirmed || false),
    inventoryDebitedAt: normalizeText(input.inventoryDebitedAt) || current.inventoryDebitedAt || "",
    customer: {
      name: normalizeText(input.customer?.name || current.customer?.name),
      email: normalizeText(input.customer?.email || current.customer?.email),
      phone: normalizeText(input.customer?.phone || current.customer?.phone)
    },
    address: {
      cep: normalizeText(input.address?.cep || current.address?.cep),
      street: normalizeText(input.address?.street || current.address?.street),
      number: normalizeText(input.address?.number || current.address?.number),
      neighborhood: normalizeText(input.address?.neighborhood || current.address?.neighborhood),
      city: normalizeText(input.address?.city || current.address?.city),
      state: normalizeText(input.address?.state || current.address?.state),
      complement: normalizeText(input.address?.complement || current.address?.complement)
    },
    deliveryMethod: normalizeText(input.deliveryMethod || current.deliveryMethod),
    shippingLabel: normalizeText(input.shippingLabel || current.shippingLabel),
    trackingCode: normalizeText(input.trackingCode || input.tracking_code || current.trackingCode),
    trackingUrl: normalizeText(input.trackingUrl || input.tracking_url || current.trackingUrl),
    items: Array.isArray(input.items) ? input.items : Array.isArray(current.items) ? current.items : [],
    events: Array.isArray(input.events) ? input.events : Array.isArray(current.events) ? current.events : [],
    sessionUrl: normalizeText(input.sessionUrl || current.sessionUrl),
    paidAt: input.paidAt || current.paidAt || "",
    canceledAt: input.canceledAt || current.canceledAt || "",
    createdAt: current.createdAt || input.createdAt || nowIso(),
    updatedAt: nowIso()
  };
}

function maskName(value) {
  const parts = normalizeText(value).split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${first} ${lastInitial}.`;
}

function maskEmail(value) {
  const raw = normalizeText(value);
  if (!raw || !raw.includes("@")) return "";
  const [localPart, domain] = raw.split("@");
  const first = localPart.charAt(0) || "*";
  return `${first}***@${domain}`;
}

function maskPhone(value) {
  const digits = normalizeText(value).replace(/\D/g, "");
  if (!digits) return "";
  const national = digits.startsWith("55") && digits.length > 11 ? digits.slice(2) : digits;
  const ddd = national.slice(0, 2);
  const remainder = national.slice(2);
  if (!ddd || !remainder) return `+55 ${ddd || ""}`.trim();
  return `+55 ${ddd} ${remainder[0] || "*"}****-****`;
}

function maskCep(value) {
  const digits = normalizeText(value).replace(/\D/g, "");
  if (!digits) return "";
  return `${digits.slice(0, 2)}***-***`;
}

function maskText(value) {
  const raw = normalizeText(value);
  if (!raw) return "";
  if (raw.length <= 4) return "***";
  return `${raw.slice(0, 4)}...`;
}

function maskPublicCustomer(customer = {}) {
  return {
    name: maskName(customer.name),
    email: maskEmail(customer.email),
    phone: maskPhone(customer.phone)
  };
}

function maskPublicAddress(address = {}) {
  return {
    cep: maskCep(address.cep),
    street: maskText(address.street),
    number: address.number ? "***" : "",
    neighborhood: maskText(address.neighborhood),
    city: normalizeText(address.city),
    state: normalizeText(address.state),
    complement: address.complement ? "***" : ""
  };
}

function makeBaseUrl(req) {
  return process.env.SITE_URL || `${req.protocol}://${req.get("host")}`;
}

function toAbsoluteHttpUrl(value, baseUrl) {
  const raw = normalizeText(value);
  if (!raw) {
    return "";
  }

  try {
    if (/^https?:\/\//i.test(raw)) {
      return new URL(raw).toString();
    }
    if (raw.startsWith("/")) {
      return new URL(raw, baseUrl).toString();
    }
  } catch {
    return "";
  }

  return "";
}

function normalizeOriginValue(value) {
  const raw = normalizeText(value);
  if (!raw) return "";

  try {
    if (/^https?:\/\//i.test(raw)) {
      return new URL(raw).origin;
    }
  } catch {
    return "";
  }

  return raw.replace(/\/.*$/, "");
}

function getAllowedOrigins() {
  const raw = [
    process.env.SITE_URL,
    process.env.ADMIN_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:4173",
    "http://127.0.0.1:4173"
  ];

  if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(",").forEach((origin) => {
      const base = normalizeOriginValue(origin);
      if (base) {
        raw.push(base);
      }
    });
  }

  return raw
    .filter(Boolean)
    .flatMap((origin) => {
      const base = normalizeOriginValue(origin);
      if (!base) return [];
      return [base, `${base}/`];
    });
}

function createCorsOptions() {
  const allowedOrigins = new Set(getAllowedOrigins());
  return {
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (process.env.NODE_ENV !== "production") {
        callback(null, true);
        return;
      }
      const normalizedOrigin = String(origin).replace(/\/$/, "");
      if (allowedOrigins.has(origin) || allowedOrigins.has(normalizedOrigin)) {
        callback(null, true);
        return;
      }
      if (process.env.NODE_ENV !== "production" && /^https?:\/\/(localhost|127\.0\.0\.1)/.test(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true
  };
}

function rawBodySaver(req, _res, buf) {
  if (buf?.length) {
    req.rawBody = Buffer.from(buf);
  }
}

async function ensureDataFiles() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(uploadsDir, { recursive: true });

  if (useSupabase) return;

  try {
    await fs.access(productsFile);
    const existingProducts = await readJsonFile(productsFile, []);
    const existingIds = new Set(existingProducts.map((product) => product.id));
    const missingSeeds = seedProducts
      .filter((product) => !existingIds.has(product.id))
      .map((product) => normalizeProduct(product, product));

    if (missingSeeds.length) {
      await writeProducts([...existingProducts, ...missingSeeds]);
    }
  } catch {
    await fs.writeFile(productsFile, JSON.stringify(seedProducts, null, 2), "utf8");
  }

  try {
    await fs.access(ordersFile);
  } catch {
    await fs.writeFile(ordersFile, JSON.stringify([], null, 2), "utf8");
  }

  try {
    await fs.access(orderCounterFile);
  } catch {
    await fs.writeFile(orderCounterFile, JSON.stringify({ next: 1 }, null, 2), "utf8");
  }
}

async function readJsonFile(file, fallback) {
  try {
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

async function writeJsonFile(file, value) {
  await fs.writeFile(file, JSON.stringify(value, null, 2), "utf8");
}

async function readProducts() {
  if (useSupabase) {
    const { data, error } = await supabase.from(PRODUCT_TABLE).select("data").order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((row) => row.data).filter((product) => product && !REMOVED_PRODUCT_IDS.has(String(product.id || "").trim()));
  }

  const products = await readJsonFile(productsFile, seedProducts);
  return Array.isArray(products)
    ? products.filter((product) => product && !REMOVED_PRODUCT_IDS.has(String(product.id || "").trim()))
    : [];
}

async function writeProducts(products) {
  if (useSupabase) {
    const payload = products.map((product) => ({
      id: product.id,
      data: product,
      created_at: product.createdAt,
      updated_at: product.updatedAt
    }));

    const { error } = await supabase.from(PRODUCT_TABLE).upsert(payload, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return;
  }

  await writeJsonFile(productsFile, products);
}

async function insertProduct(product) {
  const products = await readProducts();
  products.unshift(product);
  await writeProducts(products);
}

async function updateProductById(id, nextProduct) {
  const products = await readProducts();
  const index = products.findIndex((product) => product.id === id);
  if (index === -1) return null;
  products[index] = nextProduct;
  await writeProducts(products);
  return nextProduct;
}

async function deleteProductById(id) {
  const products = await readProducts();
  const nextProducts = products.filter((product) => product.id !== id);
  if (nextProducts.length === products.length) return false;
  await writeProducts(nextProducts);
  return true;
}

async function readOrders() {
  if (useSupabase) {
    const { data, error } = await supabase.from(ORDER_TABLE).select("data").order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((row) => row.data).filter(Boolean);
  }

  return readJsonFile(ordersFile, []);
}

async function writeOrders(orders) {
  if (useSupabase) {
    const payload = orders.map((order) => ({
      id: order.id,
      data: order,
      status: order.status,
      stripe_session_id: order.stripeSessionId,
      payment_intent_id: order.paymentIntentId,
      created_at: order.createdAt,
      updated_at: order.updatedAt
    }));

    const { error } = await supabase.from(ORDER_TABLE).upsert(payload, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return;
  }

  await writeJsonFile(ordersFile, orders);
}

async function upsertOrder(order) {
  const orders = await readOrders();
  const index = orders.findIndex((item) => item.id === order.id);
  if (index === -1) {
    orders.unshift(order);
  } else {
    orders[index] = order;
  }
  await writeOrders(orders);
  return order;
}

async function findOrderBySessionId(stripeSessionId) {
  const orders = await readOrders();
  return orders.find((order) => order.stripeSessionId === stripeSessionId) || null;
}

function normalizeTrackingCodeValue(value) {
  const raw = normalizeText(value).replace(/^#/, "");
  const hex = raw.replace(/[^a-f0-9]/gi, "").slice(0, 8).toLowerCase();
  return hex ? `#${hex}` : "";
}

function deriveTrackingCodeSeed(order) {
  return normalizeText(order?.id || order?.orderNumberFormatted || order?.orderNumber || order?.stripeSessionId || "");
}

function computeTrackingCode(order) {
  const normalized = normalizeTrackingCodeValue(order?.trackingCode);
  if (normalized) return normalized;

  const seed = deriveTrackingCodeSeed(order);
  if (!seed) return "";

  const hash = crypto.createHash("sha1").update(seed).digest("hex").slice(0, 8);
  return `#${hash}`;
}

async function getNextTrackingCode() {
  const orders = await readOrders();
  const used = new Set(
    orders
      .map((order) => (normalizeTrackingCodeValue(order.trackingCode) || computeTrackingCode(order)).replace(/^#/, ""))
      .filter(Boolean)
  );

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = `#${crypto.randomBytes(4).toString("hex")}`;
    if (!used.has(candidate.replace(/^#/, ""))) {
      return candidate;
    }
  }

  return computeTrackingCode({ id: crypto.randomUUID() });
}

async function findOrderByNumber(num) {
  const orderNumber = String(num || "").replace(/\D/g, "");
  if (!orderNumber) return null;
  const orders = await readOrders();
  return orders.find((order) => {
    const currentNumber = String(order.orderNumber || "").replace(/\D/g, "");
    const formattedNumber = String(order.orderNumberFormatted || "").replace(/\D/g, "");
    return currentNumber === orderNumber || formattedNumber === orderNumber;
  }) || null;
}

async function findOrderByTrackingCode(code) {
  const accessCode = normalizeOrderAccessCodeValue(code);
  if (!accessCode) return null;
  const orders = await readOrders();
  return orders.find((order) => computeOrderAccessCode(order) === accessCode) || null;
}

async function findOrderById(id) {
  const orders = await readOrders();
  return orders.find((order) => order.id === id) || null;
}

async function syncOrderFromStripeSession(order) {
  if (!stripe || !order?.stripeSessionId) return order;

  try {
    const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
    if (!session) return order;
    const next = normalizeOrder(
      {
        ...order,
        customer: {
          ...order.customer,
          name: normalizeText(session.customer_details?.name || order.customer?.name),
          email: normalizeText(session.customer_details?.email || order.customer?.email),
          phone: normalizeText(session.customer_details?.phone || order.customer?.phone)
        },
        sessionUrl: normalizeText(session.url || order.sessionUrl)
      },
      order
    );
    if (!next.trackingUrl) {
      next.trackingUrl = buildInternalTrackingUrl(next);
    }
    if (next.sessionUrl !== order.sessionUrl || next.customer?.name !== order.customer?.name || next.customer?.email !== order.customer?.email || next.customer?.phone !== order.customer?.phone) {
      await updateOrderById(order.id, next);
    }
    return next;
  } catch (error) {
    console.warn("Falha ao sincronizar pedido com Stripe:", error.message);
  }

  return order;
}

async function updateOrderById(id, nextOrder) {
  const orders = await readOrders();
  const index = orders.findIndex((order) => order.id === id);
  if (index === -1) return null;
  orders[index] = nextOrder;
  await writeOrders(orders);
  return nextOrder;
}

async function resetOrderById(id) {
  const current = await findOrderById(id);
  if (!current) return null;

  const next = normalizeOrder(
    {
      ...current,
      status: "pending",
      hiddenInAdmin: false,
      trackingCode: "",
      trackingUrl: "",
      paidAt: "",
      canceledAt: "",
      paymentConfirmed: false,
      stripeEventId: "",
      inventoryDebitedAt: "",
      events: [
        ...(current.events || []),
        {
          type: "admin.order.reset",
          id: crypto.randomUUID(),
          created: nowIso()
        }
      ]
    },
    current
  );

  if (!next.trackingUrl) {
    next.trackingUrl = buildInternalTrackingUrl(next);
  }

  return updateOrderById(id, next);
}

async function deleteOrderById(id) {
  const orders = await readOrders();
  const nextOrders = orders.filter((order) => order.id !== id);
  if (nextOrders.length === orders.length) return false;
  await writeOrders(nextOrders);
  return true;
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : header;
  if (!token) {
    return res.status(401).json({ error: "Token de acesso ausente." });
  }

  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: "Sessão expirada ou inválida." });
  }
}

function verifyPassword(plainPassword) {
  if (process.env.ADMIN_PASSWORD_HASH) {
    return bcrypt.compare(plainPassword, process.env.ADMIN_PASSWORD_HASH);
  }
  const fallbackPassword = process.env.ADMIN_PASSWORD || "admin123";
  return Promise.resolve(plainPassword === fallbackPassword);
}

async function lookupCep(cep) {
  if (!cep) return null;
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.erro ? null : data;
  } catch {
    return null;
  }
}

function estimateShipping({ deliveryMethod, address = {}, store = DEFAULT_STORE, cepData = null }) {
  if (deliveryMethod === "retirada") {
    return { price: 0, label: "Retirada na loja" };
  }

  const storeCity = String(store.city || "").toLowerCase();
  const storeState = String(store.state || "").toUpperCase();
  const targetCity = String(address.city || cepData?.localidade || "").toLowerCase();
  const targetState = String(address.state || cepData?.uf || "").toUpperCase();
  const normalizedTargetCity = normalizeCityName(address.city || cepData?.localidade || "");

  if (targetState === "PB" && FREE_SHIPPING_CITIES.has(normalizedTargetCity)) {
    return { price: 0, label: `Frete grátis para ${cepData?.localidade || address.city || "a região"}` };
  }

  if (!targetState) {
    return deliveryMethod === "entrega"
      ? { price: 18, label: "Entrega local" }
      : { price: 28, label: "Envio nacional" };
  }

  if (deliveryMethod === "entrega") {
    if (targetCity === storeCity && targetState === storeState) {
      return { price: 12, label: `Entrega em ${cepData?.localidade || address.city || store.city}` };
    }
    if (targetState === storeState) {
      return { price: 18, label: `Entrega dentro de ${targetState}` };
    }
    return { price: 24, label: `Entrega regional para ${targetState}` };
  }

  if (targetCity === storeCity && targetState === storeState) {
    return { price: 16, label: `Envio rápido em ${cepData?.localidade || address.city || store.city}` };
  }
  if (targetState === storeState) {
    return { price: 24, label: "Envio no mesmo estado" };
  }
  const northeast = ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"];
  const north = ["AC", "AM", "AP", "PA", "RO", "RR", "TO"];
  if (northeast.includes(targetState)) return { price: 29, label: "Envio Nordeste" };
  if (north.includes(targetState)) return { price: 42, label: "Envio Norte" };
  return { price: 35, label: "Envio nacional" };
}

function createMockSession(payload) {
  const id = `cs_test_${crypto.randomUUID()}`;
  return {
    id,
    url: `${process.env.SITE_URL || "http://localhost:3000"}/loja/?mock_session=${id}`,
    payload
  };
}

async function createImageUrl(file) {
  if (!file) {
    throw new Error("Arquivo não enviado.");
  }

  const originalBaseName = path.parse(file.originalname || "image").name || "image";
  const safeBaseName = `${Date.now()}-${originalBaseName}`.replace(/[^a-zA-Z0-9._-]/g, "-");
  const optimized = await optimizeImageBuffer(file);
  const safeName = `${safeBaseName}${optimized.extension}`;

  if (useSupabase) {
    const bucket = process.env.SUPABASE_BUCKET || "product-images";
    const objectPath = `products/${safeName}`;
    const uploadResult = await supabase.storage.from(bucket).upload(objectPath, optimized.buffer, {
      contentType: optimized.contentType,
      upsert: true
    });

    if (uploadResult.error) throw new Error(uploadResult.error.message);

    const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
    return data.publicUrl;
  }

  const targetPath = path.join(uploadsDir, safeName);
  await fs.writeFile(targetPath, optimized.buffer);
  return `/uploads/${safeName}`;
}

async function optimizeImageBuffer(file) {
  const mimetype = String(file?.mimetype || "");
  if (!mimetype.startsWith("image/")) {
    return {
      buffer: file.buffer,
      contentType: mimetype || "application/octet-stream",
      extension: path.extname(file.originalname || "") || ".bin"
    };
  }

  const buffer = await sharp(file.buffer, { failOnError: false })
    .rotate()
    .resize({
      width: 1600,
      height: 1600,
      fit: "inside",
      withoutEnlargement: true
    })
    .webp({ quality: 82, effort: 6 })
    .toBuffer();

  return {
    buffer,
    contentType: "image/webp",
    extension: ".webp"
  };
}

function resolveProductId(productMap, rawId) {
  const normalizedId = normalizeText(rawId);
  if (!normalizedId) return "";
  if (productMap.has(normalizedId)) return normalizedId;
  const legacyId = LEGACY_PRODUCT_ALIASES[normalizedId];
  if (legacyId && productMap.has(legacyId)) {
    return legacyId;
  }
  return normalizedId;
}

function buildOrderNotificationText(order) {
  const name = order.customer?.name || "Cliente sem nome";
  const phone = order.customer?.phone || "Sem WhatsApp";
  const total = Number(order.amountTotal || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
  const items = Array.isArray(order.items) ? order.items.length : 0;
  const orderNumber = formatOrderNumberValue(order.orderNumberFormatted || order.orderNumber) || order.id;

  return [
    "Novo pedido BigSmoke",
    `Pedido: ${orderNumber}`,
    `Cliente: ${name}`,
    `WhatsApp: ${phone}`,
    `Itens: ${items}`,
    `Total: ${total}`,
    `Entrega: ${order.deliveryMethod || "retirada"}`
  ].join("\n");
}

function buildOrderNotificationSummary(order) {
  const name = order.customer?.name || "Cliente sem nome";
  const total = Number(order.amountTotal || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
  const itemsCount = Array.isArray(order.items)
    ? order.items.reduce((sum, item) => sum + Math.max(1, normalizeNumber(item.quantity, 1)), 0)
    : 0;
  const itemsPreview = Array.isArray(order.items)
    ? order.items.slice(0, 4).map((item) => `${item.name}${item.size ? ` (${item.size})` : ""}`).join(", ")
    : "";
  const orderLink = order.trackingUrl
    || order.sessionUrl
    || buildInternalTrackingUrl(order)
    || (process.env.SITE_URL ? `${process.env.SITE_URL.replace(/\/$/, "")}/loja/?session_id=${encodeURIComponent(order.stripeSessionId || order.id)}` : "");

  return {
    customerName: name,
    total,
    itemsCount,
    itemsPreview,
    orderId: formatOrderNumberValue(order.orderNumberFormatted || order.orderNumber) || order.id,
    orderLink
  };
}

function buildTwilioContentVariables(order) {
  const summary = buildOrderNotificationSummary(order);
  return JSON.stringify({
    1: summary.customerName,
    2: summary.total,
    3: summary.itemsCount ? String(summary.itemsCount) : "0",
    4: summary.itemsPreview || "Sem itens",
    5: summary.orderLink || ""
  });
}

function buildOrderNotificationPayload(order, event = "order.created") {
  return {
    event,
    source: "bigsmoke-store",
    message: buildOrderNotificationText(order),
    order: {
      id: order.id,
      status: order.status,
      total: order.amountTotal,
      shippingAmount: order.shippingAmount,
      subtotal: order.amountSubtotal,
      deliveryMethod: order.deliveryMethod,
      customer: order.customer,
      address: order.address,
      items: order.items
    }
  };
}

function normalizeWhatsAppAddress(value) {
  const raw = normalizeText(value);
  if (!raw) return "";
  return raw.startsWith("whatsapp:") ? raw : `whatsapp:${raw}`;
}

function normalizeBrazilianWhatsAppAddress(value) {
  const digits = normalizeText(value).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("whatsapp:")) {
    return normalizeWhatsAppAddress(digits);
  }
  if (digits.startsWith("55") && digits.length >= 12) {
    return `whatsapp:+${digits}`;
  }
  if (digits.length >= 10) {
    return `whatsapp:+55${digits}`;
  }
  return "";
}

function canSendTwilioWhatsApp() {
  return Boolean(
    twilioClient &&
    TWILIO_WHATSAPP_TO &&
    (TWILIO_MESSAGING_SERVICE_SID || TWILIO_WHATSAPP_FROM)
  );
}

async function notifyTwilioWhatsApp(order) {
  if (!canSendTwilioWhatsApp()) return false;

  const to = normalizeWhatsAppAddress(TWILIO_WHATSAPP_TO);
  const summary = buildOrderNotificationSummary(order);
  const payload = TWILIO_MESSAGING_SERVICE_SID
    ? {
        to,
        messagingServiceSid: TWILIO_MESSAGING_SERVICE_SID
      }
    : {
        from: normalizeWhatsAppAddress(TWILIO_WHATSAPP_FROM),
        to
      };

  if (TWILIO_WHATSAPP_CONTENT_SID) {
    payload.contentSid = TWILIO_WHATSAPP_CONTENT_SID;
    payload.contentVariables = buildTwilioContentVariables(order);
  } else {
    payload.body = [
      "Novo pedido BigSmoke",
      `Cliente: ${summary.customerName}`,
      `Pedido: ${summary.orderId}`,
      `Total: ${summary.total}`,
      `Itens: ${summary.itemsCount}`,
      summary.itemsPreview ? `Resumo: ${summary.itemsPreview}` : "",
      summary.orderLink ? `Rastreio: ${summary.orderLink}` : ""
    ].filter(Boolean).join("\n");
  }

  await twilioClient.messages.create(payload);
  return true;
}

async function notifyTwilioCustomerConfirmation(order) {
  if (!TWILIO_CUSTOMER_CONFIRMATION_ENABLED || !twilioClient) return false;

  const to = normalizeBrazilianWhatsAppAddress(order.customer?.phone);
  if (!to) return false;

  const summary = buildOrderNotificationSummary(order);
  const orderLink = summary.orderLink || "";
  const payload = TWILIO_MESSAGING_SERVICE_SID
    ? {
        to,
        messagingServiceSid: TWILIO_MESSAGING_SERVICE_SID
      }
    : {
        from: normalizeWhatsAppAddress(TWILIO_WHATSAPP_FROM),
        to
      };

  payload.body = [
    `Oi, ${summary.customerName}!`,
    "Seu pedido BigSmoke foi recebido com sucesso.",
    `Pedido: ${summary.orderId}`,
    `Total: ${summary.total}`,
    `Itens: ${summary.itemsCount}`,
    summary.itemsPreview ? `Resumo: ${summary.itemsPreview}` : "",
    orderLink ? `Acompanhe: ${orderLink}` : ""
  ].filter(Boolean).join("\n");

  await twilioClient.messages.create(payload);
  return true;
}

async function notifyWhatsAppWebhook(order, event = "order.created") {
  if (!WHATSAPP_WEBHOOK_URL) return false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WHATSAPP_WEBHOOK_TIMEOUT_MS);

  try {
    const response = await fetch(WHATSAPP_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(WHATSAPP_WEBHOOK_SECRET ? { "X-Webhook-Secret": WHATSAPP_WEBHOOK_SECRET } : {})
      },
      body: JSON.stringify(buildOrderNotificationPayload(order, event)),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Webhook respondeu com status ${response.status}.`);
    }

    return true;
  } finally {
    clearTimeout(timeout);
  }
}

async function notifyOrderCreated(order) {
  try {
    if (await notifyTwilioWhatsApp(order)) {
      await notifyTwilioCustomerConfirmation(order);
      return true;
    }

    await notifyTwilioCustomerConfirmation(order);
    return await notifyWhatsAppWebhook(order);
  } catch (error) {
    console.warn("Falha ao enviar notificação do pedido:", error.message);
    return false;
  }
}

function filterProducts(products, { query = "", status = "all", featured = "all", category = "all" } = {}) {
  const needle = normalizeText(query).toLowerCase();
  const selectedCategory = normalizeText(category).toLowerCase();
  return products.filter((product) => {
    const matchesStatus =
      status === "all" ||
      (status === "active" && product.active !== false) ||
      (status === "inactive" && product.active === false);
    const matchesFeatured =
      featured === "all" ||
      (featured === "featured" && product.featured) ||
      (featured === "normal" && !product.featured);
    const matchesCategory =
      selectedCategory === "all" ||
      normalizeText(product.category).toLowerCase() === selectedCategory;
    const haystack = `${product.name} ${product.category} ${product.description}`.toLowerCase();
    const matchesQuery = !needle || haystack.includes(needle);
    return matchesStatus && matchesFeatured && matchesCategory && matchesQuery;
  });
}

function filterOrders(orders, { query = "", status = "all", showHidden = "false" } = {}) {
  const needle = normalizeText(query).toLowerCase();
  const normalizedStatus = normalizeOrderStatus(status, "pending");
  const includeHidden = normalizeBoolean(showHidden, false);
  return orders.filter((order) => {
    if (!includeHidden && order.hiddenInAdmin) {
      return false;
    }
    const matchesStatus = status === "all" || normalizeOrderStatus(order.status, "pending") === normalizedStatus;
    const haystack = [
      order.id,
      order.orderNumberFormatted,
      String(order.orderNumber || ""),
      computeOrderAccessCode(order),
      computeTrackingCode(order),
      order.stripeSessionId,
      order.customer?.name,
      order.customer?.email,
      order.customer?.phone,
      order.address?.cep
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matchesQuery = !needle || haystack.includes(needle);
    return matchesStatus && matchesQuery;
  });
}

function buildAnalytics(products, orders) {
  const normalizedOrders = orders.map((order) => normalizeOrder(order, order));
  const paidOrders = STRIPE_LIVE_MODE
    ? normalizedOrders.filter((order) => order.status === "paid" && normalizeBoolean(order.paymentConfirmed, false))
    : [];
  const pendingOrders = normalizedOrders.filter((order) => order.status === "pending");
  const processingOrders = normalizedOrders.filter((order) => order.status === "processing");
  const shippedOrders = normalizedOrders.filter((order) => order.status === "shipped");
  const deliveredOrders = normalizedOrders.filter((order) => order.status === "delivered");
  const cancelledOrders = normalizedOrders.filter((order) => order.status === "canceled");
  const statusCounts = new Map([
    ["pending", pendingOrders.length],
    ["paid", paidOrders.length],
    ["processing", processingOrders.length],
    ["shipped", shippedOrders.length],
    ["delivered", deliveredOrders.length],
    ["canceled", cancelledOrders.length]
  ]);

  const totalRevenue = paidOrders.reduce((sum, order) => sum + normalizeNumber(order.amountTotal, 0), 0);
  const shippingRevenue = paidOrders.reduce((sum, order) => sum + normalizeNumber(order.shippingAmount, 0), 0);
  const productRevenue = paidOrders.reduce((sum, order) => sum + normalizeNumber(order.amountSubtotal, 0), 0);

  const productMap = new Map(products.map((product) => [product.id, product]));
  let estimatedCost = 0;
  const categorySales = new Map();
  const productSales = new Map();
  const categoryCounts = new Map();

  products.forEach((product) => {
    const category = product.category || "Sem categoria";
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
  });

  paidOrders.forEach((order) => {
    (order.items || []).forEach((item) => {
      const product = productMap.get(item.id);
      const itemRevenue = normalizeNumber(item.price, 0) * normalizeNumber(item.quantity, 1);
      const itemCost = normalizeNumber(product?.cost, normalizeNumber(product?.price, 0) * 0.6) * normalizeNumber(item.quantity, 1);
      estimatedCost += itemCost;
      const category = product?.category || item.category || "Sem categoria";
      categorySales.set(category, (categorySales.get(category) || 0) + itemRevenue);
      const productName = product?.name || item.name || item.id || "Produto";
      productSales.set(productName, (productSales.get(productName) || 0) + itemRevenue);
    });
  });

  const estimatedProfit = totalRevenue - estimatedCost;
  const averageTicket = paidOrders.length ? totalRevenue / paidOrders.length : 0;
  const conversionRate = orders.length ? (paidOrders.length / orders.length) * 100 : 0;
  const grossMargin = totalRevenue ? (estimatedProfit / totalRevenue) * 100 : 0;

  const topCategories = [...categorySales.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  const paidPerMonth = {};
  paidOrders.forEach((order) => {
    const key = (order.paidAt || order.updatedAt || order.createdAt || nowIso()).slice(0, 7);
    paidPerMonth[key] = (paidPerMonth[key] || 0) + normalizeNumber(order.amountTotal, 0);
  });

  const monthlyRevenue = Object.entries(paidPerMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({ month, value }));

  const topProducts = [...productSales.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }));

  const categoryBreakdown = [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  const stockSummary = products.reduce(
    (acc, product) => {
      const stock = normalizeStock(product.stock, 0);
      acc.total += stock;
      if (stock <= 0) acc.outOfStock += 1;
      if (stock > 0 && stock <= 5) acc.lowStock += 1;
      return acc;
    },
    { total: 0, lowStock: 0, outOfStock: 0 }
  );

  const lowStockProducts = [...products]
    .map((product) => ({
      name: product.name,
      value: normalizeStock(product.stock, 0)
    }))
    .sort((a, b) => a.value - b.value)
    .slice(0, 6);

  return {
    catalog: {
      totalProducts: products.length,
      activeProducts: products.filter((product) => product.active !== false).length,
      featuredProducts: products.filter((product) => product.featured).length,
      stockSummary
    },
    orders: {
      total: normalizedOrders.length,
      paid: paidOrders.length,
      pending: pendingOrders.length,
      processing: processingOrders.length,
      shipped: shippedOrders.length,
      delivered: deliveredOrders.length,
      cancelled: cancelledOrders.length,
      all: normalizedOrders.length
    },
    finance: {
      totalRevenue,
      productRevenue,
      shippingRevenue,
      estimatedCost,
      estimatedProfit,
      averageTicket,
      conversionRate,
      grossMargin
    },
    topCategories,
    topProducts,
    categoryBreakdown,
    monthlyRevenue,
    orderStatusBreakdown: [...statusCounts.entries()].map(([name, value]) => ({ name, value })),
    lowStockProducts,
    recentOrders: normalizedOrders.slice(0, 5)
  };
}

function paginate(items, page = 1, limit = 10) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Math.min(50, Number(limit) || 10));
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / safeLimit));
  const start = (safePage - 1) * safeLimit;
  const data = items.slice(start, start + safeLimit);
  return {
    items: data,
    total,
    page: Math.min(safePage, pages),
    limit: safeLimit,
    pages
  };
}

async function getNextOrderNumber() {
  let counter = { next: 1 };
  try {
    counter = JSON.parse(await fs.readFile(orderCounterFile, "utf8"));
  } catch {
    // use default counter
  }
  const number = Math.max(1, Math.floor(Number(counter.next) || 1));
  await fs.writeFile(orderCounterFile, JSON.stringify({ next: number + 1 }, null, 2), "utf8");
  return number;
}

function formatOrderNumber(num) {
  return `#${String(num).padStart(5, "0")}`;
}

function formatOrderNumberValue(value) {
  const raw = normalizeText(value);
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) {
    return raw.startsWith("#") ? raw : null;
  }
  return formatOrderNumber(digits);
}

function normalizeOrderAccessCodeValue(value) {
  const raw = normalizeText(value).replace(/^#/, "");
  const hex = raw.replace(/[^a-f0-9]/gi, "").slice(0, 8).toLowerCase();
  return hex ? `#${hex}` : "";
}

function deriveOrderAccessCodeSeed(order) {
  return normalizeText(order?.id || order?.orderNumberFormatted || order?.orderNumber || order?.stripeSessionId || "");
}

function computeOrderAccessCode(order) {
  const normalized = normalizeOrderAccessCodeValue(order?.orderAccessCode);
  if (normalized) return normalized;

  const seed = deriveOrderAccessCodeSeed(order);
  if (!seed) return "";

  const hash = crypto.createHash("sha1").update(seed).digest("hex").slice(0, 8);
  return `#${hash}`;
}

async function getNextOrderAccessCode() {
  const orders = await readOrders();
  const used = new Set(
    orders
      .map((order) => (normalizeOrderAccessCodeValue(order.orderAccessCode) || computeOrderAccessCode(order)).replace(/^#/, ""))
      .filter(Boolean)
  );

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = `#${crypto.randomBytes(4).toString("hex")}`;
    if (!used.has(candidate.replace(/^#/, ""))) {
      return candidate;
    }
  }

  return computeOrderAccessCode({ id: crypto.randomUUID() });
}

function buildInternalTrackingUrl(order, baseUrl = process.env.SITE_URL || "http://localhost:3000") {
  const identifier = normalizeText(computeOrderAccessCode(order) || computeTrackingCode(order) || formatOrderNumberValue(order?.orderNumberFormatted || order?.orderNumber) || order?.stripeSessionId || order?.id);
  if (!identifier) return "";
  const url = new URL("/loja/pedidos.html", baseUrl);
  url.searchParams.set("tracking", identifier);
  return url.toString();
}

function isInternalTrackingUrl(value) {
  const raw = normalizeText(value);
  if (!raw) return false;
  try {
    const url = new URL(raw, process.env.SITE_URL || "http://localhost:3000");
    const pathname = url.pathname.replace(/\/+$/, "");
    return (pathname === "/loja/pedidos.html" || pathname === "/loja") && url.searchParams.has("tracking");
  } catch {
    return raw.includes("/loja/pedidos.html?tracking=") || raw.includes("/loja/?tracking=");
  }
}

function decorateOrderForResponse(order, baseUrl = process.env.SITE_URL || "http://localhost:3000") {
  if (!order) return order;

  const orderNumber = formatOrderNumberValue(order.orderNumberFormatted || order.orderNumber);
  const orderAccessCode = computeOrderAccessCode(order);
  const trackingCode = computeTrackingCode(order);
  const trackingUrl = !order.trackingUrl || isInternalTrackingUrl(order.trackingUrl)
    ? buildInternalTrackingUrl({ ...order, orderAccessCode, trackingCode }, baseUrl)
    : order.trackingUrl;

  return {
    ...order,
    orderNumberFormatted: orderNumber,
    orderAccessCode,
    trackingCode,
    trackingUrl,
    trackingLink: trackingUrl
  };
}

async function buildOrderPayloadFromCheckout({ sessionId, items, customer, address, deliveryMethod, shipping, subtotal, total, sessionUrl }) {
  const orderNumber = await getNextOrderNumber();
  const orderAccessCode = await getNextOrderAccessCode();
  const trackingCode = await getNextTrackingCode();
  return normalizeOrder({
    stripeSessionId: sessionId,
    orderNumber,
    orderNumberFormatted: formatOrderNumber(orderNumber),
    orderAccessCode,
    trackingCode,
    trackingUrl: buildInternalTrackingUrl({ orderAccessCode, trackingCode, orderNumberFormatted: formatOrderNumber(orderNumber) }),
    status: "pending",
    currency: "brl",
    amountSubtotal: subtotal,
    shippingAmount: shipping.price,
    amountTotal: total,
    customer,
    address,
    deliveryMethod,
    shippingLabel: shipping.label,
    items,
    sessionUrl
  });
}

function validateProductPayload(payload) {
  if (!payload.name || !payload.category) {
    return "Nome e categoria são obrigatórios.";
  }
  if (!Number.isFinite(payload.price) || payload.price < 0) {
    return "Preço inválido.";
  }
  if (!Number.isInteger(payload.stock) || payload.stock < 0) {
    return "Estoque inválido.";
  }
  return "";
}

async function updateProductStockById(id, nextStock) {
  const products = await readProducts();
  const index = products.findIndex((product) => product.id === id);
  if (index === -1) return null;

  const current = products[index];
  const updated = normalizeProduct({ ...current, stock: nextStock, id }, current);
  products[index] = updated;
  await writeProducts(products);
  return updated;
}

async function applyStockDelta(items, direction) {
  if (!Array.isArray(items) || !items.length) return [];

  const products = await readProducts();
  const quantityMap = new Map();

  items.forEach((item) => {
    const id = normalizeText(item?.id);
    const quantity = Math.max(1, Math.floor(normalizeNumber(item?.quantity, 1)));
    quantityMap.set(id, (quantityMap.get(id) || 0) + quantity);
  });

  for (const [id, quantity] of quantityMap.entries()) {
    const product = products.find((entry) => entry.id === id);
    if (!product) {
      throw new Error(`Produto inválido: ${id}`);
    }

    const currentStock = normalizeStock(product.stock, 0);
    const nextStock = currentStock + (quantity * direction);
    if (nextStock < 0) {
      throw new Error(`Estoque insuficiente para ${product.name}.`);
    }
  }

  const nextProducts = products.map((product) => {
    const quantity = quantityMap.get(product.id);
    if (!quantity) return product;
    return normalizeProduct(
      {
        ...product,
        stock: normalizeStock(product.stock, 0) + (quantity * direction)
      },
      product
    );
  });

  await writeProducts(nextProducts);
  return nextProducts;
}

function buildMetadataForOrder(order) {
  return {
    order_id: order.id,
    order_number: order.orderNumberFormatted || "",
    order_access_code: order.orderAccessCode || "",
    order_status: order.status || "pending",
    customer_name: order.customer?.name || "",
    customer_phone: order.customer?.phone || "",
    delivery_method: order.deliveryMethod || "",
    shipping_label: order.shippingLabel || "",
    shipping_amount: String(order.shippingAmount || 0),
    amount_total: String(order.amountTotal || 0),
    address_city: order.address?.city || "",
    address_state: order.address?.state || "",
    address_cep: order.address?.cep || "",
    tracking_code: order.trackingCode || ""
  };
}

function setOrderPaid(order, event) {
  return normalizeOrder(
    {
      ...order,
      status: "paid",
      paidAt: nowIso(),
      paymentIntentId: event?.data?.object?.payment_intent || order.paymentIntentId,
      stripeEventId: event?.id || order.stripeEventId,
      inventoryDebitedAt: order.inventoryDebitedAt || nowIso(),
      paymentConfirmed: Boolean(event?.livemode),
      events: [
        ...(order.events || []),
        {
          type: event.type,
          id: event.id,
          created: new Date(event.created * 1000 || Date.now()).toISOString()
        }
      ]
    },
    order
  );
}

function setOrderCancelled(order, event) {
  return normalizeOrder(
    {
      ...order,
      status: "canceled",
      canceledAt: nowIso(),
      inventoryDebitedAt: "",
      events: [
        ...(order.events || []),
        {
          type: event.type,
          id: event.id,
          created: new Date(event.created * 1000 || Date.now()).toISOString()
        }
      ]
    },
    order
  );
}

app.use("/api", generalLimiter);
app.use(cors(createCorsOptions()));

app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  if (!stripe) {
    return res.status(400).json({ error: "Stripe não configurado." });
  }
  if (!WEBHOOK_SECRET) {
    return res.status(400).json({ error: "STRIPE_WEBHOOK_SECRET não configurado." });
  }

  try {
    const signature = req.headers["stripe-signature"];
    const event = stripe.webhooks.constructEvent(req.body, signature, WEBHOOK_SECRET);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const order = await findOrderBySessionId(session.id);
        if (order) {
          if ((order.stripeEventId && order.stripeEventId === event.id) || (order.status === "paid" && order.paymentConfirmed)) {
            break;
          }

          const customerDetails = session.customer_details || {};
          const shippingDetails = session.shipping_details || {};
          await applyStockDelta(order.items || [], -1);
          const next = setOrderPaid(
            {
              ...order,
              customer: {
                ...order.customer,
                name: normalizeText(customerDetails.name || order.customer?.name),
                email: normalizeText(customerDetails.email || order.customer?.email),
                phone: normalizeText(customerDetails.phone || order.customer?.phone)
              },
              address: {
                ...order.address,
                street: normalizeText(shippingDetails.address?.line1 || order.address?.street),
                complement: normalizeText(shippingDetails.address?.line2 || order.address?.complement),
                city: normalizeText(shippingDetails.address?.city || order.address?.city),
                state: normalizeText(shippingDetails.address?.state || order.address?.state),
                cep: normalizeText(shippingDetails.address?.postal_code || order.address?.cep)
              },
              shippingLabel: normalizeText(shippingDetails.name || order.shippingLabel),
              sessionUrl: normalizeText(session.url || order.sessionUrl),
              stripeEventId: event.id,
              inventoryDebitedAt: order.inventoryDebitedAt || nowIso()
            },
            event
          );
          await updateOrderById(order.id, next);
        }
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object;
        const order = await findOrderBySessionId(session.id);
        if (order) {
          if (order.status !== "paid") {
            await applyStockDelta(order.items || [], 1);
          }
          const next = setOrderCancelled(order, event);
          await updateOrderById(order.id, next);
        }
        break;
      }
      default:
        break;
    }

    return res.json({ received: true });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.use(express.json({ limit: "2mb", verify: rawBodySaver }));
app.use(express.urlencoded({ extended: true }));

function sendStoreApp(res, legacyFile = "index.html") {
  const reactIndex = path.join(frontendLojaDistDir, "index.html");
  res.sendFile(existsSync(reactIndex) ? reactIndex : path.join(frontendLojaDir, legacyFile));
}

function sendAdminApp(res, legacyFile = "index.html") {
  const reactIndex = path.join(frontendAdminDistDir, "index.html");
  res.sendFile(existsSync(reactIndex) ? reactIndex : path.join(frontendAdminDir, legacyFile));
}

app.use("/uploads", express.static(uploadsDir));
app.use("/loja", express.static(frontendLojaDistDir));
app.use("/admin", express.static(frontendAdminDistDir));
app.use("/assets", express.static(path.join(frontendLojaDir, "assets")));
app.use("/admin/assets", express.static(path.join(frontendAdminDir, "assets")));
app.use("/admin", express.static(frontendAdminDir));
app.use("/loja", express.static(frontendLojaDir));
app.use("/imagens", express.static(path.join(frontendLojaDir, "imagens")));

app.get("/Style.css", (_req, res) => res.sendFile(path.join(frontendLojaDir, "Style.css")));
app.get("/script.js", (_req, res) => res.sendFile(path.join(frontendLojaDir, "script.js")));
app.get("/robots.txt", (_req, res) => res.sendFile(path.join(frontendLojaDir, "robots.txt")));
app.get("/sitemap.xml", (_req, res) => res.sendFile(path.join(frontendLojaDir, "sitemap.xml")));
app.get("/manifest.webmanifest", (_req, res) => res.sendFile(path.join(frontendLojaDir, "manifest.webmanifest")));

app.get("/", (_req, res) => {
  sendStoreApp(res);
});

app.get("/admin", (_req, res) => {
  res.redirect("/admin/");
});

app.get("/loja", (_req, res) => {
  res.redirect("/loja/");
});

app.get("/loja/index", (_req, res) => {
  res.redirect("/loja/");
});

app.get("/loja/produto", (_req, res) => {
  sendStoreApp(res, "produto.html");
});

app.get("/loja/pedidos", (_req, res) => {
  sendStoreApp(res, "pedidos.html");
});

app.get("/loja/perfil", (_req, res) => {
  sendStoreApp(res, "perfil.html");
});

app.get("/loja/politica", (_req, res) => {
  sendStoreApp(res, "politica.html");
});

app.get("/admin/index", (_req, res) => {
  res.redirect("/admin/");
});

app.get(/^\/loja\/(produto|pedidos|perfil|politica)\/?.*/, (_req, res) => {
  sendStoreApp(res);
});

app.get(/^\/admin\/(produtos|pedidos|graficos|login)\/?.*/, (_req, res) => {
  sendAdminApp(res);
});

app.get("/api/config", (_req, res) => {
  res.json({
    store: DEFAULT_STORE,
    whatsappNumber: DEFAULT_WHATSAPP,
    paymentProvider: "stripe",
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
    paymentMetricsEnabled: STRIPE_LIVE_MODE,
    webhookConfigured: Boolean(WEBHOOK_SECRET),
    twilioConfigured: canSendTwilioWhatsApp(),
    twilioTemplateConfigured: Boolean(TWILIO_WHATSAPP_CONTENT_SID),
    twilioCustomerConfirmationEnabled: TWILIO_CUSTOMER_CONFIRMATION_ENABLED,
    orderNotificationConfigured: canSendTwilioWhatsApp() || Boolean(WHATSAPP_WEBHOOK_URL),
    adminConfigured: Boolean(process.env.ADMIN_EMAIL || process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD_HASH),
    supabaseConfigured: useSupabase,
    dataMode: useSupabase ? "supabase" : "local"
  });
});

app.post("/api/auth/login", loginLimiter, async (req, res) => {
  const email = normalizeText(req.body?.email).toLowerCase();
  const password = normalizeText(req.body?.password);
  const adminEmail = normalizeText(process.env.ADMIN_EMAIL || "admin@bigsmoke.local").toLowerCase();

  if (!email || !password) {
    return res.status(400).json({ error: "Informe e-mail e senha." });
  }
  if (email !== adminEmail) {
    return res.status(401).json({ error: "Credenciais inválidas." });
  }
  if (!(await verifyPassword(password))) {
    return res.status(401).json({ error: "Credenciais inválidas." });
  }

  const token = jwt.sign({ email: adminEmail, role: "admin" }, JWT_SECRET, { expiresIn: "12h" });
  res.json({
    token,
    user: { email: adminEmail, role: "admin" }
  });
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
  res.json({ user: req.admin });
});

app.get("/api/products", async (_req, res) => {
  try {
    const products = await readProducts();
    res.json(products.filter((product) => product.active !== false).map(toPublicProduct));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const id = normalizeText(req.params.id);
    const products = await readProducts();
    const product = products.find((item) => String(item.id) === String(id));
    if (!product) {
      return res.status(404).json({ error: "Produto não encontrado." });
    }
    res.json(toPublicProduct(product));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/orders", async (req, res) => {
  try {
    const orders = (await readOrders())
      .filter((order) => !order.hiddenInAdmin)
      .map((order) => {
        const responseOrder = decorateOrderForResponse(order, makeBaseUrl(req));
        return {
          ...responseOrder,
          customer: maskPublicCustomer(responseOrder.customer),
          address: maskPublicAddress(responseOrder.address)
        };
      });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/orders/public/:sessionId", async (req, res) => {
  try {
    const sessionId = normalizeText(req.params.sessionId);
    if (!sessionId) {
      return res.status(400).json({ error: "Session id ausente." });
    }

    const numericSession = sessionId.replace(/\D/g, "");
    let order = await findOrderByTrackingCode(sessionId)
      || await findOrderBySessionId(sessionId)
      || (numericSession ? await findOrderByNumber(numericSession) : null);
    if (!order) {
      return res.status(404).json({ error: "Pedido não encontrado." });
    }
    order = await syncOrderFromStripeSession(order);
    const responseOrder = decorateOrderForResponse(order, makeBaseUrl(req));
    const publicCustomer = maskPublicCustomer(responseOrder.customer);
    const publicAddress = maskPublicAddress(responseOrder.address);

    res.json({
      id: responseOrder.id,
      orderNumber: responseOrder.orderNumber || null,
      orderNumberFormatted: responseOrder.orderNumberFormatted || null,
      orderAccessCode: responseOrder.orderAccessCode || null,
      stripeSessionId: responseOrder.stripeSessionId,
      status: responseOrder.status,
      amountSubtotal: responseOrder.amountSubtotal,
      shippingAmount: responseOrder.shippingAmount,
      amountTotal: responseOrder.amountTotal,
      customer: publicCustomer,
      address: publicAddress,
      deliveryMethod: responseOrder.deliveryMethod,
      shippingLabel: responseOrder.shippingLabel,
      trackingCode: responseOrder.trackingCode,
      trackingUrl: responseOrder.trackingUrl,
      trackingLink: responseOrder.trackingLink,
      items: responseOrder.items,
      paidAt: responseOrder.paidAt,
      createdAt: responseOrder.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/admin/products", authMiddleware, async (req, res) => {
  try {
    const allProducts = await readProducts();
    const products = filterProducts(allProducts, req.query);
    const page = paginate(products, req.query.page, req.query.limit || 8);
    const categories = [...new Set(allProducts.map((product) => normalizeText(product.category)).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
    page.summary = {
      total: allProducts.length,
      active: allProducts.filter((product) => product.active !== false).length,
      featured: allProducts.filter((product) => product.featured).length,
      categories
    };
    res.json(page);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/admin/orders", authMiddleware, async (req, res) => {
  try {
    const orders = filterOrders(await readOrders(), req.query);
    const page = paginate(orders, req.query.page, req.query.limit || 8);
    page.items = page.items.map((order) => decorateOrderForResponse(order, makeBaseUrl(req)));
    res.json(page);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/orders", authMiddleware, async (req, res) => {
  try {
    const body = req.body || {};
    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length) {
      return res.status(400).json({ error: "Pedido sem itens." });
    }
    const orderNumber = await getNextOrderNumber();
    const orderAccessCode = await getNextOrderAccessCode();
    const trackingCode = await getNextTrackingCode();
    const subtotal = normalizeNumber(body.amountSubtotal, items.reduce((s, i) => s + normalizeNumber(i.price, 0) * Math.max(1, normalizeNumber(i.quantity, 1)), 0));
    const shippingAmount = normalizeNumber(body.shippingAmount, 0);
    const total = normalizeNumber(body.amountTotal, subtotal + shippingAmount);
    const order = normalizeOrder({
      orderNumber,
      orderNumberFormatted: formatOrderNumber(orderNumber),
      orderAccessCode,
      trackingCode,
      trackingUrl: buildInternalTrackingUrl({ orderAccessCode, trackingCode, orderNumberFormatted: formatOrderNumber(orderNumber) }),
      status: normalizeOrderStatus(body.status || "pending", "pending"),
      currency: "brl",
      amountSubtotal: subtotal,
      shippingAmount,
      amountTotal: total,
      customer: {
        name: normalizeText(body.customer?.name),
        email: normalizeText(body.customer?.email),
        phone: normalizeText(body.customer?.phone),
      },
      address: body.address || {},
      deliveryMethod: normalizeText(body.deliveryMethod) || "retirada",
      shippingLabel: normalizeText(body.shippingLabel) || "Pedido manual",
      items,
      origin: normalizeText(body.origin),
      notes: normalizeText(body.notes),
      events: [{ type: "admin.order.created", id: crypto.randomUUID(), created: nowIso() }],
    });
    await upsertOrder(order);
    res.status(201).json(decorateOrderForResponse(order, makeBaseUrl(req)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Alias for manual order
app.post("/api/admin/orders/manual", authMiddleware, async (req, res) => {
  req.url = "/api/admin/orders";
  // Re-use same handler by calling next route - just forward
  try {
    const body = req.body || {};
    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length) return res.status(400).json({ error: "Pedido sem itens." });
    const orderNumber = await getNextOrderNumber();
    const orderAccessCode = await getNextOrderAccessCode();
    const trackingCode = await getNextTrackingCode();
    const subtotal = normalizeNumber(body.amountSubtotal, items.reduce((s, i) => s + normalizeNumber(i.price, 0) * Math.max(1, normalizeNumber(i.quantity, 1)), 0));
    const shippingAmount = normalizeNumber(body.shippingAmount, 0);
    const total = normalizeNumber(body.amountTotal, subtotal + shippingAmount);
    const order = normalizeOrder({
      orderNumber, orderNumberFormatted: formatOrderNumber(orderNumber), orderAccessCode, trackingCode,
      trackingUrl: buildInternalTrackingUrl({ orderAccessCode, trackingCode, orderNumberFormatted: formatOrderNumber(orderNumber) }),
      status: normalizeOrderStatus(body.status || "pending", "pending"),
      currency: "brl", amountSubtotal: subtotal, shippingAmount, amountTotal: total,
      customer: { name: normalizeText(body.customer?.name), email: normalizeText(body.customer?.email), phone: normalizeText(body.customer?.phone) },
      address: body.address || {}, deliveryMethod: normalizeText(body.deliveryMethod) || "retirada",
      shippingLabel: normalizeText(body.shippingLabel) || "Pedido manual",
      items, origin: normalizeText(body.origin), notes: normalizeText(body.notes),
      events: [{ type: "admin.order.created", id: crypto.randomUUID(), created: nowIso() }],
    });
    await upsertOrder(order);
    res.status(201).json(decorateOrderForResponse(order, makeBaseUrl(req)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/admin/orders/:id", authMiddleware, async (req, res) => {
  try {
    const order = await findOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Pedido não encontrado." });
    }
    res.json(decorateOrderForResponse(order, makeBaseUrl(req)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/admin/analytics", authMiddleware, async (_req, res) => {
  try {
    const products = await readProducts();
    const orders = await readOrders();
    res.json(buildAnalytics(products, orders));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/products", authMiddleware, async (req, res) => {
  try {
    const incoming = normalizeProduct(req.body);
    const validationError = validateProductPayload(incoming);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const products = await readProducts();
    if (products.some((product) => product.id === incoming.id)) {
      return res.status(409).json({ error: "Já existe um produto com esse id." });
    }

    await insertProduct(incoming);
    res.status(201).json(incoming);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/admin/products/:id", authMiddleware, async (req, res) => {
  try {
    const id = normalizeText(req.params.id);
    const products = await readProducts();
    const current = products.find((product) => product.id === id);
    if (!current) {
      return res.status(404).json({ error: "Produto não encontrado." });
    }

    const updated = normalizeProduct({ ...current, ...req.body, id }, current);
    const validationError = validateProductPayload(updated);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    await updateProductById(id, updated);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/admin/products/:id/stock", authMiddleware, async (req, res) => {
  try {
    const id = normalizeText(req.params.id);
    const nextStock = normalizeStock(req.body?.stock, 0);
    const updated = await updateProductStockById(id, nextStock);
    if (!updated) {
      return res.status(404).json({ error: "Produto não encontrado." });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/admin/products/:id", authMiddleware, async (req, res) => {
  try {
    const deleted = await deleteProductById(normalizeText(req.params.id));
    if (!deleted) {
      return res.status(404).json({ error: "Produto não encontrado." });
    }
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function updateOrderStatusHandler(req, res) {
  try {
    const id = normalizeText(req.params.id);
    const current = await findOrderById(id);
    if (!current) {
      return res.status(404).json({ error: "Pedido não encontrado." });
    }
    const nextStatus = normalizeOrderStatus(req.body?.status || current.status, current.status);
    const trackingCode = normalizeText(req.body?.trackingCode || req.body?.tracking_code || current.trackingCode);
    const trackingUrl = normalizeText(req.body?.trackingUrl || req.body?.tracking_url || current.trackingUrl);
    const hiddenInAdmin = typeof req.body?.hiddenInAdmin === "undefined"
      ? current.hiddenInAdmin || false
      : normalizeBoolean(req.body.hiddenInAdmin, current.hiddenInAdmin || false);

    const next = normalizeOrder(
      {
        ...current,
        status: nextStatus,
        trackingCode,
        trackingUrl: trackingUrl || (!current.trackingUrl || isInternalTrackingUrl(current.trackingUrl) ? buildInternalTrackingUrl({ ...current, trackingCode, orderAccessCode: current.orderAccessCode || computeOrderAccessCode(current) }) : current.trackingUrl),
        hiddenInAdmin,
        paymentIntentId: req.body?.paymentIntentId || current.paymentIntentId,
        events: [
          ...(current.events || []),
          {
            type: "admin.order.updated",
            id: crypto.randomUUID(),
            created: nowIso(),
            status: nextStatus,
            trackingCode,
            trackingUrl
          }
        ]
      },
      current
    );

    if (nextStatus === "paid" && !next.paidAt) {
      next.paidAt = nowIso();
    }
    if (nextStatus === "canceled" && !next.canceledAt) {
      next.canceledAt = nowIso();
    }
    if (!next.trackingUrl) {
      next.trackingUrl = buildInternalTrackingUrl(next);
    }

    await updateOrderById(id, next);
    res.json(next);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

app.put("/api/admin/orders/:id", authMiddleware, updateOrderStatusHandler);
app.patch("/api/admin/orders/:id", authMiddleware, updateOrderStatusHandler);

app.post("/api/admin/orders/:id/reset", authMiddleware, async (req, res) => {
  try {
    const next = await resetOrderById(normalizeText(req.params.id));
    if (!next) {
      return res.status(404).json({ error: "Pedido não encontrado." });
    }
    res.json(next);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/admin/orders/:id", authMiddleware, async (req, res) => {
  try {
    const deleted = await deleteOrderById(normalizeText(req.params.id));
    if (!deleted) {
      return res.status(404).json({ error: "Pedido não encontrado." });
    }
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/uploads", authMiddleware, upload.fields([{ name: "image", maxCount: 1 }, { name: "file", maxCount: 1 }]), async (req, res) => {
  try {
    const file = req.files?.image?.[0] || req.files?.file?.[0];
    const imageUrl = await createImageUrl(file);
    res.status(201).json({ imageUrl });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/checkout/session", checkoutLimiter, async (req, res) => {
  if (!stripe && !MOCK_STRIPE) {
    return res.status(400).json({
      error: "Stripe não configurado. Defina STRIPE_SECRET_KEY ou STRIPE_MOCK."
    });
  }

  try {
    const products = await readProducts();
    const productMap = new Map(products.map((product) => [product.id, product]));
    const items = Array.isArray(req.body?.items) ? req.body.items : [];

    if (!items.length) {
      return res.status(400).json({ error: "Pedido sem itens." });
    }

    const customer = req.body?.customer || {};
    const address = req.body?.address || {};
    const deliveryMethod = normalizeText(req.body?.deliveryMethod) || "retirada";
    const baseUrl = makeBaseUrl(req);

    const normalizedItems = items.map((item) => {
      const quantity = Math.max(1, normalizeNumber(item.quantity, 1));
      const resolvedId = resolveProductId(productMap, item.id);
      const product = productMap.get(resolvedId);
      if (!product || product.active === false) {
        throw new Error(`Produto inválido: ${normalizeText(item.id)}`);
      }
      const size = normalizeText(item.size || item.tamanho);

      return {
        id: product.id,
        name: product.name,
        quantity,
        price: normalizeNumber(product.price, 0),
        category: product.category,
        image: product.image,
        size
      };
    });

    const requestedStock = new Map();
    normalizedItems.forEach((item) => {
      requestedStock.set(item.id, (requestedStock.get(item.id) || 0) + item.quantity);
    });
    for (const [id, quantity] of requestedStock.entries()) {
      const product = productMap.get(id);
      if (normalizeStock(product?.stock, 0) < quantity) {
        throw new Error(`Estoque insuficiente para ${product?.name || id}.`);
      }
    }

    const subtotal = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let cepData = null;
    if (address.cep) {
      cepData = await lookupCep(String(address.cep).replace(/\D/g, "").slice(0, 8));
    }

    const shipping = estimateShipping({ deliveryMethod, address, store: DEFAULT_STORE, cepData });
    const total = subtotal + shipping.price;

    const order = await buildOrderPayloadFromCheckout({
      sessionId: "",
      items: normalizedItems,
      customer: {
        name: normalizeText(customer.name),
        email: normalizeText(customer.email),
        phone: normalizeText(customer.phone)
      },
      address,
      deliveryMethod,
      shipping,
      subtotal,
      total,
      sessionUrl: ""
    });

    const lineItems = normalizedItems.map((item) => ({
      price_data: {
        currency: "brl",
        product_data: {
          name: item.size ? `${item.name} - ${item.size}` : item.name,
          description: item.size ? `${item.category} • Tamanho ${item.size}` : item.category,
          images: (() => {
            const imageUrl = toAbsoluteHttpUrl(item.image, baseUrl);
            return imageUrl ? [imageUrl] : [];
          })()
        },
        unit_amount: Math.round(item.price * 100)
      },
      quantity: item.quantity
    }));

    if (shipping.price > 0) {
      lineItems.push({
        price_data: {
          currency: "brl",
          product_data: {
            name: shipping.label
          },
          unit_amount: Math.round(shipping.price * 100)
        },
        quantity: 1
      });
    }

    let session;

    if (MOCK_STRIPE) {
      session = createMockSession({ lineItems, order });
    } else {
      session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: lineItems,
        customer_creation: "always",
        customer_email: normalizeText(customer.email) || undefined,
        billing_address_collection: "required",
        phone_number_collection: { enabled: true },
        name_collection: {
          individual: { enabled: true, optional: false }
        },
        shipping_address_collection: {
          allowed_countries: ["BR"]
        },
        success_url: new URL("/loja/?checkout=success&session_id={CHECKOUT_SESSION_ID}", baseUrl).toString(),
        cancel_url: new URL("/loja/?checkout=cancelled", baseUrl).toString(),
        locale: "pt-BR",
        metadata: buildMetadataForOrder(order)
      });
    }

    const nextOrder = normalizeOrder(
      {
        ...order,
        stripeSessionId: session.id,
        sessionUrl: session.url,
        items: normalizedItems,
        amountSubtotal: subtotal,
        shippingAmount: shipping.price,
        amountTotal: total,
        status: "pending"
      },
      order
    );

    await upsertOrder(nextOrder);
    notifyOrderCreated(nextOrder);
    res.json({
      url: session.url,
      id: session.id,
      orderId: nextOrder.id,
      orderNumber: nextOrder.orderNumber || null,
      orderNumberFormatted: nextOrder.orderNumberFormatted || null
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/healthz", (_req, res) => {
  res.json({
    ok: true,
    timestamp: nowIso(),
    mode: useSupabase ? "supabase" : "local",
    supabase: useSupabase,
    stripe: Boolean(stripe),
    paymentMetricsEnabled: STRIPE_LIVE_MODE,
    webhookConfigured: Boolean(WEBHOOK_SECRET)
  });
});

app.use((err, _req, res, _next) => {
  console.error("Erro não tratado:", err.message);
  res.status(500).json({ error: "Erro interno do servidor." });
});

app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Rota não encontrada." });
  }
  return res.status(404).send("Not found");
});

async function start(port = Number(process.env.PORT || 3000)) {
  validateRuntimeConfig();
  await ensureDataFiles();
  return app.listen(port, () => {
    console.log(`BigSmoke rodando em http://localhost:${port}`);
  });
}

module.exports = {
  app,
  start,
  __internals: {
    stripe,
    WEBHOOK_SECRET,
    readOrders,
    readProducts
  }
};

