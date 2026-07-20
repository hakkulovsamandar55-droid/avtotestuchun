# TezPrava Bot (Python, aiogram 3.x)

Mini App bilan bog'lanadigan Telegram bot. Backend (Node) bilan **bir xil
PostgreSQL bazani** ishlatadi — alohida jadval yaratmaydi, faqat `users` va
`attempts` jadvallarini o'qiydi/yozadi (sxema Prisma orqali backend tomonda
boshqariladi, bot faqat foydalanadi).

## Qanday ishlaydi

1. Foydalanuvchi Mini App orqali login qiladi → backend `users` jadvalida
   yozuv yaratadi (`telegram_id`, `notifications_enabled=true` — standart).
2. Foydalanuvchi Sozlamalar > Bildirishnomalar svitchini bosadi → backend
   `notifications_enabled` ustunini yangilaydi (`PATCH /api/notifications/toggle`).
3. Bot fonda (`reminders.py`, `APScheduler`) har `REMINDER_INTERVAL_HOURS`
   soatda tekshiradi va shu flag `true` bo'lgan foydalanuvchilarga eslatma
   yuboradi (hozircha bitta tayyor misol: "streak uzilish xavfi").
4. Yangi eslatma turlarini qo'shish uchun: `db.py` ga yangi SQL so'rov
   funksiyasi + `reminders.py` ga yangi `scheduler.add_job(...)` qatori.

## O'rnatish

```bash
cd bot
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

`.env` ni to'ldiring:
- `BOT_TOKEN` — **backend/.env dagi BOT_TOKEN bilan bir xil bo'lishi shart**
  (bitta bot, ikkita process: Node — auth/API uchun, Python — xabar yuborish uchun)
- `DATABASE_URL` — **backend/.env dagi DATABASE_URL bilan bir xil**
- `MINIAPP_URL` — BotFather'da bergan Mini App havolangiz (masalan
  `https://t.me/tezprava_bot/app`)

## Ishga tushirish

```bash
python bot.py
```

Webhook yoki public URL kerak emas — bot long polling orqali ishlaydi,
shuning uchun lokal kompyuterda ham, serverda ham bir xil tarzda ishga
tushadi.

## Production'da joylashtirish

Render'da backend allaqachon Web Service sifatida ishlayapti. Bot uchun
**alohida Background Worker** yarating (bir xil repo, Root Directory: `bot`):

- Build Command: `pip install -r requirements.txt`
- Start Command: `python bot.py`
- Environment: yuqoridagi 3 ta o'zgaruvchini kiriting (`BOT_TOKEN`,
  `DATABASE_URL` — backenddagi bilan bir xil qiymatlar, `MINIAPP_URL`)

Ikkala process (Node backend va Python bot) bir vaqtda, bir-biridan mustaqil
ishlaydi, faqat bitta umumiy bazani ulashadi.
