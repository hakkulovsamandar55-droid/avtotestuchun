# Qolgan ishlar bajarildi

**Testlar:** regression 56/56, questionBank 28/28, chat 23/23
**Build:** ✓ | **i18n:** uchala tilda toza

---

## 1. Rasmlar optimallashtirildi — 29 MB dan 17 MB ga

### Nima qilindi

497 savol rasmi PNG dan **WebP** ga o'girildi va o'lchami kamaytirildi.

### Nima uchun faqat WebP yetarli emas edi

Avval faqat formatni o'zgartirishni sinab ko'rdim — natija **3% kamayish**.
Sabab: rasmlar **1920×1080** piksel edi.

Telefonda savol rasmi taxminan **280-320px** kenglikda ko'rsatiladi
(`TicketQuestionImage maxHeight=260`). Retina ekranlarda 2-3x piksel
zichligi bo'lgani uchun **900px** ortig'i bilan yetarli. 1920px behuda —
hech qachon shu o'lchamda ko'rinmaydi.

O'lcham + format birga: **263 KB -> 92 KB** (65% kamayish) eng katta rasmda.

### Kodda o'zgarishlar

`.png` -> `.webp`: `ticketsData.js` (497 havola), `TicketQuestionImage.jsx`,
`TestScreen.jsx`, `ExamScreen.jsx` (rasm turini ajratish mantiqi).

---

## 2. Bundle bo'lindi (code splitting)

### Oldin

Hamma narsa bitta **1.65 MB** faylda. Foydalanuvchi bosh sahifani ko'rish
uchun ham butun faylni kutardi.

### Endi

| Bo'lak | Hajm (gzip) | Qachon kerak |
|---|---|---|
| `index` | 531 KB | doim |
| `react` | 45 KB | doim (keshda qoladi) |
| `data-questions` | **69 KB** | faqat test boshlanganda |
| `i18n` | 17 KB | doim |
| `data-signs` | **10 KB** | faqat belgilar bo'limida |
| `vendor` | 8 KB | doim |
| `icons` | 7 KB | doim |
| `socket` | **6 KB** | faqat duel rejimida |

**Asosiy yutuq keshda:** kutubxonalar (react, icons, i18n) kamdan-kam
o'zgaradi. Ilova kodini yangilaganingizda foydalanuvchi 615 KB emas, faqat
o'zgargan `index` bo'lagini qayta yuklaydi.

**Ikkinchi yutuq:** savollar bazasi (69 KB) va belgilar (10 KB) bosh
sahifada YUKLANMAYDI — faqat kerak bo'lganda.

---

## 3. Test ishlash vaqti kuzatiladi

O'qituvchi panelida *"bu talaba bugun 12 daqiqa ishlagan"* ko'rsatish uchun
kerak edi, lekin `Attempt` jadvalida vaqt saqlanmasdi.

### Migratsiya

`20260726000000_attempt_duration` — `attempts.duration_sec` ustuni
qo'shiladi (ixtiyoriy, NULL bo'lishi mumkin).

**Eski yozuvlarda NULL** — bu ataylab. O'sha paytda vaqt o'lchanmagan va
uni "0" deb yozish *"0 daqiqa ishlagan"* degan xato ma'no berardi.
Statistikada NULL yozuvlar 0 deb qo'shiladi, ya'ni yig'indini buzmaydi.

### Muhim chegara: 2 soat

Foydalanuvchi testni ochib qo'yib ketishi mumkin (telefonni yopib, ertasi
kuni davom etishi). Bunday holatda vaqt bir necha soat bo'lib chiqadi va
kunlik statistikani butunlay buzardi. 7200 soniyadan oshsa yozilmaydi.

### UI

Talaba profilida kunlik grafik ostida jami vaqt ko'rsatiladi. **0 bo'lsa
umuman ko'rsatilmaydi** — eski kunlar uchun ma'lumot yo'q, "0 daqiqa"
yozish chalg'ituvchi bo'lardi.

---

## 4. Rate limiting qo'shildi

Yangi fayl: `backend/src/rateLimit.js` — sodda, xotirada ishlaydigan
chegaralovchi.

### Nima uchun tashqi kutubxona emas

`express-rate-limit` ko'proq imkoniyat beradi, lekin bizga faqat "N ta
so'rov / M daqiqada" kerak. Qo'shimcha bog'liqlik ortiqcha.

### Nima uchun IP emas, foydalanuvchi ID bo'yicha

Telegram Mini App'da ko'p foydalanuvchi bir xil IP ortida bo'lishi mumkin
(mobil operator NAT). IP bo'yicha cheklasak, bir odam boshqalarni ham
bloklab qo'yardi.

### Qo'llangan joylar

| Endpoint | Chegara | Sabab |
|---|---|---|
| Chat xabar yuborish | 20 / daqiqa | Oddiy suhbat uchun yetarli (3 s da bir), avtomatik spam'ni to'sadi |
| Taklif kodi bilan qo'shilish | 8 / 10 daqiqa | Kod qisqa (6 belgi) — brute-force himoyasi |

Chat testlari (7 xabar yuboradi) va regression testlari muammosiz o'tdi —
chegara oddiy foydalanishga xalaqit bermaydi.

### Ma'lum cheklov

Xotirada ishlaydi, shuning uchun server qayta ishga tushganda hisoblar
nolga qaytadi. Bir necha process bo'lsa har biri o'z hisobini yuritadi —
o'shanda Redis kerak bo'lardi. Hozircha `WEB_CONCURRENCY=1` bo'lgani uchun
shart emas.

Xotira cheksiz o'smasligi uchun har 10 daqiqada eskirgan yozuvlar
tozalanadi.

---

## ⚠️ Deploy: bitta yangi migratsiya

```
20260726000000_attempt_duration
```

Render'da `prisma migrate deploy` avtomatik ishlaydi. Neon uxlab qolsa
`P1002`: Neon SQL Editor'da `SELECT 1;` -> Manual Deploy.

---

## Hali qolgan yagona ish

**11 savol yetishmayapti** (bilet 115: 6/10, bilet 116: 3/10).

`qolgan.sh` skripti tayyor — **siz** ishga tushirishingiz kerak. Men
test-avto.uz ga ulana olmayman: sandbox proksisi rad etadi
(`x-deny-reason: host_not_allowed`), tarmoq faqat github/npm/pypi
domenlariga ruxsat etilgan.

Natijani menga tashlasangiz, 1200/1200 qilaman.
