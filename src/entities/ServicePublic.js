import { supabase } from '@/lib/supabaseClient';

function applySort(query, sort) {
    if (!sort) return query;
    const desc = sort.startsWith('-');
    const col = desc ? sort.slice(1) : sort;
    return query.order(col, { ascending: !desc });
}

function toError(supabaseError, fallbackMessage) {
    const message = supabaseError?.message || fallbackMessage || 'حدث خطأ غير متوقع';
    const err = new Error(message);
    err.original = supabaseError;
    return err;
}

// يقرأ من services_public (view بدون أعمدة التواصل) - آمن للتصفح العام بدون تسجيل دخول
export const ServicePublic = {
    async list(sort, limit) {
        let query = supabase.from('services_public').select('*');
        query = applySort(query, sort);
        if (limit) query = query.limit(limit);
        const { data, error } = await query;
        if (error) throw toError(error, 'تعذر تحميل الخدمات');
        return data || [];
    },

    async filter(filters = {}, sort, limit) {
        let query = supabase.from('services_public').select('*');
        Object.entries(filters || {}).forEach(([key, value]) => {
            if (value !== undefined) query = query.eq(key, value);
        });
        query = applySort(query, sort);
        if (limit) query = query.limit(limit);
        const { data, error } = await query;
        if (error) throw toError(error, 'تعذر تحميل الخدمات');
        return data || [];
    },

    async get(id) {
        const { data, error } = await supabase.from('services_public').select('*').eq('id', id).maybeSingle();
        if (error) throw toError(error, 'تعذر جلب هذه الخدمة');
        return data;
    },
};
