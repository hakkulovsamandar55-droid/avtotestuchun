# TezPrava

Telegram Mini App uslubidagi PDD/YHQ imtihoniga tayyorgarlik ilovasi.
Frontend (React + Vite) va real backend (Node.js + Express + PostgreSQL, `backend/` papkada).

## Ishga tushirish

Backend: `backend/README.md` ga qarang (Telegram auth, admin panel, PostgreSQL sozlash).

Frontend:
```bash
npm install
cp .env.example .env   # VITE_API_URL ni backend manzilingizga moslang
npm run dev
```

Brauzerda `http://localhost:5173` ochiladi.

## Papka strukturasi

```
tezprava-demo/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── backend/               # Node.js + Express + PostgreSQL (batafsil: backend/README.md)
└── src/
    ├── main.jsx           # React kirish nuqtasi
    ├── App.jsx            # Telefon ramkasi + ekranlar oqimi (login → loading → app)
    ├── api.js             # Backend bilan gaplashish uchun yagona joy (token, fetch)
    ├── index.css          # Tailwind
    ├── theme.js            # Umumiy ranglar (ACCENT_FROM, ACCENT_TO, ACCENT_WARM)
    ├── data/
    │   └── signsData.js       # Yo'l belgilari ma'lumotlari
    ├── i18n/
    │   ├── index.js           # i18next konfiguratsiyasi + LANGUAGES ro'yxati
    │   └── locales/
    │       ├── uz-latn.js     # O'zbekcha (lotin) — standart til
    │       ├── uz-cyrl.js     # Ўзбекча (кирилл)
    │       └── ru.js          # Русский
    ├── components/
    │   ├── GradientIcon.jsx      # Logotip
    │   ├── SignIcon.jsx          # Yo'l belgisi piktogrammasi
    │   ├── BottomNav.jsx         # Pastki 3 bo'limli navigatsiya
    │   └── LanguageSwitcher.jsx  # Til tanlovchi (Login va Sozlamalarda ishlatiladi)
    └── screens/
        ├── LoginScreen.jsx      # 1. Telegram orqali kirish (real auth) + til tanlovchi
        ├── LoadingScreen.jsx    # 2. "Savollar tayyorlanmoqda..."
        ├── MainApp.jsx          # 3. Asosiy ilova shell (nav + tab/ekran almashtirish)
        ├── HomeTab.jsx          # 3a. O'rganish bo'limi
        ├── StatsTab.jsx         # 3b. Statistika bo'limi
        ├── SettingsTab.jsx      # 3c. Sozlamalar bo'limi (adminlar uchun Admin panel qatori bilan)
        ├── TicketsScreen.jsx    # Test biletlari
        ├── SignsScreen.jsx      # Yo'l belgilari ro'yxati va qidiruvi
        └── AdminPanelScreen.jsx # Faqat adminlar uchun — foydalanuvchi qidiruvi
```

## Tillar (i18n)

Uchta til qo'llab-quvvatlanadi:

| Kod | Til |
|---|---|
| `uz_latn` | O'zbekcha (lotin) — standart |
| `uz_cyrl` | Ўзбекча (кирилл) |
| `ru` | Русский |

Til Login ekranidagi (o'ng yuqori burchak) va Sozlamalar bo'limidagi tugma orqali almashtiriladi — tanlov darhol butun ilova bo'ylab qo'llaniladi.

**Yangi matn qo'shish:** `src/i18n/locales/` ichidagi 3 ta faylga bir xil kalit bilan qo'shing, so'ng komponentda `useTranslation()` dan olingan `t("bo'lim.kalit")` orqali chaqiring. Uchala faylda ham bir xil kalitlar to'plami bo'lishi shart — biror tilda kalit yetishmasa, o'sha joyda standart til (`uz_latn`) ko'rinadi.

**Yangi til qo'shish:** `src/i18n/locales/` ga yangi fayl qo'shing (masalan `en.js`), `src/i18n/index.js` dagi `resources` va `LANGUAGES` ro'yxatiga kiriting, va `languageNames` blokini har bir mavjud tarjima faylida yangilang.

## Ikonlarni almashtirish

Hozircha barcha ikonlar `lucide-react` kutubxonasidan (sodda chiziqli). O'z ikonlaringizni qo'shish uchun:

1. SVG/PNG fayllaringizni `src/assets/icons/` papkasiga joylashtiring
2. Kerakli komponentda (masalan `HomeTab.jsx` dagi `menuItems` yoki `GradientIcon.jsx`) `lucide-react` importini o'z faylingiz importiga almashtiring

Har bir ekran alohida faylda bo'lgani uchun faqat kerakli faylni ochib, shu joydagi ikon importini almashtirsangiz yetarli — qolgan fayllarga tegmaysiz.
