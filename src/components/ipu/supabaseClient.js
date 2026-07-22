import { createClient } from '@supabase/supabase-js';

// الرابط الخاص بمشروعك من لوحة تحكم Supabase
const supabaseUrl = 'https://idkhapcmjlboneefhfty.supabase.co';

// مفتاح anon public الخاص بمشروعك (تأكد من نسخه كاملاً)
const supabaseAnonKey = 'sb_publishable_mEQ-JXi4W5-QZzIwAXpFQQ_mPNpvqS3';

// إنشاء العميل (Client) الذي سيتواصل مع السيرفر
export const supabase = createClient(supabaseUrl, supabaseAnonKey);