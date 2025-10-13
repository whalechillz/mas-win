// 간단한 Supabase 디버그 API
export default async function handler(req, res) {
  console.log('🔍 간단한 Supabase 디버그 시작...');
  
  try {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      platform: process.platform,
      nodeVersion: process.version,
      envVars: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '없음',
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '설정됨' : '없음',
        supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '설정됨' : '없음'
      }
    };

    // Supabase 클라이언트 생성 테스트
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      debugInfo.clientCreation = { success: true };
      console.log('✅ Supabase 클라이언트 생성 성공');
      
      // 간단한 쿼리 테스트
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title')
        .limit(1);
      
      if (error) {
        debugInfo.queryTest = { 
          success: false, 
          error: error.message,
          code: error.code 
        };
        console.error('❌ 쿼리 실패:', error.message);
      } else {
        debugInfo.queryTest = { 
          success: true, 
          dataCount: data?.length || 0,
          sampleData: data?.[0] || null
        };
        console.log('✅ 쿼리 성공:', data?.length, '개 데이터');
      }
      
    } catch (error) {
      debugInfo.clientCreation = { 
        success: false, 
        error: error.message 
      };
      console.error('❌ 클라이언트 생성 실패:', error.message);
    }

    console.log('🔍 디버그 완료');
    res.status(200).json(debugInfo);

  } catch (error) {
    console.error('❌ 디버그 중 치명적 오류:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
