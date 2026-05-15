const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export function buildApiUrl(path) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  const fallbackBase = isLocalhost ? "http://localhost:3000" : "";
  const base = API_BASE_URL || fallbackBase;

  if (!base) {
    return normalizedPath;
  }

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
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(data?.error || "Erro na API.");
  }
  return data;
}
