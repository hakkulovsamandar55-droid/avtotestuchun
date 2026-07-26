import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Search, X, Save, Check, ShieldCheck, Crown, Loader2 } from "lucide-react";
import { ACCENT_FROM, ACCENT_TO } from "../theme";
import { api } from "../api";
import { formatPrice } from "../../shared/data/premiumPlans";
import UserProfileScreen from "./admin/UserProfileScreen";
import UserFiltersPanel from "./admin/UserFiltersPanel";
import AdminSupportTab from "./admin/AdminSupportTab";
import AdminPaymentsTab from "./admin/AdminPaymentsTab";
import AdminBroadcastTab from "./admin/AdminBroadcastTab";
import AdminLogTab from "./admin/AdminLogTab";
import AdminExamAnalyticsTab from "./admin/AdminExamAnalyticsTab";
import AdminSchoolsTab from "./admin/AdminSchoolsTab";
import NotificationsBell from "./admin/NotificationsBell";

function initials(name) {
  return (name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function readinessColor(percent) {
  if (percent >= 70) return "#16A34A";
  if (percent >= 45) return "#D97706";
  return "#DC2626";
}

// Spec 2-bo'lim: to'g'ridan-to'g'ri harakat tugmalari olib tashlandi —
// qatorni bosish endi to'liq User Profile sahifasini ochadi.
function UserRow({ user, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-2xl bg-card border border-card-border shadow-sm px-4 py-3.5 text-left active:scale-[0.99] transition-transform"
    >
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
        style={{ background: `linear-gradient(135deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
      >
        {initials(user.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-text-main text-sm truncate flex items-center gap-1.5">
          {user.name}
          {user.role === "ADMIN" && <ShieldCheck size={13} color={ACCENT_FROM} />}
          {user.isPremium && <Crown size={13} color="#E0A62E" />}
        </p>
        <p className="text-text-muted text-xs truncate">
          {user.username ? `@${user.username}` : "—"}
          {user.phone ? ` · ${user.phone}` : ""}
        </p>
      </div>
      <div className="text-right shrink-0">
        <span className="text-xs font-bold" style={{ color: readinessColor(user.examReadiness) }}>
          {user.examReadiness}%
        </span>
      </div>
    </button>
  );
}

// Admin panel — foydalanuvchilar, premium tariflar, qo'llab-quvvatlash, to'lovlar,
// ommaviy xabar va admin jurnali. Foydalanuvchi qatorini bosish to'liq profilni ochadi.
export default function AdminPanelScreen({ onBack, currentUserId, isSuperAdmin }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState("users"); // users | premium | support | payments | broadcast | logs
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileUserId, setProfileUserId] = useState(null);

  useEffect(() => {
    if (tab !== "users") return;
    const handle = setTimeout(() => {
      setLoading(true);
      setError("");
      api
        .searchUsers(query, filters)
        .then((data) => setUsers(data.users))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }, 300); // qidiruvni har harfda emas, yozish to'xtaganda yuborish

    return () => clearTimeout(handle);
  }, [query, filters, tab]);

  // Bildirishnomadan bosilganda mos ekranni ochish (masalan to'lov -> to'lovlar tabi)
  function handleNotificationLink(linkType, linkId) {
    if (linkType === "user") {
      setProfileUserId(linkId);
    } else if (linkType === "payment") {
      setTab("payments");
    } else if (linkType === "conversation") {
      setTab("support");
    }
  }

  if (profileUserId != null) {
    return (
      <UserProfileScreen
        userId={profileUserId}
        onBack={() => setProfileUserId(null)}
        onOpenChat={() => {
          setProfileUserId(null);
          setTab("support");
        }}
        isSuperAdmin={isSuperAdmin}
      />
    );
  }

  const TABS = ["users", "exam", "schools", "premium", "support", "payments", "broadcast", "logs"];

  return (
    <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-6 bg-app min-h-full animate-slide-in">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-card border border-card-border shadow-sm flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={20} color="var(--icon-muted)" />
        </button>
        <h1 className="text-xl font-extrabold text-text-main flex-1">{t("admin.title")}</h1>
        <NotificationsBell onOpenLink={handleNotificationLink} />
      </div>

      {/* Tab almashtirgich — 6 ta bo'lim bo'lgani uchun gorizontal skroll */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap"
            style={
              tab === key
                ? { background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})`, color: "white" }
                : { background: "var(--bg-card-soft)", color: "var(--text-secondary)", border: "1px solid var(--border-card)" }
            }
          >
            {t(`admin.tab.${key}`)}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <>
          <UserFiltersPanel selected={filters} onChange={setFilters} />

          <div className="relative mb-3">
            <Search
              size={18}
              color="#9CA3AF"
              className="absolute left-4 top-1/2 -translate-y-1/2"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("admin.searchPlaceholder")}
              className="w-full rounded-2xl bg-card border border-card-border shadow-sm pl-11 pr-10 py-3 text-sm text-text-main outline-none focus:border-gray-300"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-card-soft flex items-center justify-center"
              >
                <X size={13} color="#6B7280" />
              </button>
            )}
          </div>

          {error && (
            <p className="text-center text-red-500 text-sm mt-6">{error}</p>
          )}

          {!error && (
            <>
              <p className="text-text-muted text-xs mb-3 ml-1">
                {loading
                  ? "..."
                  : t("admin.resultsCount", { count: users.length })}
              </p>

              <div className="space-y-2.5">
                {users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onClick={() => setProfileUserId(user.id)}
                  />
                ))}
                {!loading && users.length === 0 && (
                  <p className="text-center text-text-muted text-sm mt-10">
                    {t("admin.noResults")}
                  </p>
                )}
              </div>
            </>
          )}
        </>
      )}

      {tab === "exam" && <AdminExamAnalyticsTab />}
      {tab === "schools" && <AdminSchoolsTab />}
      {tab === "premium" && <PremiumEditor />}
      {tab === "support" && <AdminSupportTab onOpenProfile={setProfileUserId} />}
      {tab === "payments" && <AdminPaymentsTab />}
      {tab === "broadcast" && <AdminBroadcastTab />}
      {tab === "logs" && <AdminLogTab />}
    </div>
  );
}

