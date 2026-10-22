import { supabase } from '@/lib/supabaseClient';

// خريطة اسم الـ Entity (زي ما مستخدم بالكود) -> اسم الجدول الحقيقي في Supabase
const TABLE_MAP = {
    Service: 'services',
    Category: 'categories',
    Location: 'locations',
    User: 'users',
    UserAdmin: 'users',   // الأدمن فقط: قراءة كاملة (phone, warnings, banned_until...)
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
    const message = supabaseError?.message || supabaseError?.error_description || supabaseError?.hint || fallbackMessage || 'Unexpected error';
    const err = new Error(message);
    err.original = supabaseError;
    return err;
}

// مصنع عام لإنشاء "Entity" متوافق مع نفس واجهة backend (list/filter/get/create/update/delete)
// Public reads go through safe views only: users_public (no private columns) and
// services_public (contact flags + counters, no phone/email/whatsapp). Writes still target base tables.
const READ_TABLE_MAP = { users: 'users_public', services: 'services_public' };
function createEntity(tableName, readTable = tableName) {
    return {
        async list(sort, limit) {
            let query = supabase.from(readTable).select('*');
            query = applySort(query, sort);
            if (limit) query = query.limit(limit);
            const { data, error } = await query;
            if (error) throw toError(error, `Could not load ${tableName}`);
            return data || [];
        },

        async filter(filters = {}, sort, limit) {
            let query = supabase.from(readTable).select('*');
            Object.entries(filters || {}).forEach(([key, value]) => {
                if (value !== undefined) query = query.eq(key, value);
            });
            query = applySort(query, sort);
            if (limit) query = query.limit(limit);
            const { data, error } = await query;
            if (error) throw toError(error, `Could not load ${tableName}`);
            return data || [];
        },

        async get(id) {
            const { data, error } = await supabase.from(readTable).select('*').eq('id', id).maybeSingle();
            if (error) throw toError(error, `Could not load this item from ${tableName}`);
            return data;
        },

        async create(payload) {
            const { data, error } = await supabase.from(tableName).insert([payload]).select().single();
            if (error) throw toError(error, `Could not create item in ${tableName}`);
            return data;
        },

        async update(id, payload) {
            const { data, error } = await supabase.from(tableName).update(payload).eq('id', id).select().single();
            if (error) throw toError(error, `Could not update this item in ${tableName}`);
            return data;
        },

        async delete(id) {
            const { error } = await supabase.from(tableName).delete().eq('id', id);
            if (error) throw toError(error, `Could not delete this item from ${tableName}`);
            return true;
        },
    };
}

const entities = {};
Object.entries(TABLE_MAP).forEach(([entityName, tableName]) => {
    entities[entityName] = createEntity(
        tableName,
        entityName === 'UserAdmin' ? tableName : (READ_TABLE_MAP[tableName] || tableName)
    );
});

// جلب/إنشاء صف المستخدم في جدول users بمطابقة الإيميل مع حساب Supabase Auth
async function fetchOrCreateProfile(authUser) {
    let { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .maybeSingle();

    if (error) throw toError(error, 'Could not load user profile');

    if (!profile) {
        const { data: created, error: createError } = await supabase
            .from('users')
            .insert([{
                email: authUser.email,
                full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
            }])
            .select()
            .single();
        if (createError) throw toError(createError, 'Could not create user profile');
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
        // Defense in depth: self-service profile updates may only touch editable fields.
        // Protected columns (account_type, warnings, banned_until, email, id) are stripped even if a caller passes them.
        const PROFILE_FIELDS = ['full_name', 'phone', 'bio', 'avatar_url', 'cover_url', 'notifications_enabled', 'email_notifications', 'marketing_emails'];
        const safePayload = {};
        PROFILE_FIELDS.forEach((field) => { if (payload?.[field] !== undefined) safePayload[field] = payload[field]; });
        const { data, error: updateError } = await supabase
            .from('users')
            .update(safePayload)
            .eq('email', user.email)
            .select()
            .single();
        if (updateError) throw toError(updateError, 'Could not update user profile');
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
            // Client-side UX validation only; the bucket enforces login, 5MB and image mime types server-side.
            const ALLOWED = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp' };
            const fileExt = ALLOWED[file?.type];
            if (!fileExt) throw new Error('Only image files (PNG, JPG, GIF, WebP) are allowed');
            if (file.size > 5 * 1024 * 1024) throw new Error('Image is too large. Maximum size is 5MB.');
            const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
            const { error } = await supabase.storage.from('uploads').upload(fileName, file, {
                cacheControl: '3600',
                upsert: false,
            });
            if (error) throw toError(error, 'Could not upload file');
            const { data } = supabase.storage.from('uploads').getPublicUrl(fileName);
            return { file_url: data.publicUrl };
        },

        // إرسال إيميل: Supabase وحدها لا ترسل إيميلات مباشرة من الفرونت اند.
        // لتفعيلها لاحقاً: أنشئ Supabase Edge Function واستدعها هنا عبر supabase.functions.invoke(...)
        async SendEmail() {
            // No-op: email needs a Supabase Edge Function. Never log recipients or bodies (PII).
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
    if (error) throw toError(error, 'Please sign in to view contact info');
    return data?.[0] || null;
}

// زيادة عداد المشاهدات (يشتغل حتى بدون تسجيل دخول)
export async function incrementServiceView(serviceId) {
    try {
        await supabase.rpc('increment_service_view', { target_id: serviceId });
    } catch (e) { /* view counter is best-effort */ }
}

// زيادة عداد الضغطات على أزرار التواصل
export async function incrementServiceClick(serviceId) {
    try {
        await supabase.rpc('increment_service_click', { target_id: serviceId });
    } catch (e) { /* click counter is best-effort */ }
}

// الإبلاغ عن خدمة - يحتاج تسجيل دخول
export async function reportService(serviceId, reason) {
    const { error } = await supabase.rpc('report_service', { target_id: serviceId, reason: reason || null });
    if (error) throw toError(error, 'Could not send report');
}
