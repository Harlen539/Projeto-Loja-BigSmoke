const STORAGE_KEYS = {
  cart: "bigsmoke-cart"
};

const DEFAULT_CONFIG = {
  stripeConfigured: false,
  whatsappNumber: "5583986494691",
  store: {
    city: "Fortaleza",
    state: "CE",
    originCep: "60000000"
  }
};

const FALLBACK_PRODUCTS = [
  {
    id: "moletom-classic",
    name: "Moletom Classic BigSmoke",
    category: "Moletons",
    description: "Peça premium para dias frios, pronta para campanha e venda assistida.",
    price: 249.9,
    image: "https://placehold.co/900x1200/141414/F5F0E8?text=Moletom+Classic",
    sizes: "M, G, GG",
    badge: "Mais pedido",
    active: true,
    featured: true
  }
];

const PLACEHOLDER_IMAGE = "https://placehold.co/900x1200/111111/F5F0E8?text=BigSmoke+Drop";
const NORTHEAST_STATES = ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"];
const NORTH_STATES = ["AC", "AM", "AP", "PA", "RO", "RR", "TO"];
const FREE_SHIPPING_CITIES = new Set(["joao pessoa", "joão pessoa", "bayeux", "cabedelo"]);
const ORDER_STATUS_FLOW = ["pending", "paid", "processing", "shipped", "delivered"];
const TRACKING_SECTION_ID = "meus-pedidos";
const TRACKING_RESULT_ID = "order-tracking-result";
const TRACKING_FORM_ID = "order-tracking-form";
const TRACKING_INPUT_ID = "order-tracking-input";
const LOCAL_PRODUCTS_KEY = "bigsmoke-local-products";
const LEGACY_LOCAL_PRODUCTS_KEY = "bigsmoke-custom-products";
const LOCALE_KEY = "bigsmoke-language";
const REMOVED_PRODUCT_IDS = new Set(["camiseta-oversized"]);
let apiBaseUrl = "";

const LOCALES = {
  pt: {
    lang: "pt-BR",
    ticker: ["Frete para todo o Brasil", "Cartão via Stripe", "Streetwear autoral BigSmoke", "Atendimento direto pelo WhatsApp"],
    nav: ["Drops", "Marca", "Meus pedidos", "Contato", "Privacidade"],
    heroEyebrow: "BigSmoke Streetwear",
    heroTitle: "Streetwear com presença, contraste e assinatura própria.",
    heroSubtitle: "BigSmoke não é só roupa. É presença, movimento e identidade pra quem vive a rua e transforma atitude em assinatura.",
    heroPrimary: "Ver catálogo",
    heroSecondary: "Falar com a marca",
    heroStats: [["Brasil", "Atendimento online"], ["Stripe", "Checkout seguro e profissional"], ["Assinatura própria", "Visual pensado para carregar a identidade BigSmoke"]],
    trustStrong: ["Rua e cultura", "Comunidade", "Drop constante"],
    trustSpan: ["Peças que carregam atitude e presença", "Quem veste BigSmoke representa um movimento", "Novas peças, novas histórias, mesma identidade"],
    quickKicker: "Comprar rápido",
    quickTitle: "Navegue por categoria, busque uma peça e feche o pedido sem perder tempo.",
    quickButtons: ["Ver todos os produtos", "Buscar produto", "Abrir carrinho"],
    productsKicker: "Drops em destaque",
    productsTitle: "Catálogo inicial da BigSmoke",
    searchPlaceholder: "Buscar por nome, categoria ou descrição",
    aboutKicker: "Manifesto",
    aboutTitle: "BigSmoke é mais que uma marca. É uma comunidade.",
    aboutText: "De quem vive a rua, respira música e transforma presença em identidade. De quem não espera oportunidade, cria.",
    aboutPanelLabels: ["Rua", "Música", "Movimento"],
    aboutPanelTitles: ["Presença acima de tudo", "Ritmo que veste", "Quem veste, representa"],
    aboutPanelTexts: [
      "Peças pensadas para entrar na cena com força, personalidade e leitura imediata.",
      "A energia da rua e da música aparece no corte, no peso visual e na atitude da coleção.",
      "Se você veste BigSmoke, você não está seguindo. Você está representando."
    ],
    contactKicker: "Contato oficial",
    contactTitle: "Bem-vindo ao movimento.",
    contactText: "Atendimento, lista VIP, novidades e próximos drops da BigSmoke passam por aqui.",
    contactButton: "Chamar no WhatsApp",
    faqKicker: "Perguntas frequentes",
    faqTitle: "Dúvidas que aparecem antes de fechar o drop.",
    faqText: "Respostas rápidas para compra, troca, entrega e contato com a marca.",
    faqQuestions: [
      "Como faço meu pedido?",
      "Posso falar com vocês antes de comprar?",
      "Vocês enviam para todo o Brasil?",
      "Tem troca ou ajuste de tamanho?"
    ],
    faqAnswers: [
      "Escolha as peças, adicione ao carrinho e finalize no checkout seguro da BigSmoke.",
      "Sim. O Instagram e o WhatsApp da loja ficam disponíveis no rodapé e no contato oficial.",
      "Sim. O site calcula frete e entrega com base no CEP informado durante o checkout.",
      "Sim, a troca segue a política da loja e pode ser alinhada pelos canais oficiais de atendimento."
    ],
    cartKicker: "Pedido",
    cartTitle: "Carrinho BigSmoke",
    cartLabel: "Carrinho",
    cartTotal: "Total",
    checkoutButton: "Finalizar compra",
    checkoutTitle: "Finalizar compra",
    checkoutKicker: "Checkout",
    deliveryTitle: "Entrega",
    deliveryPickup: "Retirada",
    deliveryPickupSmall: "Sem frete",
    deliveryLocal: "Entrega local",
    deliveryLocalSmall: "Estimativa por CEP",
    deliveryNational: "Envio nacional",
    deliveryNationalSmall: "Estimativa por região",
    lookupCep: "Buscar CEP",
    useLocation: "Usar minha localização",
    locationIdle: "Informe um CEP para calcular a entrega.",
    locationSearching: "Buscando endereço e recalculando entrega...",
    locationInvalid: "Informe um CEP válido com 8 dígitos.",
    locationSuccessPickup: "Retirada selecionada. Sem custo de frete.",
    locationSuccessBase: (label, price) => `${label}. Frete estimado: ${price}.`,
    locationSuccessHint: (price) => `Frete estimado: ${price}. Informe um CEP para melhorar o cálculo.`,
    summaryTitle: "Resumo do pedido",
    subtotal: "Subtotal",
    shipping: "Frete",
    totalFinal: "Total final",
    payButton: "Pagamento",
    checkoutNoteReady: "Você será redirecionado para o Stripe Checkout. O frete é recalculado no servidor antes da cobrança.",
    checkoutNoteConfig: "Configure STRIPE_SECRET_KEY no backend para habilitar o checkout seguro do Stripe.",
    addToCart: "Adicionar ao carrinho",
    completeProduct: "Completar cadastro",
    noResultsKicker: "Sem resultado",
    noResultsTitle: "Nenhuma peça encontrada",
    noResultsText: "Tente outra busca ou troque a categoria para ver mais produtos.",
    priceTbd: "Preço a definir",
    sizesSoon: "Tamanhos em breve",
    newDrop: "Nova peça em preparação para o próximo drop.",
    cardDefaultBadge: "BigSmoke",
    cartEmpty: "Nenhuma peça adicionada ainda.",
    orderSuccessTitle: "Pedido confirmado",
    orderSuccessText: "Seu pagamento foi recebido. Clique abaixo para enviar os detalhes do pedido no WhatsApp da loja.",
    orderSuccessBtn: "Enviar pedido no WhatsApp",
    orderSuccessBack: "Voltar para a loja",
    orderSuccessTotal: "Total",
    orderReturn: "Pagamento",
    paymentButtonLabel: "Pagamento"
  },
  en: {
    lang: "en",
    ticker: ["Shipping across Brazil", "Stripe card checkout", "Original BigSmoke streetwear", "Direct WhatsApp support"],
    nav: ["Drops", "Brand", "My orders", "Contact", "Privacy"],
    heroEyebrow: "BigSmoke Streetwear",
    heroTitle: "Streetwear with presence, contrast, and its own signature.",
    heroSubtitle: "BigSmoke is more than clothing. It is presence, movement, and identity for people who live the street and turn attitude into signature.",
    heroPrimary: "View catalog",
    heroSecondary: "Talk to the brand",
    heroStats: [["Brazil", "Online support"], ["Stripe", "Secure professional checkout"], ["Own signature", "A visual built to carry BigSmoke identity"]],
    trustStrong: ["Street & culture", "Community", "Constant drop"],
    trustSpan: ["Pieces that carry attitude and presence", "Whoever wears BigSmoke represents a movement", "New pieces, new stories, same identity"],
    quickKicker: "Quick buy",
    quickTitle: "Browse by category, search for a piece, and check out without wasting time.",
    quickButtons: ["View all products", "Search product", "Open cart"],
    productsKicker: "Featured drops",
    productsTitle: "BigSmoke initial catalog",
    searchPlaceholder: "Search by name, category, or description",
    aboutKicker: "Manifesto",
    aboutTitle: "BigSmoke is more than a brand. It is a community.",
    aboutText: "From people who live the street, breathe music, and turn presence into identity. From people who do not wait for opportunity - they create it.",
    aboutPanelLabels: ["Street", "Music", "Movement"],
    aboutPanelTitles: ["Presence above all", "Rhythm you can wear", "If you wear it, you represent it"],
    aboutPanelTexts: [
      "Pieces designed to enter the scene with force, personality, and instant recognition.",
      "The energy of the street and music appears in the cut, the visual weight, and the collection's attitude.",
      "If you wear BigSmoke, you are not following. You are representing."
    ],
    contactKicker: "Official contact",
    contactTitle: "Welcome to the movement.",
    contactText: "Support, VIP lists, news, and upcoming BigSmoke drops all pass through here.",
    contactButton: "Chat on WhatsApp",
    faqKicker: "Frequently asked questions",
    faqTitle: "Questions that show up before closing the drop.",
    faqText: "Quick answers for shopping, exchanges, shipping, and brand contact.",
    faqQuestions: [
      "How do I place my order?",
      "Can I talk to you before buying?",
      "Do you ship across Brazil?",
      "Is there exchange or size adjustment?"
    ],
    faqAnswers: [
      "Choose the pieces, add them to your cart, and finish at BigSmoke's secure checkout.",
      "Yes. Instagram and WhatsApp are available in the footer and the official contact section.",
      "Yes. The site calculates shipping based on the ZIP code entered during checkout.",
      "Yes, exchanges follow the store policy and can be arranged through the official support channels."
    ],
    cartKicker: "Order",
    cartTitle: "BigSmoke cart",
    cartLabel: "Cart",
    cartTotal: "Total",
    checkoutButton: "Checkout",
    checkoutTitle: "Checkout",
    checkoutKicker: "Checkout",
    deliveryTitle: "Delivery",
    deliveryPickup: "Pickup",
    deliveryPickupSmall: "No shipping fee",
    deliveryLocal: "Local delivery",
    deliveryLocalSmall: "Estimate by ZIP code",
    deliveryNational: "National shipping",
    deliveryNationalSmall: "Region-based estimate",
    lookupCep: "Search ZIP code",
    useLocation: "Use my location",
    locationIdle: "Enter a ZIP code to calculate delivery.",
    locationSearching: "Looking up address and recalculating shipping...",
    locationInvalid: "Enter a valid ZIP code with 8 digits.",
    locationSuccessPickup: "Pickup selected. No shipping fee.",
    locationSuccessBase: (label, price) => `${label}. Estimated shipping: ${price}.`,
    locationSuccessHint: (price) => `Estimated shipping: ${price}. Enter a ZIP code to improve the estimate.`,
    summaryTitle: "Order summary",
    subtotal: "Subtotal",
    shipping: "Shipping",
    totalFinal: "Final total",
    payButton: "Payment",
    checkoutNoteReady: "You'll be redirected to Stripe Checkout. Shipping is recalculated on the server before payment.",
    checkoutNoteConfig: "Set STRIPE_SECRET_KEY in the backend to enable secure Stripe checkout.",
    addToCart: "Add to cart",
    completeProduct: "Complete listing",
    noResultsKicker: "No results",
    noResultsTitle: "No item found",
    noResultsText: "Try another search or switch category to see more products.",
    priceTbd: "Price to define",
    sizesSoon: "Sizes coming soon",
    newDrop: "New piece in preparation for the next drop.",
    cardDefaultBadge: "BigSmoke",
    cartEmpty: "No pieces added yet.",
    orderSuccessTitle: "Order confirmed",
    orderSuccessText: "Your payment has been received. Click below to send the order details to the store's WhatsApp.",
    orderSuccessBtn: "Send order on WhatsApp",
    orderSuccessBack: "Back to store",
    orderSuccessTotal: "Total",
    orderReturn: "Payment",
    paymentButtonLabel: "Payment"
  },
  es: {
    lang: "es",
    ticker: ["Envío a todo Brasil", "Pago con Stripe", "Streetwear original BigSmoke", "Atención directa por WhatsApp"],
    nav: ["Drops", "Marca", "Mis pedidos", "Contacto", "Privacidad"],
    heroEyebrow: "BigSmoke Streetwear",
    heroTitle: "Streetwear con presencia, contraste y firma propia.",
    heroSubtitle: "BigSmoke no es solo ropa. Es presencia, movimiento e identidad para quienes viven la calle y convierten actitud en firma.",
    heroPrimary: "Ver catálogo",
    heroSecondary: "Hablar con la marca",
    heroStats: [["Brasil", "Atención online"], ["Stripe", "Checkout seguro y profesional"], ["Firma propia", "Un visual pensado para llevar la identidad BigSmoke"]],
    trustStrong: ["Calle y cultura", "Comunidad", "Drop constante"],
    trustSpan: ["Prendas que cargan actitud y presencia", "Quien viste BigSmoke representa un movimiento", "Nuevas piezas, nuevas historias, misma identidad"],
    quickKicker: "Compra rápida",
    quickTitle: "Navega por categoría, busca una prenda y finaliza sin perder tiempo.",
    quickButtons: ["Ver todos los productos", "Buscar producto", "Abrir carrito"],
    productsKicker: "Drops destacados",
    productsTitle: "Catálogo inicial de BigSmoke",
    searchPlaceholder: "Buscar por nombre, categoría o descripción",
    aboutKicker: "Manifiesto",
    aboutTitle: "BigSmoke es más que una marca. Es una comunidad.",
    aboutText: "De quienes viven la calle, respiran música y transforman presencia en identidad. De quienes no esperan oportunidades, las crean.",
    aboutPanelLabels: ["Calle", "Música", "Movimiento"],
    aboutPanelTitles: ["Presencia ante todo", "Ritmo que se viste", "Si lo vistes, lo representas"],
    aboutPanelTexts: [
      "Prendas pensadas para entrar a la escena con fuerza, personalidad y lectura inmediata.",
      "La energía de la calle y la música aparece en el corte, el peso visual y la actitud de la colección.",
      "Si vistes BigSmoke, no estás siguiendo. Estás representando."
    ],
    contactKicker: "Contacto oficial",
    contactTitle: "Bienvenido al movimiento.",
    contactText: "Atención, lista VIP, novedades y próximos drops de BigSmoke pasan por aquí.",
    contactButton: "Hablar por WhatsApp",
    faqKicker: "Preguntas frecuentes",
    faqTitle: "Dudas que aparecen antes de cerrar el drop.",
    faqText: "Respuestas rápidas sobre compra, cambios, envío y contacto con la marca.",
    faqQuestions: [
      "¿Cómo hago mi pedido?",
      "¿Puedo hablar con ustedes antes de comprar?",
      "¿Envían a todo Brasil?",
      "¿Hay cambio o ajuste de talla?"
    ],
    faqAnswers: [
      "Elige las prendas, agrégalas al carrito y finaliza en el checkout seguro de BigSmoke.",
      "Sí. Instagram y WhatsApp están disponibles en el pie de página y en contacto oficial.",
      "Sí. El sitio calcula el envío según el CEP ingresado durante el checkout.",
      "Sí, los cambios siguen la política de la tienda y pueden coordinarse por los canales oficiales."
    ],
    cartKicker: "Pedido",
    cartTitle: "Carrito BigSmoke",
    cartLabel: "Carrito",
    cartTotal: "Total",
    checkoutButton: "Finalizar compra",
    checkoutTitle: "Finalizar compra",
    checkoutKicker: "Checkout",
    deliveryTitle: "Entrega",
    deliveryPickup: "Retiro",
    deliveryPickupSmall: "Sin costo de envío",
    deliveryLocal: "Entrega local",
    deliveryLocalSmall: "Estimación por CEP",
    deliveryNational: "Envío nacional",
    deliveryNationalSmall: "Estimación por región",
    lookupCep: "Buscar CEP",
    useLocation: "Usar mi ubicación",
    locationIdle: "Ingresa un CEP para calcular la entrega.",
    locationSearching: "Buscando dirección y recalculando el envío...",
    locationInvalid: "Ingresa un CEP válido con 8 dígitos.",
    locationSuccessPickup: "Retiro seleccionado. Sin costo de envío.",
    locationSuccessBase: (label, price) => `${label}. Envío estimado: ${price}.`,
    locationSuccessHint: (price) => `Envío estimado: ${price}. Ingresa un CEP para mejorar el cálculo.`,
    summaryTitle: "Resumen del pedido",
    subtotal: "Subtotal",
    shipping: "Envío",
    totalFinal: "Total final",
    payButton: "Pago",
    checkoutNoteReady: "Serás redirigido al Stripe Checkout. El envío se recalcula en el servidor antes del cobro.",
    checkoutNoteConfig: "Configura STRIPE_SECRET_KEY en el backend para habilitar el checkout seguro de Stripe.",
    addToCart: "Agregar al carrito",
    completeProduct: "Completar ficha",
    noResultsKicker: "Sin resultados",
    noResultsTitle: "No se encontró ninguna prenda",
    noResultsText: "Prueba otra búsqueda o cambia la categoría para ver más productos.",
    priceTbd: "Precio por definir",
    sizesSoon: "Tallas pronto",
    newDrop: "Nueva pieza en preparación para el próximo drop.",
    cardDefaultBadge: "BigSmoke",
    cartEmpty: "Aún no se agregó ninguna pieza.",
    orderSuccessTitle: "Pedido confirmado",
    orderSuccessText: "Tu pago fue recibido. Haz clic abajo para enviar los detalles del pedido por WhatsApp.",
    orderSuccessBtn: "Enviar pedido por WhatsApp",
    orderSuccessBack: "Volver a la tienda",
    orderSuccessTotal: "Total",
    orderReturn: "Pago",
    paymentButtonLabel: "Pago"
  }
};

