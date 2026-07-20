// ⚠️ Bu fayl src/data/ticketsData.js ning nusxasi — backend duel rejimi uchun
// savollarni mustaqil generatsiya qilishi kerak. Frontendda ticketsData.js
// o'zgarsa, shu faylni ham qo'lda yangilang.

// Bilet testlari — savollar bazasi
// 1-bilet: qo'lda tayyorlangan haqiqiy YHQ uslubidagi demo savollar (2026-yil me'yorlariga mos)
// 2-60 biletlar: yo'l belgilari bazasidan avtomatik, biletga xos (seed asosida) generatsiya qilinadi

import { SIGNS } from "./signsData.js";

export const TOTAL_TICKETS = 60;
export const QUESTIONS_PER_TICKET = 20;
export const EXAM_TIME_SECONDS = 25 * 60; // 25 daqiqa — imtihon rejimidagi vaqt
export const EXAM_MAX_MISTAKES = 2; // shuncha xatodan keyin imtihon avtomatik tugaydi

// Savol shakli: { id, text, image?: sign kodi, options: [3 ta variant], correct: to'g'ri variant indeksi }

const TICKET_1_QUESTIONS = [
  {
    id: "t1-1",
    text: "Svetoforning sariq signali yonganda haydovchi qanday harakat qilishi kerak?",
    options: [
      "To'xtash chizig'i oldida to'xtashga tayyorlanishi kerak",
      "Tezlikni oshirib, chorrahani tezroq tark etishi kerak",
      "Signalga e'tibor bermay, harakatni davom ettirishi mumkin",
    ],
    correct: 0,
  },
  {
    id: "t1-2",
    text: "Aholi punktlarida (Toshkent, Nukus, viloyat va tuman markazlaridan tashqari) transport vositalarining ruxsat etilgan yuqori tezligi qancha?",
    options: ["50 km/soat", "70 km/soat", "90 km/soat"],
    correct: 1,
  },
  {
    id: "t1-3",
    text: "Ushbu belgi nimani anglatadi?",
    image: "3.1",
    options: [
      "Ushbu yo'nalishda barcha transport vositalarining kirishi taqiqlangan",
      "To'xtash va turish taqiqlangan",
      "Faqat yuk avtomobillari uchun kirish taqiqlangan",
    ],
    correct: 0,
  },
  {
    id: "t1-4",
    text: "\"Yo'l bering\" belgisi o'rnatilgan joyda haydovchi qanday harakat qilishi shart?",
    image: "2.4",
    options: [
      "Kesishayotgan yo'ldagi transport vositalariga to'xtamasdan o'zib ketishi mumkin",
      "Asosiy yo'ldan harakatlanayotgan transport vositalariga yo'l berishi shart",
      "Faqat piyodalarga yo'l berish yetarli",
    ],
    correct: 1,
  },
  {
    id: "t1-5",
    text: "Piyodalar o'tish joyida piyoda yo'lni kesib o'tayotganda haydovchi qanday harakat qilishi kerak?",
    options: [
      "Signal berib, o'zi birinchi o'tib ketishi kerak",
      "Piyodaga yo'l berib, to'xtashi kerak",
      "Faqat tungi vaqtda to'xtashi shart",
    ],
    correct: 1,
  },
  {
    id: "t1-6",
    text: "Turar joy zonalari va hovlilarda (ko'chaga chiqmasdan) ruxsat etilgan eng yuqori tezlik qancha?",
    options: ["20 km/soat", "40 km/soat", "60 km/soat"],
    correct: 0,
  },
  {
    id: "t1-7",
    text: "Ushbu belgi qaysi turdagi transport vositalarining harakatlanishini taqiqlaydi?",
    image: "3.4",
    options: [
      "Yengil avtomobillarning",
      "Yuk avtomobillarining",
      "Velosipedlarning",
    ],
    correct: 1,
  },
  {
    id: "t1-8",
    text: "Xavfsiz kamar (ремень) haydovchi va yo'lovchilar tomonidan qachon taqilishi shart?",
    options: [
      "Faqat shahardan tashqarida harakatlanganda",
      "Transport vositasi harakatlanayotgan har qanday vaqtda",
      "Faqat tungi vaqtda",
    ],
    correct: 1,
  },
  {
    id: "t1-9",
    text: "Ushbu belgi o'rnatilgan joyda transport vositasi qanday harakat qilishi shart?",
    image: "2.5",
    options: [
      "Chorrahadan oldin to'xtamasdan o'tib ketishi mumkin",
      "Belgi oldida albatta to'liq to'xtab, keyin harakatni davom ettirishi shart",
      "Faqat chapga burilishi mumkin",
    ],
    correct: 1,
  },
  {
    id: "t1-10",
    text: "Tungi vaqtda aholi punktidan tashqarida harakatlanayotganda uzoq yorug'lik chirog'i (dальний svet) qarama-qarshi transport ko'rinishi bilanoq nima qilinishi kerak?",
    options: [
      "Yaqin yorug'likka almashtirilishi kerak",
      "O'chirilmasdan davom ettirilishi mumkin",
      "Signal chirog'i bilan almashtirilishi kerak",
    ],
    correct: 0,
  },
  {
    id: "t1-11",
    text: "Ushbu belgi nimani bildiradi?",
    image: "1.21",
    options: [
      "Yaqin atrofda maktab yoki bolalar muassasasi bor, ehtiyot bo'lish kerak",
      "Velosipedchilar yo'lni kesib o'tadi",
      "Yo'l qurilish ishlari olib borilmoqda",
    ],
    correct: 0,
  },
  {
    id: "t1-12",
    text: "Aholi punktlaridan tashqarida yengil avtomobillar uchun ruxsat etilgan yuqori tezlik qancha?",
    options: ["80 km/soat", "100 km/soat", "120 km/soat"],
    correct: 1,
  },
  {
    id: "t1-13",
    text: "Boshqa transport vositasini o'zib ketish (obgon) taqiqlangan holatlardan biri qaysi?",
    options: [
      "To'g'ri, ochiq va yaxshi ko'rinadigan yo'l qismida",
      "Chorraha va piyodalar o'tish joyida",
      "Aholi punktidan tashqaridagi tekis yo'lda",
    ],
    correct: 1,
  },
  {
    id: "t1-14",
    text: "Ushbu belgi haydovchidan nimani talab qiladi?",
    image: "4.1.1",
    options: [
      "Faqat to'g'riga harakatlanish shart",
      "Har qanday yo'nalishda harakatlanish mumkin",
      "To'xtash va turish taqiqlangan",
    ],
    correct: 0,
  },
  {
    id: "t1-15",
    text: "Alkogol yoki uni mast qiluvchi moddalar ta'sirida transport vositasini boshqarish qanday oqibatga olib keladi?",
    options: [
      "Faqat ogohlantirish beriladi",
      "Qattiq jarima va haydovchilik guvohnomasidan mahrum etilishga olib keladi",
      "Hech qanday javobgarlik nazarda tutilmagan",
    ],
    correct: 1,
  },
  {
    id: "t1-16",
    text: "Tirbandlikda to'xtab qolgan transport vositalari orasida \"tez yordam\", yong'in va politsiya avtomobillari uchun maxsus signal yoqilganda haydovchi nima qilishi shart?",
    options: [
      "E'tibor bermasdan o'z yo'lida davom etishi mumkin",
      "Ularga yo'l berib, to'xtashi yoki chetlanishi shart",
      "Faqat signal ovozi baland bo'lsa yo'l berish kerak",
    ],
    correct: 1,
  },
  {
    id: "t1-17",
    text: "Ushbu belgi qanday yo'l qismi haqida ogohlantiradi?",
    image: "1.23",
    options: [
      "Ta'mirlash (yo'l qurilish) ishlari olib borilayotgan yo'l qismi",
      "Temir yo'l kesishmasi yaqinlashmoqda",
      "Yo'l torayadi",
    ],
    correct: 0,
  },
  {
    id: "t1-18",
    text: "Bolalar guruhini tashkiliy tarzda tashiyotgan transport vositasi uchun ruxsat etilgan yuqori tezlik qancha?",
    options: ["40 km/soat", "60 km/soat", "80 km/soat"],
    correct: 1,
  },
  {
    id: "t1-19",
    text: "Transport vositasini avariya to'xtash belgisisiz to'xtatishga majbur bo'lgan haydovchi nima qilishi kerak?",
    options: [
      "Boshqa harakatlanuvchilarni ogohlantirishga hojat yo'q",
      "Avariya yorug'lik signalizatsiyasini yoqishi va avariya to'xtash belgisini qo'yishi shart",
      "Faqat kunduzgi vaqtda choralar ko'rishi kifoya",
    ],
    correct: 1,
  },
  {
    id: "t1-20",
    text: "Ushbu belgi qanday ma'noni anglatadi?",
    image: "2.1",
    options: [
      "Bu — ikkinchi darajali yo'l ekanini bildiradi",
      "Bu — asosiy yo'l ekanini va shu yo'ldan harakatlanuvchilar ustunlikka ega ekanini bildiradi",
      "Bu yo'l faqat piyodalar uchun ekanligini bildiradi",
    ],
    correct: 1,
  },
];

