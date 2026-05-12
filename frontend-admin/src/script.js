const TOKEN_KEY = "bigsmoke-admin-token";
const LOCAL_PRODUCTS_KEY = "bigsmoke-local-products";
const LOCAL_ORDERS_KEY = "bigsmoke-local-orders";
const NOTIFICATION_READ_KEY = "bigsmoke-admin-read-notifications";
const NOTIFICATION_SEEN_KEY = "bigsmoke-admin-seen-orders";
const PLACEHOLDER_IMAGE = "https://placehold.co/600x800/111111/F5F0E8?text=Preview";
const ORDER_STATUS_FLOW = ["pending", "paid", "processing", "shipped", "delivered"];
const ORDER_STATUS_LABELS = {
  pending: "Pendente",
  paid: "Pago",
  processing: "Em separação",
  shipped: "Enviado",
  delivered: "Entregue",
  canceled: "Cancelado"
};
const ORDER_STATUS_PROGRESS = {
  pending: 0,
  paid: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
  canceled: -1
};

const FALLBACK_PRODUCTS = [
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

let authToken = localStorage.getItem(TOKEN_KEY) || "";
let currentUser = null;
let editingId = null;
let currentFilePreview = "";
let uploadMode = "local";
let apiBaseUrl = "";
let apiAvailable = false;
let extraImagesUrls = []; // URLs das fotos adicionais (já upadas ou externas)
let cachedProducts = [];
let cachedOrders = [];
let notificationPollTimer = null;
let lastNotificationOrderIds = new Set(getStoredJson(NOTIFICATION_SEEN_KEY, []));
let readNotificationIds = new Set(getStoredJson(NOTIFICATION_READ_KEY, []));
let runtimeConfig = {
  paymentMetricsEnabled: false,
  stripeConfigured: false,
  dataMode: "local",
  whatsappNumber: "5583986494691"
};
let dashboardCharts = {
  sales: null,
  categories: null,
  monthly: null,
  orders: null,
  stock: null
};
let state = {
  products: {
    query: "",
    status: "all",
    category: "all",
    featured: "all",
    page: 1,
    limit: 100
  },
  orders: {
    query: "",
    status: "all",
    showHidden: false,
    page: 1,
    limit: 6
  }
};

function $(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^\/(?!\/)/.test(raw)) return raw;
  if (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(raw)) return raw;
  try {
    const url = new URL(raw, window.location.origin);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function getProductImage(product) {
  return safeUrl(product?.image || product?.image_url || (Array.isArray(product?.images) ? product.images[0] : "") || PLACEHOLDER_IMAGE) || PLACEHOLDER_IMAGE;
}

function imageFallbackAttr() {
  return `onerror="this.onerror=null;this.src='${PLACEHOLDER_IMAGE}';this.classList.add('is-missing')"`;
}

function setAuthToken(token) {
  authToken = token;
  localStorage.setItem(TOKEN_KEY, token);
}

function clearAuthToken() {
  authToken = "";
  localStorage.removeItem(TOKEN_KEY);
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function buildInternalTrackingUrl(order) {
  const trackingId = order?.orderNumberFormatted || order?.orderNumber || order?.stripeSessionId || order?.id;
  if (!trackingId) return "";
  const url = new URL("/loja/pedidos.html", window.location.origin);
  url.searchParams.set("tracking", trackingId);
  return url.toString();
}

function isInternalTrackingUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return false;
  try {
    const url = new URL(raw, window.location.origin);
    const pathname = url.pathname.replace(/\/+$/, "");
    return (pathname === "/loja/pedidos.html" || pathname === "/loja") && url.searchParams.has("tracking");
  } catch {
    return raw.includes("/loja/pedidos.html?tracking=") || raw.includes("/loja/?tracking=");
  }
}

function formatOrderStatus(status) {
  return ORDER_STATUS_LABELS[normalizeOrderStatus(status)] || "Pendente";
}

function normalizeOrderStatus(status) {
  const raw = String(status || "").trim().toLowerCase();
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
  return aliases[raw] || "pending";
}

function statusTone(status) {
  switch (normalizeOrderStatus(status)) {
    case "paid":
      return "status-paid";
    case "processing":
      return "status-processing";
    case "shipped":
      return "status-shipped";
    case "delivered":
      return "status-delivered";
    case "canceled":
      return "status-canceled";
    default:
      return "status-pending";
  }
}

function getOrderProgress(status) {
  const normalized = normalizeOrderStatus(status);
  if (normalized === "canceled") return -1;
  return ORDER_STATUS_PROGRESS[normalized] ?? 0;
}

function renderOrderProgress(status) {
  const progress = getOrderProgress(status);
  if (progress < 0) {
    return `
      <div class="order-progress canceled">
        <span class="order-progress-badge">Cancelado</span>
      </div>
    `;
  }

  return `
    <div class="order-progress" aria-label="Status do pedido">
      ${ORDER_STATUS_FLOW.map((step, index) => {
        const isActive = index === progress;
        const isDone = index < progress;
        let cls = "order-progress-step";
        if (isActive) cls += " active";
        if (isDone) cls += " done";
        return `
          <span class="${cls}">
            <i></i>
            <strong>${ORDER_STATUS_LABELS[step]}</strong>
          </span>
        `;
      }).join("")}
    </div>
  `;
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function buildUrl(path, params = {}) {
  const url = new URL(path, apiBaseUrl || window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).length > 0) {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

function getStoreUrl(path = "/") {
  const { protocol, hostname, port, origin } = window.location;

  if ((hostname === "localhost" || hostname === "127.0.0.1") && port === "5174") {
    return new URL(path, `${protocol}//${hostname}:5173`).toString();
  }

  return new URL(`/loja${path.startsWith("/") ? path : `/${path}`}`, apiBaseUrl || origin).toString();
}

function normalizeRoute(path) {
  try {
    const url = new URL(path, window.location.origin);
    return `${url.pathname}${url.search}`;
  } catch {
    return path;
  }
}

function getStoredJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStoredJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error("Erro ao salvar no localStorage:", err);
    alert("Erro ao salvar: o armazenamento local está cheio.\n\nDica: remova produtos antigos com muitas imagens, ou use imagens menores.");
  }
}

function seedLocalProducts() {
  const current = getStoredJson(LOCAL_PRODUCTS_KEY, null);
  if (current && Array.isArray(current) && current.length) {
    const next = current.filter((product) => !REMOVED_PRODUCT_IDS.has(String(product?.id || "").trim()));
    if (next.length !== current.length) setStoredJson(LOCAL_PRODUCTS_KEY, next);
    return next;
  }
  setStoredJson(LOCAL_PRODUCTS_KEY, FALLBACK_PRODUCTS);
  return FALLBACK_PRODUCTS;
}

function getLocalProducts() {
  return getStoredJson(LOCAL_PRODUCTS_KEY, seedLocalProducts())
    .filter((product) => !REMOVED_PRODUCT_IDS.has(String(product?.id || "").trim()));
}

function getLocalOrders() {
  return getStoredJson(LOCAL_ORDERS_KEY, []);
}

let previewGalleryIndex = 0;
let previewGalleryImages = [];

function setImagePreview(source) {
  // legacy single-image call — just set index 0
  if (source && source !== PLACEHOLDER_IMAGE) {
    const idx = previewGalleryImages.indexOf(source);
    if (idx >= 0) {
      previewGalleryIndex = idx;
    } else {
      previewGalleryImages = [source, ...previewGalleryImages.filter((u) => u !== source)];
      previewGalleryIndex = 0;
    }
  }
  renderPreviewGallery();
}

function syncPreviewGallery() {
  // Build the full preview list: all images in order
  const allUrls = [];
  if (currentFilePreview) allUrls.push(currentFilePreview);
  if ($("product-image").value.trim()) allUrls.push($("product-image").value.trim());
  extraImagesUrls.forEach((u) => { if (!allUrls.includes(u)) allUrls.push(u); });
  previewGalleryImages = allUrls.length ? allUrls : [PLACEHOLDER_IMAGE];
  if (previewGalleryIndex >= previewGalleryImages.length) previewGalleryIndex = 0;
  renderPreviewGallery();
}

function renderPreviewGallery() {
  const img = $("product-image-preview");
  const counter = $("preview-counter");
  const thumbsEl = $("preview-thumbs");
  const prevBtn = $("preview-nav-prev");
  const nextBtn = $("preview-nav-next");
  if (!img) return;

  const images = previewGalleryImages.length ? previewGalleryImages : [PLACEHOLDER_IMAGE];
  const idx = Math.max(0, Math.min(previewGalleryIndex, images.length - 1));
  img.src = safeUrl(images[idx]) || PLACEHOLDER_IMAGE;

  const multi = images.length > 1 && images[0] !== PLACEHOLDER_IMAGE;

  // counter
  if (counter) {
    counter.style.display = multi ? "flex" : "none";
    counter.textContent = `${idx + 1} / ${images.length}`;
  }

  // nav arrows
  if (prevBtn) prevBtn.style.display = multi ? "flex" : "none";
  if (nextBtn) nextBtn.style.display = multi ? "flex" : "none";

  // thumbs strip
  if (thumbsEl) {
    thumbsEl.innerHTML = "";
    if (multi) {
      images.forEach((url, i) => {
        const t = document.createElement("button");
        t.type = "button";
        t.className = `preview-thumb-item${i === idx ? " active" : ""}`;
        const thumbImg = document.createElement("img");
        thumbImg.src = safeUrl(url) || PLACEHOLDER_IMAGE;
        thumbImg.alt = `foto ${i + 1}`;
        thumbImg.loading = "lazy";
        t.appendChild(thumbImg);
        t.addEventListener("click", () => { previewGalleryIndex = i; renderPreviewGallery(); });
        thumbsEl.appendChild(t);
      });
    }
  }
}

function previewGalleryNav(dir) {
  const len = previewGalleryImages.length;
  if (!len) return;
  previewGalleryIndex = (previewGalleryIndex + dir + len) % len;
  renderPreviewGallery();
}

function getThumbstripUrls() {
  const urls = [];
  const seen = new Set();
  [currentFilePreview, $("product-image")?.value.trim(), ...extraImagesUrls].forEach((value) => {
    const url = String(value || "").trim();
    if (!url || seen.has(url)) return;
    seen.add(url);
    urls.push(url);
  });
  return urls;
}

function applyThumbstripOrder(urls) {
  const nextUrls = urls.map((value) => String(value || "").trim()).filter(Boolean);
  const mainUrl = nextUrls[0] || "";
  currentFilePreview = mainUrl;
  const productImageInput = $("product-image");
  if (productImageInput) {
    productImageInput.value = mainUrl;
  }
  extraImagesUrls = nextUrls.slice(1).filter((url) => url !== mainUrl);

  const hidden = $("product-extra-urls");
  if (hidden) {
    hidden.value = JSON.stringify(extraImagesUrls);
  }
}

function promoteThumbstripImage(url) {
  const orderedUrls = getThumbstripUrls();
  const next = [url, ...orderedUrls.filter((entry) => entry !== url)];
  applyThumbstripOrder(next);
  renderThumbstrip();
  syncPreviewGallery();
}

function removeThumbstripImage(url) {
  const orderedUrls = getThumbstripUrls().filter((entry) => entry !== url);
  applyThumbstripOrder(orderedUrls);
  renderThumbstrip();
  syncPreviewGallery();
}

function updateDescriptionCounter(value = "") {
  const counter = $("desc-char-counter");
  if (!counter) return;

  const length = String(value || "").length;
  counter.textContent = `${length} / 500`;
  counter.classList.toggle("warn", length >= 400 && length <= 500);
  counter.classList.toggle("over", length > 500);
}

function renderThumbstrip() {
  const wrapper = $("upload-thumbstrip");
  const inner = $("upload-thumbstrip-inner");
  const hidden = $("product-extra-urls");
  const previewGrid = $("extra-images-preview");
  if (!wrapper || !inner) return;

  const urls = getThumbstripUrls();
  inner.innerHTML = "";

  if (hidden) {
    hidden.value = JSON.stringify(extraImagesUrls);
  }

  if (previewGrid) {
    previewGrid.style.display = "none";
    previewGrid.innerHTML = "";
  }

  if (!urls.length) {
    wrapper.style.display = "none";
    return;
  }

  wrapper.style.display = "flex";

  urls.forEach((url, index) => {
    const item = document.createElement("div");
    item.className = `thumbstrip-item${index === 0 ? " is-main" : ""}`;
    item.dataset.url = url;
    item.draggable = true;

    const img = document.createElement("img");
    img.src = url;
    img.alt = `Foto ${index + 1}`;
    img.loading = "lazy";

    const star = document.createElement("button");
    star.type = "button";
    star.className = "thumbstrip-star";
    star.innerHTML = "★";
    star.title = "Definir como principal";
    star.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (index === 0) return;
      promoteThumbstripImage(url);
    });

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "thumbstrip-remove";
    removeBtn.textContent = "×";
    removeBtn.title = "Remover foto";
    removeBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      removeThumbstripImage(url);
    });

    if (index === 0) {
      const badge = document.createElement("span");
      badge.className = "thumbstrip-main-badge";
      badge.textContent = "Principal";
      item.appendChild(badge);
    }

    item.appendChild(img);
    item.appendChild(star);
    item.appendChild(removeBtn);

    item.addEventListener("dragstart", (event) => {
      item.classList.add("dragging");
      event.dataTransfer.setData("text/plain", url);
    });
    item.addEventListener("dragend", () => item.classList.remove("dragging"));
    item.addEventListener("dragover", (event) => {
      event.preventDefault();
      item.classList.add("drag-target");
    });
    item.addEventListener("dragleave", () => item.classList.remove("drag-target"));
    item.addEventListener("drop", (event) => {
      event.preventDefault();
      item.classList.remove("drag-target");
      const fromUrl = event.dataTransfer.getData("text/plain");
      if (!fromUrl || fromUrl === url) return;
      const ordered = getThumbstripUrls().filter((entry) => entry !== fromUrl);
      const targetIndex = ordered.indexOf(url);
      if (targetIndex < 0) return;
      ordered.splice(targetIndex, 0, fromUrl);
      applyThumbstripOrder(ordered);
      renderThumbstrip();
      syncPreviewGallery();
    });

    inner.appendChild(item);
  });

  const addButton = document.querySelector(".upload-thumbstrip-add");
  if (addButton) {
    inner.parentElement?.appendChild(addButton);
  }

  renderMainImageColorControl();
}

