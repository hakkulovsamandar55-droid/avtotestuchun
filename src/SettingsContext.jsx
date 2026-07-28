import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "./api";
import { defaultFeatureAccess } from "../shared/config/features";

/**
 * GLOBAL SOZLAMALAR KONTEKSTI
 *
 * Butun ilova uchun bitta joydan: global bepul rejim yoqilganmi, qaysi
 * imkoniyat pullik, "Telegram" tugmasi qaysi havolaga olib boradi.
 *
 * NIMA UCHUN KONTEKST: bu qiymatlar ko'p ekranda kerak (sozlamalar,
 * imtihon, mavzular...). Har biri alohida so'rov yuborsa, ilova
 * ochilganda o'nlab bir xil so'rov ketardi.
 *
 * XATOGA CHIDAMLILIK: so'rov muvaffaqiyatsiz bo'lsa (tarmoq yo'q,
 * eski backend), ilova ISHLASHDA DAVOM ETADI — boshlang'ich qiymatlar
 * ishlatiladi. Ya'ni sozlamalar yuklanmasa ham hech narsa buzilmaydi.
 */
const SettingsContext = createContext({
  globalFreeMode: false,
  featureAccess: defaultFeatureAccess(),
  supportLink: null,
  loading: true,
  reload: () => {},
});

export function SettingsProvider({ children }) {
  const [state, setState] = useState({
    globalFreeMode: false,
    featureAccess: defaultFeatureAccess(),
    supportLink: null,
    loading: true,
  });

  const load = useCallback(async () => {
    try {
      const s = await api.getPublicSettings();
      setState({
        globalFreeMode: Boolean(s.globalFreeMode),
        featureAccess: s.featureAccess || defaultFeatureAccess(),
        supportLink: s.supportLink || null,
        loading: false,
      });
    } catch (err) {
      // Boshlang'ich qiymatlar bilan davom etamiz
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SettingsContext.Provider value={{ ...state, reload: load }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

/**
 * Imkoniyat shu foydalanuvchi uchun ochiqmi.
 *
 * MUHIM: bu FAQAT UI uchun (qulf belgisini ko'rsatish/yashirish).
 * Haqiqiy cheklov backendda — settingsService.isFeatureAvailable().
 * Frontenddagi tekshiruvni chetlab o'tish mumkin, shuning uchun unga
 * xavfsizlik nuqtai nazaridan tayanilmaydi.
 */
export function useFeature(featureKey, user) {
  const { globalFreeMode, featureAccess } = useSettings();
  if (globalFreeMode) return true;
  if (featureAccess[featureKey] === "FREE") return true;
  return Boolean(user?.isPremium);
}
