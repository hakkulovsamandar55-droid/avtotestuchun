import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import GradientIcon from "../components/GradientIcon";
import { ACCENT_FROM, ACCENT_WARM } from "../theme";

// 2-EKRAN: Savollar tayyorlanmoqda progress bar
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

  return (
    <div className="flex flex-col h-full bg-[#0B0B14] text-white">
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <span className="text-white/40 text-sm">8:02</span>
        <span className="font-semibold">Tez Prava</span>
        <span className="w-5" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-10">
        <GradientIcon />
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
