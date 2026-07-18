// Backend bilan gaplashish uchun yagona joy.
// Serverni boshqa manzilga ko'chirsangiz, faqat shu bitta o'zgaruvchini yangilang:
// .env faylga VITE_API_URL=https://sizning-serveringiz.com qo'ying.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const TOKEN_KEY = "tezprava_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `So'rov muvaffaqiyatsiz (${res.status})`);
  }
  return data;
}

export const api = {
  loginWithTelegram: (initData) =>
    request("/api/auth/telegram", { method: "POST", body: { initData }, auth: false }),
  searchUsers: (query) =>
    request(`/api/admin/users?query=${encodeURIComponent(query)}`),
};
