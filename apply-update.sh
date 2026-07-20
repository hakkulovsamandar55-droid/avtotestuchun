#!/bin/bash
# TezPrava — yangilanishni bitta buyruq bilan qo'llash (zip'ni o'zi ochadi)
#
# Tayyorgarlik (bir marta):
#   1) tezprava-demo-updated.zip va apply-update.sh — ikkalasini BIR XIL papkaga qo'ying
#      (masalan ikkalasini ham Desktop'ga)
#   2) Pastdagi PROJECT manzili loyihangizga to'g'ri ekanini tekshiring
#
# Ishlatish:
#   Git bash'da shu papkaga o'ting va tering:  bash apply-update.sh
#
# MUHIM: bu safar quyidagilar yangilandi:
#  - TUZATISH: Bosh sahifadagi (Home) 🔥 streak ko'rsatkichi doim "0 kun"
#    ko'rsatib turgan edi — kod uni backend'dan kelayotgan haqiqiy
#    streakDays qiymatiga emas, qattiq yozilgan 0 ga bog'lagan edi.
#    Statistika bo'limida to'g'ri ishlagani uchun sezilmagan. Endi ikkalasi
#    ham bir xil, haqiqiy qiymatni ko'rsatadi.
#  - QAYTARILDI: Sozlamalar > Bildirishnomalar tugmasi va unga tegishli
#    backend/frontend ulanishlari (users.notifications_enabled ustuni,
#    /api/notifications/toggle) butunlay olib tashlandi.
#  - bot/ papkasi — Python (aiogram 3.x) bot, lekin hozircha sayt/baza
#    bilan HECH QANDAY aloqasi yo'q (mustaqil) — faqat /start bosilganda
#    Mini App'ga yo'naltiradi. Batafsili bot/README.md da.
# Skript oxirida "npx prisma db push" avvalgidek ishga tushiriladi (agar
# bazada eski notifications_enabled ustuni qolgan bo'lsa, buni o'zi
# olib tashlamaydi — kerak bo'lsa qo'lda migratsiya qiling).

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ZIP="$SCRIPT_DIR/tezprava-demo-updated.zip"
TMP="$SCRIPT_DIR/.tp-update-tmp"

# Loyihangiz manzili — kerak bo'lsa shu qatorni to'g'rilang
PROJECT="/c/Users/Samandar/Desktop/tezprava"

echo "Zip: $ZIP"
echo "Loyiha: $PROJECT"
echo ""

if [ ! -f "$ZIP" ]; then
  echo "XATO: zip fayl topilmadi -> $ZIP"
  echo "tezprava-demo-updated.zip shu skript bilan bir xil papkada bo'lishi kerak."
  exit 1
fi

if [ ! -d "$PROJECT" ]; then
  echo "XATO: Loyiha papkasi topilmadi -> $PROJECT"
  echo "Skript ichidagi PROJECT manzilini to'g'rilang."
  exit 1
fi

rm -rf "$TMP"
mkdir -p "$TMP"

echo "Zip ochilmoqda..."
if command -v unzip >/dev/null 2>&1; then
  unzip -q "$ZIP" -d "$TMP"
else
  powershell.exe -NoProfile -Command \
    "Expand-Archive -Path '$(cygpath -w "$ZIP")' -DestinationPath '$(cygpath -w "$TMP")' -Force"
fi

UPDATED="$TMP/tezprava-demo"

if [ ! -d "$UPDATED" ]; then
  echo "XATO: zip ichidan tezprava-demo papkasi topilmadi."
  exit 1
fi

echo "Fayllar ko'chirilmoqda..."
cd "$PROJECT"

