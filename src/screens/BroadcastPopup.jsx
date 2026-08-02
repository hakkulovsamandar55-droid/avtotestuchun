import React from "react";
import { useTranslation } from "react-i18next";
import { Megaphone, X } from "lucide-react";
import { ACCENT_FROM, ACCENT_TO } from "../theme";

// Admin broadcast xabari — ilova ochilganda, foydalanuvchi hali ko'rmagan
// bo'lsa, bir marta popup sifatida ko'rsatiladi (MainApp orqali).
export default function BroadcastPopup({ text, onClose }) {
  const { t } = useTranslation();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm rounded-3xl bg-solid border border-card-border shadow-xl p-5 animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: `linear-gradient(135deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
            >
              <Megaphone size={16} color="white" />
            </div>
            <p className="font-extrabold text-text-main text-base">{t("broadcast.title")}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-card-soft flex items-center justify-center shrink-0">
            <X size={15} color="var(--icon-muted)" />
          </button>
        </div>

        <p className="text-text-main text-sm leading-relaxed whitespace-pre-wrap mb-5">
          {text}
        </p>

        <button
          onClick={onClose}
          className="w-full rounded-2xl py-3 text-sm font-bold text-white"
          style={{ background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
        >
          {t("broadcast.close")}
        </button>
      </div>
    </div>
  );
}
