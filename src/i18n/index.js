import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import uzLatn from "./locales/uz-latn";
import uzCyrl from "./locales/uz-cyrl";
import ru from "./locales/ru";

// Qo'llab-quvvatlanadigan tillar ro'yxati — Sozlamalar va Login
// ekranlaridagi til tanlovchi shu ro'yxatdan foydalanadi.
export const LANGUAGES = [
  { code: "uz_latn", nativeKey: "uz_latn" },
  { code: "uz_cyrl", nativeKey: "uz_cyrl" },
  { code: "ru", nativeKey: "ru" },
];

i18n.use(initReactI18next).init({
  resources: {
    uz_latn: { translation: uzLatn },
    uz_cyrl: { translation: uzCyrl },
    ru: { translation: ru },
  },
  lng: "uz_latn",
  fallbackLng: "uz_latn",
  interpolation: { escapeValue: false },
});

export default i18n;
