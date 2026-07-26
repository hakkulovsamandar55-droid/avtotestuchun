// ============================================================================
// MAVZULAR BO'YICHA TASNIF
//
// MUAMMO: savollar bazasida (ticketsData.js) mavzu maydoni YO'Q — har savol
// faqat { id, text, options, correct, image? } dan iborat. 1188 savolni
// qo'lda belgilash real emas.
//
// YECHIM: savol MATNI bo'yicha kalit so'zlar orqali tasnif. Deterministik
// (aniq), tez, va bir marta hisoblanib keshlanadi.
//
// 2026-07-25 QAYTA YOZILDI: savollar bazasi test-avto.uz manbasiga
// almashtirilgandan keyin eski kalit so'zlar yaroqsiz bo'lib qoldi
// (tasniflanmagan 3% dan 20% ga chiqdi). Yangi manbada atamalar boshqacha:
//   - "quvib o'tish" YOKI "o'zib o'tish" (ikkalasi ham uchraydi)
//   - "chorraha" (eski manbada "kesishma" ko'proq edi)
//   - "yo'naltirgich", "yo'nalish" — juda ko'p (rasmga tayanган savollar)
//   - tibbiy: "jgut", "suyagi singan", "shikastlangan"
//   - texnik: "karbyurator", "drossel", "turg'unlik", "ag'anab"
//
// APOSTROF MUAMMOSI: manbada IKKI XIL apostrof bor — U+0027 (') 1869 marta
// va U+2019 (') 13 marta. Solishtirishdan oldin normallashtirilmasa,
// "yo'nalish" kaliti "yoʻnalish" matniga mos kelmaydi. normalize() shuni
// hal qiladi.
//
// TARTIB MUHIM: ro'yxat yuqoridan pastga tekshiriladi, BIRINCHI mos mavzu
// tanlanadi. Aniqroq mavzular umumiylardan YUQORIDA turishi kerak — aks
// holda "temir yo'l belgisi" savoli "belgilar" mavzusiga tushib ketadi.
// ============================================================================

