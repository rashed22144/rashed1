// خريطة أسماء الصفحات (نفس الأسماء المستخدمة داخل مكونات المشروع) إلى مسارات React Router الحقيقية
// ملاحظة: تم استخدام أسماء الصفحات نفسها كمسارات لأن بعض المكونات (PostCard, CommunityPage...)
// تستخدم روابط ثابتة (hardcoded) مثل `/UserProfilePage?email=...` و `/CommunityPage` مباشرة.
const ROUTES = {
    HomePage: '/',
    AddServicePage: '/AddServicePage',
    CategoryPage: '/CategoryPage',
    ServiceDetailPage: '/ServiceDetailPage',
    SearchResultsPage: '/SearchResultsPage',
    CommunityPage: '/CommunityPage',
    UserProfilePage: '/UserProfilePage',
    MyProfilePage: '/MyProfilePage',
    SettingsPage: '/SettingsPage',
    LanguageSettingsPage: '/LanguageSettingsPage',
    AdminDashboard: '/AdminDashboard',
    AdminDashboardPage: '/AdminDashboard',
};

// تقبل صيغة "PageName" أو "PageName?query=params" مثل ما هو مستخدم في كل الصفحات
export function createPageUrl(pageNameWithParams) {
    if (!pageNameWithParams) return '/';
    const [pageName, ...rest] = pageNameWithParams.split('?');
    const query = rest.join('?');
    const path = ROUTES[pageName] || '/';
    return query ? `${path}?${query}` : path;
}

// ينظف رقم الهاتف من أي مسافات أو رموز عشان يشتغل رابط واتساب صح (wa.me يحتاج أرقام بس)
export function toWhatsAppNumber(raw) {
    if (!raw) return '';
    return raw.replace(/[^0-9]/g, '');
}