let appConfig = { ...DEFAULT_CONFIG };
let products = [...FALLBACK_PRODUCTS];
let cart = normalizeCartItems(loadStorage(STORAGE_KEYS.cart, []));
let currentLocale = localStorage.getItem(LOCALE_KEY) || "pt";
let activeCategory = "Todos";
let searchTerm = "";
let highlightedProductId = "";
let shouldScrollToHighlight = false;
let orderSuccessData = null;
const selectedProductSizes = new Map();
let shippingState = {
  price: 0,
  label: "Retirada",
  cepData: null,
  coords: null
};

function loadStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function parseProductSizes(product) {
  return String(product?.sizes || "")
    .split(",")
    .map((size) => size.trim())
    .filter(Boolean);
}

function getDefaultProductSize(product) {
  return parseProductSizes(product)[0] || "";
}

function buildCartKey(productId, size) {
  return `${productId}::${size || "unico"}`;
}

function resolveProductById(productId) {
  const normalizedId = String(productId || "");
  const storeProduct = products.find((entry) => String(entry.id) === normalizedId);
  if (storeProduct) return storeProduct;

  const previewProduct = window.__activePreviewProduct;
  if (previewProduct && String(previewProduct.id) === normalizedId) {
    return previewProduct;
  }

  return null;
}

function normalizeCartItems(items) {
  if (!Array.isArray(items)) return [];

  const normalized = [];
  const seen = new Map();

  items.forEach((item) => {
    const productId = item.productId || item.id;
    const product = resolveProductById(productId);
    const size = item.size || item.tamanho || getDefaultProductSize(product);
    const cartKey = item.cartKey || buildCartKey(productId, size);
    const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
    const nextItem = {
      cartKey,
      productId,
      id: productId,
      name: item.name || product?.name || "",
      price: Number(item.price) || Number(product?.price) || 0,
      quantity,
      category: item.category || product?.category || "",
      size: size || ""
    };

    const existing = seen.get(cartKey);
    if (existing) {
      existing.quantity += nextItem.quantity;
    } else {
      seen.set(cartKey, nextItem);
      normalized.push(nextItem);
    }
  });

  return normalized;
}

function getLocaleData(locale = currentLocale) {
  return LOCALES[locale] || LOCALES.pt;
}

function t(key, ...args) {
  const copy = getLocaleData();
  const value = copy[key] ?? LOCALES.pt[key];
  return typeof value === "function" ? value(...args) : value ?? key;
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) {
    element.textContent = value;
  }
}

function setAllText(selector, values) {
  const elements = document.querySelectorAll(selector);
  elements.forEach((element, index) => {
    if (values[index] !== undefined) {
      element.textContent = values[index];
    }
  });
}

function setAllPlaceholder(selector, value) {
  document.querySelectorAll(selector).forEach((element) => {
    element.placeholder = value;
  });
}

