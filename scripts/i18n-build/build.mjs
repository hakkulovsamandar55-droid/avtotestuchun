import { TICKETS } from "./tickets-raw.mjs";
import TransliteratorPkg from "lotin-kirill";
import { readFileSync, writeFileSync } from "fs";

const Transliterator = TransliteratorPkg.default || TransliteratorPkg;
const translit = new Transliterator();

const ruMap = JSON.parse(readFileSync(new URL("../translations.ru.json", import.meta.url)));

function toCyrl(s) {
  if (!s) return s;
  return translit.textToCyrillic(s);
}

function jsStr(s) {
  return JSON.stringify(s);
}

let translatedCount = 0;
let totalCount = 0;

const ticketNumbers = Object.keys(TICKETS).map(Number).sort((a, b) => a - b);

let out = "";
out += "const TICKETS = {\n";

for (const num of ticketNumbers) {
  out += `  ${num}: [\n`;
  for (const q of TICKETS[num]) {
    totalCount++;
    const ru = ruMap[q.id];
    if (ru) translatedCount++;

    const textObj = { uz_latn: q.text, uz_cyrl: toCyrl(q.text) };
    if (ru) textObj.ru = ru.text;

    const optionsObj = { uz_latn: q.options, uz_cyrl: q.options.map(toCyrl) };
    if (ru) optionsObj.ru = ru.options;

    out += buildQuestionLine(q, textObj, optionsObj);
  }
  out += `  ],\n`;
}
out += "};\n";

function buildQuestionLine(q, textObj, optionsObj) {
  const parts = [];
  parts.push(`id: ${jsStr(q.id)}`);

  const textEntries = [`uz_latn: ${jsStr(textObj.uz_latn)}`, `uz_cyrl: ${jsStr(textObj.uz_cyrl)}`];
  if (textObj.ru) textEntries.push(`ru: ${jsStr(textObj.ru)}`);
  parts.push(`text: { ${textEntries.join(", ")} }`);

  const optEntries = [`uz_latn: ${jsStr(optionsObj.uz_latn)}`, `uz_cyrl: ${jsStr(optionsObj.uz_cyrl)}`];
  if (optionsObj.ru) optEntries.push(`ru: ${jsStr(optionsObj.ru)}`);
  parts.push(`options: { ${optEntries.join(", ")} }`);

  parts.push(`correct: ${q.correct}`);
  if (q.image) parts.push(`image: ${jsStr(q.image)}`);

  return `    { ${parts.join(", ")} },\n`;
}

writeFileSync(new URL("./tickets-output.js", import.meta.url), out);

console.error(`Total questions: ${totalCount}`);
console.error(`Translated to Russian: ${translatedCount}`);
console.error(`Remaining (fallback to uz_latn): ${totalCount - translatedCount}`);