# --- Frontend ---
cp "$UPDATED/package.json" .
cp "$UPDATED/tailwind.config.js" .
cp "$UPDATED/src/index.css" src/
cp "$UPDATED/src/api.js" src/
cp "$UPDATED/src/App.jsx" src/
cp "$UPDATED/src/main.jsx" src/
cp "$UPDATED/src/theme.js" src/
cp "$UPDATED/src/themes.js" src/
cp "$UPDATED/src/ThemeContext.jsx" src/
cp "$UPDATED/src/duelSocket.js" src/
cp "$UPDATED/src/components/BottomNav.jsx" src/components/
cp "$UPDATED/src/screens/AdminPanelScreen.jsx" src/screens/
cp "$UPDATED/src/screens/DuelScreen.jsx" src/screens/
cp "$UPDATED/src/screens/ExamScreen.jsx" src/screens/
cp "$UPDATED/src/screens/HomeTab.jsx" src/screens/
cp "$UPDATED/src/screens/MainApp.jsx" src/screens/
cp "$UPDATED/src/screens/PremiumScreen.jsx" src/screens/
cp "$UPDATED/src/screens/SettingsTab.jsx" src/screens/
cp "$UPDATED/src/screens/SignsScreen.jsx" src/screens/
cp "$UPDATED/src/screens/StatsTab.jsx" src/screens/
cp "$UPDATED/src/screens/TestScreen.jsx" src/screens/
cp "$UPDATED/src/screens/TicketsScreen.jsx" src/screens/
cp "$UPDATED/src/i18n/locales/uz-latn.js" src/i18n/locales/
cp "$UPDATED/src/i18n/locales/ru.js" src/i18n/locales/
cp "$UPDATED/src/i18n/locales/uz-cyrl.js" src/i18n/locales/

# --- Backend (Duel rejimi) ---
mkdir -p backend/src/data backend/src/routes backend/prisma
cp "$UPDATED/backend/package.json" backend/
cp "$UPDATED/backend/prisma/schema.prisma" backend/prisma/
cp "$UPDATED/backend/src/index.js" backend/src/
cp "$UPDATED/backend/src/duel.js" backend/src/
cp "$UPDATED/backend/src/asyncHandler.js" backend/src/
cp "$UPDATED/backend/src/data/signsData.js" backend/src/data/
cp "$UPDATED/backend/src/data/ticketsData.js" backend/src/data/
cp "$UPDATED/src/data/ticketsData.js" src/data/
cp "$UPDATED/backend/src/routes/auth.js" backend/src/routes/
cp "$UPDATED/backend/src/routes/admin.js" backend/src/routes/
cp "$UPDATED/backend/src/routes/stats.js" backend/src/routes/
cp "$UPDATED/backend/src/authMiddleware.js" backend/src/
cp "$UPDATED/backend/src/db.js" backend/src/
cp "$UPDATED/backend/src/telegramAuth.js" backend/src/

# --- Bot (Python, aiogram 3.x) — alohida papka, npm loyihasiga tegishli emas ---
rm -rf bot
cp -r "$UPDATED/bot" .

rm -rf "$TMP"
echo "Fayllar ko'chirildi."
echo ""

git add -A
if git diff --cached --quiet; then
  echo "O'zgarish topilmadi — commit qilinadigan narsa yo'q."
else
  git commit -m "Duel rejimi + admin/premium boshqaruvi qo'shildi"
  git push
  echo "Push qilindi."
fi

echo ""
echo "Endi paket bog'liqliklarini o'rnatamiz (yangi: socket.io, socket.io-client)..."
npm install
(cd backend && npm install)

echo ""
echo "Ma'lumotlar bazasiga yangi ustun qo'shilmoqda (users.is_premium)..."
if [ -f backend/.env ]; then
  (cd backend && npx prisma db push --accept-data-loss) || \
    echo "OGOHLANTIRISH: lokal bazaga ulanib bo'lmadi — bu muammo emas, agar backend'ni faqat Render orqali ishlatsangiz (lokalda Postgres ishlatmasangiz)."
else
  echo "backend/.env topilmadi — lokal db push o'tkazib yuborildi (production bazangiz Render orqali alohida yangilanadi, pastga qarang)."
fi

echo ""
echo "Tayyor! Lokal test qilish uchun ikkita alohida terminalda:"
echo "  1) backend papkasida:  npm run dev"
echo "  2) asosiy papkada:     npm run dev"
echo ""
echo "Render'ga deploy qilinganda backend avtomatik qayta build bo'ladi —"
echo "'npm install' ni Render o'zi bajaradi, sizga qo'shimcha ish qolmaydi."
echo ""
echo "MUHIM: Render'dagi bazada ham users.is_premium kabi ustunlar paydo bo'lishi"
echo "uchun, Render dashboard -> backend service -> Settings -> Build Command'ni"
echo "shunga almashtiring (--accept-data-loss shart, aks holda sxema"
echo "o'zgarishlari 'data loss' ogohlantirishi bilan build'ni to'xtatadi):"
echo "  npm install && npx prisma generate && npx prisma db push --accept-data-loss"
echo ""
echo "bot/ papkasi — mustaqil Python bot (bazaga ulanmaydi). Sozlash uchun"
echo "bot/README.md ga qarang. Bu skript uni o'zi ishga tushirmaydi."