function getLanguageFlag(locale) {
  const flags = {
    pt: "/imagens/bandeira_BRA.jpg",
    en: "/imagens/bandeira_EUA.jpg",
    es: "/imagens/bandeira_ESP.png"
  };
  return flags[locale] || flags.pt;
}

function closeLanguageMenu() {
  const menu = document.getElementById("language-menu");
  const toggle = document.getElementById("language-toggle");
  if (menu) menu.hidden = true;
  if (toggle) toggle.setAttribute("aria-expanded", "false");
}

function openLanguageMenu() {
  const menu = document.getElementById("language-menu");
  const toggle = document.getElementById("language-toggle");
  if (menu) menu.hidden = false;
  if (toggle) toggle.setAttribute("aria-expanded", "true");
}

function toggleLanguageMenu() {
  const menu = document.getElementById("language-menu");
  if (!menu) return;
  if (menu.hidden) openLanguageMenu();
  else closeLanguageMenu();
}

function syncLanguageSwitcher(locale) {
  const currentFlag = document.getElementById("language-current-flag");
  if (currentFlag) {
    currentFlag.src = getLanguageFlag(locale);
  }

  document.querySelectorAll("[data-locale-option]").forEach((button) => {
    const isActive = button.dataset.localeOption === locale;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function applyLocale(locale) {
  currentLocale = LOCALES[locale] ? locale : "pt";
  saveStorage(LOCALE_KEY, currentLocale);

  const copy = getLocaleData();
  document.documentElement.lang = copy.lang;

  setAllText(".top-ticker span", copy.ticker);

  const navLinks = document.querySelectorAll(".nav-links a");
  if (isTrackingPage()) {
    const trackingNav = currentLocale === "en"
      ? ["Store", "My orders", "Privacy"]
      : currentLocale === "es"
        ? ["Tienda", "Mis pedidos", "Privacidad"]
        : ["Loja", "Meus pedidos", "Privacidade"];
    setAllText(".nav-links a", trackingNav);
  } else {
    setAllText(".nav-links a", copy.nav);
  }
  setText(".hero .eyebrow", copy.heroEyebrow);
  setText(".hero h1", copy.heroTitle);
  setText(".hero-subtitle", copy.heroSubtitle);
  setText(".hero .btn-primary", copy.heroPrimary);
  setText(".hero .btn-outline", copy.heroSecondary);
  setAllText(".hero-stats strong", copy.heroStats.map((item) => item[0]));
  setAllText(".hero-stats span", copy.heroStats.map((item) => item[1]));

  setAllText(".trust-bar strong", copy.trustStrong);
  setAllText(".trust-bar span", copy.trustSpan);

  setText(".shop-nav-copy .section-kicker", copy.quickKicker);
  setText(".shop-nav-copy h2", copy.quickTitle);
  const navChips = document.querySelectorAll(".shop-nav-actions .nav-chip");
  if (navChips[0]) navChips[0].textContent = copy.quickButtons[0];
  if (navChips[1]) navChips[1].textContent = copy.quickButtons[1];
  if (navChips[2]) navChips[2].textContent = copy.quickButtons[2];

  setText("#products .section-kicker", copy.productsKicker);
  setText("#products .section-heading h2", copy.productsTitle);
  setAllPlaceholder("#product-search", copy.searchPlaceholder);

  setText("#about .section-kicker", copy.aboutKicker);
  setText("#about .split-heading h2", copy.aboutTitle);
  const aboutLead = document.querySelector("#about .split-heading p");
  if (aboutLead) aboutLead.textContent = copy.aboutText;
  setAllText(".about-panels .panel-label", copy.aboutPanelLabels);
  setAllText(".about-panels h3", copy.aboutPanelTitles);
  setAllText(".about-panels .info-panel p", copy.aboutPanelTexts);

  setText("#contact .section-kicker", copy.contactKicker);
  setText("#contact h2", copy.contactTitle);
  setText("#contact .contact-text", copy.contactText);
  setText("#contact .contact-actions .btn-primary", copy.contactButton);
  const contactLink = document.querySelector("#contact .contact-actions .contact-link:last-child");
  if (contactLink) contactLink.textContent = "@bigsmokestyle";

  setText("#faq .section-kicker", copy.faqKicker);
  setText("#faq .split-heading h2", copy.faqTitle);
  const faqLead = document.querySelector("#faq .split-heading p");
  if (faqLead) faqLead.textContent = copy.faqText;
  document.querySelectorAll("#faq .faq-item summary").forEach((summary, index) => {
    summary.textContent = copy.faqQuestions[index] || summary.textContent;
  });
  document.querySelectorAll("#faq .faq-item p").forEach((paragraph, index) => {
    paragraph.textContent = copy.faqAnswers[index] || paragraph.textContent;
  });

  const footerColumns = document.querySelectorAll(".site-footer-column");
  setText(".site-footer-brand span", currentLocale === "en"
    ? "Authentic streetwear built to grow."
    : currentLocale === "es"
      ? "Streetwear auténtico con estructura lista para crecer."
      : "Streetwear autêntico com estrutura pronta para crescer.");
  if (footerColumns[0]) {
    const links = footerColumns[0].querySelectorAll("a");
    if (isTrackingPage()) {
      footerColumns[0].querySelector("strong").textContent = currentLocale === "pt" ? "Atalhos" : currentLocale === "es" ? "Accesos" : "Shortcuts";
      if (links[0]) links[0].textContent = currentLocale === "pt" ? "Loja" : currentLocale === "es" ? "Tienda" : "Store";
      if (links[1]) links[1].textContent = currentLocale === "pt" ? "Meus pedidos" : currentLocale === "es" ? "Mis pedidos" : "My orders";
      if (links[2]) links[2].textContent = currentLocale === "pt" ? "Política de Privacidade & Trocas" : currentLocale === "es" ? "Política de privacidad y cambios" : "Privacy & exchange policy";
    } else {
      footerColumns[0].querySelector("strong").textContent = currentLocale === "pt" ? "Quem somos?" : currentLocale === "es" ? "Quiénes somos?" : "Who are we?";
      if (links[0]) links[0].textContent = currentLocale === "pt" ? "Manifesto da marca" : currentLocale === "es" ? "Manifiesto de la marca" : "Brand manifesto";
      if (links[1]) links[1].textContent = currentLocale === "pt" ? "Fale com a BigSmoke" : currentLocale === "es" ? "Habla con BigSmoke" : "Talk to BigSmoke";
      if (links[2]) links[2].textContent = currentLocale === "pt" ? "Meus pedidos" : currentLocale === "es" ? "Mis pedidos" : "My orders";
    }
  }
  if (footerColumns[1]) {
    footerColumns[1].querySelector("strong").textContent = currentLocale === "pt" ? "Redes sociais" : currentLocale === "es" ? "Redes sociales" : "Social networks";
  }
  setText(".cart .section-kicker", copy.cartKicker);
  setText(".cart h2", copy.cartTitle);
  setText(".cart .total-section span:first-child", copy.cartTotal);
  setText("#checkout-button", copy.checkoutButton);
  setText("#whatsapp", copy.cartLabel ? "WhatsApp" : "WhatsApp");
  setText(".checkout-modal .section-kicker", copy.checkoutKicker);
  setText(".checkout-modal h2", copy.checkoutTitle);
  setText(".checkout-panel h3", copy.deliveryTitle);
  const deliveryCards = document.querySelectorAll(".delivery-methods .option-card");
  if (deliveryCards[0]) {
    deliveryCards[0].querySelector("span").textContent = copy.deliveryPickup;
    deliveryCards[0].querySelector("small").textContent = copy.deliveryPickupSmall;
  }
  if (deliveryCards[1]) {
    deliveryCards[1].querySelector("span").textContent = copy.deliveryLocal;
    deliveryCards[1].querySelector("small").textContent = copy.deliveryLocalSmall;
  }
  if (deliveryCards[2]) {
    deliveryCards[2].querySelector("span").textContent = copy.deliveryNational;
    deliveryCards[2].querySelector("small").textContent = copy.deliveryNationalSmall;
  }
  setText("#lookup-cep", copy.lookupCep);
  setText("#use-location", copy.useLocation);
  setText("#location-status", copy.locationIdle);
  setText(".checkout-summary h3", copy.summaryTitle);
  const summarySpans = document.querySelectorAll(".checkout-summary .summary-line span");
  if (summarySpans[0]) summarySpans[0].textContent = copy.subtotal;
  if (summarySpans[1]) summarySpans[1].textContent = copy.shipping;
  if (summarySpans[2]) summarySpans[2].textContent = copy.totalFinal;
  setText("#confirm-checkout", copy.payButton);
  setText("#checkout-note", appConfig.stripeConfigured ? copy.checkoutNoteReady : copy.checkoutNoteConfig);
  setText(".empty-cart", copy.cartEmpty);

  syncLanguageSwitcher(currentLocale);

  renderCategoryFilters();
  renderProducts();
  updateCartUI();
  updateCheckoutSummary();
}

function loadLocalProducts() {
  const current = getStoredProducts();
  return Array.isArray(current)
    ? current.filter((product) => !REMOVED_PRODUCT_IDS.has(String(product?.id || "").trim()))
    : [];
}

function getStoredProducts() {
  try {
    const next = localStorage.getItem(LOCAL_PRODUCTS_KEY) || localStorage.getItem(LEGACY_LOCAL_PRODUCTS_KEY);
    return next ? JSON.parse(next) : [];
  } catch {
    return [];
  }
}

function mergeProducts(baseProducts, extraProducts) {
  const map = new Map();
  const rankProduct = (product) => {
    const images = Array.isArray(product?.images) ? product.images.map((url) => String(url || "").trim()).filter(Boolean) : [];
    const image = String(product?.image || product?.image_url || images[0] || "").trim();
    const hasRealImage = Boolean(image) && !/placehold\.co/i.test(image);
    const updatedAt = new Date(product?.updatedAt || product?.createdAt || 0).getTime();
    return {
      ...product,
      image,
      image_url: String(product?.image_url || image || "").trim(),
      images: images.length ? [...new Set([image, ...images].filter(Boolean))] : (image ? [image] : []),
      __rank: [
        hasRealImage ? 1 : 0,
        Number.isFinite(updatedAt) ? updatedAt : 0,
        images.length
      ]
    };
  };

  [...baseProducts, ...extraProducts].forEach((rawProduct) => {
    const product = rankProduct(rawProduct);
    const id = String(product?.id || "").trim();
    if (!id || REMOVED_PRODUCT_IDS.has(id)) {
      return;
    }

    const existing = map.get(id);
    if (!existing) {
      map.set(id, product);
      return;
    }

    const isBetter =
      product.__rank[0] > existing.__rank[0] ||
      (product.__rank[0] === existing.__rank[0] && product.__rank[1] > existing.__rank[1]) ||
      (product.__rank[0] === existing.__rank[0] && product.__rank[1] === existing.__rank[1] && product.__rank[2] >= existing.__rank[2]);

    if (isBetter) {
      map.set(id, product);
    }
  });

  return [...map.values()].map(({ __rank, ...product }) => product);
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function sanitizeText(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getVisibleProducts() {
  return products
    .filter((product) => {
      const matchesCategory = activeCategory === "Todos" || product.category === activeCategory;
      const haystack = `${product.name} ${product.category} ${product.description}`.toLowerCase();
      const matchesSearch = haystack.includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch && product.active !== false;
    })
    .sort((a, b) => {
      if (Boolean(a.featured) !== Boolean(b.featured)) {
        return Boolean(b.featured) - Boolean(a.featured);
      }

      const aCreated = new Date(a.createdAt || 0).getTime();
      const bCreated = new Date(b.createdAt || 0).getTime();
      return bCreated - aCreated;
    });
}

function getCartSubtotal() {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function getCartTotal() {
  return getCartSubtotal() + shippingState.price;
}

function getDeliveryMethodLabel(value) {
  if (value === "entrega") return t("deliveryLocal");
  if (value === "correios") return t("deliveryNational");
  return t("deliveryPickup");
}

function getWhatsAppUrl(text) {
  const number = String(appConfig.whatsappNumber || DEFAULT_CONFIG.whatsappNumber).replace(/\D/g, "");
  return `https://wa.me/${number}?text=${text}`;
}

function buildWhatsappMessage() {
  const customerName = document.getElementById("customer-name")?.value.trim() || "Cliente";
  const deliveryMethod = getDeliveryMethodLabel(document.querySelector('input[name="delivery-method"]:checked')?.value);
  const addressParts = [
    document.getElementById("customer-street")?.value.trim(),
    document.getElementById("customer-number")?.value.trim(),
    document.getElementById("customer-neighborhood")?.value.trim(),
    document.getElementById("customer-city")?.value.trim(),
    document.getElementById("customer-state")?.value.trim(),
    document.getElementById("customer-cep")?.value.trim()
  ].filter(Boolean);

  const lines = cart.length
    ? cart.map((item) => `- ${item.name}${item.size ? ` (Tam: ${item.size})` : ""}${item.color ? ` (Cor: ${item.color})` : ""} x${item.quantity} | ${formatCurrency(item.price * item.quantity)}`).join("\n")
    : "- Quero montar meu pedido";

  return encodeURIComponent(
    `Olá BigSmoke, quero finalizar minha compra.\n` +
    `Cliente: ${customerName}\n` +
    `Entrega: ${deliveryMethod}\n` +
    `Frete: ${formatCurrency(shippingState.price)}\n` +
    `${addressParts.length ? `Endereço: ${addressParts.join(", ")}\n` : ""}` +
    `\nItens:\n${lines}\n\nTotal final: ${formatCurrency(getCartTotal())}`
  );
}

function buildOrderWhatsAppMessage(order) {
  const itemLines = (order.items || [])
    .map((item) => `- ${item.name}${item.size ? ` (Tam: ${item.size})` : ""}${item.color ? ` (Cor: ${item.color})` : ""} x${item.quantity} | ${formatCurrency(item.price * item.quantity)}`)
    .join("\n");
  const displayNum = order.orderNumberFormatted
    || (order.orderNumber ? `#${String(order.orderNumber).padStart(5, "0")}` : order.id);

  return encodeURIComponent(
    `Olá BigSmoke, meu pagamento foi concluído e quero registrar o pedido.\n` +
    `Cliente: ${order.customer?.name || "Cliente"}\n` +
    `E-mail: ${order.customer?.email || "Não informado"}\n` +
    `WhatsApp: ${order.customer?.phone || "Não informado"}\n` +
    `Pedido: ${displayNum}\n` +
    `Entrega: ${getDeliveryMethodLabel(order.deliveryMethod)}\n` +
    `Frete: ${formatCurrency(order.shippingAmount || 0)}\n` +
    `${order.address?.cep ? `CEP: ${order.address.cep}\n` : ""}` +
    `${order.address?.street ? `Endereço: ${[order.address.street, order.address.number, order.address.neighborhood, order.address.city, order.address.state].filter(Boolean).join(", ")}\n` : ""}` +
    `\nItens:\n${itemLines}\n\nSubtotal: ${formatCurrency(order.amountSubtotal || 0)}\nTotal: ${formatCurrency(order.amountTotal || 0)}`
  );
}

function normalizeOrderStatus(value) {
  const raw = String(value || "").trim().toLowerCase();
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

function getOrderStatusLabel(status) {
  const normalized = normalizeOrderStatus(status);
  const labels = {
    pt: {
      pending: "Pendente",
      paid: "Pago",
      processing: "Em separação",
      shipped: "Enviado",
      delivered: "Entregue",
      canceled: "Cancelado"
    },
    en: {
      pending: "Pending",
      paid: "Paid",
      processing: "Processing",
      shipped: "Shipped",
      delivered: "Delivered",
      canceled: "Canceled"
    },
    es: {
      pending: "Pendiente",
      paid: "Pagado",
      processing: "En preparación",
      shipped: "Enviado",
      delivered: "Entregado",
      canceled: "Cancelado"
    }
  };
  return labels[currentLocale]?.[normalized] || labels.pt[normalized] || normalized;
}

function getOrderStatusIndex(status) {
  const normalized = normalizeOrderStatus(status);
  if (normalized === "canceled") return -1;
  return ORDER_STATUS_FLOW.indexOf(normalized);
}

function getOrderTrackingLink(order) {
  if (order?.trackingUrl) return order.trackingUrl;
  if (order?.trackingCode && /^https?:\/\//i.test(order.trackingCode)) {
    return order.trackingCode;
  }
  const identifier = order?.orderAccessCode || order?.trackingCode || order?.orderNumberFormatted || order?.orderNumber || order?.stripeSessionId || order?.id || localStorage.getItem("bigsmoke-last-order-session") || "";
  if (!identifier) return "";
  const url = new URL("/loja/pedidos.html", window.location.origin);
  url.searchParams.set("tracking", identifier);
  return url.toString();
}

function getTrackingPageUrl(identifier = "") {
  const url = new URL("/loja/pedidos.html", window.location.origin);
  if (identifier) {
    url.searchParams.set("tracking", identifier);
  }
  return url.toString();
}

function isTrackingPage() {
  return window.location.pathname.endsWith("/pedidos.html");
}

function ensureTrackingResultContainer() {
  const container = document.getElementById(TRACKING_RESULT_ID);
  if (container) return container;
  const section = document.getElementById(TRACKING_SECTION_ID);
  if (!section) return null;
  const result = document.createElement("div");
  result.id = TRACKING_RESULT_ID;
  result.className = "tracking-result";
  section.appendChild(result);
  return result;
}

function renderTrackingPlaceholder(message) {
  const container = ensureTrackingResultContainer();
  if (!container) return;
  container.innerHTML = `<p class="tracking-placeholder">${sanitizeText(message || "Use a busca acima para carregar o acompanhamento do pedido.")}</p>`;
}

function renderTrackingOrder(order, { scrollIntoView = false } = {}) {
  const container = ensureTrackingResultContainer();
  if (!container) return;
  const input = document.getElementById(TRACKING_INPUT_ID);
  if (input && order) {
    input.value = order.orderAccessCode || order.trackingCode || order.orderNumberFormatted || order.orderNumber || order.stripeSessionId || order.id || "";
  }
  container.innerHTML = renderOrderTracker(order);
  lastTrackedOrderSignature = getTrackedOrderSignature(order);
  const sessionKey = order?.stripeSessionId || order?.id || "";
  if (sessionKey) {
    startOrderTrackingPolling(sessionKey);
  }
  if (scrollIntoView) {
    document.getElementById(TRACKING_SECTION_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

async function fetchOrderTracking(value) {
  const query = String(value || "").trim();
  if (!query) throw new Error("Informe o número do pedido ou o session id.");
  const response = await fetch(buildApiUrl(`/api/orders/public/${encodeURIComponent(query)}`));
  if (!response.ok) {
    throw new Error("Pedido não encontrado.");
  }
  return response.json();
}

function getTrackingQueryValue() {
  const params = new URLSearchParams(window.location.search);
  return params.get("tracking") || params.get("pedido") || params.get("order") || params.get("session_id") || "";
}

function renderOrderTracker(order) {
  const status = normalizeOrderStatus(order?.status);
  const statusIndex = getOrderStatusIndex(status);
  const trackingLink = getOrderTrackingLink(order);
  const isExternalTrackingLink = Boolean(
    order?.trackingUrl ||
    (order?.trackingCode && /^https?:\/\//i.test(order.trackingCode))
  );
  const code = order?.orderAccessCode || order?.trackingCode || order?.orderNumberFormatted || order?.orderNumber || "";

  if (statusIndex < 0) {
    return `
      <section class="order-tracker" id="order-tracker">
        <div class="order-tracker-head">
          <div>
            <p class="section-kicker">${currentLocale === "en" ? "Order tracking" : currentLocale === "es" ? "Seguimiento" : "Acompanhamento do pedido"}</p>
            <h3>${getOrderStatusLabel(status)}</h3>
          </div>
          <div class="tracker-badges">
            ${code ? `<span class="order-code-pill">${sanitizeText(code)}</span>` : ""}
            <span class="status-badge status-${status}">${getOrderStatusLabel(status)}</span>
          </div>
        </div>
        <div class="order-progress">
          <span class="order-progress-step active">
            <i></i>
            <strong>${getOrderStatusLabel(status)}</strong>
          </span>
        </div>
        <div class="order-tracker-foot">
          <div>
            <strong>${currentLocale === "en" ? "Tracking code" : currentLocale === "es" ? "Código de rastreo" : "Código de rastreio"}</strong>
            <div>${sanitizeText(code || (currentLocale === "en" ? "No code yet" : currentLocale === "es" ? "Sin código todavía" : "Sem código ainda"))}</div>
          </div>
          ${trackingLink ? `<a class="tracking-link" href="${sanitizeText(trackingLink)}"${isExternalTrackingLink ? ' target="_blank" rel="noopener"' : ""}>${currentLocale === "en" ? "Open tracking link" : currentLocale === "es" ? "Abrir rastreo" : "Abrir rastreio"}</a>` : ""}
        </div>
      </section>
    `;
  }

  const steps = ORDER_STATUS_FLOW.map((step, index) => `
    <span class="order-progress-step${statusIndex >= index ? " active" : ""}">
      <i></i>
      <strong>${getOrderStatusLabel(step)}</strong>
    </span>
  `).join("");

  return `
    <section class="order-tracker" id="order-tracker">
      <div class="order-tracker-head">
        <div>
          <p class="section-kicker">${currentLocale === "en" ? "Order tracking" : currentLocale === "es" ? "Seguimiento" : "Acompanhamento do pedido"}</p>
          <h3>${getOrderStatusLabel(status)}</h3>
        </div>
        <div class="tracker-badges">
          ${code ? `<span class="order-code-pill">${sanitizeText(code)}</span>` : ""}
          <span class="status-badge status-${status}">${getOrderStatusLabel(status)}</span>
        </div>
      </div>
      <div class="order-progress" aria-label="Linha de progresso do pedido">
        ${steps}
      </div>
      <div class="order-tracker-foot">
        <div>
          <strong>${currentLocale === "en" ? "Tracking code" : currentLocale === "es" ? "Código de rastreo" : "Código de rastreio"}</strong>
          <div>${sanitizeText(order?.orderAccessCode || code || (currentLocale === "en" ? "Waiting for code" : currentLocale === "es" ? "Esperando código" : "Aguardando código"))}</div>
        </div>
        ${trackingLink ? `<a class="tracking-link" href="${sanitizeText(trackingLink)}"${isExternalTrackingLink ? ' target="_blank" rel="noopener"' : ""}>${currentLocale === "en" ? "Open tracking link" : currentLocale === "es" ? "Abrir rastreo" : "Abrir rastreio"}</a>` : ""}
      </div>
    </section>
  `;
}

function clearCartAfterSuccess() {
  cart = [];
  persistCart();
  updateCartUI();
}

function getSelectedValue(name) {
  return document.querySelector(`input[name="${name}"]:checked`)?.value || "";
}

function buildApiUrl(path) {
  const base = apiBaseUrl || (window.location.protocol === "file:" ? "http://localhost:3000" : window.location.origin);
  return new URL(path, base).toString();
}

async function detectApiBase() {
  const candidates = window.location.protocol === "file:"
    ? ["http://127.0.0.1:3000", "http://localhost:3000"]
    : [window.location.origin, "http://127.0.0.1:3000", "http://localhost:3000"];

  for (const base of candidates) {
    try {
      const response = await fetch(new URL("/healthz", base).toString(), { method: "GET" });
      if (response.ok) {
        apiBaseUrl = base;
        return;
      }
    } catch {
      // try next candidate
    }
  }

  apiBaseUrl = window.location.protocol === "file:" ? "http://localhost:3000" : window.location.origin;
}

function renderCategoryFilters() {
  const filterRoot = document.getElementById("category-filters");
  if (!filterRoot) return;

  const categories = [currentLocale === "en" ? "All" : "Todos", ...new Set(products.map((product) => product.category).filter(Boolean))];
  filterRoot.innerHTML = "";

  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `filter-chip${category === activeCategory ? " active" : ""}`;
    button.textContent = category;
    button.addEventListener("click", () => {
      activeCategory = category;
      renderCategoryFilters();
      renderProducts();
    });
    filterRoot.appendChild(button);
  });
}

function getProductColorSwatches(product) {
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
        return { name: color.trim(), hex: "#888888", image: "", hasImage: false };
      }

      const name = String(color?.name || color?.label || color?.color || `Cor ${index + 1}`).trim();
      const hex = /^#[0-9a-f]{6}$/i.test(String(color?.hex || "").trim())
        ? String(color.hex).trim()
        : "#888888";
      const image = Array.isArray(color?.images)
        ? String(color.images[0] || "").trim()
        : "";

      return { name, hex, image, hasImage: Boolean(image) };
    })
    .filter((color) => {
      if (!color.name) return false;
      const key = `${color.name.toLowerCase()}|${color.hex.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function renderProducts() {
  const grid = document.getElementById("products-grid");
  if (!grid) return;

  grid.innerHTML = "";

  const visibleProducts = getVisibleProducts();
  const previewProductId = highlightedProductId;
  if (!visibleProducts.length) {
    grid.innerHTML = `
      <article class="card">
        <div class="card-content">
          <p class="section-kicker">${t("noResultsKicker")}</p>
          <h3>${t("noResultsTitle")}</h3>
          <p>${t("noResultsText")}</p>
        </div>
      </article>
    `;
    return;
  }

  visibleProducts.forEach((product) => {
    const card = document.createElement("article");
    card.className = "card";
    card.dataset.productId = product.id;
    card.classList.toggle("is-highlighted", product.id === previewProductId);
    const productLink = `/loja/produto.html?id=${encodeURIComponent(product.id)}`;

    const priceLabel = product.price > 0 ? formatCurrency(product.price) : t("priceTbd");
    const isOutOfStock = typeof product.stock === "number" && product.stock === 0;
    const addDisabled = product.price <= 0 || isOutOfStock;
    const sizes = parseProductSizes(product);
    const selectedSize = selectedProductSizes.get(product.id) || sizes[0] || "";
    const stockBadge = isOutOfStock
      ? `<span class="card-badge badge-sold-out">Esgotado</span>`
      : `<span class="card-badge">${sanitizeText(product.badge || product.category)}</span>`;
    const btnHtml = isOutOfStock
      ? `<button class="btn-add" type="button" disabled aria-disabled="true" style="opacity:0.5;cursor:not-allowed;">Esgotado</button>`
      : `<button class="btn-add" type="button" ${addDisabled ? "disabled" : ""}>${addDisabled ? t("completeProduct") : t("addToCart")}</button>`;
    const colorSwatches = getProductColorSwatches(product);
    const colorSwatchesHtml = colorSwatches.length
      ? `
        <div class="catalog-color-row" aria-label="Cores disponíveis">
          <span>Cores</span>
          <div class="catalog-color-swatches">
            ${colorSwatches.map((color) => `
              <a class="catalog-color-swatch" href="${productLink}" title="${sanitizeText(color.name)}" aria-label="${sanitizeText(color.name)}" style="--swatch-color:${sanitizeText(color.hex)}">
                ${color.hasImage ? `<img src="${sanitizeText(color.image)}" alt="" loading="lazy">` : ""}
              </a>
            `).join("")}
          </div>
        </div>
      `
      : "";
    const sizeButtons = sizes.length
      ? `
        <div class="size-picker" aria-label="Selecionar tamanho">
          <span class="size-picker-label">Tamanho</span>
          <div class="size-chips">
            ${sizes.map((size) => `<button type="button" class="size-chip${size === selectedSize ? " active" : ""}" aria-pressed="${size === selectedSize}" data-size="${sanitizeText(size)}">${sanitizeText(size)}</button>`).join("")}
          </div>
        </div>
      `
      : "";

    card.innerHTML = `
      <a class="card-media-link" href="${productLink}" aria-label="Ver ${sanitizeText(product.name)}">
        <div class="card-media">
          <img src="${sanitizeText(product.image || product.image_url || (Array.isArray(product.images) ? product.images[0] : "") || PLACEHOLDER_IMAGE)}" alt="${sanitizeText(product.name)}" loading="lazy" onerror="this.src='${PLACEHOLDER_IMAGE}'">
          ${stockBadge}
        </div>
      </a>
      <div class="card-content">
        <div>
          <p class="section-kicker">${sanitizeText(product.category)}</p>
          <h3><a class="product-card-link" href="${productLink}">${sanitizeText(product.name)}</a></h3>
        </div>
        <p>${sanitizeText(product.description || t("newDrop"))}</p>
        <div class="product-meta">
          <span class="product-price">${priceLabel}</span>
          <span class="product-sizes">${sanitizeText(product.sizes || t("sizesSoon"))}</span>
        </div>
        ${colorSwatchesHtml}
        ${sizeButtons}
        <div class="card-actions">
          ${btnHtml}
        </div>
      </div>
    `;

    const addButton = card.querySelector(".btn-add");
    if (!addDisabled) {
      addButton.addEventListener("click", () => addToCart(product.id, selectedProductSizes.get(product.id) || sizes[0] || ""));
    }

    card.querySelectorAll(".size-chip").forEach((button) => {
      button.addEventListener("click", () => {
        selectedProductSizes.set(product.id, button.dataset.size || "");
        renderProducts();
      });
      if ((selectedProductSizes.get(product.id) || sizes[0] || "") === button.dataset.size) {
        button.classList.add("active");
      }
      if (!selectedProductSizes.has(product.id) && button.dataset.size === selectedSize) {
        button.classList.add("active");
      }
    });

    grid.appendChild(card);
  });

  if (shouldScrollToHighlight && highlightedProductId) {
    const target = grid.querySelector(`[data-product-id="${highlightedProductId}"]`);
    if (target) {
      shouldScrollToHighlight = false;
      highlightedProductId = "";
      window.setTimeout(() => {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.classList.add("is-highlighted");
        window.setTimeout(() => target.classList.remove("is-highlighted"), 2400);
      }, 120);
    }
  }
}

function persistCart() {
  saveStorage(STORAGE_KEYS.cart, cart);
}

function addToCart(productId, size = "") {
  const product = resolveProductById(productId);
  if (!product || product.price <= 0 || (typeof product.stock === "number" && product.stock === 0)) return;

  const finalSize = size || getDefaultProductSize(product);
  const cartKey = buildCartKey(product.id, finalSize);
  const existingItem = cart.find((item) => item.cartKey === cartKey);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      cartKey,
      productId: product.id,
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      category: product.category,
      size: finalSize
    });
  }

  persistCart();
  updateCartUI();
  toggleCart(true);
}

function updateCartItemSize(cartKey, nextSize) {
  const target = cart.find((item) => item.cartKey === cartKey);
  if (!target) return;

  const product = resolveProductById(target.productId);
  const finalSize = nextSize || getDefaultProductSize(product);
  const nextCartKey = buildCartKey(target.productId, finalSize);
  const duplicate = cart.find((item) => item.cartKey === nextCartKey && item.cartKey !== cartKey);

  if (duplicate) {
    duplicate.quantity += target.quantity;
    cart = cart.filter((item) => item.cartKey !== cartKey);
  } else {
    target.size = finalSize;
    target.cartKey = nextCartKey;
  }

  persistCart();
  updateCartUI();
}

function changeCartQuantity(cartKey, delta) {
  const target = cart.find((item) => item.cartKey === cartKey);
  if (!target) return;

  target.quantity += delta;
  if (target.quantity <= 0) {
    cart = cart.filter((item) => item.cartKey !== cartKey);
  }

  persistCart();
  updateCartUI();
}

function removeItem(cartKey) {
  cart = cart.filter((item) => item.cartKey !== cartKey);
  persistCart();
  updateCartUI();
}

function updateCartUI() {
  const cartItems = document.getElementById("cart-items");
  const totalEl = document.getElementById("total");
  const countEl = document.getElementById("cart-count");
  const whatsappBtn = document.getElementById("whatsapp");
  const emptyState = document.getElementById("empty-cart");

  if (!cartItems || !totalEl || !countEl || !whatsappBtn || !emptyState) return;

  cartItems.innerHTML = "";

  let itemCount = 0;

  cart.forEach((item) => {
    itemCount += item.quantity;
    const product = resolveProductById(item.productId) || {};
    const sizeOptions = parseProductSizes(product);

    const li = document.createElement("li");
    li.className = "cart-item";
    li.innerHTML = `
      <div class="cart-item-main">
        <strong>${sanitizeText(item.name)}</strong>
        <span>${sanitizeText(item.category)}</span>
        <div class="cart-item-size-row">
          <span class="cart-item-size-label">Tamanho</span>
          <select class="cart-item-size-select" aria-label="Selecionar tamanho">
            ${sizeOptions.length
              ? sizeOptions.map((size) => `<option value="${sanitizeText(size)}"${size === item.size ? " selected" : ""}>${sanitizeText(size)}</option>`).join("")
              : `<option value="${sanitizeText(item.size || "")}">${sanitizeText(item.size || "Único")}</option>`}
          </select>
        </div>
        ${item.color ? `<div class="cart-item-color-row"><span class="cart-item-color-label">Cor</span><span class="cart-item-color-value">${sanitizeText(item.color)}</span></div>` : ""}
      </div>
      <div class="cart-item-controls">
        <span class="cart-item-price">${formatCurrency(item.price * item.quantity)}</span>
        <div class="qty-controls">
          <button type="button" aria-label="${currentLocale === "en" ? "Decrease quantity" : currentLocale === "es" ? "Disminuir cantidad" : "Diminuir quantidade"}">−</button>
          <span class="qty-value">${item.quantity}</span>
          <button type="button" aria-label="${currentLocale === "en" ? "Increase quantity" : currentLocale === "es" ? "Aumentar cantidad" : "Aumentar quantidade"}">+</button>
        </div>
        <button class="remove-item" type="button" aria-label="${currentLocale === "en" ? "Remove item" : currentLocale === "es" ? "Eliminar artículo" : "Remover item"}">×</button>
      </div>
    `;

    const qtyButtons = li.querySelectorAll(".qty-controls button");
    qtyButtons[0].addEventListener("click", () => changeCartQuantity(item.cartKey, -1));
    qtyButtons[1].addEventListener("click", () => changeCartQuantity(item.cartKey, 1));
    li.querySelector(".remove-item").addEventListener("click", () => removeItem(item.cartKey));
    li.querySelector(".cart-item-size-select")?.addEventListener("change", (event) => {
      updateCartItemSize(item.cartKey, event.target.value);
    });

    cartItems.appendChild(li);
  });

  totalEl.textContent = getCartSubtotal().toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  countEl.textContent = String(itemCount);
  emptyState.style.display = cart.length ? "none" : "block";
  emptyState.textContent = t("cartEmpty");
  whatsappBtn.href = getWhatsAppUrl(buildWhatsappMessage());
  whatsappBtn.textContent = "WhatsApp";
  updateCheckoutSummary();
}

function toggleCart(forceState) {
  const cartElement = document.getElementById("cart");
  const overlay = document.getElementById("cart-overlay");
  if (!cartElement || !overlay) return;

  const nextState = typeof forceState === "boolean"
    ? forceState
    : !cartElement.classList.contains("active");

  cartElement.classList.toggle("active", nextState);
  overlay.classList.toggle("active", nextState);
  document.body.style.overflow = nextState ? "hidden" : "";
}

function openCheckout() {
  if (!cart.length) {
    alert(currentLocale === "en" ? "Add at least one item to your cart before checking out." : currentLocale === "es" ? "Agrega al menos una prenda al carrito antes de finalizar la compra." : "Adicione pelo menos uma peça ao carrinho antes de finalizar a compra.");
    return;
  }

  const modal = document.getElementById("checkout-modal");
  const overlay = document.getElementById("checkout-overlay");
  if (!modal || !overlay) return;

  toggleCart(false);
  modal.classList.add("active");
  overlay.classList.add("active");
  document.body.style.overflow = "hidden";
  updateCheckoutSummary();
}

function closeCheckout() {
  const modal = document.getElementById("checkout-modal");
  const overlay = document.getElementById("checkout-overlay");
  if (!modal || !overlay) return;

  modal.classList.remove("active");
  overlay.classList.remove("active");
  document.body.style.overflow = "";
}

function updateCheckoutSummary() {
  const list = document.getElementById("checkout-items");
  const subtotalEl = document.getElementById("checkout-subtotal");
  const shippingEl = document.getElementById("checkout-shipping");
  const totalEl = document.getElementById("checkout-total");
  const noteEl = document.getElementById("checkout-note");
  if (!list || !subtotalEl || !shippingEl || !totalEl || !noteEl) return;

  list.innerHTML = "";
  cart.forEach((item) => {
    const li = document.createElement("li");
    li.className = "checkout-item";
    li.innerHTML = `
      <div>
        <strong>${sanitizeText(item.name)}</strong>
        <small>${item.quantity} unidade(s)${item.size ? ` • Tamanho ${sanitizeText(item.size)}` : ""}${item.color ? ` • Cor ${sanitizeText(item.color)}` : ""}</small>
      </div>
      <span>${formatCurrency(item.price * item.quantity)}</span>
    `;
    list.appendChild(li);
  });

  subtotalEl.textContent = formatCurrency(getCartSubtotal());
  shippingEl.textContent = formatCurrency(shippingState.price);
  totalEl.textContent = formatCurrency(getCartTotal());
  noteEl.textContent = appConfig.stripeConfigured
    ? t("checkoutNoteReady")
    : t("checkoutNoteConfig");
}

function renderOrderSuccess(order) {
  const message = buildOrderWhatsAppMessage(order);
  const displayNumber = order.orderNumberFormatted
    || (order.orderNumber ? `#${String(order.orderNumber).padStart(5, "0")}` : null);
  const displayId = displayNumber || sanitizeText(order.id).slice(0, 16);
  const trackingCode = order.orderAccessCode || order.trackingCode || "";
  const trackingLink = getOrderTrackingLink(order);
  const section = document.createElement("section");
  section.className = "section-shell payment-success";
  section.innerHTML = `
    <div class="success-panel">
      <p class="section-kicker">${t("orderReturn")}</p>
      <h2>${t("orderSuccessTitle")}</h2>
      <p>${t("orderSuccessText")}</p>
      <div class="success-actions">
        <a class="btn btn-primary" target="_blank" rel="noopener" href="${getWhatsAppUrl(message)}">${t("orderSuccessBtn")}</a>
        <a class="btn btn-outline" href="#products">${t("orderSuccessBack")}</a>
      </div>
      <div class="success-details">
        <strong class="order-number-badge">
          Pedido <span class="order-number-highlight">${displayId}</span>
        </strong>
        ${trackingCode ? `<span class="order-code-pill">Código ${sanitizeText(trackingCode)}</span>` : ""}
        <span>${t("orderSuccessTotal")} ${formatCurrency(order.amountTotal || 0)}</span>
        ${trackingLink ? `<a class="tracking-link" href="${sanitizeText(trackingLink)}"${/^https?:\/\//i.test(trackingLink) ? ' target="_blank" rel="noopener"' : ""}>Abrir rastreio</a>` : ""}
        <small class="order-tracking-hint">Guarde o código e o número para acompanhar seu pedido</small>
      </div>
    </div>
  `;

  const main = document.querySelector("main");
  document.querySelectorAll(".payment-success").forEach((existing) => existing.remove());
  main?.prepend(section);
  renderTrackingOrder(order);
  lastTrackedOrderSignature = getTrackedOrderSignature(order);
  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderStoredOrderTracker(order) {
  renderTrackingOrder(order);
}

let orderTrackingPollTimer = null;
let orderTrackingSessionId = "";
let lastTrackedOrderSignature = "";

function getTrackedOrderSignature(order) {
  return JSON.stringify({
    id: order?.id || "",
    status: order?.status || "",
    orderAccessCode: order?.orderAccessCode || "",
    trackingCode: order?.trackingCode || "",
    trackingUrl: order?.trackingUrl || "",
    orderNumber: order?.orderNumber || "",
    orderNumberFormatted: order?.orderNumberFormatted || ""
  });
}

function getTrackedOrderSessionId() {
  return orderTrackingSessionId || localStorage.getItem("bigsmoke-last-order-session") || "";
}

function stopOrderTrackingPolling() {
  if (orderTrackingPollTimer) {
    clearInterval(orderTrackingPollTimer);
    orderTrackingPollTimer = null;
  }
}

function startOrderTrackingPolling(sessionId) {
  if (!sessionId) return;
  orderTrackingSessionId = sessionId;
  stopOrderTrackingPolling();

  const refresh = async () => {
    try {
      const response = await fetch(buildApiUrl(`/api/orders/public/${encodeURIComponent(sessionId)}`));
      if (!response.ok) return;
      const latest = await response.json();
      const signature = getTrackedOrderSignature(latest);
      if (signature === lastTrackedOrderSignature) return;
      lastTrackedOrderSignature = signature;
      if (document.getElementById(TRACKING_SECTION_ID)) {
        renderStoredOrderTracker(latest);
      }
    } catch {
      // best effort only
    }
  };

  refresh();
  orderTrackingPollTimer = window.setInterval(refresh, 3000);
}

function scrollToProducts() {
  const productsSection = document.getElementById("products");
  if (productsSection) {
    productsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function syncHighlightedProductFromUrl() {
  const params = new URLSearchParams(window.location.search);
  highlightedProductId = params.get("highlight") || params.get("preview") || "";
  shouldScrollToHighlight = Boolean(highlightedProductId);
}

function focusSearch() {
  const input = document.getElementById("product-search");
  if (!input) return;

  scrollToProducts();
  window.setTimeout(() => input.focus(), 350);
}

function setupCatalogNavigation() {
  const searchInput = document.getElementById("product-search");
  if (!searchInput) return;

  searchInput.addEventListener("input", (event) => {
    searchTerm = event.target.value.trim();
    renderProducts();
  });
}

function normalizeCep(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 8);
}

function fillAddressFromCep(data) {
  document.getElementById("customer-street").value = data.logradouro || "";
  document.getElementById("customer-neighborhood").value = data.bairro || "";
  document.getElementById("customer-city").value = data.localidade || "";
  document.getElementById("customer-state").value = data.uf || "";
}

async function lookupCep() {
  const cepInput = document.getElementById("customer-cep");
  const statusEl = document.getElementById("location-status");
  const cep = normalizeCep(cepInput?.value);

  if (cep.length !== 8) {
    statusEl.textContent = t("locationInvalid");
    return null;
  }

  statusEl.textContent = t("locationSearching");

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();
    if (data.erro) throw new Error("CEP não encontrado");

    shippingState.cepData = data;
    fillAddressFromCep(data);
    await updateShippingEstimate();
    return data;
  } catch {
    statusEl.textContent = "Não foi possível localizar esse CEP agora.";
    return null;
  }
}

function estimateShipping(method, cepData) {
  if (method === "retirada") {
    return { price: 0, label: "Retirada na loja" };
  }

  const storeCity = (appConfig.store.city || "").toLowerCase();
  const storeState = (appConfig.store.state || "").toUpperCase();
  const targetCity = (cepData?.localidade || "").toLowerCase();
  const targetState = (cepData?.uf || "").toUpperCase();
  const normalizedTargetCity = String(cepData?.localidade || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  if (targetState === "PB" && FREE_SHIPPING_CITIES.has(normalizedTargetCity)) {
    return {
      price: 0,
      label: currentLocale === "en"
        ? `Free shipping to ${cepData.localidade}`
        : currentLocale === "es"
          ? `Envío gratis para ${cepData.localidade}`
          : `Frete grátis para ${cepData.localidade}`
    };
  }

  if (!cepData) {
    return { price: method === "entrega" ? 18 : 28, label: currentLocale === "en" ? "Default estimate" : currentLocale === "es" ? "Estimación estándar" : "Estimativa padrão" };
  }

  if (method === "entrega") {
    if (targetCity === storeCity && targetState === storeState) {
      return { price: 12, label: currentLocale === "en" ? `Delivery in ${cepData.localidade}` : currentLocale === "es" ? `Entrega en ${cepData.localidade}` : `Entrega em ${cepData.localidade}` };
    }
    if (targetState === storeState) {
      return { price: 18, label: currentLocale === "en" ? `Delivery within ${targetState}` : currentLocale === "es" ? `Entrega dentro de ${targetState}` : `Entrega dentro de ${targetState}` };
    }
    return { price: 24, label: currentLocale === "en" ? `Regional delivery to ${targetState}` : currentLocale === "es" ? `Entrega regional para ${targetState}` : `Entrega regional para ${targetState}` };
  }

  if (targetCity === storeCity && targetState === storeState) {
    return { price: 16, label: currentLocale === "en" ? `Fast shipping in ${cepData.localidade}` : currentLocale === "es" ? `Envío rápido en ${cepData.localidade}` : `Envio rápido em ${cepData.localidade}` };
  }
  if (targetState === storeState) {
    return { price: 24, label: currentLocale === "en" ? "Shipping within the same state" : currentLocale === "es" ? "Envío en el mismo estado" : "Envio no mesmo estado" };
  }
  if (NORTHEAST_STATES.includes(targetState)) {
    return { price: 29, label: currentLocale === "en" ? "Northeast shipping" : currentLocale === "es" ? "Envío Nordeste" : "Envio Nordeste" };
  }
  if (NORTH_STATES.includes(targetState)) {
    return { price: 42, label: currentLocale === "en" ? "North shipping" : currentLocale === "es" ? "Envío Norte" : "Envio Norte" };
  }
  return { price: 35, label: currentLocale === "en" ? "National shipping" : currentLocale === "es" ? "Envío nacional" : "Envio nacional" };
}

async function updateShippingEstimate() {
  const statusEl = document.getElementById("location-status");
  const deliveryMethod = getSelectedValue("delivery-method");
  const estimate = estimateShipping(deliveryMethod, shippingState.cepData);
  shippingState.price = estimate.price;
  shippingState.label = estimate.label;

  if (deliveryMethod === "retirada") {
    statusEl.textContent = t("locationSuccessPickup");
  } else if (shippingState.cepData) {
    statusEl.textContent = t("locationSuccessBase", estimate.label, formatCurrency(estimate.price));
  } else {
    statusEl.textContent = t("locationSuccessHint", formatCurrency(estimate.price));
  }

  updateCartUI();
}

function useCurrentLocation() {
  const statusEl = document.getElementById("location-status");
  if (!navigator.geolocation) {
    statusEl.textContent = currentLocale === "en" ? "Your browser does not support geolocation." : currentLocale === "es" ? "Tu navegador no ofrece geolocalización." : "Seu navegador não oferece geolocalização.";
    return;
  }

  statusEl.textContent = "Solicitando sua localização...";
  navigator.geolocation.getCurrentPosition(
    (position) => {
      shippingState.coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      statusEl.textContent = `Localização capturada. Latitude ${position.coords.latitude.toFixed(5)}, longitude ${position.coords.longitude.toFixed(5)}.`;
    },
    () => {
      statusEl.textContent = "Não foi possível acessar sua localização. Você ainda pode preencher o CEP manualmente.";
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function collectCheckoutData() {
  return {
    customer: {
      name: document.getElementById("customer-name").value.trim(),
      email: document.getElementById("customer-email").value.trim(),
      phone: document.getElementById("customer-phone").value.trim()
    },
    address: {
      cep: normalizeCep(document.getElementById("customer-cep").value),
      street: document.getElementById("customer-street").value.trim(),
      number: document.getElementById("customer-number").value.trim(),
      neighborhood: document.getElementById("customer-neighborhood").value.trim(),
      city: document.getElementById("customer-city").value.trim(),
      state: document.getElementById("customer-state").value.trim(),
      complement: document.getElementById("customer-complement").value.trim()
    },
    deliveryMethod: getSelectedValue("delivery-method")
  };
}

function validateCheckout(data) {
  document.querySelectorAll(".field-error").forEach((el) => el.classList.remove("field-error"));
  const errorBanner = document.getElementById("checkout-error-banner");
  if (errorBanner) errorBanner.remove();

  const errors = [];

  if (!cart.length) {
    errors.push("Seu carrinho está vazio.");
  }

  if (!data.customer.name) {
    errors.push("Informe seu nome completo.");
    document.getElementById("customer-name")?.classList.add("field-error");
  }

  if (!data.customer.phone) {
    errors.push("Informe seu WhatsApp.");
    document.getElementById("customer-phone")?.classList.add("field-error");
  }

  if (data.deliveryMethod !== "retirada") {
    if (!data.address.cep) {
      errors.push("Informe o CEP para calcular o frete.");
      document.getElementById("customer-cep")?.classList.add("field-error");
    }
    if (!data.address.city) {
      errors.push("Informe a cidade.");
      document.getElementById("customer-city")?.classList.add("field-error");
    }
    if (!data.address.state) {
      errors.push("Informe o estado (UF).");
      document.getElementById("customer-state")?.classList.add("field-error");
    }
  }

  if (errors.length) {
    const banner = document.createElement("div");
    banner.id = "checkout-error-banner";
    banner.className = "checkout-error-banner";
    banner.innerHTML = errors.map((e) => `<span>• ${e}</span>`).join("");
    const confirmBtn = document.getElementById("confirm-checkout");
    confirmBtn?.parentNode?.insertBefore(banner, confirmBtn);
    return false;
  }

  return true;
}

async function handleCheckoutSubmit() {
  const data = collectCheckoutData();
  if (!validateCheckout(data)) return;

  const payload = {
    customer: data.customer,
    address: data.address,
    deliveryMethod: data.deliveryMethod,
    items: cart.map((item) => ({
      id: item.productId || item.id,
      quantity: item.quantity,
      size: item.size || ""
    }))
  };

  const button = document.getElementById("confirm-checkout");
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = currentLocale === "en" ? "Opening payment..." : currentLocale === "es" ? "Abriendo pago..." : "Abrindo pagamento...";

  try {
    const response = await fetch(buildApiUrl("/api/checkout/session"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok || !result.url) {
      throw new Error(result.error || (currentLocale === "en" ? "Could not start payment." : currentLocale === "es" ? "No fue posible iniciar el pago." : "Não foi possível iniciar o pagamento."));
    }

    localStorage.setItem("bigsmoke-last-order-session", result.id);
    window.location.href = result.url;
  } catch (error) {
    alert(error.message || (currentLocale === "en" ? "Could not open Stripe checkout right now." : currentLocale === "es" ? "No se pudo abrir Stripe Checkout ahora." : "Não foi possível abrir o checkout da Stripe agora."));
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

async function loadRuntimeConfig() {
  try {
    const response = await fetch(buildApiUrl("/api/config"));
    if (!response.ok) throw new Error("config");
    const result = await response.json();
    appConfig = {
      ...DEFAULT_CONFIG,
      ...result,
      whatsappNumber: result.whatsappNumber || DEFAULT_CONFIG.whatsappNumber,
      store: {
        ...DEFAULT_CONFIG.store,
        ...(result.store || {})
      }
    };
  } catch {
    appConfig = { ...DEFAULT_CONFIG };
  }
}

async function loadProducts() {
  try {
    const response = await fetch(buildApiUrl("/api/products"));
    if (!response.ok) throw new Error("products");
    // API disponível é a fonte de verdade; o cache local fica só para fallback offline.
    products = mergeProducts(await response.json(), []);
  } catch {
    products = mergeProducts(FALLBACK_PRODUCTS, loadLocalProducts());
  }

  syncHighlightedProductFromUrl();
}

async function handlePaymentReturn() {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");
  const checkoutStatus = params.get("checkout");

  if (checkoutStatus !== "success" || !sessionId) return;

  startOrderTrackingPolling(sessionId);

  try {
    const response = await fetch(buildApiUrl(`/api/orders/public/${encodeURIComponent(sessionId)}`));
    if (!response.ok) throw new Error("Pedido não encontrado.");
    orderSuccessData = await response.json();
    renderOrderSuccess(orderSuccessData);
    clearCartAfterSuccess();
  } catch {
    const lastSession = localStorage.getItem("bigsmoke-last-order-session");
    if (lastSession === sessionId) {
      const fallback = {
        id: sessionId,
        status: "pending",
        customer: {
          name: document.getElementById("customer-name")?.value.trim() || "Cliente",
          email: document.getElementById("customer-email")?.value.trim() || "",
          phone: document.getElementById("customer-phone")?.value.trim() || ""
        },
        address: {
          cep: document.getElementById("customer-cep")?.value.trim() || "",
          street: document.getElementById("customer-street")?.value.trim() || "",
          number: document.getElementById("customer-number")?.value.trim() || "",
          neighborhood: document.getElementById("customer-neighborhood")?.value.trim() || "",
          city: document.getElementById("customer-city")?.value.trim() || "",
          state: document.getElementById("customer-state")?.value.trim() || ""
        },
        deliveryMethod: getSelectedValue("delivery-method"),
        shippingAmount: shippingState.price,
        amountSubtotal: getCartSubtotal(),
        amountTotal: getCartTotal(),
        items: cart,
        trackingCode: "",
        trackingUrl: ""
      };
      renderOrderSuccess(fallback);
      clearCartAfterSuccess();
    }
  }
}

async function loadStoredOrderTracker() {
  if (!document.getElementById(TRACKING_SECTION_ID)) {
    const queryValue = getTrackingQueryValue() || getTrackedOrderSessionId();
    if (queryValue && window.location.pathname.includes("/loja/") && !window.location.pathname.endsWith("pedidos.html")) {
      window.location.replace(getTrackingPageUrl(queryValue));
    }
    return;
  }

  const queryValue = getTrackingQueryValue();
  const sessionId = getTrackedOrderSessionId();
  const initialValue = queryValue || sessionId;
  if (!initialValue) {
    renderTrackingPlaceholder("Use a busca acima para carregar o acompanhamento do pedido pelo código.");
    return;
  }

  try {
    const response = await fetch(buildApiUrl(`/api/orders/public/${encodeURIComponent(initialValue)}`));
    if (!response.ok) return;
    const order = await response.json();
    renderStoredOrderTracker(order);
    startOrderTrackingPolling(order.stripeSessionId || initialValue);
  } catch {
    // Best effort only.
  }
}

function setupOrderTrackingLookup() {
  const form = document.getElementById(TRACKING_FORM_ID);
  const input = document.getElementById(TRACKING_INPUT_ID);
  if (!form || !input) return;

  const initialValue = getTrackingQueryValue() || getTrackedOrderSessionId();
  if (initialValue) {
    input.value = initialValue;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const value = input.value.trim();
    if (!value) {
      renderTrackingPlaceholder("Digite um código de pedido, número ou session id válido.");
      return;
    }

  try {
      const order = await fetchOrderTracking(value);
      const url = new URL(window.location.href);
      url.searchParams.set("tracking", order.orderAccessCode || order.trackingCode || order.orderNumberFormatted || order.orderNumber || order.stripeSessionId || order.id || value);
      window.history.replaceState({}, "", url.toString());
      renderTrackingOrder(order, { scrollIntoView: true });
    } catch (error) {
      renderTrackingPlaceholder(error.message || "Pedido não encontrado.");
    }
  });
}

function setupPaymentSuccessStyles() {
  if (document.getElementById("payment-success-styles")) return;

  const style = document.createElement("style");
  style.id = "payment-success-styles";
  style.textContent = `
    .payment-success {
      margin: 0 0 2rem;
      padding: 1.25rem;
      scroll-margin-top: 120px;
    }

    .tracking-shell {
      margin-top: 2rem;
      scroll-margin-top: 120px;
    }

    .tracking-shell-card {
      display: grid;
      gap: 1rem;
      padding: 1.25rem;
      border-radius: 18px;
      background: linear-gradient(180deg, rgba(245, 240, 232, 0.05), rgba(245, 240, 232, 0.03));
      border: 1px solid rgba(245, 240, 232, 0.12);
      box-shadow: 0 24px 45px rgba(0, 0, 0, 0.22);
    }

    .tracking-search {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 0.75rem;
    }

    .tracking-search input {
      min-height: 48px;
      padding: 0.85rem 1rem;
      border-radius: 999px;
      border: 1px solid rgba(245, 240, 232, 0.14);
      background: rgba(10, 10, 10, 0.55);
      color: var(--text-primary);
    }

    .tracking-search input:focus {
      outline: none;
      border-color: rgba(245, 240, 232, 0.35);
      box-shadow: 0 0 0 3px rgba(245, 240, 232, 0.08);
    }

    .tracking-result {
      display: grid;
      gap: 1rem;
    }

    .tracking-placeholder {
      padding: 0.9rem 1rem;
      border-radius: 14px;
      border: 1px dashed rgba(245, 240, 232, 0.16);
      color: var(--text-secondary);
      background: rgba(245, 240, 232, 0.03);
    }

    .payment-success .success-panel {
      display: grid;
      gap: 1rem;
      padding: 1.4rem;
      border-radius: 18px;
      background: linear-gradient(180deg, rgba(245, 240, 232, 0.06), rgba(245, 240, 232, 0.03));
      border: 1px solid rgba(245, 240, 232, 0.12);
      box-shadow: 0 24px 45px rgba(0, 0, 0, 0.22);
    }

    .payment-success h2 {
      margin: 0;
      font-family: 'Bebas Neue', sans-serif;
      font-size: clamp(2.1rem, 4vw, 3.4rem);
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .payment-success p {
      margin: 0;
      max-width: 56ch;
      color: var(--text-secondary);
    }

    .payment-success .success-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .payment-success .success-details {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem 1rem;
      justify-content: space-between;
      padding-top: 0.85rem;
      border-top: 1px solid rgba(245, 240, 232, 0.1);
      color: var(--text-secondary);
    }

    .payment-success .success-details strong {
      color: var(--text-primary);
    }

    .payment-success .order-number-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.45rem 0.7rem;
      border-radius: 999px;
      border: 1px solid rgba(245, 240, 232, 0.16);
      background: rgba(245, 240, 232, 0.04);
      font-family: 'Bebas Neue', sans-serif;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .payment-success .order-number-highlight {
      color: #f5f0e8;
      font-size: 1.15em;
    }

    .payment-success .order-tracking-hint {
      display: block;
      width: 100%;
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .payment-success .order-tracker {
      display: grid;
      gap: 1rem;
      padding: 1rem;
      border-radius: 16px;
      border: 1px solid rgba(245, 240, 232, 0.12);
      background: rgba(245, 240, 232, 0.03);
    }

    .payment-success .order-tracker-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
    }

    .payment-success .status-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.3rem 0.7rem;
      border-radius: 999px;
      border: 1px solid currentColor;
      font-size: 0.76rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      background: rgba(255, 255, 255, 0.04);
    }

    .payment-success .status-badge.status-pending { color: #fbbf24; }
    .payment-success .status-badge.status-paid { color: #34d399; }
    .payment-success .status-badge.status-processing { color: #60a5fa; }
    .payment-success .status-badge.status-shipped { color: #a78bfa; }
    .payment-success .status-badge.status-delivered { color: #34d399; }
    .payment-success .status-badge.status-canceled { color: #f87171; }

    .payment-success .order-progress {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 0.5rem;
    }

    .payment-success .order-progress-step {
      display: grid;
      gap: 0.45rem;
      align-items: center;
      justify-items: center;
      padding: 0.7rem 0.45rem;
      border-radius: 14px;
      border: 1px solid rgba(245, 240, 232, 0.12);
      background: rgba(245, 240, 232, 0.03);
      color: var(--text-secondary);
      text-align: center;
      min-height: 84px;
    }

    .payment-success .order-progress-step.active {
      border-color: rgba(245, 240, 232, 0.28);
      background: rgba(245, 240, 232, 0.08);
      color: var(--text-primary);
    }

    .payment-success .order-progress-step i {
      width: 0.72rem;
      height: 0.72rem;
      border-radius: 999px;
      background: rgba(245, 240, 232, 0.22);
    }

    .payment-success .order-progress-step.active i {
      background: var(--text-primary);
    }

    .payment-success .order-tracker-foot {
      display: grid;
      gap: 0.65rem;
      padding-top: 0.85rem;
      border-top: 1px solid rgba(245, 240, 232, 0.08);
      color: var(--text-secondary);
    }

    .payment-success .tracking-link {
      display: inline-flex;
      width: fit-content;
      align-items: center;
      gap: 0.35rem;
      color: #f5f0e8;
      text-decoration: underline;
      text-underline-offset: 0.18em;
    }
  `;
  document.head.appendChild(style);
}

function setupCheckout() {
  document.getElementById("checkout-button")?.addEventListener("click", openCheckout);
  document.getElementById("confirm-checkout")?.addEventListener("click", handleCheckoutSubmit);
  document.getElementById("lookup-cep")?.addEventListener("click", lookupCep);
  document.getElementById("use-location")?.addEventListener("click", useCurrentLocation);
  document.getElementById("customer-cep")?.addEventListener("blur", () => {
    if (normalizeCep(document.getElementById("customer-cep").value).length === 8) {
      lookupCep();
    }
  });

  document.querySelectorAll('input[name="delivery-method"]').forEach((input) => {
    input.addEventListener("change", updateShippingEstimate);
  });

  [
    "customer-name",
    "customer-email",
    "customer-phone",
    "customer-cep",
    "customer-street",
    "customer-number",
    "customer-neighborhood",
    "customer-city",
    "customer-state",
    "customer-complement"
  ].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", updateCartUI);
  });

  ["customer-name", "customer-phone", "customer-cep", "customer-city", "customer-state"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", function () {
      this.classList.remove("field-error");
      const banner = document.getElementById("checkout-error-banner");
      if (banner) banner.remove();
    });
  });
}

function setupSmokeEffect() {
  const canvas = document.getElementById("smoke");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let particles = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = Math.max(window.innerHeight, document.querySelector(".hero")?.offsetHeight || window.innerHeight);
  }

  function createParticle() {
    return {
      x: Math.random() * canvas.width,
      y: canvas.height + Math.random() * 120,
      radius: Math.random() * 90 + 24,
      speedY: Math.random() * 0.7 + 0.18,
      drift: Math.random() * 0.6 - 0.3,
      alpha: Math.random() * 0.09 + 0.03
    };
  }

  function init() {
    particles = Array.from({ length: 54 }, createParticle);
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const particle of particles) {
      particle.y -= particle.speedY;
      particle.x += particle.drift;

      if (particle.y < -120) {
        particle.y = canvas.height + 120;
        particle.x = Math.random() * canvas.width;
      }

      const gradient = ctx.createRadialGradient(
        particle.x,
        particle.y,
        1,
        particle.x,
        particle.y,
        particle.radius
      );
      gradient.addColorStop(0, `rgba(245, 240, 232, ${particle.alpha})`);
      gradient.addColorStop(0.5, `rgba(245, 240, 232, ${particle.alpha * 0.5})`);
      gradient.addColorStop(1, "rgba(245, 240, 232, 0)");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(animate);
  }

  window.addEventListener("resize", () => {
    resize();
    init();
  });

  resize();
  init();
  animate();
}

function setupGlobalInteractions() {
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeCheckout();
      toggleCart(false);
      closeLanguageMenu();
    }
  });

  document.addEventListener("click", (event) => {
    const switcher = document.querySelector("[data-language-switcher]");
    if (!switcher || switcher.contains(event.target)) return;
    closeLanguageMenu();
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await detectApiBase();
  await loadRuntimeConfig();
  await loadProducts();
  setupCatalogNavigation();
  setupCheckout();
  setupOrderTrackingLookup();
  setupPaymentSuccessStyles();
  setupSmokeEffect();
  setupGlobalInteractions();
  window.addEventListener("beforeunload", stopOrderTrackingPolling);
  applyLocale(currentLocale);
  updateShippingEstimate();
  updateCartUI();
  await handlePaymentReturn();
  await loadStoredOrderTracker();
  document.getElementById("language-toggle")?.addEventListener("click", toggleLanguageMenu);
  document.querySelectorAll("[data-locale-option]").forEach((button) => {
    button.addEventListener("click", () => {
      applyLocale(button.dataset.localeOption);
      closeLanguageMenu();
    });
  });

  const params = new URLSearchParams(window.location.search);
  if (params.get("new_product") === "1" && !highlightedProductId) {
    window.setTimeout(scrollToProducts, 250);
  }
});

(function () {
  const _orig = addToCart;
  addToCart = function (productId, size, opts) {
    const product = resolveProductById(productId);
    if (!product || product.price <= 0 || (typeof product.stock === "number" && product.stock === 0)) return;

    const finalSize = size || getDefaultProductSize(product);
    const selectedColor = (opts && opts.color) ? opts.color : "";
    const cartKey = buildCartKey(product.id, finalSize) + (selectedColor ? `__${selectedColor}` : "");
    const existingItem = cart.find((item) => item.cartKey === cartKey);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        cartKey,
        productId: product.id,
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        category: product.category,
        size: finalSize,
        color: selectedColor || undefined,
        image: product.image || ""
      });
    }

    persistCart();
    updateCartUI();
    toggleCart(true);
  };
})();

