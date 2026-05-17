const PRODUCTION_API_URL = "https://bigsmokestyle-backend.onrender.com";
const API_BASE_URL = (import.meta.env.VITE_API_URL || "").trim();

export function getApiBaseUrl() {
  if (API_BASE_URL) {
    return API_BASE_URL;
  }

  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  return isLocalhost ? "http://localhost:3000" : PRODUCTION_API_URL;
}

export function buildApiUrl(path) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = getApiBaseUrl();

  return new URL(normalizedPath, base).toString();
}

export const apiUrl = buildApiUrl;

export async function apiFetch(path, options = {}) {
  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  if (!response.ok) {
    throw new Error(data?.error || "A API não respondeu em JSON. Verifique se o backend está rodando na porta 3000.");
  }
  return data;
}
