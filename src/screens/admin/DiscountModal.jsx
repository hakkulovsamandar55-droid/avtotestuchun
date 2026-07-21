import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { ACCENT_FROM, ACCENT_TO } from "../../theme";
import { api } from "../../api";

const DISCOUNT_OPTIONS = [0, 10, 20, 30, 50, 75, 100];

// Foydalanuvchiga shaxsiy chegirma berish/o'zgartirish modal oynasi (spec 4-bo'lim)
export default function DiscountModal({ userId, current, onClose, onSaved }) {
  const { t } = useTranslation();
  const [percent, setPercent] = useState(current?.percent ?? 0);
  const [expiresAt, setExpiresAt] = useState(current?.expiresAt ? current.expiresAt.slice(0, 10) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleApply() {
    setBusy(true);
    setError("");
    try {
      await api.setUserDiscount(userId, percent, expiresAt || null);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    setBusy(true);
    setError("");
    try {
      await api.removeUserDiscount(userId);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0" onClick={onClose}>
      <div
        className="w-full sm:max-w-sm rounded-3xl bg-card border border-card-border shadow-xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="font-extrabold text-text-main text-base">{t("admin.discount.title")}</p>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-card-soft flex items-center justify-center">
            <X size={15} color="var(--icon-muted)" />
          </button>
        </div>

        <p className="text-text-muted text-xs mb-2">{t("admin.discount.percent")}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {DISCOUNT_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setPercent(opt)}
              className="rounded-xl px-3.5 py-2 text-sm font-bold transition-transform active:scale-95"
              style={
                percent === opt
                  ? { background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})`, color: "white" }
                  : { background: "var(--bg-card-soft)", color: "var(--text-main)", border: "1px solid var(--border-card)" }
              }
            >
              {opt}%
            </button>
          ))}
        </div>

        <p className="text-text-muted text-xs mb-2">{t("admin.discount.expiresAt")}</p>
        <input
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className="w-full rounded-xl border border-card-border bg-card-soft text-text-main px-3 py-2.5 text-sm mb-1 outline-none focus:border-gray-400"
        />
        <p className="text-text-muted text-[11px] mb-4">{t("admin.discount.noExpiry")}</p>

        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

        <div className="flex gap-2">
          {current && (
            <button
              onClick={handleRemove}
              disabled={busy}
              className="flex-1 rounded-2xl py-3 text-sm font-semibold border border-card-border text-text-main disabled:opacity-50"
            >
              {t("admin.discount.remove")}
            </button>
          )}
          <button
            onClick={handleApply}
            disabled={busy}
            className="flex-1 rounded-2xl py-3 text-sm font-bold text-white disabled:opacity-50"
            style={{ background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
          >
            {t("admin.discount.apply")}
          </button>
        </div>
      </div>
    </div>
  );
}
