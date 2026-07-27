import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Sparkles,
  ClipboardCheck,
  Layers,
  TrafficCone,
  Shuffle,
  Swords,
  BarChart3,
  Globe,
  PartyPopper,
  ChevronLeft,
  X,
} from "lucide-react";

const STORAGE_KEY = "tezprava-onboarding-seen";

/** localStorage o'qib bo'lmasa ham ilova ishlashda davom etishi kerak —
 * shu holatda onboarding har safar qayta ko'rsatilmasligi uchun "ko'rilgan"
 * deb hisoblaymiz (aks holda foydalanuvchi har ochganda bezovta bo'ladi). */
export function hasSeenOnboarding() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch (e) {
    return true;
  }
}

export function markOnboardingSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch (e) {
    // saqlab bo'lmasa ham davom etamiz
  }
}

// Har bir slayd: ikonka + tarjima kaliti (onboarding.slides.<key>.title/.desc)
const SLIDES = [
  { key: "welcome", icon: Sparkles },
  { key: "officialExam", icon: ClipboardCheck },
  { key: "tickets", icon: Layers },
  { key: "signs", icon: TrafficCone },
  { key: "practiceTools", icon: Shuffle },
  { key: "duel", icon: Swords },
  { key: "stats", icon: BarChart3 },
  { key: "language", icon: Globe },
  { key: "ready", icon: PartyPopper },
];

const SWIPE_THRESHOLD = 45;

/**
 * Birinchi marta kirgan foydalanuvchiga ilovaning barcha asosiy
 * bo'limlarini tushuntiradigan to'liq ekranli slayd-shou.
 *
 * MainApp shu componentni faqat `!hasSeenOnboarding()` bo'lganda ko'rsatadi
 * va foydalanuvchi "O'tkazib yuborish" yoki oxirgi slayddagi "Boshlash"
 * tugmasini bosganda `onFinish` chaqiriladi — u yerda `markOnboardingSeen()`
 * chaqirilib, holat localStorage'ga yoziladi, shuning uchun keyingi
 * kirishlarda qayta ko'rsatilmaydi.
 */
export default function OnboardingSlideshow({ onFinish }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(null);

  const isLast = index === SLIDES.length - 1;
  const slide = SLIDES[index];
  const Icon = slide.icon;

  const goNext = () => {
    if (isLast) {
      onFinish();
    } else {
      setIndex((i) => Math.min(i + 1, SLIDES.length - 1));
    }
  };
  const goPrev = () => setIndex((i) => Math.max(i - 1, 0));

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (dx < -SWIPE_THRESHOLD) goNext();
    else if (dx > SWIPE_THRESHOLD) goPrev();
  };

  return (
    <div
      className="flex flex-col h-full bg-app animate-fade-in"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Tepa qator: orqaga (birinchi slayddan tashqari) + o'tkazib yuborish */}
      <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-1 shrink-0">
        <button
          onClick={goPrev}
          className={`w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform ${
            index === 0 ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)" }}
          aria-label={t("onboarding.back")}
        >
          <ChevronLeft size={18} color="var(--text-primary)" />
        </button>

        {!isLast && (
          <button
            onClick={onFinish}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full active:scale-95 transition-transform"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)" }}
          >
            <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
              {t("onboarding.skip")}
            </span>
            <X size={13} color="var(--text-secondary)" />
          </button>
        )}
        {isLast && <div className="w-9 h-9" />}
      </div>

      {/* Slayd tarkibi */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div
          key={slide.key}
          className="w-[92px] h-[92px] rounded-full flex items-center justify-center mb-7 animate-pop-in"
          style={{
            background: "linear-gradient(135deg, var(--accent-from), var(--accent-to))",
            boxShadow:
              "0 16px 38px color-mix(in srgb, var(--accent-from) 40%, transparent), inset 0 1px 0 rgba(255,255,255,0.3)",
          }}
        >
          <Icon size={40} color="#FFFFFF" strokeWidth={1.8} />
        </div>

        <h2
          className="text-[21px] font-extrabold tracking-tight leading-snug"
          style={{ color: "var(--text-primary)" }}
        >
          {t(`onboarding.slides.${slide.key}.title`)}
        </h2>
        <p
          className="text-[14px] leading-relaxed mt-3 max-w-[320px]"
          style={{ color: "var(--text-secondary)" }}
        >
          {t(`onboarding.slides.${slide.key}.desc`)}
        </p>
      </div>

      {/* Pastki qism: nuqtalar + asosiy tugma */}
      <div className="shrink-0 px-6 pb-[calc(env(safe-area-inset-bottom,0px)+1.75rem)] pt-2">
        <div className="flex items-center justify-center gap-2 mb-5">
          {SLIDES.map((s, i) => (
            <button
              key={s.key}
              onClick={() => setIndex(i)}
              aria-label={`${i + 1}`}
              className="h-2 rounded-full transition-all duration-200"
              style={{
                width: i === index ? 22 : 8,
                background:
                  i === index
                    ? "linear-gradient(90deg, var(--accent-from), var(--accent-to))"
                    : "var(--track)",
              }}
            />
          ))}
        </div>

        <button
          onClick={goNext}
          className="w-full rounded-[19px] py-4 font-bold text-[15px] text-white flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
          style={{
            background: "linear-gradient(135deg, var(--accent-from), var(--accent-to))",
            boxShadow:
              "0 14px 34px color-mix(in srgb, var(--accent-from) 40%, transparent), inset 0 1px 0 rgba(255,255,255,0.3)",
          }}
        >
          {isLast ? t("onboarding.start") : t("onboarding.next")}
        </button>
      </div>
    </div>
  );
}
