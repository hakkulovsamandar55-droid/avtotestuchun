import logging

from aiogram import Bot
from aiogram.exceptions import TelegramForbiddenError, TelegramBadRequest
from apscheduler.schedulers.asyncio import AsyncIOScheduler

import db

log = logging.getLogger("reminders")


async def send_streak_risk_reminders(bot: Bot) -> None:
    users = await db.get_users_at_streak_risk()
    for u in users:
        try:
            await bot.send_message(
                u["telegram_id"],
                f"🔥 {u['name']}, ketma-ketligingiz (streak) bugun uzilishi mumkin!\n"
                "Bir nechta savol yeching-da, uni saqlab qoling.",
            )
        except (TelegramForbiddenError, TelegramBadRequest):
            # Foydalanuvchi botni bloklagan yoki hali /start bosmagan — o'tkazib yuboriladi
            continue
    if users:
        log.info("Streak-risk eslatmasi %d foydalanuvchiga yuborildi", len(users))


def start_scheduler(bot: Bot, interval_hours: int) -> AsyncIOScheduler:
    """
    Bu yerga kelajakda qo'shiladigan boshqa ogohlantirishlar ham shu tarzda
    scheduler.add_job(...) bilan qo'shiladi (masalan: imtihon yaqinlashgani,
    N kundan beri kirmagani haqida eslatma va h.k.). Har biri db.py ichida
    alohida SQL so'rov + shu yerda alohida job sifatida yoziladi.
    """
    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        send_streak_risk_reminders,
        "interval",
        hours=interval_hours,
        args=[bot],
        id="streak_risk_reminder",
    )
    scheduler.start()
    return scheduler
