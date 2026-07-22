// Test yugurtiruvchi: src/db.js ni vaqtincha xotiradagi fake bilan
// almashtiradi, testlarni ishga tushiradi va oxirida ASL HOLATGA QAYTARADI
// (hatto test yiqilsa ham — finally bloki).
import { readFileSync, writeFileSync, copyFileSync, existsSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(here, "..", "src", "db.js");
const backupPath = path.join(here, ".db.js.backup");

const FAKE_DB_MODULE = `import { createFakeDb } from "../tests/fakeDb.mjs";
export const prisma = createFakeDb();
`;

const TEST_FILES = ["exam.service.test.mjs", "exam.expiry.test.mjs"];

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
  copyFileSync(backupPath, dbPath);
  if (existsSync(backupPath)) unlinkSync(backupPath);
  console.log("\nsrc/db.js asl holatiga qaytarildi.");
}

process.exit(failed > 0 ? 1 : 0);