function renderExtraImagesGrid() {
  renderThumbstrip();
}

function collectProductDraft() {
  const allImages = [...new Set(
    [
      currentFilePreview || "",
      $("product-image").value.trim(),
      ...extraImagesUrls
    ].map((value) => String(value || "").trim()).filter(Boolean)
  )];

  const mainImage = allImages[0] || PLACEHOLDER_IMAGE;
  const draft = {
    id: editingId || `preview-${Date.now()}`,
    name: $("product-name").value.trim() || "Produto BigSmoke",
    category: $("product-category").value.trim() || "Categoria",
    description: $("product-description").value.trim() || "Peça BigSmoke Streetwear.",
    price: Number($("product-price").value) || 0,
    stock: Math.max(0, Math.floor(Number($("product-stock").value || 0))),
    badge: $("product-badge").value.trim() || $("product-category").value.trim() || "BigSmoke",
    sizes: $("product-sizes").value.trim() || "P, M, G, GG",
    image: mainImage,
    image_url: mainImage,
    images: allImages,
    active: $("product-active").checked,
    featured: $("product-featured").checked
  };

  return draft;
}

async function collectProductPayload() {
  const draft = collectProductDraft();
  const uploadedMainImage = await uploadImageIfNeeded();

  const mainImage = uploadedMainImage && uploadedMainImage !== PLACEHOLDER_IMAGE
    ? uploadedMainImage
    : (draft.images[0] || PLACEHOLDER_IMAGE);

  const images = [...new Set(
    [mainImage, ...draft.images].map((u) => String(u || "").trim()).filter(Boolean)
  )];

  assignImageToSelectedMainColor(mainImage, draft.images[0] && draft.images[0] !== mainImage ? [draft.images[0]] : []);

  return {
    ...draft,
    image: mainImage,
    image_url: mainImage,
    images,
    colors: serializeColorVariants()
  };
}

function savePreviewDraft(product) {
  try {
    localStorage.setItem("bigsmoke-product-preview-draft", JSON.stringify(product));
  } catch {
    // draft preview is optional
  }
}

function getPreviewProductUrl(product) {
  const isDraft = !product?.id || String(product.id).startsWith("preview-");
  if (isDraft) {
    savePreviewDraft(product);
  }

  return apiAvailable
    ? buildUrl("/loja/produto.html", isDraft ? { preview: "draft" } : { id: product.id })
    : isDraft
      ? `../loja/produto.html?preview=draft`
      : `../loja/produto.html?id=${encodeURIComponent(product.id)}`;
}


function updateStoreLink() {
  const link = $("open-store-link");
  if (!link) return;

  link.href = getStoreUrl("/");
  link.target = "_blank";
  link.rel = "noreferrer";
}

function openStorePreview(product) {
  if (!product?.id) return;

  const url = getPreviewProductUrl(product);

  window.open(url, "_blank", "noopener,noreferrer");
}

function openDraftPreview() {
  const draft = collectProductDraft();
  const url = getPreviewProductUrl(draft);
  window.open(url, "_blank", "noopener,noreferrer");
}

async function previewSelectedFile(file) {
  if (!file) {
    currentFilePreview = "";
    syncPreviewGallery();
    return;
  }

  // Comprime a imagem principal para evitar estourar o localStorage
  currentFilePreview = await compressImageToBase64(file);

  syncPreviewGallery();
}
function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function updateFileLabel(file) {
  const label = $("file-upload-area");
  const text = $("file-upload-text");
  if (!label || !text) return;

  if (file) {
    label.classList.add("has-file");
    text.textContent = `${file.name} • ${formatFileSize(file.size)}`;
    return;
  }

  label.classList.remove("has-file");
  text.textContent = "📁 Clique ou arraste uma imagem aqui para fazer upload";
}

function showLogin(message = "") {
  $("login-view").classList.remove("hidden");
  $("dashboard-view").classList.add("hidden");
  $("topbar").classList.add("hidden");
  $("sidebar").classList.add("hidden");
  $("alerts-area").innerHTML = "";
  if (message) $("login-message").textContent = message;
}

function showDashboard() {
  $("login-view").classList.add("hidden");
  $("dashboard-view").classList.remove("hidden");
  $("topbar").classList.remove("hidden");
  $("sidebar").classList.remove("hidden");
  switchSection("overview");
}

function fillForm(product) {
  editingId = product?.id || null;
  $("form-title").textContent = editingId ? "Editar produto" : "Novo produto";
  $("product-name").value = product?.name || "";
  $("product-category").value = product?.category || "";
  $("product-price").value = product?.price ?? "";
  $("product-stock").value = product?.stock ?? 0;
  $("product-badge").value = product?.badge || "";
  $("product-sizes").value = product?.sizes || "";
  const mainImage = product?.image || product?.image_url || (Array.isArray(product?.images) ? product.images[0] : "") || "";
  const extraImages = Array.isArray(product?.images)
    ? product.images.slice(1).map((url) => String(url || "").trim()).filter(Boolean)
    : [];
  $("product-image").value = mainImage;
  // Populate gallery preview
  extraImagesUrls = [...extraImages];
  renderExtraImagesGrid();
  $("product-description").value = product?.description || "";
  $("product-active").checked = product?.active !== false;
  $("product-featured").checked = Boolean(product?.featured);
  const productFileInput = $("product-file");
  if (productFileInput) {
    productFileInput.value = "";
  }
  updateFileLabel(null);
  currentFilePreview = "";
  previewGalleryIndex = 0;
  previewGalleryImages = [];
  syncPreviewGallery();
  renderThumbstrip();
  updateDescriptionCounter($("product-description").value);
}

function resetForm() {
  editingId = null;
  extraImagesUrls = [];
  fillForm(null);
}

async function detectApiBase() {
  const candidates = [
    window.location.origin,
    "http://127.0.0.1:3000",
    "http://localhost:3000"
  ];

  for (const base of candidates) {
    try {
      const response = await fetch(`${base}/healthz`, { method: "GET" });
      if (response.ok) {
        apiBaseUrl = base;
        apiAvailable = true;
        return;
      }
    } catch {
      // try next
    }
  }

  apiBaseUrl = "";
  apiAvailable = false;
}

async function apiFetch(path, options = {}) {
  if (!apiAvailable) {
    return localApiFetch(path, options);
  }

  const headers = new Headers(options.headers || {});
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(buildUrl(path), { ...options, headers });
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) {
    throw new Error(data?.error || data || "Falha na requisição.");
  }
  return data;
}

function localAuthLogin(body) {
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "").trim();
  if (email !== "admin@bigsmoke.local" || password !== "admin123") {
    throw new Error("Credenciais inválidas.");
  }
  const token = "local-admin-token";
  setAuthToken(token);
  return {
    token,
    user: { email, role: "admin" }
  };
}

function localNormalizeProduct(input = {}, current = {}) {
  const now = new Date().toISOString();
  const inputImages = Array.isArray(input.images) ? input.images.filter(Boolean) : [];
  const currentImages = Array.isArray(current.images) ? current.images.filter(Boolean) : [];
  const images = inputImages.length ? inputImages : currentImages;
  const mainImage = String(input.image || input.image_url || images[0] || "").trim();
  return {
    id: input.id || current.id || `local-${Date.now()}`,
    name: String(input.name || "").trim(),
    category: String(input.category || "").trim(),
    description: String(input.description || "").trim(),
    price: Number(input.price) || 0,
    stock: Math.max(0, Math.floor(Number(input.stock ?? current.stock ?? 0) || 0)),
    image: mainImage,
    image_url: mainImage,
    images,
    sizes: String(input.sizes || "").trim() || "P, M, G, GG",
    badge: String(input.badge || "").trim() || String(input.category || "").trim() || "BigSmoke",
    active: input.active !== false,
    featured: Boolean(input.featured),
    colors: Array.isArray(input.colors) ? input.colors : Array.isArray(current.colors) ? current.colors : [],
    createdAt: current.createdAt || input.createdAt || now,
    updatedAt: now
  };
}

function localAnalytics() {
  const products = getLocalProducts();
  const orders = getLocalOrders();
  const normalizedOrders = orders.map((order) => ({ ...order, status: normalizeOrderStatus(order.status) }));
  const paidOrders = runtimeConfig.paymentMetricsEnabled
    ? normalizedOrders.filter((order) => order.status === "paid" && Boolean(order.paymentConfirmed))
    : [];
  const pendingOrders = normalizedOrders.filter((order) => order.status === "pending");
  const processingOrders = normalizedOrders.filter((order) => order.status === "processing");
  const shippedOrders = normalizedOrders.filter((order) => order.status === "shipped");
  const deliveredOrders = normalizedOrders.filter((order) => order.status === "delivered");
  const cancelledOrders = normalizedOrders.filter((order) => order.status === "canceled");
  const revenue = paidOrders.reduce((sum, order) => sum + Number(order.amountTotal || 0), 0);
  let estimatedCost = 0;

  paidOrders.forEach((order) => {
    (order.items || []).forEach((item) => {
      const product = products.find((product) => product.id === item.id);
      const itemPrice = Number(item.price || 0);
      const qty = Number(item.quantity || 1);
      estimatedCost += (Number(product?.cost || itemPrice * 0.6) * qty);
    });
  });

  const profit = revenue - estimatedCost;
  const avgTicket = paidOrders.length ? revenue / paidOrders.length : 0;
  const conversion = orders.length ? (paidOrders.length / orders.length) * 100 : 0;
  const margin = revenue ? (profit / revenue) * 100 : 0;
  const categoryCounts = new Map();
  const productSales = new Map();
  const statusCounts = new Map([
    ["pending", pendingOrders.length],
    ["paid", paidOrders.length],
    ["processing", processingOrders.length],
    ["shipped", shippedOrders.length],
    ["delivered", deliveredOrders.length],
    ["canceled", cancelledOrders.length]
  ]);

  products.forEach((product) => {
    const category = product.category || "Sem categoria";
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
  });

  paidOrders.forEach((order) => {
    (order.items || []).forEach((item) => {
      const product = products.find((product) => product.id === item.id);
      const productName = product?.name || item.name || item.id || "Produto";
      const itemRevenue = Number(item.price || 0) * Number(item.quantity || 1);
      productSales.set(productName, (productSales.get(productName) || 0) + itemRevenue);
    });
  });

  const stockSummary = products.reduce(
    (acc, product) => {
      const stock = Math.max(0, Math.floor(Number(product.stock || 0)));
      acc.total += stock;
      if (stock <= 0) acc.outOfStock += 1;
      if (stock > 0 && stock <= 5) acc.lowStock += 1;
      return acc;
    },
    { total: 0, lowStock: 0, outOfStock: 0 }
  );

  const paidPerMonth = {};
  paidOrders.forEach((order) => {
    const key = (order.paidAt || order.updatedAt || order.createdAt || new Date().toISOString()).slice(0, 7);
    paidPerMonth[key] = (paidPerMonth[key] || 0) + Number(order.amountTotal || 0);
  });

  const monthlyRevenue = Object.entries(paidPerMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({ month, value }));

  const lowStockProducts = [...products]
    .map((product) => ({
      name: product.name,
      value: Math.max(0, Math.floor(Number(product.stock || 0)))
    }))
    .sort((a, b) => a.value - b.value)
    .slice(0, 6);

  return {
    catalog: {
      totalProducts: products.length,
      activeProducts: products.filter((p) => p.active !== false).length,
      featuredProducts: products.filter((p) => p.featured).length,
      stockSummary
    },
    orders: {
      total: normalizedOrders.length,
      paid: paidOrders.length,
      pending: pendingOrders.length,
      processing: processingOrders.length,
      shipped: shippedOrders.length,
      delivered: deliveredOrders.length,
      cancelled: cancelledOrders.length
    },
    finance: {
      totalRevenue: revenue,
      productRevenue: revenue,
      shippingRevenue: paidOrders.reduce((sum, order) => sum + Number(order.shippingAmount || 0), 0),
      estimatedCost,
      estimatedProfit: profit,
      averageTicket: avgTicket,
      conversionRate: conversion,
      grossMargin: margin
    },
    topCategories: [...categoryCounts.entries()].map(([name, value]) => ({ name, value })),
    topProducts: [...productSales.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value })),
    categoryBreakdown: [...categoryCounts.entries()].map(([name, value]) => ({ name, value })),
    monthlyRevenue,
    orderStatusBreakdown: [...statusCounts.entries()].map(([name, value]) => ({ name, value })),
    lowStockProducts,
    recentOrders: normalizedOrders.slice(0, 5)
  };
}

