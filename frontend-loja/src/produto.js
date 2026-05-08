let produtoAtual = null;
let tamanhoSelecionado = "";
let fotoAtual = 0;
let todasFotos = [];
let tamanhosDisponiveis = [];
const PREVIEW_DRAFT_KEY = "bigsmoke-product-preview-draft";
let _lbZoom = 1;
let _lbPanX = 0;
let _lbPanY = 0;
let _lbDragging = false;
let _lbDragStart = { x: 0, y: 0, panX: 0, panY: 0 };
let _lbPinchDist = null;

const API_BASE = window.location.protocol === "file:" ? "http://localhost:3000" : window.location.origin;

function apiUrl(path) {
  return new URL(path, API_BASE).toString();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeImageUrl(value) {
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

async function readApiJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function getFallbackProducts() {
  if (typeof loadLocalProducts === "function") {
    return loadLocalProducts();
  }
  return [];
}

function setDescription(text = "") {
  const container = document.getElementById("produto-descricao");
  if (!container) return;

  container.innerHTML = "";
  const parts = String(text || "Peça BigSmoke Streetwear.")
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);

  parts.forEach((part) => {
    const p = document.createElement("p");
    p.textContent = part;
    container.appendChild(p);
  });
}

function normalizeImageList(product) {
  const primary = String(product?.image || product?.image_url || "").trim();
  const list = Array.isArray(product?.images) ? product.images : [];
  const merged = [primary, ...list].map((item) => String(item || "").trim()).filter(Boolean);
  return [...new Set(merged)];
}

function getPreviewDraftProduct() {
  try {
    const raw = localStorage.getItem(PREVIEW_DRAFT_KEY);
    if (!raw) return null;

    const draft = JSON.parse(raw);
    if (!draft) return null;

    const product = {
      id: String(draft.id || `preview-${Date.now()}`),
      name: String(draft.name || "Produto BigSmoke"),
      category: String(draft.category || "Categoria"),
      description: String(draft.description || "Peça BigSmoke Streetwear."),
      price: Number(draft.price) || 0,
      stock: Math.max(0, Math.floor(Number(draft.stock || 0))),
      badge: String(draft.badge || draft.category || "BigSmoke"),
      sizes: String(draft.sizes || "P, M, G, GG"),
      image: String(draft.image || draft.image_url || "").trim(),
      image_url: String(draft.image_url || draft.image || "").trim(),
      images: Array.isArray(draft.images) ? draft.images.map((url) => String(url || "").trim()).filter(Boolean) : [],
      colors: Array.isArray(draft.colors)
        ? draft.colors.map((color) => ({
          name: String(color?.name || "").trim(),
          hex: String(color?.hex || "#888888").trim() || "#888888",
          images: Array.isArray(color?.images) ? color.images.map((url) => String(url || "").trim()).filter(Boolean) : [],
          stock: color?.stock === "" || color?.stock === null || color?.stock === undefined ? undefined : Number(color.stock)
        })).filter((color) => color.name)
        : [],
      active: draft.active !== false,
      featured: Boolean(draft.featured)
    };

    const normalizedImages = normalizeImageList(product);
    if (normalizedImages.length) {
      product.images = normalizedImages;
      product.image = normalizedImages[0];
      product.image_url = normalizedImages[0];
    }

    return product;
  } catch {
    return null;
  }
}

function renderThumbs(images) {
  const thumbsEl = document.getElementById("galeria-thumbs");
  thumbsEl.innerHTML = "";

  images.forEach((url, index) => {
    const thumb = document.createElement("button");
    thumb.type = "button";
    thumb.className = `thumb-item${index === 0 ? " active" : ""}`;
    thumb.setAttribute("aria-label", `Abrir foto ${index + 1}`);
    const img = document.createElement("img");
    img.src = safeImageUrl(url);
    img.alt = `Foto ${index + 1}`;
    img.loading = "lazy";
    thumb.appendChild(img);
    thumb.addEventListener("click", () => trocarFoto(index));
    thumbsEl.appendChild(thumb);
  });
}

function trocarFoto(index) {
  if (!todasFotos.length) return;
  fotoAtual = index;
  const principal = document.getElementById("foto-principal");
  principal.src = safeImageUrl(todasFotos[index]);
  document.querySelectorAll(".thumb-item").forEach((el, currentIndex) => {
    el.classList.toggle("active", currentIndex === index);
  });
}

function renderTamanhos(sizes) {
  const wrapper = document.getElementById("size-picker-wrapper");
  const container = document.getElementById("size-chips-produto");
  container.innerHTML = "";
  tamanhoSelecionado = "";
  tamanhosDisponiveis = sizes;

  if (!sizes.length) {
    wrapper.style.display = "none";
    return;
  }

  wrapper.style.display = "";
  sizes.forEach((size) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "size-chip";
    btn.textContent = size;
    btn.addEventListener("click", () => selecionarTamanho(size));
    container.appendChild(btn);
  });

  selecionarTamanho(sizes[0]);
}

