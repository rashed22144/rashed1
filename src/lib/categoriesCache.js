import { Category } from '@/entities/Category';

let cachedPromise = null;

// يجلب كل الأقسام مرة واحدة فقط ويخزّنها في الذاكرة، حتى لا تحتاج بطاقات الخدمات المتكررة
// إلى إرسال طلب شبكة منفصل لكل بطاقة
// Fetches all categories once and caches them in memory, so repeated service cards
// do not send a separate network request for each card
export function getCategoriesMap() {
    if (!cachedPromise) {
        cachedPromise = Category.list()
            .then((cats) => {
                const map = {};
                cats.forEach((c) => { map[c.name] = c; });
                return map;
            })
            .catch(() => ({}));
    }
    return cachedPromise;
}