async function localApiFetch(path, options = {}) {
  const route = normalizeRoute(path);
  const method = (options.method || "GET").toUpperCase();
  const body = options.body instanceof FormData ? options.body : options.body ? JSON.parse(options.body) : null;

  if (route === "/api/auth/login" && method === "POST") {
    return localAuthLogin(body);
  }

  if (route === "/api/auth/me" && method === "GET") {
    if (!authToken) throw new Error("Sessão expirada ou inválida.");
    return { user: { email: "admin@bigsmoke.local", role: "admin" } };
  }

  if (route === "/api/config" && method === "GET") {
    return {
      store: {
        city: "Fortaleza",
        state: "CE",
        originCep: "60000000"
      },
      paymentProvider: "stripe",
      paymentMetricsEnabled: false,
      stripeConfigured: false,
      webhookConfigured: false,
      twilioConfigured: false,
      twilioTemplateConfigured: false,
      twilioCustomerConfirmationEnabled: true,
      orderNotificationConfigured: false,
      adminConfigured: true,
      supabaseConfigured: false,
      dataMode: "local"
    };
  }

  if (route.startsWith("/api/admin/uploads") && method === "POST") {
    const file = body instanceof FormData
      ? body.get("image") || body.get("file")
      : body?.image || body?.file || null;
    if (!file) throw new Error("Arquivo não enviado.");
    return { imageUrl: currentFilePreview || PLACEHOLDER_IMAGE };
  }

  if (route.startsWith("/api/admin/products")) {
    const url = new URL(route, "http://local");
    const id = url.pathname.split("/").pop();
    const products = getLocalProducts();

    if (method === "GET") {
      const query = String(url.searchParams.get("query") || "").toLowerCase();
      const status = url.searchParams.get("status") || "all";
      const featured = url.searchParams.get("featured") || "all";
      const page = Math.max(1, Number(url.searchParams.get("page") || 1));
      const limit = Math.max(1, Number(url.searchParams.get("limit") || 6));
      const filtered = products.filter((product) => {
        const matchesQuery = !query || `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(query);
        const matchesStatus =
          status === "all" ||
          (status === "active" && product.active !== false) ||
          (status === "inactive" && product.active === false);
        const matchesFeatured =
          featured === "all" ||
          (featured === "featured" && product.featured) ||
          (featured === "normal" && !product.featured);
        return matchesQuery && matchesStatus && matchesFeatured;
      });
      const total = filtered.length;
      const pages = Math.max(1, Math.ceil(total / limit));
      const start = (page - 1) * limit;
      return {
        items: filtered.slice(start, start + limit),
        total,
        page,
        limit,
        pages,
        summary: {
          total: products.length,
          active: products.filter((p) => p.active !== false).length,
          featured: products.filter((p) => p.featured).length
        }
      };
    }

    if (method === "POST") {
      const next = localNormalizeProduct(body);
      products.unshift(next);
      setStoredJson(LOCAL_PRODUCTS_KEY, products);
      return next;
    }

    if (method === "PUT") {
      if (url.pathname.endsWith("/stock")) {
        const index = products.findIndex((product) => product.id === url.pathname.split("/").slice(-2)[0]);
        if (index === -1) throw new Error("Produto não encontrado.");
        const next = localNormalizeProduct({ ...products[index], stock: body?.stock }, products[index]);
        products[index] = next;
        setStoredJson(LOCAL_PRODUCTS_KEY, products);
        return next;
      }

      const index = products.findIndex((product) => product.id === id);
      if (index === -1) throw new Error("Produto não encontrado.");
      const next = localNormalizeProduct(body, products[index]);
      products[index] = next;
      setStoredJson(LOCAL_PRODUCTS_KEY, products);
      return next;
    }

    if (method === "DELETE") {
      const next = products.filter((product) => product.id !== id);
      if (next.length === products.length) throw new Error("Produto não encontrado.");
      setStoredJson(LOCAL_PRODUCTS_KEY, next);
      return "";
    }
  }

  if (route.startsWith("/api/admin/orders")) {
    const url = new URL(route, "http://local");
    const segments = url.pathname.split("/").filter(Boolean);
    const isResetRoute = segments[segments.length - 1] === "reset";
    const id = isResetRoute ? segments[segments.length - 2] : segments[segments.length - 1];
    const orders = getLocalOrders();

    if (method === "GET" && url.pathname.endsWith("/orders")) {
      const query = String(url.searchParams.get("query") || "").toLowerCase();
      const status = url.searchParams.get("status") || "all";
      const page = Math.max(1, Number(url.searchParams.get("page") || 1));
      const limit = Math.max(1, Number(url.searchParams.get("limit") || 6));
      const filtered = orders.filter((order) => {
        const matchesStatus = status === "all" || normalizeOrderStatus(order.status) === normalizeOrderStatus(status);
        const haystack = [
          order.id,
          order.customer?.name,
          order.customer?.email,
          order.customer?.phone,
          order.address?.cep
        ].filter(Boolean).join(" ").toLowerCase();
        return !query || haystack.includes(query);
      });
      const total = filtered.length;
      const pages = Math.max(1, Math.ceil(total / limit));
      const start = (page - 1) * limit;
      return {
        items: filtered.slice(start, start + limit),
        total,
        page,
        limit,
        pages
      };
    }

    if (method === "GET") {
      const order = orders.find((item) => item.id === id);
      if (!order) throw new Error("Pedido não encontrado.");
      return order;
    }

    if (method === "PATCH" || method === "PUT") {
      const index = orders.findIndex((item) => item.id === id);
      if (index === -1) throw new Error("Pedido não encontrado.");
      const nextStatus = normalizeOrderStatus(body?.status || orders[index].status);
      orders[index] = {
        ...orders[index],
        status: nextStatus,
        trackingCode: String(body?.trackingCode || body?.tracking_code || orders[index].trackingCode || "").trim(),
        trackingUrl: String(body?.trackingUrl || body?.tracking_url || orders[index].trackingUrl || "").trim(),
        updatedAt: new Date().toISOString()
      };
      setStoredJson(LOCAL_ORDERS_KEY, orders);
      return orders[index];
    }

    if (isResetRoute && method === "POST") {
      const index = orders.findIndex((item) => item.id === id);
      if (index === -1) throw new Error("Pedido não encontrado.");
      orders[index] = {
        ...orders[index],
        status: "pending",
        hiddenInAdmin: false,
        trackingCode: "",
        trackingUrl: "",
        paidAt: "",
        canceledAt: "",
        paymentConfirmed: false,
        updatedAt: new Date().toISOString()
      };
      setStoredJson(LOCAL_ORDERS_KEY, orders);
      return orders[index];
    }

    if (method === "DELETE") {
      const next = orders.filter((item) => item.id !== id);
      if (next.length === orders.length) throw new Error("Pedido não encontrado.");
      setStoredJson(LOCAL_ORDERS_KEY, next);
      return "";
    }
  }

  if (route === "/api/admin/analytics" && method === "GET") {
    return localAnalytics();
  }

  throw new Error("Endpoint local não suportado.");
}

async function loadConfig() {
  try {
    const config = await apiFetch("/api/config", { method: "GET" });
    runtimeConfig = {
      ...runtimeConfig,
      ...config,
      paymentMetricsEnabled: Boolean(config.paymentMetricsEnabled),
      stripeConfigured: Boolean(config.stripeConfigured),
      dataMode: config.dataMode || runtimeConfig.dataMode
    };
    uploadMode = config.dataMode || "local";
    $("stat-upload").textContent = uploadMode;
  } catch {
    $("stat-upload").textContent = "local";
  }
}

async function loadSession() {
  if (!authToken) {
    showLogin();
    return false;
  }

  try {
    const session = await apiFetch("/api/auth/me", { method: "GET" });
    currentUser = session.user;
    return true;
  } catch {
    clearAuthToken();
    showLogin("Sessão expirada. Entre novamente.");
    return false;
  }
}

function renderStats(summary) {
  if (Array.isArray(summary)) {
    const active = summary.filter((product) => product.active !== false);
    const featured = summary.filter((product) => product.featured);
    $("stat-products").textContent = String(summary.length);
    $("stat-active").textContent = String(active.length);
    $("stat-featured").textContent = String(featured.length);
    return;
  }

  $("stat-products").textContent = String(summary?.total || 0);
  $("stat-active").textContent = String(summary?.active || 0);
  $("stat-featured").textContent = String(summary?.featured || 0);
}

function renderMetric(id, value) {
  $(id).textContent = value;
}

function destroyDashboardCharts() {
  Object.values(dashboardCharts).forEach((chart) => chart?.destroy?.());
  dashboardCharts.sales = null;
  dashboardCharts.categories = null;
  dashboardCharts.monthly = null;
  dashboardCharts.orders = null;
  dashboardCharts.stock = null;
}

function updateFallbackChart(container, rows, formatter) {
  if (!container) return;
  container.innerHTML = "";

  if (!rows || !rows.length) {
    container.innerHTML = `<p class="helper-text">Sem dados suficientes.</p>`;
    return;
  }

  const max = Math.max(...rows.map((row) => row.value || 0), 1);
  rows.forEach((row) => {
    const el = document.createElement("div");
    el.className = "bar-row";
    el.innerHTML = `
      <div class="label-line">
        <span>${escapeHtml(row.label || row.name)}</span>
        <strong>${escapeHtml(formatter(row.value))}</strong>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width: ${Math.max(5, ((row.value || 0) / max) * 100)}%"></div>
      </div>
    `;
    container.appendChild(el);
  });
}

function renderSalesChart(rows) {
  const canvas = $("sales-by-product-chart");
  if (!canvas) return;
  const container = canvas.parentElement;
  const labels = rows.map((row) => row.label);
  const values = rows.map((row) => row.value);

  if (!window.Chart) {
    updateFallbackChart(container, rows, (value) => formatCurrency(value));
    return;
  }

  destroyDashboardCharts();
  dashboardCharts.sales = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Receita",
          data: values,
          backgroundColor: "rgba(201,168,76,0.82)",
          borderColor: "rgba(201,168,76,1)",
          borderWidth: 0,
          borderRadius: 10,
          hoverBackgroundColor: "rgba(201,168,76,1)"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              return formatCurrency(context.parsed.y);
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: "#b7b0a5" },
          grid: { color: "rgba(245, 240, 232, 0.06)" }
        },
        y: {
          ticks: {
            color: "#b7b0a5",
            callback(value) {
              return formatCurrency(value);
            }
          },
          grid: { color: "rgba(245, 240, 232, 0.06)" }
        }
      }
    }
  });
}

function renderCategoryChart(rows) {
  const canvas = $("category-pie-chart");
  if (!canvas) return;
  const container = canvas.parentElement;
  const labels = rows.map((row) => row.label);
  const values = rows.map((row) => row.value);

  if (!window.Chart) {
    updateFallbackChart(container, rows, (value) => String(value));
    return;
  }

  if (dashboardCharts.categories) {
    dashboardCharts.categories.destroy();
  }

  dashboardCharts.categories = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: values.length > 8
            ? values.map((_, index) => `hsla(${Math.round(index * (360 / values.length))},60%,55%,0.88)`)
            : [
              "rgba(201,168,76,0.92)",
              "rgba(29,158,117,0.88)",
              "rgba(215,91,68,0.88)",
              "rgba(127,119,221,0.88)",
              "rgba(55,138,221,0.88)",
              "rgba(99,153,34,0.88)",
              "rgba(212,83,126,0.88)",
              "rgba(240,159,39,0.82)"
            ].slice(0, values.length),
          borderColor: "#141414",
          borderWidth: 2,
          hoverOffset: 10
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "68%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#f5f0e8",
            usePointStyle: true,
            pointStyle: "circle"
          }
        }
      }
    }
  });
}

function renderMonthlyRevenueChart(rows) {
  const canvas = $("monthly-revenue-chart");
  if (!canvas) return;
  const container = canvas.parentElement;
  const labels = rows.map((row) => row.label);
  const values = rows.map((row) => row.value);

  if (!window.Chart) {
    updateFallbackChart(container, rows, (value) => formatCurrency(value));
    return;
  }

  if (dashboardCharts.monthly) {
    dashboardCharts.monthly.destroy();
  }

  dashboardCharts.monthly = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Receita",
          data: values,
          borderColor: "#C9A84C",
          backgroundColor: "rgba(201,168,76,0.12)",
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(context) {
              return formatCurrency(context.parsed.y);
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: "#b7b0a5" },
          grid: { color: "rgba(245, 240, 232, 0.06)" }
        },
        y: {
          ticks: {
            color: "#b7b0a5",
            callback(value) {
              return formatCurrency(value);
            }
          },
          grid: { color: "rgba(245, 240, 232, 0.06)" }
        }
      }
    }
  });
}

function renderOrderStatusChart(rows) {
  const canvas = $("order-status-chart");
  if (!canvas) return;
  const container = canvas.parentElement;
  const labels = rows.map((row) => row.label);
  const values = rows.map((row) => row.value);

  if (!window.Chart) {
    updateFallbackChart(container, rows, (value) => String(value));
    return;
  }

  if (dashboardCharts.orders) {
    dashboardCharts.orders.destroy();
  }

  dashboardCharts.orders = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: labels.map((label) => ({
            "Pendente": "rgba(239,159,39,0.9)",
            "Pago": "rgba(55,138,221,0.9)",
            "Em separação": "rgba(127,119,221,0.9)",
            "Enviado": "rgba(29,158,117,0.88)",
            "Entregue": "rgba(99,153,34,0.9)",
            "Cancelado": "rgba(226,75,74,0.9)"
          }[label] || "rgba(150,150,150,0.7)")),
          borderColor: "#141414",
          borderWidth: 2,
          hoverOffset: 10
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "70%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#f5f0e8",
            usePointStyle: true
          }
        }
      }
    }
  });
}

function renderLowStockChart(rows) {
  const canvas = $("low-stock-chart");
  if (!canvas) return;
  const container = canvas.parentElement;
  const labels = rows.map((row) => row.label);
  const values = rows.map((row) => row.value);

  if (!window.Chart) {
    updateFallbackChart(container, rows, (value) => String(value));
    return;
  }

  if (dashboardCharts.stock) {
    dashboardCharts.stock.destroy();
  }

  dashboardCharts.stock = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Estoque",
          data: values,
          backgroundColor: "rgba(245, 240, 232, 0.82)",
          borderColor: "#f5f0e8",
          borderWidth: 0,
          borderRadius: 10
        }
      ]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          ticks: { color: "#b7b0a5" },
          grid: { color: "rgba(245, 240, 232, 0.06)" }
        },
        y: {
          ticks: { color: "#f5f0e8" },
          grid: { color: "rgba(245, 240, 232, 0.03)" }
        }
      }
    }
  });
}

function updateDashboardMetrics(analytics) {
  const paymentMetricsEnabled = Boolean(runtimeConfig.paymentMetricsEnabled);
  const confirmedPaidOrders = paymentMetricsEnabled ? Number(analytics?.orders?.paid || 0) : 0;
  const totalRevenue = paymentMetricsEnabled ? Number(analytics?.finance?.totalRevenue || 0) : 0;
  const hasRealPayments = paymentMetricsEnabled && confirmedPaidOrders > 0 && totalRevenue > 0;

  renderMetric("metric-revenue", formatCurrency(totalRevenue));
  renderMetric("metric-profit", formatCurrency(analytics?.finance?.estimatedProfit || 0));
  renderMetric("metric-margin", formatPercent(analytics?.finance?.grossMargin || 0));
  renderMetric("metric-ticket", formatCurrency(analytics?.finance?.averageTicket || 0));
  renderMetric("metric-conversion", formatPercent(analytics?.finance?.conversionRate || 0));
  renderMetric("metric-paid-orders", String(confirmedPaidOrders));
  renderMetric("metric-stock-total", String(analytics?.catalog?.stockSummary?.total || 0));
  renderMetric("metric-stock-low", String(analytics?.catalog?.stockSummary?.lowStock || 0));
  renderMetric("metric-stock-out", String(analytics?.catalog?.stockSummary?.outOfStock || 0));

  const statusMessage = $("dashboard-status-message");
  if (statusMessage) {
    statusMessage.textContent = paymentMetricsEnabled
      ? (hasRealPayments
        ? "Pagamentos reais confirmados."
        : "Pagamento ativo, mas ainda sem pagamentos reais confirmados.")
      : "Aguardando pagamentos reais confirmados. Os totais ficam zerados ate o provedor receber uma cobranca confirmada.";
    statusMessage.classList.toggle("is-empty", !hasRealPayments);
  }

  renderSalesChart((analytics?.topProducts || []).map((item) => ({ label: item.name, value: item.value })));
  renderCategoryChart((analytics?.categoryBreakdown || []).map((item) => ({ label: item.name, value: item.value })));
  renderMonthlyRevenueChart((analytics?.monthlyRevenue || []).map((item) => ({ label: item.month, value: item.value })));
  renderOrderStatusChart((analytics?.orderStatusBreakdown || []).map((item) => ({ label: statusLabel(item.name), value: item.value })));
  renderLowStockChart((analytics?.lowStockProducts || []).map((item) => ({ label: item.name, value: item.value })));
}

function statusLabel(value) {
  return ORDER_STATUS_LABELS[normalizeOrderStatus(value)] || (value || "Outro");
}

function renderPagination(containerId, pagination, onChange) {
  const root = $(containerId);
  if (!root) return;
  root.innerHTML = "";
  if (!pagination || pagination.pages <= 1) return;

  const createButton = (label, page, { active = false, disabled = false } = {}) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = String(label);
    button.classList.toggle("active", active);
    button.disabled = disabled;
    if (!disabled) {
      button.addEventListener("click", () => onChange(page));
    }
    root.appendChild(button);
  };

  createButton("Anterior", Math.max(1, pagination.page - 1), { disabled: pagination.page === 1 });

  const maxVisible = 5;
  const halfWindow = Math.floor(maxVisible / 2);
  let start = Math.max(1, pagination.page - halfWindow);
  let end = Math.min(pagination.pages, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  if (start > 1) {
    createButton("1", 1);
    if (start > 2) {
      const dots = document.createElement("span");
      dots.className = "pagination-dots";
      dots.textContent = "…";
      root.appendChild(dots);
    }
  }

  for (let page = start; page <= end; page += 1) {
    createButton(String(page), page, { active: page === pagination.page });
  }

  if (end < pagination.pages) {
    if (end < pagination.pages - 1) {
      const dots = document.createElement("span");
      dots.className = "pagination-dots";
      dots.textContent = "…";
      root.appendChild(dots);
    }
    createButton(String(pagination.pages), pagination.pages);
  }

  createButton("Próxima", Math.min(pagination.pages, pagination.page + 1), {
    disabled: pagination.page === pagination.pages
  });
}

function getAdminProductColorSwatches(product) {
  const raw = product?.colors;
  const list = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
      ? raw.split(",").map((color) => color.trim()).filter(Boolean)
      : [];
  if (!list.length) return [];

  const seen = new Set();
  return list
    .map((color, index) => {
      if (typeof color === "string") {
        return { name: color.trim(), hex: "#888888", image: "" };
      }

      const name = String(color?.name || color?.label || color?.color || `Cor ${index + 1}`).trim();
      const hex = /^#[0-9a-f]{6}$/i.test(String(color?.hex || "").trim())
        ? String(color.hex).trim()
        : "#888888";
      const image = Array.isArray(color?.images) ? String(color.images[0] || "").trim() : "";

      return { name, hex, image };
    })
    .filter((color) => {
      if (!color.name) return false;
      const key = `${color.name.toLowerCase()}|${color.hex.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function renderAdminColorSwatches(product) {
  const colors = getAdminProductColorSwatches(product);
  if (!colors.length) {
    return `<div class="product-row-colors muted">Sem cores cadastradas</div>`;
  }

  return `
    <div class="product-row-colors" aria-label="Cores cadastradas">
      <span>${colors.length} cor${colors.length > 1 ? "es" : ""}</span>
      <div class="product-row-swatches">
        ${colors.map((color) => `
          <span class="product-row-swatch" title="${escapeHtml(color.name)}" style="--swatch-color:${escapeHtml(color.hex)}">
            ${color.image ? `<img src="${escapeHtml(color.image)}" alt="" ${imageFallbackAttr()}>` : ""}
          </span>
        `).join("")}
      </div>
    </div>
  `;
}

function renderProducts(result) {
  const root = $("product-list");
  root.innerHTML = "";
  const products = result?.items || [];
  renderStats(result?.summary || products);
  renderProductCategoryOptions(result?.summary?.categories || []);

  if (!products.length) {
    root.innerHTML = `<p class="helper-text">Nenhum produto cadastrado ainda.</p>`;
    return;
  }

  products.forEach((product) => {
    const row = document.createElement("article");
    row.className = "product-row";
    row.dataset.productId = product.id;
    const productImage = getProductImage(product);
    row.innerHTML = `
      <img class="product-thumb" src="${escapeHtml(productImage)}" alt="${escapeHtml(product.name)}" loading="lazy" ${imageFallbackAttr()}>
      <div>
        <h3>${escapeHtml(product.name)}</h3>
        <p>${escapeHtml(product.category)} • ${formatCurrency(product.price)}</p>
        <div>
          <span class="badge ${product.active === false ? "" : "badge-active"}">${product.active === false ? "Inativo" : "Ativo"}</span>
          ${product.featured ? '<span class="badge badge-featured">★ Destaque</span>' : ""}
          <span class="badge">${escapeHtml(product.sizes || "Tamanhos em breve")}</span>
          <span class="badge">${Number(product.stock || 0)} em estoque</span>
        </div>
        ${renderAdminColorSwatches(product)}
        <small>${escapeHtml(product.description || "Sem descrição.")}</small>
      </div>
      <div class="row-actions">
        <label class="stock-inline">
          <span>Estoque</span>
          <input type="number" min="0" step="1" value="${Number(product.stock || 0)}" data-stock-input="${product.id}">
        </label>
        <button class="ghost-button compact-action" type="button" data-stock-save="${product.id}">Salvar</button>
        <button class="ghost-button compact-action" type="button" data-product-preview="${product.id}">Visualizar</button>
        <button class="icon-button" type="button" title="Editar">Editar</button>
        <button class="icon-button" type="button" title="Remover">Excluir</button>
      </div>
    `;

    const buttons = row.querySelectorAll(".icon-button");
    buttons[0].addEventListener("click", () => { fillForm(product); openDrawer(); });
    buttons[1].addEventListener("click", async () => {
      if (!confirm(`Remover ${product.name}?`)) return;
      await apiFetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
      await refreshProducts();
      await refreshDashboard();
    });

    row.querySelector(`[data-product-preview="${product.id}"]`).addEventListener("click", () => {
      openStorePreview(product);
    });

    row.querySelector(`[data-stock-save="${product.id}"]`).addEventListener("click", async () => {
      const input = row.querySelector(`[data-stock-input="${product.id}"]`);
      const nextStock = Math.max(0, Math.floor(Number(input.value || 0)));
      await apiFetch(`/api/admin/products/${product.id}/stock`, {
        method: "PUT",
        body: JSON.stringify({ stock: nextStock })
      });
      await refreshProducts();
      await refreshDashboard();
    });

    root.appendChild(row);
  });

  renderPagination("product-pagination", result, (page) => {
    state.products.page = page;
    refreshProducts();
  });
}

function renderProductCategoryOptions(categories = []) {
  const select = $("product-category-filter");
  if (!select) return;
  const currentValue = select.value || state.products.category || "all";
  const options = ["all", ...categories];
  select.innerHTML = "";
  options.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category === "all" ? "Todas as categorias" : category;
    if (category === currentValue) {
      option.selected = true;
    }
    select.appendChild(option);
  });
  if (!options.includes(currentValue)) {
    select.value = "all";
    state.products.category = "all";
  }
}

function renderOrders(result) {
  const root = $("order-list");
  root.innerHTML = "";
  const orders = result?.items || [];

  if (!orders.length) {
    root.innerHTML = `<p class="helper-text">Nenhum pedido encontrado.</p>`;
    return;
  }

  orders.forEach((order) => {
    const normalizedStatus = normalizeOrderStatus(order.status);
    const row = document.createElement("article");
    row.className = `order-row${order.hiddenInAdmin ? " is-hidden-order" : ""}`;
    row.innerHTML = `
      <div>
        <button type="button" class="order-hide-button" data-order-hide="${order.id}" aria-label="${order.hiddenInAdmin ? "Reexibir pedido" : "Ocultar pedido"}">${order.hiddenInAdmin ? "↺" : "×"}</button>
        <h3>${order.customer?.name || "Cliente sem nome"}</h3>
        <p>${order.customer?.email || "Sem e-mail"} • ${order.customer?.phone || "Sem WhatsApp"}</p>
        <div class="order-meta">
          <span class="badge order-number-tag">${order.orderAccessCode || order.trackingCode || "#" + order.id.slice(-8)}</span>
          <span class="badge">${order.orderNumberFormatted || "#" + order.id.slice(-8)}</span>
          <span class="badge ${statusTone(normalizedStatus)}" data-status="${normalizedStatus}">${formatOrderStatus(normalizedStatus)}</span>
          ${runtimeConfig.paymentMetricsEnabled && order.paymentConfirmed ? '<span class="badge badge-payment-confirmed">Pagamento confirmado</span>' : ""}
          <span class="badge">${formatCurrency(order.amountTotal)}</span>
        </div>
        <small>${order.deliveryMethod || "retirada"} • ${order.address?.city || "Cidade não informada"} / ${order.address?.state || "--"}</small>
        ${renderOrderProgress(normalizedStatus)}
      </div>
      <div class="order-actions">
        <select data-order-status="${order.id}">
          ${ORDER_STATUS_FLOW.map((status) => `<option value="${status}" ${normalizedStatus === status ? "selected" : ""}>${ORDER_STATUS_LABELS[status]}</option>`).join("")}
          <option value="canceled" ${normalizedStatus === "canceled" ? "selected" : ""}>${ORDER_STATUS_LABELS.canceled}</option>
        </select>
        <input type="text" data-order-tracking="${order.id}" placeholder="Código de rastreio" value="${escapeHtml(order.trackingCode || "")}">
        <input type="url" data-order-tracking-url="${order.id}" placeholder="Link de rastreio" value="${escapeHtml(order.trackingUrl || buildInternalTrackingUrl(order))}">
        <button type="button" class="primary-button compact-action" data-order-save="${order.id}">Atualizar</button>
        <button type="button" class="ghost-button" data-order-open="${order.id}">Detalhes</button>
        <button type="button" class="ghost-button order-reset-button" data-order-reset="${order.id}">Reiniciar</button>
        <button type="button" class="ghost-button order-delete-button" data-order-delete="${order.id}">Apagar</button>
      </div>
    `;

    row.querySelector(`[data-order-hide="${order.id}"]`).addEventListener("click", async () => {
      const nextHidden = !order.hiddenInAdmin;
      await apiFetch(`/api/admin/orders/${order.id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: normalizedStatus,
          trackingCode: row.querySelector(`[data-order-tracking="${order.id}"]`).value.trim(),
          trackingUrl: row.querySelector(`[data-order-tracking-url="${order.id}"]`).value.trim(),
          hiddenInAdmin: nextHidden
        })
      });
      await refreshOrders();
      await refreshDashboard();
    });

    row.querySelector(`[data-order-save="${order.id}"]`).addEventListener("click", async () => {
      const status = row.querySelector(`[data-order-status="${order.id}"]`).value;
      const trackingCode = row.querySelector(`[data-order-tracking="${order.id}"]`).value.trim();
      const trackingUrl = row.querySelector(`[data-order-tracking-url="${order.id}"]`).value.trim();
      await apiFetch(`/api/admin/orders/${order.id}`, {
        method: "PUT",
        body: JSON.stringify({ status, trackingCode, trackingUrl, hiddenInAdmin: order.hiddenInAdmin || false })
      });
      await refreshOrders();
      await refreshDashboard();
    });

    row.querySelector(`[data-order-open="${order.id}"]`).addEventListener("click", async () => {
      const detail = await apiFetch(`/api/admin/orders/${order.id}`, { method: "GET" });
      alert(JSON.stringify(detail, null, 2));
    });

    row.querySelector(`[data-order-reset="${order.id}"]`).addEventListener("click", async () => {
      if (!window.confirm("Reiniciar este pedido para status pendente, removendo rastreio e exibindo novamente no painel?")) return;
      await apiFetch(`/api/admin/orders/${order.id}/reset`, { method: "POST" });
      await refreshOrders();
      await refreshDashboard();
    });

    row.querySelector(`[data-order-delete="${order.id}"]`).addEventListener("click", async () => {
      if (!window.confirm("Apagar este pedido permanentemente? Esta ação não pode ser desfeita.")) return;
      await apiFetch(`/api/admin/orders/${order.id}`, { method: "DELETE" });
      await refreshOrders();
      await refreshDashboard();
    });

    root.appendChild(row);
  });

  renderPagination("order-pagination", result, (page) => {
    state.orders.page = page;
    refreshOrders();
  });
}

async function refreshDashboard() {
  try {
    const analytics = await apiFetch("/api/admin/analytics", { method: "GET" });
    updateDashboardMetrics(analytics);
  } catch {
    updateDashboardMetrics(localAnalytics());
  }
}

async function refreshProducts() {
  const result = await apiFetch(buildUrl("/api/admin/products", {
    query: state.products.query,
    status: state.products.status,
    category: state.products.category,
    featured: state.products.featured,
    page: state.products.page,
    limit: state.products.limit
  }), {
    method: "GET"
  });
  cachedProducts = result.items || result || [];
  renderProducts(result);
}

async function refreshOrders() {
  const result = await apiFetch(buildUrl("/api/admin/orders", {
    query: state.orders.query,
    status: state.orders.status,
    showHidden: state.orders.showHidden ? "1" : "0",
    page: state.orders.page,
    limit: state.orders.limit
  }), {
    method: "GET"
  });
  cachedOrders = result.items || result || [];
  renderOrders(result);
  renderNotificationCenter();
}

async function uploadImageIfNeeded() {
  const fileInput = $("product-file");
  if (!fileInput) {
    return "";
  }
  const file = fileInput.files?.[0];
  if (!file) return "";
  if (!String(currentFilePreview || "").startsWith("data:")) return "";

  if (!apiAvailable) {
    return currentFilePreview || $("product-image").value.trim() || PLACEHOLDER_IMAGE;
  }

  const formData = new FormData();
  formData.append("image", file);
  const result = await apiFetch("/api/admin/uploads", {
    method: "POST",
    body: formData
  });
  return result.imageUrl;
}

async function handleLogin(event) {
  event.preventDefault();
  const message = $("login-message");
  message.textContent = "Entrando...";

  try {
    const result = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: $("login-email").value.trim(),
        password: $("login-password").value
      })
    });

    setAuthToken(result.token);
    currentUser = result.user;
    showDashboard();
    await loadConfig();
    await refreshProducts();
    await refreshOrders();
    await refreshDashboard();
    message.textContent = `Bem-vindo, ${currentUser.email}.`;
  } catch (error) {
    message.textContent = error.message;
    clearAuthToken();
  }
}

async function handleProductSubmit(event) {
  event.preventDefault();

  const basePayload = await collectProductPayload();

  if (!basePayload.name || !basePayload.category || Number.isNaN(basePayload.price) || Number.isNaN(basePayload.stock)) {
    alert("Preencha nome, categoria, preço e estoque.");
    return;
  }

  try {
    const payload = { ...basePayload };
    const isNew = !editingId;

    if (editingId) {
      await apiFetch(`/api/admin/products/${editingId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
    } else {
      await apiFetch("/api/admin/products", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    }

    resetForm();
    await refreshProducts();
    await refreshDashboard();
    showAlert("info", "Produto salvo", isNew ? "O novo produto entrou no catálogo." : "As alterações foram aplicadas com sucesso.");
  } catch (error) {
    alert(error.message);
  }
}

function bindFilters() {
  $("product-search").addEventListener("input", (event) => {
    state.products.query = event.target.value.trim();
    state.products.page = 1;
    refreshProducts();
  });
  $("product-status-filter").addEventListener("change", (event) => {
    state.products.status = event.target.value;
    state.products.page = 1;
    refreshProducts();
  });
  $("product-category-filter").addEventListener("change", (event) => {
    state.products.category = event.target.value;
    state.products.page = 1;
    refreshProducts();
  });
  $("product-featured-filter").addEventListener("change", (event) => {
    state.products.featured = event.target.value;
    state.products.page = 1;
    refreshProducts();
  });
  $("order-search").addEventListener("input", (event) => {
    state.orders.query = event.target.value.trim();
    state.orders.page = 1;
    refreshOrders();
  });
  $("order-status-filter").addEventListener("change", (event) => {
    state.orders.status = event.target.value;
    state.orders.page = 1;
    refreshOrders();
  });

  $("order-show-hidden").addEventListener("change", (event) => {
    state.orders.showHidden = event.target.checked;
    state.orders.page = 1;
    refreshOrders();
  });
}

/* =============================================
   GALERIA DE FOTOS ADICIONAIS — MULTI-UPLOAD
   ============================================= */

/**
 * Comprime uma imagem para base64 com qualidade e tamanho máximo reduzidos,
 * evitando estouro do localStorage (~5MB).
 */
async function compressImageToBase64(file, maxWidthOrHeight = 1200, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Falha ao ler imagem."));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Imagem inválida."));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
          if (width >= height) {
            height = Math.round((height * maxWidthOrHeight) / width);
            width = maxWidthOrHeight;
          } else {
            width = Math.round((width * maxWidthOrHeight) / height);
            height = maxWidthOrHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = String(event.target?.result || "");
    };
    reader.readAsDataURL(file);
  });
}

async function uploadExtraImage(file) {
  // Comprime antes de guardar em base64 para evitar estouro do localStorage
  const tempUrl = await compressImageToBase64(file);

  extraImagesUrls.push(tempUrl);
  renderThumbstrip();
  syncPreviewGallery();

  const grid = $("upload-thumbstrip-inner");
  const items = grid ? Array.from(grid.querySelectorAll(".thumbstrip-item")) : [];
  const targetItem = items.find((item) => item.dataset.url === tempUrl) || items[items.length - 1];
  if (targetItem) {
    const indicator = document.createElement("div");
    indicator.className = "thumbstrip-uploading";
    targetItem.appendChild(indicator);
  }

  // Sempre sincroniza o campo hidden para garantir que o submit capture as imagens extras
  const hiddenField = $("product-extra-urls");
  if (hiddenField) {
    hiddenField.value = JSON.stringify(extraImagesUrls);
  }

  if (!apiAvailable) {
    return;
  }

  try {
    const formData = new FormData();
    formData.append("image", file);
    const result = await apiFetch("/api/admin/uploads", { method: "POST", body: formData });
    const tempIndex = extraImagesUrls.indexOf(tempUrl);
    if (tempIndex >= 0) {
      extraImagesUrls[tempIndex] = result.imageUrl;
    }
    if (hiddenField) {
      hiddenField.value = JSON.stringify(extraImagesUrls);
    }
    renderThumbstrip();
    syncPreviewGallery();
  } catch (err) {
    console.warn("Upload foto extra falhou, mantendo prévia local:", err.message);
  }
}

async function handleExtraFilesSelected(files) {
  for (const file of Array.from(files)) {
    if (!file.type.startsWith("image/")) continue;
    // eslint-disable-next-line no-await-in-loop
    await uploadExtraImage(file);
  }
}

function bindExtraUploadArea() {
  const input = $("product-extra-files");
  const zone = $("upload-zone");
  const droparea = $("upload-zone-droparea");
  const clickTarget = $("upload-zone-click");
  if (!input || !zone || !droparea || !clickTarget) return;

  input.addEventListener("change", async (e) => {
    await handleExtraFilesSelected(e.target.files || []);
    input.value = "";
  });

  droparea.addEventListener("click", () => input.click());
  clickTarget.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    input.click();
  });

  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    zone.classList.add("drag-over");
  });
  zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));
  zone.addEventListener("drop", async (e) => {
    e.preventDefault();
    zone.classList.remove("drag-over");
    await handleExtraFilesSelected(e.dataTransfer?.files || []);
  });
}

