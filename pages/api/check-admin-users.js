import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  try {
    // admin_users 테이블의 모든 데이터 조회
    const { data: users, error } = await supabase
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Supabase 오류:', error)
      return res.status(500).json({ 
        error: '데이터베이스 오류',
        details: error.message 
      })
    }
    
    console.log('admin_users 데이터:', users)
    
    return res.status(200).json({
      success: true,
      count: users?.length || 0,
      users: users?.map(user => ({
        id: user.id,
        name: user.name,
        phone: user.phone,
        username: user.username,
        role: user.role,
        is_active: user.is_active,
        created_at: user.created_at
      })) || []
    })
    
  } catch (error) {
    console.error('API 오류:', error)
    return res.status(500).json({ 
      error: '서버 오류',
      details: error.message 
    })
  }
}
