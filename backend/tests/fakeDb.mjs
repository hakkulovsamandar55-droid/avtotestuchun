// Minimal in-memory Prisma o'rnini bosuvchi — servis mantiqini haqiqiy
// DB'siz uchdan-uchgacha sinash uchun.
export function createFakeDb() {
  const db = {
    examAttempt: [], examEvent: [], attempt: [], activityLog: [], user: [],
    school: [], group: [], membership: [], invitation: [], homework: [],
    homeworkSubmission: [],
  };
  let ids = {
    examAttempt: 1, examEvent: 1, attempt: 1, activityLog: 1,
    school: 1, group: 1, membership: 1, invitation: 1, homework: 1,
    homeworkSubmission: 1,
  };

  const DEFAULTS = {
    examAttempt: { focusLostCount: 0, status: 'IN_PROGRESS', answers: '{}', examVersion: 1 },
    school: { status: 'PENDING' },
    membership: { status: 'ACTIVE' },
    invitation: { usedCount: 0 },
    homework: { params: '{}' },
    homeworkSubmission: { status: 'PENDING' },
  };

  function matchValue(actual, condition) {
    if (condition && typeof condition === 'object' && !(condition instanceof Date)) {
      if ('gte' in condition && !(actual >= condition.gte)) return false;
      if ('gt' in condition && !(actual > condition.gt)) return false;
      if ('lte' in condition && !(actual <= condition.lte)) return false;
      if ('lt' in condition && !(actual < condition.lt)) return false;
      if ('in' in condition && !condition.in.includes(actual)) return false;
      if ('not' in condition && actual === condition.not) return false;
      if ('equals' in condition && actual !== condition.equals) return false;
      return true;
    }
    return actual === condition;
  }

  function matches(row, where) {
    if (!where) return true;
    if (where.AND) return where.AND.every((w) => matches(row, w));
    if (where.OR) return where.OR.some((w) => matches(row, w));
    for (const [k, v] of Object.entries(where)) {
      if (v === undefined || k === 'AND' || k === 'OR') continue;
      if (!matchValue(row[k], v)) return false;
    }
    return true;
  }

  function sortRows(rows, orderBy) {
    if (!orderBy) return rows;
    const specs = Array.isArray(orderBy) ? orderBy : [orderBy];
    return [...rows].sort((a, b) => {
      for (const spec of specs) {
        const [field, dir] = Object.entries(spec)[0];
        if (a[field] < b[field]) return dir === 'desc' ? 1 : -1;
        if (a[field] > b[field]) return dir === 'desc' ? -1 : 1;
      }
      return 0;
    });
  }

  function applySelect(row, select) {
    if (!select) return { ...row };
    const out = {};
    for (const k of Object.keys(select)) if (select[k]) out[k] = row[k];
    return out;
  }

  function model(name) {
    return {
      create: async ({ data }) => {
        const row = { id: ids[name]++, ...(DEFAULTS[name] || {}), ...data };
        db[name].push(row);
        return { ...row };
      },
      findUnique: async ({ where, select }) => {
        const row = db[name].find((r) => matches(r, where));
        if (!row) return null;
        return applySelect(row, select);
      },
      findFirst: async ({ where, orderBy, select }) => {
        const rows = sortRows(db[name].filter((r) => matches(r, where)), orderBy);
        if (!rows[0]) return null;
        return applySelect(rows[0], select);
      },
      findMany: async ({ where, take, skip, orderBy, distinct, select }) => {
        let rows = sortRows(db[name].filter((r) => matches(r, where)), orderBy);
        if (distinct) {
          const seen = new Set();
          rows = rows.filter((r) => {
            const key = distinct.map((f) => r[f]).join('|');
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        }
        if (skip) rows = rows.slice(skip);
        if (take) rows = rows.slice(0, take);
        return rows.map((r) => applySelect(r, select));
      },
      count: async ({ where }) => db[name].filter((r) => matches(r, where)).length,
      update: async ({ where, data, select }) => {
        const row = db[name].find((r) => matches(r, where.id !== undefined ? { id: where.id } : where));
        if (!row) throw new Error(`${name} not found`);
        for (const [k, v] of Object.entries(data)) {
          if (v && typeof v === 'object' && 'increment' in v) row[k] = (row[k] || 0) + v.increment;
          else if (v && typeof v === 'object' && 'decrement' in v) row[k] = (row[k] || 0) - v.decrement;
          else row[k] = v;
        }
        if (select) {
          const out = {};
          for (const k of Object.keys(select)) if (select[k]) out[k] = row[k];
          return out;
        }
        return { ...row };
      },
      updateMany: async ({ where, data }) => {
        const rows = db[name].filter((r) => matches(r, where));
        rows.forEach((row) => {
          for (const [k, v] of Object.entries(data)) row[k] = v;
        });
        return { count: rows.length };
      },
      delete: async ({ where }) => {
        const idx = db[name].findIndex((r) => matches(r, where));
        if (idx === -1) throw new Error(`${name} not found`);
        const [row] = db[name].splice(idx, 1);
        return { ...row };
      },
      aggregate: async ({ where, _count, _avg, _sum }) => {
        const rows = db[name].filter((r) => matches(r, where));
        const result = { _count: { _all: rows.length }, _avg: {}, _sum: {} };
        for (const key of Object.keys(_avg || {})) {
          const vals = rows.map((r) => r[key]).filter((v) => v != null);
          result._avg[key] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
        }
        for (const key of Object.keys(_sum || {})) {
          result._sum[key] = rows.reduce((sum, r) => sum + (r[key] || 0), 0);
        }
        return result;
      },
      groupBy: async ({ by, where, _count }) => {
        const rows = db[name].filter((r) => matches(r, where));
        const groups = new Map();
        for (const row of rows) {
          const key = by.map((f) => row[f]).join('|');
          if (!groups.has(key)) {
            const g = {};
            by.forEach((f) => (g[f] = row[f]));
            g._count = { _all: 0 };
            groups.set(key, g);
          }
          groups.get(key)._count._all++;
        }
        return [...groups.values()];
      },
    };
  }

  const names = Object.keys(db);
  const client = { _db: db };
  for (const name of names) client[name] = model(name);

  // $transaction: qabul qiladigan callback ichida xuddi shu client (fake
  // DB'da haqiqiy izolyatsiya yo'q, lekin API mosligi kifoya) chaqiriladi.
  client.$transaction = async (arg) => {
    if (Array.isArray(arg)) return Promise.all(arg);
    return arg(client);
  };

  return client;
}

