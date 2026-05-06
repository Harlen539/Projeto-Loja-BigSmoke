const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

process.env.BIGSMOKE_DATA_DIR = path.join(os.tmpdir(), `bigsmoke-data-${process.pid}`);
process.env.BIGSMOKE_UPLOADS_DIR = path.join(os.tmpdir(), `bigsmoke-uploads-${process.pid}`);
process.env.JWT_SECRET = "test-secret-with-at-least-32-characters";
process.env.ADMIN_EMAIL = "admin@bigsmoke.local";
process.env.ADMIN_PASSWORD = "admin123456789";
process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_dummy";
process.env.STRIPE_MOCK = "true";

const { start, __internals } = require("../src/server");

let server;
let baseUrl;
let token;
let createdProductId;

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

test("customer orders endpoint returns public orders by email", async () => {
  const response = await fetch(`${baseUrl}/api/orders/customer/${encodeURIComponent("manual@teste.com")}`);

  assert.equal(response.status, 200);
  const orders = await response.json();
  assert.ok(Array.isArray(orders));
  assert.ok(orders.some((order) => order.customer?.email === "m***@teste.com"));
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
  assert.ok(data.url);
  assert.ok(data.orderId);

  const ordersResponse = await fetch(`${baseUrl}/api/admin/orders?query=cliente&page=1&limit=10`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const ordersData = await ordersResponse.json();
  assert.ok(ordersData.items.some((order) => order.id === data.orderId));
});

test("stripe webhook marks order as paid", async () => {
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
    id: "evt_test_checkout_completed",
    type: "checkout.session.completed",
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: sessionData.id,
        payment_intent: "pi_test_123"
      }
    }
  });

  const signature = __internals.stripe.webhooks.generateTestHeaderString({
    payload,
    secret: __internals.WEBHOOK_SECRET
  });

  const webhookResponse = await fetch(`${baseUrl}/api/stripe/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Stripe-Signature": signature
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
  assert.equal(order.paymentIntentId, "pi_test_123");
});