function bindPreviewInputs() {
  $("product-image").addEventListener("input", () => {
    syncPreviewGallery();
    renderThumbstrip();
  });
  const productFileInput = $("product-file");
  if (productFileInput) {
    productFileInput.addEventListener("change", async (event) => {
      const file = event.target.files?.[0] || null;
      updateFileLabel(file);
      await previewSelectedFile(file);
      renderThumbstrip();
    });
  }

  const description = $("product-description");
  if (description) {
    description.addEventListener("input", () => updateDescriptionCounter(description.value));
    updateDescriptionCounter(description.value);
  }
}

async function loadConfig() {
  try {
    const config = await apiFetch("/api/config", { method: "GET" });
    runtimeConfig = {
      ...runtimeConfig,
      ...config,
      paymentMetricsEnabled: Boolean(config.paymentMetricsEnabled),
      stripeConfigured: Boolean(config.stripeConfigured),
      dataMode: config.dataMode || runtimeConfig.dataMode
    };
    uploadMode = config.dataMode || (apiAvailable ? "api" : "local");
    $("stat-upload").textContent = uploadMode;
  } catch {
    uploadMode = apiAvailable ? "api" : "local";
    $("stat-upload").textContent = uploadMode;
  }
  updateStoreLink();
}

/* =============================================
   SIDEBAR NAVIGATION
   ============================================= */
