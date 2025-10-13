import { createClient } from '@supabase/supabase-js';

// 하드코딩된 값으로 직접 테스트
const SUPABASE_URL = 'https://yyytjudftrvpmcnppaymw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5eXRqdWRmdHZwbWNucHBheW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDcxMTksImV4cCI6MjA2NzAyMzExOX0.TxT-vnDjFip_CCL7Ag8mR7G59dMdQAKfPLY1S3TJqRE';

// 직접 클라이언트 생성
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const supabaseAdmin = supabase; // RLS가 비활성화되어 있으므로 동일하게 사용