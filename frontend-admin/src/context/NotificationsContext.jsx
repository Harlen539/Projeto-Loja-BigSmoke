import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { useAuth } from "../hooks/useAuth.js";
import { apiFetch } from "../services/api.js";

const NotificationsContext = createContext(null);
const READ_KEY = "bigsmoke-admin-read-notifications";
const SNAPSHOT_KEY = "bigsmoke-admin-notification-snapshot";
const LOW_STOCK_LIMIT = 30;

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function orderTotal(order) {
  return Number(order.amountTotal || order.total || order.totalAmount || 0);
}

function orderCustomer(order) {
  return order.customer?.name || order.customerName || order.name || "Cliente";
}

function orderNumber(order) {
  return order.orderNumberFormatted || `#${String(order.id || "").slice(0, 6) || "0000"}`;
}

function signatureOf(item) {
  return JSON.stringify([
    item.updatedAt || "",
    item.createdAt || "",
    item.status || "",
    item.stock ?? "",
    item.price ?? "",
    item.active ?? "",
    item.name || "",
  ]);
}

function statusLabel(status) {
  const map = {
    pending: "pendente",
    pending_payment: "aguardando pagamento",
    paid: "pago",
    processing: "em preparo",
    shipped: "enviado",
    fulfilled: "enviado",
    delivered: "entregue",
    canceled: "cancelado",
    cancelled: "cancelado",
    refunded: "reembolsado",
  };
  return map[String(status || "").toLowerCase()] || "atualizado";
}

function getSnapshotKey(type, item) {
  return `${type}:${item.id || item.orderNumberFormatted || item.name}`;
}

function buildNotifications({ orders, products, previousSnapshot }) {
  const nextSnapshot = {};
  const items = [];
  const now = Date.now();
  const recentWindow = 7 * 24 * 60 * 60 * 1000;
  const paidStatuses = new Set(["paid", "processing", "shipped", "fulfilled", "delivered"]);

  orders.forEach((order) => {
    const key = getSnapshotKey("order", order);
    const signature = signatureOf(order);
    nextSnapshot[key] = signature;
    const createdAt = new Date(order.createdAt || order.updatedAt || now).getTime();
    const isRecent = now - createdAt <= recentWindow;
    const status = String(order.status || "").toLowerCase();

    if (isRecent || previousSnapshot[key] !== signature) {
      items.push({
        id: `order:${order.id || order.orderNumberFormatted}:${signature}`,
        type: paidStatuses.has(status) ? "success" : "warning",
        title: paidStatuses.has(status) ? "Pedido pago" : "Pedido atualizado",
        message: `${orderNumber(order)} - ${orderCustomer(order)} - ${money(orderTotal(order))}`,
        meta: `Status ${statusLabel(status)}`,
        route: "/pedidos",
        createdAt: order.updatedAt || order.createdAt || new Date().toISOString(),
      });
    }
  });

  products.forEach((product) => {
    const key = getSnapshotKey("product", product);
    const signature = signatureOf(product);
    nextSnapshot[key] = signature;
    const stock = Number(product.stock || 0);
    const name = product.name || "Produto";
    const updatedAt = product.updatedAt || product.createdAt || new Date().toISOString();

    if (stock <= LOW_STOCK_LIMIT) {
      items.push({
        id: `stock:${product.id || name}:${stock}`,
        type: stock <= 0 ? "danger" : "stock",
        title: stock <= 0 ? "Produto sem estoque" : "Alerta de estoque",
        message: `${name} esta com ${stock} restante${stock === 1 ? "" : "s"}`,
        meta: "Revisar catalogo",
        route: "/produtos",
        createdAt: updatedAt,
      });
    }

    if (previousSnapshot[key] && previousSnapshot[key] !== signature) {
      items.push({
        id: `product:${product.id || name}:${signature}`,
        type: "info",
        title: "Produto atualizado",
        message: name,
        meta: "Alteracao no catalogo da loja",
        route: "/produtos",
        createdAt: updatedAt,
      });
    }
  });

  Object.keys(previousSnapshot).forEach((key) => {
    if (!nextSnapshot[key] && key.startsWith("product:")) {
      items.push({
        id: `removed:${key}:${now}`,
        type: "info",
        title: "Produto removido",
        message: key.replace("product:", ""),
        meta: "Catalogo atualizado",
        route: "/produtos",
        createdAt: new Date().toISOString(),
      });
    }
  });

  return {
    notifications: items
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 12),
    snapshot: nextSnapshot,
  };
}

export function AdminNotificationsProvider({ children }) {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(() => new Set(readJson(READ_KEY, [])));
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [productData, orderData] = await Promise.all([
        apiFetch("/api/admin/products?limit=100", { headers: { Authorization: `Bearer ${token}` } }),
        apiFetch("/api/admin/orders?limit=100", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const previousSnapshot = readJson(SNAPSHOT_KEY, {});
      const products = productData.items || productData.products || productData || [];
      const orders = orderData.items || orderData.orders || orderData || [];
      const next = buildNotifications({ orders, products, previousSnapshot });
      setNotifications(next.notifications);
      writeJson(SNAPSHOT_KEY, next.snapshot);
    } catch (error) {
      console.error("Erro ao carregar notificacoes", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;
    refresh();
    const timer = window.setInterval(refresh, 45000);
    const onFocus = () => refresh();
    const onDataUpdated = () => refresh();
    window.addEventListener("focus", onFocus);
    window.addEventListener("bigsmoke-admin-data-updated", onDataUpdated);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("bigsmoke-admin-data-updated", onDataUpdated);
    };
  }, [refresh, token]);

  const unreadCount = notifications.filter((item) => !readIds.has(item.id)).length;

  const markAllRead = useCallback(() => {
    const next = new Set([...readIds, ...notifications.map((item) => item.id)]);
    setReadIds(next);
    writeJson(READ_KEY, [...next]);
  }, [notifications, readIds]);

  const markRead = useCallback((id) => {
    const next = new Set(readIds);
    next.add(id);
    setReadIds(next);
    writeJson(READ_KEY, [...next]);
  }, [readIds]);

  const value = useMemo(() => ({
    loading,
    markAllRead,
    markRead,
    notifications,
    readIds,
    refresh,
    unreadCount,
  }), [loading, markAllRead, markRead, notifications, readIds, refresh, unreadCount]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useAdminNotifications() {
  const value = useContext(NotificationsContext);
  if (!value) {
    throw new Error("useAdminNotifications precisa estar dentro de AdminNotificationsProvider");
  }
  return value;
}
