"""
Node backend bilan BIR XIL PostgreSQL bazaga ulanadi (Prisma schema.prisma
shu jadvallarni yaratadi — bot faqat o'qiydi/yozadi, sxemani o'zgartirmaydi).
"""

import asyncpg

_pool: asyncpg.Pool | None = None


async def init_pool(database_url: str) -> None:
    global _pool
    _pool = await asyncpg.create_pool(database_url, min_size=1, max_size=5)


async def close_pool() -> None:
    if _pool:
        await _pool.close()


async def get_user_by_telegram_id(telegram_id: int) -> asyncpg.Record | None:
    """Mini App orqali kirgan (backend /api/auth/telegram yaratgan) foydalanuvchini topadi."""
    async with _pool.acquire() as conn:
        return await conn.fetchrow(
            'SELECT id, telegram_id, name, notifications_enabled '
            'FROM users WHERE telegram_id = $1',
            telegram_id,
        )


async def set_notifications(telegram_id: int, enabled: bool) -> None:
    """Bot ichidan ham yoqish/o'chirish imkoni (masalan /stop buyrug'i uchun)."""
    async with _pool.acquire() as conn:
        await conn.execute(
            'UPDATE users SET notifications_enabled = $2 WHERE telegram_id = $1',
            telegram_id, enabled,
        )


async def get_users_at_streak_risk() -> list[asyncpg.Record]:
    """
    Bildirishnoma yoqilgan va oxirgi faolligi aynan KECHA bo'lgan foydalanuvchilar —
    ya'ni bugun hech narsa yechmasa, ketma-ketligi (streak) uziladi.
    Bu — reminders.py dagi eslatmalar tizimining ishlayotganini ko'rsatuvchi
    birinchi, tayyor misol. Yangi eslatma turlari shu faylga shunga o'xshash
    funksiya sifatida qo'shiladi (masalan: imtihonga tayyorgarlik pasaygani,
    N kundan beri kirmagani va h.k.).
    """
    async with _pool.acquire() as conn:
        return await conn.fetch(
            """
            SELECT u.telegram_id, u.name
            FROM users u
            WHERE u.notifications_enabled = true
              AND EXISTS (
                SELECT 1 FROM attempts a
                WHERE a.user_id = u.id
                  AND a.created_at::date = (CURRENT_DATE - INTERVAL '1 day')::date
              )
              AND NOT EXISTS (
                SELECT 1 FROM attempts a
                WHERE a.user_id = u.id
                  AND a.created_at::date = CURRENT_DATE
              )
            """
        )
