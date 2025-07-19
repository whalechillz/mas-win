// Supabase 서버 클라이언트 생성 함수
import { createClient } from '@supabase/supabase-js';

export function createServerSupabase(req, res) {
  // 하드코딩된 값 사용 (supabaseClient.js와 동일)
  const SUPABASE_URL = 'https://yyytjudftrvpmcnppaymw.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5eXRqdWRmdHZwbWNucHBheW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDcxMTksImV4cCI6MjA2NzAyMzExOX0.TxT-vnDjFip_CCL7Ag8mR7G59dMdQAKfPLY1S3TJqRE';
  
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// 기존 supabaseClient.js와의 호환성을 위해 export
export { supabase, supabaseAdmin } from './supabaseClient';
