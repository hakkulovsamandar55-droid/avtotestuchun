import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import LoginScreen from "./screens/LoginScreen";
import MainApp from "./screens/MainApp";
import { setSessionExpiredHandler } from "./api";

// TezPrava — Login -> Asosiy ilova (2 bo'lim)
//
// MUHIM: bu yerda ilgari Login -> LoadingScreen -> MainApp uch bosqichli
// oqim bor edi. LoadingScreen 2-3 soniya SOXTA progress-bar ko'rsatib
// turardi — "savollar tayyorlanmoqda" deyilgan, lekin hech qanday tarmoq
// so'rovi yo'q edi, faqat setInterval bilan random son o'sib borardi.
//
// Bu ikki muammo keltirardi:
//   1) Har safar kirishda kerak bo'lmagan 2-3 soniya kutish
//   2) Backend/baza uxlab yotgan bo'lsa (Neon compute suspend), haqiqiy
//      kutish LOGIN so'rovida (api.loginWithTelegram) allaqachon sodir
//      bo'ladi. LoadingScreen shu haqiqiy kutishdan KEYIN yana qo'shimcha
//      soxta kutish qo'shardi — foydalanuvchi ikki marta kutardi.
//
// Endi login tugashi bilan (haqiqiy so'rov allaqachon bajarilgan bo'lib)
// darhol MainApp ochiladi. Agar backend sekin javob bersa, buni
// LoginScreen o'zi ko'rsatadi (pastga qarang) — soxta emas, haqiqiy holat.
export default function App() {
  const { t } = useTranslation();
  const [stage, setStage] = useState("login"); // login -> app
  const [user, setUser] = useState(null);
  // Sessiya tugagani/hisob bloklangani haqida LoginScreen'ga ko'rsatiladigan xabar.
  const [sessionNotice, setSessionNotice] = useState(null);

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    setSessionNotice(null);
    setStage("app");
  };

  // MUHIM: ilgari 401 (token muddati tugagan) yoki 403 (bloklangan) javoblar
  // hech qayerda ushlanmasdi — ilova "o'lik" holatda qolib, foydalanuvchi
  // hech narsa qila olmasdi. Endi bunday holatda markazlashgan tarzda
  // login ekraniga qaytariladi va sabab ko'rsatiladi.
  useEffect(() => {
    setSessionExpiredHandler(({ reason }) => {
      setUser(null);
      setSessionNotice(
        reason === "blocked" ? t("session.blocked") : t("session.expired")
      );
      setStage("login");
    });
    return () => setSessionExpiredHandler(null);
  }, [t]);

  return (
    <div className="h-screen w-full overflow-hidden bg-[#0B0B14] dark:bg-[#0B0B14]">
      {stage === "login" && (
        <LoginScreen onLogin={handleLogin} externalNotice={sessionNotice} />
      )}
      {stage === "app" && <MainApp user={user} />}
    </div>
  );
}
