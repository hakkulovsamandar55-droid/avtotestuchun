// ============================================================================
// SHPARGALKA (YHQ FAKTLAR) — manba ma'lumotlari
//
// Foydalanuvchi yuklagan "YHQ shpargalka" hujjati asosida tuzilgan. Har bir
// fakt 3 tilda (uz_latn, uz_cyrl, ru) to'liq tarjima qilingan (2026-07-27).
// uz_cyrl — uz_latn'dan avtomatik transliteratsiya (lotin-kirill kutubxonasi),
// ru — qo'lda, rasmiy atamalarga mos tarjima qilingan (BHM -> BRV va h.k.).
//
// MUHIM: bu ma'lumotlar RASMIY EMAS. Har bir kategoriya/umumiy matnda buni
// eslatuvchi ogohlantirish bor — CheatSheetScreen buni har doim ko'rsatishi kerak.
// ============================================================================

export const CHEAT_SHEET_META = {
  disclaimer: { uz_latn: "Bu ma'lumotlar rasmiy emas — ochiq manbalar asosida tuzilgan qisqacha eslatma. Imtihon yoki nizoli holat uchun albatta lex.uz dagi asl matnni tekshiring.", uz_cyrl: "Бу маълумотлар расмий эмас — очиқ манбалар асосида тузилган қисқача эслатма. Имтиҳон ёки низоли ҳолат учун албатта lex.uz даги асл матнни текширинг.", ru: "Данные являются неофициальными — краткая памятка, составленная на основе открытых источников. Для экзамена или спорной ситуации обязательно сверяйтесь с оригинальным текстом на lex.uz." },
  sourcesNote: { uz_latn: "Manbalar: uzpdd.uz, osonprava.uz, amaliyhayot.uz, auto.ustabor.uz, brb.uz/gov.uz/spot.uz (BHM va MHTEKM rasmiy e'lonlari).", uz_cyrl: "Манбалар: uzpdd.uz, osonprava.uz, amaliyhayot.uz, auto.ustabor.uz, brb.uz/gov.uz/spot.uz (БҲМ ва МҲТЕКМ расмий эълонлари).", ru: "Источники: uzpdd.uz, osonprava.uz, amaliyhayot.uz, auto.ustabor.uz, brb.uz/gov.uz/spot.uz (официальные объявления о БРВ)." },
};

