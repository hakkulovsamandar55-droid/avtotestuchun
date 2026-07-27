// ============================================================================
// YO'L BELGILARI — QISQA IZOHLAR
//
// MANBA: O'zbekiston Respublikasi Yo'l harakati qoidalari (Vazirlar
// Mahkamasining 2022-yil 12-apreldagi 172-son qaroriga 1-ilova).
//
// NIMA UCHUN RASMIY MATN AYNAN KO'CHIRILMAGAN: qoidalardagi matn yuridik
// tilda yozilgan ("Belgilarning ta'siri ushbu Qoidalarning 175-bandiga
// muvofiq..."). Ilovada o'quvchiga bunday matn emas, HARAKAT uchun aniq
// ko'rsatma kerak. Shuning uchun har izoh rasmiy ma'noga tayanadi, lekin
// sodda tilda va "haydovchi nima qilishi kerak" nuqtai nazaridan yozilgan.
//
// TUZILMA: kod -> { uz_latn, uz_cyrl, ru }. Har bir belgi 3 tilda TO'LIQ
// tarjima qilingan (2026-07-27). uz_cyrl — uz_latn'dan avtomatik
// transliteratsiya qilingan (lotin-kirill kutubxonasi), ru — qo'lda,
// YHQ terminologiyasiga mos tarjima qilingan.
//
// getSignDescription(code, lang) so'ralgan tilda matn qaytaradi, topilmasa
// uz_latn'ga qaytadi — hech qachon bo'sh yoki undefined natija bermaydi.
// Izoh umuman yo'q bo'lsa (kod bazada yo'q), UI zaxira matnni ko'rsatadi
// (signs.detailHint), shuning uchun to'liq bo'lmasa ham xato bermaydi.
// ============================================================================

