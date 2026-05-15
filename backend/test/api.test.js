const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const jwt = require("jsonwebtoken");

process.env.BIGSMOKE_DATA_DIR = path.join(os.tmpdir(), `bigsmoke-data-${process.pid}`);
process.env.BIGSMOKE_UPLOADS_DIR = path.join(os.tmpdir(), `bigsmoke-uploads-${process.pid}`);
process.env.JWT_SECRET = "test-secret-with-at-least-32-characters";
process.env.ADMIN_EMAIL = "admin@bigsmoke.local";
process.env.ADMIN_PASSWORD = "admin123456789";
process.env.ABACATEPAY_API_KEY = "test_abacatepay_dummy";
process.env.ABACATEPAY_WEBHOOK_SECRET = "test_webhook_secret";
process.env.ABACATEPAY_API_URL = "https://api.abacatepay.com/v2";

const originalFetch = global.fetch;
let abacateRequestCount = 0;
global.fetch = async (url, options = {}) => {
  const requestUrl = String(url);
  if (requestUrl.startsWith("https://api.abacatepay.com/v2")) {
    abacateRequestCount += 1;
    const body = options.body ? JSON.parse(options.body) : {};
    if (requestUrl.endsWith("/transparents/create")) {
      return new Response(JSON.stringify({
        success: true,
        error: null,
        data: {
          id: `pix_test_${abacateRequestCount}`,
          amount: body.data?.amount || 100,
          status: "PENDING",
          brCode: "pix-copia-e-cola-teste",
          brCodeBase64: "data:image/png;base64,AAAA",
          expiresAt: "2026-05-15T12:00:00.000Z",
          externalId: body.data?.externalId || ""
        }
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (requestUrl.endsWith("/products/create")) {
      return new Response(JSON.stringify({
        success: true,
        error: null,
        data: {
          id: `prod_test_${abacateRequestCount}`,
          externalId: body.externalId,
          name: body.name,
          price: body.price,
          currency: "BRL",
          status: "ACTIVE"
        }
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (requestUrl.endsWith("/checkouts/create")) {
      return new Response(JSON.stringify({
        success: true,
        error: null,
        data: {
          id: `checkout_test_${abacateRequestCount}`,
          externalId: body.externalId,
          url: "https://app.abacatepay.com/pay/checkout_test",
          status: "PENDING"
        }
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
  }
  return originalFetch(url, options);
};

const { start } = require("../src/server");

let server;
let baseUrl;
let token;
let createdProductId;

function collectStringValues(value, output = []) {
  if (typeof value === "string") {
    output.push(value);
    return output;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectStringValues(item, output));
    return output;
  }
  if (value && typeof value === "object") {
    Object.values(value).forEach((item) => collectStringValues(item, output));
  }
  return output;
}

function assertNoXssValues(value) {
  const joined = collectStringValues(value).join(" ");
  assert.doesNotMatch(joined, /<|>|javascript:|onerror|onload|iframe|object|embed|svg|script/i);
}

test.before(async () => {
  await fs.rm(process.env.BIGSMOKE_DATA_DIR, { recursive: true, force: true });
  await fs.rm(process.env.BIGSMOKE_UPLOADS_DIR, { recursive: true, force: true });
  server = await start(0);
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  global.fetch = originalFetch;
});

test("login returns a token", async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@bigsmoke.local",
      password: "admin123456789"
    })
  });

  assert.equal(response.status, 200);
  const data = await response.json();
  assert.ok(data.token);
  token = data.token;
});

test("admin can create and search products", async () => {
  const createResponse = await fetch(`${baseUrl}/api/admin/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      name: "Hoodie Teste",
      category: "Moletons",
      price: 199.9,
      stock: 7,
      image: "https://example.com/hoodie.jpg",
      badge: "Teste",
      sizes: "M, G",
      description: "Peça criada nos testes.",
      active: true,
      featured: true
    })
  });

  assert.equal(createResponse.status, 201);
  const created = await createResponse.json();
  createdProductId = created.id;
  assert.equal(created.stock, 7);

  const searchResponse = await fetch(`${baseUrl}/api/admin/products?query=hoodie&status=active&featured=featured&page=1&limit=10`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  assert.equal(searchResponse.status, 200);
  const data = await searchResponse.json();
  assert.ok(data.items.some((product) => product.name === "Hoodie Teste"));
});

test("admin can update stock", async () => {
  const response = await fetch(`${baseUrl}/api/admin/products/${createdProductId}/stock`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ stock: 3 })
  });

  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.stock, 3);
});

test("manual paid order debits product stock", async () => {
  const response = await fetch(`${baseUrl}/api/admin/orders/manual`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      status: "processing",
      customer: {
        name: "Manual Cliente",
        email: "manual@teste.com",
        phone: "5583986494691"
      },
      items: [
        {
          id: createdProductId,
          name: "Hoodie Teste",
          price: 199.9,
          quantity: 2
        }
      ]
    })
  });

  assert.equal(response.status, 201);

  const productResponse = await fetch(`${baseUrl}/api/admin/products?query=hoodie&page=1&limit=10`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const productsData = await productResponse.json();
  const product = productsData.items.find((entry) => entry.id === createdProductId);
  assert.equal(product.stock, 1);
});

test("customer tokens cannot access admin endpoints", async () => {
  const customerToken = jwt.sign({ email: "manual@teste.com", role: "customer" }, process.env.JWT_SECRET, { expiresIn: "1h" });
  const response = await fetch(`${baseUrl}/api/admin/orders`, {
    headers: { Authorization: `Bearer ${customerToken}` }
  });

  assert.equal(response.status, 403);
});

test("customer orders endpoint requires matching authenticated email", async () => {
  const customerToken = jwt.sign({ email: "manual@teste.com", role: "customer" }, process.env.JWT_SECRET, { expiresIn: "1h" });
  const response = await fetch(`${baseUrl}/api/orders/customer/${encodeURIComponent("manual@teste.com")}`, {
    headers: { Authorization: `Bearer ${customerToken}` }
  });

  assert.equal(response.status, 200);
  const orders = await response.json();
  assert.ok(Array.isArray(orders));
  assert.ok(orders.some((order) => order.customer?.email === "m***@teste.com"));

  const forbiddenResponse = await fetch(`${baseUrl}/api/orders/customer/${encodeURIComponent("outra@teste.com")}`, {
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  assert.equal(forbiddenResponse.status, 403);
});

test("admin status changes debit and restore stock once", async () => {
  const createProductResponse = await fetch(`${baseUrl}/api/admin/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      name: "Calca Status Teste",
      category: "Calcas",
      price: 149.9,
      stock: 5,
      image: "https://example.com/calca.jpg",
      sizes: "M",
      description: "Produto para teste de status.",
      active: true
    })
  });
  const statusProduct = await createProductResponse.json();

  const orderResponse = await fetch(`${baseUrl}/api/admin/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      status: "pending",
      customer: {
        name: "Status Cliente",
        email: "status@teste.com"
      },
      items: [
        {
          id: statusProduct.id,
          name: statusProduct.name,
          price: statusProduct.price,
          quantity: 2
        }
      ]
    })
  });
  const order = await orderResponse.json();

  const processingResponse = await fetch(`${baseUrl}/api/admin/orders/${order.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status: "processing" })
  });
  assert.equal(processingResponse.status, 200);

  const deliveredResponse = await fetch(`${baseUrl}/api/admin/orders/${order.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status: "delivered" })
  });
  assert.equal(deliveredResponse.status, 200);

  let productResponse = await fetch(`${baseUrl}/api/admin/products?query=calca&page=1&limit=10`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  let productsData = await productResponse.json();
  let product = productsData.items.find((entry) => entry.id === statusProduct.id);
  assert.equal(product.stock, 3);

  const cancelResponse = await fetch(`${baseUrl}/api/admin/orders/${order.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status: "canceled" })
  });
  assert.equal(cancelResponse.status, 200);

  productResponse = await fetch(`${baseUrl}/api/admin/products?query=calca&page=1&limit=10`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  productsData = await productResponse.json();
  product = productsData.items.find((entry) => entry.id === statusProduct.id);
  assert.equal(product.stock, 5);
});