export const TOPICS = [
  {
    key: "railway",
    icon: "train",
    // MUHIM: "poyezd" kaliti ATAYLAB YO'Q. Sabab: "avtopoyezd" (tirkamali
    // yuk avtomobili) temir yo'lga umuman aloqasi yo'q, lekin ichida
    // "poyezd" bor — shu sababli tirkama savollari temir yo'l mavzusiga
    // xato tushardi. "temir yo'l" va "shlagbaum" o'zi yetarli aniq.
    keywords: [
      "temir yo'l", "shlagbaum", "rels", "uzp", "tramvay",
      "temiryo'l", "poyezd o't", "poyezd kel",
    ],
  },
  {
    key: "firstAid",
    icon: "heart-pulse",
    // Tibbiy yordam ENG YUQORIDA turadi (railway'dan keyin), chunki bu
    // savollarda "transport", "haydovchi" kabi umumiy so'zlar ham uchraydi
    // va ular boshqa mavzuga tortib ketishi mumkin.
    keywords: [
      "tibbiy", "birinchi yordam", "jarohat", "qon ketish", "qon oqish",
      "sun'iy nafas", "jabrlanuvchi", "hushidan", "nafas olmayotgan",
      "suyagi singan", "suyak sinishi", "shikastlangan", "umurtqa",
      "bog'lam", "kuyish", "jgut", "o'mrov", "chiqib ketgan",
    ],
  },
  {
    key: "trafficLights",
    icon: "traffic-cone",
    keywords: [
      "svetofor", "regulirovchi", "tartibga soluvchi", "yashil chiroq",
      "qizil chiroq", "sariq chiroq", "regulyator", "tartibga soluvchining",
      "yo'l harakatini tartibga",
    ],
  },
  {
    key: "overtaking",
    icon: "chevrons-right",
    // Yangi manbada IKKI XIL yoziladi: "quvib o'tish" va "o'zib o'tish"
    keywords: [
      "quvib o'tish", "quvib o'tishga", "quvib o'tishi",
      "o'zib o'tish", "o'zib o'tishga", "o'zib o'tishi",
      "oldinga o'tish", "yonidan o'tib",
    ],
  },
  {
    key: "railwayCrossingRules",
    icon: "train",
    // Bu mavzu railway bilan bir xil ikonkada, lekin alohida — chunki
    // "kesishmadan o'tish qoidalari" savollar guruhi kattaligi bilan
    // ajralib turadi. Agar kam bo'lsa MIN_TOPIC_SIZE uni umumiyga qo'shadi.
    keywords: ["kesishmadan o'tish", "kesishma orqali"],
  },
  {
    key: "priority",
    icon: "git-fork",
    keywords: [
      "chorraha", "ustunlik", "imtiyoz", "yo'l berish", "yo'l berishi",
      "birinchi bo'lib o'tadi", "birinchi bo'lib", "kesishma", "navbatsiz",
      "teng ahamiyatli", "kim birinchi", "qaysi avtomobil birinchi",
    ],
  },
  {
    key: "stopping",
    icon: "circle-parking",
    keywords: [
      "to'xtash", "to'xtab turish", "to'xtatish", "to'xtadi", "stoyanka",
      "tunnel", "estakada", "ko'prik ostida", "trotuar",
    ],
  },
  {
    key: "speed",
    icon: "gauge",
    keywords: [
      "tezlik", "km/soat", "sekinlash", "tezlanish", "tezlikni",
      "eng katta tezlik", "ruxsat etilgan tezlik",
    ],
  },
  {
    key: "maneuvering",
    icon: "corner-up-right",
    keywords: [
      "manevr", "manyovr", "burilish", "qayrilish", "qayrilib",
      "orqaga yurish", "o'rindan jilish", "aylanma harakat",
      "qatorni o'zgartirish", "trayektoriya",
    ],
  },
  {
    key: "directions",
    icon: "signpost",
    // YANGI MAVZU: bu manbada juda ko'p (~100 savol) — "Qaysi yo'nalishda
    // harakatlanishga ruxsat etiladi?" turidagi savollar. Ular RASMGA
    // tayanadi (yo'naltirgich chiziqlari sxemasi), shuning uchun matndan
    // boshqa mavzu aniqlanmaydi. Eski klassifikatorda bu mavzu yo'q edi va
    // shu sababli ular hammasi "umumiy"ga tushardi.
    keywords: [
      "yo'nalish", "yo'naltirgich", "harakatlanishga ruxsat",
      "harakatlanish ruxsat", "harakatlanish taqiqlangan",
      "harakatlanish kimga",
    ],
  },
  {
    key: "markings",
    icon: "minus",
    // Yo'l nishonlari (chiziqlar). signs'dan OLDIN turishi kerak — aks holda
    // "chiziqni bildiruvchi belgi" savoli belgilar mavzusiga tushib ketadi.
    keywords: [
      "nishonlash", "razmetka", "uzluksiz chiziq", "uzuq chiziq",
      "to'xtash chizig'i", "yo'l nishoni", "gorizontal chiziq",
      "sidirg'a oq chiziq", "tik chizig", "chizig'i nimani",
      "reversiv", "harakat bo'lak",
    ],
  },
  {
    key: "signs",
    icon: "triangle-alert",
    keywords: [
      "yo'l belgisi", "belgi nimani", "qaysi belgi", "belgilar",
      "belgisi qaysi guruh", "belgida ko'rsatilgan", "taqiqlovchi belgi",
      "qo'shimcha axborot belgisi", "belgi ostidagi",
      // Yangi manbada belgi savollari turli shaklda: "bu belgi",
      // "shu belgi", "belgining talablari", "belgi bilan belgilangan"
      "bu belgi", "shu belgi", "belgining talab", "belgi bilan belgilangan",
      "belgida ko'k", "belgi qaysi transport",
    ],
  },
  {
    key: "pedestrians",
    icon: "footprints",
    keywords: [
      "piyoda", "piyodalar", "o'tish joyi", "velosiped", "bola",
      "maktab avtobusi", "jamoat transporti bekati",
    ],
  },
  {
    key: "cargo",
    icon: "package",
    keywords: [
      "yuk", "tirkama", "shatakka", "shatak", "yo'lovchi tashish",
      "yo'lovchilarni tashish", "gabarit", "ulagich", "toifadagi",
    ],
  },
  {
    key: "technical",
    icon: "wrench",
    keywords: [
      "texnik", "nosozlik", "tormoz", "shina", "ishlamayapti",
      "chiroq", "chirog", "yorug'lik", "ovoz signali", "fara",
      "karbyurator", "drossel", "turg'unlik", "ag'anab", "tishlashish",
      "tortish kuchi", "g'ildirak",
    ],
  },
  {
    key: "driverState",
    icon: "brain",
    // YANGI MAVZU: haydovchi holati (toliqish, diqqat, spirtli ichimlik).
    // Yangi manbada bunday savollar bor, eski klassifikatorda yo'q edi.
    keywords: [
      "toliqish", "diqqat", "e'tibor", "charcho", "alkogol", "spirtli",
      "giyohvand", "kayfiyat", "reaksiya vaqti",
    ],
  },
  {
    key: "liability",
    icon: "scale",
    keywords: [
      "javobgarlik", "jarima", "huquqbuzarlik", "guvohnoma", "ma'muriy",
      "qoidabuzarlik", "hodisasi", "jinoyat", "sug'urta", "yoshdan",
      "hujjat", "qoidani buzib", "qoidalarni buz", "buzyapti", "buzmoqda",
      // "huquqiga ega" ATAYLAB YO'Q: "harakatlanish huquqiga ega" iborasi
      // ustunlik (priority) savollarida uchraydi, javobgarlikda emas.
      "o'rgatish huquqi", "haydovchilik huquqi",
    ],
  },
];

