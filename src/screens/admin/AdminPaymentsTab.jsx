import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp, CreditCard, Check, Pencil } from "lucide-react";
import { ACCENT_FROM, ACCENT_TO } from "../../theme";
import { api, resolveUploadUrl } from "../../api";

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

// Admin karta ma'lumotlarini shu yerdan o'zgartiradi — .env yoki deploy shart emas,
// saqlangan zahoti to'lov ekranida va OCR solishtirishda kuchga kiradi.
function CardSettingsForm() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState(null);
  const [editing, setEditing] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardOwner, setCardOwner] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function load() {
    api.getPaymentSettings().then((data) => {
      setSettings(data);
      setCardNumber(data.cardNumber);
      setCardOwner(data.cardOwner);
    });
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    setBusy(true);
    setError("");
    try {
      const data = await api.updatePaymentSettings(cardNumber, cardOwner);
      setSettings(data);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!settings) return null;

  return (
    <div className="rounded-2xl bg-card border border-card-border shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="font-bold text-text-main text-sm flex items-center gap-2">
          <CreditCard size={15} color={ACCENT_FROM} />
          {t("admin.payments.cardSettingsTitle")}
        </p>
        {!editing && (
          <button onClick={() => setEditing(true)} className="text-xs font-semibold flex items-center gap-1" style={{ color: ACCENT_FROM }}>
            <Pencil size={12} /> {t("admin.payments.editCard")}
          </button>
        )}
      </div>

      {editing ? (
        <>
          <p className="text-text-muted text-[11px] mb-1">{t("payment.cardNumber")}</p>
          <input
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            placeholder="8600 1234 5678 9012"
            className="w-full rounded-xl border border-card-border bg-card-soft text-text-main px-3 py-2.5 text-sm mb-3 outline-none focus:border-gray-400"
          />
          <p className="text-text-muted text-[11px] mb-1">{t("payment.cardOwner")}</p>
          <input
            value={cardOwner}
            onChange={(e) => setCardOwner(e.target.value)}
            placeholder="Ism Familiya"
            className="w-full rounded-xl border border-card-border bg-card-soft text-text-main px-3 py-2.5 text-sm mb-3 outline-none focus:border-gray-400"
          />
          {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => { setEditing(false); setCardNumber(settings.cardNumber); setCardOwner(settings.cardOwner); }}
              className="flex-1 rounded-xl py-2.5 text-xs font-semibold border border-card-border text-text-main"
            >
              {t("admin.payments.cancelEdit")}
            </button>
            <button
              onClick={handleSave}
              disabled={busy}
              className="flex-1 rounded-xl py-2.5 text-xs font-bold text-white disabled:opacity-50"
              style={{ background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
            >
              {t("admin.save")}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-text-main text-sm font-semibold tracking-wide">{settings.cardNumber || "—"}</p>
          <p className="text-text-muted text-xs mt-0.5">{settings.cardOwner || "—"}</p>
          {saved && (
            <p className="text-green-600 text-[11px] font-semibold mt-2 flex items-center gap-1">
              <Check size={12} /> {t("admin.saved")}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function PaymentCard({ payment, onApprove, onReject }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState("");
  const warnings = payment.ocr.warnings || [];

  return (
    <div className="rounded-2xl bg-card border border-card-border shadow-sm p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <div className="min-w-0">
          <p className="font-bold text-text-main text-sm truncate">{payment.user.name}</p>
          <p className="text-text-muted text-xs truncate">
            {payment.planName} · {payment.amount.toLocaleString()} so'm
            {payment.discountPercent > 0 && ` (${payment.discountPercent}% chegirma)`}
          </p>
        </div>
        {warnings.length === 0 ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 rounded-full px-2 py-1 shrink-0">
            <CheckCircle2 size={11} /> {payment.ocr.confidence}%
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 rounded-full px-2 py-1 shrink-0">
            <AlertTriangle size={11} /> {warnings.length}
          </span>
        )}
      </div>

      <img
        src={resolveUploadUrl(payment.receiptImageUrl)}
        alt=""
        className="w-full max-h-56 object-contain rounded-xl bg-card-soft mb-3 cursor-pointer"
        onClick={() => window.open(resolveUploadUrl(payment.receiptImageUrl), "_blank")}
      />

      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between text-xs font-semibold text-text-muted mb-2"
      >
        {t("admin.payments.ocrTitle")}
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div className="rounded-xl bg-card-soft border border-card-border p-3 mb-3 space-y-1.5">
          <p className="text-[11px] text-text-muted">
            {t("admin.payments.ocrAmount")}: <span className="text-text-main font-semibold">{payment.ocr.extractedAmount?.toLocaleString() || "—"}</span>
          </p>
          <p className="text-[11px] text-text-muted">
            {t("admin.payments.ocrCard")}: <span className="text-text-main font-semibold">{payment.ocr.extractedCard || "—"}</span>
          </p>
          <p className="text-[11px] text-text-muted">
            {t("admin.payments.ocrDate")}: <span className="text-text-main font-semibold">{payment.ocr.extractedDate ? fmtDate(payment.ocr.extractedDate) : "—"}</span>
          </p>
          <div>
            <p className="text-[11px] text-text-muted mb-1">{t("admin.payments.ocrWarnings")}:</p>
            {warnings.length === 0 ? (
              <p className="text-[11px] text-green-600 font-medium">{t("admin.payments.noWarnings")}</p>
            ) : (
              <ul className="space-y-0.5">
                {warnings.map((w) => (
                  <li key={w} className="text-[11px] text-amber-600">• {t(`admin.payments.warning.${w}`)}</li>
                ))}
              </ul>
            )}
          </div>
          {payment.ocr.extractedText && (
            <details className="mt-1">
              <summary className="text-[11px] text-text-muted cursor-pointer">{t("admin.payments.ocrText")}</summary>
              <p className="text-[10px] text-text-muted mt-1 whitespace-pre-wrap break-words">{payment.ocr.extractedText}</p>
            </details>
          )}
        </div>
      )}

      {payment.status === "PENDING" ? (
        <div className="flex gap-2">
          <button
            onClick={async () => { setBusy("reject"); await onReject(payment.id); setBusy(""); }}
            disabled={busy !== ""}
            className="flex-1 rounded-xl py-2.5 text-xs font-bold border border-red-200 text-red-600 bg-red-50 disabled:opacity-50"
          >
            {t("admin.payments.reject")}
          </button>
          <button
            onClick={async () => { setBusy("approve"); await onApprove(payment.id); setBusy(""); }}
            disabled={busy !== ""}
            className="flex-1 rounded-xl py-2.5 text-xs font-bold text-white disabled:opacity-50"
            style={{ background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
          >
            {t("admin.payments.approve")}
          </button>
        </div>
      ) : (
        <p className="text-center text-xs font-bold" style={{ color: payment.status === "APPROVED" ? "#16A34A" : "#DC2626" }}>
          {payment.status === "APPROVED" ? t("admin.payments.approved") : t("admin.payments.rejected")}
          {payment.rejectionReason ? ` — ${payment.rejectionReason}` : ""}
        </p>
      )}
    </div>
  );
}

// Admin tomoni: to'lovlarni ko'rib chiqish (spec 8-11-bo'limlar) — OCR faqat
// ma'lumot beradi, tasdiqlash/rad etish har doim admin qo'li bilan
export default function AdminPaymentsTab() {
  const { t } = useTranslation();
  const [status, setStatus] = useState("PENDING");
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.getPayments(status).then((data) => setPayments(data.payments)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [status]);
  useEffect(() => {
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [status]);

  async function handleApprove(id) {
    await api.approvePayment(id);
    load();
  }

  async function handleReject(id) {
    const reason = window.prompt(t("admin.payments.rejectReasonPrompt")) || "";
    await api.rejectPayment(id, reason);
    load();
  }

  return (
    <div>
      <CardSettingsForm />

      <div className="flex gap-2 mb-3">
        {[
          { key: "PENDING", label: t("admin.payments.filterPending") },
          { key: "APPROVED", label: t("admin.payments.filterApproved") },
          { key: "REJECTED", label: t("admin.payments.filterRejected") },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setStatus(f.key)}
            className="flex-1 rounded-xl py-2 text-xs font-semibold transition-colors"
            style={
              status === f.key
                ? { background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})`, color: "white" }
                : { background: "var(--bg-card-soft)", color: "var(--text-secondary)", border: "1px solid var(--border-card)" }
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {payments.map((p) => (
        <PaymentCard key={p.id} payment={p} onApprove={handleApprove} onReject={handleReject} />
      ))}
      {!loading && payments.length === 0 && (
        <p className="text-center text-text-muted text-sm mt-10">{t("admin.payments.noPayments")}</p>
      )}
    </div>
  );
}
