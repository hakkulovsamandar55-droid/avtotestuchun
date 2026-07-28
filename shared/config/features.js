// ============================================================================
// FEATURE (IMKONIYAT) RO'YXATI — YAGONA MANBA
//
// Bu ro'yxat HAM admin panelida (qaysi imkoniyat pullik/tekin ekanini
// tanlash uchun), HAM backend tekshiruvida ishlatiladi. Ikkalasi bitta
// manbadan o'qigani uchun ular hech qachon bir-biridan uzilib qolmaydi.
//
// YANGI IMKONIYAT QO'SHISH: shu massivga bitta qator qo'shing — admin
// panelida avtomatik paydo bo'ladi, qo'shimcha kod kerak emas.
//
// defaultAccess — sozlama hali o'zgartirilmagan bo'lsa amal qiladigan
// boshlang'ich holat. Mavjud xatti-harakatni buzmaslik uchun tanlangan:
// hozir pullik bo'lgan narsalar PREMIUM, qolganlari FREE.
// ============================================================================

export const ACCESS = {
  FREE: "FREE",
  PREMIUM: "PREMIUM",
};

export const FEATURES = [
  {
    key: "unlimited_exam",
    // Rasmiy imtihon: bepul foydalanuvchida kunlik urinishlar cheklangan.
    // PREMIUM bo'lsa cheklov olib tashlanadi.
    defaultAccess: ACCESS.PREMIUM,
    labelKey: "features.unlimitedExam",
  },
  {
    key: "premium_themes",
    // Sozlamalardagi qo'shimcha ranglar to'plami.
    defaultAccess: ACCESS.PREMIUM,
    labelKey: "features.premiumThemes",
  },
  {
    key: "duel",
    defaultAccess: ACCESS.FREE,
    labelKey: "features.duel",
  },
  {
    key: "cheat_sheet",
    defaultAccess: ACCESS.FREE,
    labelKey: "features.cheatSheet",
  },
  {
    key: "tricky_tests",
    defaultAccess: ACCESS.FREE,
    labelKey: "features.trickyTests",
  },
  {
    key: "topic_tests",
    defaultAccess: ACCESS.FREE,
    labelKey: "features.topicTests",
  },
  {
    key: "saved_questions",
    defaultAccess: ACCESS.FREE,
    labelKey: "features.savedQuestions",
  },
  {
    key: "mistakes",
    defaultAccess: ACCESS.FREE,
    labelKey: "features.mistakes",
  },
  {
    key: "signs_quiz",
    defaultAccess: ACCESS.FREE,
    labelKey: "features.signsQuiz",
  },
];

export const FEATURE_KEYS = FEATURES.map((f) => f.key);

/** Sozlama saqlanmagan holat uchun boshlang'ich xarita. */
export function defaultFeatureAccess() {
  const out = {};
  for (const f of FEATURES) out[f.key] = f.defaultAccess;
  return out;
}

// Sozlama kalitlari (AppSetting.key). Bir joyda turishi kerak, chunki
// backend yozadi, frontend o'qiydi — matn xatosi jimgina buzilishga
// olib kelardi.
export const SETTING_KEYS = {
  GLOBAL_FREE_MODE: "global_free_mode",
  FEATURE_ACCESS: "feature_access",
  SUPPORT_LINK: "support_link",
  BOT_USERNAME: "bot_username",
};
