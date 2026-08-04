#!/usr/bin/env node
// ============================================================================
// RASMSIZ QOLGAN SAVOLLARNI TOPISH
//
// Muammo: savol matni rasmga ishora qiladi ("Ushbu yo'l belgisi...",
// "Qaysi rasmda...", "Chorrahani ikkinchi bo'lib kesib o'tadi:"), lekin
// shared/data/ticketsData.js da o'sha savolda `image` maydoni yo'q. Ilovada
// bunday savol rasmsiz ko'rinadi va unga javob berib bo'lmaydi.
//
// ISHLATISH:
//   node scripts/find-missing-images.mjs          # matnli hisobot
//   node scripts/find-missing-images.mjs --md     # markdown hisobot
//   node scripts/find-missing-images.mjs --ids    # faqat savol ID'lari
//
// ANIQLIK QANDAY O'LCHANADI:
// 1–93 biletlarda rasmlar allaqachon qo'yilgan, ya'ni ular "javobi ma'lum"
// namuna. Skript qoidalarni avval o'sha biletlarda sinaydi va har bir
// qoidaning aniqligini ko'rsatadi (qoidaga tushgan savollarning necha foizida
// haqiqatan rasm bor). Hozirgi qoidalar aniqligi ~99%.
//
// MUHIM: natija — PASTKI CHEGARA. Qoidalar faqat matnda ochiq ishora bo'lgan
// savollarni topadi; rasmli savollarning ~55% i shunday. Ya'ni ro'yxatga
// tushmagan yana rasmsiz savollar bo'lishi mumkin.
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getAllQuestions } from "../shared/data/ticketsData.js";

const LANGS = ["uz_latn", "uz_cyrl", "ru"];
const ASSET_DIR = path.join(fileURLToPath(new URL("../", import.meta.url)), "src/assets/newQuestions");

// Uch tilni bitta savol obyektiga yig'amiz — getAllQuestions() har chaqiruvda
// faqat bitta tilni qaytaradi.
function loadQuestions() {
  const byId = new Map();
  for (const lang of LANGS) {
    for (const q of getAllQuestions(lang)) {
      const cur = byId.get(q.id) || { id: q.id, image: q.image || null, text: {}, options: {} };
      cur.text[lang] = q.text;
      cur.options[lang] = q.options;
      byId.set(q.id, cur);
    }
  }
  return [...byId.values()];
}

const ticketOf = (id) => Number(id.slice(1).split("-")[0]);

// "рисунок протектора" — shina naqshi haqidagi savollar. Ruscha "рисунок"
// so'zi bor, lekin rasmga ishora emas — chiqarib tashlaymiz.
const TREAD = /(рисун\w*\s+протектор|протектор\w*\s+рисун|naqsh|нақш)/iu;

