// pages/api/debug-supabase.js
// Supabase 연결 디버깅

export default async function handler(req, res) {
  const debugInfo = {
    env: {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length,
      nodeEnv: process.env.NODE_ENV
    },
    test: null,
    error: null
  };

  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error(`Missing config - URL: ${!!supabaseUrl}, Key: ${!!supabaseKey}`);
    }
    
    // Supabase 클라이언트 생성 시도
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 간단한 쿼리 테스트
    const { data, error, count } = await supabase
      .from('content_ideas')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      debugInfo.error = {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      };
    } else {
      debugInfo.test = {
        success: true,
        count: count,
        message: 'Supabase 연결 성공!'
      };
    }
    
  } catch (err) {
    debugInfo.error = {
      message: err.message,
      stack: err.stack?.split('\n').slice(0, 5)
    };
  }
  
  res.status(200).json(debugInfo);
}