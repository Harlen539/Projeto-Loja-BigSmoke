const runtimeBase = typeof window !== "undefined" && window.BIGSMOKE_API_URL && !String(window.BIGSMOKE_API_URL).includes("%VITE_")
  ? String(window.BIGSMOKE_API_URL).trim()
  : "";
const explicitBase = import.meta.env.VITE_API_URL || runtimeBase;

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