// Har bir qoida — matnda rasmga ochiq ishora. Nomlar hisobotda ko'rinadi.
const RULES = [
  [
    "deiktik-belgi", // "Ushbu yo'l belgisi", "Данный знак"
    /(bu|ushbu|mazkur|ko'rsatilgan|ko‘rsatilgan|kursatilgan)\s+(yo'l\s+)?(belgi|belgisi|belgilar\w*)|(бу|ушбу|мазкур|кўрсатилган)\s+(йўл\s+)?(белги\w*)|(данн|этот|эта|это|указанн|показанн)\w*\s+(дорожн\w*\s+)?знак/iu,
  ],
  [
    "qaysi-belgi", // "Qaysi belgi...", "Какой знак..."
    /qaysi\s+(yo'l\s+)?belgi|қайси\s+(йўл\s+)?белги|как(ой|ие)\s+(из\s+)?(дорожн\w*\s+)?знак|belgilardan\s+qaysi|белгилардан\s+қайси/iu,
  ],
  [
    "rasmga-ishora", // "Qaysi rasmda...", "На каком рисунке..."
    /rasmda|rasmdagi|расмда|расмдаги|qaysi\s+rasm|қайси\s+расм|на\s+как(ом|их)\s+рисунк|на\s+рисунк|рисунке\s+показан/iu,
  ],
  [
    "deiktik-chiziq", // "Bu yotiq chiziq...", "Данная разметка..."
    /(bu|ushbu|mazkur)\s+(yotiq\s+)?(chiziq|chizig)|(бу|ушбу|мазкур)\s+(ётиқ\s+)?(чизиқ|чизиғ)|(данн|эта|это|указанн)\w*\s+разметк/iu,
  ],
  [
    "deiktik-holat", // "Ushbu holatda...", "В этом месте..."
    /(bu|ushbu|mazkur|ko'rsatilgan)\s+(joyda|holatda|vaziyatda|chorrahada|yo'lda)|(бу|ушбу|мазкур|кўрсатилган)\s+(жойда|ҳолатда|вазиятда|чорраҳада|йўлда)|в\s+(этом|данном)\s+(месте|случае)|в\s+(этой|данной)\s+(ситуации)|на\s+(этом|данном)\s+перекрёстке/iu,
  ],
  [
    "rangli-transport", // "Ko'k avtomobil...", "Красный автомобиль..."
    /(qizil|ko'k|yashil|sariq|oq)\s+(avtomobil|mototsikl|avtobus|yuk)|(қизил|кўк|яшил|сариқ|оқ)\s+(автомобил|мототсикл|автобус|юк)|(красн|син|зелён|зелен|жёлт|желт|бел)\w*\s+(автомобил|мотоцикл|автобус|грузовик)/iu,
  ],
  [
    "navbat-sahnasi", // "Chorrahani ikkinchi bo'lib kesib o'tadi:"
    /(chorraha\w*|chorrahadan|chorrahani)\s+.{0,40}(birinchi|ikkinchi|uchinchi|oxirgi)\s+bo'lib|(чорраҳа\w*)\s+.{0,40}(биринчи|иккинчи|учинчи|охирги)\s+бўлиб|(перв|втор|трет|последн)\w*\s+(проедет|пересечёт|пересечет)|проедут\s+перекрёсток\s+в\s+следующем\s+порядке/iu,
  ],
  [
    "yo'naltirgich", // "Yo'naltirgichlar bilan ko'rsatilgan..."
    /yo'naltirgich\w*\s+bilan|йўналтиргич\w*\s+билан|указанн\w*\s+стрелк|стрелками\s+направлени/iu,
  ],
];

// Variantlarning SHAKLI ham ishora beradi: "1,2,3" yoki "«A», «Б», «В»"
// ko'rinishidagi variantlar faqat rasm bo'lganda ma'noga ega.
function optionRules(q) {
  const hits = [];
  const uz = q.options.uz_latn.map((s) => s.trim());
  if (uz.length >= 3 && uz.every((o) => /^\d+$/.test(o))) hits.push("variant-raqam");
  const letter = /^[«"']?[АAБBВVГ][»"']?$/iu;
  const onlyLetter = /^(faqat|фақат|только)\s+[«"']?[АAБBВVГ][»"']?$/iu;
  if (uz.some((o) => letter.test(o) || onlyLetter.test(o))) hits.push("variant-harf");
  return hits;
}

function detect(q) {
  const text = LANGS.map((l) => q.text[l]).join(" | ");
  const hits = [];
  for (const [name, re] of RULES) {
    // "рисунок протектора" faqat shu qoida uchun yolg'on ishora beradi
    if (name === "rasmga-ishora" && TREAD.test(text)) continue;
    if (re.test(text)) hits.push(name);
  }
  return [...hits, ...optionRules(q)];
}

// --- Qoidalarni sinash (1–93 biletlar — rasmlari bor namuna) ---
function calibrate(all) {
  const labeled = all.filter((q) => ticketOf(q.id) <= 93);
  const perRule = {};
  for (const q of labeled) {
    for (const hit of detect(q)) {
      perRule[hit] ||= { matched: 0, withImage: 0 };
      perRule[hit].matched++;
      if (q.image) perRule[hit].withImage++;
    }
  }
  const matched = labeled.filter((q) => detect(q).length > 0);
  const withImage = labeled.filter((q) => q.image);
  return {
    perRule,
    precision: matched.length ? matched.filter((q) => q.image).length / matched.length : 0,
    recall: withImage.length
      ? withImage.filter((q) => detect(q).length > 0).length / withImage.length
      : 0,
  };
}

function groupByTicket(questions) {
  const map = new Map();
  for (const q of questions) {
    const t = ticketOf(q.id);
    if (!map.has(t)) map.set(t, []);
    map.get(t).push(q);
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]);
}

// --- Ma'lumot butunligi: bilet to'liqmi, fayllar savollarga mos keladimi ---
function integrity(all) {
  const shortTickets = groupByTicket(all)
    .filter(([, qs]) => qs.length !== 10)
    .map(([t, qs]) => ({ ticket: t, count: qs.length }));

  const files = fs.existsSync(ASSET_DIR) ? fs.readdirSync(ASSET_DIR).filter((f) => f.endsWith(".webp")) : [];
  const usedImages = new Set(all.map((q) => q.image).filter(Boolean));
  const ids = new Set(all.map((q) => q.id));

  // Savolda ko'rsatilgan, lekin fayli yo'q rasm — ilovada bo'sh joy chiqadi
  const brokenRefs = [...usedImages].filter((img) => !files.includes(img));
  // Fayli bor, lekin hech qaysi savol ishlatmaydi — savol tushib qolgan bo'lishi mumkin
  const orphanFiles = files
    .filter((f) => !usedImages.has(f))
    .map((f) => ({ file: f, questionExists: ids.has(f.replace(/\.webp$/, "")) }));

  return { shortTickets, brokenRefs, orphanFiles };
}

// --- Hisobot ---
const all = loadQuestions();
const missing = all.filter((q) => !q.image && detect(q).length > 0);
const mode = process.argv[2] || "";

if (mode === "--ids") {
  console.log(missing.map((q) => q.id).join("\n"));
  process.exit(0);
}

// Scraper uchun: qidiriladigan savollar matni bilan (uch tilda).
// scripts/scrape_missing_images.py shu ro'yxatni o'qiydi.
if (mode === "--json") {
  console.log(
    JSON.stringify(
      missing.map((q) => ({ id: q.id, ticket: ticketOf(q.id), text: q.text, reasons: detect(q) })),
      null,
      2
    )
  );
  process.exit(0);
}

const cal = calibrate(all);
const totalWithImage = all.filter((q) => q.image).length;
const emptyTickets = groupByTicket(all)
  .filter(([, qs]) => qs.every((q) => !q.image))
  .map(([t]) => t);

if (mode === "--md") {
  const pct = (x) => `${(100 * x).toFixed(0)}%`;
  console.log("# Rasmsiz qolgan savollar\n");
  console.log(`> Avtomatik hisobot. Qayta yaratish: \`node scripts/find-missing-images.mjs --md\`\n`);
  console.log(
    `- Jami savol: **${all.length}**, rasmli: **${totalWithImage}**, rasmsiz: **${all.length - totalWithImage}**`
  );
  console.log(`- Matni rasmga ishora qiladi, lekin rasmi yo'q: **${missing.length}** ta savol`);
  console.log(`- Umuman rasmsiz biletlar: **${emptyTickets.join(", ") || "yo'q"}**`);
  console.log(
    `- Qoidalar aniqligi (1–93 biletlarda sinaldi): **${pct(cal.precision)}**, qamrovi: **${pct(cal.recall)}** — ya'ni bu ro'yxat pastki chegara\n`
  );
  console.log("## Rasmlarni qanday yig'ish\n");
  console.log(
    "Rasmlar manbasi — avto-imtihon.uz. MUHIM: bu sayt GitHub Actions runneridan ham,\n" +
      "boshqa chet el tarmoqlaridan ham ochilmaydi. DNS ishlaydi (avto-imtihon.uz ->\n" +
      "207.180.234.66), lekin 80/443 portlariga TCP ulanish umuman tugallanmaydi\n" +
      "(`curl: (28) Connection timed out`, ulanish vaqti 0.000000s). test-avto.uz ham\n" +
      "shunday. Ya'ni scraping O'zbekiston tarmog'idagi kompyuterdan bajarilishi kerak.\n"
  );
  console.log("```bash");
  console.log("pip install playwright pillow");
  console.log("python -m playwright install chromium");
  console.log("");
  console.log("# 1) sayt tuzilishi va URL shaklini aniqlash");
  console.log("python3 scripts/scrape_missing_images.py --discover 94");
  console.log("");
  console.log("# 2) topilgan URL shakli bilan rasmlarni yig'ish");
  console.log('python3 scripts/scrape_missing_images.py --fetch --url-pattern "/uz/biletlar/{n}"');
  console.log("");
  console.log("# 3) savol bazasiga bog'lash va hisobotni yangilash");
  console.log("node scripts/apply-image-map.mjs");
  console.log("node scripts/find-missing-images.mjs --md > RASMSIZ_SAVOLLAR.md");
  console.log("```\n");
  console.log("| Bilet | Savol | Nima uchun rasm kerak | Savol matni |");
  console.log("| --- | --- | --- | --- |");
  for (const [t, qs] of groupByTicket(missing))
    for (const q of qs)
      console.log(`| ${t} | \`${q.id}\` | ${detect(q).join(", ")} | ${q.text.uz_latn.replace(/\|/g, "\\|")} |`);

  const info = integrity(all);
  console.log("\n## Boshqa topilgan nosozliklar\n");
  console.log("Savollari to'liq bo'lmagan biletlar (10 tadan kam):\n");
  for (const s of info.shortTickets) console.log(`- ${s.ticket}-bilet — ${s.count} ta savol`);
  console.log("\nSavolda ko'rsatilgan, lekin fayli topilmagan rasm:\n");
  console.log(info.brokenRefs.length ? info.brokenRefs.map((f) => `- \`${f}\``).join("\n") : "- yo'q");
  console.log("\nFayli bor, lekin hech qaysi savol ishlatmaydigan rasm:\n");
  console.log(
    info.orphanFiles.length
      ? info.orphanFiles
          .map((o) => `- \`${o.file}\` — mos savol ${o.questionExists ? "bor" : "**yo'q**"}`)
          .join("\n")
      : "- yo'q"
  );
  process.exit(0);
}

console.log("QOIDALAR ANIQLIGI (1–93 biletlarda sinaldi):");
for (const [name, v] of Object.entries(cal.perRule).sort(
  (a, b) => b[1].withImage / b[1].matched - a[1].withImage / a[1].matched
)) {
  console.log(
    `  ${name.padEnd(18)} ${String(v.withImage).padStart(3)}/${String(v.matched).padStart(3)} = ${((100 * v.withImage) / v.matched).toFixed(0)}%`
  );
}
console.log(
  `\nUmumiy aniqlik: ${(100 * cal.precision).toFixed(0)}% | qamrov: ${(100 * cal.recall).toFixed(0)}%`
);
console.log(
  `\nJami savol: ${all.length} | rasmli: ${totalWithImage} | rasmsiz: ${all.length - totalWithImage}`
);
console.log(`Umuman rasmsiz biletlar: ${emptyTickets.join(", ") || "yo'q"}`);
console.log(`\n=== RASM KERAK, LEKIN YO'Q: ${missing.length} ta savol ===\n`);
for (const [t, qs] of groupByTicket(missing)) {
  console.log(`--- ${t}-bilet (${qs.length} ta) ---`);
  for (const q of qs) {
    console.log(`  ${q.id.padEnd(8)} [${detect(q).join(", ")}]  ${q.text.uz_latn.slice(0, 78)}`);
  }
}

const info = integrity(all);
console.log("\n=== BOSHQA NOSOZLIKLAR ===");
console.log(
  `To'liq bo'lmagan biletlar: ${info.shortTickets.map((s) => `${s.ticket}-bilet (${s.count} ta savol)`).join(", ") || "yo'q"}`
);
console.log(`Fayli topilmagan rasm havolalari: ${info.brokenRefs.join(", ") || "yo'q"}`);
console.log(
  `Ishlatilmayotgan rasm fayllari: ${info.orphanFiles.map((o) => `${o.file}${o.questionExists ? "" : " (savolning o'zi yo'q)"}`).join(", ") || "yo'q"}`
);
