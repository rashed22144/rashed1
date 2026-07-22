import { createClient } from '@supabase/supabase-js';

// رابط ومفتاح مشروعك الخاص في Supabase (Anon/Public Key آمن للاستخدام في الفرونت اند)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://idkhapcmjlboneefhfty.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'sb_publishable_mEQ-JXi4W5-QZzIwAXpFQQ_mPNpvqS3';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
