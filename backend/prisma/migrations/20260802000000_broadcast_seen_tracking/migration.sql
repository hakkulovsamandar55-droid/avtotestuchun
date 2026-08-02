-- BROADCAST XABARINI ILOVADA BIR MARTA KO'RSATISH
--
-- Admin broadcast yuborganda, tegishli foydalanuvchilar keyingi safar
-- ilovaga kirganda (login) shu xabarni popup sifatida bir marta ko'rishi
-- kerak. Buning uchun:
--   1) users.last_seen_broadcast_id — foydalanuvchi oxirgi ko'rgan xabar ID'si
--   2) broadcast_messages.target_user_ids — yuborilgan paytdagi qabul
--      qiluvchilar ro'yxati (audience ALL/PREMIUM/SELECTED bo'yicha)

ALTER TABLE "users" ADD COLUMN "last_seen_broadcast_id" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "broadcast_messages" ADD COLUMN "target_user_ids" INTEGER[] NOT NULL DEFAULT '{}';
