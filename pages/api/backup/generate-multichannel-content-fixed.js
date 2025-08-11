// pages/api/generate-multichannel-content-fixed.js
// Node.js 18 fetch 문제 해결 버전

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Dynamic import to avoid build issues
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 
                       process.env.SUPABASE_SERVICE_ROLE_KEY ||
                       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        success: false,
        error: 'Missing Supabase configuration',
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
      });
    }
    
    // Node.js 18 fetch 문제 해결을 위한 옵션
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false
      },
      global: {
        fetch: (...args) => fetch(...args)
      }
    });
    
    const { year, month } = req.body;
    
    // 간단한 테스트 INSERT
    const testContent = {
      title: `테스트 콘텐츠 ${new Date().toLocaleString('ko-KR')}`,
      content: 'API 테스트 콘텐츠입니다.',
      platform: 'blog',
      status: 'idea',
      assignee: 'API테스트',
      scheduled_date: `${year}-${String(month).padStart(2, '0')}-15`,
      tags: 'test,api'
    };
    
    const { data, error } = await supabase
      .from('content_ideas')
      .insert([testContent])
      .select();
    
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
        code: error.code,
        details: error
      });
    }
    
    return res.status(200).json({
      success: true,
      message: '콘텐츠가 성공적으로 생성되었습니다!',
      data: data
    });
    
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      type: error.constructor.name
    });
  }
}