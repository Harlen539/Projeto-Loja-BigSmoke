export const SETTINGS_STORAGE_KEY = "bigsmoke_admin_settings";
export const COUPONS_STORAGE_KEY = "bigsmoke_admin_coupons";

export const defaultSettings = {
  admin: {
    name: "Admin",
    email: "admin@bigsmoke.local",
    role: "Administrador",
    avatarInitial: "A",
  },
  store: {
    name: "BigSmoke",
    whatsapp: "5583986494691",
    instagram: "@bigsmokestyle",
    email: "contato@bigsmoke.com",
  },
  payments: {
    abacatepay: true,
    pix: true,
    card: true,
    boleto: false,
    cashOnDelivery: false,
    abacatepayConfig: { apiConfigured: false, webhookConfigured: false, mode: "Producao" },
    pixConfig: { keyType: "CPF", key: "", receiverName: "BigSmoke", receiverCity: "João Pessoa", discount: 5 },
    boletoConfig: { provider: "Mercado Pago", dueDays: 3, instructions: "" },
    cashConfig: { allowChange: true, maxValue: 300, notes: "" },
  },
  delivery: {
    correios: false,
    localDelivery: true,
    storePickup: true,
    freeShippingValue: 199.9,
    regions: "João Pessoa, Cabedelo",
    correiosConfig: { originCep: "", contractCode: "", defaultService: "Ambos", extraDays: 1, handlingFee: 0, testCep: "" },
    localConfig: { enabled: true, price: 12, estimatedTime: "1 dia útil", regions: "João Pessoa, Cabedelo", minOrderValue: 50 },
    pickupConfig: { enabled: true, address: "Loja BigSmoke", hours: "Segunda a sexta, 9h às 18h", instructions: "" },
  },
  notifications: {
    whatsappOrderConfirmed: false,
    whatsappOrderSent: true,
    emailPaymentApproved: false,
    adminNewOrderAlert: true,
    adminWhatsapp: "5583986494691",
    adminEmail: "admin@bigsmoke.local",
    orderConfirmedMessage: "Seu pedido foi confirmado.",
    orderSentMessage: "Seu pedido saiu para entrega.",
    paymentApprovedMessage: "Pagamento aprovado com sucesso.",
    soundAlert: true,
  },
  checkout: {
    loginRequired: false,
    cpfRequired: true,
    couponEnabled: true,
    orderNoteEnabled: true,
    termsRequired: true,
    postPurchaseMessage: "Obrigado pela compra. A BigSmoke já recebeu seu pedido.",
    termsText: "Ao comprar, você aceita os termos da loja.",
    exchangePolicyUrl: "",
    privacyPolicyUrl: "",
  },
  security: {
    twoFactorEnabled: true,
    activeSessions: 3,
    sessions: [
      { id: "s1", device: "Chrome Windows", location: "João Pessoa", lastAccess: "Ativa agora" },
      { id: "s2", device: "Celular Android", location: "Cabedelo", lastAccess: "Último acesso há 2h" },
      { id: "s3", device: "Chrome Desktop", location: "João Pessoa", lastAccess: "Último acesso ontem" },
    ],
    accessHistory: [
      { date: "22/05/2024 03:15", device: "Chrome Windows", location: "João Pessoa", status: "Sucesso" },
      { date: "21/05/2024 22:40", device: "Android", location: "Cabedelo", status: "Sucesso" },
      { date: "20/05/2024 18:11", device: "Chrome", location: "Local desconhecido", status: "Bloqueado" },
    ],
  },
  coupons: {
    activeCoupons: 8,
    activePromotions: 3,
    pixDiscount: 5,
    freeShippingValue: 199.9,
  },
};

export const defaultCoupons = [
  { id: "c1", code: "BIG10", type: "percent", target: "products", value: 10, active: true, minOrderValue: 100, usageLimit: 50 },
  { id: "c2", code: "STREET20", type: "percent", target: "products", value: 20, active: true, minOrderValue: 200, usageLimit: 25 },
  { id: "c3", code: "FRETE199", type: "fixed", target: "shipping", value: 25, active: false, minOrderValue: 199.9, usageLimit: 100 },
];

function mergeSettings(base, saved) {
  if (!saved || typeof saved !== "object") return base;
  return {
    ...base,
    ...saved,
    admin: { ...base.admin, ...saved.admin },
    store: { ...base.store, ...saved.store },
    payments: { ...base.payments, ...saved.payments },
    delivery: { ...base.delivery, ...saved.delivery },
    notifications: { ...base.notifications, ...saved.notifications },
    checkout: { ...base.checkout, ...saved.checkout },
    security: { ...base.security, ...saved.security },
    coupons: { ...base.coupons, ...saved.coupons },
  };
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function getSettings() {
  return mergeSettings(defaultSettings, readJson(SETTINGS_STORAGE_KEY, null));
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  return settings;
}

export function updateSettings(section, data) {
  const next = { ...getSettings(), [section]: { ...getSettings()[section], ...data } };
  return saveSettings(next);
}

export function getCoupons() {
  return readJson(COUPONS_STORAGE_KEY, defaultCoupons);
}

export function saveCoupons(coupons) {
  localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(coupons));
  return coupons;
}
