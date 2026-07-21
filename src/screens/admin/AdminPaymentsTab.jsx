import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { ACCENT_FROM, ACCENT_TO } from "../../theme";
import { api, resolveUploadUrl } from "../../api";

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
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
