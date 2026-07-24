import React, { createContext, useContext, useEffect, useState } from "react";
import { THEMES, THEME_ORDER } from "./themes";

const ThemeContext = createContext(null);
const STORAGE_KEY = "tezprava-theme";

// Olib tashlangan temalarning o'rnini bosuvchi xarita.
//
// NIMA UCHUN KERAK: "pink" temasi "aurora" bilan almashtirildi. Uni tanlagan
// foydalanuvchilarda localStorage'da hali ham "pink" saqlanib turibdi.
// Migratsiyasiz ular jimgina "light" ga tushib qolardi — bu "mening temam
// yo'qoldi" bo'lib ko'rinadi. Yangi temaga o'tkazish to'g'riroq.
const THEME_MIGRATIONS = {
  pink: "aurora",
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
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
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