test("infinite stock products are not decremented", async () => {
  const createProductResponse = await fetch(`${baseUrl}/api/admin/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      name: "Gift Card Infinito",
      category: "Digital",
      price: 50,
      stock: -1,
      image: "https://example.com/gift-card.jpg",
      sizes: "Unico",
      description: "Produto com estoque infinito.",
      active: true
    })
  });
  const infiniteProduct = await createProductResponse.json();

  const orderResponse = await fetch(`${baseUrl}/api/admin/orders/manual`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      status: "processing",
      customer: {
        name: "Infinito Cliente",
        email: "infinito@teste.com"
      },
      items: [
        {
          id: infiniteProduct.id,
          name: infiniteProduct.name,
          price: infiniteProduct.price,
          quantity: 100
        }
      ]
    })
  });
  assert.equal(orderResponse.status, 201);

  const productResponse = await fetch(`${baseUrl}/api/admin/products?query=gift&page=1&limit=10`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const productsData = await productResponse.json();
  const product = productsData.items.find((entry) => entry.id === infiniteProduct.id);
  assert.equal(product.stock, -1);
});

test("checkout session creates a pending order", async () => {
  const response = await fetch(`${baseUrl}/api/checkout/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: {
      name: "Cliente Teste",
      email: "cliente@teste.com",
      phone: "5583986494691"
      },
      address: {
        cep: "60000000",
        city: "Fortaleza",
        state: "CE"
      },
      deliveryMethod: "retirada",
      paymentMethod: "pix",
      items: [
        {
          id: "camiseta-oversized",
          quantity: 1
        }
      ]
    })
  });

  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.provider, "abacatepay");
  assert.equal(data.method, "pix");
  assert.ok(data.pix.copyPaste);
  assert.ok(data.orderId);

  const ordersResponse = await fetch(`${baseUrl}/api/admin/orders?query=cliente&page=1&limit=10`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const ordersData = await ordersResponse.json();
  assert.ok(ordersData.items.some((order) => order.id === data.orderId));
});

