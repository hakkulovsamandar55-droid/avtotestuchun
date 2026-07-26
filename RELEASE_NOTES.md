# AvtoTest — to'rtta tuzatish + narxlarni boshqarish

Repo'ning oxirgi commit'i (`89fcf1d`) ustiga qo'yiladi.

**Testlar:** 103 (regression 56, chat 23, savollar banki 24)
**Frontend build:** ✓
**i18n:** uchala tilda toza

---

## ⚠️ DEPLOY: uchta yangi migratsiya

```
20260724100000_homework_targeted     (maqsadli uy vazifasi)
20260725000000_saved_and_mistakes    (saqlangan savollar + xatolar)
20260725100000_premium_prices        (YANGI — narxlar jadvali)
```

Render'da `prisma migrate deploy` avtomatik ishlaydi. Neon uxlab qolsa
`P1002`: Neon SQL Editor'da `SELECT 1;` → Render'da Manual Deploy.

**Narxlar migratsiyasi hozirgi qiymatlarni seed qiladi** — deploy'dan keyin
ilova aynan avvalgidek ishlaydi, keyin admin panelidan o'zgartirasiz.

---

## 1. O'qituvchi chatda yoza olmasligi

### Ildiz sabab

`requireSchoolAccess` da:

```js
if (user.role === "ADMIN") {
  return { isCeo: true, membership: null };   // a'zolik UMUMAN izlanmaydi
}
```

Platforma egasi ayni paytda maktab a'zosi (Owner yoki o'qituvchi) bo'lsa
ham, `membership: null` qaytarilardi. Chat esa a'zolik talab qiladi —
natijada *"Siz bu maktabning a'zosi emassiz"* chiqardi.

### Yechim

ADMIN uchun ham a'zolik izlanadi. `isCeo` va `membership` bir vaqtda mavjud
bo'lishi mumkin: birinchisi **platforma** huquqini, ikkinchisi **maktab
ichidagi** rolni bildiradi — bular bir-birini almashtirmaydi.

---

## 2. Admin panelda xom i18n kalitlari

Screenshot'da `admin.tab.exam` va `admin.tab.schools` tarjima o'rniga xom
ko'rinardi.

### Sabab

`admin` blokida **ikkita `tab:` kaliti** bor edi:

```js
admin: {
  tab: { schools: "...", exam: "..." },      // <- bu YO'QOLADI
  title: "...",
  tab: { users: "...", premium: "...", ... }, // <- birinchisini bosib ketadi
}
```

JavaScript obyektida takroriy kalit oldingisini butunlay almashtiradi.
Birlashtiridim — endi 7 kalit bitta blokda.

---

## 3. Tungi rejimda matn qorayishi

Admin ekranlarida **26 joyda** faqat yorug' rejim uchun mo'ljallangan
Tailwind ranglari qattiq yozilgan edi:

| Eski | Yangi | Nima uchun |
|---|---|---|
| `bg-amber-50` | `bg-amber-500/15` | Qattiq och rang tungi fonda oq dog' bo'ladi |
| `text-red-600` | `text-red-400` | To'q matn quyuq fonda o'qilmaydi |
| `border-red-200` | `border-red-500/40` | Chegara ko'rinmay qoladi |

Shaffof (`/15`) variantlar ikki rejimda ham to'g'ri ishlaydi — fon rangi
ostidagi temadan o'tadi.

`bg-white dark:bg-[#161B2E]` ham bor edi — eski ikki-rejim yondashuvi.
Hozir 5 tema bo'lgani uchun `bg-card` ga almashtirildi.

---

## 4. Bildirishnomalar oynasi buzilgani

### Sabab

Ochiluvchi oynaning `sticky` sarlavhasi **shaffof shisha fonda** turardi:

```jsx
className="... sticky top-0 bg-card"   // bg-card = yarim shaffof + blur
```

Ostidan aylanuvchi ro'yxat ko'rinib, matnlar ustma-ust tushardi — aynan
screenshot'dagi holat.

### Yechim

Temalarga `--bg-solid` o'zgaruvchisi qo'shildi — ochiluvchi oyna va modal
uchun **qattiq fon**:

| Tema | `--bg-solid` |
|---|---|
| night | `#101725` |
| day | `#FBFCFE` |
| ink | `#151327` |
| dune | `#FDFAF5` |
| forest | `#0C1611` |

Shisha effekti faqat **sahifa ustida** ma'noli. Popover ichida u zarar
keltiradi: orqadagi kontent ko'rinib matnni buzadi. Boshqa modallar ham shu
tamoyilga o'tkazildi.

---

## 5. Narxlarni admin panelidan o'zgartirish

Kodda aniq reja yozilgan edi: *"Kelajakda admin panel orqali o'zgartirish
kerak bo'lsa, DB'da PremiumPlan jadvali yaratilib, bu qiymatlar boshlang'ich
(seed) sifatida ishlatiladi"* — shuni bajardim.

### Muhim taqsimot: nima kodda, nima DB'da

| Maydon | Joyi | Nima uchun |
|---|---|---|
| `key` | **kodda** | Bog'lanish nuqtasi, o'zgarmaydi |
| `durationDays` | **kodda** | Premium muddatini hisoblash shunga tayanadi |
| narx, nom, yorliq, xususiyatlar | **DB'da** | Admin xavfsiz o'zgartira oladi |

Agar `durationDays` ham DB'da bo'lsa, admin tasodifan uni o'zgartirib
premium muddatini buzishi mumkin edi.

### Eng muhim nuqta: to'lov tekshiruvi

To'lov chekini tekshirish (OCR) ham endi **DB narxidan** foydalanadi:

```js
async function planPrice(planKey) {
  const plan = await premiumPlanSvc.findPlanByKey(planKey);
  return plan?.price ?? null;
}
```

Aks holda: admin narxni oshiradi → foydalanuvchi **yangi** narxni to'laydi →
backend **eski** narx bo'yicha tekshirib *"summa mos emas"* deb rad etadi.
To'g'ri to'lagan odam pulini yo'qotardi.

### Validatsiya

- Narx `1 000` – `10 000 000` so'm. Yuqori chegara ham kerak: tasodifan
  qo'shimcha nol qo'yilsa (25 000 → 250 000) foydalanuvchi ulkan summa
  ko'rardi.
- Xususiyatlar `|` bilan saqlanadi, shuning uchun matn ichidagi `|` belgisi
  `/` ga almashtiriladi — aks holda saqlangan qiymat buzilardi.

### Zaxira

DB o'qilmasa yoki bo'sh bo'lsa, koddagi qiymatlar ishlatiladi. Narx sahifasi
hech qachon bo'sh qolmaydi.

Premium sahifasi ham serverdan narx oladi — o'zgarish darhol hammaga
ko'rinadi.

---

## Deploy'dan keyin tekshirish

1. Admin panel → tab nomlari to'g'ri ko'rinadimi (xom kalit yo'qmi)
2. Tungi rejimga o'ting → admin panelda oq dog'lar yo'qmi
3. Bildirishnomalar qo'ng'irog'i → sarlavha ustma-ust tushmayaptimi
4. Admin panel → Premium tariflar → narxni o'zgartirib saqlang
5. Premium sahifasini oching → yangi narx ko'rinadimi
6. Maktab → chat → o'qituvchi/owner yoza oladimi

Muammo bo'lsa: Render → Manual Deploy → oldingi commit.

---

## Ma'lum cheklovlar

1. **Belgi izohlari 115/258** — ogohlantiruvchi, imtiyoz, taqiqlovchi va
   buyuruvchi toifalar to'liq. Axborot-ko'rsatgich (71), servis (17),
   qo'shimcha (55) qolgan.
2. **275 belgi rasmi qo'lda tekshirilmagan** — 5.42/5.43 almashinuvi
   topilib tuzatildi, lekin boshqa joyda ham bo'lishi mumkin.
3. **Mavzu tasnifi evristika** — 3% savol "Umumiy qoidalar"ga tushadi.
4. **`backdrop-filter` qimmat** — real qurilmada sinash kerak.
5. **Frontend bundle ~1.65 MB** — hali bo'linmagan.
