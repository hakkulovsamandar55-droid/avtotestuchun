-- TEST ISHLASH VAQTINI KUZATISH
--
-- MUAMMO: o'qituvchi panelida "talaba har kuni necha daqiqa ishlagan"
-- ko'rsatilishi kerak edi, lekin Attempt jadvalida vaqt saqlanmaydi —
-- faqat urinishlar soni va to'g'ri javoblar bor.
--
-- ExamAttempt da durationSec bor (rasmiy imtihon vaqt bilan cheklangan),
-- lekin oddiy mashq/bilet testlarida yo'q edi.
--
-- ADDITIVE: mavjud yozuvlarda NULL bo'ladi — bu ataylab shunday.
-- Eski urinishlar uchun vaqt ma'lum emas va uni "0" deb yozish
-- statistikani buzardi (0 daqiqa ishlagan degan xato ma'no berardi).
-- Statistika hisoblashda NULL yozuvlar chetlab o'tiladi.

ALTER TABLE "attempts" ADD COLUMN "duration_sec" INTEGER;

-- Kunlik vaqt yig'indisini tez hisoblash uchun
CREATE INDEX "attempts_user_id_created_at_duration_idx"
    ON "attempts"("user_id", "created_at")
    WHERE "duration_sec" IS NOT NULL;