// Hech qaysi mavzuga tushmagan savollar shu yerga — savol yo'qolmasligi kerak
export const FALLBACK_TOPIC = "general";

/**
 * Apostroflarni bir xillashtiradi.
 *
 * NIMA UCHUN KERAK: manbada U+0027 (') va U+2019 (') ikkalasi ham
 * ishlatilgan. Normallashtirmasak, "yo'nalish" kaliti "yoʻnalish" matniga
 * mos kelmaydi va savol tasniflanmay qoladi.
 */
function normalize(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[\u2019\u02BC\u0060\u00B4]/g, "'");
}

function matchTopic(haystack) {
  for (const topic of TOPICS) {
    for (const kw of topic.keywords) {
      if (haystack.includes(normalize(kw))) return topic.key;
    }
  }
  return null;
}

/**
 * Bitta savolning mavzusini aniqlaydi.
 *
 * Avval SAVOL MATNI tekshiriladi. Agar mos kelmasa — VARIANTLAR.
 *
 * Variantlar faqat ZAXIRA yo'l: ularda ko'p mavzuning so'zlari uchraydi
 * (masalan barcha belgi guruhlari sanaladi) va bu tasnifni chalkashtiradi.
 * Lekin matndan aniqlanmaganda variantlar yordam beradi.
 */
export function detectTopic(question) {
  const text = normalize(question?.text);
  if (!text) return FALLBACK_TOPIC;

  const byText = matchTopic(text);
  if (byText) return byText;

  const options = Array.isArray(question?.options) ? question.options : [];
  if (options.length > 0) {
    const byOptions = matchTopic(normalize(options.join(" ")));
    if (byOptions) return byOptions;
  }

  return FALLBACK_TOPIC;
}

// Kesh: 1188 savol uchun tasnif bir marta hisoblanadi.
// Har chaqiruvda qayta hisoblansa, mavzu ekranini ochish sekinlashadi.
let cache = null;

export function groupQuestionsByTopic(allQuestions) {
  if (cache) return cache;

  const map = new Map();
  for (const topic of TOPICS) map.set(topic.key, []);
  map.set(FALLBACK_TOPIC, []);

  for (const q of allQuestions) {
    map.get(detectTopic(q)).push(q);
  }

  cache = map;
  return map;
}

/**
 * Mavzular ro'yxati + har birida savol soni.
 *
 * JUDA KICHIK MAVZULAR CHIQARILMAYDI: bunday mavzudan test ishlash ma'nosiz,
 * chunki har safar aynan bir xil savollar chiqadi va foydalanuvchi
 * javoblarni yodlab qoladi. Ular "Umumiy qoidalar" ga qo'shiladi, ya'ni
 * yo'qolmaydi.
 */
const MIN_TOPIC_SIZE = 12;

export function getTopicSummary(allQuestions) {
  const grouped = groupQuestionsByTopic(allQuestions);
  const out = [];
  let generalCount = grouped.get(FALLBACK_TOPIC).length;

  for (const topic of TOPICS) {
    const count = grouped.get(topic.key).length;
    if (count === 0) continue;
    if (count < MIN_TOPIC_SIZE) {
      generalCount += count;
      continue;
    }
    out.push({ key: topic.key, icon: topic.icon, count });
  }

  if (generalCount > 0) {
    out.push({ key: FALLBACK_TOPIC, icon: "book-open", count: generalCount });
  }

  return out;
}

/**
 * Mavzu bo'yicha savollar. Kichik mavzular umumiyga qo'shilgani uchun
 * "general" so'ralganda ularning savollari ham qaytadi.
 */
export function getQuestionsForTopic(allQuestions, topicKey) {
  const grouped = groupQuestionsByTopic(allQuestions);

  if (topicKey !== FALLBACK_TOPIC) {
    return grouped.get(topicKey) || [];
  }

  const merged = [...(grouped.get(FALLBACK_TOPIC) || [])];
  for (const topic of TOPICS) {
    const list = grouped.get(topic.key) || [];
    if (list.length > 0 && list.length < MIN_TOPIC_SIZE) merged.push(...list);
  }
  return merged;
}
