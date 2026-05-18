const DEFAULT_STORE_URL = "https://bigsmokestyle.vercel.app";

export function getStoreBaseUrl() {
  const configuredUrl = String(import.meta.env.VITE_STORE_URL || "").trim();
  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  return isLocalhost ? "http://localhost:5173" : DEFAULT_STORE_URL;
}

export function getStoreUrl(path = "/") {
  return new URL(path, `${getStoreBaseUrl()}/`).toString();
}