let currentSection = "overview";

function switchSection(section) {
  const sections = ["overview", "catalog", "orders", "charts"];
  sections.forEach((s) => {
    const el = $(`section-${s}`);
    if (el) el.classList.toggle("hidden", s !== section);
  });

  document.querySelectorAll(".sidebar-btn[data-section]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.section === section);
  });

  currentSection = section;

  // Load data on demand
  if (section === "catalog") refreshProducts();
  if (section === "orders") refreshOrders();
  if (section === "charts") refreshDashboard();
}

function bindSidebar() {
  document.querySelectorAll(".sidebar-btn[data-section]").forEach((btn) => {
    btn.addEventListener("click", () => switchSection(btn.dataset.section));
  });
}

/* =============================================
   DRAWER
   ============================================= */
function openDrawer() {
  $("product-drawer").classList.add("open");
  $("drawer-overlay").classList.add("open");
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => {
    $("product-form")?.scrollTo({ top: 0, behavior: "auto" });
  });
}

function closeDrawer() {
  $("product-drawer").classList.remove("open");
  $("drawer-overlay").classList.remove("open");
  document.body.style.overflow = "";
}

function bindDrawer() {
  $("new-product-btn").addEventListener("click", () => {
    resetForm();
    openDrawer();
  });
  $("close-drawer-btn").addEventListener("click", closeDrawer);
  $("drawer-overlay").addEventListener("click", closeDrawer);
}

/* =============================================
   CHIP FILTERS (orders)
   ============================================= */
function bindOrderChips() {
  document.querySelectorAll("[data-status-chip]").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll("[data-status-chip]").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      state.orders.status = chip.dataset.statusChip;
      state.orders.page = 1;
      refreshOrders();
    });
  });
}

/* =============================================
   GRID/LIST TOGGLE
   ============================================= */
let isGridMode = false;

function bindGridToggle() {
  const btn = $("toggle-grid-btn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    isGridMode = !isGridMode;
    $("product-list").classList.toggle("grid-mode", isGridMode);
    $("view-list-icon").style.display = isGridMode ? "none" : "";
    $("view-grid-icon").style.display = isGridMode ? "" : "none";
  });
}

