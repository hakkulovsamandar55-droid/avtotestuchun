# TezPrava Backend

Node.js + Express + PostgreSQL (Prisma ORM). Telegram Mini App orqali
autentifikatsiya qiladi va admin panel uchun foydalanuvchi qidiruvini beradi.

## 1. Birinchi marta ishga tushirish

```bash
cd backend
npm install
cp .env.example .env
```

`.env` faylni to'ldiring:
- `BOT_TOKEN` — BotFather bergan token
- `JWT_SECRET` — masalan `openssl rand -hex 32` bilan hosil qiling
- `ADMIN_TELEGRAM_IDS` — o'zingizning Telegram ID'ingiz (@userinfobot orqali bilib oling)

Lokal PostgreSQL kerak bo'lsa (Docker o'rnatilgan bo'lsa):

```bash
docker compose up -d
```

Bazani sozlash (jadvallarni yaratish):

```bash
npx prisma migrate dev --name init
```

Serverni ishga tushirish:

```bash
npm run dev
```

`http://localhost:3001/health` — server ishlayotganini tekshirish uchun.

## 2. Serverni boshqa hostga ko'chirish

Bu loyiha shu maqsadda maxsus qilingan — hech qanday hostga qaramay ishlaydi:

1. Kodni yangi serverga ko'chiring (`git clone` yoki fayllarni yuklash)
2. `.env` faylni yangi server uchun to'ldiring (ayniqsa `DATABASE_URL`)
3. `npm install`
4. `npx prisma migrate deploy` — jadval tuzilmasini yangi bazada yaratadi
5. `npm start`

Eski bazadagi ma'lumotlarni ham ko'chirmoqchi bo'lsangiz:

```bash
# Eski serverda:
pg_dump $DATABASE_URL > backup.sql

# Yangi serverda:
psql $DATABASE_URL < backup.sql
```

Managed Postgres (Railway, Render, Neon, Supabase va h.k.) ishlatsangiz ham
xuddi shu qadamlar ishlaydi — faqat ular bergan `DATABASE_URL`ni qo'yasiz.

## 3. Admin qilib belgilash

`.env` dagi `ADMIN_TELEGRAM_IDS` ga Telegram ID qo'shilgan foydalanuvchi
har safar botga kirganda avtomatik `ADMIN` roliga o'tadi. Boshqa yo'l —
`npx prisma studio` orqali `users` jadvalida `role` ustunini qo'lda
`ADMIN` qilib qo'yish.

## API

| Endpoint | Metod | Tavsif |
|---|---|---|
| `/health` | GET | Server ishlayotganini tekshirish |
| `/api/auth/telegram` | POST | `{ initData }` qabul qiladi, `{ token, user }` qaytaradi |
| `/api/admin/users?query=...` | GET | Faqat admin, `Authorization: Bearer <token>` kerak |
