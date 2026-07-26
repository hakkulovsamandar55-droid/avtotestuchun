# Testerga topshirishdan oldingi audit

**Testlar:** regression 56/56, questionBank 34/34, chat 23/23
**Build:** ✓ | **i18n:** uchala tilda toza

---

## Tizimli tekshiruv natijalari

Butun loyihani avtomatik skanerlab tekshirdim:

| Tekshiruv | Natija |
|---|---|
| `onClick`siz tugmalar | **0** — barcha tugmalar ishlaydi |
| Ulanmagan ekran komponentlari | **0** — 52 ekranning hammasi yetib boradi |
| Frontend chaqiradigan, backend'da yo'q endpoint | **0** |
| Yetishmayotgan i18n kalitlar | **0** (uchala tilda) |

---

## Topilgan va tuzatilgan muammolar

### 1. Bloklangan tema — o'lik yo'l edi

Premium bo'lmagan foydalanuvchi rangli tema tanlaganda:

```js
showComingSoon(t("settings.premium"));   // faqat "Premium tariflar" alert
```

Foydalanuvchi *"Premium tariflar"* degan alert ko'rardi va **nima qilish
kerakligini tushunmasdi**. Premium sahifasiga o'tish imkoni yo'q edi.

**Tuzatildi:** endi to'g'ridan-to'g'ri premium sahifasiga o'tkazadi —
foydalanuvchi nima uchun bloklanganini ko'radi va sotib olishi mumkin.

Ishlatilmay qolgan `showComingSoon` funksiyasi va importi tozalandi.

### 2. Belgi izohidagi yetib bo'lmaydigan zaxira matn

`signs.detailHint` (*"izoh tez orada qo'shiladi"*) hamon kodda edi, lekin
barcha **258 belgi** izohlangan — bu matn hech qachon ko'rinmaydi.

**Tuzatildi:** zaxira olib tashlandi. Agar kelajakda izohsiz belgi qo'shilsa,
blok umuman ko'rsatilmaydi (bo'sh karta chiqmasligi uchun).

### 3. O'lik "tez orada" i18n kalitlari

Uchta kalit kodda ishlatilmasdi:
`notificationsComingSoon`, `supportComingSoon`, `premium.comingSoon`

Ular avvalgi tugallanmagan bo'limlardan qolgan edi. Tozalandi.

---

## YETIB BO'LMAYDIGAN BO'LIM TOPILDI VA QO'SHILDI

### Referral (do'stlarni taklif qilish)

**Muammo:** referral tizimi bazada **allaqachon to'liq ishlab turgan edi**:
- Har foydalanuvchiga unikal kod generatsiya qilinadi (`referral_code`)
- Ro'yxatdan o'tishda kim kimni chaqirgani yozib qo'yiladi (`referred_by_id`)
- Admin panelida ko'rinadi

Lekin **oddiy foydalanuvchi o'z kodini hech qayerdan ko'ra olmasdi.** Backend
endpoint ham yo'q edi. Ya'ni tayyor funksiya bor, unga yetib bo'lmaydi.

**Qo'shildi:**

*Backend:* `GET /api/stats/referral` — kod, havola, taklif qilganlar ro'yxati.

Kod hali yaratilmagan bo'lsa (eski hisoblar) — **shu paytda yaratiladi**.
Aks holda foydalanuvchi bo'sh ekran ko'rardi.

*Frontend:* `ReferralScreen` — Sozlamalar -> "Do'stlarni taklif qilish".

**Nusxa olishda zaxira usul:** Telegram WebView'da `navigator.clipboard`
ba'zi versiyalarda bloklangan. Shuning uchun `execCommand` orqali zaxira
usul ham bor — aks holda tugma jimgina ishlamay qolardi.

**Havola ixtiyoriy:** `BOT_USERNAME` env o'zgaruvchisi kerak. Sozlanmagan
bo'lsa UI faqat kodni ko'rsatadi, havolani yashiradi (buzuq havola
ko'rsatishdan yaxshiroq).

### ⚠️ Deploy uchun

Render'da yangi env o'zgaruvchi qo'shing:

```
BOT_USERNAME=sizning_bot_useri
```

(@ belgisisiz). Bo'sh qoldirsangiz ham ishlaydi — faqat havola ko'rinmaydi.

---

## Testerga aytish kerak bo'lgan ma'lum cheklovlar

Bular **xato emas**, ataylab shunday:

1. **Bilet 36 da 9 savol** (10 emas) — bitta savolning to'g'ri javobi
   manbada aniqlanmadi, noto'g'ri javob ko'rsatishdan ko'ra chiqarib
   tashlash tanlandi.
2. **Bilet 115 (6 savol) va 116 (3 savol)** — scrape to'liq tugamagan.
   Jami 11 savol yetishmayapti. `qolgan.sh` skripti tayyor.
3. **Chalg'ituvchi testlar** boshida bo'sh bo'lishi mumkin — u global
   statistikaga tayanadi. Bir necha kun foydalanilgach to'ladi. Bo'sh
   holatda aniq xabar ko'rsatiladi.
4. **Test vaqti** faqat yangi urinishlarda kuzatiladi — eski yozuvlarda
   ma'lumot yo'q, shuning uchun eski kunlarda 0 daqiqa ko'rinadi.
5. **Mavzu tasnifi evristika** — 74 savol (6%) "Umumiy qoidalar"da. Ular
   chindan aralash mazmunli.
6. **Rate limiting** server qayta ishga tushganda nolga qaytadi (xotirada
   ishlaydi). Bir necha process bo'lsa Redis kerak bo'lardi.

---

## Tester uchun tavsiya etilgan tekshiruv yo'llari

**Asosiy oqim:** Login -> bosh sahifa -> bilet tanlash -> test ishlash ->
natija -> saqlangan savollarni ko'rish

**Mavzular:** Mavzuli testlar -> 16 mavzudan bir nechtasi -> test tugatish

**Belgilar:** Yo'l belgilari -> toifa -> belgi -> izoh ko'rinishi -> toifadan
test ishlash

**Xatolar:** Xatolar bilan ishlash -> ikki bo'lim -> savolni saqlash

**Maktab (o'qituvchi):** Admin/Owner -> o'qituvchi qo'shish (qidiruv orqali)
-> guruh tayinlash -> o'qituvchi sifatida kirish -> talaba profili -> vazifa
berish (maqsadli) -> chat

**Premium:** Sozlamalar -> Premium -> narx ko'rinishi. Admin panelda narxni
o'zgartirib, foydalanuvchi tomonda yangilanishini tekshirish.

**Referral:** Sozlamalar -> Do'stlarni taklif qilish -> kod nusxalash

**Temalar:** Sozlamalar -> 5 tema almashtirish (2 bepul, 3 premium) ->
bloklangan tema bosilganda premium sahifasiga o'tishini tekshirish
