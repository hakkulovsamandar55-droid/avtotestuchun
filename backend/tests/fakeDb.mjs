// Minimal in-memory Prisma o'rnini bosuvchi — examService mantiqini
// haqiqiy DB'siz uchdan-uchgacha sinash uchun.
export function createFakeDb() {
  const db = { examAttempt: [], examEvent: [], attempt: [], activityLog: [], user: [] };
  let ids = { examAttempt: 1, examEvent: 1, attempt: 1, activityLog: 1 };

  const matches = (row, where) => {
    for (const [k, v] of Object.entries(where || {})) {
      if (v === undefined) continue;
      if (v && typeof v === 'object' && !(v instanceof Date)) {
        if ('gte' in v && !(row[k] >= v.gte)) return false;
        if ('gt' in v && !(row[k] > v.gt)) return false;
        if ('lt' in v && !(row[k] < v.lt)) return false;
        if ('in' in v && !v.in.includes(row[k])) return false;
      } else if (row[k] !== v) return false;
    }
    return true;
  };

  const model = (name) => ({
    create: async ({ data }) => {
      const defaults = name === 'examAttempt' ? { focusLostCount: 0, status: 'IN_PROGRESS', answers: '{}', examVersion: 1 } : {};
      const row = { id: ids[name]++, ...defaults, ...data };
      db[name].push(row); return row;
    },
    findUnique: async ({ where }) => db[name].find(r => r.id === where.id) || null,
    findFirst: async ({ where, orderBy }) => {
      let rows = db[name].filter(r => matches(r, where));
      return rows[0] || null;
    },
    findMany: async ({ where, take }) => {
      let rows = db[name].filter(r => matches(r, where));
      return take ? rows.slice(0, take) : rows;
    },
    count: async ({ where }) => db[name].filter(r => matches(r, where)).length,
    update: async ({ where, data, select }) => {
      const row = db[name].find(r => r.id === where.id);
      if (!row) throw new Error('not found');
      for (const [k, v] of Object.entries(data)) {
        if (v && typeof v === 'object' && 'increment' in v) row[k] = (row[k] || 0) + v.increment;
        else row[k] = v;
      }
      // Haqiqiy Prisma kabi: NUSXA qaytaramiz (havola emas) va select ni hurmat qilamiz
      if (select) {
        const out = {};
        for (const k of Object.keys(select)) if (select[k]) out[k] = row[k];
        return out;
      }
      return { ...row };
    },
    updateMany: async ({ where, data }) => {
      const rows = db[name].filter(r => matches(r, where));
      rows.forEach(row => { for (const [k, v] of Object.entries(data)) row[k] = v; });
      return { count: rows.length };
    },
    aggregate: async () => ({ _count: { _all: 0 }, _avg: {}, _sum: {} }),
  });

  return {
    _db: db,
    examAttempt: model('examAttempt'),
    examEvent: model('examEvent'),
    attempt: model('attempt'),
    activityLog: model('activityLog'),
    user: model('user'),
  };
}
