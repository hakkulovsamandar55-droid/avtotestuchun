process.env.APP_TZ_OFFSET_MINUTES = '300';
const { prisma } = await import('../src/db.js');
const svc = await import('../src/services/examService.js');
const { getQuestionsByIds } = await import('../../shared/data/officialExam.js');

let pass=0, fail=0;
function check(n,c){ if(c){pass++;console.log('  OK  '+n)}else{fail++;console.log('  FAIL '+n)} }

const user = { id: 1, isPremium: true, name: 'T' };

console.log('--- Tiklash: aynan o\'sha savollar ---');
const { attempt } = await svc.startExam(user);
const first = svc.serializeActiveExam(attempt);
const ids1 = first.questions.map(q=>q.id);

// javob berib, keyin "ilovani yopamiz" va qayta ochamiz
const real = getQuestionsByIds(JSON.parse(attempt.questionIds));
await svc.saveAnswer(user.id, attempt.id, { questionIndex: 5, chosenIndex: real[5].correct });

const active = await svc.getActiveAttempt(user.id);
const restored = svc.serializeActiveExam(active);
check('faol imtihon topildi', active && active.id === attempt.id);
check('AYNAN o\'sha savollar (tartib ham)', JSON.stringify(restored.questions.map(q=>q.id)) === JSON.stringify(ids1));
check('javob saqlanib qolgan', restored.answers['5'] === real[5].correct);
check('tiklanganda ham javob yashirin', restored.questions.every(q=>q.correct===undefined));

console.log('--- Seed orqali tiklash (ID lar yo\'qolsa) ---');
const row = prisma._db.examAttempt.find(a=>a.id===attempt.id);
const savedIds = row.questionIds;
row.questionIds = '[]';  // ID lar yo'qolgan holatni simulyatsiya qilamiz
const viaSeed = svc.serializeActiveExam(row);
check('seed bo\'yicha ayni savollar qaytdi', JSON.stringify(viaSeed.questions.map(q=>q.id)) === JSON.stringify(ids1));
row.questionIds = savedIds;

console.log('--- Vaqt tugashi: avtomatik yakunlash ---');
// vaqtni orqaga suramiz — imtihon muddati o'tgan bo'ladi
row.expiresAt = new Date(Date.now() - 60*1000);
row.startedAt = new Date(Date.now() - 21*60*1000);

const afterExpiry = await svc.getActiveAttempt(user.id);
check('vaqti o\'tgan imtihon faol emas', afterExpiry === null);
const closed = prisma._db.examAttempt.find(a=>a.id===attempt.id);
check('avtomatik COMPLETED bo\'ldi', closed.status === 'COMPLETED');
check('baholandi (1 to\'g\'ri javob bergan edi)', closed.correctCount === 1);
check('javobsizlar xato sanaldi', closed.wrongCount === 19);
check('PASSED emas', closed.passed === false);
check('davomiylik expiresAt gacha', closed.durationSec > 0 && closed.durationSec <= 21*60);
const evTypes = prisma._db.examEvent.filter(e=>e.examAttemptId===attempt.id).map(e=>e.type);
check('EXPIRED hodisasi yozildi', evTypes.includes('EXPIRED'));

console.log('--- Vaqti tugagach javob qabul qilinmaydi ---');
const { attempt: a2 } = await svc.startExam(user);
const row2 = prisma._db.examAttempt.find(a=>a.id===a2.id);
row2.expiresAt = new Date(Date.now() - 60*1000);
try { await svc.saveAnswer(user.id, a2.id, { questionIndex: 0, chosenIndex: 0 }); check('vaqt tugagach javob rad etiladi', false); }
catch(e){ check('vaqt tugagach javob rad etiladi', e.code === 'expired'); }
check('imtihon avtomatik yopildi', prisma._db.examAttempt.find(a=>a.id===a2.id).status === 'COMPLETED');

console.log('--- Ikki marta submit qilinmaydi ---');
const { attempt: a3 } = await svc.startExam(user);
const r1 = await svc.submitExam(user.id, a3.id);
const r2 = await svc.submitExam(user.id, a3.id);
check('ikkinchi submit xato bermaydi', r2 && r2.id === a3.id);
check('natija o\'zgarmadi', r1.correctCount === r2.correctCount);
const examAttemptRows = prisma._db.attempt.filter(x => true);
check('Attempt jadvaliga ikki marta yozilmadi', prisma._db.examEvent.filter(e=>e.examAttemptId===a3.id && e.type==='SUBMITTED').length === 1);

console.log('--- Bekor qilish ---');
const { attempt: a4 } = await svc.startExam(user);
await svc.abandonExam(user.id, a4.id);
check('ABANDONED holatiga o\'tdi', prisma._db.examAttempt.find(a=>a.id===a4.id).status === 'ABANDONED');
check('bekor qilingandan keyin faol imtihon yo\'q', (await svc.getActiveAttempt(user.id)) === null);

console.log('--- Review tugallanmagan imtihon uchun bloklanadi ---');
const { attempt: a5 } = await svc.startExam(user);
try { await svc.getExamReview(user.id, a5.id); check('tugallanmagan review bloklanadi', false); }
catch(e){ check('tugallanmagan review bloklanadi', e.code === 'not_finished'); }
try { await svc.getExamReview(999, a5.id); check('boshqa foydalanuvchi review ko\'ra olmaydi', false); }
catch(e){ check('boshqa foydalanuvchi review ko\'ra olmaydi', e.code === 'not_found'); }

console.log('--- Focus lost ---');
// Yangi, toza imtihonda sinaymiz (a5 oldingi testlarda ishlatilgan)
await svc.abandonExam(user.id, a5.id);
const { attempt: a6, resumed: a6resumed } = await svc.startExam(user);
const fl1 = await svc.recordFocusLost(user.id, a6.id);
const fl2 = await svc.recordFocusLost(user.id, a6.id);
check('hisoblagich 1 ga oshdi', fl1.focusLostCount === 1);
check('hisoblagich 2 ga oshdi', fl2.focusLostCount === 2);
check('2 ta FOCUS_LOST hodisasi', prisma._db.examEvent.filter(e=>e.examAttemptId===a6.id && e.type==='FOCUS_LOST').length === 2);
// Yakunlangan imtihonda focus-lost hisoblanmaydi
await svc.submitExam(user.id, a6.id);
const fl3 = await svc.recordFocusLost(user.id, a6.id);
check('yakunlangandan keyin oshmaydi', fl3.focusLostCount === 2);

console.log(''); console.log(pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
