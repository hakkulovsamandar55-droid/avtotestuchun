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

const VALID_CODES = LANGUAGES.map((l) => l.code);
export const LANGUAGE_STORAGE_KEY = "tezprava-language";

// MUHIM TUZATISH: ilgari `lng` doim "uz_latn" ga qattiq yozilgan edi —
// foydalanuvchi rus (yoki kirill) tanlasa ham, ilovani qayta ochganda
// yana o'zbek lotiniga qaytardi (tanlov hech qayerga saqlanmasdi).
// Endi tema (ThemeContext.jsx) bilan bir xil localStorage patterni
// ishlatiladi — tanlov saqlanadi va keyingi kirishda o'qiladi.
function getInitialLanguage() {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && VALID_CODES.includes(saved)) return saved;
  } catch (e) {
    // localStorage yo'q bo'lishi mumkin (masalan, ba'zi WebView sozlamalarida) — jim o'tkazamiz
  }
  return "uz_latn";
}

i18n.use(initReactI18next).init({
  resources: {
    uz_latn: { translation: uzLatn },
    uz_cyrl: { translation: uzCyrl },
    ru: { translation: ru },
  },
  lng: getInitialLanguage(),
  fallbackLng: "uz_latn",
  interpolation: { escapeValue: false },
});

// Til o'zgarganda avtomatik saqlaydi — LanguageSwitcher endi buni
// alohida chaqirishi shart emas, qayerda o'zgartirilsa ham ishlaydi.
i18n.on("languageChanged", (lng) => {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
  } catch (e) {
    // saqlab bo'lmasa ham ilova davom etadi
  }
});

export default i18n;
