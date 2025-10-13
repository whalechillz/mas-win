import { createClient } from '@supabase/supabase-js'

// 임시 하드코딩된 Supabase 설정 (실제 값으로 교체 필요)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

// 환경 변수 확인 함수
export const checkSupabaseConfig = () => {
  console.log('Supabase URL:', supabaseUrl)
  console.log('Supabase Key:', supabaseKey ? '설정됨' : '누락됨')
  
  if (!supabaseUrl || supabaseUrl === 'https://your-project.supabase.co') {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.')
    return false
  }
  
  if (!supabaseKey || supabaseKey === 'your-service-role-key') {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.')
    return false
  }
  
  console.log('✅ Supabase 설정이 올바릅니다.')
  return true
}
