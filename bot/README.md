# TezPrava Bot (Python, aiogram 3.x)

Hozircha **mustaqil** bot — sayt (Node backend/baza) bilan hech qanday
aloqasi yo'q. Faqat `/start` bosilganda foydalanuvchini Mini App'ga
yo'naltiradi.

## O'rnatish

```bash
cd bot
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

`.env` ni to'ldiring:
- `BOT_TOKEN` — BotFather bergan token
- `MINIAPP_URL` — Mini App havolangiz (masalan `https://t.me/tezprava_bot/app`)

## Ishga tushirish

```bash
python bot.py
```

Webhook yoki public URL kerak emas — long polling ishlatadi.

## Production'da joylashtirish

Render'da alohida **Background Worker** yarating (Root Directory: `bot`):
- Build Command: `pip install -r requirements.txt`
- Start Command: `python bot.py`
- Environment: `BOT_TOKEN`, `MINIAPP_URL`