// Umumiy qoidalar savollari — 2-60 biletlar uchun aralashtirilib ishlatiladi
const GENERIC_POOL = [
  {
    text: "Chorrahada svetofor ishlamayotgan bo'lsa, haydovchi nimaga amal qilishi kerak?",
    options: [
      "Ustunlik (imtiyoz) belgilariga va umumiy qoidalarga",
      "Faqat o'z tajribasiga",
      "Chorrahani tezroq tark etishga harakat qilishi kerak",
    ],
    correct: 0,
  },
  {
    text: "Yo'l harakatida piyodalar uchun asosiy talab qanday?",
    options: [
      "Yo'lni istalgan joydan kesib o'tishi mumkin",
      "Yo'lni faqat piyodalar o'tish joyidan yoki chorraha burchagidan kesib o'tishi kerak",
      "Faqat yashil chiroqda emas, xohlagan vaqtda o'tishi mumkin",
    ],
    correct: 1,
  },
  {
    text: "Mobil telefondan qo'lda ushlab gaplashish transport vositasini boshqarish paytida ruxsat etiladimi?",
    options: [
      "Ha, istalgan vaqtda mumkin",
      "Yo'q, faqat qo'l band qilmaydigan (handsfree) qurilmalar orqali ruxsat etiladi",
      "Faqat shahar ichida mumkin",
    ],
    correct: 1,
  },
  {
    text: "Tirkama bilan harakatlanayotgan yengil avtomobil uchun aholi punktidan tashqarida ruxsat etilgan yuqori tezlik qancha?",
    options: ["70 km/soat", "90 km/soat", "110 km/soat"],
    correct: 0,
  },
  {
    text: "Transport vositasi yo'lning bir necha qatoridan iborat qismida qator almashtirmoqchi bo'lsa, avval nima qilishi kerak?",
    options: [
      "Ko'rsatkich (signal) yoqib, boshqa transport vositalariga xalaqit bermasligiga ishonch hosil qilishi kerak",
      "Signal bermasdan darhol qator almashtirishi mumkin",
      "Faqat tormoz chirog'ini yoqishi kifoya",
    ],
    correct: 0,
  },
  {
    text: "Temir yo'l kesishmasidan o'tishdan oldin haydovchi nimaga amal qiladi?",
    options: [
      "Faqat o'z ko'zi bilan poyezd yo'qligiga ishonch hosil qiladi, boshqa hech narsaga qaramaydi",
      "Svetofor, shlagbaum va ogohlantiruvchi signallarga qat'iy rioya qiladi",
      "Poyezd tovushi eshitilmasa, tezlikni oshirib o'tadi",
    ],
    correct: 1,
  },
  {
    text: "Ushbu belgi haydovchini nimadan ogohlantiradi?",
    signCode: "1.22",
    options: [
      "Oldinda velosiped yo'lkasi bilan kesishuv borligidan",
      "Oldinda maktab borligidan",
      "Yo'l torayishidan",
    ],
    correct: 0,
  },
  {
    text: "Ushbu belgi qanday harakatni bildiradi?",
    signCode: "4.1.2",
    options: [
      "Faqat chapga burilish shart",
      "Faqat o'ngga burilish shart",
      "Faqat orqaga qaytish shart",
    ],
    correct: 1,
  },
  {
    text: "Ushbu belgi nimani anglatadi?",
    signCode: "3.2",
    options: [
      "Barcha transport vositalarining harakatlanishi taqiqlangan",
      "Faqat piyodalarga taqiqlangan",
      "Faqat mototsikllarga taqiqlangan",
    ],
    correct: 0,
  },
  {
    text: "Avtomagistralda piyodalar, velosipedchilar va yengil moped/mototsikllarning harakatlanishi qanday?",
    options: [
      "To'liq ruxsat etilgan",
      "Taqiqlangan",
      "Faqat kunduzi ruxsat etilgan",
    ],
    correct: 1,
  },
  {
    text: "Yo'l-transport hodisasi sodir bo'lganda haydovchining birinchi majburiyati nima?",
    options: [
      "Darhol voqea joyini tark etishi",
      "Transport vositasini to'xtatib, avariya signalizatsiyasini yoqishi va joyni o'zgartirmasligi",
      "Faqat guvohlarni izlashi",
    ],
    correct: 1,
  },
  {
    text: "Piyodalar o'tish joyiga yaqinlashayotganda, agar u yerda piyoda ko'rinmasa ham, haydovchi qanday harakat qilishi tavsiya etiladi?",
    options: [
      "Tezlikni oshirib tezroq o'tib ketishi",
      "Tezlikni pasaytirib, ehtiyotkorlik bilan harakatlanishi",
      "Signal berib to'xtamasdan o'tishi",
    ],
    correct: 1,
  },
];

