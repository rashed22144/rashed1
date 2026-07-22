import { supabase } from '@/lib/supabaseClient';

// خريطة اسم الـ Entity (زي ما مستخدم بالكود) -> اسم الجدول الحقيقي في Supabase
const TABLE_MAP = {
    Service: 'services',
    Category: 'categories',
    Location: 'locations',
    User: 'users',
    Post: 'posts',
    PostComment: 'post_comments',
    Follow: 'follows',
    Review: 'reviews',
    Notification: 'notifications',
};

function applySort(query, sort) {
    if (!sort) return query;
    const desc = sort.startsWith('-');
    const col = desc ? sort.slice(1) : sort;
    return query.order(col, { ascending: !desc });
}

function toError(supabaseError, fallbackMessage) {
    const message = supabaseError?.message || supabaseError?.error_description || supabaseError?.hint || fallbackMessage || 'حدث خطأ غير متوقع';
    const err = new Error(message);
    err.original = supabaseError;
    return err;
}

// مصنع عام لإنشاء "Entity" متوافق مع نفس واجهة backend (list/filter/get/create/update/delete)
function createEntity(tableName) {
    return {
        async list(sort, limit) {
            let query = supabase.from(tableName).select('*');
            query = applySort(query, sort);
            if (limit) query = query.limit(limit);
            const { data, error } = await query;
            if (error) throw toError(error, `تعذر تحميل بيانات ${tableName}`);
            return data || [];
        },

        async filter(filters = {}, sort, limit) {
            let query = supabase.from(tableName).select('*');
            Object.entries(filters || {}).forEach(([key, value]) => {
                if (value !== undefined) query = query.eq(key, value);
            });
            query = applySort(query, sort);
            if (limit) query = query.limit(limit);
            const { data, error } = await query;
            if (error) throw toError(error, `تعذر تحميل بيانات ${tableName}`);
            return data || [];
        },

        async get(id) {
            const { data, error } = await supabase.from(tableName).select('*').eq('id', id).maybeSingle();
            if (error) throw toError(error, `تعذر جلب هذا العنصر من ${tableName}`);
            return data;
        },

        async create(payload) {
            const { data, error } = await supabase.from(tableName).insert([payload]).select().single();
            if (error) throw toError(error, `تعذر إنشاء عنصر جديد في ${tableName}`);
            return data;
        },

        async update(id, payload) {
            const { data, error } = await supabase.from(tableName).update(payload).eq('id', id).select().single();
            if (error) throw toError(error, `تعذر تحديث هذا العنصر في ${tableName}`);
            return data;
        },

        async delete(id) {
            const { error } = await supabase.from(tableName).delete().eq('id', id);
            if (error) throw toError(error, `تعذر حذف هذا العنصر من ${tableName}`);
            return true;
        },
    };
}

const entities = {};
Object.entries(TABLE_MAP).forEach(([entityName, tableName]) => {
    entities[entityName] = createEntity(tableName);
});

// جلب/إنشاء صف المستخدم في جدول users بمطابقة الإيميل مع حساب Supabase Auth
async function fetchOrCreateProfile(authUser) {
    let { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .maybeSingle();

    if (error) throw toError(error, 'تعذر جلب بيانات المستخدم');

    if (!profile) {
        const { data: created, error: createError } = await supabase
            .from('users')
            .insert([{
                email: authUser.email,
                full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
            }])
            .select()
            .single();
        if (createError) throw toError(createError, 'تعذر إنشاء حساب المستخدم');
        profile = created;
    }
    return profile;
}

const auth = {
    async me() {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) throw new Error('User not logged in');
        const profile = await fetchOrCreateProfile(user);
        return { ...profile, id: user.id, email: user.email };
    },

    async updateMe(payload) {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) throw new Error('User not logged in');
        const { data, error: updateError } = await supabase
            .from('users')
            .update(payload)
            .eq('email', user.email)
            .select()
            .single();
        if (updateError) throw toError(updateError, 'تعذر تحديث بيانات المستخدم');
        return data;
    },

    async logout() {
        await supabase.auth.signOut();
    },

    async loginWithGoogle() {
        return supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin },
        });
    },
};

const integrations = {
    Core: {
        // رفع ملف حقيقي إلى Supabase Storage (تأكد من إنشاء bucket باسم "uploads" وجعله public)
        async UploadFile({ file }) {
            const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
            const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
            const { error } = await supabase.storage.from('uploads').upload(fileName, file, {
                cacheControl: '3600',
                upsert: false,
            });
            if (error) throw toError(error, 'تعذر رفع الملف - تأكد من وجود bucket باسم uploads');
            const { data } = supabase.storage.from('uploads').getPublicUrl(fileName);
            return { file_url: data.publicUrl };
        },

        // إرسال إيميل: Supabase وحدها لا ترسل إيميلات مباشرة من الفرونت اند.
        // لتفعيلها لاحقاً: أنشئ Supabase Edge Function واستدعها هنا عبر supabase.functions.invoke(...)
        async SendEmail({ to, subject, body }) {
            console.warn('[SendEmail] لم يتم إرسال إيميل فعلي - يحتاج Supabase Edge Function.', { to, subject, body });
            return { success: false, skipped: true };
        },
    },
};

export const backend = { auth, entities, integrations };

// ============================================================
// دوال RPC محمية بالسيرفر لحماية بيانات التواصل الحساسة (هاتف/واتساب/إيميل)
// ============================================================

// يرجع بيانات التواصل الكاملة لخدمة معينة - يشتغل بس لو المستخدم مسجل دخول
export async function getServiceContact(serviceId) {
    const { data, error } = await supabase.rpc('get_service_contact', { target_id: serviceId });
    if (error) throw toError(error, 'يجب تسجيل الدخول لعرض بيانات التواصل');
    return data?.[0] || null;
}

// زيادة عداد المشاهدات (يشتغل حتى بدون تسجيل دخول)
export async function incrementServiceView(serviceId) {
    try {
        await supabase.rpc('increment_service_view', { target_id: serviceId });
    } catch (e) { console.error('incrementServiceView failed:', e); }
}

// زيادة عداد الضغطات على أزرار التواصل
export async function incrementServiceClick(serviceId) {
    try {
        await supabase.rpc('increment_service_click', { target_id: serviceId });
    } catch (e) { console.error('incrementServiceClick failed:', e); }
}

// الإبلاغ عن خدمة - يحتاج تسجيل دخول
export async function reportService(serviceId, reason) {
    const { error } = await supabase.rpc('report_service', { target_id: serviceId, reason: reason || null });
    if (error) throw toError(error, 'تعذر إرسال الإبلاغ');
}
