// دمج أسماء الأصناف (classNames) بدون الحاجة لمكتبات خارجية إضافية
export function cn(...inputs) {
  return inputs
    .flat(Infinity)
    .filter((x) => typeof x === 'string' && x.trim().length > 0)
    .join(' ');
}
