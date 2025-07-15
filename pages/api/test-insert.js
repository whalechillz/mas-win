// pages/api/test-insert.js
// 권한 테스트용 간단한 API

export default async function handler(req, res) {
  try {
    // 환경 변수 확인
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_KEY;
    const hasRoleKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // Supabase 직접 연결 테스트
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // INSERT 테스트
    const testData = {
      title: `API 테스트 ${new Date().toISOString()}`,
      content: '권한 테스트',
      platform: 'blog',
      status: 'idea',
      assignee: 'API테스트',
      scheduled_date: '2025-07-15',
      tags: 'test'
    };
    
    const { data, error } = await supabase
      .from('content_ideas')
      .insert([testData])
      .select();
    
    return res.status(200).json({
      success: !error,
      hasServiceKey,
      hasRoleKey,
      keyUsed: hasServiceKey ? 'SERVICE_KEY' : hasRoleKey ? 'ROLE_KEY' : 'ANON_KEY',
      data,
      error: error?.message
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}