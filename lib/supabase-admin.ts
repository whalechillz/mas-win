import { createClient } from '@supabase/supabase-js'

// Supabase 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || 'your-service-role-key'

// 서버 사이드에서만 사용 가능 (클라이언트 사이드에서는 null)
export const supabaseAdmin = typeof window === 'undefined' && supabaseKey && supabaseKey !== 'your-service-role-key'
  ? createClient(supabaseUrl, supabaseKey)
  : null

// 환경 변수 확인 함수
export const checkSupabaseConfig = () => {
  const hasUrl = supabaseUrl && supabaseUrl !== 'https://your-project.supabase.co'
  const hasKey = supabaseKey && supabaseKey !== 'your-service-role-key'
  
  console.log('🔍 Supabase 설정 확인:')
  console.log('  - URL:', hasUrl ? '✅ 설정됨' : '❌ 누락됨', hasUrl ? `(${supabaseUrl.substring(0, 30)}...)` : '')
  console.log('  - Key:', hasKey ? '✅ 설정됨' : '❌ 누락됨', hasKey ? `(${supabaseKey.substring(0, 20)}...)` : '')
  
  if (!hasUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_URL이 설정되지 않았습니다.')
    console.error('   환경 변수 확인: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_URL')
  }
  
  if (!hasKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY 또는 SUPABASE_SERVICE_KEY가 설정되지 않았습니다.')
    console.error('   환경 변수 확인: SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SERVICE_KEY')
  }
  
  if (hasUrl && hasKey) {
    console.log('✅ Supabase 설정이 올바릅니다.')
    return true
  }
  
  return false
}
