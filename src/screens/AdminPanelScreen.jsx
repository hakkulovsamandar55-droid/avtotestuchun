import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Search, X, Save, Check, ShieldCheck, ShieldOff, Crown, XCircle } from "lucide-react";
import { ACCENT_FROM, ACCENT_TO } from "../theme";
import { api } from "../api";
import { DEFAULT_PREMIUM_PLANS, loadPremiumPlans, savePremiumPlans } from "../data/premiumData";

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

// Kichik toggle-tugma: bosilganda tegishli backend so'rovi yuboriladi.
// `busy` paytida bosib bo'lmaydi (ikki marta ustma-ust yuborilmasligi uchun).
function AdminActionButton({ active, activeLabel, inactiveLabel, activeIcon: ActiveIcon, inactiveIcon: InactiveIcon, onClick, busy, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={busy || disabled}
      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-transform active:scale-[0.97] disabled:opacity-50"
      style={
        active
          ? { background: "var(--bg-card-soft)", color: "var(--text-secondary)", border: "1px solid var(--border-card)" }
          : { background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})`, color: "white" }
      }
    >
      {active ? <InactiveIcon size={13} /> : <ActiveIcon size={13} />}
      {active ? inactiveLabel : activeLabel}
    </button>
  );
}

function UserRow({ user, onChange }) {
  const { t } = useTranslation();
  const [busyRole, setBusyRole] = useState(false);
  const [busyPremium, setBusyPremium] = useState(false);
  const [error, setError] = useState("");

  const isAdmin = user.role === "ADMIN";

  async function toggleRole() {
    setError("");
    setBusyRole(true);
    try {
      const nextRole = isAdmin ? "USER" : "ADMIN";
      const { user: updated } = await api.setUserRole(user.id, nextRole);
      onChange({ ...user, ...updated });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyRole(false);
    }
  }

  async function togglePremium() {
    setError("");
    setBusyPremium(true);
    try {
      const { user: updated } = await api.setUserPremium(user.id, !user.isPremium);
      onChange({ ...user, ...updated });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyPremium(false);
    }
  }

  return (
    <div className="w-full rounded-2xl bg-card border border-card-border shadow-sm px-4 py-3.5">
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
          style={{ background: `linear-gradient(135deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
        >
          {initials(user.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-text-main text-sm truncate flex items-center gap-1.5">
            {user.name}
            {isAdmin && <ShieldCheck size={13} color={ACCENT_FROM} />}
            {user.isPremium && <Crown size={13} color="#E0A62E" />}
          </p>
          <p className="text-text-muted text-xs truncate">
            {user.username ? `@${user.username}` : "—"}
            {user.phone ? ` · ${user.phone}` : ""}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span
            className="text-xs font-bold"
            style={{ color: readinessColor(user.examReadiness) }}
          >
            {user.examReadiness}%
          </span>
        </div>
      </div>

      {user.isSuperAdmin ? (
        <p className="text-[11px] text-text-muted mt-3 text-center">
          {t("admin.superAdminLocked")}
        </p>
      ) : (
        <div className="flex gap-2 mt-3">
          <AdminActionButton
            active={isAdmin}
            activeLabel={t("admin.makeAdmin")}
            inactiveLabel={t("admin.removeAdmin")}
            activeIcon={ShieldCheck}
            inactiveIcon={ShieldOff}
            onClick={toggleRole}
            busy={busyRole}
          />
          <AdminActionButton
            active={user.isPremium}
            activeLabel={t("admin.givePremium")}
            inactiveLabel={t("admin.removePremium")}
            activeIcon={Crown}
            inactiveIcon={XCircle}
            onClick={togglePremium}
            busy={busyPremium}
          />
        </div>
      )}

      {error && <p className="text-[11px] text-red-500 mt-2 text-center">{error}</p>}
    </div>
  );
}

// Admin panel — foydalanuvchilarni haqiqiy backenddan qidirish + Premium tariflarni boshqarish
export default function AdminPanelScreen({ onBack }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState("users"); // users | premium
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (tab !== "users") return;
    const handle = setTimeout(() => {
      setLoading(true);
      setError("");
      api
        .searchUsers(query)
        .then((data) => setUsers(data.users))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }, 300); // qidiruvni har harfda emas, yozish to'xtaganda yuborish

    return () => clearTimeout(handle);
  }, [query, tab]);

  return (
    <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-6 bg-app min-h-full animate-slide-in">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-card border border-card-border shadow-sm flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={20} color="var(--icon-muted)" />
        </button>
        <h1 className="text-xl font-extrabold text-text-main">{t("admin.title")}</h1>
      </div>

      {/* Tab almashtirgich */}
      <div className="flex gap-2 mb-4 bg-card border border-card-border rounded-2xl p-1 shadow-sm">
        {["users", "premium"].map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex-1 rounded-xl py-2 text-sm font-semibold transition-colors"
            style={
              tab === key
                ? { background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})`, color: "white" }
                : { color: "#6B7280" }
            }
          >
            {t(`admin.tab.${key}`)}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <>
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
                    onChange={(updated) =>
                      setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)))
                    }
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

      {tab === "premium" && <PremiumEditor />}
    </div>
  );
}

function PremiumEditor() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState(DEFAULT_PREMIUM_PLANS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPlans(loadPremiumPlans());
  }, []);

  function updatePlan(key, field, value) {
    setSaved(false);
    setPlans((prev) =>
      prev.map((p) => (p.key === key ? { ...p, [field]: value } : p))
    );
  }

  function updateFeatures(key, text) {
    updatePlan(
      key,
      "features",
      text.split("\n").map((line) => line.trim()).filter(Boolean)
    );
  }

  function handleSave() {
    savePremiumPlans(plans);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-4 pb-4">
      {plans.map((plan) => (
        <div key={plan.key} className="rounded-2xl bg-card border border-card-border shadow-sm p-4">
          <p className="font-extrabold text-text-main text-sm mb-3 uppercase tracking-wide">
            {plan.key}
          </p>

          <label className="block text-xs text-text-muted mb-1">{t("admin.planName")}</label>
          <input
            value={plan.name}
            onChange={(e) => updatePlan(plan.key, "name", e.target.value)}
            className="w-full rounded-xl border border-card-border bg-card-soft text-text-main px-3 py-2 text-sm mb-3 outline-none focus:border-gray-400"
          />

          <div className="flex gap-3 mb-3">
            <div className="flex-1">
              <label className="block text-xs text-text-muted mb-1">{t("admin.planPrice")}</label>
              <input
                value={plan.price}
                onChange={(e) => updatePlan(plan.key, "price", e.target.value)}
                className="w-full rounded-xl border border-card-border bg-card-soft text-text-main px-3 py-2 text-sm outline-none focus:border-gray-400"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-text-muted mb-1">{t("admin.planPeriod")}</label>
              <input
                value={plan.period}
                onChange={(e) => updatePlan(plan.key, "period", e.target.value)}
                className="w-full rounded-xl border border-card-border bg-card-soft text-text-main px-3 py-2 text-sm outline-none focus:border-gray-400"
              />
            </div>
          </div>

          <label className="block text-xs text-text-muted mb-1">{t("admin.planBadge")}</label>
          <input
            value={plan.badge}
            onChange={(e) => updatePlan(plan.key, "badge", e.target.value)}
            className="w-full rounded-xl border border-card-border bg-card-soft text-text-main px-3 py-2 text-sm mb-3 outline-none focus:border-gray-400"
          />

          <label className="block text-xs text-text-muted mb-1">{t("admin.planFeatures")}</label>
          <textarea
            value={plan.features.join("\n")}
            onChange={(e) => updateFeatures(plan.key, e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-card-border bg-card-soft text-text-main px-3 py-2 text-sm outline-none focus:border-gray-400 resize-none"
          />
        </div>
      ))}

      <button
        onClick={handleSave}
        className="w-full rounded-2xl py-3.5 font-bold text-white text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        style={{ background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
      >
        {saved ? <Check size={16} /> : <Save size={16} />}
        {saved ? t("admin.saved") : t("admin.save")}
      </button>
    </div>
  );
}
