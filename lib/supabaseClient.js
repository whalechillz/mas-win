import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 서버사이드에서만 사용할 Service Role Key
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration missing');
  throw new Error('Missing Supabase configuration');
}

// 클라이언트용 (RLS 적용)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 서버용 (RLS 우회) - Service Key가 있으면 사용, 없으면 anon key 사용
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : createClient(supabaseUrl, supabaseAnonKey);