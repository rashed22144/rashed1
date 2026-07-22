import { Category } from '@/entities/Category';

let cachedPromise = null;

// يجلب كل الأقسام مرة وحدة بس ويخزنها بالذاكرة، عشان بطاقات الخدمات المتكررة
// ما تسوي طلب شبكة منفصل لكل بطاقة
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
