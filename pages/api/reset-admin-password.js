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
    const { phone, password } = req.body
    
    if (!phone || !password) {
      return res.status(400).json({ error: '전화번호와 비밀번호가 필요합니다' })
    }
    
    // 비밀번호 해시 생성
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)
    
    console.log('비밀번호 해시 생성:', { phone, password, passwordHash })
    
    // admin_users 테이블에서 해당 전화번호 사용자 찾기
    const { data: user, error: findError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('phone', phone)
      .single()
    
    if (findError || !user) {
      return res.status(404).json({ 
        error: '사용자를 찾을 수 없습니다',
        details: findError?.message 
      })
    }
    
    // 비밀번호 해시 업데이트
    const { data: updatedUser, error: updateError } = await supabase
      .from('admin_users')
      .update({ 
        password_hash: passwordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()
    
    if (updateError) {
      console.error('비밀번호 업데이트 오류:', updateError)
      return res.status(500).json({ 
        error: '비밀번호 업데이트 실패',
        details: updateError.message 
      })
    }
    
    console.log('비밀번호 업데이트 성공:', updatedUser.name)
    
    return res.status(200).json({
      success: true,
      message: '비밀번호가 성공적으로 업데이트되었습니다',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        role: updatedUser.role
      }
    })
    
  } catch (error) {
    console.error('API 오류:', error)
    return res.status(500).json({ 
      error: '서버 오류',
      details: error.message 
    })
  }
}
