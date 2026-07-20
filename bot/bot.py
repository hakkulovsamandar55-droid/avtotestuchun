"""
TezPrava Telegram bot (aiogram 3.x).

Vazifasi: Mini App bilan bog'lanish nuqtasi.
  - /start — foydalanuvchini Mini App'ga yo'naltiradi
  - /notifications_on, /notifications_off — bot ichidan ham boshqarish
    (asosiy yo'l — Mini App > Sozlamalar > Bildirishnomalar svitchi)
  - reminders.py — Mini App'da bildirishnoma yoqilgan foydalanuvchilarga
    fon rejimida eslatma yuboradi (hozircha: streak uzilish xavfi;
    kelajakda qo'shiladigan boshqa ogohlantirishlar shu faylga qo'shiladi)

Ishga tushirish: asosiy backend (Node) bilan BIR VAQTDA, alohida process
sifatida ishlaydi (masalan Render'da alohida Background Worker). Long
polling ishlatadi — webhook/public URL shart emas.
"""

import asyncio
import logging
import os

from aiogram import Bot, Dispatcher
from aiogram.filters import CommandStart, Command
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from dotenv import load_dotenv

import db
from reminders import start_scheduler

load_dotenv()

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("bot")

BOT_TOKEN = os.environ["BOT_TOKEN"]
DATABASE_URL = os.environ["DATABASE_URL"]
MINIAPP_URL = os.environ.get("MINIAPP_URL", "")
REMINDER_INTERVAL_HOURS = int(os.environ.get("REMINDER_INTERVAL_HOURS", "1"))

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()


def _miniapp_keyboard() -> InlineKeyboardMarkup | None:
    if not MINIAPP_URL:
        return None
    return InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(text="📱 Ilovani ochish", web_app=WebAppInfo(url=MINIAPP_URL))
    ]])


@dp.message(CommandStart())
async def on_start(message: Message) -> None:
    user = await db.get_user_by_telegram_id(message.from_user.id)
    if user:
        text = (
            f"Salom, {user['name']}! 👋\n\n"
            "Mini App orqali test yeching, statistikangizni kuzating.\n"
            "Bildirishnomalarni Sozlamalar bo'limidan boshqarasiz."
        )
    else:
        text = (
            "Salom! 👋 TezPrava — PDD/YHQ imtihoniga tayyorgarlik uchun Mini App.\n\n"
            "Boshlash uchun pastdagi tugma orqali ilovani oching."
        )
    await message.answer(text, reply_markup=_miniapp_keyboard())


@dp.message(Command("notifications_on"))
async def on_notifications_on(message: Message) -> None:
    await db.set_notifications(message.from_user.id, True)
    await message.answer("✅ Bildirishnomalar yoqildi.")


@dp.message(Command("notifications_off"))
async def on_notifications_off(message: Message) -> None:
    await db.set_notifications(message.from_user.id, False)
    await message.answer("🔕 Bildirishnomalar o'chirildi.")


async def main() -> None:
    await db.init_pool(DATABASE_URL)
    start_scheduler(bot, REMINDER_INTERVAL_HOURS)
    try:
        await dp.start_polling(bot)
    finally:
        await db.close_pool()


if __name__ == "__main__":
    asyncio.run(main())
