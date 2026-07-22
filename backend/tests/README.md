# Testlar

Rasmiy imtihon (Official Exam) moduli uchun testlar.

## Ishga tushirish

```bash
cd backend
npm test
```

## Qanday ishlaydi

Bu testlar **haqiqiy PostgreSQL talab qilmaydi**. `fakeDb.mjs` — Prisma
клиentining xotiradagi soddalashtirilgan o'rnini bosuvchisi. Test paytida
`src/db.js` vaqtincha shunga almashtiriladi (`npm test` skripti buni
avtomatik qiladi va oxirida qaytaradi).

Nima uchun: imtihon mantiqi (baholash, vaqt tugashi, kunlik limit, savol
tiklash) sof mantiq — uni tekshirish uchun haqiqiy DB shart emas va
CI'da tezroq ishlaydi.

## Qamrov

`exam.service.test.mjs` — asosiy oqim:
- imtihon boshlash, seed va savol ID'lari saqlanishi
- **to'g'ri javoblar frontendga ketmasligi** (eng muhim xavfsizlik da'vosi)
- javob saqlash va validatsiya
- 18/20 chegarasida o'tish/yiqilish
- umumiy statistikaga (Attempt jadvali) yozilishi
- kunlik limit va Premium cheksizligi

`exam.expiry.test.mjs` — chegaraviy holatlar:
- tugallanmagan imtihonni AYNAN o'sha savollar bilan tiklash
- savol ID'lari yo'qolsa seed orqali tiklash
- vaqt tugaganda avtomatik yakunlash (cron'siz)
- vaqti tugagach javob qabul qilinmasligi
- ikki marta submit qilinmasligi
- bekor qilish, review huquqlari, focus-lost hisoblagichi
