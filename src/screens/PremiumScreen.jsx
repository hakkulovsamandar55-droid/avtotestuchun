import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Check, Sparkles, Clock } from "lucide-react";
import { PREMIUM_PLANS, formatPrice } from "../data/premiumData";
import { ACCENT_FROM, ACCENT_TO } from "../theme";
import { api } from "../api";

// MUHIM: bu endi UCH XIL mahsulot (Lite/Pro/VIP) emas — BITTA imkoniyatlar
// to'plami, faqat MUDDATI (15/30/90 kun) tanlanadi. Shu sababli imkoniyatlar
// ro'yxati faqat BIR MARTA, yuqorida ko'rsatiladi; pastda esa foydalanuvchi
// muddatni tanlaydi (uzoqroq muddat — kunlik hisobda arzonroq).
export default function PremiumScreen({ onBack, onSelectPlan }) {
  const { t } = useTranslation();
  const plans = PREMIUM_PLANS;
  const [prices, setPrices] = useState(null); // { [planKey]: { amount, originalAmount, discountPercent } }
  const [selectedKey, setSelectedKey] = useState(
    plans.find((p) => p.badge)?.key || plans[0]?.key
  );

  // Narx foydalanuvchiga qarab farq qilishi mumkin (shaxsiy chegirma).
  // PaymentScreen bilan bir xil manbadan (backend) olinadi — shu tarzda
  // foydalanuvchi bu yerda va to'lov ekranida bir xil raqamni ko'radi.
  useEffect(() => {
    let cancelled = false;
    Promise.all(plans.map((p) => api.getPlanPrice(p.key).catch(() => null))).then((results) => {
      if (cancelled) return;
      const map = {};
      results.forEach((r, i) => {
        if (r) map[plans[i].key] = r;
      });
      setPrices(map);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedPlan = plans.find((p) => p.key === selectedKey) || plans[0];
  const features = selectedPlan?.features || [];

  function dailyRate(plan) {
    const priceInfo = prices?.[plan.key];
    const amount = priceInfo ? priceInfo.amount : plan.price;
    return Math.round(amount / plan.durationDays);
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 tp-safe-top pb-8 bg-[#0F1424] min-h-full text-white animate-slide-in">
      <div className="flex items-center gap-3 mb-1">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0"
        >
          <ChevronLeft size={20} color="#E5E7EB" />
        </button>
        <h1 className="text-2xl font-extrabold text-white">{t("premium.title")}</h1>
      </div>
      <p className="text-gray-400 text-sm mt-1 mb-6 ml-12">{t("premium.subtitle")}</p>

      {/* Imkoniyatlar — barcha muddatlar uchun bir xil, shuning uchun bir marta */}
      <div
        className="rounded-3xl p-5 mb-5"
        style={{
          background: "linear-gradient(160deg, rgba(108,92,231,0.16), rgba(168,85,247,0.05))",
          boxShadow: "0 0 0 1px rgba(108,92,231,0.35) inset",
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#EEEBFF" }}
          >
            <Sparkles size={20} color={ACCENT_FROM} />
          </div>
          <p className="font-extrabold text-lg leading-none">{t("premium.proTitle")}</p>
        </div>
        <div className="space-y-2">
          {features.map((f, i) => (
            <div key={i} className="flex items-start gap-2">
              <Check size={14} className="mt-[3px] shrink-0" color="#A855F7" />
              <span className="text-xs text-gray-300 leading-snug">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Muddat tanlash */}
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
        {t("premium.choosePeriod")}
      </p>

      <div className="space-y-3 mb-6">
        {plans.map((plan) => {
          const priceInfo = prices?.[plan.key];
          const hasDiscount = priceInfo?.discountPercent > 0;
          const displayAmount = priceInfo ? priceInfo.amount : plan.price;
          const isSelected = selectedKey === plan.key;

          return (
            <button
              key={plan.key}
              onClick={() => setSelectedKey(plan.key)}
              className="w-full text-left rounded-2xl p-4 flex items-center gap-3 transition-all"
              style={{
                background: isSelected ? "rgba(108,92,231,0.14)" : "rgba(255,255,255,0.03)",
                boxShadow: isSelected
                  ? `0 0 0 2px ${ACCENT_FROM} inset`
                  : "0 0 0 1px rgba(255,255,255,0.08) inset",
              }}
            >
              <div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                style={{ borderColor: isSelected ? ACCENT_FROM : "rgba(255,255,255,0.25)" }}
              >
                {isSelected && (
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ACCENT_FROM }} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm">{plan.name}</p>
                  {plan.badge && (
                    <span
                      className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white shrink-0"
                      style={{ background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
                    >
                      {plan.badge}
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-[11px] mt-0.5 flex items-center gap-1">
                  <Clock size={10} />
                  {t("premium.perDay", { amount: formatPrice(dailyRate(plan)) })}
                </p>
              </div>

              <div className="text-right shrink-0">
                {hasDiscount && (
                  <p className="text-gray-500 text-[11px] line-through leading-none mb-0.5">
                    {formatPrice(priceInfo.originalAmount)}
                  </p>
                )}
                <p className="font-extrabold text-base leading-none">
                  {formatPrice(displayAmount)}
                  <span className="text-[10px] font-medium text-gray-400"> so'm</span>
                </p>
                {hasDiscount && (
                  <p className="text-[10px] font-bold mt-1" style={{ color: "#34D399" }}>
                    −{priceInfo.discountPercent}%
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onSelectPlan?.(selectedPlan)}
        className="w-full rounded-2xl py-3.5 font-bold text-sm text-white active:scale-[0.98] transition-transform"
        style={{ background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
      >
        {t("premium.select", { name: selectedPlan.name })}
      </button>

      <p className="text-center text-gray-500 text-[11px] mt-6 leading-relaxed px-4">
        {t("premium.disclaimer")}
      </p>
    </div>
  );
}
