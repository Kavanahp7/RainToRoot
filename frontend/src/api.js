const defaultApiUrl =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "http://127.0.0.1:5000";

export const API_URL = (import.meta.env.VITE_API_URL || defaultApiUrl).replace(/\/+$/, "");

export async function apiFetch(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers || {});
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    headers.set("X-CSRF-Token", localStorage.getItem("raintorootCsrf") || "");
  }
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include"
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(body.error || body.message || "Request failed.");
    err.status = response.status;
    throw err;
  }
  return body;
}
