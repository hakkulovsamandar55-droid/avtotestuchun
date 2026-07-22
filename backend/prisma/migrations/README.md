# Migratsiyalar haqida muhim eslatma

## Holat

Bu loyiha ilgari `prisma db push` bilan ishlagan, ya'ni **migratsiya fayllari
saqlanmagan**. `20260722000000_official_exam` — birinchi haqiqiy migratsiya.

Shu sababli production bazasida allaqachon mavjud jadvallar (users, attempts,
payment_requests va h.k.) uchun "baseline" belgilash kerak, aks holda
`prisma migrate deploy` ularni yaratishga urinib xato beradi.

## Birinchi marta (faqat BIR MARTA bajariladi)

### Agar bazada ma'lumot BOR bo'lsa (production)

1. Avval **zaxira nusxa** oling:

   ```bash
   pg_dump $DATABASE_URL > backup-$(date +%F).sql
   ```

2. Mavjud sxema uchun baseline migratsiya yarating:

   ```bash
   mkdir -p prisma/migrations/00000000000000_baseline
   npx prisma migrate diff \
     --from-empty \
     --to-schema-datamodel prisma/schema.prisma \
     --script > prisma/migrations/00000000000000_baseline/migration.sql
   ```

   > DIQQAT: hosil bo'lgan faylda `exam_attempts`, `exam_events` va
   > `show_on_leaderboard` ham bo'ladi (chunki ular schema.prisma da bor).
   > Ularni baseline fayldan **qo'lda o'chiring** — ular keyingi
   > migratsiyada (`20260722000000_official_exam`) qo'llanadi.

3. Baseline'ni "allaqachon qo'llangan" deb belgilang:

   ```bash
   npx prisma migrate resolve --applied 00000000000000_baseline
   ```

4. Endi rasmiy imtihon migratsiyasini qo'llang:

   ```bash
   npx prisma migrate deploy
   ```

### Agar baza BO'SH bo'lsa (yangi o'rnatish)

Yuqoridagi qadamlar kerak emas:

```bash
npx prisma migrate deploy
```

## Bundan keyin

Sxemani o'zgartirganda:

```bash
npx prisma migrate dev --name nima-ozgardi
```

Hosil bo'lgan faylni git'ga qo'shing. Production'da `migrate deploy` shuni
qo'llaydi. `db push` ni **production'da hech qachon ishlatmang** — u ustunlarni
ogohlantirmasdan o'chirib yuborishi mumkin.
