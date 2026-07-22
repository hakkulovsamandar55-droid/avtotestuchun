// i18n tekshiruvi:
//   1) uchala til bir xil kalitlarga egami
//   2) kodda ishlatilgan har bir kalit tarjimada bormi
//   3) bo'sh tarjima yo'qmi
//
// Ishlatish:  node scripts/check-i18n.mjs
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LANGS = ["uz-latn", "uz-cyrl", "ru"];
const BASE = "uz-latn";

const mods = {};
for (const l of LANGS) {
  mods[l] = (await import(path.join(root, "src/i18n/locales", `${l}.js`))).default;
}

function flatten(obj, prefix = "") {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) Object.assign(out, flatten(v, key));
    else out[key] = v;
  }
  return out;
}

const flat = Object.fromEntries(LANGS.map((l) => [l, flatten(mods[l])]));
const baseKeys = new Set(Object.keys(flat[BASE]));
let problems = 0;

console.log("=== 1. Tillar orasida kalit mosligi ===");
for (const l of LANGS.filter((x) => x !== BASE)) {
  const keys = new Set(Object.keys(flat[l]));
  const missing = [...baseKeys].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !baseKeys.has(k));
  if (missing.length) {
    problems++;
    console.log(`  ${l}: ${missing.length} ta YETISHMAYDI ->`, missing.slice(0, 10));
  }
  if (extra.length) {
    problems++;
    console.log(`  ${l}: ${extra.length} ta ORTIQCHA ->`, extra.slice(0, 10));
  }
  if (!missing.length && !extra.length) console.log(`  ${l}: OK (${keys.size} kalit)`);
}

console.log("\n=== 2. Kodda ishlatilgan kalitlar mavjudmi ===");
// Faqat t("...") — params.set("query", ...) kabi chaqiruvlar hisobga olinmaydi
// (ular ham `t(` bilan tugaydigan naqshga tushib qolmasligi uchun oldidan
// harf/nuqta bo'lmasligini talab qilamiz).
const raw = execSync(
  `grep -rhoE '[^a-zA-Z0-9_.]t\\("[a-zA-Z0-9_.]+"' ${path.join(root, "src")} --include=*.jsx --include=*.js || true`
).toString();

const used = [
  ...new Set(
    raw
      .split("\n")
      .filter(Boolean)
      .map((s) => s.slice(s.indexOf('t("') + 3, -1))
  ),
];

const missingInLocale = used.filter((k) => !(k in flat[BASE]));
if (missingInLocale.length) {
  problems++;
  console.log(`  ${missingInLocale.length} ta kalit kodda bor, tarjimada YO'Q:`);
  missingInLocale.forEach((k) => console.log("    - " + k));
} else {
  console.log(`  OK — kodda ishlatilgan ${used.length} ta kalitning hammasi mavjud`);
}

console.log("\n=== 3. Bo'sh qiymatlar ===");
let anyEmpty = false;
for (const l of LANGS) {
  const empty = Object.entries(flat[l])
    .filter(([, v]) => typeof v === "string" && !v.trim())
    .map(([k]) => k);
  if (empty.length) {
    problems++;
    anyEmpty = true;
    console.log(`  ${l}: bo'sh ->`, empty);
  }
}
if (!anyEmpty) console.log("  OK");

console.log("\n" + (problems === 0 ? "HAMMASI JOYIDA" : `${problems} ta muammo topildi`));
process.exit(problems ? 1 : 0);