function selecionarTamanho(size) {
  tamanhoSelecionado = size;
  document.querySelectorAll("#size-chips-produto .size-chip").forEach((button) => {
    button.classList.toggle("active", button.textContent === size);
  });
}

function _lbApplyTransform() {
  const img = document.getElementById("lightbox-img");
  if (!img) return;

  const panX = _lbPanX / _lbZoom;
  const panY = _lbPanY / _lbZoom;
  img.style.transformOrigin = "center center";
  img.style.transform = `scale(${_lbZoom}) translate(${panX}px, ${panY}px)`;
  img.style.transition = _lbDragging ? "none" : "transform 200ms ease";
  img.style.cursor = _lbZoom > 1 ? (_lbDragging ? "grabbing" : "grab") : "zoom-in";
}

function _lbResetZoom() {
  _lbZoom = 1;
  _lbPanX = 0;
  _lbPanY = 0;
  _lbDragging = false;
  _lbDragStart = { x: 0, y: 0, panX: 0, panY: 0 };
  _lbPinchDist = null;
  const img = document.getElementById("lightbox-img");
  if (img) {
    img.style.transform = "";
    img.style.transition = "transform 200ms ease";
    img.style.cursor = "zoom-in";
  }
}

function _lbClamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function _lbSetZoom(newZoom, clientX, clientY) {
  const img = document.getElementById("lightbox-img");
  if (!img) return;

  const zoom = _lbClamp(Number(newZoom) || 1, 1, 4);
  const rect = img.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const x = Number.isFinite(clientX) ? clientX : centerX;
  const y = Number.isFinite(clientY) ? clientY : centerY;
  const offsetX = x - centerX;
  const offsetY = y - centerY;
  const previousZoom = _lbZoom || 1;
  const previousPanX = _lbPanX;
  const previousPanY = _lbPanY;

  if (zoom === 1) {
    _lbZoom = 1;
    _lbPanX = 0;
    _lbPanY = 0;
    _lbDragging = false;
    _lbApplyTransform();
    return;
  }

  const localX = (offsetX - previousPanX) / previousZoom;
  const localY = (offsetY - previousPanY) / previousZoom;
  _lbZoom = zoom;
  _lbPanX = offsetX - localX * zoom;
  _lbPanY = offsetY - localY * zoom;
  _lbApplyTransform();
}

function _lbBindZoom() {
  const overlay = document.getElementById("lightbox");
  const img = document.getElementById("lightbox-img");
  if (!overlay || !img || overlay._zoomBound) return;
  overlay._zoomBound = true;

  overlay.addEventListener("wheel", (event) => {
    if (!overlay.classList.contains("active")) return;
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.25 : 0.25;
    _lbSetZoom(_lbZoom + delta, event.clientX, event.clientY);
  }, { passive: false });

  img.addEventListener("click", (event) => {
    event.stopPropagation();
    if (_lbZoom > 1) {
      _lbResetZoom();
      return;
    }
    _lbSetZoom(2.2, event.clientX, event.clientY);
  });

  img.addEventListener("mousedown", (event) => {
    if (_lbZoom <= 1) return;
    event.preventDefault();
    event.stopPropagation();
    _lbDragging = true;
    _lbDragStart = {
      x: event.clientX,
      y: event.clientY,
      panX: _lbPanX,
      panY: _lbPanY
    };
    _lbApplyTransform();
  });

  window.addEventListener("mousemove", (event) => {
    if (!_lbDragging) return;
    _lbPanX = _lbDragStart.panX + (event.clientX - _lbDragStart.x);
    _lbPanY = _lbDragStart.panY + (event.clientY - _lbDragStart.y);
    _lbApplyTransform();
  });

  window.addEventListener("mouseup", () => {
    if (!_lbDragging) return;
    _lbDragging = false;
    _lbApplyTransform();
  });

  overlay.addEventListener("touchstart", (event) => {
    if (event.touches.length === 2) {
      const [touchA, touchB] = event.touches;
      _lbPinchDist = Math.hypot(touchA.clientX - touchB.clientX, touchA.clientY - touchB.clientY);
    }
  }, { passive: true });

  overlay.addEventListener("touchmove", (event) => {
    if (event.touches.length !== 2 || !_lbPinchDist) return;
    event.preventDefault();
    const [touchA, touchB] = event.touches;
    const nextDist = Math.hypot(touchA.clientX - touchB.clientX, touchA.clientY - touchB.clientY);
    const midX = (touchA.clientX + touchB.clientX) / 2;
    const midY = (touchA.clientY + touchB.clientY) / 2;
    const ratio = nextDist / _lbPinchDist;
    _lbSetZoom(_lbZoom * ratio, midX, midY);
    _lbPinchDist = nextDist;
  }, { passive: false });

  overlay.addEventListener("touchend", () => {
    _lbPinchDist = null;
    _lbDragging = false;
    _lbApplyTransform();
  }, { passive: true });

  overlay.addEventListener("touchcancel", () => {
    _lbPinchDist = null;
    _lbDragging = false;
    _lbApplyTransform();
  }, { passive: true });
}

