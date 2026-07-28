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
from aiogram.filters.command import CommandObject
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("bot")

BOT_TOKEN = os.environ["BOT_TOKEN"]
MINIAPP_URL = os.environ.get("MINIAPP_URL", "")

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()


def _miniapp_keyboard(start_payload: str | None = None) -> InlineKeyboardMarkup | None:
    if not MINIAPP_URL:
        return None
    # MUHIM: asosiy referral havolasi endi to'g'ridan-to'g'ri
    # "https://t.me/<bot>/<app>?startapp=..." formatida ishlaydi (bunda
    # bot bilan CHAT umuman ochilmaydi, foydalanuvchi bevosita ilovaga
    # tushadi — shu holatda bu handler ishga tushmaydi ham).
    #
    # Lekin kimdir eski uslubdagi "?start=..." havoladan foydalansa
    # (masalan eski nusxa ko'chirilgan bo'lsa) yoki botga qo'lda
    # "/start ref_KOD" yozsa — o'sha payload'ni yo'qotmasdan, xuddi shu
    # kod bilan ilovaga yo'naltiramiz, aks holda referral kodi shu yerda
    # yo'qolib qolardi.
    url = f"{MINIAPP_URL}?startapp={start_payload}" if start_payload else MINIAPP_URL
    return InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(text="📱 Ilovani ochish", web_app=WebAppInfo(url=url))
    ]])


@dp.message(CommandStart())
async def on_start(message: Message, command: CommandObject) -> None:
    text = (
        "Salom! 👋 TezPrava — PDD/YHQ imtihoniga tayyorgarlik uchun Mini App.\n\n"
        "Boshlash uchun pastdagi tugma orqali ilovani oching."
    )
    await message.answer(text, reply_markup=_miniapp_keyboard(command.args))


async def main() -> None:
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
