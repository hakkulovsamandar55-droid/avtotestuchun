import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft, ShieldCheck, ShieldOff, Crown, XCircle, Ban, CheckCircle2,
  MessageCircle, Trash2, Percent, Clock, CreditCard, Check,
} from "lucide-react";
import { ACCENT_FROM, ACCENT_TO } from "../../theme";
import { api } from "../../api";
import DiscountModal from "./DiscountModal";

function initials(name) {
  return (name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString();
}

// Faqat adminlar ko'radigan shaxsiy eslatma — foydalanuvchiga hech qachon ko'rsatilmaydi.
// Alohida "Saqlash" tugmasi bilan (har harfda so'rov yubormaslik uchun).
function AdminNotesBox({ userId, initialNotes }) {
  const { t } = useTranslation();
  const [notes, setNotes] = useState(initialNotes || "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setBusy(true);
    try {
      await api.setUserNotes(userId, notes);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl bg-card border border-card-border shadow-sm p-4 mb-3">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={t("admin.profile.notesPlaceholder")}
        rows={3}
        className="w-full rounded-xl border border-card-border bg-card-soft text-text-main px-3 py-2.5 text-xs outline-none focus:border-gray-400 resize-none mb-2"
      />
      <div className="flex items-center justify-between">
        {saved ? (
          <span className="text-green-600 text-[11px] font-semibold flex items-center gap-1">
            <Check size={12} /> {t("admin.saved")}
          </span>
        ) : <span />}
        <button
          onClick={handleSave}
          disabled={busy}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          style={{ background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
        >
          {t("admin.save")}
        </button>
      </div>
    </div>
  );
}

function StatCell({ label, value, color }) {
  return (
    <div className="rounded-2xl bg-card-soft border border-card-border px-3 py-3">
      <p className="text-text-muted text-[11px] mb-0.5">{label}</p>
      <p className="font-extrabold text-sm" style={{ color: color || "var(--text-main)" }}>{value}</p>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-card-border last:border-0">
      <span className="text-text-muted text-xs">{label}</span>
      <span className="text-text-main text-xs font-semibold">{value}</span>
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick, danger, busy }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold border transition-transform active:scale-[0.97] disabled:opacity-50"
      style={
        danger
          ? { background: "rgba(220,38,38,0.08)", borderColor: "rgba(220,38,38,0.25)", color: "#DC2626" }
          : { background: "var(--bg-card-soft)", borderColor: "var(--border-card)", color: "var(--text-main)" }
      }
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

const STATUS_COLORS = {
  APPROVED: "#16A34A",
  REJECTED: "#DC2626",
  PENDING: "#D97706",
};

const TIMELINE_ICONS = {
  REGISTERED: "🎉",
  TEST_COMPLETED: "📝",
  PREMIUM_GRANTED: "👑",
  PREMIUM_EXTENDED: "⏳",
  PREMIUM_EXPIRED: "⌛",
  DISCOUNT_GRANTED: "🏷️",
  PAYMENT_SUBMITTED: "💳",
  PAYMENT_APPROVED: "✅",
  PAYMENT_REJECTED: "❌",
  SUPPORT_MESSAGE: "💬",
  BLOCKED: "🚫",
  UNBLOCKED: "🔓",
  MADE_ADMIN: "🛡️",
  REMOVED_ADMIN: "🛡️",
  REFERRAL_JOINED: "🤝",
  REFERRAL_REWARD_GIVEN: "🎁",
};

// Admin tomoni: bitta foydalanuvchining to'liq profili — umumiy, statistika,
// premium, to'lovlar, timeline va harakat tugmalari (spec 2/3/6/7-bo'limlar)
export default function UserProfileScreen({ userId, onBack, onOpenChat, isSuperAdmin }) {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [showDiscount, setShowDiscount] = useState(false);

  function load() {
    setLoading(true);
    api.getUserProfile(userId).then(setProfile).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [userId]);

  async function runAction(key, fn) {
    setBusy(key);
    setError("");
    try {
      await fn();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  if (loading || !profile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-app">
        <p className="text-text-muted text-sm">...</p>
      </div>
    );
  }

  const { general, statistics, premium, discount, referral, payments, timeline } = profile;
  const isAdmin = general.role === "ADMIN";

  return (
    <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-8 bg-app min-h-full animate-slide-in">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-card border border-card-border shadow-sm flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={20} color="var(--icon-muted)" />
        </button>
        <h1 className="text-lg font-extrabold text-text-main truncate">{t("admin.profile.backToUsers")}</h1>
      </div>

      {/* UMUMIY */}
      <div className="rounded-3xl bg-card border border-card-border shadow-sm p-5 mb-3">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0"
            style={{ background: `linear-gradient(135deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
          >
            {initials(general.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-text-main text-base truncate flex items-center gap-1.5">
              {general.name}
              {isAdmin && <ShieldCheck size={14} color={ACCENT_FROM} />}
              {premium.isPremium && <Crown size={14} color="#E0A62E" />}
            </p>
            <p className="text-text-muted text-xs truncate">{general.username ? `@${general.username}` : "—"}</p>
          </div>
          {general.isBlocked && (
            <span className="text-[10px] font-bold text-red-600 bg-red-50 rounded-full px-2.5 py-1 shrink-0">
              {t("admin.profile.blockedBadge")}
            </span>
          )}
        </div>

        <InfoRow label={t("admin.profile.telegramId")} value={general.telegramId} />
        <InfoRow label={t("admin.profile.registeredAt")} value={fmtDate(general.registeredAt)} />
        <InfoRow label={t("admin.profile.lastOnline")} value={general.lastOnlineAt ? fmtDate(general.lastOnlineAt) : "—"} />
        {general.phone && <InfoRow label="Telefon" value={general.phone} />}
        {general.age != null && <InfoRow label={t("admin.profile.age")} value={general.age} />}
        {general.dailyStudyMinutes != null && (
          <InfoRow label={t("admin.profile.dailyStudyMinutes")} value={`${general.dailyStudyMinutes} ${t("admin.profile.minutesShort")}`} />
        )}
      </div>

      {/* STATISTIKA */}
      <p className="text-text-muted text-xs font-semibold uppercase tracking-wide mb-2 ml-1">{t("admin.profile.statsTitle")}</p>
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <StatCell label={t("admin.profile.testsCompleted")} value={statistics.testsCompleted} />
        <StatCell label={t("admin.profile.aiRating")} value={`${statistics.aiRating}%`} />
        <StatCell label={t("admin.profile.correctAnswers")} value={statistics.correctAnswers} color="#16A34A" />
        <StatCell label={t("admin.profile.wrongAnswers")} value={statistics.wrongAnswers} color="#DC2626" />
        <StatCell label={t("admin.profile.successPercent")} value={`${statistics.successPercent}%`} />
        <StatCell label={t("admin.profile.averageScore")} value={`${statistics.averageScore}%`} />
      </div>

      {/* PREMIUM */}
      <p className="text-text-muted text-xs font-semibold uppercase tracking-wide mb-2 ml-1">{t("admin.profile.premiumTitle")}</p>
      <div className="rounded-2xl bg-card border border-card-border shadow-sm p-4 mb-3">
        <InfoRow label={t("admin.profile.currentPlan")} value={premium.plan || t("admin.profile.noPlan")} />
        {premium.isPremium && (
          <>
            <InfoRow label={t("admin.profile.premiumStart")} value={fmtDate(premium.startedAt)} />
            <InfoRow label={t("admin.profile.premiumEnd")} value={fmtDate(premium.expiresAt)} />
          </>
        )}
        {discount && (
          <InfoRow
            label={t("admin.discount.title")}
            value={`${discount.percent}%${discount.expiresAt ? ` · ${fmtDate(discount.expiresAt)} gacha` : ""}${discount.isExpired ? " (muddati o'tgan)" : ""}`}
          />
        )}
      </div>

      {/* TO'LOVLAR */}
      <p className="text-text-muted text-xs font-semibold uppercase tracking-wide mb-2 ml-1">{t("admin.profile.paymentsTitle")}</p>
      <div className="rounded-2xl bg-card border border-card-border shadow-sm p-4 mb-3">
        {payments.length === 0 ? (
          <p className="text-text-muted text-xs text-center py-2">{t("admin.profile.noPayments")}</p>
        ) : (
          payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-2 border-b border-card-border last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <CreditCard size={13} color="var(--icon-muted)" />
                <div className="min-w-0">
                  <p className="text-text-main text-xs font-semibold truncate">{p.planName} · {p.amount.toLocaleString()} so'm</p>
                  <p className="text-text-muted text-[10px]">{fmtDate(p.createdAt)}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold shrink-0" style={{ color: STATUS_COLORS[p.status] }}>
                {p.status}
              </span>
            </div>
          ))
        )}
      </div>

      {/* REFERRAL */}
      <p className="text-text-muted text-xs font-semibold uppercase tracking-wide mb-2 ml-1">{t("admin.profile.referralTitle")}</p>
      <div className="rounded-2xl bg-card border border-card-border shadow-sm p-4 mb-3">
        <InfoRow label={t("admin.profile.referralCode")} value={referral.code || "—"} />
        <InfoRow
          label={t("admin.profile.referredBy")}
          value={referral.referredBy ? `${referral.referredBy.name}${referral.referredBy.username ? ` (@${referral.referredBy.username})` : ""}` : t("admin.profile.noReferrer")}
        />
        <InfoRow label={t("admin.profile.referralsCount")} value={referral.referralsCount} />
        {referral.referrals.length > 0 && (
          <div className="mt-2 pt-2 border-t border-card-border space-y-1.5">
            {referral.referrals.map((r) => (
              <div key={r.id} className="flex items-center justify-between">
                <span className="text-text-main text-xs truncate">{r.name}{r.username ? ` (@${r.username})` : ""}</span>
                {r.isPremium && <Crown size={12} color="#E0A62E" className="shrink-0" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* HARAKAT TUGMALARI */}
      <p className="text-text-muted text-xs font-semibold uppercase tracking-wide mb-2 ml-1">Amallar</p>
      {general.isSuperAdmin ? (
        <p className="text-xs text-text-muted mb-4">{t("admin.superAdminLocked")}</p>
      ) : (
        <div className="flex flex-wrap gap-2 mb-5">
          <ActionButton icon={MessageCircle} label={t("admin.profile.actions.openChat")} onClick={onOpenChat} />

          {premium.isPremium ? (
            <>
              <ActionButton
                icon={Clock}
                label={t("admin.profile.actions.extendPremium")}
                busy={busy === "extend"}
                onClick={() => {
                  const days = Number(window.prompt(t("admin.profile.extendDaysPrompt"), "30"));
                  if (days > 0) runAction("extend", () => api.extendPremium(userId, days));
                }}
              />
              <ActionButton
                icon={XCircle}
                label={t("admin.removePremium")}
                busy={busy === "premium"}
                onClick={() => runAction("premium", () => api.setUserPremium(userId, false))}
              />
            </>
          ) : (
            <ActionButton
              icon={Crown}
              label={t("admin.profile.actions.givePremium")}
              busy={busy === "premium"}
              onClick={() => runAction("premium", () => api.setUserPremium(userId, true, { planKey: "days30", days: 30 }))}
            />
          )}

          <ActionButton icon={Percent} label={t("admin.profile.actions.giveDiscount")} onClick={() => setShowDiscount(true)} />

          {isAdmin ? (
            <ActionButton
              icon={ShieldOff}
              label={t("admin.profile.actions.removeAdmin")}
              busy={busy === "role"}
              onClick={() => runAction("role", () => api.setUserRole(userId, "USER"))}
            />
          ) : (
            <ActionButton
              icon={ShieldCheck}
              label={t("admin.profile.actions.makeAdmin")}
              busy={busy === "role"}
              onClick={() => runAction("role", () => api.setUserRole(userId, "ADMIN"))}
            />
          )}

          {general.isBlocked ? (
            <ActionButton
              icon={CheckCircle2}
              label={t("admin.profile.actions.unblock")}
              busy={busy === "block"}
              onClick={() => runAction("block", () => api.setUserBlocked(userId, false))}
            />
          ) : (
            <ActionButton
              icon={Ban}
              label={t("admin.profile.actions.block")}
              danger
              busy={busy === "block"}
              onClick={() => {
                if (!window.confirm(t("admin.profile.confirmBlock"))) return;
                const reason = window.prompt(t("admin.profile.blockReasonPlaceholder")) || "";
                runAction("block", () => api.setUserBlocked(userId, true, reason));
              }}
            />
          )}

          {isSuperAdmin && (
            <ActionButton
              icon={Trash2}
              label={t("admin.profile.actions.deleteAccount")}
              danger
              busy={busy === "delete"}
              onClick={() => {
                if (!window.confirm(t("admin.profile.confirmDelete"))) return;
                runAction("delete", async () => {
                  await api.deleteUser(userId);
                  onBack();
                });
              }}
            />
          )}
        </div>
      )}

      {error && <p className="text-red-500 text-xs text-center mb-4">{error}</p>}

      {/* ADMIN NOTES */}
      <p className="text-text-muted text-xs font-semibold uppercase tracking-wide mb-2 ml-1">{t("admin.profile.notesTitle")}</p>
      <AdminNotesBox userId={userId} initialNotes={general.adminNotes} />

      {/* TIMELINE */}
      <p className="text-text-muted text-xs font-semibold uppercase tracking-wide mb-2 ml-1">{t("admin.profile.timelineTitle")}</p>
      <div className="rounded-2xl bg-card border border-card-border shadow-sm p-4">
        {timeline.length === 0 ? (
          <p className="text-text-muted text-xs text-center py-2">{t("admin.profile.noActivity")}</p>
        ) : (
          <div className="space-y-0">
            {timeline.map((item, idx) => (
              <div key={item.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="text-base leading-none mt-0.5">{TIMELINE_ICONS[item.type] || "•"}</span>
                  {idx < timeline.length - 1 && <div className="w-px flex-1 bg-card-border my-1" style={{ minHeight: 16 }} />}
                </div>
                <div className="pb-3 min-w-0">
                  <p className="text-text-main text-xs font-medium">{item.message}</p>
                  <p className="text-text-muted text-[10px] mt-0.5">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showDiscount && (
        <DiscountModal
          userId={userId}
          current={discount}
          onClose={() => setShowDiscount(false)}
          onSaved={() => {
            setShowDiscount(false);
            load();
          }}
        />
      )}
    </div>
  );
}
