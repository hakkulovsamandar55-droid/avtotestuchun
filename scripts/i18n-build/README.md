# i18n build pipeline (Cyrillic + Russian)

Bu papkada bilet savollarini ko'p tilli qilishda ishlatilgan skript turadi.

## Qayta ishga tushirish (agar yangi rus tarjimalari qo'shilsa):

1. `git show HEAD:shared/data/ticketsData.js > scripts/i18n-build/original.js`
   (yoki hozirgi eski-formatdagi TICKETS manbasi)
2. `awk '/^const TICKETS = \{/{start=1} start{print} /^};$/{if(start){exit}}' original.js > tickets-raw.mjs`
   va faylning birinchi qatoriga `export ` qo'shing.
3. `scripts/translations.ru.json` fayliga yangi tarjimalarni ID bo'yicha qo'shing
   (masalan `"t51-1": { "text": "...", "options": ["...", "..."] }`).
4. `cd scripts/i18n-build && npm install lotin-kirill && node build.mjs`
   — bu `tickets-output.js` faylini yaratadi va konsolga
   nechta savol tarjima qilinganini chiqaradi.
5. `shared/data/ticketsData.js` faylidagi `const TICKETS = { ... };` blokini
   `tickets-output.js` bilan almashtiring (header/footer qismlarga tegmang).

## Hozirgi holat (2026-07-26)

- uz_cyrl: 1188/1188 (100%, avtomatik transliteratsiya)
- ru: 499/1188 (~42%, biletlar 1-50 qo'lda tarjima qilingan)
- Qolgan 51-120 biletlar (689 savol) hozircha ru so'ralganda uz_latn'ga
  tushadi (xatosiz, lekin tarjima qilinmagan).

translations.ru.json — barcha hozirgача tarjima qilingan savollar (yagona manba).
translations-batch2.ru.json, translations-batch3.ru.json — tarixiy partiyalar,
allaqachon translations.ru.json ichiga birlashtirilgan, faqat arxiv sifatida saqlanmoqda.
