import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 가져오기 (하드코딩 제거)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Service Role Key (서버 사이드에서만 사용)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// 필수 환경 변수 검증
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration missing:', {
    url: !!supabaseUrl,
    anonKey: !!supabaseAnonKey
  });
  throw new Error('Missing Supabase configuration');
}

// 디버깅용 로그 (프로덕션에서는 제거 권장)
if (process.env.NODE_ENV === 'development') {
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Key exists:', !!supabaseAnonKey);
  console.log('Service Key exists:', !!supabaseServiceKey);
}

// 클라이언트용 (기본)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 서버용 (RLS 우회)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabase;