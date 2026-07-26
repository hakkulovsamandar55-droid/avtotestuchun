// ============================================================================
// TEMALAR — "frosted glass" uslubi
//
// Barcha eski temalar (light/dark/aurora/amber/crimson) olib tashlandi va
// bitta izchil uslubga almashtirildi: quyuq yoki yorug' fon ustida yumshoq
// rangli oqim, uning ustida RANGSIZ shisha panellar.
//
// ASOSIY QOIDA: shisha panelning o'z rangi YO'Q. U faqat orqasidagi fonni
// xiralashtiradi. Rang faqat fondan o'tadi. Shu sababli barcha temalarda
// panel qiymatlari bir xil oilada — o'zgaradigan narsa FON.
//
// NIMA UCHUN BLOB'LAR RADIAL-GRADIENT (blur qilingan div emas):
// 4 ta `filter: blur(70px)` div juda qimmat — har kadrda qayta hisoblanadi
// va eski Android'da aylantirishni sekinlashtiradi. Bir nechta
// radial-gradient esa bitta background-image sifatida GPU'da bir marta
// rasterlanadi va vizual natija deyarli bir xil.
// ============================================================================

export const THEMES = {
  // ---- TUNGI (asosiy) — foydalanuvchi tanlagan uslub ----
  night: {
    label: "Tungi",
    isDark: true,
    accentFrom: "#5EEAD4",
    accentTo: "#7DD3FC",
    vars: {
      "--bg-app": "#05070C",
      // Ochiluvchi oyna va modal uchun QATTIQ fon (shaffof emas).
      // Sticky sarlavha shaffof bo'lsa ostidagi ro'yxat ko'rinib ketadi.
      "--bg-solid": "#101725",
      "--blob-1": "rgba(8,145,178,0.55)",
      "--blob-2": "rgba(14,165,233,0.45)",
      "--blob-3": "rgba(19,78,74,0.60)",
      "--blob-4": "rgba(34,211,238,0.30)",
      "--vignette": "rgba(5,7,12,0.55)",

      "--bg-card": "rgba(255,255,255,0.11)",
      "--bg-card-soft": "rgba(255,255,255,0.06)",
      "--border-card": "rgba(255,255,255,0.18)",
      "--glass-blur": "28px",
      "--glass-shadow": "0 16px 40px rgba(0,0,0,0.5)",
      "--glass-hi": "rgba(255,255,255,0.35)",
      "--glass-lo": "rgba(0,0,0,0.25)",

      "--text-primary": "#FFFFFF",
      "--text-secondary": "rgba(255,255,255,0.82)",
      "--icon-muted": "rgba(255,255,255,0.66)",
      "--chevron": "rgba(255,255,255,0.42)",
      "--track": "rgba(255,255,255,0.12)",

      "--exam-from": "#10B981",
      "--exam-to": "#0D9488",
      "--shadow-card": "0 16px 40px rgba(0,0,0,0.5)",
    },
  },

  // ---- KUNDUZGI ----
  day: {
    label: "Kunduzgi",
    isDark: false,
    accentFrom: "#0E7490",
    accentTo: "#0891B2",
    vars: {
      "--bg-app": "#EEF3F7",
      // Ochiluvchi oyna va modal uchun QATTIQ fon (shaffof emas).
      // Sticky sarlavha shaffof bo'lsa ostidagi ro'yxat ko'rinib ketadi.
      "--bg-solid": "#FBFCFE",
      "--blob-1": "rgba(103,232,249,0.50)",
      "--blob-2": "rgba(147,197,253,0.45)",
      "--blob-3": "rgba(167,243,208,0.42)",
      "--blob-4": "rgba(255,255,255,0.70)",
      "--vignette": "rgba(238,243,247,0.35)",

      "--bg-card": "rgba(255,255,255,0.62)",
      "--bg-card-soft": "rgba(255,255,255,0.42)",
      "--border-card": "rgba(255,255,255,0.85)",
      "--glass-blur": "24px",
      "--glass-shadow": "0 14px 36px rgba(30,70,100,0.14)",
      "--glass-hi": "rgba(255,255,255,0.95)",
      "--glass-lo": "rgba(80,110,140,0.10)",

      "--text-primary": "#0F2231",
      "--text-secondary": "rgba(15,34,49,0.74)",
      "--icon-muted": "rgba(15,34,49,0.60)",
      "--chevron": "rgba(15,34,49,0.34)",
      "--track": "rgba(15,34,49,0.10)",

      "--exam-from": "#0F766E",
      "--exam-to": "#047857",
      "--shadow-card": "0 14px 36px rgba(30,70,100,0.14)",
    },
  },

  // ---- SIYOH (quyuq binafsha) ----
  ink: {
    label: "Siyoh",
    isDark: true,
    accentFrom: "#C4B5FD",
    accentTo: "#F0ABFC",
    vars: {
      "--bg-app": "#08060F",
      // Ochiluvchi oyna va modal uchun QATTIQ fon (shaffof emas).
      // Sticky sarlavha shaffof bo'lsa ostidagi ro'yxat ko'rinib ketadi.
      "--bg-solid": "#151327",
      "--blob-1": "rgba(109,40,217,0.55)",
      "--blob-2": "rgba(192,38,211,0.40)",
      "--blob-3": "rgba(30,27,75,0.65)",
      "--blob-4": "rgba(216,180,254,0.28)",
      "--vignette": "rgba(8,6,15,0.55)",

      "--bg-card": "rgba(255,255,255,0.11)",
      "--bg-card-soft": "rgba(255,255,255,0.06)",
      "--border-card": "rgba(255,255,255,0.18)",
      "--glass-blur": "28px",
      "--glass-shadow": "0 16px 40px rgba(0,0,0,0.5)",
      "--glass-hi": "rgba(255,255,255,0.34)",
      "--glass-lo": "rgba(0,0,0,0.25)",

      "--text-primary": "#FFFFFF",
      "--text-secondary": "rgba(255,255,255,0.82)",
      "--icon-muted": "rgba(255,255,255,0.66)",
      "--chevron": "rgba(255,255,255,0.42)",
      "--track": "rgba(255,255,255,0.12)",

      "--exam-from": "#14B8A6",
      "--exam-to": "#0D9488",
      "--shadow-card": "0 16px 40px rgba(0,0,0,0.5)",
    },
  },

  // ---- CHO'L (issiq qahrabo-marjon) ----
  dune: {
    label: "Cho'l",
    isDark: false,
    accentFrom: "#B45309",
    accentTo: "#D97706",
    vars: {
      "--bg-app": "#F7EFE4",
      // Ochiluvchi oyna va modal uchun QATTIQ fon (shaffof emas).
      // Sticky sarlavha shaffof bo'lsa ostidagi ro'yxat ko'rinib ketadi.
      "--bg-solid": "#FDFAF5",
      "--blob-1": "rgba(253,186,116,0.55)",
      "--blob-2": "rgba(251,146,120,0.42)",
      "--blob-3": "rgba(196,181,253,0.34)",
      "--blob-4": "rgba(255,255,255,0.65)",
      "--vignette": "rgba(247,239,228,0.30)",

      "--bg-card": "rgba(255,255,255,0.64)",
      "--bg-card-soft": "rgba(255,255,255,0.44)",
      "--border-card": "rgba(255,255,255,0.86)",
      "--glass-blur": "24px",
      "--glass-shadow": "0 14px 36px rgba(120,80,40,0.16)",
      "--glass-hi": "rgba(255,255,255,0.95)",
      "--glass-lo": "rgba(140,100,60,0.10)",

      "--text-primary": "#2A1D10",
      "--text-secondary": "rgba(42,29,16,0.74)",
      "--icon-muted": "rgba(42,29,16,0.60)",
      "--chevron": "rgba(42,29,16,0.34)",
      "--track": "rgba(42,29,16,0.10)",

      "--exam-from": "#15803D",
      "--exam-to": "#166534",
      "--shadow-card": "0 14px 36px rgba(120,80,40,0.16)",
    },
  },

  // ---- O'RMON (quyuq zumrad) ----
  forest: {
    label: "O'rmon",
    isDark: true,
    accentFrom: "#86EFAC",
    accentTo: "#BEF264",
    vars: {
      "--bg-app": "#040A08",
      // Ochiluvchi oyna va modal uchun QATTIQ fon (shaffof emas).
      // Sticky sarlavha shaffof bo'lsa ostidagi ro'yxat ko'rinib ketadi.
      "--bg-solid": "#0C1611",
      "--blob-1": "rgba(6,95,70,0.60)",
      "--blob-2": "rgba(21,128,61,0.45)",
      "--blob-3": "rgba(12,74,110,0.45)",
      "--blob-4": "rgba(134,239,172,0.24)",
      "--vignette": "rgba(4,10,8,0.55)",

      "--bg-card": "rgba(255,255,255,0.11)",
      "--bg-card-soft": "rgba(255,255,255,0.06)",
      "--border-card": "rgba(255,255,255,0.18)",
      "--glass-blur": "28px",
      "--glass-shadow": "0 16px 40px rgba(0,0,0,0.5)",
      "--glass-hi": "rgba(255,255,255,0.34)",
      "--glass-lo": "rgba(0,0,0,0.25)",

      "--text-primary": "#FFFFFF",
      "--text-secondary": "rgba(255,255,255,0.82)",
      "--icon-muted": "rgba(255,255,255,0.66)",
      "--chevron": "rgba(255,255,255,0.42)",
      "--track": "rgba(255,255,255,0.12)",

      "--exam-from": "#0D9488",
      "--exam-to": "#0F766E",
      "--shadow-card": "0 16px 40px rgba(0,0,0,0.5)",
    },
  },
};

// Sozlamalarda ko'rinish tartibi. Kunduzgi/tungi birinchi — bular asosiy
// rejimlar, qolganlari rang varianti.
export const THEME_ORDER = ["day", "night", "ink", "dune", "forest"];

export const DEFAULT_THEME = "night";
