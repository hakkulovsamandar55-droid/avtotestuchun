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

// Sessiya tugaganda (401) yoki hisob bloklanganda (403) ilova qayta login
// ekraniga qaytishi kerak. Ilgari bunday javoblar oddiy xato sifatida
// ko'rsatilardi va foydalanuvchi "hech narsa ishlamayapti" holatida qolardi.
let onSessionExpired = null;

export function setSessionExpiredHandler(handler) {
  onSessionExpired = handler;
}

function handleAuthFailure(status, message) {
  if (status === 401) {
    clearToken();
    onSessionExpired?.({ reason: "expired", message });
  } else if (status === 403 && /blok/i.test(message || "")) {
    clearToken();
    onSessionExpired?.({ reason: "blocked", message });
  }
}

// Tarmoq uzilishi yoki server javob bermasligi — bu `fetch` uchun throw
// bo'ladi va foydalanuvchi tushunarsiz "Failed to fetch" ko'radi.
// Shuning uchun aniq, tarjima qilingan xabarga aylantiramiz.
const NETWORK_ERROR_MESSAGE = "Internetga ulanishda muammo. Qaytadan urinib ko'ring.";

async function parseResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data.error || data.message || `So'rov muvaffaqiyatsiz (${res.status})`;
    handleAuthFailure(res.status, message);
    const err = new Error(message);
    err.status = res.status;
    err.code = data.error;
    throw err;
  }
  return data;
}

async function request(path, { method = "GET", body, auth = true, signal } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    // AbortError — komponent unmount bo'lgani uchun so'rov bekor qilindi,
    // bu xato emas, uni yuqoriga o'zgarishsiz uzatamiz.
    if (err.name === "AbortError") throw err;
    throw new Error(NETWORK_ERROR_MESSAGE);
  }

  return parseResponse(res);
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

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { method, headers, body: formData });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new Error(NETWORK_ERROR_MESSAGE);
  }

  return parseResponse(res);
}

// API_URL ni /uploads dagi rasm manzillariga qo'shib to'liq URL yasaydi
export function resolveUploadUrl(relativeUrl) {
  if (!relativeUrl) return relativeUrl;
  if (relativeUrl.startsWith("http")) return relativeUrl;
  return `${API_URL}${relativeUrl}`;
}