// Oddiy, tez va deterministik pseudo-random generator (bilet raqamiga bog'liq — har doim bir xil natija beradi)
function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function next() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function shuffleWithSeed(array, rand) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildSignQuestion(sign, allNames, rand) {
  const distractors = shuffleWithSeed(
    allNames.filter((n) => n !== sign.name),
    rand
  ).slice(0, 2);
  const options = shuffleWithSeed([sign.name, ...distractors], rand);
  return {
    id: `sign-${sign.code}`,
    text: "Ushbu belgi nimani anglatadi?",
    image: sign.code,
    options,
    correct: options.indexOf(sign.name),
  };
}

function buildGenericQuestion(item, idx) {
  const q = {
    id: `generic-${idx}-${item.text.slice(0, 10)}`,
    text: item.text,
    options: item.options,
    correct: item.correct,
  };
  if (item.signCode) q.image = item.signCode;
  return q;
}

// Bilet uchun 20 ta savolni qaytaradi. 1-bilet — qo'lda tayyorlangan.
// Qolgan biletlar — yo'l belgilari bazasi + umumiy qoidalar savollaridan biletga xos tarzda generatsiya qilinadi.
export function getTicketQuestions(ticketNumber) {
  if (ticketNumber === 1) return TICKET_1_QUESTIONS;

  const rand = seededRandom(ticketNumber * 7919);
  const allNames = SIGNS.map((s) => s.name);
  const shuffledSigns = shuffleWithSeed(SIGNS, rand);
  const shuffledGeneric = shuffleWithSeed(GENERIC_POOL, rand);

  const signCount = 13;
  const genericCount = QUESTIONS_PER_TICKET - signCount;

  const signQuestions = shuffledSigns
    .slice(0, signCount)
    .map((sign) => buildSignQuestion(sign, allNames, rand));

  const genericQuestions = shuffledGeneric
    .slice(0, genericCount)
    .map((item, idx) => buildGenericQuestion(item, idx));

  return shuffleWithSeed([...signQuestions, ...genericQuestions], rand);
}

// Imtihon rejimi uchun — har chaqirilganda TASODIFIY 20 ta savol (barcha biletlar bazasidan aralashtirilib)
export function getRandomExamQuestions() {
  const rand = Math.random;
  const allNames = SIGNS.map((s) => s.name);
  const shuffledSigns = shuffleWithSeed(SIGNS, rand);
  const shuffledGeneric = shuffleWithSeed(GENERIC_POOL, rand);

  const signCount = 13;
  const genericCount = QUESTIONS_PER_TICKET - signCount;

  const signQuestions = shuffledSigns
    .slice(0, signCount)
    .map((sign) => buildSignQuestion(sign, allNames, rand));

  const genericQuestions = shuffledGeneric
    .slice(0, genericCount)
    .map((item, idx) => buildGenericQuestion(item, idx));

  return shuffleWithSeed([...signQuestions, ...genericQuestions], rand);
}
