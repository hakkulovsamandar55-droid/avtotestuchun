-- GLOBAL SOZLAMALAR (kalit/qiymat)
--
-- Admin ilova ichidan o'zgartira oladigan sozlamalar shu yerda saqlanadi:
--   global_free_mode  — "true" bo'lsa hamma imkoniyat hammaga ochiq
--   feature_access    — JSON: {"unlimited_exam":"PREMIUM", ...}
--   support_link      — "Telegram kanal" tugmasi ochadigan havola
--   bot_username      — referral havolasi uchun (ENV o'rniga, admin qo'lidan)
--
-- Boshlang'ich qatorlar QO'SHILMAYDI: sozlama yo'q bo'lsa,
-- shared/config/features.js dagi defaultAccess ishlaydi. Shu sababli
-- migratsiya mavjud xatti-harakatni o'zgartirmaydi.

CREATE TABLE "app_settings" (
  "key"           TEXT         NOT NULL,
  "value"         TEXT         NOT NULL,
  "updated_by_id" INTEGER,
  "updated_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);
