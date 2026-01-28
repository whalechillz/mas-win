/**
 * 서버 사이드 Supabase 클라이언트 싱글톤
 * 데이터베이스 연결 풀 고갈 방지를 위해 공유 클라이언트 사용
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase 환경 변수가 설정되지 않았습니다');
}

// 싱글톤 클라이언트 인스턴스
let supabaseClient: SupabaseClient | null = null;

/**
 * 서버 사이드 Supabase 클라이언트 가져오기 (싱글톤)
 * 모든 API 라우트에서 이 함수를 사용하여 연결 풀 고갈 방지
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      db: {
        schema: 'public',
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          'x-client-info': 'masgolf-admin-api',
        },
      },
    });
  }
  return supabaseClient;
}

/**
 * 기존 createServerSupabase와의 호환성을 위한 래퍼
 */
export function createServerSupabase(
  req?: any,
  res?: any
): SupabaseClient {
  return getSupabaseClient();
}

// 기본 export (하위 호환성)
export const supabase = getSupabaseClient();
export const supabaseAdmin = supabase;