/* =============================================
   ALERTS SYSTEM
   ============================================= */
function showAlert(type, title, desc, action) {
  const area = $("alerts-area");
  if (!area) return;

  const icons = { info: "ℹ", warning: "⚠", danger: "✕" };
  const el = document.createElement("div");
  el.className = `alert alert-${type}`;
  el.innerHTML = `
    <span class="alert-icon">${icons[type] || "ℹ"}</span>
    <div class="alert-body">
      <strong class="alert-title">${escapeHtml(title)}</strong>
      <span class="alert-desc">${escapeHtml(desc)}</span>
    </div>
    ${action ? `<button class="alert-action" data-alert-action>${escapeHtml(action.label)}</button>` : ""}
    <button class="alert-close" aria-label="Fechar alerta">×</button>
  `;

  el.querySelector(".alert-close").addEventListener("click", () => {
    el.style.transition = "opacity 200ms ease";
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 200);
  });

  if (action) {
    el.querySelector("[data-alert-action]").addEventListener("click", action.handler);
  }

  area.appendChild(el);
}

function getOrderNotificationId(order) {
  return String(order?.id || order?.stripeSessionId || order?.orderNumberFormatted || "").trim();
}

function getOrderDisplayCode(order) {
  return order?.orderNumberFormatted || order?.orderAccessCode || order?.trackingCode || `#${String(order?.id || "").slice(-8)}`;
}

function getOrderNotificationText(order) {
  const items = Array.isArray(order?.items)
    ? order.items.map((item) => {
      const quantity = Math.max(1, Number(item.quantity) || 1);
      return `- ${item.name || "Item"}${item.size ? ` (${item.size})` : ""} x${quantity}`;
    }).join("\n")
    : "- Itens não informados";

  return [
    "Novo pedido BigSmoke",
    `Pedido: ${getOrderDisplayCode(order)}`,
    `Cliente: ${order?.customer?.name || "Cliente sem nome"}`,
    `WhatsApp: ${order?.customer?.phone || "Não informado"}`,
    `Total: ${formatCurrency(order?.amountTotal || 0)}`,
    `Status: ${formatOrderStatus(normalizeOrderStatus(order?.status))}`,
    "",
    "Itens:",
    items
  ].join("\n");
}

function getAdminWhatsAppUrl(order) {
  const phone = String(runtimeConfig.whatsappNumber || "5583986494691").replace(/\D/g, "");
  const target = phone.startsWith("55") ? phone : `55${phone}`;
  return `https://wa.me/${target}?text=${encodeURIComponent(getOrderNotificationText(order))}`;
}

function getNotificationOrders() {
  return (Array.isArray(cachedOrders) ? cachedOrders : [])
    .filter((order) => order && !order.hiddenInAdmin)
    .map((order) => ({ ...order, _status: normalizeOrderStatus(order.status) }))
    .filter((order) => ["pending", "paid", "processing"].includes(order._status))
    .sort((a, b) => new Date(b.createdAt || b.paidAt || 0) - new Date(a.createdAt || a.paidAt || 0))
    .slice(0, 8);
}

function persistNotificationState() {
  setStoredJson(NOTIFICATION_READ_KEY, [...readNotificationIds].slice(-120));
  setStoredJson(NOTIFICATION_SEEN_KEY, [...lastNotificationOrderIds].slice(-120));
}

function notifyBrowserForOrder(order) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const notification = new Notification("Novo pedido BigSmoke", {
    body: `${getOrderDisplayCode(order)} • ${order?.customer?.name || "Cliente"} • ${formatCurrency(order?.amountTotal || 0)}`,
    tag: getOrderNotificationId(order),
    icon: "/imagens/logo_sem_fundo.png"
  });
  notification.onclick = () => {
    window.focus();
    switchSection("orders");
    notification.close();
  };
}

function detectNewOrdersForNotification(orders) {
  const ids = orders.map(getOrderNotificationId).filter(Boolean);
  const newOrders = orders.filter((order) => {
    const id = getOrderNotificationId(order);
    return id && !lastNotificationOrderIds.has(id);
  });

  ids.forEach((id) => lastNotificationOrderIds.add(id));
  persistNotificationState();

  newOrders.forEach((order) => {
    showAlert("info", "Novo pedido recebido", `${getOrderDisplayCode(order)} de ${order?.customer?.name || "cliente"} no valor de ${formatCurrency(order?.amountTotal || 0)}.`, {
      label: "WhatsApp",
      handler: () => window.open(getAdminWhatsAppUrl(order), "_blank", "noopener,noreferrer")
    });
    notifyBrowserForOrder(order);
  });
}

function renderNotificationCenter({ detectNew = false } = {}) {
  const popover = $("notification-popover");
  const list = $("notification-list");
  const summary = $("notification-summary");
  const dot = $("notif-dot");
  if (!list || !summary || !dot) return;

  const orders = getNotificationOrders();
  if (detectNew) detectNewOrdersForNotification(orders);

  const unread = orders.filter((order) => !readNotificationIds.has(getOrderNotificationId(order)));
  dot.classList.toggle("hidden", unread.length === 0);
  summary.textContent = orders.length
    ? `${unread.length} não lida${unread.length === 1 ? "" : "s"} • ${orders.length} em atenção`
    : "Nenhum pedido pendente";

  if (!orders.length) {
    list.innerHTML = `<div class="notification-empty">Nenhum pedido novo ou pendente agora.</div>`;
    return;
  }

  list.innerHTML = orders.map((order) => {
    const id = getOrderNotificationId(order);
    const unreadClass = readNotificationIds.has(id) ? "" : " is-unread";
    return `
      <article class="notification-item${unreadClass}">
        <div class="notification-item-head">
          <div>
            <h4>${escapeHtml(getOrderDisplayCode(order))} • ${escapeHtml(formatCurrency(order.amountTotal || 0))}</h4>
            <p>${escapeHtml(order.customer?.name || "Cliente sem nome")}</p>
          </div>
          <small>${escapeHtml(formatOrderStatus(order._status))}</small>
        </div>
        <small>${escapeHtml(order.customer?.phone || "Sem WhatsApp")} • ${escapeHtml(order.deliveryMethod || "retirada")}</small>
        <div class="notification-item-actions">
          <a class="notification-whatsapp" href="${escapeHtml(getAdminWhatsAppUrl(order))}" target="_blank" rel="noopener">Avisar no WhatsApp</a>
          <button type="button" class="notification-open-order" data-notification-order="${escapeHtml(id)}">Abrir pedido</button>
        </div>
      </article>
    `;
  }).join("");

  list.querySelectorAll("[data-notification-order]").forEach((button) => {
    button.addEventListener("click", () => {
      readNotificationIds.add(button.dataset.notificationOrder);
      persistNotificationState();
      if (popover) popover.hidden = true;
      $("notif-btn")?.setAttribute("aria-expanded", "false");
      switchSection("orders");
      renderNotificationCenter();
    });
  });
}

async function refreshNotifications({ detectNew = false } = {}) {
  try {
    const result = await apiFetch(buildUrl("/api/admin/orders", {
      status: "all",
      showHidden: "0",
      page: 1,
      limit: 12
    }), { method: "GET" });
    cachedOrders = result.items || result || [];
    renderNotificationCenter({ detectNew });
  } catch {
    renderNotificationCenter();
  }
}

function startNotificationPolling() {
  if (notificationPollTimer) clearInterval(notificationPollTimer);
  void refreshNotifications({ detectNew: false });
  notificationPollTimer = window.setInterval(() => {
    void refreshNotifications({ detectNew: true });
  }, 20000);
}

function bindNotificationCenter() {
  const button = $("notif-btn");
  const popover = $("notification-popover");
  if (!button || !popover) return;

  button.addEventListener("click", () => {
    const nextOpen = popover.hidden;
    popover.hidden = !nextOpen;
    button.setAttribute("aria-expanded", String(nextOpen));
    renderNotificationCenter();
  });

  $("notification-mark-read")?.addEventListener("click", () => {
    getNotificationOrders().forEach((order) => {
      const id = getOrderNotificationId(order);
      if (id) readNotificationIds.add(id);
    });
    persistNotificationState();
    renderNotificationCenter();
  });

  $("notification-open-orders")?.addEventListener("click", () => {
    popover.hidden = true;
    button.setAttribute("aria-expanded", "false");
    switchSection("orders");
  });

  $("notification-enable-browser")?.addEventListener("click", async () => {
    if (!("Notification" in window)) {
      showAlert("warning", "Navegador sem suporte", "Este navegador não permite notificações nativas.");
      return;
    }
    const permission = await Notification.requestPermission();
    showAlert(permission === "granted" ? "info" : "warning", "Avisos do navegador", permission === "granted" ? "Você será avisado quando um pedido novo aparecer." : "Permissão de notificação não liberada.");
  });

  document.addEventListener("click", (event) => {
    if (popover.hidden) return;
    if ($("notification-center")?.contains(event.target)) return;
    popover.hidden = true;
    button.setAttribute("aria-expanded", "false");
  });
}

function renderSystemAlerts(config) {
  const area = $("alerts-area");
  if (!area) return;
  area.innerHTML = "";

  if (!apiAvailable) {
    showAlert("info", "Modo local ativo", "Imagens armazenadas localmente. Configure um CDN para produção.");
  }

  if (!runtimeConfig.abacatepayConfigured && !runtimeConfig.stripeConfigured) {
    showAlert("warning", "Pagamento em modo teste", "Pagamentos reais desativados. Configure o provedor de pagamento no backend.");
  }

  const products = getLocalProducts();
  const outOfStock = products.filter((p) => Number(p.stock || 0) <= 0);
  if (outOfStock.length > 0) {
    const names = outOfStock.map((p) => p.name).join(" e ");
    showAlert("danger", `${outOfStock.length} produto${outOfStock.length > 1 ? "s" : ""} sem estoque`,
      `${names} ${outOfStock.length > 1 ? "estão" : "está"} zerado${outOfStock.length > 1 ? "s" : ""}.`,
      { label: "Ver", handler: () => switchSection("catalog") }
    );
  }

  renderNotificationCenter();
}

/* =============================================
   EDIT: open drawer on product edit
   ============================================= */
const _originalFillForm = fillForm;
// We'll override after bootstrap to open drawer
function fillFormAndOpen(product) {
  fillForm(product);
  openDrawer();
}

/* =============================================
   ENHANCED CHART COLORS
   ============================================= */
const GOLD_PALETTE = [
  "rgba(201,168,76,0.9)",
  "rgba(122,95,40,0.85)",
  "rgba(245,240,232,0.75)",
  "rgba(156,130,78,0.8)",
  "rgba(98,82,44,0.85)",
  "rgba(220,200,140,0.7)"
];

/* =============================================
   BOOTSTRAP
   ============================================= */
async function bootstrap() {
  await detectApiBase();
  $("login-form").addEventListener("submit", handleLogin);
  $("product-form").addEventListener("submit", handleProductSubmit);
  $("reset-form").addEventListener("click", resetForm);
  const previewButton = $("preview-product-btn");
  if (previewButton) {
    previewButton.addEventListener("click", openDraftPreview);
  }
  $("logout-button").addEventListener("click", () => {
    clearAuthToken();
    currentUser = null;
    closeDrawer();
    showLogin("Sessão encerrada.");
  });
  $("refresh-orders").addEventListener("click", async () => {
    await refreshOrders();
    await refreshDashboard();
  });
  $("refresh-dashboard").addEventListener("click", refreshDashboard);

  bindSidebar();
  bindDrawer();
  bindOrderChips();
  bindGridToggle();
  bindNotificationCenter();
  bindFilters();
  bindPreviewInputs();
  bindExtraUploadArea();
  resetForm();
  syncPreviewGallery();
  updateStoreLink();

  // Global search redirects to correct section
  $("global-search").addEventListener("input", (e) => {
    const q = e.target.value.trim();
    if (!q) return;
    if (currentSection === "orders") {
      state.orders.query = q;
      state.orders.page = 1;
      refreshOrders();
    } else {
      state.products.query = q;
      state.products.page = 1;
      if (currentSection !== "catalog") switchSection("catalog");
      else refreshProducts();
    }
  });

  const sessionValid = await loadSession();
  await loadConfig();

  if (sessionValid) {
    showDashboard();
    await refreshProducts();
    await refreshOrders();
    await refreshDashboard();
    renderSystemAlerts(runtimeConfig);
    startNotificationPolling();
  } else {
    showLogin(apiAvailable ? "" : "Sem backend detectado. O painel entrou em modo local.");
  }
}

document.addEventListener("DOMContentLoaded", bootstrap);

/* ═══════════════════════════════════════════════════════
   VARIAÇÕES DE COR — Admin
   ═══════════════════════════════════════════════════════ */
let colorsData = [];
let mainImageColorSelection = { name: "", hex: "#888888" };

const COLOR_PRESETS = [
  { name: "Preta", hex: "#1a1a1a" },
  { name: "Branca", hex: "#f5f0e8" },
  { name: "Cinza", hex: "#6e6e6e" },
  { name: "Vinho", hex: "#7b1e2d" },
  { name: "Azul", hex: "#2980b9" },
  { name: "Verde", hex: "#27ae60" },
  { name: "Vermelho", hex: "#c0392b" },
  { name: "Amarelo", hex: "#f1c40f" },
  { name: "Rosa", hex: "#e91e8c" },
  { name: "Bege", hex: "#c9b99a" },
  { name: "Off-White", hex: "#f0ece0" },
  { name: "Laranja", hex: "#e67e22" }
];

