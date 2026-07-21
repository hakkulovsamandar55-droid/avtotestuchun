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

// Rasm/fayl yuklash uchun alohida — FormData bilan, Content-Type header qo'lda
// qo'yilmaydi (brauzer o'zi to'g'ri boundary bilan qo'yadi).
async function uploadRequest(path, { method = "POST", file, fieldName, extraFields = {} } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const formData = new FormData();
  formData.append(fieldName, file);
  for (const [key, value] of Object.entries(extraFields)) {
    formData.append(key, value);
  }

  const res = await fetch(`${API_URL}${path}`, { method, headers, body: formData });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `So'rov muvaffaqiyatsiz (${res.status})`);
    err.code = data.error;
    throw err;
  }
  return data;
}

// API_URL ni /uploads dagi rasm manzillariga qo'shib to'liq URL yasaydi
export function resolveUploadUrl(relativeUrl) {
  if (!relativeUrl) return relativeUrl;
  if (relativeUrl.startsWith("http")) return relativeUrl;
  return `${API_URL}${relativeUrl}`;
}

export const api = {
  loginWithTelegram: (initData) =>
    request("/api/auth/telegram", { method: "POST", body: { initData }, auth: false }),
  searchUsers: (query) =>
    request(`/api/admin/users?query=${encodeURIComponent(query)}`),
  setUserRole: (id, role) =>
    request(`/api/admin/users/${id}/role`, { method: "PATCH", body: { role } }),
  setUserPremium: (id, isPremium, extra = {}) =>
    request(`/api/admin/users/${id}/premium`, { method: "PATCH", body: { isPremium, ...extra } }),
  extendPremium: (id, days) =>
    request(`/api/admin/users/${id}/premium/extend`, { method: "PATCH", body: { days } }),
  setUserBlocked: (id, blocked, reason) =>
    request(`/api/admin/users/${id}/block`, { method: "PATCH", body: { blocked, reason } }),
  deleteUser: (id) => request(`/api/admin/users/${id}`, { method: "DELETE" }),
  getUserProfile: (id) => request(`/api/admin/users/${id}/profile`),
  setUserDiscount: (id, percent, expiresAt) =>
    request(`/api/admin/users/${id}/discount`, { method: "PATCH", body: { percent, expiresAt } }),
  removeUserDiscount: (id) => request(`/api/admin/users/${id}/discount`, { method: "DELETE" }),
  sendBroadcast: (text, audience, userIds) =>
    request("/api/admin/broadcast", { method: "POST", body: { text, audience, userIds } }),
  getAdminLogs: () => request("/api/admin/logs"),

  // Support — foydalanuvchi
  getMyConversation: () => request("/api/support/conversation"),
  sendSupportMessage: (text) =>
    request("/api/support/message", { method: "POST", body: { text } }),
  sendSupportImage: (file) =>
    uploadRequest("/api/support/message/image", { file, fieldName: "image" }),

  // Support — admin
  getConversations: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/admin/support/conversations${qs ? `?${qs}` : ""}`);
  },
  getConversation: (id) => request(`/api/admin/support/conversations/${id}`),
  replyToConversation: (id, text) =>
    request(`/api/admin/support/conversations/${id}/reply`, { method: "POST", body: { text } }),
  replyToConversationImage: (id, file) =>
    uploadRequest(`/api/admin/support/conversations/${id}/reply-image`, { file, fieldName: "image" }),
  setConversationStatus: (id, status) =>
    request(`/api/admin/support/conversations/${id}/status`, { method: "PATCH", body: { status } }),

  // To'lovlar — foydalanuvchi
  getCardInfo: () => request("/api/payments/card-info"),
  getPlanPrice: (planKey) => request(`/api/payments/plan-price/${planKey}`),
  getMyPayments: () => request("/api/payments/mine"),
  submitPayment: (file, planKey) =>
    uploadRequest("/api/payments/submit", { file, fieldName: "receipt", extraFields: { planKey } }),

  // To'lovlar — admin
  getPayments: (status) => request(`/api/admin/payments${status ? `?status=${status}` : ""}`),
  approvePayment: (id) => request(`/api/admin/payments/${id}/approve`, { method: "POST" }),
  rejectPayment: (id, reason) =>
    request(`/api/admin/payments/${id}/reject`, { method: "POST", body: { reason } }),

  // Bildirishnomalar — admin
  getNotifications: () => request("/api/admin/notifications"),
  markNotificationRead: (id) => request(`/api/admin/notifications/${id}/read`, { method: "PATCH" }),
  markAllNotificationsRead: () => request("/api/admin/notifications/read-all", { method: "PATCH" }),

  recordAttempt: (attempt) =>
    request("/api/stats/attempt", { method: "POST", body: attempt }),
  getMyStats: () => request("/api/stats/me"),
};

// Hali backend/to'lov integratsiyasi ulanmagan tugmalar uchun:
// bosilganda "hech narsa bo'lmayapti" taassurotini bermaslik uchun
// Telegramning o'z native popup'ini ko'rsatadi (Telegramdan tashqarida — oddiy alert).
export function showComingSoon(message) {
  const tg = window.Telegram?.WebApp;
  if (tg?.showAlert) {
    tg.showAlert(message);
  } else {
    window.alert(message);
  }
}
