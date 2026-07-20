"""
TezPrava Telegram bot (aiogram 3.x) — MUSTAQIL bot.

Hozircha saytdan (Node backend/baza) mustaqil ishlaydi — hech qanday
umumiy ma'lumotlar bazasiga ulanmaydi. Faqat /start bosilganda foydalanuvchini
Mini App'ga yo'naltiradi.

Ishga tushirish: shu process backenddan alohida ishlaydi (masalan Render'da
alohida Background Worker). Long polling ishlatadi — webhook/public URL
shart emas.
"""

import asyncio
import logging
import os

from aiogram import Bot, Dispatcher
from aiogram.filters import CommandStart
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("bot")

BOT_TOKEN = os.environ["BOT_TOKEN"]
MINIAPP_URL = os.environ.get("MINIAPP_URL", "")

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
    text = (
        "Salom! 👋 TezPrava — PDD/YHQ imtihoniga tayyorgarlik uchun Mini App.\n\n"
        "Boshlash uchun pastdagi tugma orqali ilovani oching."
    )
    await message.answer(text, reply_markup=_miniapp_keyboard())


async def main() -> None:
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