function normalizeColorVariant(input = {}) {
  if (typeof input === "string") {
    const preset = COLOR_PRESETS.find((item) => item.name.toLowerCase() === input.trim().toLowerCase());
    return {
      name: input.trim(),
      hex: preset?.hex || "#888888",
      images: [],
      stock: ""
    };
  }

  const source = typeof input === "object" && input ? input : {};
  const images = Array.isArray(source.images)
    ? source.images.map((value) => String(value || "").trim()).filter(Boolean)
    : [];
  const stockValue = source.stock === "" || source.stock === null || source.stock === undefined
    ? ""
    : Number(source.stock);

  return {
    name: String(source.name || "").trim(),
    hex: String(source.hex || "#888888").trim() || "#888888",
    images,
    stock: Number.isFinite(stockValue) ? stockValue : ""
  };
}

function getColorVariant(index) {
  return colorsData[index] || null;
}

function normalizeHexColor(value, fallback = "#888888") {
  const raw = String(value || "").trim();
  return /^#[0-9a-f]{6}$/i.test(raw) ? raw : fallback;
}

function getMainImageUrl() {
  return getThumbstripUrls()[0] || $("product-image")?.value.trim() || currentFilePreview || "";
}

function resetMainImageColorSelection() {
  mainImageColorSelection = { name: "", hex: "#888888" };
}

function getPresetNameFromHex(hex) {
  const normalizedHex = normalizeHexColor(hex).toLowerCase();
  const preset = COLOR_PRESETS.find((item) => normalizeHexColor(item.hex).toLowerCase() === normalizedHex);
  return preset?.name || "";
}

function getEffectiveMainImageColor() {
  const hex = normalizeHexColor(mainImageColorSelection.hex);
  const name = String(mainImageColorSelection.name || "").trim() || getPresetNameFromHex(hex) || "Cinza";
  return { name, hex };
}

function findColorVariantIndexByIdentity(name, hex) {
  const cleanName = String(name || "").trim().toLowerCase();
  const cleanHex = normalizeHexColor(hex, "").toLowerCase();
  return colorsData.findIndex((color) => {
    const colorName = String(color.name || "").trim().toLowerCase();
    const colorHex = normalizeHexColor(color.hex, "").toLowerCase();
    return (cleanName && colorName === cleanName) || (cleanHex && colorHex === cleanHex);
  });
}

function setMainImageColorSelection(name, hex, { render = true, sync = false } = {}) {
  mainImageColorSelection = {
    name: String(name || "").trim(),
    hex: normalizeHexColor(hex)
  };

  if (sync) {
    syncMainImageColorVariant();
  }

  if (render) {
    renderMainImageColorControl();
    renderColorsList();
  }
}

function inferMainImageColorSelection() {
  const mainImage = getMainImageUrl();
  if (!mainImage) {
    resetMainImageColorSelection();
    return;
  }

  const color = colorsData.find((item) => Array.isArray(item.images) && item.images.includes(mainImage));
  if (color) {
    setMainImageColorSelection(color.name, color.hex, { render: false });
    return;
  }

  if (mainImageColorSelection.name) return;
  setMainImageColorSelection("Cinza", "#888888", { render: false });
}

function syncMainImageColorVariant() {
  const mainImage = getMainImageUrl();
  assignImageToSelectedMainColor(mainImage);
}

function assignImageToSelectedMainColor(mainImage, previousImages = []) {
  const effectiveColor = getEffectiveMainImageColor();
  const colorName = effectiveColor.name;
  if (!mainImage || !colorName || mainImage === PLACEHOLDER_IMAGE) return;

  const colorHex = effectiveColor.hex;
  mainImageColorSelection = { name: colorName, hex: colorHex };
  let index = findColorVariantIndexByIdentity(colorName, colorHex);

  if (index === -1) {
    colorsData.push(normalizeColorVariant({
      name: colorName,
      hex: colorHex,
      images: [],
      stock: ""
    }));
    index = colorsData.length - 1;
  }

  const staleImages = new Set(
    (Array.isArray(previousImages) ? previousImages : [])
      .map((image) => String(image || "").trim())
      .filter(Boolean)
  );
  staleImages.add(mainImage);

  colorsData = colorsData.map((color, colorIndex) => {
    const images = Array.isArray(color.images)
      ? color.images.filter((image) => !staleImages.has(image))
      : [];
    if (colorIndex !== index) {
      return { ...color, images };
    }

    return {
      ...color,
      name: colorName,
      hex: colorHex,
      images: [mainImage, ...images]
    };
  });
}

function serializeColorVariants() {
  return colorsData
    .filter((color) => String(color.name || "").trim())
    .map((color) => ({
      name: String(color.name || "").trim(),
      hex: normalizeHexColor(color.hex),
      images: Array.isArray(color.images) ? color.images.map((image) => String(image || "").trim()).filter(Boolean) : [],
      stock: color.stock === "" || color.stock === null || color.stock === undefined ? undefined : Number(color.stock)
    }));
}

function renderMainImageColorPresets() {
  const presets = $("main-image-color-presets");
  if (!presets) return;

  presets.innerHTML = COLOR_PRESETS.map((preset) => {
    const label = escapeHtml(preset.name);
    return `
      <button type="button" class="main-image-color-preset"
        style="background:${preset.hex}"
        title="${label}"
        aria-label="${label}"
        data-main-color-name="${label}"
        data-main-color-hex="${preset.hex}"></button>
    `;
  }).join("");

  presets.querySelectorAll("[data-main-color-name]").forEach((button) => {
    button.addEventListener("click", () => {
      setMainImageColorSelection(button.dataset.mainColorName, button.dataset.mainColorHex, { sync: true });
    });
  });
}

function renderMainImageColorControl() {
  const card = $("main-image-color-card");
  if (!card) return;

  const mainImage = getMainImageUrl();
  const select = $("main-image-color-select");
  const nameInput = $("main-image-color-name");
  const hexInput = $("main-image-color-hex");
  const swatch = $("main-image-color-swatch");
  const preview = $("main-image-color-preview");
  const status = $("main-image-color-status");

  if (select) {
    const selectedIndex = findColorVariantIndexByIdentity(mainImageColorSelection.name, mainImageColorSelection.hex);
    select.innerHTML = `
      <option value="">Escolher cor existente...</option>
      ${colorsData.map((color, index) => {
        const label = color.name ? `${color.name} (${color.hex || "#888888"})` : `Cor ${index + 1}`;
        return `<option value="${index}" ${index === selectedIndex ? "selected" : ""}>${escapeHtml(label)}</option>`;
      }).join("")}
    `;
    select.onchange = () => {
      const color = colorsData[Number(select.value)];
      if (!color) return;
      setMainImageColorSelection(color.name, color.hex, { sync: true });
    };
  }

  if (nameInput) {
    nameInput.value = mainImageColorSelection.name || "";
    nameInput.oninput = () => {
      mainImageColorSelection.name = nameInput.value.trim();
      if (status) status.textContent = mainImage ? (mainImageColorSelection.name ? "Cor vinculada" : "Escolha a cor") : "Sem foto principal";
    };
    nameInput.onchange = () => setMainImageColorSelection(nameInput.value, mainImageColorSelection.hex, { sync: true });
  }
  if (hexInput) {
    hexInput.value = normalizeHexColor(mainImageColorSelection.hex);
    hexInput.oninput = () => {
      mainImageColorSelection.hex = normalizeHexColor(hexInput.value);
      if (swatch) swatch.style.background = mainImageColorSelection.hex;
    };
    hexInput.onchange = () => setMainImageColorSelection(mainImageColorSelection.name, hexInput.value, { sync: true });
  }
  if (swatch) swatch.style.background = normalizeHexColor(mainImageColorSelection.hex);
  if (preview) preview.src = mainImage || "https://placehold.co/120x120/111111/F5F0E8?text=Foto";
  if (status) {
    status.textContent = !mainImage
      ? "Sem foto principal"
      : mainImageColorSelection.name
        ? "Cor vinculada"
        : "Escolha a cor";
  }

  renderMainImageColorPresets();
}

function addColorVariant(preset = null) {
  colorsData.push(normalizeColorVariant(preset || { name: "", hex: "#888888", images: [], stock: "" }));
  renderColorsList();
  renderMainImageColorControl();
}

function removeColorVariant(index) {
  if (index < 0 || index >= colorsData.length) return;
  const removed = colorsData[index];
  colorsData.splice(index, 1);
  if (
    removed &&
    String(removed.name || "").trim().toLowerCase() === String(mainImageColorSelection.name || "").trim().toLowerCase()
  ) {
    resetMainImageColorSelection();
  }
  renderColorsList();
  renderMainImageColorControl();
}

function updateColorField(index, field, value, shouldRender = false) {
  const color = getColorVariant(index);
  if (!color) return;

  if (field === "images") {
    if (Array.isArray(value)) {
      color.images = value.map((entry) => String(entry || "").trim()).filter(Boolean);
    } else {
      color.images = String(value || "")
        .split(/\r?\n/)
        .map((entry) => entry.trim())
        .filter(Boolean);
    }
  } else if (field === "stock") {
    color.stock = value === "" || value === null || value === undefined ? "" : Number(value);
  } else if (field === "hex") {
    color.hex = String(value || "#888888").trim() || "#888888";
  } else if (field === "name") {
    color.name = String(value || "").trim();
  } else {
    color[field] = value;
  }

  if (shouldRender || field === "images" || field === "hex") {
    renderColorsList();
  }
  renderMainImageColorControl();
}

function applyPreset(index, name, hex) {
  const color = getColorVariant(index);
  if (!color) return;
  color.name = String(name || "").trim();
  color.hex = String(hex || "#888888").trim() || "#888888";
  renderColorsList();
  renderMainImageColorControl();
}

function setColorMainImage(index, imageIndex) {
  const color = getColorVariant(index);
  if (!color || !Array.isArray(color.images)) return;
  if (imageIndex <= 0 || imageIndex >= color.images.length) return;
  const [selected] = color.images.splice(imageIndex, 1);
  color.images.unshift(selected);
  renderColorsList();
}

function removeColorImage(index, imageIndex) {
  const color = getColorVariant(index);
  if (!color || !Array.isArray(color.images)) return;
  if (imageIndex < 0 || imageIndex >= color.images.length) return;
  color.images.splice(imageIndex, 1);
  renderColorsList();
}

function openColorPicker(index) {
  const input = document.getElementById(`color-picker-input-${index}`);
  if (input) input.click();
}

function triggerColorUpload(index) {
  const input = document.getElementById(`color-upload-input-${index}`);
  if (input) input.click();
}

function handleColorDrop(event, index) {
  event.preventDefault();
  event.stopPropagation();
  const zone = event.currentTarget || event.target;
  if (zone && zone.classList) {
    zone.classList.remove("dragging");
  }
  const files = event.dataTransfer?.files;
  if (files && files.length) {
    void handleColorFiles(index, files);
  }
}

function handleColorInputChange(event, index) {
  const files = event.target?.files;
  if (files && files.length) {
    void handleColorFiles(index, files);
  }
  event.target.value = "";
}

function normalizeColorUploadResponse(result) {
  if (!result || typeof result !== "object") return "";
  return String(result.imageUrl || result.url || result.path || "").trim();
}

async function uploadColorImage(file) {
  const formData = new FormData();
  formData.append("image", file, file.name || "color-image.jpg");
  const result = await apiFetch("/api/admin/uploads", {
    method: "POST",
    body: formData
  });
  return normalizeColorUploadResponse(result);
}

