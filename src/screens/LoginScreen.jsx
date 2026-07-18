import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Send } from "lucide-react";
import GradientIcon from "../components/GradientIcon";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { ACCENT_FROM, ACCENT_WARM } from "../theme";
import { api, setToken } from "../api";

// 1-EKRAN: Telegram orqali kirish
export default function LoginScreen({ onLogin }) {
  const { t } = useTranslation();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  const handleTelegramLogin = async () => {
    setError("");
    const tg = window.Telegram?.WebApp;
    const initData = tg?.initData;

    if (!initData) {
      setError(
        "Bu ilova faqat Telegram ichida ochilganda ishlaydi. Botdagi tugma orqali kiring."
      );
      return;
    }

    setConnecting(true);
    try {
      const { token, user } = await api.loginWithTelegram(initData);
      setToken(token);
      onLogin(user);
    } catch (err) {
      setError(err.message);
      setConnecting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0B14] text-white px-6">
      <div className="flex justify-end pt-4">
        <LanguageSwitcher variant="dark" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 -mt-10">
        <GradientIcon />
        <div className="text-center">
          <h1
            className="text-3xl font-extrabold tracking-tight"
            style={{
              background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_WARM})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {t("login.title")}
          </h1>
          <p className="text-white/50 text-sm mt-2 max-w-[260px] mx-auto">
            {t("login.subtitle")}
          </p>
        </div>

        <div className="w-full max-w-xs mt-6 space-y-3">
          <button
            onClick={handleTelegramLogin}
            disabled={connecting}
            className="w-full flex items-center justify-center gap-2.5 rounded-2xl py-3.5 font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-70"
            style={{ backgroundColor: "#229ED9" }}
          >
            {connecting ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                {t("login.connecting")}
              </>
            ) : (
              <>
                <Send size={18} strokeWidth={2.2} />
                {t("login.telegramButton")}
              </>
            )}
          </button>
          <p className="text-center text-white/30 text-xs leading-relaxed px-2">
            {t("login.consent")}
          </p>
          {error && (
            <p className="text-center text-red-400 text-xs leading-relaxed px-2">
              {error}
            </p>
          )}
        </div>
      </div>

      <div className="pb-8 text-center text-white/25 text-xs">
        @TezPrava_Bot
      </div>
    </div>
  );
}
