# School moduli — tuzatishlar hisoboti

**Sana:** 2026-07-24
**Qamrov:** faqat driving school moduli (backend routes/services + tegishli frontend)
**Testlar:** 166 ta test o'tdi (shundan 19 tasi yangi regression testlari)
**Frontend build:** muvaffaqiyatli

---

## ⚠️ ENG MUHIM: "negadir ishlamayapti" sababi

`logActivity()` tranzaksiyadan **keyin** chaqirilardi va xato tashlasa, butun
so'rov 500 bilan yiqilardi.

Natija: **maktab REAL yaratilgan bo'lsa ham**, foydalanuvchi "Server xatosi"
ko'rardi. Admin panelni yangilaganda maktab paydo bo'lardi — bu chalkashlikka
sabab bo'lgan.

Ildiz sabab: `ActivityType` enumida `SCHOOL_*` qiymatlari yo'q edi. Siz oxirgi
commit'da enum'ga qiymatlarni qo'shgansiz, lekin **arxitektura kamchiligi
qolgan edi** — log yozuvi hech qachon asosiy biznes amalini buzmasligi kerak.

**Yechim:** `safeLog()` yordamchisi. Log xatosi endi konsolga yoziladi, lekin
asosiy oqim davom etadi.

```js
async function safeLog(fn) {
  try { await fn(); }
  catch (err) { console.error("[school] activity log yozilmadi:", err?.message); }
}
```

Test: `XATO 12`

---

## 🔒 Xavfsizlik xatolari (eng jiddiy)

### 1. Guruhsiz o'qituvchi begona talabalarni ko'rardi

`GET /:schoolId/students` da:

```js
where.groupId = req.membership.groupId;  // null bo'lsa...
```

`groupId === null` bo'lganda Prisma buni "groupId IS NULL" deb tushunadi —
ya'ni o'qituvchi maktabning **barcha guruhsiz talabalarini** ko'rardi.

**Yechim:** guruhga tayinlanmagan o'qituvchiga bo'sh ro'yxat qaytariladi.

Test: `XATO 1`

### 2. O'qituvchi `?groupId=` bilan chegaradan chiqardi

Query parametri rol tekshiruvidan **keyin** qo'llanilardi:

```js
if (teacher) where.groupId = req.membership.groupId;
if (req.query.groupId) where.groupId = Number(req.query.groupId);  // override!
```

O'qituvchi `?groupId=5` yozib, boshqa guruh talabalarini ko'ra olardi.

**Yechim:** query parametri faqat Owner/CEO uchun ruxsat etiladi.

Test: `XATO 2`

### 3. Cross-school ma'lumot oqishi

`/groups/:groupId/homework` va `/groups/:groupId/leaderboard` guruhning shu
maktabga tegishliligini tekshirmasdi. Owner boshqa maktabning guruh ID sini
yozib, **o'zga maktab ma'lumotini** o'qiy olardi.

**Yechim:** har ikkala route'da `group.schoolId === req.schoolId` tekshiruvi.

Test: `XATO 3`

---

## 🐛 Mantiqiy xatolar

### 4. `groupId` matn/son taqqoslash

Frontend `<select>` qiymatni **matn** ("3") yuboradi. Backend:

```js
if (type !== "GROUP" || Number(groupId) !== req.membership.groupId)
```

Konvertatsiya tartibi noto'g'ri edi — o'qituvchi o'z guruhi uchun ham kod
yarata olmasdi.

**Yechim:** ikki tomonda ham aniq konvertatsiya (`OwnerInvitationsTab.jsx` +
`school.js`).

Test: `XATO 4`

### 5. Guruhsiz o'qituvchi kod yaratardi

`req.membership.groupId` null bo'lsa, `null !== null` false — tekshiruv o'tib
ketardi.

**Yechim:** aniq null tekshiruvi, 403 qaytadi.

Test: `XATO 5`

### 6. `maxUses = 0` "cheksiz" bo'lib qolardi

```js
maxUses: maxUses ? Number(maxUses) : null   // 0 → null → cheksiz!
```

**Yechim:** musbat butun son validatsiyasi.

Test: `XATO 6`

### 7. `minScore` bo'sh maydonda 0 bo'lardi

`Number("") === 0` — bo'sh input "minimal ball 0" sifatida saqlanardi.
Diapazon ham tekshirilmasdi (200 kiritish mumkin edi).

**Yechim:** bo'sh → null, 0–100 diapazon validatsiyasi.

Test: `XATO 8`, `XATO 9`

### 8. `reactivateTeacher` — noto'g'ri izoh, real xato

