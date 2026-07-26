# Tugallanmagan ishlar bajarildi

**Testlar:** questionBank 28/28, regression 56/56
**Build:** ✓ | **i18n:** uchala tilda toza

---

## 1. Yo'l belgilari izohlari — 115/258 dan **258/258** ga

Oldin faqat to'rt toifa yozilgan edi. Endi barchasi to'liq:

| Toifa | Oldin | Endi |
|---|---|---|
| Ogohlantiruvchi | 46/46 | 46/46 |
| Imtiyoz | 9/9 | 9/9 |
| Taqiqlovchi | 35/35 | 35/35 |
| Buyuruvchi | 25/25 | 25/25 |
| **Axborot-ko'rsatgich** | **0/71** | **71/71** |
| **Servis** | **0/17** | **17/17** |
| **Qo'shimcha (taxtachalar)** | **0/55** | **55/55** |

### Muhim tafsilotlar ajratildi

Izohlar shunchaki tarjima emas — imtihonda adashtiradigan nuqtalar
ataylab ta'kidlangan:

- **5.22 va 5.24** — ikkalasi ham "aholi punkti boshlanishi", lekin oq
  fonli belgida aholi punkti qoidalari ISHLAYDI, ko'k fonlida ISHLAMAYDI.
  Bu klassik imtihon savoli.
- **7.x taxtachalari** — mustaqil emas, har doim asosiy belgi bilan birga
  ishlaydi va uning ta'sirini aniqlashtiradi. Izohda shu alohida aytilgan.
- **5.35 reversiv harakat** — svetofor o'chiq bo'lsa bo'lakka kirish
  taqiqlanishi ko'p unutiladi.
- **5.38 turar-joy dahasi** — piyoda ustunligi, 20 km/soat cheklovi.

---

## 2. Chalg'ituvchi testlar — "Tez orada" dan **ishlaydigan funksiya**ga

Oldin bu bo'lim bosilganda faqat "Tez orada" ekrani chiqardi.

### Endi qanday ishlaydi

Test **ko'pchilik xato qiladigan savollardan** tuziladi. Ma'lumot manbai
ikki bosqichli:

1. **Global statistika** (`question_stats` jadvali) — boshqa foydalanuvchilar
   ko'p xato qilgan savollar. Eng ishonchli manba.
2. **Yetmasa** — foydalanuvchining o'z xatolari bilan to'ldiriladi.

### Muhim chegara: 40%

Savol **40% dan ko'p xato** qilingan bo'lsagina "chalg'ituvchi" hisoblanadi.

Nima uchun: 20% xatoli savol chalg'ituvchi emas — ba'zilar shunchaki
e'tiborsiz javob bergan. Chegara qo'ymasak, oddiy savollar ham ro'yxatga
tushib, bo'limning ma'nosi yo'qolardi. Bu test bilan tekshirilgan.

### Yetarli ma'lumot bo'lmasa

Ilova yangi bo'lsa statistika hali to'planmagan bo'ladi. Bunday holatda
aniq xabar ko'rsatiladi: *"Ma'lumot hali yetarli emas — siz va boshqalar
ko'proq test ishlagach, bu bo'lim avtomatik to'ladi"*.

Bo'sh ekran yoki xato ko'rsatishdan yaxshiroq — foydalanuvchi nima
bo'layotganini tushunadi.

### Qayta ishlatish

Alohida test ekrani yozilmadi — mavjud `TestScreen` `customQuestions`
propi bilan qayta ishlatildi. Oqim aynan bir xil (savol, javob, darhol
fikr-mulohaza, natija), kodni takrorlash ma'nosiz bo'lardi.

---

## 3. Tozalash

- **`ComingSoonScreen`** komponenti olib tashlandi — endi hech qayerda
  ishlatilmaydi.
- **`common.comingSoon*`** i18n kalitlari olib tashlandi.
- Kafel tavsifi yangilandi: "Tez orada" -> "Eng ko'p xato qilinadiganlar".
- Izohlarda tasodifan aralashib qolgan **kirill harflari** topildi va
  tuzatildi (`hisoblanган` -> `hisoblangan`).

---

## Hali qolgan ishlar

1. **11 savol yetishmayapti** (bilet 115: 6/10, bilet 116: 3/10).
   `qolgan.sh` skripti tayyor — siz ishga tushirishingiz kerak, men
   test-avto.uz ga ulana olmayman (sandbox tarmog'i cheklangan).
2. **Test vaqti** ("necha daqiqa ishlagani") — `Attempt` jadvaliga
   `durationSec` maydoni kerak, migratsiya talab qiladi.
3. **Frontend bundle ~1.65 MB** — `manualChunks` bilan bo'lish mumkin.
4. **Rate limiting yo'q** — chatda va taklif kodida spam himoyasi.
5. **497 PNG optimallashtirilmagan** — WebP'ga o'tkazish hajmni
   sezilarli kamaytirardi.