function openLightbox(index) {
  if (!todasFotos.length) return;
  fotoAtual = index;
  const overlay = document.getElementById("lightbox");
  const img = document.getElementById("lightbox-img");
  if (!overlay || !img) return;
  img.src = todasFotos[index];
  overlay.classList.add("active");
  document.body.style.overflow = "hidden";
  _lbResetZoom();
  _lbBindZoom();
  _lbApplyTransform();
}

function closeLightbox() {
  const overlay = document.getElementById("lightbox");
  if (overlay) overlay.classList.remove("active");
  document.body.style.overflow = "";
  _lbResetZoom();
}

function lightboxNav(dir, event) {
  if (event) event.stopPropagation();
  if (!todasFotos.length) return;
  fotoAtual = (fotoAtual + dir + todasFotos.length) % todasFotos.length;
  const img = document.getElementById("lightbox-img");
  if (img) img.src = todasFotos[fotoAtual];
  _lbResetZoom();
  _lbApplyTransform();
}

function bindProductActions() {
  const button = document.getElementById("btn-add-produto");
  button.addEventListener("click", () => {
    if (!produtoAtual) return;
    if (tamanhosDisponiveis.length && !tamanhoSelecionado) return;
    if (typeof addToCart === "function") {
      addToCart(produtoAtual.id, tamanhoSelecionado);
    }

    const original = button.innerHTML;
    button.innerHTML = "✓ Adicionado!";
    setTimeout(() => {
      button.innerHTML = original;
    }, 1800);
  });

  document.getElementById("foto-principal").addEventListener("click", () => openLightbox(0));

  document.addEventListener("keydown", (event) => {
    const lightbox = document.getElementById("lightbox");
    if (!lightbox.classList.contains("active")) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") lightboxNav(-1, event);
    if (event.key === "ArrowRight") lightboxNav(1, event);
  });
}

async function carregarProduto() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id") || params.get("highlight");
  const preview = params.get("preview");

  let produto = null;
  let apiResolved = false;

  if (preview === "draft") {
    produto = getPreviewDraftProduct();
  }

  if (!produto && id) {
    try {
      const listResponse = await fetch(apiUrl("/api/products"));
      if (listResponse.ok) {
        const list = await readApiJson(listResponse);
        apiResolved = true;
        produto = Array.isArray(list)
          ? list.find((item) => String(item.id) === String(id)) || null
          : null;
      }
    } catch {
      // try detail endpoint below
    }
  }

  if (!produto && id) {
    try {
      const response = await fetch(apiUrl(`/api/products/${encodeURIComponent(id)}`));
      if (response.ok) {
        produto = await readApiJson(response);
        apiResolved = true;
      }
    } catch {
      // fallback local
    }
  }

  if (!produto && !apiResolved) {
    const fallbackProducts = getFallbackProducts();
    produto = fallbackProducts.find((item) => String(item.id) === String(id)) || null;
  }

  if (!produto && preview === "draft") {
    produto = getPreviewDraftProduct();
  }

  if (!produto) {
    window.location.href = "/loja/";
    return;
  }

  produtoAtual = produto;
  window.__activePreviewProduct = produtoAtual;

  document.title = `${produto.name} | BigSmoke`;
  document.getElementById("breadcrumb-category").textContent = produto.category || "Produto";
  document.getElementById("breadcrumb-name").textContent = produto.name || "Produto";
  document.getElementById("produto-categoria").textContent = produto.category || "";
  document.getElementById("produto-nome").textContent = produto.name || "";
  document.getElementById("produto-preco").textContent = `R$ ${Number(produto.price || 0).toFixed(2).replace(".", ",")}`;
  document.getElementById("smoke-tag").textContent = produto.badge || "BIGSMOKE";
  setDescription(produto.description);

  todasFotos = normalizeImageList(produto);
  if (!todasFotos.length) {
    todasFotos = ["../imagens/logo_sem_fundo.png"];
  }

  renderThumbs(todasFotos);
  trocarFoto(0);

  const sizes = String(produto.sizes || "")
    .split(",")
    .map((size) => size.trim())
    .filter(Boolean);
  renderTamanhos(sizes);
}

function initProductPage() {
  if (window.__productPageBootstrapped) return;
  window.__productPageBootstrapped = true;
  bindProductActions();
  carregarProduto();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProductPage);
} else {
  window.setTimeout(initProductPage, 0);
}

let corSelecionada = window.corSelecionada || "";
const COLOR_MAP = {
  preta: { hex: "#111111", label: "Preta" },
  preto: { hex: "#111111", label: "Preta" },
  branca: { hex: "#f5f0e8", label: "Branca" },
  branco: { hex: "#f5f0e8", label: "Branca" },
  offwhite: { hex: "#ece6d7", label: "Off-white" },
  "off-white": { hex: "#ece6d7", label: "Off-white" },
  "off white": { hex: "#ece6d7", label: "Off-white" },
  cinza: { hex: "#8d8d8d", label: "Cinza" },
  grafite: { hex: "#4b4b4b", label: "Grafite" },
  vermelho: { hex: "#b3272d", label: "Vermelho" },
  azul: { hex: "#2f5cff", label: "Azul" },
  "azul-marinho": { hex: "#1d2f6f", label: "Azul-marinho" },
  verde: { hex: "#2f8f57", label: "Verde" },
  amarelo: { hex: "#d8b33b", label: "Amarelo" },
  bege: { hex: "#c9b59a", label: "Bege" },
  areia: { hex: "#d9c8ae", label: "Areia" },
  nude: { hex: "#cdb8a8", label: "Nude" },
  vinho: { hex: "#651f2c", label: "Vinho" },
  rosa: { hex: "#d86a8a", label: "Rosa" },
  marrom: { hex: "#6b4b39", label: "Marrom" },
  roxo: { hex: "#6a4fb4", label: "Roxo" }
};

