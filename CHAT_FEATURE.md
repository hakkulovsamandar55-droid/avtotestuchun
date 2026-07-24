# Maktab chati — o'qituvchi ↔ talaba yozishuvi

**Sana:** 2026-07-24
**Testlar:** 204 ta (23 tasi yangi chat testlari)
**Frontend build:** muvaffaqiyatli

---

## ⚠️ DEPLOY QILISHDAN OLDIN O'QING

Bu bosqichda **migratsiya bor** — oldingilardan farqli. Yangi jadvallar
yaratiladi.

Render deploy'da `npx prisma migrate deploy` avtomatik ishlaydi. Lekin Neon
bepul tarifda uxlab qolsa, `P1002` (advisory lock timeout) chiqishi mumkin —
o'tgan safargidek. Bunda:

1. Neon SQL Editor'da `SELECT 1;` ishga tushiring (bazani uyg'otadi)
2. Render'da **Manual Deploy** → **Deploy latest commit**

---

## Nima qo'shildi

### Backend

**Yangi modellar** (`schema.prisma` + migratsiya):
- `SchoolChat` — bir juftlik uchun bitta chat
- `SchoolMessage` — xabarlar
- `NotificationType` enumiga `SCHOOL_MESSAGE`

**Yangi servis:** `schoolChatService.js`
- `getOrCreateChat` — chat ochish (poyga holatiga chidamli)
- `sendMessage` — xabar yuborish
- `markAsRead` — o'qilgan belgisi
- `listChats` — ro'yxat
- `getTotalUnread` — umumiy hisob

**6 ta yangi route** — barchasi `requireSchool` bilan himoyalangan.

### Frontend

- `SchoolChatScreen.jsx` — xabarlar, yuborish, polling
- `SchoolChatListScreen.jsx` — chatlar ro'yxati
- O'qituvchi paneli sarlavhasiga chat tugmasi (o'qilmagan nishoni bilan)
- Talaba tabiga chat tugmasi
- Talaba profilida "Xabar yozish" tugmasi
- 3 tilda i18n

---

## Arxitektura qarorlari

### Nima uchun alohida jadval (mavjud support chat emas)

`Conversation` / `SupportMessage` **1:1** munosabat uchun qurilgan:
- `Conversation.userId` — `@unique`
- `SenderType` enum — faqat `USER` / `ADMIN`

Maktabda esa **ko'p-ko'pga**: bir talaba turli o'qituvchilar bilan, bir
o'qituvchi ko'p talaba bilan yozishadi. Mavjud modelni cho'zish uning
mantiqini buzardi va support chatni ham beqaror qilardi.

### Nima uchun membershipId (userId emas)

Chat ishtirokchilari `membershipId` orqali bog'lanadi. Sabab: odam maktabdan
chiqsa, a'zoligi `ARCHIVED` bo'ladi, lekin **yozishuv tarixi o'sha maktabga
tegishli bo'lib qoladi**. `userId` ishlatilsa, odam boshqa maktabga o'tganda
eski chatlar yangi maktabda ko'rinib qolardi.

### Nima uchun ikkita migratsiya

PostgreSQL `ALTER TYPE ... ADD VALUE` ni **tranzaksiya blokida bajarmaydi**.
Prisma har bir migratsiya faylini bitta tranzaksiyada ishlatadi, shuning
uchun enum o'zgarishi jadval yaratishdan ajratildi:

- `20260723500000_school_message_notif` — faqat enum
- `20260724000000_school_chat` — jadvallar

Aks holda `migrate deploy` xato bilan to'xtardi.

### Nima uchun polling (socket emas)

Loyihada Socket.io bor (duel uchun), lekin uni chatga ulash alohida ish:
autentifikatsiya, xona boshqaruvi, qayta ulanish mantiqi. Birinchi versiyada
8 soniyalik polling yetarli va ancha sodda.

Optimallashtirish qilingan: ekran ko'rinmasa (`document.hidden`) so'rov
yuborilmaydi, va faqat haqiqatan yangi xabar bo'lsa React qayta render
qiladi.

---

## Xavfsizlik modeli

Ruxsat markazi — `canConverse()` funksiyasi:

| Kim | Kim bilan yozisha oladi |
|---|---|
| O'qituvchi | **faqat o'z guruhi** talabalari |
| Talaba | **faqat o'z guruhi** o'qituvchisi |
| Owner | maktabidagi har kim |
| CEO | **hech kim** (chat shaxsiy) |

Qo'shimcha qoidalar:
- Guruhi yo'q (`groupId = null`) a'zo hech kim bilan yozisha olmaydi
- Maktablar o'rtasida hech qanday ko'rinish yo'q
- Har bir amal ikki qavatdan o'tadi: route (`requireSchool`) + servis
  (`assertChatAccess`)

Bularning **hammasi test bilan qoplangan**.

---

## Yo'l-yo'lakay tuzatilgan xato

Oldingi bosqichda `membership.startedAt` deb yozgan edim — aslida maydon
`joinedAt` deb ataladi. Talaba profilida "qo'shilgan sana" noto'g'ri
(`undefined` → `user.createdAt`) ko'rsatilardi. Tuzatildi.

---

## Test qamrovi (23 ta yangi)

**Chat ochish:**
- O'qituvchi o'z guruhi talabasi bilan ocha oladi
- Takroriy ochish yangi chat yaratmaydi
- Boshqa guruh talabasi bilan — rad etiladi
- Owner istalgan talaba bilan ocha oladi
- Begona foydalanuvchi — rad etiladi

**Xabar yuborish:**
- Xabar saqlanadi, o'qilmaganlar hisobi to'g'ri oshadi
- Bo'sh xabar — 400
- 2000 belgidan uzun — 400
- Ikki tomonlama yozishuv ishlaydi

**Ko'rish:**
- Xabarlar to'g'ri tartibda (eskisi birinchi)
- Begona talaba ko'ra olmaydi
- Boshqa maktab owner'i ko'ra olmaydi

**O'qilgan belgisi:**
- Faqat o'z hisoblagichini nolga tushiradi
- Idempotent (qayta chaqirish xavfsiz)

**Ro'yxat:**
- Suhbatdosh ismi, o'qilmaganlar soni to'g'ri

---

## Keyingi tavsiyalar

1. **Rate limiting yo'q** — bir foydalanuvchi cheksiz xabar yubora oladi.
   Spam himoyasi kerak bo'lishi mumkin.
2. **Rasm yuborish yo'q** — hozircha faqat matn. Support chatda rasm bor,
   uni namuna qilib qo'shsa bo'ladi.
3. **Socket.io** — polling o'rniga real-time. Foydalanuvchi ko'paysa
   kerak bo'ladi.
4. **Frontend bundle 1.58 MB** — hali ham bo'linmagan.
