import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { User, Clock, Cake } from "lucide-react";
import GradientIcon from "../components/GradientIcon";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { ACCENT_FROM, ACCENT_WARM } from "../theme";
import { api, setToken } from "../api";

// Foydalanuvchi bir marta to'ldirgan ro'yxatdan o'tish anketasi shu yerda
// saqlanadi — keyingi safar ilova ochilganda forma qayta so'ralmaydi,
// Telegram orqali kirish esa har safar orqa fonda, ko'rinmas holda ketadi.
const PROFILE_KEY = "tezprava_profile";

function getSavedProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveProfile(profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // localStorage yo'q/bloklangan bo'lsa ham ilova ishlashda davom etadi —
    // bu safar shunchaki har kirishda anketa qayta chiqishi mumkin.
  }
}

const STUDY_TIME_OPTIONS = [
  { value: 10, labelKey: "login.studyTime.min10" },
  { value: 20, labelKey: "login.studyTime.min20" },
  { value: 30, labelKey: "login.studyTime.min30" },
  { value: 60, labelKey: "login.studyTime.min60" },
  { value: 90, labelKey: "login.studyTime.min90plus" },
];

// 1-EKRAN: Ro'yxatdan o'tish (anketa) — Telegram orqali kirish orqa fonda ketadi
export default function LoginScreen({ onLogin, externalNotice }) {
  const { t } = useTranslation();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(externalNotice || "");

  // Anketa maydonlari
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [studyMinutes, setStudyMinutes] = useState(null);

  const savedProfile = getSavedProfile();
  // Sessiya tugagani/bloklangani sababli qaytarilgan bo'lsak, saqlangan
  // profil bo'lsa ham forma ko'rsatilmaydi (aks holda cheksiz silent-login
  // sinash aylanasiga tushib qolamiz) — lekin foydalanuvchiga nima
  // bo'lganini tushuntiramiz va qayta urinish imkoni beriladi.
  const [silentLoginFailed, setSilentLoginFailed] = useState(false);
  const needsForm = !savedProfile || silentLoginFailed;

  const performTelegramLogin = async (profile) => {
    setError("");
    const tg = window.Telegram?.WebApp;
    const initData = tg?.initData;

    if (!initData) {
      setError(
        "Bu ilova faqat Telegram ichida ochilganda ishlaydi. Botdagi tugma orqali kiring."
      );
      setConnecting(false);
      return;
    }

    setConnecting(true);
    try {
      const { token, user } = await api.loginWithTelegram(initData, profile);
      setToken(token);
      if (profile) saveProfile(profile);
      onLogin(user);
    } catch (err) {
      setError(err.message);
      setConnecting(false);
      // Orqa fondagi (silent) urinish muvaffaqiyatsiz bo'lsa — masalan hisob
      // bloklangan bo'lsa — ilgari foydalanuvchi abadiy spinner ekranida
      // qolib ketardi, chiqish yo'li yo'q edi. Endi formaga qaytaramiz.
      if (!profile) setSilentLoginFailed(true);
    }
  };

  // Profil allaqachon saqlangan bo'lsa — foydalanuvchiga hech narsa
  // ko'rsatmasdan, ekran ochilishi bilanoq orqa fonda Telegram orqali
  // kirishni boshlaymiz (foydalanuvchi ID va @username shu yo'l bilan olinadi).
  useEffect(() => {
    if (savedProfile) {
      performTelegramLogin(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !age || !studyMinutes) return;

    const profile = {
      name: name.trim(),
      age: Number(age),
      dailyStudyMinutes: studyMinutes,
    };
    performTelegramLogin(profile);
  };

  const isFormValid = name.trim().length > 0 && age && studyMinutes;

  // Profil bor bo'lsa — orqa fondagi silent-login tugagunicha oddiy
  // yuklanish holatini ko'rsatamiz (forma umuman ko'rinmaydi).
  if (!needsForm) {
    return (
      <div className="flex flex-col h-full bg-[#0B0B14] text-white px-6 items-center justify-center gap-4">
        <GradientIcon />
        <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        {error && (
          <p className="text-center text-red-400 text-xs leading-relaxed px-2 max-w-xs">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0B0B14] text-white px-6 overflow-y-auto">
      <div className="flex justify-end pt-4">
        <LanguageSwitcher variant="dark" />
      </div>

      <div className="flex flex-col items-center gap-5 pt-2 pb-8">
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
          <p className="text-white/50 text-sm mt-2 max-w-[280px] mx-auto">
            {t("login.registerSubtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4 mt-2">
          {/* Ism */}
          <div>
            <label className="text-xs text-white/50 mb-1.5 flex items-center gap-1.5">
              <User size={13} /> {t("login.nameLabel")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("login.namePlaceholder")}
              maxLength={80}
              className="w-full rounded-xl bg-white/[0.06] border border-white/10 px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-white/30 transition-colors"
            />
          </div>

          {/* Yosh */}
          <div>
            <label className="text-xs text-white/50 mb-1.5 flex items-center gap-1.5">
              <Cake size={13} /> {t("login.ageLabel")}
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={5}
              max={100}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder={t("login.agePlaceholder")}
              className="w-full rounded-xl bg-white/[0.06] border border-white/10 px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-white/30 transition-colors"
            />
          </div>

          {/* Kuniga qancha shug'ullanadi */}
          <div>
            <label className="text-xs text-white/50 mb-1.5 flex items-center gap-1.5">
              <Clock size={13} /> {t("login.studyTimeLabel")}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STUDY_TIME_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setStudyMinutes(opt.value)}
                  className="rounded-xl border px-3 py-2.5 text-xs font-medium transition-colors"
                  style={
                    studyMinutes === opt.value
                      ? {
                          background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_WARM})`,
                          borderColor: "transparent",
                          color: "#0B0B14",
                        }
                      : {
                          background: "rgba(255,255,255,0.06)",
                          borderColor: "rgba(255,255,255,0.1)",
                          color: "rgba(255,255,255,0.7)",
                        }
                  }
                >
                  {t(opt.labelKey)}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!isFormValid || connecting}
            className="w-full flex items-center justify-center gap-2.5 rounded-2xl py-3.5 font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-40 mt-2"
            style={{
              background: `linear-gradient(90deg, ${ACCENT_FROM}, ${ACCENT_WARM})`,
            }}
          >
            {connecting ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                {t("login.connecting")}
              </>
            ) : (
              t("login.registerButton")
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
        </form>
      </div>

      <div className="pb-8 mt-auto text-center text-white/25 text-xs">
        @TezPrava_Bot
      </div>
    </div>
  );
}
