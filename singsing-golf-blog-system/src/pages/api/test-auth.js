import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { login, password } = req.body
    
    console.log('테스트 로그인:', { login, password })
    
    // 전화번호 형식 체크
    const cleanPhone = login.replace(/[^0-9]/g, '')
    const isPhone = /^010\d{8}$/.test(cleanPhone)
    
    console.log('전화번호 체크:', { cleanPhone, isPhone })
    
    // 사용자 조회
    const { data: user, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('phone', cleanPhone)
      .eq('is_active', true)
      .single()
    
    console.log('사용자 조회 결과:', { user, error })
    
    if (error || !user) {
      return res.status(401).json({ 
        error: '사용자를 찾을 수 없습니다',
        details: error?.message 
      })
    }
    
    // 비밀번호 검증
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    console.log('비밀번호 검증:', isValidPassword)
    
    if (!isValidPassword) {
      return res.status(401).json({ error: '비밀번호가 일치하지 않습니다' })
    }
    
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role
      }
    })
    
  } catch (error) {
    console.error('테스트 인증 오류:', error)
    return res.status(500).json({ 
      error: '서버 오류',
      details: error.message 
    })
  }
}
