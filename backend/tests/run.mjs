// Test yugurtiruvchi: src/db.js ni vaqtincha xotiradagi fake bilan
// almashtiradi, testlarni ishga tushiradi va oxirida ASL HOLATGA QAYTARADI
// (test yiqilsa ham, Ctrl+C yoki timeout bilan to'xtatilsa ham — finally
// bloki VA signal handlerlari orqali).
//
// MUHIM: agar bu skript kutilmagan tarzda o'chirilsa (masalan tashqi
// `timeout` buyrug'i orqali SIGTERM), oddiy finally bloki YETARLI EMAS —
// process darhol tugaydi va finally ishlamay qolishi mumkin. Shuning uchun
// SIGINT/SIGTERM uchun ham qaytarish ro'yxatdan o'tkazilgan.
import { writeFileSync, copyFileSync, existsSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(here, "..", "src", "db.js");
const backupPath = path.join(here, ".db.js.backup");

const FAKE_DB_MODULE = `import { createFakeDb } from "../tests/fakeDb.mjs";
export const prisma = createFakeDb();
`;

const TEST_FILES = [
  "exam.service.test.mjs",
  "exam.expiry.test.mjs",
  "school.service.test.mjs",
  "homework.service.test.mjs",
  "school.http.test.mjs",
  "school.regression.test.mjs",
];

let restored = false;
function restoreDb() {
  if (restored) return;
  restored = true;
  if (existsSync(backupPath)) {
    copyFileSync(backupPath, dbPath);
    unlinkSync(backupPath);
    console.log("\nsrc/db.js asl holatiga qaytarildi.");
  }
}

// Kutilmagan uzilishlarda ham tozalash kafolatlanadi
process.on("SIGINT", () => { restoreDb(); process.exit(130); });
process.on("SIGTERM", () => { restoreDb(); process.exit(143); });
process.on("uncaughtException", (err) => { restoreDb(); console.error(err); process.exit(1); });

let failed = 0;
copyFileSync(dbPath, backupPath);

try {
  writeFileSync(dbPath, FAKE_DB_MODULE);

  for (const file of TEST_FILES) {
    console.log(`\n=== ${file} ===`);
    const res = spawnSync(process.execPath, [path.join(here, file)], {
      stdio: "inherit",
      env: { ...process.env, APP_TZ_OFFSET_MINUTES: "300" },
    });
    if (res.status !== 0) failed++;
  }
} finally {
  restoreDb();
}

process.exit(failed > 0 ? 1 : 0);
