import React from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Users, User } from "lucide-react";

/**
 * XATOLAR BILAN ISHLASH — ikki bo'limga ajratuvchi ekran.
 *
 * NIMA UCHUN ALOHIDA EKRAN: foydalanuvchi so'roviga ko'ra bu bo'lim
 * bosilganda IKKI narsa taklif qilinadi:
 *   1) Ko'pchilik xato qiladigan savollar (global statistika)
 *   2) Mening xatolarim (shaxsiy)
 *
 * Ular butunlay boshqa manbadan keladi va boshqa maqsadga xizmat qiladi:
 * birinchisi "qaysi savollar chalg'ituvchi" ni ko'rsatadi, ikkinchisi
 * "menda nima zaif" ni. Bitta ro'yxatga qo'shib bo'lmaydi.
 */
export default function MistakesHubScreen({ onBack, onOpenCommon, onOpenMine }) {
  const { t } = useTranslation();

  const options = [
    {
      key: "common",
      icon: Users,
      title: t("mistakes.commonMistakes"),
      desc: t("mistakes.commonDesc"),
      onClick: onOpenCommon,
    },
    {
      key: "mine",
      icon: User,
      title: t("mistakes.myMistakes"),
      desc: t("mistakes.myDesc"),
      onClick: onOpenMine,
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-8 animate-slide-in">
      <div className="flex items-center gap-3 py-4">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-card-soft border border-card-border flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={17} color="var(--icon-muted)" />
        </button>
        <h1 className="text-lg font-extrabold" style={{ color: "var(--text-primary)" }}>
          {t("home.mistakes")}
        </h1>
      </div>

      <div className="space-y-3">
        {options.map(({ key, icon: Icon, title, desc, onClick }) => (
          <button
            key={key}
            onClick={onClick}
            className="w-full flex items-start gap-3.5 rounded-2xl bg-card border border-card-border px-4 py-4 text-left active:scale-[0.99] transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-card-soft flex items-center justify-center shrink-0">
              <Icon size={18} color="var(--accent-from)" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                {title}
              </p>
              <p
                className="text-[11.5px] mt-1 leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {desc}
              </p>
            </div>
            <ChevronRight size={16} color="var(--chevron)" className="shrink-0 mt-1" />
          </button>
        ))}
      </div>
    </div>
  );
}