test("checkout session creates a card payment URL", async () => {
  const response = await fetch(`${baseUrl}/api/checkout/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: {
        name: "Cliente Cartao",
        email: "cartao@teste.com",
        phone: "5583986494691"
      },
      deliveryMethod: "retirada",
      paymentMethod: "card",
      items: [
        {
          id: "moletom-classic",
          quantity: 1
        }
      ]
    })
  });

  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.provider, "abacatepay");
  assert.equal(data.method, "card");
  assert.ok(data.paymentUrl);
  assert.ok(data.orderId);
});

test("abacatepay webhook marks order as paid", async () => {
  const sessionResponse = await fetch(`${baseUrl}/api/checkout/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: {
      name: "Webhook Cliente",
      email: "webhook@teste.com",
      phone: "5583986494691"
      },
      address: {
        cep: "60000000",
        city: "Fortaleza",
        state: "CE"
      },
      deliveryMethod: "retirada",
      paymentMethod: "pix",
      items: [
        {
          id: "moletom-classic",
          quantity: 1
        }
      ]
    })
  });

  const sessionData = await sessionResponse.json();
  const payload = JSON.stringify({
    id: "evt_test_transparent_completed",
    event: "transparent.completed",
    data: {
      transparent: {
        id: sessionData.id,
        externalId: sessionData.orderId,
        receiptUrl: "https://app.abacatepay.com/receipt/test"
      }
    }
  });

  const webhookResponse = await fetch(`${baseUrl}/api/webhooks/abacatepay`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-secret": "test_webhook_secret"
    },
    body: payload
  });

  assert.equal(webhookResponse.status, 200);

  const orderResponse = await fetch(`${baseUrl}/api/admin/orders/${sessionData.orderId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const order = await orderResponse.json();
  assert.equal(order.status, "paid");
  assert.equal(order.paymentId, sessionData.id);
  assert.equal(order.paymentProvider, "abacatepay");
});

test("security headers include baseline XSS protections", async () => {
  const response = await fetch(`${baseUrl}/health`);

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.deepEqual(payload, {
    status: "ok",
    service: "bigsmoke-backend"
  });
});

test("healthz returns deployment diagnostics", async () => {
  const response = await fetch(`${baseUrl}/healthz`);

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.status, "ok");
  assert.equal(payload.service, "bigsmoke-backend");
  assert.match(response.headers.get("content-security-policy") || "", /object-src 'none'/);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "SAMEORIGIN");
  assert.match(response.headers.get("referrer-policy") || "", /strict-origin-when-cross-origin/);
  assert.match(response.headers.get("permissions-policy") || "", /camera=\(\)/);
});

test("admin product input is sanitized before storage", async () => {
  const response = await fetch(`${baseUrl}/api/admin/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      id: "xss-product<script>",
      name: "Produto <img src=x onerror=bad()> Seguro",
      category: "Categoria <svg onload=bad()>",
      description: "Descricao <script>bad()</script> javascript:alert(1)",
      price: 10,
      stock: 2,
      image: "javascript:alert(1)",
      badge: "<iframe src=x></iframe>",
      sizes: "P, <object data=x></object>",
      colors: [{
        name: "Azul <img onerror=bad()>",
        hex: "javascript:alert(1)",
        images: ["javascript:alert(1)"]
      }]
    })
  });

  assert.equal(response.status, 201);
  const product = await response.json();
  assert.equal(product.image, "");
  assert.equal(product.colors[0].hex, "#888888");
  assert.equal(product.colors[0].images.length, 0);
  assertNoXssValues(product);
});

