import React, { createContext, useContext, useEffect, useState } from "react";
import { THEMES, THEME_ORDER, DEFAULT_THEME } from "./themes";

const ThemeContext = createContext(null);
const STORAGE_KEY = "tezprava-theme";

// Olib tashlangan temalarning o'rnini bosuvchi xarita.
//
// NIMA UCHUN KERAK: barcha eski temalar (light/dark/aurora/amber/crimson va
// undan oldingi pink) yangi "frosted glass" uslubidagi temalar bilan
// almashtirildi. Foydalanuvchilarda localStorage'da hali eski kalit turibdi.
// Migratsiyasiz ular jimgina standart temaga tushib qolardi — bu "mening
// temam yo'qoldi" bo'lib ko'rinadi. Eng yaqin yangi temaga o'tkazamiz:
// yorug'lar -> day, quyuqlar -> night, rangdorlar -> mos rang varianti.
const THEME_MIGRATIONS = {
  light: "day",
  aurora: "day",
  dark: "night",
  pink: "ink",
  crimson: "ink",
  amber: "dune",
};

function getInitialTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      if (THEMES[saved]) return saved;
      const migrated = THEME_MIGRATIONS[saved];
      if (migrated && THEMES[migrated]) return migrated;
    }
  } catch (e) {
    // localStorage yo'q bo'lishi mumkin — jim o'tkazamiz
  }
  // Tizim sozlamasini hurmat qilamiz
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
    return "day";
  }
  return DEFAULT_THEME;
}

export function ThemeProvider({ children }) {
  const [themeKey, setThemeKey] = useState(getInitialTheme);
  const theme = THEMES[themeKey];

  useEffect(() => {
    const root = document.documentElement;

    // "dark" Tailwind klassi — faqat quyuq fondagi temalarda (dark, crimson) yoqiladi,
    // shunda dark: bilan yozilgan eski klasslar ham to'g'ri ishlaydi
    if (theme.isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Har bir temaning CSS o'zgaruvchilarini <html> ga yozamiz
    Object.entries(theme.vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    root.style.setProperty("--accent-from", theme.accentFrom);
    root.style.setProperty("--accent-to", theme.accentTo);

    root.setAttribute("data-theme", themeKey);

    // Telegram Mini App sarlavha rangi fon bilan mos bo'lishi kerak — aks
    // holda ilova tepasida begona rangli chiziq ko'rinadi.
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme.vars["--bg-app"]);

    try {
      localStorage.setItem(STORAGE_KEY, themeKey);
    } catch (e) {
      // saqlab bo'lmasa ham ilova ishlashda davom etadi
    }
  }, [themeKey, theme]);

  const cycleTheme = () => {
    setThemeKey((current) => {
      const idx = THEME_ORDER.indexOf(current);
      return THEME_ORDER[(idx + 1) % THEME_ORDER.length];
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        themeKey,
        theme,
        setThemeKey,
        cycleTheme,
        themeList: THEME_ORDER.map((key) => ({ key, ...THEMES[key] })),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme faqat ThemeProvider ichida ishlatilishi kerak");
  return ctx;
}