export const SIGN_DESCRIPTIONS = {

  // ---- 1. OGOHLANTIRUVCHI BELGILAR ----
  // Xavfli yo'l qismiga yaqinlashilayotganini bildiradi. Aholi punktidan
  // tashqarida 150-300 m, ichida 50-100 m oldin o'rnatiladi.

  "1.1": { uz_latn: "Shlagbaum bilan jihozlangan temir yo'l kesishmasi yaqinlashmoqda. Tezlikni kamaytiring, shlagbaum yopilayotgan bo'lsa to'xtang.", uz_cyrl: "Шлагбаум билан жиҳозланган темир йўл кесишмаси яқинлашмоқда. Тезликни камайтиринг, шлагбаум ёпилаётган бўлса тўхтанг.", ru: "Приближается железнодорожный переезд, оборудованный шлагбаумом. Снизьте скорость, если шлагбаум закрывается — остановитесь." },
  "1.2": { uz_latn: "Shlagbaumsiz temir yo'l kesishmasi. Bu yerda faqat o'zingiz kuzatib, poyezd kelmayotganiga ishonch hosil qilib o'tasiz.", uz_cyrl: "Шлагбаумсиз темир йўл кесишмаси. Бу ерда фақат ўзингиз кузатиб, поезд келмаётганига ишонч ҳосил қилиб ўтасиз.", ru: "Железнодорожный переезд без шлагбаума. Здесь вы проезжаете, только самостоятельно убедившись в отсутствии приближающегося поезда." },
  "1.3": { uz_latn: "Nazoratsiz temir yo'l kesishmasi (UZP). Kesishmaga yaqinlashganda albatta to'xtab, ikki tomonni ko'rib chiqing.", uz_cyrl: "Назоратсиз темир йўл кесишмаси (УЗП). Кесишмага яқинлашганда албатта тўхтаб, икки томонни кўриб чиқинг.", ru: "Неохраняемый железнодорожный переезд. При приближении к переезду обязательно остановитесь и осмотритесь в обе стороны." },
  "1.3.1": { uz_latn: "Bir izli temir yo'l kesishmasi. Bitta poyezd yo'li kesib o'tadi.", uz_cyrl: "Бир изли темир йўл кесишмаси. Битта поезд йўли кесиб ўтади.", ru: "Однопутный железнодорожный переезд. Дорогу пересекает один железнодорожный путь." },
  "1.3.2": { uz_latn: "Ko'p izli temir yo'l kesishmasi. Ikki yoki undan ortiq yo'l bor — bir poyezd o'tgach ikkinchisi kelishi mumkin.", uz_cyrl: "Кўп изли темир йўл кесишмаси. Икки ёки ундан ортиқ йўл бор — бир поезд ўтгач иккинчиси келиши мумкин.", ru: "Многопутный железнодорожный переезд. Путей два и более — после проезда одного поезда может появиться второй." },
  "1.4.1": { uz_latn: "Temir yo'l kesishmasigacha 150-300 m qoldi (uchta qiya chiziq).", uz_cyrl: "Темир йўл кесишмасигача 150-300 м қолди (учта қия чизиқ).", ru: "До железнодорожного переезда осталось 150-300 м (три наклонные полосы)." },
  "1.4.2": { uz_latn: "Temir yo'l kesishmasigacha 100-200 m qoldi (ikkita qiya chiziq).", uz_cyrl: "Темир йўл кесишмасигача 100-200 м қолди (иккита қия чизиқ).", ru: "До железнодорожного переезда осталось 100-200 м (две наклонные полосы)." },
  "1.4.3": { uz_latn: "Temir yo'l kesishmasi juda yaqin — 50-100 m (bitta qiya chiziq).", uz_cyrl: "Темир йўл кесишмаси жуда яқин — 50-100 м (битта қия чизиқ).", ru: "Железнодорожный переезд совсем близко — 50-100 м (одна наклонная полоса)." },
  "1.4.4": { uz_latn: "Temir yo'l kesishmasigacha 150-300 m (chap tomonda o'rnatiladi).", uz_cyrl: "Темир йўл кесишмасигача 150-300 м (чап томонда ўрнатилади).", ru: "До железнодорожного переезда 150-300 м (устанавливается слева)." },
  "1.4.5": { uz_latn: "Temir yo'l kesishmasigacha 100-200 m (chap tomonda o'rnatiladi).", uz_cyrl: "Темир йўл кесишмасигача 100-200 м (чап томонда ўрнатилади).", ru: "До железнодорожного переезда 100-200 м (устанавливается слева)." },
  "1.4.6": { uz_latn: "Temir yo'l kesishmasi juda yaqin — 50-100 m (chap tomonda o'rnatiladi).", uz_cyrl: "Темир йўл кесишмаси жуда яқин — 50-100 м (чап томонда ўрнатилади).", ru: "Железнодорожный переезд совсем близко — 50-100 м (устанавливается слева)." },
  "1.5": { uz_latn: "Oldinda tramvay yo'li kesib o'tadi. Tramvayga yo'l bering.", uz_cyrl: "Олдинда трамвай йўли кесиб ўтади. Трамвайга йўл беринг.", ru: "Впереди дорогу пересекает трамвайная линия. Уступите дорогу трамваю." },
  "1.6": { uz_latn: "Teng ahamiyatli yo'llar kesishmasi. Bu yerda o'ngdan kelayotgan transportga yo'l berish qoidasi ishlaydi.", uz_cyrl: "Тенг аҳамиятли йўллар кесишмаси. Бу ерда ўнгдан келаётган транспортга йўл бериш қоидаси ишлайди.", ru: "Пересечение равнозначных дорог. Здесь действует правило уступить дорогу транспорту, приближающемуся справа." },
  "1.7": { uz_latn: "Aylanma harakat tashkil etilgan chorraha yaqinlashmoqda.", uz_cyrl: "Айланма ҳаракат ташкил этилган чорраҳа яқинлашмоқда.", ru: "Приближается перекрёсток с круговым движением." },
  "1.8": { uz_latn: "Oldindagi chorraha yoki o'tish joyi svetofor bilan boshqariladi.", uz_cyrl: "Олдиндаги чорраҳа ёки ўтиш жойи светофор билан бошқарилади.", ru: "Впереди перекрёсток или переход регулируется светофором." },
  "1.9": { uz_latn: "Ko'tarma (ochiladigan) ko'prik. Ko'prik ko'tarilgan bo'lsa to'xtash shart.", uz_cyrl: "Кўтарма (очиладиган) кўприк. Кўприк кўтарилган бўлса тўхташ шарт.", ru: "Разводной мост. Если мост разведён, остановка обязательна." },
  "1.10": { uz_latn: "Yo'l suv havzasi sohiliga yoki paromga chiqadi.", uz_cyrl: "Йўл сув ҳавзаси соҳилига ёки паромга чиқади.", ru: "Дорога выходит к берегу водоёма или к парому." },
  "1.11.1": { uz_latn: "Xavfli burilish — o'ngga. Tezlikni oldindan kamaytiring.", uz_cyrl: "Хавфли бурилиш — ўнгга. Тезликни олдиндан камайтиринг.", ru: "Опасный поворот направо. Заранее снизьте скорость." },
  "1.11.2": { uz_latn: "Xavfli burilish — chapga. Tezlikni oldindan kamaytiring.", uz_cyrl: "Хавфли бурилиш — чапга. Тезликни олдиндан камайтиринг.", ru: "Опасный поворот налево. Заранее снизьте скорость." },
  "1.12.1": { uz_latn: "Ketma-ket xavfli burilishlar, birinchisi o'ngga.", uz_cyrl: "Кетма-кет хавфли бурилишлар, биринчиси ўнгга.", ru: "Ряд опасных поворотов, первый — направо." },
  "1.12.2": { uz_latn: "Ketma-ket xavfli burilishlar, birinchisi chapga.", uz_cyrl: "Кетма-кет хавфли бурилишлар, биринчиси чапга.", ru: "Ряд опасных поворотов, первый — налево." },
  "1.13": { uz_latn: "Tik nishablik (pastga tushish). Belgidagi raqam qiyalik foizini ko'rsatadi. Tormozga ishonmang, past uzatmada tushing.", uz_cyrl: "Тик нишаблик (пастга тушиш). Белгидаги рақам қиялик фоизини кўрсатади. Тормозга ишонманг, паст узатмада тушинг.", ru: "Крутой спуск. Цифра на знаке указывает уклон в процентах. Не полагайтесь только на тормоз — спускайтесь на пониженной передаче." },
  "1.14": { uz_latn: "Tik balandlik (yuqoriga chiqish). Ko'tarilishda quvib o'tish xavfli.", uz_cyrl: "Тик баландлик (юқорига чиқиш). Кўтарилишда қувиб ўтиш хавфли.", ru: "Крутой подъём. Обгон на подъёме опасен." },
  "1.15": { uz_latn: "Yo'l qoplamasi sirpanchiq. Tezlikni kamaytiring, keskin tormoz va burilishdan saqlaning.", uz_cyrl: "Йўл қопламаси сирпанчиқ. Тезликни камайтиринг, кескин тормоз ва бурилишдан сақланинг.", ru: "Скользкое дорожное покрытие. Снизьте скорость, избегайте резкого торможения и поворотов." },
  "1.16": { uz_latn: "Notekis yo'l — o'ymalar, do'ngliklar yoki buzilgan qoplama bor.", uz_cyrl: "Нотекис йўл — ўймалар, дўнгликлар ёки бузилган қоплама бор.", ru: "Неровная дорога — есть выбоины, бугры или повреждённое покрытие." },
  "1.17": { uz_latn: "Yo'lda sun'iy notekislik yoki chuqurlik bor — sekinlashtiring.", uz_cyrl: "Йўлда сунъий нотекислик ёки чуқурлик бор — секинлаштиринг.", ru: "На дороге искусственная неровность или выбоина — снизьте скорость." },
  "1.18.1": { uz_latn: "Yo'l ikki tomondan ham torayadi.", uz_cyrl: "Йўл икки томондан ҳам тораяди.", ru: "Дорога сужается с обеих сторон." },
  "1.18.2": { uz_latn: "Yo'l o'ng tomondan torayadi.", uz_cyrl: "Йўл ўнг томондан тораяди.", ru: "Дорога сужается справа." },
  "1.18.3": { uz_latn: "Yo'l chap tomondan torayadi.", uz_cyrl: "Йўл чап томондан тораяди.", ru: "Дорога сужается слева." },
  "1.19": { uz_latn: "Bir tomonlama yo'l tugab, ikki tomonlama harakat boshlanadi. Ro'paradan transport kelishini kuting.", uz_cyrl: "Бир томонлама йўл тугаб, икки томонлама ҳаракат бошланади. Рўпарадан транспорт келишини кутинг.", ru: "Дорога с односторонним движением заканчивается, начинается двустороннее движение. Ожидайте встречный транспорт." },
  "1.20": { uz_latn: "Belgilangan piyodalar o'tish joyi yaqinlashmoqda. Piyodaga yo'l berishga tayyor bo'ling.", uz_cyrl: "Белгиланган пиёдалар ўтиш жойи яқинлашмоқда. Пиёдага йўл беришга тайёр бўлинг.", ru: "Приближается обозначенный пешеходный переход. Будьте готовы уступить дорогу пешеходам." },
  "1.21": { uz_latn: "Yaqinda bolalar muassasasi bor (maktab, bog'cha). Bola yo'lga kutilmaganda chiqishi mumkin.", uz_cyrl: "Яқинда болалар муассасаси бор (мактаб, боғча). Бола йўлга кутилмаганда чиқиши мумкин.", ru: "Поблизости детское учреждение (школа, детский сад). Ребёнок может неожиданно выйти на дорогу." },
  "1.22": { uz_latn: "Velosiped yo'lkasi yo'lni kesib o'tadi.", uz_cyrl: "Велосипед йўлкаси йўлни кесиб ўтади.", ru: "Велосипедную дорожку пересекает дорога." },
  "1.23": { uz_latn: "Yo'lda ta'mirlash ishlari olib borilmoqda.", uz_cyrl: "Йўлда таъмирлаш ишлари олиб борилмоқда.", ru: "На дороге ведутся ремонтные работы." },
  "1.24": { uz_latn: "Yo'ldan mol haydab o'tilishi mumkin.", uz_cyrl: "Йўлдан мол ҳайдаб ўтилиши мумкин.", ru: "По дороге возможен прогон скота." },
  "1.25": { uz_latn: "Yovvoyi hayvonlar yo'lga chiqishi mumkin.", uz_cyrl: "Ёввойи ҳайвонлар йўлга чиқиши мумкин.", ru: "На дорогу могут выйти дикие животные." },
  "1.26": { uz_latn: "Toshlar tushishi mumkin. Yo'lda tosh bo'lishiga tayyor bo'ling.", uz_cyrl: "Тошлар тушиши мумкин. Йўлда тош бўлишига тайёр бўлинг.", ru: "Возможно падение камней. Будьте готовы к камням на дороге." },
  "1.27": { uz_latn: "Kuchli yonlama shamol bo'ladigan joy. Rulni mahkam tuting.", uz_cyrl: "Кучли ёнлама шамол бўладиган жой. Рулни маҳкам тутинг.", ru: "Участок с сильным боковым ветром. Крепко держите руль." },
  "1.28": { uz_latn: "Pastlab uchuvchi samolyotlar. Kutilmagan kuchli ovoz haydovchini cho'chitishi mumkin.", uz_cyrl: "Пастлаб учувчи самолётлар. Кутилмаган кучли овоз ҳайдовчини чўчитиши мумкин.", ru: "Низколетящие самолёты. Внезапный сильный шум может напугать водителя." },
  "1.29": { uz_latn: "Tonnel yaqinlashmoqda. Tonnelga kirishdan oldin faralarni yoqing.", uz_cyrl: "Тоннел яқинлашмоқда. Тоннелга киришдан олдин фараларни ёқинг.", ru: "Приближается тоннель. Перед въездом в тоннель включите фары." },
  "1.30": { uz_latn: "Boshqa belgilar bilan ifodalanmagan xavf. Qo'shimcha taxtachada xavf turi yozilishi mumkin.", uz_cyrl: "Бошқа белгилар билан ифодаланмаган хавф. Қўшимча тахтачада хавф тури ёзилиши мумкин.", ru: "Опасность, не обозначенная другими знаками. Вид опасности может быть указан на табличке дополнительной информации." },
  "1.31": { uz_latn: "Yo’lda sun’iy notekislik (“sekinlashtirgich”) bor.", uz_cyrl: "Йўлда сунъий нотекислик (“секинлаштиргич”) бор.", ru: "На дороге искусственная неровность («лежачий полицейский»)." },
  "1.31.1": { uz_latn: "Burilish yo'nalishini ko'rsatadi — o'ngga.", uz_cyrl: "Бурилиш йўналишини кўрсатади — ўнгга.", ru: "Указывает направление поворота — направо." },
  "1.31.2": { uz_latn: "Burilish yo'nalishini ko'rsatadi — chapga.", uz_cyrl: "Бурилиш йўналишини кўрсатади — чапга.", ru: "Указывает направление поворота — налево." },
  "1.31.3": { uz_latn: "Yo'lning keskin burilish yo'nalishini ko'rsatadi.", uz_cyrl: "Йўлнинг кескин бурилиш йўналишини кўрсатади.", ru: "Указывает направление крутого поворота дороги." },
  "1.32": { uz_latn: "Oldinda tirbandlik bo'lishi mumkin.", uz_cyrl: "Олдинда тирбандлик бўлиши мумкин.", ru: "Впереди возможен затор." },

  // ---- 2. IMTIYOZ BELGILARI ----
  // Kesishmalar va tor yo'l qismlarida o'tish navbatini belgilaydi.

  "2.1": { uz_latn: "Siz asosiy yo'ldasiz — kesishmalarda sizga ustunlik beriladi. Lekin bu belgi temir yo'l kesishmasida imtiyoz bermaydi.", uz_cyrl: "Сиз асосий йўлдасиз — кесишмаларда сизга устунлик берилади. Лекин бу белги темир йўл кесишмасида имтиёз бермайди.", ru: "Вы на главной дороге — на перекрёстках у вас преимущество. Но этот знак не даёт преимущества на железнодорожном переезде." },
  "2.2": { uz_latn: "Asosiy yo'l tugadi. Keyingi kesishmada endi sizga ustunlik berilmaydi.", uz_cyrl: "Асосий йўл тугади. Кейинги кесишмада энди сизга устунлик берилмайди.", ru: "Главная дорога заканчивается. На следующем перекрёстке преимущества у вас уже не будет." },
  "2.3.1": { uz_latn: "Oldinda ikkinchi darajali yo'l ikki tomondan kesib o'tadi. Siz asosiy yo'ldasiz.", uz_cyrl: "Олдинда иккинчи даражали йўл икки томондан кесиб ўтади. Сиз асосий йўлдасиз.", ru: "Впереди второстепенная дорога пересекает главную с обеих сторон. Вы на главной дороге." },
  "2.3.2": { uz_latn: "O'ng tomondan ikkinchi darajali yo'l tutashadi. Siz asosiy yo'ldasiz.", uz_cyrl: "Ўнг томондан иккинчи даражали йўл туташади. Сиз асосий йўлдасиз.", ru: "Справа примыкает второстепенная дорога. Вы на главной дороге." },
  "2.3.3": { uz_latn: "Chap tomondan ikkinchi darajali yo'l tutashadi. Siz asosiy yo'ldasiz.", uz_cyrl: "Чап томондан иккинчи даражали йўл туташади. Сиз асосий йўлдасиз.", ru: "Слева примыкает второстепенная дорога. Вы на главной дороге." },
  "2.4": { uz_latn: "Kesib o'tayotgan yo'ldagi transportga yo'l bering. Zarur bo'lsa to'xtang, lekin to'xtash shart emas — yo'l bo'sh bo'lsa o'tishingiz mumkin.", uz_cyrl: "Кесиб ўтаётган йўлдаги транспортга йўл беринг. Зарур бўлса тўхтанг, лекин тўхташ шарт эмас — йўл бўш бўлса ўтишингиз мумкин.", ru: "Уступите дорогу транспорту на пересекаемой дороге. При необходимости остановитесь, но остановка не обязательна — если дорога свободна, можно проехать." },
  "2.5": { uz_latn: "To'xtash SHART. Stop chizig'i oldida (yoki chiziq bo'lsa kesishma chetida) albatta to'liq to'xtab, keyin yo'l bering.", uz_cyrl: "Тўхташ ШАРТ. Стоп чизиғи олдида (ёки чизиқ бўлса кесишма четида) албатта тўлиқ тўхтаб, кейин йўл беринг.", ru: "Остановка ОБЯЗАТЕЛЬНА. Обязательно полностью остановитесь перед линией «Стоп» (а при её отсутствии — у края перекрёстка), затем уступите дорогу." },
  "2.6": { uz_latn: "Tor qismda ro'paradan kelayotgan transport ustunlikka ega — ularni o'tkazib yuboring.", uz_cyrl: "Тор қисмда рўпарадан келаётган транспорт устунликка эга — уларни ўтказиб юборинг.", ru: "На узком участке преимущество у встречного транспорта — пропустите его." },
  "2.7": { uz_latn: "Tor qismda sizga ustunlik beriladi — ro'paradagi transport sizni kutadi.", uz_cyrl: "Тор қисмда сизга устунлик берилади — рўпарадаги транспорт сизни кутади.", ru: "На узком участке преимущество у вас — встречный транспорт ждёт вас." },

  // ---- 3. TAQIQLOVCHI BELGILAR ----
  // Ma'lum harakatlarni taqiqlaydi yoki cheklaydi.

  "3.1": { uz_latn: "Bu yo'nalishda barcha transport vositalarining kirishi taqiqlangan (“kirish yo'q”, xalq tilida “kirpich”). Bir tomonlama yo'lga teskari kirishni to'sadi.", uz_cyrl: "Бу йўналишда барча транспорт воситаларининг кириши тақиқланган (“кириш йўқ”, халқ тилида “кирпич”). Бир томонлама йўлга тескари киришни тўсади.", ru: "Въезд всех транспортных средств в этом направлении запрещён («кирпич»). Блокирует выезд навстречу движению на дороге с односторонним движением." },
  "3.2": { uz_latn: "Barcha transport vositalarining harakati taqiqlangan. Piyodalarga ta'sir qilmaydi.", uz_cyrl: "Барча транспорт воситаларининг ҳаракати тақиқланган. Пиёдаларга таъсир қилмайди.", ru: "Движение всех транспортных средств запрещено. На пешеходов не распространяется." },
  "3.3": { uz_latn: "Mexanik transport vositalari o'tishi taqiqlangan. Velosiped, ot-arava va mopedga ruxsat.", uz_cyrl: "Механик транспорт воситалари ўтиши тақиқланган. Велосипед, от-арава ва мопедга рухсат.", ru: "Проезд механических транспортных средств запрещён. Велосипедам, гужевым повозкам и мопедам разрешено." },
  "3.4": { uz_latn: "Belgida ko'rsatilgan ruxsat etilgan eng katta massadan og'ir yuk avtomobillari o'tishi taqiqlangan. Raqam yo'q bo'lsa — 3,5 tonnadan og'irlari.", uz_cyrl: "Белгида кўрсатилган рухсат этилган энг катта массадан оғир юк автомобиллари ўтиши тақиқланган. Рақам йўқ бўлса — 3,5 тоннадан оғирлари.", ru: "Запрещён проезд грузовых автомобилей с разрешённой максимальной массой больше указанной на знаке. Если цифры нет — тяжелее 3,5 тонны." },
  "3.5": { uz_latn: "Mototsikllar harakati taqiqlangan.", uz_cyrl: "Мототсикллар ҳаракати тақиқланган.", ru: "Движение мотоциклов запрещено." },
  "3.6": { uz_latn: "Traktorlar va o'ziyurar mashinalar harakati taqiqlangan.", uz_cyrl: "Тракторлар ва ўзиюрар машиналар ҳаракати тақиқланган.", ru: "Движение тракторов и самоходных машин запрещено." },
  "3.7": { uz_latn: "Tirkama yoki yarim tirkama bilan harakatlanish taqiqlangan. Mexanik transport vositasini shatakka olish ham taqiqlanadi.", uz_cyrl: "Тиркама ёки ярим тиркама билан ҳаракатланиш тақиқланган. Механик транспорт воситасини шатакка олиш ҳам тақиқланади.", ru: "Движение с прицепом или полуприцепом запрещено. Буксировка механического транспортного средства также запрещена." },
  "3.8": { uz_latn: "Ot-arava, ot-chana va yuklovchi hayvonlar harakati taqiqlangan.", uz_cyrl: "От-арава, от-чана ва юкловчи ҳайвонлар ҳаракати тақиқланган.", ru: "Движение гужевых повозок, саней и вьючных животных запрещено." },
  "3.9": { uz_latn: "Velosiped va mopedlarda harakatlanish taqiqlangan.", uz_cyrl: "Велосипед ва мопедларда ҳаракатланиш тақиқланган.", ru: "Движение на велосипедах и мопедах запрещено." },
  "3.10": { uz_latn: "Piyodalar harakati taqiqlangan. Belgi faqat o'rnatilgan tomonga amal qiladi.", uz_cyrl: "Пиёдалар ҳаракати тақиқланган. Белги фақат ўрнатилган томонга амал қилади.", ru: "Движение пешеходов запрещено. Знак действует только в сторону, где он установлен." },
  "3.11": { uz_latn: "Umumiy massasi belgida ko'rsatilgandan og'ir transport vositalari o'tishi taqiqlangan. Yuk bilan birga hisoblanadi.", uz_cyrl: "Умумий массаси белгида кўрсатилгандан оғир транспорт воситалари ўтиши тақиқланган. Юк билан бирга ҳисобланади.", ru: "Запрещён проезд транспортных средств с общей массой больше указанной на знаке. Считается вместе с грузом." },
  "3.12": { uz_latn: "Bir o'qqa tushadigan yuklama belgida ko'rsatilgandan katta bo'lsa o'tish taqiqlangan. Ko'prik va yo'l qoplamasini himoya qiladi.", uz_cyrl: "Бир ўққа тушадиган юклама белгида кўрсатилгандан катта бўлса ўтиш тақиқланган. Кўприк ва йўл қопламасини ҳимоя қилади.", ru: "Запрещён проезд, если нагрузка на одну ось больше указанной на знаке. Защищает мост и дорожное покрытие." },
  "3.13": { uz_latn: "Balandligi belgida ko'rsatilgandan yuqori transport vositalari o'tishi taqiqlangan. Ko'prik ostida yoki tonnelda o'rnatiladi.", uz_cyrl: "Баландлиги белгида кўрсатилгандан юқори транспорт воситалари ўтиши тақиқланган. Кўприк остида ёки тоннелда ўрнатилади.", ru: "Запрещён проезд транспортных средств выше указанной на знаке высоты. Устанавливается под мостом или в тоннеле." },
  "3.14": { uz_latn: "Kengligi belgida ko'rsatilgandan katta transport vositalari o'tishi taqiqlangan.", uz_cyrl: "Кенглиги белгида кўрсатилгандан катта транспорт воситалари ўтиши тақиқланган.", ru: "Запрещён проезд транспортных средств шире указанной на знаке ширины." },
  "3.15": { uz_latn: "Uzunligi belgida ko'rsatilgandan katta transport vositalari (tirkama bilan birga) o'tishi taqiqlangan.", uz_cyrl: "Узунлиги белгида кўрсатилгандан катта транспорт воситалари (тиркама билан бирга) ўтиши тақиқланган.", ru: "Запрещён проезд транспортных средств (вместе с прицепом) длиннее указанной на знаке." },
  "3.16": { uz_latn: "Oldindagi transport bilan belgida ko'rsatilgandan kam masofa saqlash taqiqlangan.", uz_cyrl: "Олдиндаги транспорт билан белгида кўрсатилгандан кам масофа сақлаш тақиқланган.", ru: "Запрещено следовать за впереди идущим транспортом на расстоянии меньше указанного на знаке." },
  "3.17.1": { uz_latn: "Bojxona nazorati punkti. To'xtamasdan o'tish taqiqlangan.", uz_cyrl: "Божхона назорати пункти. Тўхтамасдан ўтиш тақиқланган.", ru: "Таможенный контрольный пункт. Проезд без остановки запрещён." },
  "3.17.2": { uz_latn: "Xavf tug'diradigan holat sababli harakat taqiqlangan (avariya, tabiiy ofat va shu kabilar).", uz_cyrl: "Хавф туғдирадиган ҳолат сабабли ҳаракат тақиқланган (авария, табиий офат ва шу кабилар).", ru: "Движение запрещено из-за опасной ситуации (авария, стихийное бедствие и подобное)." },
  "3.18.1": { uz_latn: "O'ngga burilish taqiqlangan. Faqat shu chorrahaga amal qiladi. Qayrilishga ta'sir qilmaydi.", uz_cyrl: "Ўнгга бурилиш тақиқланган. Фақат шу чорраҳага амал қилади. Қайрилишга таъсир қилмайди.", ru: "Поворот направо запрещён. Действует только на этом перекрёстке. На разворот не распространяется." },
  "3.18.2": { uz_latn: "Chapga burilish taqiqlangan. Lekin qayrilishga RUXSAT beriladi — bu ko'p adashtiradigan nuqta.", uz_cyrl: "Чапга бурилиш тақиқланган. Лекин қайрилишга РУХСАТ берилади — бу кўп адаштирадиган нуқта.", ru: "Поворот налево запрещён. Но разворот РАЗРЕШЁН — это частая ошибка при сдаче." },
  "3.19": { uz_latn: "Qayrilish (180 daraja burilish) taqiqlangan. Chapga burilishga ta'sir qilmaydi.", uz_cyrl: "Қайрилиш (180 даража бурилиш) тақиқланган. Чапга бурилишга таъсир қилмайди.", ru: "Разворот (поворот на 180 градусов) запрещён. На поворот налево не распространяется." },
  "3.20": { uz_latn: "Barcha transport vositalarini quvib o'tish taqiqlangan. Sekin yuruvchi (30 km/soatdan kam) transportni quvib o'tishga ruxsat.", uz_cyrl: "Барча транспорт воситаларини қувиб ўтиш тақиқланган. Секин юрувчи (30 км/соатдан кам) транспортни қувиб ўтишга рухсат.", ru: "Обгон всех транспортных средств запрещён. Разрешён обгон тихоходного транспорта (менее 30 км/ч)." },
  "3.21": { uz_latn: "Quvib o'tish taqiqlangan hudud tugadi.", uz_cyrl: "Қувиб ўтиш тақиқланган ҳудуд тугади.", ru: "Зона, где запрещён обгон, заканчивается." },
  "3.22": { uz_latn: "3,5 tonnadan og'ir yuk avtomobillariga quvib o'tish taqiqlangan. Boshqa transportga ta'sir qilmaydi.", uz_cyrl: "3,5 тоннадан оғир юк автомобилларига қувиб ўтиш тақиқланган. Бошқа транспортга таъсир қилмайди.", ru: "Обгон запрещён грузовым автомобилям массой более 3,5 тонны. На остальной транспорт не распространяется." },
  "3.23": { uz_latn: "Yuk avtomobillari uchun quvib o'tish taqiqlangan hudud tugadi.", uz_cyrl: "Юк автомобиллари учун қувиб ўтиш тақиқланган ҳудуд тугади.", ru: "Зона, где грузовым автомобилям запрещён обгон, заканчивается." },
  "3.24": { uz_latn: "Belgida ko'rsatilgan tezlikdan oshib harakatlanish taqiqlangan.", uz_cyrl: "Белгида кўрсатилган тезликдан ошиб ҳаракатланиш тақиқланган.", ru: "Запрещено движение со скоростью выше указанной на знаке." },
  "3.25": { uz_latn: "Tezlik cheklovi tugadi. Endi shu yo'l turi uchun umumiy tezlik chegarasi ishlaydi.", uz_cyrl: "Тезлик чеклови тугади. Энди шу йўл тури учун умумий тезлик чегараси ишлайди.", ru: "Ограничение скорости заканчивается. Теперь действует общий предел скорости для данного типа дороги." },
  "3.26": { uz_latn: "Ovoz signalidan foydalanish taqiqlangan. Faqat yo'l-transport hodisasini oldini olish uchun ruxsat.", uz_cyrl: "Овоз сигналидан фойдаланиш тақиқланган. Фақат йўл-транспорт ҳодисасини олдини олиш учун рухсат.", ru: "Использование звукового сигнала запрещено. Разрешено только для предотвращения ДТП." },
  "3.27": { uz_latn: "To'xtash ham, to'xtab turish ham taqiqlangan. Yo'lovchi tushirish uchun ham to'xtay olmaysiz.", uz_cyrl: "Тўхташ ҳам, тўхтаб туриш ҳам тақиқланган. Йўловчи тушириш учун ҳам тўхтай олмайсиз.", ru: "Запрещены и остановка, и стоянка. Нельзя остановиться даже для высадки пассажиров." },
  "3.28": { uz_latn: "To'xtab turish taqiqlangan, lekin qisqa to'xtash (yo'lovchi tushirish, yuk ortish) mumkin.", uz_cyrl: "Тўхтаб туриш тақиқланган, лекин қисқа тўхташ (йўловчи тушириш, юк ортиш) мумкин.", ru: "Стоянка запрещена, но кратковременная остановка (высадка пассажиров, погрузка) разрешена." },
  "3.29": { uz_latn: "Oyning toq kunlarida to'xtab turish taqiqlangan.", uz_cyrl: "Ойнинг тоқ кунларида тўхтаб туриш тақиқланган.", ru: "Стоянка запрещена по нечётным числам месяца." },
  "3.30": { uz_latn: "Oyning juft kunlarida to'xtab turish taqiqlangan.", uz_cyrl: "Ойнинг жуфт кунларида тўхтаб туриш тақиқланган.", ru: "Стоянка запрещена по чётным числам месяца." },
  "3.31": { uz_latn: "Bir vaqtda o'rnatilgan bir necha taqiqlovchi belgining ta'siri tugadi.", uz_cyrl: "Бир вақтда ўрнатилган бир неча тақиқловчи белгининг таъсири тугади.", ru: "Действие нескольких одновременно установленных запрещающих знаков заканчивается." },
  "3.32": { uz_latn: "“Xavfli yuk” taniqlik belgisi bo'lgan transport vositalarining harakati taqiqlangan.", uz_cyrl: "“Хавфли юк” таниқлик белгиси бўлган транспорт воситаларининг ҳаракати тақиқланган.", ru: "Движение транспортных средств с опознавательным знаком «Опасный груз» запрещено." },
  "3.33": { uz_latn: "Portlovchi va tez yonuvchi yuk tashiyotgan transport vositalarining harakati taqiqlangan.", uz_cyrl: "Портловчи ва тез ёнувчи юк ташиётган транспорт воситаларининг ҳаракати тақиқланган.", ru: "Движение транспортных средств, перевозящих взрывчатые и легковоспламеняющиеся грузы, запрещено." },

  // ---- 4. BUYURUVCHI BELGILAR ----
  // Faqat ko'rsatilgan yo'nalish yoki harakat turiga ruxsat beradi.

  "4.1.1": { uz_latn: "Faqat to'g'riga harakatlanishga ruxsat. Chorrahadan keyin hovli va ish joyiga kirish uchun o'ngga burilishga ruxsat beriladi.", uz_cyrl: "Фақат тўғрига ҳаракатланишга рухсат. Чорраҳадан кейин ҳовли ва иш жойига кириш учун ўнгга бурилишга рухсат берилади.", ru: "Разрешено движение только прямо. После перекрёстка разрешён поворот направо для въезда во двор или на территорию предприятия." },
  "4.1.2": { uz_latn: "Faqat o'ngga burilishga ruxsat.", uz_cyrl: "Фақат ўнгга бурилишга рухсат.", ru: "Разрешён только поворот направо." },
  "4.1.3": { uz_latn: "Faqat chapga burilishga ruxsat. Bu belgi qayrilishga ham ruxsat beradi.", uz_cyrl: "Фақат чапга бурилишга рухсат. Бу белги қайрилишга ҳам рухсат беради.", ru: "Разрешён только поворот налево. Этот знак также разрешает разворот." },
  "4.1.4": { uz_latn: "To'g'riga yoki o'ngga harakatlanishga ruxsat. Chapga burilish va qayrilish taqiqlangan.", uz_cyrl: "Тўғрига ёки ўнгга ҳаракатланишга рухсат. Чапга бурилиш ва қайрилиш тақиқланган.", ru: "Разрешено движение прямо или направо. Поворот налево и разворот запрещены." },
  "4.1.5": { uz_latn: "To'g'riga yoki chapga harakatlanishga ruxsat. Qayrilishga ham ruxsat.", uz_cyrl: "Тўғрига ёки чапга ҳаракатланишга рухсат. Қайрилишга ҳам рухсат.", ru: "Разрешено движение прямо или налево. Разворот также разрешён." },
  "4.1.6": { uz_latn: "O'ngga yoki chapga burilishga ruxsat. To'g'riga yurish taqiqlangan.", uz_cyrl: "Ўнгга ёки чапга бурилишга рухсат. Тўғрига юриш тақиқланган.", ru: "Разрешён поворот направо или налево. Движение прямо запрещено." },
  "4.2.1": { uz_latn: "Yo'ldagi to'siqni faqat o'ng tomondan chetlab o'tish kerak.", uz_cyrl: "Йўлдаги тўсиқни фақат ўнг томондан четлаб ўтиш керак.", ru: "Препятствие на дороге нужно объезжать только справа." },
  "4.2.2": { uz_latn: "Yo'ldagi to'siqni faqat chap tomondan chetlab o'tish kerak.", uz_cyrl: "Йўлдаги тўсиқни фақат чап томондан четлаб ўтиш керак.", ru: "Препятствие на дороге нужно объезжать только слева." },
  "4.2.3": { uz_latn: "To'siqni ikki tomondan ham chetlab o'tish mumkin.", uz_cyrl: "Тўсиқни икки томондан ҳам четлаб ўтиш мумкин.", ru: "Препятствие можно объезжать с обеих сторон." },
  "4.3": { uz_latn: "Aylanma harakat. Belgida ko'rsatilgan yo'nalishda aylanib o'tish shart.", uz_cyrl: "Айланма ҳаракат. Белгида кўрсатилган йўналишда айланиб ўтиш шарт.", ru: "Круговое движение. Обязателен объезд в направлении, указанном на знаке." },
  "4.4": { uz_latn: "Faqat yengil avtomobillar, avtobuslar va ruxsat etilgan massasi 3,5 tonnagacha yuk avtomobillari harakatlanadi.", uz_cyrl: "Фақат енгил автомобиллар, автобуслар ва рухсат этилган массаси 3,5 тоннагача юк автомобиллари ҳаракатланади.", ru: "Движение только легковых автомобилей, автобусов и грузовых автомобилей разрешённой массой до 3,5 тонны." },
  "4.5": { uz_latn: "Velosiped yo'lkasi. Faqat velosiped va moped harakatlanadi. Piyoda yo'lkasi bo'lmasa, piyodalar ham yurishi mumkin.", uz_cyrl: "Велосипед йўлкаси. Фақат велосипед ва мопед ҳаракатланади. Пиёда йўлкаси бўлмаса, пиёдалар ҳам юриши мумкин.", ru: "Велосипедная дорожка. Движение только велосипедов и мопедов. При отсутствии пешеходной дорожки пешеходы тоже могут идти по ней." },
  "4.6": { uz_latn: "Piyodalar yo'lkasi. Faqat piyodalar harakatlanadi.", uz_cyrl: "Пиёдалар йўлкаси. Фақат пиёдалар ҳаракатланади.", ru: "Пешеходная дорожка. Движение только пешеходов." },
  "4.6.1": { uz_latn: "Piyoda va velosipedchilar birgalikda harakatlanadigan yo'l.", uz_cyrl: "Пиёда ва велосипедчилар биргаликда ҳаракатланадиган йўл.", ru: "Дорога для совместного движения пешеходов и велосипедистов." },
  "4.6.2": { uz_latn: "Piyoda va velosipedchilar birgalikda harakatlanadigan yo'l tugadi.", uz_cyrl: "Пиёда ва велосипедчилар биргаликда ҳаракатланадиган йўл тугади.", ru: "Дорога для совместного движения пешеходов и велосипедистов заканчивается." },
  "4.6.3": { uz_latn: "Piyoda va velosiped harakati alohida ajratilgan yo'l.", uz_cyrl: "Пиёда ва велосипед ҳаракати алоҳида ажратилган йўл.", ru: "Дорога с раздельным движением пешеходов и велосипедов." },
  "4.6.4": { uz_latn: "Ajratilgan piyoda va velosiped yo'li tugadi.", uz_cyrl: "Ажратилган пиёда ва велосипед йўли тугади.", ru: "Дорога с раздельным движением пешеходов и велосипедов заканчивается." },
  "4.6.5": { uz_latn: "Piyoda va velosiped harakati alohida tashkil etilgan yo'lka.", uz_cyrl: "Пиёда ва велосипед ҳаракати алоҳида ташкил этилган йўлка.", ru: "Дорожка с раздельно организованным движением пешеходов и велосипедов." },
  "4.6.6": { uz_latn: "Piyoda va velosiped harakati alohida tashkil etilgan yo'lka tugadi.", uz_cyrl: "Пиёда ва велосипед ҳаракати алоҳида ташкил этилган йўлка тугади.", ru: "Дорожка с раздельным движением пешеходов и велосипедов заканчивается." },
  "4.7": { uz_latn: "Belgida ko'rsatilgan tezlikdan SEKIN yurish taqiqlangan. Sekin harakat oqimga to'sqinlik qiladi.", uz_cyrl: "Белгида кўрсатилган тезликдан СЕКИН юриш тақиқланган. Секин ҳаракат оқимга тўсқинлик қилади.", ru: "Движение со скоростью МЕДЛЕННЕЕ указанной на знаке запрещено. Медленное движение создаёт помехи потоку." },
  "4.8": { uz_latn: "Eng kam tezlik cheklovi tugadi.", uz_cyrl: "Энг кам тезлик чеклови тугади.", ru: "Ограничение минимальной скорости заканчивается." },
  "4.9.1": { uz_latn: "Xavfli yuk tashiyotgan transport faqat to'g'riga harakatlanadi.", uz_cyrl: "Хавфли юк ташиётган транспорт фақат тўғрига ҳаракатланади.", ru: "Транспорт с опасным грузом движется только прямо." },
  "4.9.2": { uz_latn: "Xavfli yuk tashiyotgan transport faqat chapga buriladi.", uz_cyrl: "Хавфли юк ташиётган транспорт фақат чапга бурилади.", ru: "Транспорт с опасным грузом поворачивает только налево." },
  "4.9.3": { uz_latn: "Xavfli yuk tashiyotgan transport faqat o'ngga buriladi.", uz_cyrl: "Хавфли юк ташиётган транспорт фақат ўнгга бурилади.", ru: "Транспорт с опасным грузом поворачивает только направо." },
  "4.10": { uz_latn: "Otda yurish uchun ajratilgan yo'l.", uz_cyrl: "Отда юриш учун ажратилган йўл.", ru: "Дорога, выделенная для верховой езды." },

  // ---- 5. AXBOROT-KO'RSATGICH BELGILAR ----
  // Harakat rejimi, aholi punktlari va yo'l ob'ektlari haqida xabar beradi.

  "5.1": { uz_latn: "Avtomagistral boshlandi. Bu yerda maxsus qoidalar amal qiladi: piyoda, velosiped, traktor va 40 km/soatdan sekin yura oladigan transport taqiqlangan. Orqaga yurish va qayrilish mumkin emas.", uz_cyrl: "Автомагистрал бошланди. Бу ерда махсус қоидалар амал қилади: пиёда, велосипед, трактор ва 40 км/соатдан секин юра оладиган транспорт тақиқланган. Орқага юриш ва қайрилиш мумкин эмас.", ru: "Начинается автомагистраль. Здесь действуют особые правила: пешеходы, велосипеды, тракторы и транспорт со скоростью менее 40 км/ч запрещены. Движение задним ходом и разворот невозможны." },
  "5.2": { uz_latn: "Avtomagistral tugadi. Uning maxsus qoidalari ham tugaydi.", uz_cyrl: "Автомагистрал тугади. Унинг махсус қоидалари ҳам тугайди.", ru: "Автомагистраль заканчивается. Её особые правила тоже перестают действовать." },
  "5.3": { uz_latn: "Avtomobillar uchun mo'ljallangan yo'l. Avtomagistralga o'xshash, lekin qurilishi soddaroq. Piyoda, velosiped va sekin transport taqiqlanadi.", uz_cyrl: "Автомобиллар учун мўлжалланган йўл. Автомагистралга ўхшаш, лекин қурилиши соддароқ. Пиёда, велосипед ва секин транспорт тақиқланади.", ru: "Дорога для автомобилей. Похожа на автомагистраль, но проще по конструкции. Пешеходы, велосипеды и медленный транспорт запрещены." },
  "5.4": { uz_latn: "Avtomobillar uchun mo'ljallangan yo'l tugadi.", uz_cyrl: "Автомобиллар учун мўлжалланган йўл тугади.", ru: "Дорога для автомобилей заканчивается." },
  "5.5": { uz_latn: "Bir tomonlama harakat yo'li. Butun kenglik bo'ylab faqat bir yo'nalishda yuriladi, shuning uchun quvib o'tish ikkala tomondan mumkin.", uz_cyrl: "Бир томонлама ҳаракат йўли. Бутун кенглик бўйлаб фақат бир йўналишда юрилади, шунинг учун қувиб ўтиш иккала томондан мумкин.", ru: "Дорога с односторонним движением. Движение по всей ширине только в одном направлении, поэтому обгон возможен с любой стороны." },
  "5.6": { uz_latn: "Bir tomonlama harakat tugadi. Endi ro'paradan transport kelishi mumkin.", uz_cyrl: "Бир томонлама ҳаракат тугади. Энди рўпарадан транспорт келиши мумкин.", ru: "Одностороннее движение заканчивается. Теперь возможен встречный транспорт." },
  "5.7.1": { uz_latn: "O'ngdagi yo'l bir tomonlama — unga faqat o'ngga burilib kirish mumkin.", uz_cyrl: "Ўнгдаги йўл бир томонлама — унга фақат ўнгга бурилиб кириш мумкин.", ru: "Дорога справа с односторонним движением — въезд на неё возможен только поворотом направо." },
  "5.7.2": { uz_latn: "Chapdagi yo'l bir tomonlama — unga faqat chapga burilib kirish mumkin.", uz_cyrl: "Чапдаги йўл бир томонлама — унга фақат чапга бурилиб кириш мумкин.", ru: "Дорога слева с односторонним движением — въезд на неё возможен только поворотом налево." },
  "5.8.1": { uz_latn: "Har bir bo'lakdan qaysi yo'nalishga yurish mumkinligini ko'rsatadi. Kerakli bo'lakka oldindan o'ting.", uz_cyrl: "Ҳар бир бўлакдан қайси йўналишга юриш мумкинлигини кўрсатади. Керакли бўлакка олдиндан ўтинг.", ru: "Указывает разрешённое направление движения по каждой полосе. Заранее перестройтесь на нужную полосу." },
  "5.8.2": { uz_latn: "Shu bo'lakdan qaysi yo'nalishga yurish mumkinligini ko'rsatadi.", uz_cyrl: "Шу бўлакдан қайси йўналишга юриш мумкинлигини кўрсатади.", ru: "Указывает разрешённое направление движения по данной полосе." },
  "5.8.3": { uz_latn: "Qo'shimcha bo'lak boshlandi (masalan ko'tarilishda sekin transport uchun yoki burilish uchun).", uz_cyrl: "Қўшимча бўлак бошланди (масалан кўтарилишда секин транспорт учун ёки бурилиш учун).", ru: "Начинается дополнительная полоса (например, для медленного транспорта на подъёме или для поворота)." },
  "5.8.4": { uz_latn: "Qo'shimcha bo'lak boshlandi.", uz_cyrl: "Қўшимча бўлак бошланди.", ru: "Начинается дополнительная полоса." },
  "5.8.5": { uz_latn: "Bo'lak tugaydi. Qo'shni bo'lakka oldindan o'ting.", uz_cyrl: "Бўлак тугайди. Қўшни бўлакка олдиндан ўтинг.", ru: "Полоса заканчивается. Заранее перестройтесь на соседнюю полосу." },
  "5.8.7": { uz_latn: "Yo'l kengaydi — bo'laklar bo'yicha harakat yo'nalishlari ko'rsatilgan.", uz_cyrl: "Йўл кенгайди — бўлаклар бўйича ҳаракат йўналишлари кўрсатилган.", ru: "Дорога расширяется — указаны направления движения по полосам." },
  "5.8.8": { uz_latn: "Bo'laklar bo'yicha harakat yo'nalishlari.", uz_cyrl: "Бўлаклар бўйича ҳаракат йўналишлари.", ru: "Направления движения по полосам." },
  "5.8.9": { uz_latn: "Yo'ldagi bo'laklar soni va ularning yo'nalishi.", uz_cyrl: "Йўлдаги бўлаклар сони ва уларнинг йўналиши.", ru: "Количество полос на дороге и их направление." },
  "5.9": { uz_latn: "Belgilangan yo'nalishli transport (avtobus, trolleybus) uchun ajratilgan bo'lak. Boshqa transport bu bo'lakda yura olmaydi.", uz_cyrl: "Белгиланган йўналишли транспорт (автобус, троллейбус) учун ажратилган бўлак. Бошқа транспорт бу бўлакда юра олмайди.", ru: "Полоса, выделенная для маршрутного транспорта (автобус, троллейбус). Другому транспорту движение по ней запрещено." },
  "5.10.1": { uz_latn: "Yo'lda jamoat transporti uchun ajratilgan bo'lak bor — u qarama-qarshi yo'nalishda harakatlanadi.", uz_cyrl: "Йўлда жамоат транспорти учун ажратилган бўлак бор — у қарама-қарши йўналишда ҳаракатланади.", ru: "На дороге есть полоса для общественного транспорта — она движется во встречном направлении." },
  "5.10.2": { uz_latn: "O'ng tomonda jamoat transporti uchun ajratilgan bo'lak bor.", uz_cyrl: "Ўнг томонда жамоат транспорти учун ажратилган бўлак бор.", ru: "Справа есть полоса, выделенная для общественного транспорта." },
  "5.10.3": { uz_latn: "Ikkala tomonda ham jamoat transporti bo'laklari bor.", uz_cyrl: "Иккала томонда ҳам жамоат транспорти бўлаклари бор.", ru: "С обеих сторон есть полосы для общественного транспорта." },
  "5.10.4": { uz_latn: "Jamoat transporti uchun ajratilgan bo'lagi bo'lgan yo'l tugadi.", uz_cyrl: "Жамоат транспорти учун ажратилган бўлаги бўлган йўл тугади.", ru: "Дорога с полосой для общественного транспорта заканчивается." },
  "5.11.1": { uz_latn: "Shu yerda qayrilish (180 daraja burilish) mumkin. Chapga burilish esa taqiqlanadi.", uz_cyrl: "Шу ерда қайрилиш (180 даража бурилиш) мумкин. Чапга бурилиш эса тақиқланади.", ru: "Здесь разрешён разворот (поворот на 180 градусов). Поворот налево запрещён." },
  "5.11.2": { uz_latn: "Qayrilish uchun ajratilgan oraliq. Belgidagi masofa davomida qayrilish mumkin.", uz_cyrl: "Қайрилиш учун ажратилган оралиқ. Белгидаги масофа давомида қайрилиш мумкин.", ru: "Участок, выделенный для разворота. Разворот возможен на протяжении указанного на знаке расстояния." },
  "5.12": { uz_latn: "Avtobus yoki trolleybus bekati. Bekatdan 15 m masofada to'xtash taqiqlanadi (yo'lovchi tushirish/olishdan tashqari).", uz_cyrl: "Автобус ёки троллейбус бекати. Бекатдан 15 м масофада тўхташ тақиқланади (йўловчи тушириш/олишдан ташқари).", ru: "Остановка автобуса или троллейбуса. В радиусе 15 м от остановки стоянка запрещена (кроме высадки/посадки пассажиров)." },
  "5.13": { uz_latn: "Tramvay bekati. Tramvay to'xtaganda yo'lovchilarga yo'l berish shart.", uz_cyrl: "Трамвай бекати. Трамвай тўхтаганда йўловчиларга йўл бериш шарт.", ru: "Трамвайная остановка. При остановке трамвая обязательно уступить дорогу пассажирам." },
  "5.14": { uz_latn: "Taksi to'xtab turish joyi.", uz_cyrl: "Такси тўхтаб туриш жойи.", ru: "Место стоянки такси." },
  "5.15": { uz_latn: "To'xtab turish (stoyanka) joyi.", uz_cyrl: "Тўхтаб туриш (стоянка) жойи.", ru: "Место стоянки." },
  "5.16.1": { uz_latn: "Piyodalar o'tish joyi. Piyodaga yo'l bering, bu yerda quvib o'tish taqiqlanadi.", uz_cyrl: "Пиёдалар ўтиш жойи. Пиёдага йўл беринг, бу ерда қувиб ўтиш тақиқланади.", ru: "Пешеходный переход. Уступите дорогу пешеходам, обгон здесь запрещён." },
  "5.16.2": { uz_latn: "Piyodalar o'tish joyi (chap tomonda o'rnatiladi).", uz_cyrl: "Пиёдалар ўтиш жойи (чап томонда ўрнатилади).", ru: "Пешеходный переход (устанавливается слева)." },
  "5.17.1": { uz_latn: "Piyodalar yer ostidan o'tadi. Bu yerda ular yo'lga chiqmaydi.", uz_cyrl: "Пиёдалар ер остидан ўтади. Бу ерда улар йўлга чиқмайди.", ru: "Пешеходы проходят под землёй. Здесь они не выходят на дорогу." },
  "5.17.2": { uz_latn: "Piyodalarning yer ostidan o'tish joyi.", uz_cyrl: "Пиёдаларнинг ер остидан ўтиш жойи.", ru: "Подземный пешеходный переход." },
  "5.17.3": { uz_latn: "Piyodalar yer ustidagi ko'prikdan o'tadi.", uz_cyrl: "Пиёдалар ер устидаги кўприкдан ўтади.", ru: "Пешеходы проходят по надземному переходу (мосту)." },
  "5.17.4": { uz_latn: "Piyodalarning yer ustidan o'tish joyi.", uz_cyrl: "Пиёдаларнинг ер устидан ўтиш жойи.", ru: "Надземный пешеходный переход." },
  "5.18": { uz_latn: "Shu yo'l qismida tavsiya etiladigan tezlik. Bu majburiy emas, lekin xavfsiz tezlik hisoblanadi.", uz_cyrl: "Шу йўл қисмида тавсия этиладиган тезлик. Бу мажбурий эмас, лекин хавфсиз тезлик ҳисобланади.", ru: "Рекомендуемая скорость на данном участке дороги. Не обязательна, но считается безопасной." },
  "5.19.1": { uz_latn: "Oldinda berk ko'cha — o'tib bo'lmaydi, orqaga qaytishga to'g'ri keladi.", uz_cyrl: "Олдинда берк кўча — ўтиб бўлмайди, орқага қайтишга тўғри келади.", ru: "Впереди тупик — проезда нет, придётся вернуться назад." },
  "5.19.2": { uz_latn: "O'ngdagi yo'l berk.", uz_cyrl: "Ўнгдаги йўл берк.", ru: "Дорога справа — тупик." },
  "5.19.3": { uz_latn: "Chapdagi yo'l berk.", uz_cyrl: "Чапдаги йўл берк.", ru: "Дорога слева — тупик." },
  "5.20.1": { uz_latn: "Oldindagi chorrahada qaysi yo'nalish qayerga olib borishini ko'rsatadi. Kerakli bo'lakka oldindan o'ting.", uz_cyrl: "Олдиндаги чорраҳада қайси йўналиш қаерга олиб боришини кўрсатади. Керакли бўлакка олдиндан ўтинг.", ru: "Показывает, куда ведёт каждое направление на предстоящем перекрёстке. Заранее перестройтесь на нужную полосу." },
  "5.20.2": { uz_latn: "Yo'nalishlarning dastlabki ko'rsatkichi.", uz_cyrl: "Йўналишларнинг дастлабки кўрсаткичи.", ru: "Предварительный указатель направлений." },
  "5.20.3": { uz_latn: "Murakkab chorrahada harakat sxemasi.", uz_cyrl: "Мураккаб чорраҳада ҳаракат схемаси.", ru: "Схема движения на сложном перекрёстке." },
  "5.21.1": { uz_latn: "Ko'rsatilgan yo'nalishda qaysi manzil borligini bildiradi.", uz_cyrl: "Кўрсатилган йўналишда қайси манзил борлигини билдиради.", ru: "Указывает, какой объект находится в данном направлении." },
  "5.21.2": { uz_latn: "Yo'nalishlar va ular olib boradigan manzillar.", uz_cyrl: "Йўналишлар ва улар олиб борадиган манзиллар.", ru: "Направления и объекты, к которым они ведут." },
  "5.22": { uz_latn: "Aholi punkti boshlandi (oq fon). Bu yerda aholi punkti qoidalari ishlaydi: tezlik 70 km/soatgacha, ovoz signali taqiqlanadi.", uz_cyrl: "Аҳоли пункти бошланди (оқ фон). Бу ерда аҳоли пункти қоидалари ишлайди: тезлик 70 км/соатгача, овоз сигнали тақиқланади.", ru: "Начинается населённый пункт (белый фон). Здесь действуют правила для населённых пунктов: скорость до 70 км/ч, звуковой сигнал запрещён." },
  "5.23": { uz_latn: "Aholi punkti tugadi. Endi aholi punktidan tashqaridagi qoidalar amal qiladi.", uz_cyrl: "Аҳоли пункти тугади. Энди аҳоли пунктидан ташқаридаги қоидалар амал қилади.", ru: "Населённый пункт заканчивается. Теперь действуют правила движения вне населённых пунктов." },
  "5.24": { uz_latn: "Aholi punkti boshlandi (ko'k fon). MUHIM FARQ: bu yerda aholi punkti qoidalari ISHLAMAYDI — tezlik yo'l turiga qarab belgilanadi.", uz_cyrl: "Аҳоли пункти бошланди (кўк фон). МУҲИМ ФАРҚ: бу ерда аҳоли пункти қоидалари ИШЛАМАЙДИ — тезлик йўл турига қараб белгиланади.", ru: "Начинается населённый пункт (синий фон). ВАЖНОЕ ОТЛИЧИЕ: правила для населённых пунктов здесь НЕ действуют — скорость определяется типом дороги." },
  "5.25": { uz_latn: "Ko'k fonli aholi punkti tugadi.", uz_cyrl: "Кўк фонли аҳоли пункти тугади.", ru: "Населённый пункт с синим фоном заканчивается." },
  "5.26": { uz_latn: "Yo'l o'tayotgan ob'ekt nomi (daryo, ko'cha, qishloq).", uz_cyrl: "Йўл ўтаётган объэкт номи (дарё, кўча, қишлоқ).", ru: "Название объекта, через который проходит дорога (река, улица, село)." },
  "5.27": { uz_latn: "Yo'ldagi manzillargacha qolgan masofa (km).", uz_cyrl: "Йўлдаги манзилларгача қолган масофа (км).", ru: "Расстояние до объектов на дороге (км)." },
  "5.28": { uz_latn: "Yo'l boshidan hisoblangan kilometr raqami. Avariya yoki nosozlikda joyni aniq aytish uchun foydali.", uz_cyrl: "Йўл бошидан ҳисобланган километр рақами. Авария ёки носозликда жойни аниқ айтиш учун фойдали.", ru: "Номер километра, отсчитываемый от начала дороги. Полезен для точного указания места при аварии или неисправности." },
  "5.29": { uz_latn: "Yo'lga berilgan rasmiy raqam.", uz_cyrl: "Йўлга берилган расмий рақам.", ru: "Официальный номер дороги." },
  "5.30.1": { uz_latn: "Yuk avtomobillari uchun tavsiya etilgan yo'nalish.", uz_cyrl: "Юк автомобиллари учун тавсия этилган йўналиш.", ru: "Рекомендуемое направление для грузовых автомобилей." },
  "5.30.2": { uz_latn: "Yuk avtomobillari uchun harakat yo'nalishi.", uz_cyrl: "Юк автомобиллари учун ҳаракат йўналиши.", ru: "Направление движения для грузовых автомобилей." },
  "5.30.3": { uz_latn: "Yuk avtomobillari uchun harakat yo'nalishi.", uz_cyrl: "Юк автомобиллари учун ҳаракат йўналиши.", ru: "Направление движения для грузовых автомобилей." },
  "5.31": { uz_latn: "Vaqtincha yopilgan yo'l qismini aylanib o'tish sxemasi.", uz_cyrl: "Вақтинча ёпилган йўл қисмини айланиб ўтиш схемаси.", ru: "Схема объезда временно закрытого участка дороги." },
  "5.32.1": { uz_latn: "Yopiq yo'l qismini chetlab o'tish yo'nalishi.", uz_cyrl: "Ёпиқ йўл қисмини четлаб ўтиш йўналиши.", ru: "Направление объезда закрытого участка дороги." },
  "5.32.2": { uz_latn: "Chetlab o'tish yo'nalishi.", uz_cyrl: "Четлаб ўтиш йўналиши.", ru: "Направление объезда." },
  "5.32.3": { uz_latn: "Chetlab o'tish yo'nalishi.", uz_cyrl: "Четлаб ўтиш йўналиши.", ru: "Направление объезда." },
  "5.33": { uz_latn: "Nazorat punkti oldida to'xtash joyi.", uz_cyrl: "Назорат пункти олдида тўхташ жойи.", ru: "Место остановки перед контрольным пунктом." },
  "5.34.1": { uz_latn: "Qarama-qarshi qatnov qismiga o'tish boshlanadi (yo'l ta'mirlanayotganda).", uz_cyrl: "Қарама-қарши қатнов қисмига ўтиш бошланади (йўл таъмирланаётганда).", ru: "Начинается выезд на встречную проезжую часть (при ремонте дороги)." },
  "5.34.2": { uz_latn: "Boshqa qatnov qismiga qayta tizilish ko'rsatkichi.", uz_cyrl: "Бошқа қатнов қисмига қайта тизилиш кўрсаткичи.", ru: "Указатель перестроения на другую проезжую часть." },
  "5.35": { uz_latn: "Reversiv harakat boshlandi — bu bo'lakda yo'nalish kun davomida o'zgaradi. Reversiv svetoforga qarang, u o'chiq bo'lsa bo'lakka kirish taqiqlanadi.", uz_cyrl: "Реверсив ҳаракат бошланди — бу бўлакда йўналиш кун давомида ўзгаради. Реверсив светофорга қаранг, у ўчиқ бўлса бўлакка кириш тақиқланади.", ru: "Начинается реверсивное движение — направление на этой полосе меняется в течение дня. Смотрите на реверсивный светофор: если он выключен, выезд на полосу запрещён." },
  "5.36": { uz_latn: "Reversiv harakat tugadi.", uz_cyrl: "Реверсив ҳаракат тугади.", ru: "Реверсивное движение заканчивается." },
  "5.37": { uz_latn: "Reversiv harakat bo'lagi bo'lgan yo'lga chiqish.", uz_cyrl: "Реверсив ҳаракат бўлаги бўлган йўлга чиқиш.", ru: "Выезд на дорогу с полосой реверсивного движения." },
  "5.38": { uz_latn: "Turar-joy dahasi boshlandi. Bu yerda piyodalarga ustunlik beriladi, tezlik 20 km/soatdan oshmasligi kerak, o'quv haydash va uzoq to'xtab turish taqiqlanadi.", uz_cyrl: "Турар-жой даҳаси бошланди. Бу ерда пиёдаларга устунлик берилади, тезлик 20 км/соатдан ошмаслиги керак, ўқув ҳайдаш ва узоқ тўхтаб туриш тақиқланади.", ru: "Начинается жилая зона. Здесь пешеходы имеют преимущество, скорость не должна превышать 20 км/ч, учебная езда и длительная стоянка запрещены." },
  "5.39": { uz_latn: "Turar-joy dahasi tugadi. Chiqishda barcha transportga yo'l berish shart.", uz_cyrl: "Турар-жой даҳаси тугади. Чиқишда барча транспортга йўл бериш шарт.", ru: "Жилая зона заканчивается. При выезде обязательно уступить дорогу всему транспорту." },
  "5.40": { uz_latn: "Avtomagistralda favqulodda holatlar uchun ajratilgan kirish yo'li.", uz_cyrl: "Автомагистралда фавқулодда ҳолатлар учун ажратилган кириш йўли.", ru: "Съезд на автомагистрали, выделенный для экстренных ситуаций." },
  "5.41": { uz_latn: "Bu yo'l qismida surat va video kuzatuv olib boriladi.", uz_cyrl: "Бу йўл қисмида сурат ва видео кузатув олиб борилади.", ru: "На этом участке дороги ведётся фото- и видеофиксация." },
  "5.42": { uz_latn: "Bu yo'l qismida tezlik radar bilan o'lchanadi.", uz_cyrl: "Бу йўл қисмида тезлик радар билан ўлчанади.", ru: "На этом участке дороги скорость измеряется радаром." },
  "5.43": { uz_latn: "Qizil chiroqda ham o'ngga burilishga ruxsat beruvchi qo'shimcha ko'rsatkich (agar o'ngdan kelayotgan transportga xalaqit bermasangiz).", uz_cyrl: "Қизил чироқда ҳам ўнгга бурилишга рухсат берувчи қўшимча кўрсаткич (агар ўнгдан келаётган транспортга халақит бермасангиз).", ru: "Дополнительная секция, разрешающая поворот направо даже при красном сигнале (если это не создаёт помех транспорту справа)." },
  "5.44": { uz_latn: "Velosipedchilar uchun ajratilgan bo'lak.", uz_cyrl: "Велосипедчилар учун ажратилган бўлак.", ru: "Полоса, выделенная для велосипедистов." },
  "5.45": { uz_latn: "Velosipedchilar uchun ajratilgan bo'lak tugadi.", uz_cyrl: "Велосипедчилар учун ажратилган бўлак тугади.", ru: "Полоса, выделенная для велосипедистов, заканчивается." },

  // ---- 6. SERVIS BELGILARI ----
  // Yo'ldagi xizmat ob'ektlari haqida xabar beradi. Hech narsani taqiqlamaydi
  // va majburlamaydi — faqat ma'lumot.

  "6.1": { uz_latn: "Yaqin atrofda tibbiy yordam punkti bor.", uz_cyrl: "Яқин атрофда тиббий ёрдам пункти бор.", ru: "Поблизости есть пункт медицинской помощи." },
  "6.2": { uz_latn: "Yaqin atrofda shifoxona bor.", uz_cyrl: "Яқин атрофда шифохона бор.", ru: "Поблизости есть больница." },
  "6.3": { uz_latn: "Yonilg'i quyish shaxobchasi (zapravka).", uz_cyrl: "Ёнилғи қуйиш шахобчаси (заправка).", ru: "Автозаправочная станция." },
  "6.4": { uz_latn: "Avtomobilga texnik xizmat ko'rsatish joyi (avtoservis).", uz_cyrl: "Автомобилга техник хизмат кўрсатиш жойи (автосервис).", ru: "Пункт технического обслуживания автомобилей (автосервис)." },
  "6.5": { uz_latn: "Avtomobil yuvish joyi.", uz_cyrl: "Автомобил ювиш жойи.", ru: "Автомойка." },
  "6.6": { uz_latn: "Telefon aloqasi punkti.", uz_cyrl: "Телефон алоқаси пункти.", ru: "Пункт телефонной связи." },
  "6.7": { uz_latn: "Ovqatlanish joyi (oshxona, kafe).", uz_cyrl: "Овқатланиш жойи (ошхона, кафе).", ru: "Пункт питания (столовая, кафе)." },
  "6.8": { uz_latn: "Ichimlik suvi olish mumkin bo'lgan joy.", uz_cyrl: "Ичимлик суви олиш мумкин бўлган жой.", ru: "Место, где можно набрать питьевую воду." },
  "6.9": { uz_latn: "Mehmonxona yoki tunash joyi.", uz_cyrl: "Меҳмонхона ёки тунаш жойи.", ru: "Гостиница или место для ночлега." },
  "6.10": { uz_latn: "Kemping — chodir tikib dam olish uchun jihozlangan joy.", uz_cyrl: "Кемпинг — чодир тикиб дам олиш учун жиҳозланган жой.", ru: "Кемпинг — оборудованное место для отдыха с палатками." },
  "6.11": { uz_latn: "Dam olish joyi. Uzoq yo'lda charchoqni yozish uchun to'xtash tavsiya etiladi.", uz_cyrl: "Дам олиш жойи. Узоқ йўлда чарчоқни ёзиш учун тўхташ тавсия этилади.", ru: "Место отдыха. Рекомендуется остановка для отдыха при длительной поездке." },
  "6.12": { uz_latn: "Yo'l patrul xizmati (YPX) posti.", uz_cyrl: "Йўл патрул хизмати (ЙПХ) пости.", ru: "Пост дорожно-патрульной службы (ДПС)." },
  "6.13": { uz_latn: "Xalqaro yuk tashish nazorat punkti.", uz_cyrl: "Халқаро юк ташиш назорат пункти.", ru: "Контрольный пункт международных грузоперевозок." },
  "6.14": { uz_latn: "Hojatxona.", uz_cyrl: "Ҳожатхона.", ru: "Туалет." },
  "6.15": { uz_latn: "Axlat tashlash joyi.", uz_cyrl: "Ахлат ташлаш жойи.", ru: "Место сбора мусора." },
  "6.16": { uz_latn: "Basseyn yoki cho'milish mumkin bo'lgan sohil.", uz_cyrl: "Бассейн ёки чўмилиш мумкин бўлган соҳил.", ru: "Бассейн или пляж для купания." },
  "6.17": { uz_latn: "Politsiya bo'limi.", uz_cyrl: "Полиция бўлими.", ru: "Отделение полиции." },

  // ---- 7. QO'SHIMCHA AXBOROT BELGILARI (TAXTACHALAR) ----
  //
  // MUHIM: bular MUSTAQIL EMAS — har doim asosiy belgi bilan birga
  // o'rnatiladi va uning ta'sirini ANIQLASHTIRADI yoki CHEKLAYDI.
  // Yolg'iz o'zi hech narsa bildirmaydi.

  "7.1.1": { uz_latn: "Asosiy belgi ta'sir qiladigan joygacha qancha masofa qolganini bildiradi.", uz_cyrl: "Асосий белги таъсир қиладиган жойгача қанча масофа қолганини билдиради.", ru: "Указывает расстояние до места действия основного знака." },
  "7.1.2": { uz_latn: "Temir yo'l kesishmasigacha bo'lgan masofa.", uz_cyrl: "Темир йўл кесишмасигача бўлган масофа.", ru: "Расстояние до железнодорожного переезда." },
  "7.1.3": { uz_latn: "Yon tomondagi ob'ektgacha bo'lgan masofa.", uz_cyrl: "Ён томондаги объэктгача бўлган масофа.", ru: "Расстояние до объекта сбоку." },
  "7.1.4": { uz_latn: "Yo'ldan chetdagi ob'ektgacha bo'lgan masofa.", uz_cyrl: "Йўлдан четдаги объэктгача бўлган масофа.", ru: "Расстояние до объекта в стороне от дороги." },
  "7.2.1": { uz_latn: "Belgi qancha masofada amal qilishini bildiradi (masalan «500 m»).", uz_cyrl: "Белги қанча масофада амал қилишини билдиради (масалан «500 м»).", ru: "Указывает протяжённость действия знака (например, «500 м»)." },
  "7.2.2": { uz_latn: "To'xtash yoki to'xtab turish taqiqining BOSHLANISHI.", uz_cyrl: "Тўхташ ёки тўхтаб туриш тақиқининг БОШЛАНИШИ.", ru: "НАЧАЛО зоны запрета остановки или стоянки." },
  "7.2.3": { uz_latn: "Taqiq oralig'ining OXIRI.", uz_cyrl: "Тақиқ оралиғининг ОХИРИ.", ru: "КОНЕЦ зоны запрета." },
  "7.2.4": { uz_latn: "Siz taqiq oralig'ining ICHIDASIZ.", uz_cyrl: "Сиз тақиқ оралиғининг ИЧИДАСИЗ.", ru: "Вы НАХОДИТЕСЬ внутри зоны запрета." },
  "7.2.5": { uz_latn: "Taqiq shu tomonga (yo'l chetiga) qarab amal qiladi.", uz_cyrl: "Тақиқ шу томонга (йўл четига) қараб амал қилади.", ru: "Запрет действует в сторону, куда указывает знак (к краю дороги)." },
  "7.2.6": { uz_latn: "Taqiq oralig'i — maydon chetigacha davom etadi.", uz_cyrl: "Тақиқ оралиғи — майдон четигача давом этади.", ru: "Зона запрета продолжается до края площадки." },
  "7.3.1": { uz_latn: "Belgi CHAPGA qarab ta'sir qiladi.", uz_cyrl: "Белги ЧАПГА қараб таъсир қилади.", ru: "Знак действует в сторону НАЛЕВО." },
  "7.3.2": { uz_latn: "Belgi O'NGGA qarab ta'sir qiladi.", uz_cyrl: "Белги ЎНГГА қараб таъсир қилади.", ru: "Знак действует в сторону НАПРАВО." },
  "7.3.3": { uz_latn: "Belgi ikkala tomonga ham ta'sir qiladi.", uz_cyrl: "Белги иккала томонга ҳам таъсир қилади.", ru: "Знак действует в обе стороны." },
  "7.4.1": { uz_latn: "Belgi FAQAT yuk avtomobillariga tegishli (3,5 tonnadan og'ir).", uz_cyrl: "Белги ФАҚАТ юк автомобилларига тегишли (3,5 тоннадан оғир).", ru: "Знак относится ТОЛЬКО к грузовым автомобилям (тяжелее 3,5 тонны)." },
  "7.4.2": { uz_latn: "Belgi faqat yengil avtomobillarga tegishli.", uz_cyrl: "Белги фақат енгил автомобилларга тегишли.", ru: "Знак относится только к легковым автомобилям." },
  "7.4.3": { uz_latn: "Belgi faqat avtobuslarga tegishli.", uz_cyrl: "Белги фақат автобусларга тегишли.", ru: "Знак относится только к автобусам." },
  "7.4.4": { uz_latn: "Belgi faqat tirkamali transportga tegishli.", uz_cyrl: "Белги фақат тиркамали транспортга тегишли.", ru: "Знак относится только к транспорту с прицепом." },
  "7.4.5": { uz_latn: "Belgi faqat traktor va o'ziyurar mashinalarga tegishli.", uz_cyrl: "Белги фақат трактор ва ўзиюрар машиналарга тегишли.", ru: "Знак относится только к тракторам и самоходным машинам." },
  "7.4.6": { uz_latn: "Belgi faqat mototsikllarga tegishli.", uz_cyrl: "Белги фақат мототсиклларга тегишли.", ru: "Знак относится только к мотоциклам." },
  "7.4.7": { uz_latn: "Belgi faqat velosipedlarga tegishli.", uz_cyrl: "Белги фақат велосипедларга тегишли.", ru: "Знак относится только к велосипедам." },
  "7.4.8": { uz_latn: "Belgi faqat xavfli yuk tashiyotgan transportga tegishli.", uz_cyrl: "Белги фақат хавфли юк ташиётган транспортга тегишли.", ru: "Знак относится только к транспорту, перевозящему опасный груз." },
  "7.5.1": { uz_latn: "Belgi FAQAT dam olish va bayram kunlari amal qiladi.", uz_cyrl: "Белги ФАҚАТ дам олиш ва байрам кунлари амал қилади.", ru: "Знак действует ТОЛЬКО в выходные и праздничные дни." },
  "7.5.2": { uz_latn: "Belgi FAQAT ish kunlari amal qiladi.", uz_cyrl: "Белги ФАҚАТ иш кунлари амал қилади.", ru: "Знак действует ТОЛЬКО в рабочие дни." },
  "7.5.3": { uz_latn: "Belgi ko'rsatilgan hafta kunlarida amal qiladi.", uz_cyrl: "Белги кўрсатилган ҳафта кунларида амал қилади.", ru: "Знак действует в указанные дни недели." },
  "7.5.4": { uz_latn: "Belgi kun davomida ko'rsatilgan soatlarda amal qiladi.", uz_cyrl: "Белги кун давомида кўрсатилган соатларда амал қилади.", ru: "Знак действует в указанные часы в течение дня." },
  "7.5.5": { uz_latn: "Ish kunlari, ko'rsatilgan vaqtda amal qiladi.", uz_cyrl: "Иш кунлари, кўрсатилган вақтда амал қилади.", ru: "Действует в рабочие дни в указанное время." },
  "7.5.6": { uz_latn: "Dam olish kunlari, ko'rsatilgan vaqtda amal qiladi.", uz_cyrl: "Дам олиш кунлари, кўрсатилган вақтда амал қилади.", ru: "Действует в выходные дни в указанное время." },
  "7.5.7": { uz_latn: "Belgilangan hafta kunlari va soatlarda amal qiladi.", uz_cyrl: "Белгиланган ҳафта кунлари ва соатларда амал қилади.", ru: "Действует в установленные дни недели и часы." },
  "7.6.1": { uz_latn: "Avtomobilni yo'l chetiga PARALLEL qo'yish kerak (barcha g'ildiraklar qatnov qismida).", uz_cyrl: "Автомобилни йўл четига ПАРАЛЛЕЛ қўйиш керак (барча ғилдираклар қатнов қисмида).", ru: "Автомобиль нужно ставить ПАРАЛЛЕЛЬНО краю дороги (все колёса на проезжей части)." },
  "7.6.2": { uz_latn: "Avtomobilni trotuar chetiga yonlab qo'yish usuli.", uz_cyrl: "Автомобилни тротуар четига ёнлаб қўйиш усули.", ru: "Способ постановки автомобиля боком к краю тротуара." },
  "7.6.3": { uz_latn: "Avtomobilni trotuarga qisman chiqarib qo'yish usuli.", uz_cyrl: "Автомобилни тротуарга қисман чиқариб қўйиш усули.", ru: "Способ постановки автомобиля с частичным заездом на тротуар." },
  "7.6.4": { uz_latn: "Avtomobilni to'liq trotuarga chiqarib qo'yish usuli.", uz_cyrl: "Автомобилни тўлиқ тротуарга чиқариб қўйиш усули.", ru: "Способ постановки автомобиля с полным заездом на тротуар." },
  "7.6.5": { uz_latn: "Avtomobilni burchak ostida qo'yish usuli.", uz_cyrl: "Автомобилни бурчак остида қўйиш усули.", ru: "Способ постановки автомобиля под углом." },
  "7.6.6": { uz_latn: "Trotuarga qisman chiqarib, burchak ostida qo'yish.", uz_cyrl: "Тротуарга қисман чиқариб, бурчак остида қўйиш.", ru: "Постановка под углом с частичным заездом на тротуар." },
  "7.6.7": { uz_latn: "Trotuarga chiqarib qo'yish usuli.", uz_cyrl: "Тротуарга чиқариб қўйиш усули.", ru: "Способ постановки автомобиля с заездом на тротуар." },
  "7.6.8": { uz_latn: "Avtomobilni qo'yish usuli (sxema bo'yicha).", uz_cyrl: "Автомобилни қўйиш усули (схема бўйича).", ru: "Способ постановки автомобиля (согласно схеме)." },
  "7.7": { uz_latn: "Yurgizgichni (dvigatelni) o'chirib to'xtab turish kerak.", uz_cyrl: "Юргизгични (двигателни) ўчириб тўхтаб туриш керак.", ru: "На стоянке необходимо выключить двигатель." },
  "7.8": { uz_latn: "Xizmat pullik (masalan pullik to'xtab turish).", uz_cyrl: "Хизмат пуллик (масалан пуллик тўхтаб туриш).", ru: "Услуга платная (например, платная стоянка)." },
  "7.9": { uz_latn: "To'xtab turish vaqti cheklangan — belgidagi muddatdan ortiq turish mumkin emas.", uz_cyrl: "Тўхтаб туриш вақти чекланган — белгидаги муддатдан ортиқ туриш мумкин эмас.", ru: "Время стоянки ограничено — нельзя стоять дольше срока, указанного на знаке." },
  "7.10": { uz_latn: "Avtomobilni texnik ko'rikdan o'tkazish joyi.", uz_cyrl: "Автомобилни техник кўрикдан ўтказиш жойи.", ru: "Место прохождения технического осмотра автомобиля." },
  "7.11": { uz_latn: "Belgi faqat ko'rsatilgan vazndan og'ir transportga tegishli.", uz_cyrl: "Белги фақат кўрсатилган вазндан оғир транспортга тегишли.", ru: "Знак относится только к транспорту тяжелее указанной массы." },
  "7.12": { uz_latn: "Yo'l yoqasi xavfli — chetga chiqish tavsiya etilmaydi.", uz_cyrl: "Йўл ёқаси хавфли — четга чиқиш тавсия этилмайди.", ru: "Обочина опасна — съезд на неё не рекомендуется." },
  "7.13": { uz_latn: "Chorrahada asosiy yo'l qaysi yo'nalishda davom etishini ko'rsatadi. Ustunlikni to'g'ri aniqlash uchun MUHIM.", uz_cyrl: "Чорраҳада асосий йўл қайси йўналишда давом этишини кўрсатади. Устунликни тўғри аниқлаш учун МУҲИМ.", ru: "Показывает, в каком направлении продолжается главная дорога на перекрёстке. ВАЖНО для правильного определения приоритета." },
  "7.14": { uz_latn: "Belgi qaysi bo'lakka tegishli ekanini ko'rsatadi.", uz_cyrl: "Белги қайси бўлакка тегишли эканини кўрсатади.", ru: "Указывает, к какой полосе относится знак." },
  "7.15": { uz_latn: "Ko'zi ojiz piyodalar o'tishi mumkin — alohida ehtiyot bo'ling.", uz_cyrl: "Кўзи ожиз пиёдалар ўтиши мумкин — алоҳида эҳтиёт бўлинг.", ru: "Возможен переход слепых пешеходов — будьте особенно внимательны." },
  "7.16": { uz_latn: "Belgi FAQAT yo'l qoplamasi nam bo'lganda amal qiladi.", uz_cyrl: "Белги ФАҚАТ йўл қопламаси нам бўлганда амал қилади.", ru: "Знак действует ТОЛЬКО при влажном дорожном покрытии." },
  "7.17": { uz_latn: "Joy nogironlar uchun ajratilgan.", uz_cyrl: "Жой ногиронлар учун ажратилган.", ru: "Место выделено для инвалидов." },
  "7.18": { uz_latn: "Taqiq nogironlarga TEGISHLI EMAS — ular uchun ruxsat.", uz_cyrl: "Тақиқ ногиронларга ТЕГИШЛИ ЭМАС — улар учун рухсат.", ru: "Запрет НЕ РАСПРОСТРАНЯЕТСЯ на инвалидов — для них разрешено." },
  "7.19": { uz_latn: "Chorrahada video kuzatuv kamerasi ishlaydi.", uz_cyrl: "Чорраҳада видео кузатув камераси ишлайди.", ru: "На перекрёстке работает камера видеонаблюдения." },
  "7.20": { uz_latn: "Belgi 4.3 va 6.7 sinfdagi xavfli yuk tashiydigan transportga tegishli.", uz_cyrl: "Белги 4.3 ва 6.7 синфдаги хавфли юк ташийдиган транспортга тегишли.", ru: "Знак относится к транспорту, перевозящему опасные грузы классов 4.3 и 6.7." },
  "7.21": { uz_latn: "Qoidabuzar transport evakuator bilan olib ketiladi.", uz_cyrl: "Қоидабузар транспорт эвакуатор билан олиб кетилади.", ru: "Транспорт нарушителя будет эвакуирован." },
  "7.21.1": { uz_latn: "Belgi faqat avtobuslarga tegishli.", uz_cyrl: "Белги фақат автобусларга тегишли.", ru: "Знак относится только к автобусам." },
  "7.21.2": { uz_latn: "Belgi faqat trolleybuslarga tegishli.", uz_cyrl: "Белги фақат троллейбусларга тегишли.", ru: "Знак относится только к троллейбусам." },
  "7.21.3": { uz_latn: "Belgi faqat tramvaylarga tegishli.", uz_cyrl: "Белги фақат трамвайларга тегишли.", ru: "Знак относится только к трамваям." },
  "7.22": { uz_latn: "Yo'lda to'siq bor — chetlab o'tish kerak.", uz_cyrl: "Йўлда тўсиқ бор — четлаб ўтиш керак.", ru: "На дороге препятствие — нужно объехать." },
};

/** Belgi izohi bor-yo'qligini tekshiradi */
export function hasSignDescription(code) {
  return Boolean(code && SIGN_DESCRIPTIONS[code]);
}

/** Izohni berilgan tilda qaytaradi (topilmasa uz_latn'ga tushadi), umuman bo'lmasa null */
export function getSignDescription(code, lang = "uz_latn") {
  const entry = code && SIGN_DESCRIPTIONS[code];
  if (!entry) return null;
  return entry[lang] || entry.uz_latn || null;
}