const DEFAULT_FABRIC_ITEMS = [
  "Oversized",
  "100% Algodão Premium",
  "Gola Reforçada",
  "Estampa Alta Qualidade",
  "Bordado Premium"
];

const DEFAULT_SIZE_TABLE = {
  sizes: ["P", "M", "G", "GG"],
  rows: [
    { label: "Comprimento", values: { P: "72", M: "74", G: "76", GG: "78" } },
    { label: "Largura", values: { P: "56", M: "58", G: "60", GG: "62" } },
    { label: "Ombro", values: { P: "52", M: "54", G: "56", GG: "58" } },
    { label: "Manga", values: { P: "22", M: "23", G: "24", GG: "25" } }
  ],
  note: "As medidas podem variar em até 2cm."
};

const COLOR_ALIASES = {
  preto: "preta",
  branca: "branca",
  branco: "branca",
  offwhite: "offwhite",
  "off-white": "offwhite",
  "off white": "offwhite",
  cinza: "cinza",
  grafite: "grafite",
  vermelho: "vermelho",
  azul: "azul",
  "azul-marinho": "azul-marinho",
  "azul marinho": "azul-marinho",
  verde: "verde",
  amarelo: "amarelo",
  bege: "bege",
  areia: "areia",
  nude: "nude",
  vinho: "vinho",
  rosa: "rosa",
  marrom: "marrom",
  roxo: "roxo"
};

function normalizeColorKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/_/g, " ")
    .replace(/\s*-\s*/g, "-");
}

function resolveColorEntry(value) {
  const normalized = normalizeColorKey(value);
  const alias = COLOR_ALIASES[normalized] || normalized.replace(/\s/g, "");
  const entry = COLOR_MAP[alias] || COLOR_MAP[normalized] || COLOR_MAP[normalized.replace(/\s/g, "")];
  if (!entry) return null;
  return { key: alias in COLOR_MAP ? alias : normalized, ...entry };
}

function parseProductColors(product) {
  const found = [];
  const seen = new Set();

  function pushColor(value) {
    const entry = resolveColorEntry(value);
    if (!entry) return;
    const key = normalizeColorKey(entry.label || entry.key || value);
    if (seen.has(key)) return;
    seen.add(key);
    found.push({ key: entry.key || key, ...entry });
  }

  const rawColors = product?.colors;
  if (Array.isArray(rawColors)) {
    rawColors.forEach((color) => {
      if (typeof color === "string") {
        pushColor(color);
        return;
      }
      pushColor(color?.label || color?.name || color?.color || color?.hex);
    });
  } else if (typeof rawColors === "string") {
    rawColors.split(",").map((color) => color.trim()).filter(Boolean).forEach(pushColor);
  }

  const description = normalizeColorKey(product?.description || "");
  Object.entries(COLOR_MAP).forEach(([key, value]) => {
    const normalizedKey = normalizeColorKey(key);
    const normalizedLabel = normalizeColorKey(value.label);
    if (description.includes(normalizedKey) || description.includes(normalizedLabel)) {
      pushColor(key);
    }
  });

  if (!found.length) {
    pushColor("preta");
  }

  return found;
}

function renderColorPicker(colors) {
  const wrapper = document.getElementById("color-picker-wrapper");
  const chips = document.getElementById("color-chips-produto");
  const name = document.getElementById("color-selected-name");
  if (!wrapper || !chips || !name) return;

  const list = Array.isArray(colors) && colors.length ? colors : parseProductColors(produtoAtual);
  chips.innerHTML = "";

  if (!list.length) {
    wrapper.style.display = "none";
    return;
  }

  wrapper.style.display = "";
  const selected = list[0];
  corSelecionada = selected.label;
  window.corSelecionada = corSelecionada;
  name.textContent = selected.label;

  list.forEach((color, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `color-chip${index === 0 ? " active" : ""}`;
    button.style.setProperty("--chip-color", color.hex || "#f5f0e8");
    button.dataset.colorKey = color.key;
    button.dataset.colorLabel = color.label;
    button.setAttribute("aria-pressed", index === 0 ? "true" : "false");
    button.setAttribute("aria-label", color.label);
    button.title = color.label;
    button.addEventListener("click", () => {
      chips.querySelectorAll(".color-chip").forEach((chip) => {
        chip.classList.remove("active");
        chip.setAttribute("aria-pressed", "false");
      });
      button.classList.add("active");
      button.setAttribute("aria-pressed", "true");
      corSelecionada = color.label;
      window.corSelecionada = corSelecionada;
      name.textContent = color.label;
    });
    chips.appendChild(button);
  });
}