test("admin can manage coupons and checkout applies product discounts", async () => {
  const createCouponResponse = await fetch(`${baseUrl}/api/admin/coupons`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      code: "TESTE15",
      type: "percent",
      target: "products",
      value: 15,
      active: true,
      minOrderValue: 100
    })
  });

  assert.equal(createCouponResponse.status, 201);
  const coupon = await createCouponResponse.json();
  assert.equal(coupon.code, "TESTE15");
  assert.equal(coupon.target, "products");

  const publicCouponsResponse = await fetch(`${baseUrl}/api/coupons`);
  const publicCoupons = await publicCouponsResponse.json();
  assert.ok(publicCoupons.some((item) => item.code === "TESTE15"));

  const checkoutResponse = await fetch(`${baseUrl}/api/checkout/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      couponCode: "TESTE15",
      customer: {
        name: "Cupom Cliente",
        email: "cupom@teste.com",
        phone: "5583986494691"
      },
      address: {
        cep: "60000000",
        city: "Fortaleza",
        state: "CE"
      },
      deliveryMethod: "retirada",
      paymentMethod: "pix",
      items: [{ id: "moletom-classic", quantity: 1 }]
    })
  });

  assert.equal(checkoutResponse.status, 200);
  const checkout = await checkoutResponse.json();
  assert.equal(checkout.coupon.code, "TESTE15");
  assert.ok(checkout.productDiscountAmount > 0);
  assert.equal(checkout.shippingDiscountAmount, 0);
  assert.ok(checkout.amountTotal < checkout.amountSubtotal);
});

test("checkout applies shipping coupons only to freight", async () => {
  const couponResponse = await fetch(`${baseUrl}/api/admin/coupons`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      code: "FRETEGRATIS",
      type: "fixed",
      target: "shipping",
      value: 999,
      active: true,
      minOrderValue: 0
    })
  });
  assert.equal(couponResponse.status, 201);

  const checkoutResponse = await fetch(`${baseUrl}/api/checkout/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      couponCode: "FRETEGRATIS",
      customer: {
        name: "Frete Cliente",
        email: "frete@teste.com",
        phone: "5583986494691"
      },
      address: {
        cep: "60000000",
        street: "Rua Teste",
        city: "Fortaleza",
        state: "CE"
      },
      deliveryMethod: "national",
      paymentMethod: "pix",
      items: [{ id: "moletom-classic", quantity: 1 }]
    })
  });

  assert.equal(checkoutResponse.status, 200);
  const checkout = await checkoutResponse.json();
  assert.equal(checkout.coupon.code, "FRETEGRATIS");
  assert.equal(checkout.productDiscountAmount, 0);
  assert.ok(checkout.shippingDiscountAmount > 0);
  assert.equal(checkout.shippingAmount, 0);
  assert.equal(checkout.amountTotal, checkout.amountSubtotal);
});

test("order and checkout customer input is sanitized before storage", async () => {
  const manualResponse = await fetch(`${baseUrl}/api/admin/orders/manual`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      status: "pending",
      customer: {
        name: "Cliente <img src=x onerror=bad()>",
        email: "pedido@teste.com",
        phone: "5583986494691"
      },
      address: {
        street: "Rua <script>bad()</script>",
        complement: "javascript:alert(1)"
      },
      trackingUrl: "javascript:alert(1)",
      items: [{
        id: createdProductId,
        name: "Item <svg onload=bad()>",
        price: 10,
        quantity: 1,
        image: "javascript:alert(1)",
        size: "G <iframe></iframe>"
      }]
    })
  });

  assert.equal(manualResponse.status, 201);
  const manualOrder = await manualResponse.json();
  assert.notEqual(manualOrder.trackingUrl, "javascript:alert(1)");
  assert.equal(manualOrder.items[0].image, "");
  assertNoXssValues(manualOrder);

  const checkoutResponse = await fetch(`${baseUrl}/api/checkout/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer: {
        name: "Checkout <script>bad()</script>",
        email: "checkout-xss@teste.com",
        phone: "5583986494691"
      },
      address: {
        cep: "60000000",
        city: "Fortaleza <img onerror=bad()>",
        state: "CE"
      },
      deliveryMethod: "retirada",
      paymentMethod: "pix",
      items: [{ id: "moletom-classic", quantity: 1 }]
    })
  });

  assert.equal(checkoutResponse.status, 200);
  const checkout = await checkoutResponse.json();
  const orderResponse = await fetch(`${baseUrl}/api/admin/orders/${checkout.orderId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const checkoutOrder = await orderResponse.json();
  assertNoXssValues(checkoutOrder);
});
