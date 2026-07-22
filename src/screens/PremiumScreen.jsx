import React from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Check, Crown, Sparkles } from "lucide-react";
import { PREMIUM_PLANS, formatPrice } from "../data/premiumData";
import { ACCENT_FROM, ACCENT_TO } from "../theme";

const PLAN_STYLE = {
  lite: {
    icon: Sparkles,
    iconBg: "#F3F4F6",
    iconFg: "#6B7280",
    buttonBg: "#111827",
  },
  pro: {
    icon: Sparkles,
    iconBg: "#EEEBFF",
    iconFg: ACCENT_FROM,
    buttonBg: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})`,
  },
  vip: {
    icon: Crown,
    iconBg: "#FFF6DE",
    iconFg: "#C9982B",
    buttonBg: "linear-gradient(90deg, #F5C542, #C9982B)",
  },
};

// Premium tariflar ekrani — Lite / Pro / VIP kartalari, ma'lumotlar admin paneldan boshqariladi
export default function PremiumScreen({ onBack, onSelectPlan }) {
  const { t } = useTranslation();
  // Tariflar o'zgarmas (statik) ma'lumot — useState/useEffect kerak emas edi.
  // Ilgari birinchi renderda bo'sh ro'yxat ko'rinib, keyin to'lardi (miltillash).
  const plans = PREMIUM_PLANS;

  return (
    <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-8 bg-[#0F1424] min-h-full text-white animate-slide-in">
      <div className="flex items-center gap-3 mb-1">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={20} color="#E5E7EB" />
        </button>
        <h1 className="text-2xl font-extrabold text-white">
          {t("premium.title")}
        </h1>
      </div>
      <p className="text-gray-400 text-sm mt-1 mb-6 ml-12">
        {t("premium.subtitle")}
      </p>

      <div className="space-y-4">
        {plans.map((plan) => {
          const style = PLAN_STYLE[plan.key] || PLAN_STYLE.lite;
          const Icon = style.icon;
          const isVip = plan.key === "vip";
          const isPro = plan.key === "pro";

          return (
            <div
              key={plan.key}
              className="rounded-3xl p-5"
              style={{
                background: isVip
                  ? "linear-gradient(160deg, rgba(245,197,66,0.14), rgba(201,152,43,0.05))"
                  : isPro
                  ? "linear-gradient(160deg, rgba(108,92,231,0.16), rgba(168,85,247,0.05))"
                  : "rgba(255,255,255,0.03)",
                boxShadow: isVip
                  ? "0 0 0 1px rgba(245,197,66,0.35) inset"
                  : isPro
                  ? "0 0 0 1px rgba(108,92,231,0.35) inset"
                  : "0 0 0 1px rgba(255,255,255,0.06) inset",
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: style.iconBg }}
                  >
                    <Icon size={20} color={style.iconFg} />
                  </div>
                  <div>
                    <p className="font-extrabold text-lg leading-none">{plan.name}</p>
                    {plan.badge && (
                      <span
                        className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: isVip
                            ? "linear-gradient(90deg, #F5C542, #C9982B)"
                            : isPro
                            ? `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})`
                            : "rgba(255,255,255,0.1)",
                          color: isVip ? "#3B2C00" : "white",
                        }}
                      >
                        {plan.badge}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-xl leading-none">
                    {formatPrice(plan.price)}
                    <span className="text-xs font-medium text-gray-400"> so'm</span>
                  </p>
                  <p className="text-gray-500 text-[11px] mt-1">/ {plan.period}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {plan.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check
                      size={14}
                      className="mt-[3px] shrink-0"
                      color={isVip ? "#F5C542" : isPro ? "#A855F7" : "#9CA3AF"}
                    />
                    <span className="text-xs text-gray-300 leading-snug">{f}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => onSelectPlan?.(plan)}
                className="w-full mt-5 rounded-2xl py-3 font-bold text-sm active:scale-[0.98] transition-transform"
                style={{
                  background: style.buttonBg,
                  color: isVip ? "#3B2C00" : "white",
                }}
              >
                {t("premium.select", { name: plan.name })}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-center text-gray-500 text-[11px] mt-6 leading-relaxed px-4">
        {t("premium.disclaimer")}
      </p>
    </div>
  );
}
