// Supabase 서버 클라이언트 생성 함수
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';

export function createServerSupabase(
  req: NextApiRequest, 
  res: NextApiResponse
): SupabaseClient {
  // 하드코딩된 값 사용 (supabaseClient.js와 동일)
  const SUPABASE_URL = 'https://yyytjudftrvpmcnppaymw.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5eXRqdWRmdHZwbWNucHBheW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDcxMTksImV4cCI6MjA2NzAyMzExOX0.TxT-vnDjFip_CCL7Ag8mR7G59dMdQAKfPLY1S3TJqRE';
  
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// 기존 supabaseClient.js의 export도 포함
const SUPABASE_URL = 'https://yyytjudftrvpmcnppaymw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5eXRqdWRmdHZwbWNucHBheW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDcxMTksImV4cCI6MjA2NzAyMzExOX0.TxT-vnDjFip_CCL7Ag8mR7G59dMdQAKfPLY1S3TJqRE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const supabaseAdmin = supabase; // RLS가 비활성화되어 있으므로 동일하게 사용