async function handleColorFiles(index, files) {
  const color = getColorVariant(index);
  if (!color) return;
  const colorRef = color;

  const accepted = Array.from(files || []).filter((file) => {
    const typeOk = /image\/(jpeg|png|webp)/i.test(file.type || "");
    const extOk = /\.(jpe?g|png|webp)$/i.test(file.name || "");
    return typeOk || extOk;
  });

  if (!accepted.length) {
    color.uploadMessage = "Formato inválido. Use JPG, PNG ou WEBP.";
    color.uploadTone = "error";
    color.uploadError = "";
    renderColorsList();
    return;
  }

  color.uploadMessage = `Processando ${accepted.length} imagem(ns)...`;
  color.uploadTone = "info";
  color.uploadError = "";
  renderColorsList();

  for (const file of accepted) {
    try {
      const previewUrl = await compressImageToBase64(file, 1200, 0.75);
      const colorSlot = colorsData.indexOf(colorRef);
      if (colorSlot === -1) return;
      const currentColor = colorsData[colorSlot];
      currentColor.images = Array.isArray(currentColor.images) ? currentColor.images : [];
      currentColor.images.push(previewUrl);
      currentColor.uploadMessage = "Preview gerado. Enviando para o servidor...";
      currentColor.uploadTone = "info";
      currentColor.uploadError = "";
      renderColorsList();

      try {
        const remoteUrl = await uploadColorImage(file);
        if (remoteUrl) {
          const activeSlot = colorsData.indexOf(colorRef);
          if (activeSlot === -1) continue;
          const activeColor = colorsData[activeSlot];
          const imageIndex = activeColor.images.indexOf(previewUrl);
          if (imageIndex !== -1) {
            activeColor.images[imageIndex] = remoteUrl;
          }
          activeColor.uploadMessage = "Imagem sincronizada com o servidor.";
          activeColor.uploadTone = "success";
          activeColor.uploadError = "";
        } else {
          const activeSlot = colorsData.indexOf(colorRef);
          const activeColor = activeSlot !== -1 ? colorsData[activeSlot] : null;
          if (activeColor) {
            activeColor.uploadMessage = "Upload concluído sem URL de retorno. Mantendo preview local.";
            activeColor.uploadTone = "warning";
            activeColor.uploadError = "";
          }
        }
      } catch (uploadError) {
        const activeSlot = colorsData.indexOf(colorRef);
        const activeColor = activeSlot !== -1 ? colorsData[activeSlot] : null;
        if (activeColor) {
          activeColor.uploadMessage = "Falha no upload. O preview local foi mantido.";
          activeColor.uploadTone = "warning";
          activeColor.uploadError = uploadError?.message || "Falha no upload.";
        }
      }
      renderColorsList();
    } catch (previewError) {
      const activeSlot = colorsData.indexOf(colorRef);
      const activeColor = activeSlot !== -1 ? colorsData[activeSlot] : null;
      if (activeColor) {
        activeColor.uploadMessage = "Não foi possível gerar o preview desta imagem.";
        activeColor.uploadTone = "error";
        activeColor.uploadError = previewError?.message || "Falha no preview.";
        renderColorsList();
      }
    }
  }

  const finalSlot = colorsData.indexOf(colorRef);
  const finalColor = finalSlot !== -1 ? colorsData[finalSlot] : null;
  if (finalColor && finalColor.uploadTone !== "warning" && finalColor.uploadTone !== "error") {
    finalColor.uploadMessage = "";
  }
  renderColorsList();
}

function renderColorThumbnails(color, index) {
  if (!Array.isArray(color.images) || !color.images.length) {
    return `
      <div style="font-size:0.72rem;color:#8d877d;padding:0.85rem;border:1px dashed rgba(245,240,232,0.12);border-radius:12px;background:rgba(255,255,255,0.015);">
        Nenhuma foto enviada para esta cor.
      </div>
    `;
  }

  return `
    <div style="display:flex;flex-wrap:wrap;gap:0.6rem;">
      ${color.images.map((image, imageIndex) => {
        const isMain = imageIndex === 0;
        return `
          <div style="position:relative;width:60px;height:60px;border-radius:12px;overflow:hidden;border:1px solid rgba(245,240,232,0.12);background:rgba(255,255,255,0.03);box-shadow:0 4px 12px rgba(0,0,0,0.18);">
            <img src="${escapeHtml(image)}" alt="Foto ${imageIndex + 1}" style="width:100%;height:100%;object-fit:cover;display:block;">
            ${isMain ? `
              <span style="position:absolute;top:4px;left:4px;padding:0.1rem 0.25rem;border-radius:999px;background:rgba(200,169,110,0.92);color:#0a0a0a;font-size:0.62rem;font-weight:700;line-height:1;">✦</span>
            ` : `
              <button type="button" onclick="setColorMainImage(${index}, ${imageIndex})"
                title="Definir como principal"
                style="position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:999px;border:1px solid rgba(245,240,232,0.2);background:rgba(10,10,10,0.72);color:#f5f0e8;font-size:0.75rem;cursor:pointer;display:grid;place-items:center;">☆</button>
            `}
            <button type="button" onclick="removeColorImage(${index}, ${imageIndex})"
              title="Remover foto"
              style="position:absolute;right:3px;bottom:3px;width:20px;height:20px;border-radius:999px;border:1px solid rgba(245,240,232,0.2);background:rgba(10,10,10,0.72);color:#ff8c8c;font-size:0.78rem;cursor:pointer;display:grid;place-items:center;">×</button>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderPresetButtons(index) {
  return COLOR_PRESETS.map((preset) => `
    <button type="button" onclick="applyPreset(${index}, '${preset.name}', '${preset.hex}')"
      title="${preset.name}"
      style="width:22px;height:22px;border-radius:50%;background:${preset.hex};border:2px solid rgba(255,255,255,0.16);cursor:pointer;padding:0;box-shadow:0 0 0 1px rgba(0,0,0,0.15) inset;"
      onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'"></button>
  `).join("");
}

function renderColorsList() {
  const list = document.getElementById("colors-list");
  if (!list) return;

  if (!colorsData.length) {
    list.innerHTML = `
      <p style="font-size:0.8rem;color:#8d877d;padding:0.85rem 1rem;border:1px dashed rgba(245,240,232,0.12);border-radius:12px;text-align:center;background:rgba(255,255,255,0.015);">
        Nenhuma variação. Clique em "+ Adicionar Cor".
      </p>
    `;
    return;
  }

  list.innerHTML = colorsData.map((color, index) => {
    const mainImage = Array.isArray(color.images) && color.images.length ? color.images[0] : "";
    const hasMainImage = Boolean(mainImage);
    const uploadTone = color.uploadTone || "";
    const uploadColor = {
      info: "#b7b0a5",
      success: "#8acb8a",
      warning: "#e0b46c",
      error: "#ff8c8c"
    }[uploadTone] || "#8d877d";
    const uploadMessage = color.uploadMessage ? escapeHtml(color.uploadMessage) : "";

    return `
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(245,240,232,0.12);border-radius:14px;padding:1rem;position:relative;box-shadow:0 8px 24px rgba(0,0,0,0.12);">
        <button type="button" onclick="removeColorVariant(${index})"
          title="Remover cor"
          style="position:absolute;top:0.75rem;right:0.75rem;width:28px;height:28px;border-radius:999px;border:1px solid rgba(245,240,232,0.14);background:rgba(255,100,100,0.12);color:#ff8c8c;font-size:1rem;cursor:pointer;display:grid;place-items:center;">×</button>

        <div style="display:grid;grid-template-columns:auto 1fr;gap:0.9rem;align-items:start;margin-bottom:0.9rem;">
          <div style="display:flex;flex-direction:column;align-items:center;gap:0.45rem;">
            <button type="button" onclick="openColorPicker(${index})"
              title="Abrir seletor de cor"
              style="position:relative;width:72px;height:72px;border-radius:50%;border:2px solid rgba(245,240,232,0.14);background:${color.hex || "#888888"};cursor:pointer;overflow:hidden;box-shadow:0 10px 20px rgba(0,0,0,0.22);padding:0;">
              <span style="position:absolute;inset:0;background:${color.hex || "#888888"};"></span>
              ${hasMainImage ? `
                <img src="${escapeHtml(mainImage)}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.55;pointer-events:none;">
              ` : ""}
              <span style="position:absolute;inset:auto 50% 8px auto;transform:translateX(50%);font-size:0.62rem;letter-spacing:0.12em;text-transform:uppercase;color:rgba(245,240,232,0.85);text-shadow:0 1px 2px rgba(0,0,0,0.45);font-weight:700;">Cor</span>
            </button>
            <input id="color-picker-input-${index}" type="color" value="${color.hex || "#888888"}"
              aria-label="Selecionar cor"
              onchange="updateColorField(${index}, 'hex', this.value, true)"
              style="position:absolute;opacity:0;pointer-events:none;width:0;height:0;border:0;padding:0;">
            <div style="display:flex;align-items:center;gap:0.35rem;justify-content:center;">
              <span style="width:10px;height:10px;border-radius:50%;background:${color.hex || "#888888"};border:1px solid rgba(255,255,255,0.18);box-shadow:0 0 0 1px rgba(0,0,0,0.18) inset;"></span>
              <span style="font-size:0.72rem;color:#b7b0a5;">Clique para editar</span>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 120px;gap:0.75rem;align-items:end;">
            <div>
              <label style="display:block;font-size:0.7rem;letter-spacing:0.1em;text-transform:uppercase;color:#8d877d;margin-bottom:0.32rem;">Nome da cor</label>
              <input type="text" value="${escapeHtml(color.name || "")}" placeholder="Ex: Cinza Estonado"
                oninput="updateColorField(${index}, 'name', this.value)"
                style="width:100%;padding:0.72rem 0.82rem;background:rgba(255,255,255,0.04);border:1px solid rgba(245,240,232,0.12);border-radius:12px;color:#f5f0e8;font-size:0.9rem;outline:none;">
            </div>
            <div>
              <label style="display:block;font-size:0.7rem;letter-spacing:0.1em;text-transform:uppercase;color:#8d877d;margin-bottom:0.32rem;">Hex</label>
              <div style="display:flex;gap:0.45rem;align-items:center;">
                <input type="text" value="${escapeHtml(color.hex || "#888888")}" maxlength="7"
                  oninput="updateColorField(${index}, 'hex', this.value, false)"
                  onchange="updateColorField(${index}, 'hex', this.value, true)"
                  style="width:100%;padding:0.72rem 0.82rem;background:rgba(255,255,255,0.04);border:1px solid rgba(245,240,232,0.12);border-radius:12px;color:#f5f0e8;font-size:0.88rem;outline:none;font-family:monospace;">
              </div>
            </div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 120px;gap:0.75rem;margin-bottom:0.9rem;">
          <div>
            <label style="display:block;font-size:0.7rem;letter-spacing:0.1em;text-transform:uppercase;color:#8d877d;margin-bottom:0.32rem;">Fotos da cor</label>
            <div class="color-upload-zone"
              onclick="triggerColorUpload(${index})"
              ondragover="event.preventDefault(); this.style.borderColor='rgba(200,169,110,0.8)'; this.style.background='rgba(200,169,110,0.08)';"
              ondragleave="this.style.borderColor='rgba(245,240,232,0.12)'; this.style.background='rgba(255,255,255,0.02)';"
              ondrop="handleColorDrop(event, ${index})"
              style="padding:0.95rem;border:1px dashed rgba(245,240,232,0.12);border-radius:14px;background:rgba(255,255,255,0.02);color:#f5f0e8;cursor:pointer;transition:all 0.18s ease;">
              <input id="color-upload-input-${index}" type="file" accept="image/jpeg,image/png,image/webp" multiple
                onchange="handleColorInputChange(event, ${index})"
                style="display:none;">
              <div style="display:flex;flex-direction:column;gap:0.3rem;align-items:flex-start;">
                <strong style="font-size:0.82rem;letter-spacing:0.04em;">Clique ou arraste imagens aqui</strong>
                <span style="font-size:0.72rem;color:#8d877d;">JPG, PNG ou WEBP. O preview aparece instantaneamente.</span>
              </div>
            </div>
          </div>
          <div>
            <label style="display:block;font-size:0.7rem;letter-spacing:0.1em;text-transform:uppercase;color:#8d877d;margin-bottom:0.32rem;">Estoque por cor</label>
            <input type="number" min="0" value="${color.stock !== "" && color.stock !== undefined ? escapeHtml(String(color.stock)) : ""}"
              placeholder="Ex: 50"
              oninput="updateColorField(${index}, 'stock', this.value)"
              style="width:100%;padding:0.72rem 0.82rem;background:rgba(255,255,255,0.04);border:1px solid rgba(245,240,232,0.12);border-radius:12px;color:#f5f0e8;font-size:0.9rem;outline:none;">
          </div>
        </div>

        <div style="margin-bottom:0.85rem;">
          ${renderColorThumbnails(color, index)}
        </div>

        ${uploadMessage ? `
          <div style="margin-bottom:0.85rem;padding:0.7rem 0.85rem;border-radius:12px;border:1px solid rgba(245,240,232,0.12);background:rgba(255,255,255,0.02);color:${uploadColor};font-size:0.78rem;line-height:1.4;">
            ${uploadMessage}
            ${color.uploadError ? `<div style="margin-top:0.25rem;color:#8d877d;font-size:0.72rem;">${escapeHtml(color.uploadError)}</div>` : ""}
          </div>
        ` : ""}

        <div style="display:flex;gap:0.45rem;flex-wrap:wrap;align-items:center;">
          <span style="font-size:0.68rem;color:#8d877d;letter-spacing:0.08em;text-transform:uppercase;">Preset rápido:</span>
          ${renderPresetButtons(index)}
        </div>
      </div>
    `;
  }).join("");
}

const _origCollectDraft = collectProductDraft;
collectProductDraft = function () {
  const draft = _origCollectDraft();
  syncMainImageColorVariant();
  draft.colors = serializeColorVariants();
  return draft;
};

const _origFillForm = fillForm;
fillForm = function (product) {
  _origFillForm(product);
  colorsData = Array.isArray(product?.colors)
    ? product.colors.map((color) => normalizeColorVariant(color))
    : [];
  inferMainImageColorSelection();
  renderColorsList();
  renderMainImageColorControl();
};

const _origResetForm = resetForm;
resetForm = function () {
  _origResetForm();
  colorsData = [];
  resetMainImageColorSelection();
  renderColorsList();
  renderMainImageColorControl();
};

window.addColorVariant = addColorVariant;
window.removeColorVariant = removeColorVariant;
window.updateColorField = updateColorField;
window.applyPreset = applyPreset;
window.setColorMainImage = setColorMainImage;
window.removeColorImage = removeColorImage;
window.openColorPicker = openColorPicker;
window.triggerColorUpload = triggerColorUpload;
window.handleColorDrop = handleColorDrop;
window.handleColorInputChange = handleColorInputChange;

document.addEventListener("DOMContentLoaded", () => {
  renderColorsList();
  renderMainImageColorControl();
});
