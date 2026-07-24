# AvtoTest — Chat + Guruh tayinlash + Owner o'qituvchi ko'rinishi

**Sana:** 2026-07-24
**Testlar:** 212 (42 regression + 23 chat + qolganlari)
**Frontend build:** ✓
**i18n:** uchala tilda 136 tadan kalit, dublikat yo'q, yetishmayotgani yo'q

---

## ⚠️ DEPLOY QILISHDAN OLDIN

Bu paketda **migratsiya bor** — yangi jadvallar yaratiladi.

Render'da `npx prisma migrate deploy` avtomatik ishlaydi. Neon uxlab qolgan
bo'lsa `P1002` (advisory lock timeout) chiqishi mumkin:

1. Neon SQL Editor → `SELECT 1;` (bazani uyg'otadi)
2. Render → **Manual Deploy** → **Deploy latest commit**

---

## 1. Guruh tayinlash — ENG MUHIM TUZATISH

### Muammo

Screenshot'dagi xabar: *"Sizga hali guruh tayinlanmagan. Maktab egasi bilan
bog'laning."*

Lekin **maktab egasida tayinlash tugmasi yo'q edi**. Ya'ni bu xabar bajarib
bo'lmaydigan ko'rsatma berardi.

Zanjir shunday uzilgan edi:

- Owner o'qituvchi qo'shadi → `groupId` **null**
- O'qituvchi kiradi → tupik ekran
- Owner tayinlamoqchi → **route yo'q, servis funksiyasi yo'q, tugma yo'q**

Natijada o'qituvchi paneli, talaba statistikasi, oxirgi xatolar — hammasi
yozilgan, lekin **ularga yetib bo'lmasdi**.

### Yechim

**Backend:**
- `PATCH /:schoolId/teachers/:membershipId/group` — yangi route
- `assignTeacherToGroup()` — yangi servis funksiyasi

**Frontend:**
- Owner panelidagi har bir o'qituvchi kartasida guruh selektori
- Guruhsiz o'qituvchida sariq ogohlantirish

**Xavfsizlik:** boshqa maktabning guruh ID sini yozib tayinlash mumkin emas —
aks holda o'qituvchi begona maktab talabalarini ko'rardi.

**Testlar (8 ta):** tayinlash, guruhdan chiqarish, panel ochilishi,
cross-school himoya, o'qituvchi o'zini tayinlay olmasligi.

---

## 2. Owner → o'qituvchi ko'rinishi

### Muammo

Container'da:

```js
if (membership.role === "OWNER") {
  return <OwnerDashboard ... />;  // tugadi, boshqa yo'l yo'q
}
```

Kichik maktabda egasi ko'pincha o'zi ham dars beradi, lekin unga talaba
statistikasi va topshiriq berish yopiq edi.

### Yechim

Guruhlar tabida guruhni bosib, o'qituvchi paneliga o'tiladi. Backend
allaqachon Owner'ga barcha guruhlarga ruxsat berardi — faqat UI yo'q edi.

Yo'l-yo'lakay: guruh kartasi bosilmaydigan `div` edi, tugmaga aylantirildi.

---

## 3. Maktab chati (o'qituvchi ↔ talaba)

### Yangi modellar

- `SchoolChat` — bir juftlik uchun bitta chat
- `SchoolMessage` — xabarlar
- `NotificationType` enumiga `SCHOOL_MESSAGE`

### Nima uchun alohida jadval

Mavjud `Conversation`/`SupportMessage` **1:1** (foydalanuvchi ↔ admin):
`userId` unique, sender faqat `USER`/`ADMIN`. Maktabda esa ko'p-ko'pga
munosabat kerak. Eski modelni cho'zish support chatni ham beqaror qilardi.

### Nima uchun membershipId (userId emas)

Odam maktabdan chiqsa a'zoligi `ARCHIVED` bo'ladi, **yozishuv tarixi esa
o'sha maktabga tegishli qoladi**. `userId` ishlatilsa, odam boshqa maktabga
o'tganda eski chatlar yangi maktabda ko'rinib qolardi.

### Nima uchun ikkita migratsiya

PostgreSQL `ALTER TYPE ... ADD VALUE` ni **tranzaksiya blokida bajarmaydi**.
Prisma har bir faylni bitta tranzaksiyada ishlatadi, shuning uchun enum
o'zgarishi jadval yaratishdan ajratildi. Aks holda `migrate deploy` xato
berardi.

### Xavfsizlik modeli

| Kim | Kim bilan yozisha oladi |
|---|---|
| O'qituvchi | **faqat o'z guruhi** talabalari |
| Talaba | **faqat o'z guruhi** o'qituvchisi |
| Owner | maktabidagi har kim |
| CEO | **hech kim** (yozishuv shaxsiy) |

Guruhsiz a'zo hech kim bilan yozisha olmaydi. Har amal ikki qavatdan o'tadi:
route (`requireSchool`) + servis (`assertChatAccess`).

**23 ta test** bilan qoplangan.

### Nima uchun polling (socket emas)

Socket.io loyihada bor (duel uchun), lekin chatga ulash alohida ish: auth,
xona boshqaruvi, qayta ulanish. Birinchi versiyada 8 soniyalik polling
yetarli. Optimallashtirilgan: ekran ko'rinmasa so'rov yuborilmaydi.

---

## 4. Yo'l-yo'lakay tuzatilganlar

- **`membership.startedAt` → `joinedAt`** — noto'g'ri maydon nomi, talaba
  profilida "qo'shilgan sana" buzilardi
- **O'qituvchilar ro'yxatida N+1** — har biri uchun alohida `findUnique`
  yuborilardi, bitta so'rovga tushirildi
- **Talaba tabidagi "Mening guruhim"** — bosilmaydigan `div` edi, chat
  tugmasiga aylantirildi
- **`school.homework` i18n kaliti** — profil ekranida ishlatilgan, lekin
  uchala tilda ham yo'q edi

---

## Deploy'dan keyin tekshirish tartibi

1. Bot ochiladimi
2. **Owner → O'qituvchilar tabi** → guruh selektori ko'rinadimi
3. O'qituvchiga guruh tayinlang
4. O'qituvchi akkaunti bilan kiring → panel ochilishi kerak (tupik emas)
5. Talabani bosing → profil, statistika, oxirgi xatolar
6. "Xabar yozish" → chat
7. **Owner → Guruhlar tabi** → guruhni bosing → o'qituvchi paneli

Muammo bo'lsa: Render → Manual Deploy → oldingi commit.

---

## Keyingi tavsiyalar

1. **Chatda rate limiting yo'q** — spam himoyasi kerak bo'lishi mumkin
2. **Rasm yuborish yo'q** — support chatda bor, namuna qilsa bo'ladi
3. **Test vaqti** — "necha daqiqa ishlagani" uchun `Attempt` ga
   `durationSec` maydoni kerak (migratsiya)
4. **Frontend bundle 1.6 MB** — `manualChunks` bilan bo'lish kerak

---

## 5. Aurora temasi (pushti o'rniga)

Neumorphism + glassmorphism + minimalism uyg'unligi.

### Uchala uslub bir-biriga zid — qanday birlashtirildi

Neumorphism qattiq, mat sirtni talab qiladi. Glassmorphism shaffoflik va
blurni. Minimalism ikkalasining ham bezagini kamaytirishni.

Yechim — **qatlamlarga bo'lish**:

| Qatlam | Uslub |
|---|---|
| Fon (`--bg-app`) | neumorphic — yumshoq, deyarli rangsiz sirt |
| Karta (`--bg-card`) | glass — yarim shaffof + `backdrop-filter` |
| Soya (`--shadow-card`) | ikki tomonlama (yorug'lik + soya) |
| Kiritish maydonlari | neumorphic inset — "botgan" holat |

Minimalism ranglar sonida: butun palitra bitta sovuq kulrang-ko'k oilasidan.
Kontrast **shakl va soya** orqali beriladi, rang orqali emas.

### Nima uchun CSS'da, themes.js'da emas

`backdrop-filter` va ko'p qavatli soyalar — bular **xossa**, qiymat emas.
CSS o'zgaruvchisi orqali berib bo'lmaydi.

Ilovada `bg-card` klassi **118 ta joyda** ishlatiladi. Har biriga blur
qo'shish o'rniga `[data-theme="aurora"]` ostida bir marta berildi. Boshqa
temalarga umuman tegilmagan.

### Kontrast tekshirildi

Dastlabki ikkilamchi matn rangi (`#7C8499`) chiroyli edi, lekin **3.46:1** —
WCAG AA me'yoridan (4.5) past. Shisha qatlam yarim shaffof bo'lgani uchun
matn foni ochiqroq bo'ladi, shuning uchun quyuqroq rangga (`#646D80`,
**4.71:1**) o'tkazildi.

Fon ham `#E8EBF2` dan `#E3E7F0` ga quyuqlashtirildi — juda ochiq fonda
neumorphic soyalar ishlamaydi, kartalar "ko'tarilgan" ko'rinmaydi.

### Eski foydalanuvchilar

`pink` temasini tanlaganlarda localStorage'da hali `"pink"` saqlanib turibdi.
Migratsiyasiz ular jimgina `light` ga tushib qolardi — "temam yo'qoldi"
bo'lib ko'rinardi.

`THEME_MIGRATIONS` xaritasi qo'shildi: `pink` → `aurora`.

### Qo'shimcha

- `prefers-reduced-motion` hurmat qilinadi (blur kamayadi)
- Neumorphic "pressed" holati faqat tugmalarda — uslubning eng tanilgan
  detali shu yerda, qolgan joylarda bezak kamaytirildi
