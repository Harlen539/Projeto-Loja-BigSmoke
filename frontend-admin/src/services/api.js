const runtimeBase = typeof window !== "undefined" && window.BIGSMOKE_API_URL && !String(window.BIGSMOKE_API_URL).includes("%VITE_")
  ? String(window.BIGSMOKE_API_URL).trim()
  : "";
const explicitBase = import.meta.env.VITE_API_URL || runtimeBase;

export function apiUrl(path) {
  const base = explicitBase || window.location.origin;
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function apiFetch(path, options = {}) {
  const response = await fetch(apiUrl(path), {
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
