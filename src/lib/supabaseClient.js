import { createClient } from '@supabase/supabase-js';

// Single Supabase client for the whole app.
// Prefer REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_ANON_KEY (see .env.example).
// The anon key is public by design; real authorization lives in database RLS policies.
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://idkhapcmjlboneefhfty.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'sb_publishable_mEQ-JXi4W5-QZzIwAXpFQQ_mPNpvqS3';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