export const api = {
  loginWithTelegram: (initData, profile) =>
    request("/api/auth/telegram", { method: "POST", body: { initData, profile }, auth: false }),
  searchUsers: (query, filters = []) => {
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (filters.length > 0) params.set("filters", filters.join(","));
    return request(`/api/admin/users?${params.toString()}`);
  },
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
  setUserNotes: (id, notes) =>
    request(`/api/admin/users/${id}/notes`, { method: "PATCH", body: { notes } }),
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
  getPaymentSettings: () => request("/api/admin/payments/settings"),
  updatePaymentSettings: (cardNumber, cardOwner) =>
    request("/api/admin/payments/settings", { method: "PATCH", body: { cardNumber, cardOwner } }),
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

  // ===== Rasmiy imtihon (Official Exam) =====
  // Mashq imtihonidan alohida: savollar serverdan JAVOBSIZ keladi,
  // baholash ham serverda bo'ladi.
  examEligibility: () => request("/api/exam/eligibility"),
  examStart: () => request("/api/exam/start", { method: "POST" }),
  examActive: () => request("/api/exam/active"),
  examAnswer: (examId, questionIndex, chosenIndex) =>
    request(`/api/exam/${examId}/answer`, {
      method: "PATCH",
      body: { questionIndex, chosenIndex },
    }),
  examFocusLost: (examId) => request(`/api/exam/${examId}/focus-lost`, { method: "POST" }),
  examSubmit: (examId) => request(`/api/exam/${examId}/submit`, { method: "POST" }),
  examAbandon: (examId) => request(`/api/exam/${examId}/abandon`, { method: "POST" }),
  examReview: (examId) => request(`/api/exam/${examId}/review`),
  examHistory: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/exam/history${qs ? `?${qs}` : ""}`);
  },
  examLeaderboard: (period = "all_time", sort = "score") =>
    request(`/api/exam/leaderboard?period=${period}&sort=${sort}`),
  examMe: () => request("/api/exam/me"),
  setLeaderboardVisibility: (visible) =>
    request("/api/exam/leaderboard-visibility", { method: "PATCH", body: { visible } }),

  // Admin — imtihon analitikasi
  getExamAnalytics: () => request("/api/admin/exam/analytics"),
  getUserExamSummary: (userId) => request(`/api/admin/users/${userId}/exam-summary`),

  // ===== Haydovchilik maktablari (Driving School) =====
  schoolMe: () => request("/api/school/me"),
  schoolJoin: (code) => request("/api/school/join", { method: "POST", body: { code } }),
  schoolLeave: () => request("/api/school/leave", { method: "POST" }),
  schoolMyHomework: () => request("/api/school/my-homework"),

  schoolGet: (schoolId) => request(`/api/school/${schoolId}`),
  schoolUpdate: (schoolId, data) =>
    request(`/api/school/${schoolId}`, { method: "PATCH", body: data }),

  schoolGroups: (schoolId) => request(`/api/school/${schoolId}/groups`),
  schoolCreateGroup: (schoolId, name) =>
    request(`/api/school/${schoolId}/groups`, { method: "POST", body: { name } }),

  schoolTeachers: (schoolId) => request(`/api/school/${schoolId}/teachers`),
  schoolAddTeacher: (schoolId, userId) =>
    request(`/api/school/${schoolId}/teachers`, { method: "POST", body: { userId } }),
  schoolSuspendTeacher: (schoolId, membershipId) =>
    request(`/api/school/${schoolId}/teachers/${membershipId}/suspend`, { method: "PATCH" }),
  schoolReactivateTeacher: (schoolId, membershipId) =>
    request(`/api/school/${schoolId}/teachers/${membershipId}/reactivate`, { method: "PATCH" }),

  schoolRemoveMember: (schoolId, membershipId) =>
    request(`/api/school/${schoolId}/members/${membershipId}`, { method: "DELETE" }),
  schoolMoveStudent: (schoolId, membershipId, groupId) =>
    request(`/api/school/${schoolId}/members/${membershipId}/group`, {
      method: "PATCH",
      body: { groupId },
    }),

  schoolStudents: (schoolId, groupId) =>
    request(`/api/school/${schoolId}/students${groupId ? `?groupId=${groupId}` : ""}`),

  schoolInvitations: (schoolId) => request(`/api/school/${schoolId}/invitations`),
  schoolCreateInvitation: (schoolId, data) =>
    request(`/api/school/${schoolId}/invitations`, { method: "POST", body: data }),
  schoolRevokeInvitation: (schoolId, invitationId) =>
    request(`/api/school/${schoolId}/invitations/${invitationId}`, { method: "DELETE" }),

  schoolGroupHomework: (schoolId, groupId) =>
    request(`/api/school/${schoolId}/groups/${groupId}/homework`),
  schoolCreateHomework: (schoolId, groupId, data) =>
    request(`/api/school/${schoolId}/groups/${groupId}/homework`, {
      method: "POST",
      body: data,
    }),

  schoolTeacherDashboard: (schoolId, groupId) =>
    request(
      `/api/school/${schoolId}/teacher/dashboard${groupId ? `?groupId=${groupId}` : ""}`
    ),
  schoolGroupLeaderboard: (schoolId, groupId) =>
    request(`/api/school/${schoolId}/groups/${groupId}/leaderboard`),
  schoolAnalytics: (schoolId) => request(`/api/school/${schoolId}/analytics`),

  // CEO
  schoolAdminList: (status) =>
    request(`/api/school/admin/schools${status ? `?status=${status}` : ""}`),
  schoolAdminCreate: (data) =>
    request("/api/school/admin/schools", { method: "POST", body: data }),
  schoolAdminSetStatus: (schoolId, status, reason) =>
    request(`/api/school/admin/schools/${schoolId}/status`, {
      method: "PATCH",
      body: { status, reason },
    }),
  schoolAdminDelete: (schoolId) =>
    request(`/api/school/admin/schools/${schoolId}`, { method: "DELETE" }),
  schoolAdminAnalytics: () => request("/api/school/admin/analytics"),
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