function resolveFabricItems(product) {
  const raw = product?.fabric || product?.details;
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item || "").trim()).filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw.split(/[\n,"]/).map((item) => item.trim()).filter(Boolean);
  }
  return DEFAULT_FABRIC_ITEMS;
}

function renderFabricList(product) {
  const list = document.getElementById("fabric-list");
  if (!list) return;

  const items = resolveFabricItems(product);
  list.innerHTML = items.map((item) => `<li class="fabric-item">${escapeHtml(item)}</li>`).join("");
}

function resolveSizeTable(product) {
  const raw = product?.sizeTable;
  if (!raw) return DEFAULT_SIZE_TABLE;

  if (Array.isArray(raw)) {
    const sizes = ["P", "M", "G", "GG"];
    const rows = raw.map((row) => ({
      label: String(row?.label || row?.name || row?.measure || "").trim(),
      values: {
        P: String(row?.P ?? row?.p ?? row?.values?.P ?? ""),
        M: String(row?.M ?? row?.m ?? row?.values?.M ?? ""),
        G: String(row?.G ?? row?.g ?? row?.values?.G ?? ""),
        GG: String(row?.GG ?? row?.gg ?? row?.values?.GG ?? "")
      }
    })).filter((row) => row.label);
    return rows.length ? { sizes, rows, note: raw.note || DEFAULT_SIZE_TABLE.note } : DEFAULT_SIZE_TABLE;
  }

  if (typeof raw === "object") {
    if (Array.isArray(raw.rows) && raw.rows.length) {
      return {
        sizes: Array.isArray(raw.sizes) && raw.sizes.length ? raw.sizes : DEFAULT_SIZE_TABLE.sizes,
        rows: raw.rows.map((row) => ({
          label: String(row.label || row.name || row.measure || "").trim(),
          values: {
            P: String(row.values?.P ?? row.P ?? row.p ?? ""),
            M: String(row.values?.M ?? row.M ?? row.m ?? ""),
            G: String(row.values?.G ?? row.G ?? row.g ?? ""),
            GG: String(row.values?.GG ?? row.GG ?? row.gg ?? "")
          }
        })).filter((row) => row.label),
        note: raw.note || DEFAULT_SIZE_TABLE.note
      };
    }

    const sizes = Array.isArray(raw.sizes) && raw.sizes.length ? raw.sizes : DEFAULT_SIZE_TABLE.sizes;
    const rows = ["Comprimento", "Largura", "Ombro", "Manga"].map((label) => {
      const valueSource = raw[label] || raw[normalizeColorKey(label)] || {};
      return {
        label,
        values: {
          P: String(valueSource.P ?? valueSource.p ?? ""),
          M: String(valueSource.M ?? valueSource.m ?? ""),
          G: String(valueSource.G ?? valueSource.g ?? ""),
          GG: String(valueSource.GG ?? valueSource.gg ?? "")
        }
      };
    });
    return { sizes, rows, note: raw.note || DEFAULT_SIZE_TABLE.note };
  }

  return DEFAULT_SIZE_TABLE;
}