function PremiumEditor() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Narxlar endi DB'da (premium_plans jadvali). Ilgari ular kodda edi va
  // admin panelda "dasturchiga murojaat qiling" ogohlantirishi turardi.
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.adminGetPremiumPlans();
      setPlans(res.plans || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startEdit(plan) {
    setEditingKey(plan.key);
    setError("");
    setDraft({
      name: plan.name,
      price: String(plan.price),
      period: plan.period,
      badge: plan.badge || "",
      features: (plan.features || []).join("\n"),
    });
  }

  async function save() {
    if (!draft || saving) return;
    setSaving(true);
    setError("");
    try {
      await api.adminUpdatePremiumPlan(editingKey, {
        name: draft.name,
        price: Number(draft.price),
        period: draft.period,
        badge: draft.badge,
        // Har satr — alohida xususiyat
        features: draft.features.split("\n").map((f) => f.trim()).filter(Boolean),
      });
      setEditingKey(null);
      setDraft(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={22} className="animate-spin" color="var(--icon-muted)" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="rounded-2xl bg-card border border-card-border px-4 py-3">
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {t("admin.plansEditableHint")}
        </p>
      </div>

      {error && <p className="text-red-400 text-xs px-1">{error}</p>}

      {plans.map((plan) => {
        const isEditing = editingKey === plan.key;
        return (
          <div key={plan.key} className="rounded-2xl bg-card border border-card-border shadow-sm p-4">
            {isEditing ? (
              <div className="space-y-3">
                <Field label={t("admin.planName")}>
                  <input
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    className="w-full rounded-xl border border-card-border px-3 py-2 text-sm outline-none"
                    style={{ color: "var(--text-primary)" }}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-2.5">
                  <Field label={t("admin.planPrice")}>
                    <input
                      value={draft.price}
                      onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                      inputMode="numeric"
                      className="w-full rounded-xl border border-card-border px-3 py-2 text-sm outline-none"
                      style={{ color: "var(--text-primary)" }}
                    />
                  </Field>
                  <Field label={t("admin.planPeriod")}>
                    <input
                      value={draft.period}
                      onChange={(e) => setDraft({ ...draft, period: e.target.value })}
                      className="w-full rounded-xl border border-card-border px-3 py-2 text-sm outline-none"
                      style={{ color: "var(--text-primary)" }}
                    />
                  </Field>
                </div>

                <Field label={t("admin.planBadge")} hint={t("admin.planBadgeHint")}>
                  <input
                    value={draft.badge}
                    onChange={(e) => setDraft({ ...draft, badge: e.target.value })}
                    className="w-full rounded-xl border border-card-border px-3 py-2 text-sm outline-none"
                    style={{ color: "var(--text-primary)" }}
                  />
                </Field>

                <Field label={t("admin.planFeatures")} hint={t("admin.planFeaturesHint")}>
                  <textarea
                    value={draft.features}
                    onChange={(e) => setDraft({ ...draft, features: e.target.value })}
                    rows={4}
                    className="w-full rounded-xl border border-card-border px-3 py-2 text-sm outline-none resize-none"
                    style={{ color: "var(--text-primary)" }}
                  />
                </Field>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={save}
                    disabled={saving}
                    className="flex-1 rounded-xl py-2.5 text-xs font-bold text-white disabled:opacity-50"
                    style={{
                      background: "linear-gradient(135deg, var(--accent-from), var(--accent-to))",
                    }}
                  >
                    {saving ? t("admin.saving") : t("admin.save")}
                  </button>
                  <button
                    onClick={() => {
                      setEditingKey(null);
                      setDraft(null);
                      setError("");
                    }}
                    className="rounded-xl px-4 py-2.5 text-xs font-semibold bg-card-soft border border-card-border"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {t("admin.cancel")}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-baseline justify-between mb-3">
                  <p className="font-extrabold text-text-main text-sm uppercase tracking-wide">
                    {plan.name}
                  </p>
                  <p className="font-bold text-text-main text-sm">
                    {formatPrice(plan.price)}
                    <span className="text-text-muted font-medium text-xs"> so'm / {plan.period}</span>
                  </p>
                </div>

                {plan.badge && (
                  <span className="inline-block mb-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-card-soft border border-card-border text-text-muted">
                    {plan.badge}
                  </span>
                )}

                <ul className="space-y-1 mb-3">
                  {(plan.features || []).map((f, i) => (
                    <li key={i} className="text-text-muted text-xs flex gap-1.5">
                      <span>-</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => startEdit(plan)}
                  className="w-full rounded-xl py-2.5 text-xs font-bold bg-card-soft border border-card-border"
                  style={{ color: "var(--accent-from)" }}
                >
                  {t("admin.editPlan")}
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label
        className="block text-[11px] font-semibold mb-1.5"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-[10px] mt-1" style={{ color: "var(--text-secondary)", opacity: 0.8 }}>
          {hint}
        </p>
      )}
    </div>
  );
}
