process.env.APP_TZ_OFFSET_MINUTES = '300';
const { prisma } = await import('../src/db.js');
const svc = await import('../src/services/examService.js');
const { getQuestionsByIds } = await import('../../shared/data/officialExam.js');

let pass=0, fail=0;
function check(n,c){ if(c){pass++;console.log('  OK  '+n)}else{fail++;console.log('  FAIL '+n)} }

const freeUser = { id: 1, isPremium: false, name: 'Test User' };
const premiumUser = { id: 2, isPremium: true, name: 'Premium User' };

console.log('--- Imtihon boshlash ---');
const { attempt, resumed } = await svc.startExam(freeUser);
check('imtihon yaratildi', attempt && attempt.status === 'IN_PROGRESS');
check('resumed=false', resumed === false);
check('seed saqlandi', Number.isInteger(attempt.questionSeed));
check('20 ta savol ID saqlandi', JSON.parse(attempt.questionIds).length === 20);
check('expiresAt = start + 20 daq', Math.round((attempt.expiresAt - attempt.startedAt)/1000) === 1200);

console.log('--- KRITIK: javoblar frontendga ketmasligi ---');
const pub = svc.serializeActiveExam(attempt);
const raw = JSON.stringify(pub);
check('20 ta public savol', pub.questions.length === 20);
check('hech bir savolda `correct` yo\'q', pub.questions.every(q => q.correct === undefined));
check('hech bir savolda `correctIndex` yo\'q', pub.questions.every(q => q.correctIndex === undefined));
check('serialized JSON da "correct" kalit yo\'q', !raw.includes('"correct"'));
check('secondsLeft bor', typeof pub.secondsLeft === 'number' && pub.secondsLeft > 1190);

console.log('--- Ikkinchi start faol imtihonni qaytaradi ---');
const second = await svc.startExam(freeUser);
check('yangi imtihon yaratilmadi', second.attempt.id === attempt.id && second.resumed === true);

console.log('--- Javob saqlash ---');
const ids = JSON.parse(attempt.questionIds);
const realQuestions = getQuestionsByIds(ids);
let r = await svc.saveAnswer(freeUser.id, attempt.id, { questionIndex: 0, chosenIndex: realQuestions[0].correct });
check('javob saqlandi', r.answeredCount === 1);
r = await svc.saveAnswer(freeUser.id, attempt.id, { questionIndex: 0, chosenIndex: null });
check('javob bekor qilindi', r.answeredCount === 0);

console.log('--- Validatsiya ---');
try { await svc.saveAnswer(freeUser.id, attempt.id, { questionIndex: 99, chosenIndex: 0 }); check('savol indeksi tekshiriladi', false); }
catch(e){ check('savol indeksi tekshiriladi', e.code === 'invalid_question'); }
try { await svc.saveAnswer(freeUser.id, attempt.id, { questionIndex: 0, chosenIndex: 9 }); check('variant tekshiriladi', false); }
catch(e){ check('variant tekshiriladi', e.code === 'invalid_option'); }
try { await svc.saveAnswer(999, attempt.id, { questionIndex: 0, chosenIndex: 0 }); check('boshqa foydalanuvchi javob bera olmaydi', false); }
catch(e){ check('boshqa foydalanuvchi javob bera olmaydi', e.code === 'not_found'); }

console.log('--- Baholash: 18/20 o\'tadi ---');
for (let i=0;i<18;i++) await svc.saveAnswer(freeUser.id, attempt.id, { questionIndex:i, chosenIndex: realQuestions[i].correct });
for (let i=18;i<20;i++) await svc.saveAnswer(freeUser.id, attempt.id, { questionIndex:i, chosenIndex: (realQuestions[i].correct+1)%4 });
const res = await svc.submitExam(freeUser.id, attempt.id);
check('18 to\'g\'ri', res.correctCount === 18);
check('2 xato', res.wrongCount === 2);
check('PASSED', res.passed === true);
check('aniqlik 90%', res.accuracyPct === 90);
check('davomiylik yozildi', typeof res.durationSec === 'number');

console.log('--- Umumiy statistikaga yozildi (Attempt jadvali) ---');
check('Attempt yozuvi yaratildi', prisma._db.attempt.length === 1);
check('type=EXAM', prisma._db.attempt[0].type === 'EXAM');
check('natija mos', prisma._db.attempt[0].correctCount === 18 && prisma._db.attempt[0].passed === true);

console.log('--- Hodisalar yozildi ---');
const types = prisma._db.examEvent.map(e=>e.type);
check('CREATED yozildi', types.includes('CREATED'));
check('SUBMITTED yozildi', types.includes('SUBMITTED'));

console.log('--- Review faqat yakunlangandan keyin ---');
const review = await svc.getExamReview(freeUser.id, attempt.id);
check('20 ta savol qaytdi', review.questions.length === 20);
check('to\'g\'ri javob endi ko\'rinadi', review.questions.every(q => Number.isInteger(q.correctIndex)));
check('explanation maydoni bor (null)', review.questions[0].explanation === null);
check('birinchi 18 to\'g\'ri belgilangan', review.questions.slice(0,18).every(q=>q.isCorrect===true));
check('oxirgi 2 xato belgilangan', review.questions.slice(18).every(q=>q.isCorrect===false));

console.log('--- Kunlik limit (bepul foydalanuvchi) ---');
let elig = await svc.checkEligibility(freeUser);
check('1 ta ishlatildi', elig.usedToday === 1);
check('qolgani 0', elig.remaining === 0);
check('boshlay olmaydi', elig.canStart === false);
try { await svc.startExam(freeUser); check('limit bloklaydi', false); }
catch(e){ check('limit bloklaydi', e.code === 'daily_limit_reached'); }

console.log('--- Premium cheksiz ---');
elig = await svc.checkEligibility(premiumUser);
check('premium: cheksiz', elig.canStart === true && elig.dailyLimit === null);
const p1 = await svc.startExam(premiumUser);
await svc.submitExam(premiumUser.id, p1.attempt.id);
const p2 = await svc.startExam(premiumUser);
check('premium ikkinchi imtihon boshlay oladi', p2.attempt.id !== p1.attempt.id);

console.log(''); console.log(pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