function renderSizeTable(product) {
  const container = document.getElementById("size-table-container");
  if (!container) return;

  const tableData = resolveSizeTable(product);
  const sizes = tableData.sizes;
  const rows = tableData.rows;
  const selectedSize = tamanhoSelecionado || sizes[0] || "";

  container.innerHTML = `
    <table class="size-table">
      <thead>
        <tr>
          <th>Medida</th>
          ${sizes.map((size) => `<th class="${size === selectedSize ? "highlight-col" : ""}">${escapeHtml(size)}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${rows.map((row) => `
          <tr>
            <th>${escapeHtml(row.label)}</th>
            ${sizes.map((size) => `<td class="${size === selectedSize ? "highlight-col" : ""}">${escapeHtml(row.values[size] || "-")}</td>`).join("")}
          </tr>
        `).join("")}
      </tbody>
    </table>
    <div class="size-table-note">${escapeHtml(tableData.note)}</div>
  `;
}

function closeAllAccordions() {
  document.querySelectorAll(".accordion-item.open").forEach((item) => {
    item.classList.remove("open");
    item.querySelector(".accordion-trigger")?.setAttribute("aria-expanded", "false");
  });
}

function toggleAccordion(id) {
  const target = document.getElementById(id);
  if (!target) return;
  const willOpen = !target.classList.contains("open");
  closeAllAccordions();
  if (willOpen) {
    target.classList.add("open");
    target.querySelector(".accordion-trigger")?.setAttribute("aria-expanded", "true");
  }
}

const __baseAddToCart = window.addToCart;
window.addToCart = function addToCartWithColor(productId, size = "", opts = {}) {
  const nextColor = typeof opts === "string" ? opts : opts?.color || corSelecionada;
  if (typeof __baseAddToCart === "function") {
    __baseAddToCart(productId, size, { color: nextColor });
  }
};

function selecionarTamanho(size) {
  tamanhoSelecionado = size;
  document.querySelectorAll("#size-chips-produto .size-chip").forEach((button) => {
    button.classList.toggle("active", button.textContent === size);
  });
  renderSizeTable(produtoAtual);
}

function renderTamanhos(sizes) {
  const wrapper = document.getElementById("size-picker-wrapper");
  const container = document.getElementById("size-chips-produto");
  if (!wrapper || !container) return;

  container.innerHTML = "";
  tamanhoSelecionado = "";
  tamanhosDisponiveis = sizes;

  if (!sizes.length) {
    wrapper.style.display = "none";
    renderSizeTable(produtoAtual);
    return;
  }

  wrapper.style.display = "";
  sizes.forEach((size) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "size-chip";
    btn.textContent = size;
    btn.addEventListener("click", () => selecionarTamanho(size));
    container.appendChild(btn);
  });

  selecionarTamanho(sizes[0]);
}

function bindProductActions() {
  const button = document.getElementById("btn-add-produto");
  button?.addEventListener("click", () => {
    if (!produtoAtual) return;
    if (tamanhosDisponiveis.length && !tamanhoSelecionado) return;
    if (typeof window.addToCart === "function") {
      window.addToCart(produtoAtual.id, tamanhoSelecionado, corSelecionada);
    }

    const original = button.innerHTML;
    button.innerHTML = "✓ Adicionado!";
    setTimeout(() => {
      button.innerHTML = original;
    }, 1800);
  });

  document.getElementById("foto-principal")?.addEventListener("click", () => openLightbox(0));

  document.querySelectorAll(".accordion-trigger").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const targetId = trigger.dataset.accordionTarget;
      if (targetId) toggleAccordion(targetId);
    });
  });

  document.addEventListener("keydown", (event) => {
    const lightbox = document.getElementById("lightbox");
    if (lightbox && lightbox.classList.contains("active")) {
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") lightboxNav(-1, event);
      if (event.key === "ArrowRight") lightboxNav(1, event);
    }
  });
}

async function carregarProduto() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id") || params.get("highlight");
  const preview = params.get("preview");

  let produto = null;
  let apiResolved = false;

  if (preview === "draft") {
    produto = getPreviewDraftProduct();
  }

  if (!produto && id) {
    try {
      const listResponse = await fetch(apiUrl("/api/products"));
      if (listResponse.ok) {
        const list = await readApiJson(listResponse);
        apiResolved = true;
        produto = Array.isArray(list)
          ? list.find((item) => String(item.id) === String(id)) || null
          : null;
      }
    } catch {
      // try detail endpoint below
    }
  }

  if (!produto && id) {
    try {
      const response = await fetch(apiUrl(`/api/products/${encodeURIComponent(id)}`));
      if (response.ok) {
        produto = await readApiJson(response);
        apiResolved = true;
      }
    } catch {
      // fallback local
    }
  }

  if (!produto && !apiResolved) {
    const fallbackProducts = getFallbackProducts();
    produto = fallbackProducts.find((item) => String(item.id) === String(id)) || null;
  }

  if (!produto && preview === "draft") {
    produto = getPreviewDraftProduct();
  }

  if (!produto) {
    window.location.href = "/loja/";
    return;
  }

  produtoAtual = produto;
  window.__activePreviewProduct = produtoAtual;

  document.title = `${produto.name} | BigSmoke`;
  document.getElementById("breadcrumb-category").textContent = produto.category || "Produto";
  document.getElementById("breadcrumb-name").textContent = produto.name || "Produto";
  document.getElementById("produto-categoria").textContent = produto.category || "";
  document.getElementById("produto-nome").textContent = produto.name || "";
  document.getElementById("produto-preco").textContent = `R$ ${Number(produto.price || 0).toFixed(2).replace(".", ",")}`;
  document.getElementById("smoke-tag").textContent = produto.badge || "BIGSMOKE";
  setDescription(produto.description);

  todasFotos = normalizeImageList(produto);
  if (!todasFotos.length) {
    todasFotos = ["../imagens/logo_sem_fundo.png"];
  }

  renderThumbs(todasFotos);
  trocarFoto(0);

  const sizes = String(produto.sizes || "")
    .split(",")
    .map((size) => size.trim())
    .filter(Boolean);
  renderTamanhos(sizes);
  const colors = parseProductColors(produto);
  renderColorPicker(colors);
  renderFabricList(produto);
  renderSizeTable(produto);
}

/* PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
   VARIAÇÕES DE COR - Produto
   PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP */
let colorsObjectMap = {};

const COLOR_HEX_MAP = {
  preta: "#1a1a1a",
  preto: "#1a1a1a",
  branca: "#f5f0e8",
  branco: "#f5f0e8",
  cinza: "#6e6e6e",
  grey: "#6e6e6e",
  gray: "#6e6e6e",
  vermelho: "#c0392b",
  azul: "#2980b9",
  verde: "#27ae60",
  amarelo: "#f1c40f",
  bege: "#c9b99a",
  marrom: "#7b5c3a",
  rosa: "#e91e8c",
  laranja: "#e67e22",
  vinho: "#7b1e2d",
  "off-white": "#f0ece0",
  "off white": "#f0ece0",
  "offwhite": "#f0ece0",
  lilás: "#9b59b6",
  lilas: "#9b59b6"
};

const DEFAULT_SIZE_TABLE_V2 = {
  headers: ["Medida (cm)", "P", "M", "G", "GG"],
  rows: [
    ["Comprimento", "70", "72", "74", "76"],
    ["Largura", "58", "60", "62", "64"],
    ["Ombro", "55", "57", "59", "61"],
    ["Manga", "23", "24", "25", "26"]
  ],
  note: "As medidas podem variar em até 2cm."
};

function normalizeColorKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function parseProductColors(product) {
  if (!product) return [];
  const raw = product.colors;

  if (Array.isArray(raw) && raw.length && typeof raw[0] === "object") {
    return raw
      .map((item) => ({
        name: String(item.name || "").trim(),
        hex: String(item.hex || COLOR_HEX_MAP[normalizeColorKey(item.name)] || "#888888").trim(),
        images: Array.isArray(item.images) ? item.images.map((url) => String(url || "").trim()).filter(Boolean) : [],
        stock: item.stock !== undefined && item.stock !== "" ? Number(item.stock) : undefined
      }))
      .filter((item) => item.name);
  }

  if (Array.isArray(raw)) {
    return raw
      .map((name) => String(name || "").trim())
      .filter(Boolean)
      .map((name) => ({
        name,
        hex: COLOR_HEX_MAP[normalizeColorKey(name)] || "#888888",
        images: [],
        stock: undefined
      }));
  }

  if (typeof raw === "string" && raw.trim()) {
    return raw.split(",").map((name) => String(name || "").trim()).filter(Boolean).map((name) => ({
      name,
      hex: COLOR_HEX_MAP[normalizeColorKey(name)] || "#888888",
      images: [],
      stock: undefined
    }));
  }

  return [];
}

function updateStockBadge(colorObj) {
  const badge = document.getElementById("color-stock-info");
  const addBtn = document.getElementById("btn-add-produto");
  if (!badge) return;

  badge.className = "color-stock-badge";
  const stock = colorObj?.stock;
  if (stock === undefined || stock === null || stock === "") {
    badge.textContent = "";
    if (addBtn) addBtn.disabled = false;
    return;
  }

  const amount = Number(stock);
  if (Number.isNaN(amount) || amount < 0) {
    badge.textContent = "";
    if (addBtn) addBtn.disabled = false;
    return;
  }

  if (amount <= 0) {
    badge.textContent = "Esgotado nesta cor";
    badge.classList.add("out");
    if (addBtn) addBtn.disabled = true;
    return;
  }

  if (amount <= 10) {
    badge.textContent = `Últimas ${amount} unidades`;
    badge.classList.add("low");
    if (addBtn) addBtn.disabled = false;
    return;
  }

  badge.textContent = "Em estoque";
  if (addBtn) addBtn.disabled = false;
}

function trocarGaleriaParaCor(colorObj) {
  if (!Array.isArray(colorObj?.images) || !colorObj.images.length) return;
  const principal = document.getElementById("foto-principal");
  if (!principal) return;

  principal.classList.add("switching");
  window.setTimeout(() => {
    todasFotos = colorObj.images.slice();
    renderThumbs(todasFotos);
    trocarFoto(0);
    principal.classList.remove("switching");
  }, 220);
}

function selectColorObject(name, colorObj, button) {
  corSelecionada = name;
  window.corSelecionada = corSelecionada;
  const nameEl = document.getElementById("color-selected-name");
  if (nameEl) nameEl.textContent = name;

  document.querySelectorAll("#color-chips-produto .color-chip").forEach((chip) => chip.classList.remove("active"));
  button.classList.add("active");
  trocarGaleriaParaCor(colorObj);
  updateStockBadge(colorObj);
}

function renderColorPicker(colors) {
  const wrapper = document.getElementById("color-picker-wrapper");
  const chips = document.getElementById("color-chips-produto");
  const nameEl = document.getElementById("color-selected-name");
  if (!wrapper || !chips || !nameEl) return;

  colorsObjectMap = {};
  chips.innerHTML = "";

  const list = Array.isArray(colors) ? colors.filter(Boolean) : parseProductColors(produtoAtual);
  if (!list.length) {
    wrapper.style.display = "none";
    return;
  }

  wrapper.style.display = "";
  list.forEach((colorObj, index) => {
    const name = String(colorObj.name || `Cor ${index + 1}`).trim();
    const hex = String(colorObj.hex || COLOR_HEX_MAP[normalizeColorKey(name)] || "#888888").trim();
    const stock = colorObj.stock !== undefined ? Number(colorObj.stock) : undefined;
    const normalized = { ...colorObj, name, hex, stock };
    colorsObjectMap[name] = normalized;

    const button = document.createElement("button");
    button.type = "button";
    button.className = `color-chip${stock === 0 ? " esgotado" : ""}`;
    button.setAttribute("aria-label", name);
    button.setAttribute("title", name);
    button.setAttribute("aria-pressed", "false");
    button.innerHTML = `<span class="color-chip-swatch" style="background:${hex};border:2px solid rgba(255,255,255,${hex === "#f5f0e8" || hex === "#f0ece0" || hex === "#ffffff" ? 0.3 : 0.08})"></span>`;
    button.addEventListener("click", () => {
      if (stock === 0) return;
      selectColorObject(name, normalized, button);
    });

    chips.appendChild(button);

    if (index === 0) {
      selectColorObject(name, normalized, button);
    }
  });
}

