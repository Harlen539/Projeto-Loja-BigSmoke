const explicitBase = import.meta.env.VITE_API_URL || "";

export function apiUrl(path) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
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
    throw new Error(data?.error || "Erro ao falar com a API.");
  }
  return data;
}