export const CHEAT_SHEET_CATEGORIES = [
  {
    key: "stopping",
    icon: "Timer",
    title: { uz_latn: "To'xtash yo'li", uz_cyrl: "Тўхташ йўли", ru: "Тормозной путь" },
    note: { uz_latn: "To'xtash yo'li = reaksiya masofasi + tormozlanish masofasi. Ho'l yo'lda tormozlanish masofasi taxminan 2 baravar oshadi.", uz_cyrl: "Тўхташ йўли = реаксия масофаси + тормозланиш масофаси. Ҳўл йўлда тормозланиш масофаси тахминан 2 баравар ошади.", ru: "Тормозной путь = расстояние реакции + расстояние торможения. На мокрой дороге расстояние торможения увеличивается примерно в 2 раза." },
    facts: [
      { id: "stop-1", label: { uz_latn: "72 km/soatda, 1 soniyada bosib o'tiladigan masofa", uz_cyrl: "72 км/соатда, 1 сонияда босиб ўтиладиган масофа", ru: "Расстояние, проходимое за 1 секунду при 72 км/ч" }, value: { uz_latn: "20 m", uz_cyrl: "20 м", ru: "20 м" } },
      { id: "stop-2", label: { uz_latn: "Haydovchining reaksiya vaqti (o'rtacha)", uz_cyrl: "Ҳайдовчининг реаксия вақти (ўртача)", ru: "Среднее время реакции водителя" }, value: { uz_latn: "1 soniya", uz_cyrl: "1 сония", ru: "1 секунда" } },
      { id: "stop-3", label: { uz_latn: "Tunda ko'rish masofasi (yaqin farlar)", uz_cyrl: "Тунда кўриш масофаси (яқин фарлар)", ru: "Дальность видимости ночью (ближний свет)" }, value: { uz_latn: "~50 m", uz_cyrl: "~50 м", ru: "~50 м" } },
      { id: "stop-4", label: { uz_latn: "Tunda ko'rish masofasi (uzoq farlar)", uz_cyrl: "Тунда кўриш масофаси (узоқ фарлар)", ru: "Дальность видимости ночью (дальний свет)" }, value: { uz_latn: "~100 m", uz_cyrl: "~100 м", ru: "~100 м" } },
    ],
  },
  {
    key: "tread",
    icon: "CircleDot",
    title: { uz_latn: "Shina protektori chuqurligi", uz_cyrl: "Шина протектори чуқурлиги", ru: "Глубина рисунка протектора шин" },
    note: { uz_latn: "Minimal ruxsat etilgan chuqurlik — toifaga qarab farq qiladi.", uz_cyrl: "Минимал рухсат этилган чуқурлик — тоифага қараб фарқ қилади.", ru: "Минимально допустимая глубина — зависит от категории транспортного средства." },
    facts: [
      { id: "tread-1", label: { uz_latn: "Mototsikl (L toifasi)", uz_cyrl: "Мототсикл (Л тоифаси)", ru: "Мотоцикл (категория L)" }, value: { uz_latn: "0.8 mm", uz_cyrl: "0.8 мм", ru: "0,8 мм" } },
      { id: "tread-2", label: { uz_latn: "N2 / N3 / O3 / O4 (yuk mashina, tirkama)", uz_cyrl: "Н2 / Н3 / О3 / О4 (юк машина, тиркама)", ru: "N2 / N3 / O3 / O4 (грузовые, прицепы)" }, value: { uz_latn: "1 mm", uz_cyrl: "1 мм", ru: "1 мм" } },
      { id: "tread-3", label: { uz_latn: "M1 / N1 / O1 / O2 (yengil avto)", uz_cyrl: "М1 / Н1 / О1 / О2 (енгил авто)", ru: "M1 / N1 / O1 / O2 (легковые автомобили)" }, value: { uz_latn: "1.6 mm", uz_cyrl: "1.6 мм", ru: "1,6 мм" } },
    ],
  },
  {
    key: "steering",
    icon: "CircleGauge",
    title: { uz_latn: "Rul lyufti va tormoz", uz_cyrl: "Рул люфти ва тормоз", ru: "Люфт руля и тормоза" },
    facts: [
      { id: "steer-1", label: { uz_latn: "Rul lyufti — M1 (yengil avto)", uz_cyrl: "Рул люфти — М1 (енгил авто)", ru: "Люфт рулевого управления — M1 (легковой)" }, value: { uz_latn: "10°", uz_cyrl: "10°", ru: "10°" } },
      { id: "steer-2", label: { uz_latn: "Rul lyufti — M2 / M3 / N1", uz_cyrl: "Рул люфти — М2 / М3 / Н1", ru: "Люфт рулевого управления — M2 / M3 / N1" }, value: { uz_latn: "20°", uz_cyrl: "20°", ru: "20°" } },
      { id: "steer-3", label: { uz_latn: "Rul lyufti — N2 / N3", uz_cyrl: "Рул люфти — Н2 / Н3", ru: "Люфт рулевого управления — N2 / N3" }, value: { uz_latn: "25°", uz_cyrl: "25°", ru: "25°" } },
      { id: "steer-4", label: { uz_latn: "To'la jihozlangan tormoz tizimi (T/v)", uz_cyrl: "Тўла жиҳозланган тормоз тизими (Т/в)", ru: "Полностью оснащённая тормозная система" }, value: { uz_latn: "16°", uz_cyrl: "16°", ru: "16°" } },
      { id: "steer-5", label: { uz_latn: "Pnevmatik tizim (tormoz) zichligi", uz_cyrl: "Пневматик тизим (тормоз) зичлиги", ru: "Герметичность пневматической тормозной системы" }, value: { uz_latn: "0.05 MPa", uz_cyrl: "0.05 МПа", ru: "0,05 МПа" } },
    ],
  },
  {
    key: "speed",
    icon: "Gauge",
    title: { uz_latn: "Tezlik chegaralari", uz_cyrl: "Тезлик чегаралари", ru: "Ограничения скорости" },
    note: { uz_latn: "Radar/kameralarning texnik xatoligi tufayli qayd etilgan tezlikdan odatda 5 km/soat ayiriladi — bu qonuniy \"qo'shimcha tezlik\" emas, faqat o'lchov aniqligi uchun.", uz_cyrl: "Радар/камераларнинг техник хатолиги туфайли қайд этилган тезликдан одатда 5 км/соат айирилади — бу қонуний \"қўшимча тезлик\" эмас, фақат ўлчов аниқлиги учун.", ru: "Из-за технической погрешности радаров/камер от зафиксированной скорости обычно вычитают 5 км/ч — это не «допустимое превышение» по закону, а лишь поправка на точность измерения." },
    facts: [
      { id: "speed-1", label: { uz_latn: "Aholi punktida (umumiy)", uz_cyrl: "Аҳоли пунктида (умумий)", ru: "В населённом пункте (общее)" }, value: { uz_latn: "70 km/soat", uz_cyrl: "70 км/соат", ru: "70 км/ч" } },
      { id: "speed-2", label: { uz_latn: "Toshkent shahri ichida", uz_cyrl: "Тошкент шаҳри ичида", ru: "В черте города Ташкента" }, value: { uz_latn: "60 km/soat", uz_cyrl: "60 км/соат", ru: "60 км/ч" } },
      { id: "speed-3", label: { uz_latn: "Turar joy (hovli) zonalarida", uz_cyrl: "Турар жой (ҳовли) зоналарида", ru: "В жилых зонах (дворах)" }, value: { uz_latn: "20 km/soat", uz_cyrl: "20 км/соат", ru: "20 км/ч" } },
      { id: "speed-4", label: { uz_latn: "Yengil avto (aholi punktidan tashqarida)", uz_cyrl: "Енгил авто (аҳоли пунктидан ташқарида)", ru: "Легковой автомобиль (вне населённого пункта)" }, value: { uz_latn: "100 km/soat", uz_cyrl: "100 км/соат", ru: "100 км/ч" } },
      { id: "speed-5", label: { uz_latn: "3.5 t gacha yuk avto (tashqarida)", uz_cyrl: "3.5 т гача юк авто (ташқарида)", ru: "Грузовой до 3,5 т (вне населённого пункта)" }, value: { uz_latn: "100 km/soat", uz_cyrl: "100 км/соат", ru: "100 км/ч" } },
      { id: "speed-6", label: { uz_latn: "Avtobus, mikroavtobus (tashqarida)", uz_cyrl: "Автобус, микроавтобус (ташқарида)", ru: "Автобус, микроавтобус (вне населённого пункта)" }, value: { uz_latn: "90 km/soat", uz_cyrl: "90 км/соат", ru: "90 км/ч" } },
      { id: "speed-7", label: { uz_latn: "Avtomagistralda (yengil avto)", uz_cyrl: "Автомагистралда (енгил авто)", ru: "На автомагистрали (легковой автомобиль)" }, value: { uz_latn: "100 km/soat", uz_cyrl: "100 км/соат", ru: "100 км/ч" } },
      { id: "speed-8", label: { uz_latn: "Mototsikl (aholi punktidan tashqarida)", uz_cyrl: "Мототсикл (аҳоли пунктидан ташқарида)", ru: "Мотоцикл (вне населённого пункта)" }, value: { uz_latn: "90 km/soat", uz_cyrl: "90 км/соат", ru: "90 км/ч" } },
      { id: "speed-9", label: { uz_latn: "Maktab, bolalar muassasasi yaqinida (tavsiya)", uz_cyrl: "Мактаб, болалар муассасаси яқинида (тавсия)", ru: "Рядом со школой, детским учреждением (реком.)" }, value: { uz_latn: "20 km/soat", uz_cyrl: "20 км/соат", ru: "20 км/ч" } },
    ],
  },
  {
    key: "licenseCategories",
    icon: "CreditCard",
    title: { uz_latn: "Haydovchilik guvohnomasi toifalari", uz_cyrl: "Ҳайдовчилик гувоҳномаси тоифалари", ru: "Категории водительского удостоверения" },
    facts: [
      { id: "lic-1", label: { uz_latn: "\"A\" toifasi", uz_cyrl: "\"А\" тоифаси", ru: "Категория «A»" }, value: { uz_latn: "Mototsikllar", uz_cyrl: "Мототсикллар", ru: "Мотоциклы" } },
      { id: "lic-2", label: { uz_latn: "\"A1\" toifasi", uz_cyrl: "\"А1\" тоифаси", ru: "Категория «A1»" }, value: { uz_latn: "Yengil mototsikllar (125 sm³ gacha)", uz_cyrl: "Енгил мототсикллар (125 см³ гача)", ru: "Лёгкие мотоциклы (до 125 см³)" } },
      { id: "lic-3", label: { uz_latn: "\"B\" toifasi", uz_cyrl: "\"Б\" тоифаси", ru: "Категория «B»" }, value: { uz_latn: "Yengil avto (3.5 t gacha, 8 o'rin)", uz_cyrl: "Енгил авто (3.5 т гача, 8 ўрин)", ru: "Легковой автомобиль (до 3,5 т, 8 мест)" } },
      { id: "lic-4", label: { uz_latn: "\"BE\" toifasi", uz_cyrl: "\"БЕ\" тоифаси", ru: "Категория «BE»" }, value: { uz_latn: "Tirkamali yengil avto (750 kg+)", uz_cyrl: "Тиркамали енгил авто (750 кг+)", ru: "Легковой автомобиль с прицепом (750 кг+)" } },
      { id: "lic-5", label: { uz_latn: "\"C\" toifasi", uz_cyrl: "\"C\" тоифаси", ru: "Категория «C»" }, value: { uz_latn: "Yuk avto (3.5 t dan yuqori)", uz_cyrl: "Юк авто (3.5 т дан юқори)", ru: "Грузовой автомобиль (свыше 3,5 т)" } },
      { id: "lic-6", label: { uz_latn: "\"D\" toifasi", uz_cyrl: "\"Д\" тоифаси", ru: "Категория «D»" }, value: { uz_latn: "Avtobus (8 o'rindan ko'p)", uz_cyrl: "Автобус (8 ўриндан кўп)", ru: "Автобус (более 8 мест)" } },
      { id: "lic-7", label: { uz_latn: "Minimal yosh — \"B\" toifa", uz_cyrl: "Минимал ёш — \"Б\" тоифа", ru: "Минимальный возраст — категория «B»" }, value: { uz_latn: "18 yosh", uz_cyrl: "18 ёш", ru: "18 лет" } },
      { id: "lic-8", label: { uz_latn: "Minimal yosh — \"A\" toifa", uz_cyrl: "Минимал ёш — \"А\" тоифа", ru: "Минимальный возраст — категория «A»" }, value: { uz_latn: "16 yosh", uz_cyrl: "16 ёш", ru: "16 лет" } },
    ],
  },
  {
    key: "inspection",
    icon: "Wrench",
    title: { uz_latn: "Texnik ko'rik davriyligi", uz_cyrl: "Техник кўрик даврийлиги", ru: "Периодичность техосмотра" },
    facts: [
      { id: "insp-1", label: { uz_latn: "Avtomobil (5 yilgacha)", uz_cyrl: "Автомобил (5 йилгача)", ru: "Автомобиль (до 5 лет)" }, value: { uz_latn: "Har 2 yilda", uz_cyrl: "Ҳар 2 йилда", ru: "Раз в 2 года" } },
      { id: "insp-2", label: { uz_latn: "Avtomobil (10–15 yil)", uz_cyrl: "Автомобил (10–15 йил)", ru: "Автомобиль (10–15 лет)" }, value: { uz_latn: "Har 2 yilda", uz_cyrl: "Ҳар 2 йилда", ru: "Раз в 2 года" } },
      { id: "insp-3", label: { uz_latn: "Avtomobil (15+ yil)", uz_cyrl: "Автомобил (15+ йил)", ru: "Автомобиль (15+ лет)" }, value: { uz_latn: "Har yili", uz_cyrl: "Ҳар йили", ru: "Ежегодно" } },
      { id: "insp-4", label: { uz_latn: "Yo'lovchi transporti (taksi, avtobus)", uz_cyrl: "Йўловчи транспорти (такси, автобус)", ru: "Пассажирский транспорт (такси, автобус)" }, value: { uz_latn: "Har yili", uz_cyrl: "Ҳар йили", ru: "Ежегодно" } },
    ],
  },
  {
    key: "firstAid",
    icon: "HeartPulse",
    title: { uz_latn: "Birinchi yordam", uz_cyrl: "Биринчи ёрдам", ru: "Первая помощь" },
    facts: [
      { id: "aid-1", label: { uz_latn: "Nafas to'xtaganda", uz_cyrl: "Нафас тўхтаганда", ru: "При остановке дыхания" }, value: { uz_latn: "Sun'iy nafas + yurak uqalash", uz_cyrl: "Сунъий нафас + юрак уқалаш", ru: "Искусственное дыхание + массаж сердца" } },
      { id: "aid-2", label: { uz_latn: "Yurak uqalash nisbati (1 yordamchi)", uz_cyrl: "Юрак уқалаш нисбати (1 ёрдамчи)", ru: "Соотношение (1 спасатель)" }, value: { uz_latn: "30 bosish : 2 nafas", uz_cyrl: "30 босиш : 2 нафас", ru: "30 нажатий : 2 вдоха" } },
      { id: "aid-3", label: { uz_latn: "Ko'krak qafasini bosish chastotasi", uz_cyrl: "Кўкрак қафасини босиш частотаси", ru: "Частота нажатий на грудную клетку" }, value: { uz_latn: "100–120 / daqiqa", uz_cyrl: "100–120 / дақиқа", ru: "100–120 в минуту" } },
      { id: "aid-4", label: { uz_latn: "Ko'krak qafasini bosish chuqurligi", uz_cyrl: "Кўкрак қафасини босиш чуқурлиги", ru: "Глубина нажатий на грудную клетку" }, value: { uz_latn: "5–6 sm", uz_cyrl: "5–6 см", ru: "5–6 см" } },
      { id: "aid-5", label: { uz_latn: "Jgut qo'yish muddati (yozda)", uz_cyrl: "Жгут қўйиш муддати (ёзда)", ru: "Время наложения жгута (летом)" }, value: { uz_latn: "maks. 1 soat", uz_cyrl: "макс. 1 соат", ru: "макс. 1 час" } },
      { id: "aid-6", label: { uz_latn: "Jgut qo'yish muddati (qishda)", uz_cyrl: "Жгут қўйиш муддати (қишда)", ru: "Время наложения жгута (зимой)" }, value: { uz_latn: "maks. 30 daqiqa", uz_cyrl: "макс. 30 дақиқа", ru: "макс. 30 минут" } },
    ],
  },
  {
    key: "fines",
    icon: "Banknote",
    title: { uz_latn: "Jarimalar", uz_cyrl: "Жарималар", ru: "Штрафы" },
    note: { uz_latn: "1 BHM = 412 000 so'm (2026-yil 1-iyul holatiga). Prezident farmoniga ko'ra, 2026-yil 1-sentabrdan BHM 6.8% ga oshib, 440 000 so'mga yetadi. Jarima 15 kun ichida to'lansa — 50% chegirma; 16–30 kun oralig'ida — 30% chegirma (og'ir qoidabuzarliklar bundan mustasno).", uz_cyrl: "1 БҲМ = 412 000 сўм (2026-йил 1-июл ҳолатига). Президент фармонига кўра, 2026-йил 1-сентабрдан БҲМ 6.8% га ошиб, 440 000 сўмга етади. Жарима 15 кун ичида тўланса — 50% чегирма; 16–30 кун оралиғида — 30% чегирма (оғир қоидабузарликлар бундан мустасно).", ru: "1 БРВ = 412 000 сум (по состоянию на 1 июля 2026 года). Согласно указу Президента, с 1 сентября 2026 года БРВ увеличится на 6,8% и составит 440 000 сум. При оплате штрафа в течение 15 дней — скидка 50%; в течение 16–30 дней — скидка 30% (кроме тяжёлых нарушений)." },
    facts: [
      { id: "fine-1", label: { uz_latn: "Xavfsizlik kamarini taqmaslik", uz_cyrl: "Хавфсизлик камарини тақмаслик", ru: "Непристёгнутый ремень безопасности" }, value: { uz_latn: "0.5 BHM", uz_cyrl: "0.5 БҲМ", ru: "0,5 БРВ" } },
      { id: "fine-2", label: { uz_latn: "Qizil chiroqda o'tish", uz_cyrl: "Қизил чироқда ўтиш", ru: "Проезд на красный сигнал светофора" }, value: { uz_latn: "3 BHM", uz_cyrl: "3 БҲМ", ru: "3 БРВ" } },
      { id: "fine-3", label: { uz_latn: "Piyodalar o'tish joyida yo'l bermaslik", uz_cyrl: "Пиёдалар ўтиш жойида йўл бермаслик", ru: "Непредоставление преимущества пешеходам" }, value: { uz_latn: "0.5 BHM", uz_cyrl: "0.5 БҲМ", ru: "0,5 БРВ" } },
      { id: "fine-4", label: { uz_latn: "Tezlikni 20 km/soatgacha oshirish", uz_cyrl: "Тезликни 20 км/соатгача ошириш", ru: "Превышение скорости до 20 км/ч" }, value: { uz_latn: "1 BHM", uz_cyrl: "1 БҲМ", ru: "1 БРВ" } },
      { id: "fine-5", label: { uz_latn: "Tezlikni 20–40 km/soat oshirish", uz_cyrl: "Тезликни 20–40 км/соат ошириш", ru: "Превышение скорости на 20–40 км/ч" }, value: { uz_latn: "5 BHM", uz_cyrl: "5 БҲМ", ru: "5 БРВ" } },
      { id: "fine-6", label: { uz_latn: "Tezlikni 40 km/soatdan yuqori oshirish", uz_cyrl: "Тезликни 40 км/соатдан юқори ошириш", ru: "Превышение скорости более чем на 40 км/ч" }, value: { uz_latn: "9 BHM", uz_cyrl: "9 БҲМ", ru: "9 БРВ" } },
      { id: "fine-7", label: { uz_latn: "40+ km/soat oshirish (takroran)", uz_cyrl: "40+ км/соат ошириш (такроран)", ru: "Превышение на 40+ км/ч (повторно)" }, value: { uz_latn: "25 BHM + 2 yilgacha huquqdan mahrum", uz_cyrl: "25 БҲМ + 2 йилгача ҳуқуқдан маҳрум", ru: "25 БРВ + лишение прав до 2 лет" } },
      { id: "fine-8", label: { uz_latn: "Rulda telefondan foydalanish", uz_cyrl: "Рулда телефондан фойдаланиш", ru: "Использование телефона за рулём" }, value: { uz_latn: "3 BHM", uz_cyrl: "3 БҲМ", ru: "3 БРВ" } },
      { id: "fine-9", label: { uz_latn: "OSAGO (sug'urta) yo'qligi", uz_cyrl: "ОСАГО (суғурта) йўқлиги", ru: "Отсутствие ОСАГО (страховки)" }, value: { uz_latn: "1 BHM", uz_cyrl: "1 БҲМ", ru: "1 БРВ" } },
      { id: "fine-10", label: { uz_latn: "Guvohnomasiz haydash", uz_cyrl: "Гувоҳномасиз ҳайдаш", ru: "Управление без водительского удостоверения" }, value: { uz_latn: "5 BHM", uz_cyrl: "5 БҲМ", ru: "5 БРВ" } },
      { id: "fine-11", label: { uz_latn: "Jamoat transporti yo'lagida harakatlanish", uz_cyrl: "Жамоат транспорти йўлагида ҳаракатланиш", ru: "Движение по полосе общественного транспорта" }, value: { uz_latn: "~0.9–2.7 BHM", uz_cyrl: "~0.9–2.7 БҲМ", ru: "~0,9–2,7 БРВ" } },
      { id: "fine-12", label: { uz_latn: "Mast holda transport boshqarish", uz_cyrl: "Маст ҳолда транспорт бошқариш", ru: "Управление в состоянии опьянения" }, value: { uz_latn: "25 BHM + 1.5–3 yil huquqdan mahrum", uz_cyrl: "25 БҲМ + 1.5–3 йил ҳуқуқдан маҳрум", ru: "25 БРВ + лишение прав на 1,5–3 года" } },
    ],
  },
  {
    key: "extraNumbers",
    icon: "ListChecks",
    title: { uz_latn: "Foydali qo'shimcha raqamlar", uz_cyrl: "Фойдали қўшимча рақамлар", ru: "Полезные дополнительные цифры" },
    facts: [
      { id: "extra-1", label: { uz_latn: "Ruxsat etilgan qon-alkogol darajasi", uz_cyrl: "Рухсат этилган қон-алкогол даражаси", ru: "Допустимый уровень алкоголя в крови" }, value: { uz_latn: "0.0 ‰ (nol tolerantlik)", uz_cyrl: "0.0 ‰ (нол толерантлик)", ru: "0,0 ‰ (нулевая толерантность)" } },
      { id: "extra-2", label: { uz_latn: "Bolalar uchun avtokreslo talab qilinadigan chegara", uz_cyrl: "Болалар учун автокресло талаб қилинадиган чегара", ru: "Граница обязательного детского кресла" }, value: { uz_latn: "12 yoshgacha / 150 sm gacha", uz_cyrl: "12 ёшгача / 150 см гача", ru: "До 12 лет / до 150 см" } },
      { id: "extra-3", label: { uz_latn: "Mototsiklda kaskasiz yurish jarimasi", uz_cyrl: "Мототсиклда каскасиз юриш жаримаси", ru: "Штраф за езду на мотоцикле без шлема" }, value: { uz_latn: "~0.5 BHM", uz_cyrl: "~0.5 БҲМ", ru: "~0,5 БРВ" } },
      { id: "extra-4", label: { uz_latn: "Raqamni yashirish/o'zgartirish jarimasi", uz_cyrl: "Рақамни яшириш/ўзгартириш жаримаси", ru: "Штраф за сокрытие/изменение госномера" }, value: { uz_latn: "Yuqori, huquqdan mahrum bo'lishi mumkin", uz_cyrl: "Юқори, ҳуқуқдан маҳрум бўлиши мумкин", ru: "Высокий, возможно лишение прав" } },
    ],
  },
  {
    key: "towing",
    icon: "Link",
    title: { uz_latn: "Shatakka olish va yuk tashish", uz_cyrl: "Шатакка олиш ва юк ташиш", ru: "Буксировка и перевозка грузов" },
    facts: [
      { id: "tow-1", label: { uz_latn: "Oraliq masofa (aholi punktida, egiluvchan)", uz_cyrl: "Оралиқ масофа (аҳоли пунктида, эгилувчан)", ru: "Дистанция (в нас. пункте, гибкая сцепка)" }, value: { uz_latn: "kamida 15 m", uz_cyrl: "камида 15 м", ru: "не менее 15 м" } },
      { id: "tow-2", label: { uz_latn: "Oraliq masofa (tashqarida, egiluvchan)", uz_cyrl: "Оралиқ масофа (ташқарида, эгилувчан)", ru: "Дистанция (вне нас. пункта, гибкая сцепка)" }, value: { uz_latn: "kamida 30 m", uz_cyrl: "камида 30 м", ru: "не менее 30 м" } },
      { id: "tow-3", label: { uz_latn: "Tom yukxonasidagi yuk balandligi", uz_cyrl: "Том юкхонасидаги юк баландлиги", ru: "Высота груза на багажнике на крыше" }, value: { uz_latn: "maks. 1 m", uz_cyrl: "макс. 1 м", ru: "макс. 1 м" } },
      { id: "tow-4", label: { uz_latn: "Yukning gabaritdan ortiqcha chiqishi (uzunlik)", uz_cyrl: "Юкнинг габаритдан ортиқча чиқиши (узунлик)", ru: "Выступ груза за габариты (по длине)" }, value: { uz_latn: "maks. 0.5 m", uz_cyrl: "макс. 0.5 м", ru: "макс. 0,5 м" } },
      { id: "tow-5", label: { uz_latn: "Davlat raqam belgisi balandligi", uz_cyrl: "Давлат рақам белгиси баландлиги", ru: "Высота гос. регистрационного знака" }, value: { uz_latn: "300 mm", uz_cyrl: "300 мм", ru: "300 мм" } },
      { id: "tow-6", label: { uz_latn: "Davlat raqam belgisi kengligi", uz_cyrl: "Давлат рақам белгиси кенглиги", ru: "Ширина гос. регистрационного знака" }, value: { uz_latn: "120 mm", uz_cyrl: "120 мм", ru: "120 мм" } },
    ],
  },
  {
    key: "registration",
    icon: "FileBadge",
    title: { uz_latn: "Ro'yxatdan o'tkazish", uz_cyrl: "Рўйхатдан ўтказиш", ru: "Регистрация транспортного средства" },
    facts: [
      { id: "reg-1", label: { uz_latn: "Avtomobil uchun davlat ro'yxatidan o'tkazish", uz_cyrl: "Автомобил учун давлат рўйхатидан ўтказиш", ru: "Госрегистрация автомобиля (номерной знак)" }, value: { uz_latn: "1.5 BHM", uz_cyrl: "1.5 БҲМ", ru: "1,5 БРВ" } },
      { id: "reg-2", label: { uz_latn: "Mototsikl va tirkamalar uchun ro'yxatdan o'tkazish", uz_cyrl: "Мототсикл ва тиркамалар учун рўйхатдан ўтказиш", ru: "Регистрация мотоциклов и прицепов" }, value: { uz_latn: "0.75 BHM", uz_cyrl: "0.75 БҲМ", ru: "0,75 БРВ" } },
      { id: "reg-3", label: { uz_latn: "Buzilgan raqamlarni almashtirish", uz_cyrl: "Бузилган рақамларни алмаштириш", ru: "Замена повреждённых номерных знаков" }, value: { uz_latn: "0.5–1 BHM", uz_cyrl: "0.5–1 БҲМ", ru: "0,5–1 БРВ" } },
      { id: "reg-4", label: { uz_latn: "Yangi (dilerdan) avtomobilni ro'yxatga olish", uz_cyrl: "Янги (дилердан) автомобилни рўйхатга олиш", ru: "Регистрация нового автомобиля (от дилера)" }, value: { uz_latn: "qiymatining 3%", uz_cyrl: "қийматининг 3%", ru: "3% от стоимости" } },
    ],
  },
  {
    key: "licenseProcess",
    icon: "GraduationCap",
    title: { uz_latn: "Guvohnoma olish jarayoni", uz_cyrl: "Гувоҳнома олиш жараёни", ru: "Процесс получения удостоверения" },
    facts: [
      { id: "proc-1", label: { uz_latn: "Guvohnoma amal qilish muddati", uz_cyrl: "Гувоҳнома амал қилиш муддати", ru: "Срок действия удостоверения" }, value: { uz_latn: "10 yil", uz_cyrl: "10 йил", ru: "10 лет" } },
      { id: "proc-2", label: { uz_latn: "B toifa uchun avtomaktabda o'qish muddati", uz_cyrl: "Б тоифа учун автомактабда ўқиш муддати", ru: "Срок обучения в автошколе (категория B)" }, value: { uz_latn: "~4 oy", uz_cyrl: "~4 ой", ru: "~4 месяца" } },
      { id: "proc-3", label: { uz_latn: "Tibbiy ko'rikdan o'tish narxi (taxminan)", uz_cyrl: "Тиббий кўрикдан ўтиш нархи (тахминан)", ru: "Стоимость медицинского осмотра (примерно)" }, value: { uz_latn: "200 000–400 000 so'm", uz_cyrl: "200 000–400 000 сўм", ru: "200 000–400 000 сум" } },
      { id: "proc-4", label: { uz_latn: "Imtihondan so'ng guvohnoma berilishi", uz_cyrl: "Имтиҳондан сўнг гувоҳнома берилиши", ru: "Выдача удостоверения после экзамена" }, value: { uz_latn: "3–5 ish kuni", uz_cyrl: "3–5 иш куни", ru: "3–5 рабочих дней" } },
    ],
  },
];

/** Berilgan tildagi matnni qaytaradi, topilmasa uz_latn'ga tushadi. */
export function localizeText(field, lang = "uz_latn") {
  if (!field) return "";
  return field[lang] || field.uz_latn || "";
}