Kodda "boshqa maktab tekshiruvi shart emas" degan izoh bor edi. Bu **xato**:
SUSPENDED o'qituvchi boshqa maktabga talaba bo'lib qo'shilishi mumkin
(`joinSchoolByCode` faqat ACTIVE a'zolikni arxivlaydi). Keyin qayta
faollashtirish DB constraint'iga urilib **500** berardi.

**Yechim:** raqobatchi faol a'zolik tekshiruvi + tushunarli xato xabari.

### 9. Teacher dashboard guruhsiz o'qituvchida yiqilardi

`Number(undefined)` → `NaN` → noto'g'ri so'rov.

**Yechim:** 409 va aniq xabar ("Siz hali biror guruhga tayinlanmagansiz").

Test: `XATO 10`

### 10. Kuchli/kuchsiz talabalar ro'yxati kesishardi

```js
strongStudents = sorted.slice(0, 5);
weakStudents = sorted.slice(-5);
```

5 talabali guruhda **aynan bir xil 5 talaba** ham "kuchli", ham "kuchsiz"
bo'lib ko'rinardi.

**Yechim:** ro'yxatlar hech qachon ustma-ust tushmaydi (`Math.floor(n/2)`).

Test: `XATO 11`

### 11. O'chirilgan guruh kodi

GROUP kodi guruhi o'chirilsa (`onDelete: SetNull`), `groupId` null bo'lardi.
Bunday kod bilan qo'shilgan talaba **guruhsiz osilib qolardi** va hech qanday
homework olmasdi.

**Yechim:** aniq xato — "Bu kodning guruhi o'chirilgan".

---

## ⚡ Race condition'lar

Uch joyda tekshiruv tranzaksiyadan **tashqarida** edi — ikki so'rov bir vaqtda
kelsa ikkalasi ham o'tib ketardi:

| Funksiya | Muammo |
|---|---|
| `createSchool` | Bir foydalanuvchi ikki maktab egasi bo'lishi mumkin edi |
| `inviteTeacherDirect` | Ikki maktabda bir vaqtda o'qituvchi |
| `joinSchoolByCode` | Kod limiti oshib ketardi |

**Yechim:**
- Tekshiruvlar tranzaksiya ichiga ko'chirildi
- `P2002` (unique constraint) xatosi tushunarli xabarga aylantirildi
- Kod limiti **atomik** `updateMany` bilan ushlanadi:

```js
const claimed = await tx.invitation.updateMany({
  where: { id, revokedAt: null, usedCount: { lt: maxUses } },
  data: { usedCount: { increment: 1 } },
});
if (claimed.count === 0) throw new SchoolError("code_exhausted", ...);
```

Test: `XATO 7`

---

## 🚀 Performance (N+1 so'rovlar)

| Joy | Avval | Endi |
|---|---|---|
| `listSchools` | 1 + 2N (100 maktab = 201 so'rov) | 2 so'rov |
| `listGroups` | 1 + N | 2 so'rov |
| `summarizeStudents` | 3N (200 talaba = 600 so'rov) | 3 so'rov |
| `getSchoolAnalytics` teacher perf. | N × (1 + 3M) | 1 so'rov (mavjud data qayta ishlatiladi) |
| `getPlatformAnalytics` | **N × (1 + 3M)** — 50 maktab × 100 talaba ≈ **15 000+** | 4 so'rov |
| `createHomework` submissions | N ta `create()` | 1 ta `createMany()` |

Eng og'iri — CEO dashboard'i. Maktablar soni oshsa, u amalda ochilmay qolardi.

---

## 🌐 i18n

Uchta tilda ham yetishmayotgan kalitlar qo'shildi:
- `school.searchOwnerPlaceholder`
- `school.ownerNotSelected`

---

## 🧹 Tozalash

- `homeworkService.js` — ishlatilmagan `getQuestionsByIds` importi olib tashlandi
- `schoolAnalyticsService.js` — ishlatilmagan `parseJson` helper olib tashlandi

---

## 🧪 Test infratuzilmasi

`tests/fakeDb.mjs` ga qo'shildi (production kodiga tegmaydi):
- `createMany` (+ `skipDuplicates`)
- `updateMany` da `increment`/`decrement`
- `groupBy` da `_sum`

Yangi fayl: `tests/school.regression.test.mjs` — 19 ta test, har biri aniq bir
tuzatilgan xatoni qamrab oladi.

---

## ⚠️ Muhim eslatma

Bu tuzatishlar **real PostgreSQL'da sinalmagan** — mening muhitimda Prisma
engine yuklanmadi (tarmoq cheklovi). Testlar in-memory fake DB'da o'tadi.

**Deploy qilishdan oldin albatta:**

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
npm test
```

Va staging'da quyidagilarni qo'lda tekshiring:
1. Maktab yaratish (CEO)
2. Taklif kodi yaratish va u bilan qo'shilish
3. O'qituvchi dashboard'i (guruhli va guruhsiz)
4. CEO analitikasi

---

## 📌 Keyingi tavsiyalar (bu safar qilinmadi)

1. **Frontend bundle 1.5 MB** — `manualChunks` bilan bo'lish kerak. Telegram
   Mini App sekin internetda ochiladi.
2. **`expireOverdueSubmissions` lazy chaqiriladi** — homework ro'yxati
   ochilganda ishlaydi. Hech kim ochmasa, muddati o'tgan topshiriqlar PENDING
   bo'lib qoladi. Cron job yaxshiroq.
3. **School moduli uchun rate limiting yo'q** — taklif kodini brute-force
   qilish mumkin (6 belgili kod).
