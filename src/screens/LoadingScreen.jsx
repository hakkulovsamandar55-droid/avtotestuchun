import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ACCENT_FROM, ACCENT_TO, ACCENT_WARM } from "../theme";

// 2-EKRAN: Savollar tayyorlanmoqda — aylanayotgan g'ildirak animatsiyasi + progress bar
export default function LoadingScreen({ onDone }) {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(p + Math.random() * 14 + 6, 100);
        if (next >= 100) {
          clearInterval(id);
          setTimeout(onDone, 400);
        }
        return next;
      });
    }, 180);
    return () => clearInterval(id);
  }, [onDone]);

  // Tezlik progressga bog'liq — boshida sekin, oxiriga yaqin tezroq aylanadi
  const spinDuration = Math.max(0.35, 1.1 - progress / 130);

  return (
    <div className="flex flex-col h-full bg-[#0B0B14] text-white overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <span className="text-white/40 text-sm">8:02</span>
        <span className="font-semibold">Tez Prava</span>
        <span className="w-5" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-10">
        <SpinningWheel spinDuration={spinDuration} />

        <h2
          className="text-2xl font-extrabold"
          style={{
            background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_WARM})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {t("login.title")}
        </h2>
        <p className="text-white/40 text-sm -mt-3">{t("loading.preparing")}</p>

        <div className="w-full max-w-[260px]">
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-200 ease-out"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_WARM})`,
              }}
            />
          </div>
          <p className="text-center text-white/50 text-sm mt-3 tabular-nums">
            {Math.floor(progress)}%
          </p>
        </div>
      </div>
    </div>
  );
}

// Aylanayotgan mashina g'ildiragi — asfalt ustida, chang'lari harakatlanadi
function SpinningWheel({ spinDuration }) {
  return (
    <div className="relative w-24 h-24">
      {/* Orqa nur (glow) */}
      <div
        className="absolute inset-0 rounded-full blur-xl opacity-40"
        style={{ background: `linear-gradient(135deg, ${ACCENT_FROM}, ${ACCENT_TO})` }}
      />

      {/* G'ildirak o'zi */}
      <svg
        viewBox="0 0 100 100"
        className="relative w-24 h-24 drop-shadow-[0_6px_18px_rgba(108,92,231,0.45)]"
        style={{
          animation: `tp-spin ${spinDuration}s linear infinite`,
        }}
      >
        <defs>
          <linearGradient id="rimGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={ACCENT_FROM} />
            <stop offset="100%" stopColor={ACCENT_TO} />
          </linearGradient>
        </defs>

        {/* Tashqi shina (lastik) */}
        <circle cx="50" cy="50" r="46" fill="#15131f" stroke="#2a2740" strokeWidth="3" />
        {/* Protektor chiziqlari */}
        {Array.from({ length: 16 }, (_, i) => {
          const angle = (i * 360) / 16;
          return (
            <rect
              key={i}
              x="48.5"
              y="4"
              width="3"
              height="8"
              rx="1.5"
              fill="#2f2c48"
              transform={`rotate(${angle} 50 50)`}
            />
          );
        })}

        {/* Diskning o'zi (rim) */}
        <circle cx="50" cy="50" r="30" fill="url(#rimGradient)" />
        <circle cx="50" cy="50" r="30" fill="none" stroke="#0B0B14" strokeWidth="1.5" opacity="0.3" />

        {/* Spitsalar */}
        {Array.from({ length: 5 }, (_, i) => {
          const angle = (i * 360) / 5;
          return (
            <path
              key={i}
              d="M50 50 L50 24 A26 26 0 0 1 72.5 37 Z"
              fill="rgba(255,255,255,0.14)"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="0.5"
              transform={`rotate(${angle} 50 50)`}
            />
          );
        })}

        {/* Markaziy g'altak (hub) */}
        <circle cx="50" cy="50" r="9" fill="#0B0B14" stroke={ACCENT_WARM} strokeWidth="2" />
        <circle cx="50" cy="50" r="3" fill={ACCENT_WARM} />
      </svg>

      {/* Tezlik chiziqlari (motion lines) */}
      <div className="absolute -left-7 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 opacity-70">
        <span className="tp-speed-line w-5 h-[2px] rounded-full" style={{ background: ACCENT_FROM, animationDelay: "0s" }} />
        <span className="tp-speed-line w-3.5 h-[2px] rounded-full" style={{ background: ACCENT_TO, animationDelay: "0.15s" }} />
        <span className="tp-speed-line w-4 h-[2px] rounded-full" style={{ background: ACCENT_WARM, animationDelay: "0.3s" }} />
      </div>

      <style>{`
        @keyframes tp-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes tp-speed-fade {
          0% { opacity: 0; transform: translateX(6px); }
          40% { opacity: 0.9; }
          100% { opacity: 0; transform: translateX(-10px); }
        }
        .tp-speed-line {
          animation: tp-speed-fade 0.9s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
