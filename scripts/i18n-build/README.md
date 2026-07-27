# i18n build pipeline (Cyrillic + Russian) — 2026-07-27

## Yakuniy holat
- **uz_cyrl**: 1188/1188 (100%, `lotin-kirill` npm kutubxonasi orqali avtomatik)
- **ru**: 1188/1188 (100%, barcha 120 bilet qo'lda, PDD terminologiyasiga mos tarjima qilindi)

Ikkala til ham to'liq tayyor va tekshirilgan (0 xatolik, id/correct/image/uz_latn
matn asl fayl bilan bitta-bittalab solishtirildi).

`translations.ru.json` — barcha 1188 savolning yagona, birlashtirilgan manba fayli.
`translations-batch*.ru.json` — tarixiy partiyalar (arxiv, allaqachon yuqoridagi
faylga birlashtirilgan, faqat kelib chiqishi uchun saqlanmoqda).

## Qayta ishga tushirish (agar kelajakda yangi savollar qo'shilsa)

1. `git show HEAD:shared/data/ticketsData.js > scripts/i18n-build/original.js`
2. `awk '/^const TICKETS = \{/{start=1} start{print} /^};$/{if(start){exit}}' original.js > tickets-raw.mjs`
   va faylning birinchi qatoriga `export ` qo'shing.
3. Yangi savollar uchun tarjimalarni `scripts/translations.ru.json`ga ID bo'yicha qo'shing.
4. `cd scripts/i18n-build && npm install lotin-kirill && node build.mjs`
5. `shared/data/ticketsData.js` dagi `const TICKETS = { ... };` blokini
   `tickets-output.js` bilan almashtiring (header/footer'ga tegmang).

## Qolgan ish (i18n bilan bog'liq emas, alohida vazifa)
- `backend/src/duel.js` (duel rejimi) hozircha default tilda (`uz_latn`) qoladi,
  chunki foydalanuvchi modelida (`prisma/schema.prisma`) til maydoni yo'q.
  Buni qo'shish uchun DB migratsiyasi kerak bo'ladi — bu alohida vazifa.
