// 5 ta tema ta'rifi: har biri CSS custom properties to'plamini beradi.
// Har bir ekran shu o'zgaruvchilardan foydalanadi (bg-app, bg-card, text-primary va h.k.)

export const THEMES = {
  light: {
    label: "Light",
    isDark: false,
    accentFrom: "#6C5CE7",
    accentTo: "#A855F7",
    vars: {
      "--bg-app": "#F7F7FA",
      "--bg-card": "#FFFFFF",
      "--bg-card-soft": "#F9FAFB",
      "--border-card": "#F3F4F6",
      "--text-primary": "#111827",
      "--text-secondary": "#9CA3AF",
      "--icon-muted": "#4B5563",
      "--chevron": "#D1D5DB",
      "--shadow-card": "0 1px 2px rgba(0,0,0,0.04)",
    },
  },
  dark: {
    label: "Dark",
    isDark: true,
    accentFrom: "#6C5CE7",
    accentTo: "#A855F7",
    vars: {
      "--bg-app": "#0B0B14",
      "--bg-card": "rgba(255,255,255,0.04)",
      "--bg-card-soft": "rgba(255,255,255,0.06)",
      "--border-card": "rgba(255,255,255,0.10)",
      "--text-primary": "#FFFFFF",
      "--text-secondary": "#9CA3AF",
      "--icon-muted": "#D1D5DB",
      "--chevron": "rgba(255,255,255,0.35)",
      "--shadow-card": "none",
    },
  },
  // NEUMORPHISM + GLASSMORPHISM + MINIMALISM
  //
  // Uchala uslub tabiatan bir-biriga zid: neumorphism qattiq, mat sirtni
  // talab qiladi; glassmorphism shaffoflik va blurni; minimalism esa
  // ikkalasining ham bezagini kamaytirishni. Ularni bitta temada
  // birlashtirish uchun QATLAMLARGA bo'lindi:
  //
  //   Fon (--bg-app)        -> neumorphic: yumshoq, deyarli rangsiz sirt
  //   Karta (--bg-card)     -> glass: yarim shaffof + blur
  //   Soya (--shadow-card)  -> ikki tomonlama (yorug'lik + soya) = neumorph
  //
  // Minimalism ranglar sonida: butun palitra bitta sovuq kulrang-ko'k
  // oilasidan, urg'u rangi ham to'yingan emas. Kontrast shakl va soya
  // orqali beriladi, rang orqali emas.
  //
  // MUHIM: --bg-card qiymati rgba — orqasidagi fon ko'rinishi uchun shart.
  // Qattiq (solid) rangga almashtirilsa, shisha effekti yo'qoladi.
  aurora: {
    label: "Aurora",
    isDark: false,
    // Urg'u — muzli ko'k-siyohrang. To'yinganligi past, chunki minimalizmda
    // rang diqqatni tortmasligi, faqat yo'naltirishi kerak.
    accentFrom: "#7C8CF8",
    accentTo: "#9EA8FB",
    vars: {
      // Neumorphic asos: sof oq emas, biroz sovuq — soyalar ko'rinishi uchun
      // Fon ozgina quyuqroq (#E8EBF2 emas) — neumorphic soyalar shu
      // farqda ishlaydi. Juda ochiq fonda kartalar "ko'tarilgan" ko'rinmaydi.
      "--bg-app": "#E3E7F0",

      // Shisha qatlam: yarim shaffof oq + blur (blur index.css da beriladi)
      "--bg-card": "rgba(255,255,255,0.58)",
      "--bg-card-soft": "rgba(255,255,255,0.38)",

      // Shisha chekkasi — yuqori qirrada yorug'lik sinishi taassuroti
      "--border-card": "rgba(255,255,255,0.75)",

      "--text-primary": "#2A3145",
      // Kontrast: karta ustida 4.8:1 (WCAG AA >= 4.5). Dastlab #7C8499 edi —
      // ko'rinishi chiroyli, lekin 3.46:1 bo'lib me'yordan past edi. Shisha
      // qatlam yarim shaffof bo'lgani uchun matn foni ochiqroq bo'ladi,
      // shuning uchun ikkilamchi matn quyuqroq bo'lishi shart.
      "--text-secondary": "#646D80",
      "--icon-muted": "#5A6379",
      "--chevron": "#A8B0C2",

      // Neumorphic ikki tomonlama soya: pastdan quyuq, tepadan yorug'.
      // Aynan shu juftlik sirtni "ko'tarilgan" qilib ko'rsatadi.
      "--shadow-card":
        "6px 6px 16px rgba(163,177,198,0.42), -6px -6px 16px rgba(255,255,255,0.85)",
    },
  },
  amber: {
    label: "Sariq",
    isDark: false,
    accentFrom: "#F59E0B",
    accentTo: "#FBBF24",
    vars: {
      "--bg-app": "#FFFBEB",
      "--bg-card": "#FFFFFF",
      "--bg-card-soft": "#FEF3C7",
      "--border-card": "#FDE68A",
      "--text-primary": "#78350F",
      "--text-secondary": "#B4894C",
      "--icon-muted": "#92400E",
      "--chevron": "#F3D48A",
      "--shadow-card": "0 1px 2px rgba(245,158,11,0.08)",
    },
  },
  crimson: {
    label: "Qizil-qora",
    isDark: true,
    accentFrom: "#DC2626",
    accentTo: "#F87171",
    vars: {
      "--bg-app": "#120607",
      "--bg-card": "rgba(220,38,38,0.06)",
      "--bg-card-soft": "rgba(220,38,38,0.10)",
      "--border-card": "rgba(248,113,113,0.18)",
      "--text-primary": "#FEF2F2",
      "--text-secondary": "#D19999",
      "--icon-muted": "#FCA5A5",
      "--chevron": "rgba(248,113,113,0.4)",
      "--shadow-card": "none",
    },
  },
};

export const THEME_ORDER = ["light", "dark", "aurora", "amber", "crimson"];
