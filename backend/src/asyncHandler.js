// Express 4 async route handlerlaridagi (await ichidagi) xatolarni avtomatik
// ushlamaydi — shuning uchun bitta kutilmagan xato (masalan DB ulanish
// muammosi) so'rovni "osilib qolgan" holatda qoldirishi yoki hatto butun
// process'ni yiqitishi mumkin edi. Bu wrapper har qanday async xatoni
// ushlab, Express'ning xato middleware'siga (index.js dagi) uzatadi.
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
