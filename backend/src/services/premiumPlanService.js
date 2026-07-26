import { prisma } from "../db.js";
import { PREMIUM_PLANS as CODE_PLANS } from "../../../shared/data/premiumPlans.js";

// ============================================================================
// PREMIUM TARIFLAR — narx DB'da, biznes mantiqi kodda
//
// TAQSIMOT:
//   KODDA (shared/data/premiumPlans.js) — key, durationDays.
//     Bular tizim ishlashiga ta'sir qiladi: muddat hisoblash, to'lov
//     tekshiruvi shularga tayanadi. Admin ularni o'zgartirsa premium
//     muddati noto'g'ri hisoblanardi.
//   DB'DA (premium_plans) — narx, nom, badge, xususiyatlar.
//     Bularni admin panelidan o'zgartirish xavfsiz.
//
// ZAXIRA: DB bo'sh yoki so'rov muvaffaqiyatsiz bo'lsa, kod qiymatlari
// ishlatiladi. Shunda narx sahifasi hech qachon bo'sh qolmaydi.
// ============================================================================

const SEPARATOR = "|";

/** Kod tarifidan zaxira yozuv yasaydi */
function fromCode(plan, index) {
  return {
    key: plan.key,
    name: plan.name,
    price: plan.price,
    period: plan.period,
    badge: plan.badge || "",
    features: plan.features || [],
    durationDays: plan.durationDays,
    sortOrder: index + 1,
  };
}

/**
 * Barcha tariflar — DB qiymatlari kod bilan birlashtirilgan.
 *
 * `durationDays` HAR DOIM koddan olinadi, DB'dan emas.
 */
export async function listPlans() {
  const durationByKey = new Map(CODE_PLANS.map((p) => [p.key, p.durationDays]));

  let rows = [];
  try {
    rows = await prisma.premiumPlan.findMany({ orderBy: { sortOrder: "asc" } });
  } catch (err) {
    console.error("[premium] tariflar o'qilmadi, koddagi qiymatlar ishlatiladi:", err?.message);
    return CODE_PLANS.map(fromCode);
  }

  if (rows.length === 0) return CODE_PLANS.map(fromCode);

  // DB'da bor, lekin kodda yo'q kalit — eskirgan yozuv, tashlab ketamiz:
  // uning durationDays qiymati yo'q, ya'ni premium muddatini hisoblab
  // bo'lmaydi va sotib bo'lmaydi.
  return rows
    .filter((r) => durationByKey.has(r.key))
    .map((r) => ({
      key: r.key,
      name: r.name,
      price: r.price,
      period: r.period,
      badge: r.badge || "",
      features: r.features ? r.features.split(SEPARATOR).filter(Boolean) : [],
      durationDays: durationByKey.get(r.key),
      sortOrder: r.sortOrder,
    }));
}

/** Bitta tarif — to'lov tekshiruvi shu narxdan foydalanadi */
export async function findPlanByKey(key) {
  const plans = await listPlans();
  return plans.find((p) => p.key === key) || null;
}

/**
 * Admin tarifni tahrirlaydi.
 *
 * `key` va `durationDays` O'ZGARTIRILMAYDI — ular kodda.
 */
export async function updatePlan(key, adminId, { name, price, period, badge, features }) {
  const codePlan = CODE_PLANS.find((p) => p.key === key);
  if (!codePlan) {
    const err = new Error("Bunday tarif mavjud emas");
    err.code = "not_found";
    throw err;
  }

  const data = {};

  if (price !== undefined) {
    const n = Number(price);
    // Yuqori chegara ham kerak: tasodifan qo'shimcha nol qo'yilsa
    // (250000 -> 2500000) foydalanuvchi ulkan summa ko'rardi.
    if (!Number.isInteger(n) || n < 1000 || n > 10_000_000) {
      const err = new Error("Narx 1 000 va 10 000 000 so'm orasida bo'lishi kerak");
      err.code = "invalid_input";
      throw err;
    }
    data.price = n;
  }

  if (name !== undefined) {
    const v = String(name).trim();
    if (!v || v.length > 60) {
      const err = new Error("Tarif nomi 1-60 belgi bo'lishi kerak");
      err.code = "invalid_input";
      throw err;
    }
    data.name = v;
  }

  if (period !== undefined) {
    const v = String(period).trim();
    if (!v || v.length > 40) {
      const err = new Error("Muddat matni 1-40 belgi bo'lishi kerak");
      err.code = "invalid_input";
      throw err;
    }
    data.period = v;
  }

  if (badge !== undefined) {
    const v = String(badge).trim();
    if (v.length > 30) {
      const err = new Error("Yorliq 30 belgidan oshmasligi kerak");
      err.code = "invalid_input";
      throw err;
    }
    data.badge = v;
  }

  if (features !== undefined) {
    if (!Array.isArray(features)) {
      const err = new Error("Xususiyatlar ro'yxat bo'lishi kerak");
      err.code = "invalid_input";
      throw err;
    }
    const clean = features
      .map((f) => String(f).trim())
      .filter(Boolean)
      // "|" ajratuvchi sifatida ishlatiladi — matn ichida bo'lsa
      // saqlangan qiymat buzilardi.
      .map((f) => f.replace(/\|/g, "/"))
      .slice(0, 10);
    data.features = clean.join(SEPARATOR);
  }

  if (Object.keys(data).length === 0) {
    const err = new Error("O'zgartirish uchun ma'lumot yuborilmadi");
    err.code = "invalid_input";
    throw err;
  }

  data.updatedById = adminId;

  // upsert: DB'da yozuv hali bo'lmasa (migratsiya seed ishlamagan bo'lsa)
  // koddagi qiymatlar asosida yaratamiz.
  const index = CODE_PLANS.findIndex((p) => p.key === key);
  await prisma.premiumPlan.upsert({
    where: { key },
    create: {
      key,
      name: data.name ?? codePlan.name,
      price: data.price ?? codePlan.price,
      period: data.period ?? codePlan.period,
      badge: data.badge ?? (codePlan.badge || ""),
      features: data.features ?? (codePlan.features || []).join(SEPARATOR),
      sortOrder: index + 1,
      updatedById: adminId,
    },
    update: data,
  });

  return findPlanByKey(key);
}