function renderFabricList(product) {
  const container = document.getElementById("fabric-list");
  if (!container) return;

  const src = product?.fabric || product?.material || product?.details;
  let items = [];
  if (Array.isArray(src)) {
    items = src.map((value) => String(value || "").trim()).filter(Boolean);
  } else if (typeof src === "string" && src.trim()) {
    items = src.split(/[;\n"]/).map((value) => value.trim()).filter(Boolean);
  } else {
    items = [
      "Oversized",
      "100% Algodão Premium",
      "Gola Reforçada",
      "Estampa Alta Qualidade",
      "Bordado Premium"
    ];
  }

  container.innerHTML = items.map((item) => `<div class="fabric-item">${escapeHtml(item)}</div>`).join("");
}

function renderSizeTable(product) {
  const container = document.getElementById("size-table-container");
  if (!container) return;

  const table = product?.sizeTable || DEFAULT_SIZE_TABLE_V2;
  const headers = Array.isArray(table.headers) && table.headers.length ? table.headers : DEFAULT_SIZE_TABLE_V2.headers;
  const rows = Array.isArray(table.rows) && table.rows.length ? table.rows : DEFAULT_SIZE_TABLE_V2.rows;
  const selected = String(tamanhoSelecionado || "").trim().toUpperCase();
  const highlightIndex = headers.findIndex((header) => String(header).trim().toUpperCase() === selected);

  container.innerHTML = `
    <div class="size-table-wrap">
      <table class="size-table">
        <thead>
          <tr>${headers.map((header, index) => `<th${index === highlightIndex ? ' class="highlight-col"' : ''}>${escapeHtml(header)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              ${row.map((cell, index) => `<td${index === highlightIndex && index > 0 ? ' class="highlight-col"' : ''}>${escapeHtml(cell)}</td>`).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
      <p class="size-table-note">${escapeHtml(table.note || DEFAULT_SIZE_TABLE_V2.note)}</p>
    </div>
  `;
}

function closeAllAccordions() {
  document.querySelectorAll(".accordion-item.open").forEach((item) => {
    item.classList.remove("open");
    item.querySelector(".accordion-trigger")?.setAttribute("aria-expanded", "false");
  });
}

function toggleAccordion(id) {
  const item = document.getElementById(id);
  if (!item) return;
  const isOpen = item.classList.contains("open");
  closeAllAccordions();
  if (!isOpen) {
    item.classList.add("open");
    item.querySelector(".accordion-trigger")?.setAttribute("aria-expanded", "true");
  }
}

const _origRenderTamanhos = renderTamanhos;
renderTamanhos = function (sizes) {
  const wrapper = document.getElementById("size-picker-wrapper");
  const container = document.getElementById("size-chips-produto");
  if (!wrapper || !container) return;

  container.innerHTML = "";
  tamanhoSelecionado = "";
  tamanhosDisponiveis = sizes;

  if (!sizes.length) {
    wrapper.style.display = "none";
    renderSizeTable(produtoAtual);
    return;
  }

  wrapper.style.display = "";
  sizes.forEach((size) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "size-chip";
    btn.textContent = size;
    btn.addEventListener("click", () => {
      selecionarTamanho(size);
      renderSizeTable(produtoAtual);
    });
    container.appendChild(btn);
  });

  selecionarTamanho(sizes[0]);
  renderSizeTable(produtoAtual);
};

const _origBindProductActions = bindProductActions;
bindProductActions = function () {
  _origBindProductActions();
  const button = document.getElementById("btn-add-produto");
  if (!button) return;

  button.replaceWith(button.cloneNode(true));
  const freshButton = document.getElementById("btn-add-produto");
  freshButton?.addEventListener("click", () => {
    if (!produtoAtual) return;
    if (tamanhosDisponiveis.length && !tamanhoSelecionado) return;
    if (typeof addToCart === "function") {
      addToCart(produtoAtual.id, tamanhoSelecionado, { color: corSelecionada || "" });
    }

    const original = freshButton.innerHTML;
    freshButton.innerHTML = "✓ Adicionado!";
    window.setTimeout(() => {
      freshButton.innerHTML = original;
    }, 1800);
  });
};

const _origCarregarProduto = carregarProduto;
carregarProduto = async function () {
  await _origCarregarProduto();
  if (!produtoAtual) return;
  const colors = parseProductColors(produtoAtual);
  renderColorPicker(colors);
  renderFabricList(produtoAtual);
  renderSizeTable(produtoAtual);
};

window.toggleAccordion = toggleAccordion;
