import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Copy, Check, Upload, Clock, XCircle, MessageCircle } from "lucide-react";
import { ACCENT_FROM, ACCENT_TO } from "../theme";
import { api } from "../api";

// Foydalanuvchi karta raqamiga pul o'tkazadi, chekni yuklaydi, admin tasdig'ini kutadi.
// Bosqichlar: card -> uploading -> result (pending yoki duplicate)
export default function PaymentScreen({ plan, onBack, onOpenSupport }) {
  const { t } = useTranslation();
  const [cardInfo, setCardInfo] = useState(null);
  const [priceInfo, setPriceInfo] = useState(null);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState("card");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.getCardInfo().then(setCardInfo).catch(() => {});
    api.getPlanPrice(plan.key).then(setPriceInfo).catch(() => {});
  }, [plan.key]);

  function handleCopy() {
    if (!cardInfo?.cardNumber) return;
    navigator.clipboard?.writeText(cardInfo.cardNumber.replace(/\s/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleFilePick(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setError("");
  }

  async function handleSubmit() {
    if (!file || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const { payment } = await api.submitPayment(file, plan.key);
      setResult({ payment });
      setStep("result");
    } catch (err) {
      if (err.code === "duplicate_receipt") {
        setResult({ duplicate: true });
        setStep("result");
      } else {
        setError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-8 bg-app min-h-full animate-slide-in">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-card border border-card-border shadow-sm flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={20} color="var(--icon-muted)" />
        </button>
        <h1 className="text-xl font-extrabold text-text-main">{plan.name} {t("payment.title")}</h1>
      </div>

      {step === "card" && (
        <>
          <div className="rounded-3xl bg-card border border-card-border shadow-sm p-5 mb-4">
            <p className="text-text-muted text-xs mb-1">{t("payment.amountLabel")}</p>
            <p className="text-2xl font-extrabold text-text-main mb-1">
              {priceInfo ? priceInfo.amount.toLocaleString() : "..."} <span className="text-sm font-medium text-text-muted">so'm</span>
            </p>
            {priceInfo?.discountPercent > 0 && (
              <p className="text-xs text-green-600 font-semibold">
                {t("payment.discountApplied", { percent: priceInfo.discountPercent })} · {t("payment.originalPrice")}: {priceInfo.originalAmount.toLocaleString()} so'm
              </p>
            )}
          </div>

          <div className="rounded-3xl bg-card border border-card-border shadow-sm p-5 mb-4">
            <p className="font-bold text-text-main text-sm mb-3">{t("payment.cardTitle")}</p>
            <div className="rounded-2xl p-4 mb-3" style={{ background: `linear-gradient(135deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}>
              <p className="text-white/70 text-[11px] mb-1">{t("payment.cardNumber")}</p>
              <p className="text-white text-lg font-bold tracking-wider mb-3">{cardInfo?.cardNumber || "…"}</p>
              <p className="text-white/70 text-[11px] mb-0.5">{t("payment.cardOwner")}</p>
              <p className="text-white text-sm font-semibold">{cardInfo?.cardOwner || "…"}</p>
            </div>
            <button
              onClick={handleCopy}
              className="w-full rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 bg-card-soft border border-card-border text-text-main active:scale-[0.98] transition-transform"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? t("payment.copied") : t("payment.copyCard")}
            </button>
          </div>

          <div className="rounded-2xl bg-card-soft border border-card-border px-4 py-3 mb-5">
            <p className="text-text-muted text-xs leading-relaxed">{t("payment.instructions")}</p>
          </div>

          <button
            onClick={() => setStep("uploading")}
            className="w-full rounded-2xl py-3.5 font-bold text-white text-sm active:scale-[0.98] transition-transform"
            style={{ background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
          >
            {t("payment.iHavePaid")}
          </button>
        </>
      )}

      {step === "uploading" && (
        <>
          <p className="text-text-muted text-sm mb-4">{t("payment.uploadInstruction")}</p>

          <label className="block rounded-3xl border-2 border-dashed border-card-border bg-card-soft p-8 text-center cursor-pointer mb-4">
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFilePick} />
            {previewUrl ? (
              <img src={previewUrl} alt="" className="max-h-64 mx-auto rounded-xl object-contain" />
            ) : (
              <>
                <Upload size={28} color="var(--icon-muted)" className="mx-auto mb-2" />
                <p className="text-text-main text-sm font-semibold">{t("payment.selectReceipt")}</p>
                <p className="text-text-muted text-xs mt-1">{t("payment.selectReceiptSubtitle")}</p>
              </>
            )}
          </label>

          {error && <p className="text-red-500 text-xs text-center mb-3">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={!file || submitting}
            className="w-full rounded-2xl py-3.5 font-bold text-white text-sm active:scale-[0.98] transition-transform disabled:opacity-50"
            style={{ background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
          >
            {submitting ? t("payment.sending") : t("payment.sendReceipt")}
          </button>
        </>
      )}

      {step === "result" && result?.duplicate && (
        <div className="flex flex-col items-center text-center mt-8 px-4">
          <XCircle size={48} color="#DC2626" className="mb-4" />
          <p className="font-bold text-text-main text-base mb-2">{t("payment.duplicateTitle")}</p>
          <p className="text-text-muted text-sm mb-6">{t("payment.duplicateBody")}</p>
          <button
            onClick={onOpenSupport}
            className="w-full rounded-2xl py-3.5 font-bold text-white text-sm flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
          >
            <MessageCircle size={16} /> {t("payment.contactAdmin")}
          </button>
        </div>
      )}

      {step === "result" && result?.payment && (
        <div className="flex flex-col items-center text-center mt-8 px-4">
          <Clock size={48} color="#D97706" className="mb-4" />
          <p className="font-bold text-text-main text-base mb-2">{t("payment.pendingTitle")}</p>
          <p className="text-text-muted text-sm mb-1">{t("payment.pendingBody")}</p>
          <p className="text-text-muted text-xs mb-6">{t("payment.pendingEta")}</p>

          {result.payment.ocr.warnings.length > 0 && (
            <div className="w-full rounded-2xl bg-card-soft border border-card-border px-4 py-3 mb-6 text-left">
              <p className="text-text-muted text-xs leading-relaxed">{t("payment.warningsNotice")}</p>
            </div>
          )}

          <button
            onClick={onOpenSupport}
            className="w-full rounded-2xl py-3 font-semibold text-sm border border-card-border bg-card text-text-main flex items-center justify-center gap-2"
          >
            <MessageCircle size={15} /> {t("payment.contactAdmin")}
          </button>
        </div>
      )}
    </div>
  );
}
