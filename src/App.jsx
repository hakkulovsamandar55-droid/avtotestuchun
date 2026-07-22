import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import LoginScreen from "./screens/LoginScreen";
import LoadingScreen from "./screens/LoadingScreen";
import MainApp from "./screens/MainApp";
import { setSessionExpiredHandler } from "./api";

// TezPrava — Login -> Loading -> Asosiy ilova (3 bo'lim)
export default function App() {
  const { t } = useTranslation();
  const [stage, setStage] = useState("login"); // login -> loading -> app
  const [user, setUser] = useState(null);
  // Sessiya tugagani/hisob bloklangani haqida LoginScreen'ga ko'rsatiladigan xabar.
  const [sessionNotice, setSessionNotice] = useState(null);

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    setSessionNotice(null);
    setStage("loading");
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
      {stage === "loading" && <LoadingScreen onDone={() => setStage("app")} />}
      {stage === "app" && <MainApp user={user} />}
    </div>
  );
}
