# Savollar bazasi butunlay almashtirildi

**Sana:** 2026-07-25

---

## Nima o'zgardi

Eski **61 bilet, 1220 savol** (qo'lda yozilgan) butunlay olib tashlandi.
Yangi manba: **test-avto.uz** dan scrape qilingan **120 bilet, 1188 savol**
(rasmlar bilan).

| | Eski | Yangi |
|---|---|---|
| Bilet soni | 61 | **120** |
| Savol/bilet | 20 | **10** |
| Jami savol | 1220 | **1188** |
| Rasm | yo'q | **496 savolda bor** |

`TOTAL_TICKETS` va `QUESTIONS_PER_TICKET` shunga mos yangilandi — kodning
qolgan qismi bu qiymatlarni dinamik o'qiydi, qattiq yozilgan joy yo'q edi.

---

## ⚠️ MUHIM: eski ID'lar endi mavjud emas

Eski savol ID'lari (`t1-1` ... `t61-20`) endi hech narsaga mos kelmaydi.

Agar foydalanuvchilarda shu ID'lar bilan **saqlangan savol** yoki **xato
tarixi** bo'lsa, ular ekranda ko'rinmay qoladi (savol topilmasa,
`QuestionListScreen` bunday yozuvni jimgina o'tkazib yuboradi — xato
bermaydi, shunchaki ko'rsatmaydi).

Bu ataylab shunday — sizning aniq so'rovingiz bo'yicha ("eski savollar
kerak emas edi").

**Agar buni istamasangiz**, deploy'dan oldin bazadagi eski yozuvlarni
tozalash mumkin:

```sql
DELETE FROM saved_questions WHERE question_id LIKE 't%-%' AND question_id NOT LIKE 'nt%';
DELETE FROM question_mistakes WHERE question_id LIKE 't%-%' AND question_id NOT LIKE 'nt%';
DELETE FROM question_stats WHERE question_id LIKE 't%-%' AND question_id NOT LIKE 'nt%';
```

Bu ixtiyoriy — bajarmasangiz ham ilova ishlayveradi, faqat eski yozuvlar
DB'da "yetim" bo'lib qoladi (zararsiz, joy egallaydi xolos).

---

## Ma'lumot manbai va sifat tekshiruvi

**Scrape jarayoni:** 3 marta takrorlandi, har safar aniqroq bo'lib bordi.

1-urinish (sizning ilk skriptingiz): 800 savol, **0 tasida to'g'ri javob**.
Sabab: variantlar "sahifadagi barcha button" dan olingan (til
almashtirgich, "Chiqish" tugmasi ham qo'shilib ketgan), to'g'ri javob CSS
klass **nomi** bo'yicha izlangan (Next.js klasslarni siqadi, hech qachon
mos kelmagan).

2-urinish (tashxis asosida tuzatilgan): to'g'ri javob endi
`getComputedStyle` orqali **haqiqiy rangdan** o'qildi (`rgb(97,209,125)` =
yashil). 27/30 to'g'ri chiqdi, lekin har biletning **10-savolida** ishlamadi
— sahifa natija ekraniga o'tib ketib, rang o'qishga ulgurmasdi.

3-urinish (yakuniy): rang **darhol** (120ms) va zaxira (700ms) ikki marta
o'qiladi. Natija: **1188/1189 to'g'ri javob (99.9%)**.

**Rasmlar** alohida scrape'dan (93 bilet, eski rasmli versiya) olinib,
savol matni bo'yicha yangi javoblar bilan **moslashtirildi** — ikkalasida
ham matn aynan bir xil ekani tekshirildi.

**1 ta savol chiqarib tashlandi** (bilet 36, 10-savol): faqat 2 variant
("Ha"/"Yo'q"), to'g'risi aniqlanmadi — noto'g'ri javobni "to'g'ri" deb
ko'rsatishdan ko'ra chiqarib tashlash xavfsizroq.

---

## Rasm integratsiyasi

497 rasm `src/assets/newQuestions/` ga ko'chirildi, nomlanish:
`t<bilet>-<savol>.png` (masalan `t1-1.png`).

### Yangi komponent: `TicketQuestionImage`

Mavjud `SignIcon` uslubiga o'xshab yozildi (`import.meta.glob`).

**Muhim ajratish:** `question.image` maydoni ENDI IKKI XIL bo'lishi mumkin:
- Yo'l belgisi kodi (masalan `"3.24"`) — `SignIcon` uchun, eski tizim
- Savol sahnasi rasmi (masalan `"t1-1.png"`) — `TicketQuestionImage` uchun

`TestScreen.jsx` va `ExamScreen.jsx` da `.png` kengaytmasiga qarab
ajratiladi:

```jsx
{question.image.endsWith(".png") ? (
  <TicketQuestionImage questionId={question.image.replace(".png", "")} />
) : (
  <SignIcon code={question.image} />
)}
```

Bu ikkalasi aralashib ketmasligi uchun zarur edi — eski `image` maydoni
0/1220 savolda ishlatilgan (tayyorlab qo'yilgan, lekin faol foydalanilmagan
xususiyat), shuning uchun mavjud kodga xavfsiz qo'shildi.

---

## Testlar

Backend regression to'plami (56 test) — `TOTAL_TICKETS`ga bog'liq
homework/school mantiqini tekshiradi, hammasi o'tdi. Yangi ma'lumot bilan
hech narsa buzilmadi.

Frontend build muvaffaqiyatli.

---

## Ma'lum cheklovlar

1. **Bilet 36 da 9 ta savol** (10 emas) — bitta savol javobsiz bo'lgani
   uchun chiqarib tashlandi. Boshqa hech bir biletda bu muammo yo'q.
2. **1188 savolning hech biri mavzu bo'yicha tasniflanmagan** — oldingi
   ishda yozilgan `questionTopics.js` klassifikatori endi bu yangi
   savollarga ham avtomatik qo'llanadi (matn bo'yicha ishlaydi), lekin
   natijasi tekshirilmadi.
3. **Rasm fayllari** hozircha optimallashtirilmagan (siqilmagan) — 497 ta
   PNG, umumiy hajm build'ga qo'shildi. Agar sekin yuklansa, keyinroq
   WebP'ga o'tkazish yoki siqish tavsiya etiladi.

---

## Bu zipda yana nima bor

**Soxta yuklanish ekrani olib tashlandi** (siz hali push qilmagan edingiz —
shu sababli birlashtirildi).

`LoadingScreen.jsx` 2-3 soniya SOXTA progress-bar ko'rsatardi: "savollar
tayyorlanmoqda" deb yozilgan, lekin hech qanday tarmoq so'rovi yo'q edi —
faqat `setInterval` bilan tasodifiy son o'sib borardi.

Bu ayniqsa yomon edi, chunki HAQIQIY kutish (Neon/Render uxlab yotganda)
allaqachon `api.loginWithTelegram` so'rovida sodir bo'ladi. LoadingScreen
esa shu haqiqiy kutishdan KEYIN yana qo'shimcha soxta kutish qo'shardi —
foydalanuvchi ikki marta kutardi.

Endi: Login -> darhol MainApp. `LoginScreen` da allaqachon HAQIQIY spinner
bor (`connecting` holati) — u backend javob berguncha turadi.

Ishlatilmay qolgan `loading.*` i18n bloki ham uchala tildan olib tashlandi.

---

## ⚠️ QOLGAN ISH: 11 savol yetishmayapti

Nazariy jihatdan 120 bilet x 10 savol = **1200** savol bo'lishi kerak,
lekin hozir **1189** bor. Sabab:

| Bilet | Bor | Kerak |
|---|---|---|
| 115 | 6 savol | 10 |
| 116 | 3 savol | 10 |

Jami **11 savol** yetishmayapti. O'sha paytda sahifa sekin yuklangan yoki
"Keyingi savol" tugmasi topilmagan — skript qolganini tashlab, keyingi
biletga o'tgan.

Shundan tashqari bilet 36 da 1 savol javobsiz bo'lgani uchun chiqarib
tashlangan (9 savol).

### Buni tuzatish

`qolgan.sh` skripti berilgan — FAQAT 115 va 116 biletni qayta oladi
(~1 daqiqa). Unda kutish vaqtlari oshirilgan, shuning uchun bu safar
to'liq olishi kerak.

```bash
chmod +x qolgan.sh
./qolgan.sh
```

Natijani (`qolgan/bilet_115.json`, `qolgan/bilet_116.json`) menga
tashlasangiz, botga qo'shib qo'yaman va 1200/1200 bo'ladi.

**Hozircha 1189 savol bilan ham bot to'liq ishlaydi** — bu shunchaki
to'liqlik masalasi, xato emas.

---

## Mavzuli testlar YANGI SAVOLLARGA MOSLANDI

### Muammo

Mavzu klassifikatori (`questionTopics.js`) eski 1220 savol matniga moslab
yozilgan edi. Yangi manba (test-avto.uz) boshqa atamalar ishlatadi, shuning
uchun tasnif buzildi:

| | Eski savollar | Yangi savollar (tuzatishdan oldin) |
|---|---|---|
| Tasniflanmagan | 3% | **20%** (240 savol) |
| Mavzu soni | 13 | 12 (`markings`, `liability` yo'qolgan) |

### Aniqlangan sabablar

**1. Atamalar farqi.** Yangi manbada:
- `o'zib o'tish` VA `quvib o'tish` — ikkalasi ham uchraydi
- `chorraha` ustunlik qiladi (eskida `kesishma` ko'proq edi)
- Tibbiy: `jgut`, `suyagi singan`, `shikastlangan`
- Texnik: `karbyurator`, `drossel`, `turg'unlik`, `ag'anab`

**2. APOSTROF MUAMMOSI.** Manbada ikki xil apostrof bor:
`U+0027` (') — 1869 marta, `U+2019` (') — 13 marta. Normallashtirmasak,
`yo'nalish` kaliti `yoʻnalish` matniga mos kelmaydi. `normalize()`
funksiyasi qo'shildi.

**3. RASMGA TAYANGAN SAVOLLAR.** Yangi manbada ~110 savol shunday:
*"Qaysi yo'nalishda harakatlanishga ruxsat etiladi?"* — mazmun RASMDA,
matndan mavzu aniqlanmaydi. Ular hammasi "umumiy"ga tushardi.

### Yechim

**Yangi mavzu qo'shildi: `directions`** (Harakat yo'nalishlari) — 110 savol.
Bu rasmga tayanган "qaysi yo'nalishda ruxsat" savollari uchun.

**`markings` mavzusi qayta tiklandi** (13 savol) — yo'l nishonlari/chiziqlar.
`signs` dan OLDIN turadi, aks holda "chiziqni bildiruvchi belgi" savoli
belgilar mavzusiga tushib ketardi.

### Ikki xato tasnif topildi va tuzatildi

**`avtopoyezd` muammosi:** `poyezd` kaliti tufayli tirkamali yuk avtomobili
savollari **temir yo'l** mavzusiga tushardi (`avtopoyezd` ichida `poyezd`
bor). Kalit olib tashlandi — `temir yo'l` va `shlagbaum` o'zi yetarli aniq.

**`huquqiga ega` muammosi:** bu ibora *"harakatlanish huquqiga ega"*
shaklida **ustunlik** savollarida uchraydi, javobgarlikda emas. Kalit olib
tashlandi.

### Natija

| | Oldin | Keyin |
|---|---|---|
| Tasniflanmagan | 240 (20%) | **74 (6%)** |
| Mavzu soni | 12 | **16** |

Barcha 16 mavzu tekshirildi — har biri kutilgan sonda savol qaytaradi,
hech bir savol yo'qolmaydi (1188 = 1188).

**Yangi mavzular ro'yxati:**
railway (41), firstAid (30), trafficLights (32), overtaking (51),
priority (196), stopping (143), speed (55), maneuvering (68),
directions (110), markings (13), signs (147), pedestrians (40),
cargo (102), technical (70), liability (16), general (74)

`directions` mavzusi uchun i18n nomi uchala tilga qo'shildi, `signpost` va
`minus` ikonkalari `TopicTestsScreen` ga ulandi.

### Qolgan cheklov

74 savol (6%) hamon "Umumiy qoidalar"da — ular chindan aralash mazmunli
(masalan *"Oraliq masofa, deb nimaga aytiladi?"*). Bu qabul qilinadigan
daraja; majburan mavzuga tiqishtirish noto'g'ri tasnifga olib kelardi.
