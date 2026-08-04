#!/usr/bin/env node
// ============================================================================
// YIG'ILGAN RASMLARNI SAVOL BAZASIGA BOG'LASH
//
// scripts/scrape_missing_images.py yig'gan xaritani
// (scripts/output/missing-images-map.json — {"t94-9": "t94-9.webp", ...})
// shared/data/ticketsData.js ga qo'llaydi: mos savol obyektiga
// `image: "t94-9.webp"` maydonini qo'shadi.
//
// ISHLATISH:
//   node scripts/apply-image-map.mjs                 # qo'llaydi
//   node scripts/apply-image-map.mjs --dry-run       # faqat ko'rsatadi
//   node scripts/apply-image-map.mjs --map <fayl>    # boshqa xarita fayli
//
// XAVFSIZLIK:
//  - fayli mavjud bo'lmagan rasm bazaga yozilmaydi;
//  - allaqachon `image` maydoni bor savolga tegilmaydi;
//  - har bir savol obyekti bazada bitta qatorda turadi, shuning uchun
//    o'zgartirish qatorning oxirgi `}` sidan oldin qo'shiladi.
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const DATA_FILE = path.join(ROOT, "shared/data/ticketsData.js");
const ASSET_DIR = path.join(ROOT, "src/assets/newQuestions");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const mapIdx = args.indexOf("--map");
const MAP_FILE =
  mapIdx !== -1 && args[mapIdx + 1]
    ? path.resolve(args[mapIdx + 1])
    : path.join(ROOT, "scripts/output/missing-images-map.json");

if (!fs.existsSync(MAP_FILE)) {
  console.error(`XATO: xarita fayli topilmadi: ${MAP_FILE}`);
  console.error("Avval: python3 scripts/scrape_missing_images.py --fetch ...");
  process.exit(1);
}

const mapping = JSON.parse(fs.readFileSync(MAP_FILE, "utf8"));
const lines = fs.readFileSync(DATA_FILE, "utf8").split("\n");

let applied = 0;
const skipped = [];

for (const [id, file] of Object.entries(mapping)) {
  if (!fs.existsSync(path.join(ASSET_DIR, file))) {
    skipped.push(`${id}: ${file} fayli yo'q`);
    continue;
  }

  const idx = lines.findIndex((l) => l.includes(`id: "${id}"`));
  if (idx === -1) {
    skipped.push(`${id}: bazada topilmadi`);
    continue;
  }
  if (/\bimage:\s*"/.test(lines[idx])) {
    skipped.push(`${id}: allaqachon rasmi bor`);
    continue;
  }

  const close = lines[idx].lastIndexOf("}");
  if (close === -1) {
    skipped.push(`${id}: qator kutilgan shaklda emas`);
    continue;
  }

  // `..., correct: 1 }` -> `..., correct: 1, image: "t94-9.webp" }`
  const head = lines[idx].slice(0, close).replace(/[\s,]+$/, "");
  lines[idx] = `${head}, image: "${file}" ${lines[idx].slice(close)}`;
  applied++;
  if (dryRun) console.log(`+ ${id} -> ${file}`);
}

if (!dryRun && applied > 0) fs.writeFileSync(DATA_FILE, lines.join("\n"));

console.log(`\n${dryRun ? "[dry-run] " : ""}Qo'llandi: ${applied} ta savol`);
if (skipped.length) {
  console.log(`O'tkazib yuborildi: ${skipped.length} ta`);
  for (const s of skipped) console.log(`  - ${s}`);
}
if (!dryRun && applied > 0) {
  console.log("\nTekshirish: node scripts/find-missing-images.mjs | tail -5");
}
