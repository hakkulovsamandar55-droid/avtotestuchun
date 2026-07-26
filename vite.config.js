import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  build: {
    rollupOptions: {
      output: {
        // BUNDLE BO'LISH (code splitting)
        //
        // MUAMMO: hamma narsa bitta ~1.65 MB faylga yig'ilardi. Telegram
        // Mini App sekin internetda ochilganda foydalanuvchi butun faylni
        // kutishi kerak edi — hatto faqat bosh sahifani ko'rish uchun ham.
        //
        // YECHIM: kutubxonalarni alohida bo'laklarga ajratamiz. Ular kamdan-
        // kam o'zgaradi, shuning uchun brauzer keshida qoladi: ilova kodini
        // yangilaganingizda foydalanuvchi faqat kichik ilova bo'lagini qayta
        // yuklaydi, 500 KB kutubxonani emas.
        manualChunks(id) {
          // MA'LUMOT FAYLLARI — kutubxonalardan OLDIN tekshiriladi.
          //
          // Savollar bazasi 328 KB matn (1188 savol). Bosh sahifada u
          // KERAK EMAS — faqat test boshlanganda o'qiladi. Alohida bo'lakka
          // ajratsak, ilova birinchi ochilishida bu 328 KB yuklanmaydi.
          //
          // Belgilar ma'lumoti ham shunday: faqat "Yo'l belgilari" bo'limida
          // kerak.
          if (id.includes("shared/data/ticketsData")) return "data-questions";
          if (id.includes("shared/data/signsData") || id.includes("shared/data/signDescriptions")) {
            return "data-signs";
          }

          if (!id.includes("node_modules")) return;

          // React o'zagi — eng barqaror, alohida keshlanadi
          if (id.includes("react-dom") || id.includes("/react/") || id.includes("scheduler")) {
            return "react";
          }

          // Grafiklar (statistika ekranida) — og'ir va faqat shu yerda kerak
          if (id.includes("recharts") || id.includes("d3-")) {
            return "charts";
          }

          // Ikonkalar to'plami
          if (id.includes("lucide-react")) {
            return "icons";
          }

          // Tarjimalar
          if (id.includes("i18next")) {
            return "i18n";
          }

          // Socket.io (duel rejimi) — hamma foydalanuvchi ishlatmaydi
          if (id.includes("socket.io")) {
            return "socket";
          }

          // Qolgan kutubxonalar
          return "vendor";
        },
      },
    },

    // Chegara oshirildi: rasmlar bundle'da emas, alohida fayl sifatida
    // beriladi, shuning uchun JS bo'laklari uchun 700 KB real chegara.
    chunkSizeWarningLimit: 700,
  },
});
