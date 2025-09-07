// Supabase 연결 디버그 API
export default async function handler(req, res) {
  console.log('🔍 Supabase 디버그 시작...');
  
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    platform: process.platform,
    nodeVersion: process.version,
    errors: [],
    tests: {}
  };

  try {
    // 1. 환경 변수 확인
    console.log('1️⃣ 환경 변수 확인...');
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        value: process.env.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '없음',
        length: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0
      },
      NEXT_PUBLIC_SUPABASE_ANON_KEY: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '설정됨' : '없음',
        length: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0
      },
      SUPABASE_SERVICE_ROLE_KEY: {
        exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        value: process.env.SUPABASE_SERVICE_ROLE_KEY ? '설정됨' : '없음',
        length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
      }
    };
    
    debugInfo.tests.envCheck = envCheck;
    console.log('환경 변수 확인 결과:', envCheck);

    // 2. Supabase 클라이언트 생성 테스트
    console.log('2️⃣ Supabase 클라이언트 생성 테스트...');
    let clientCreationSuccess = false;
    let clientError = null;
    
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      clientCreationSuccess = true;
      debugInfo.tests.clientCreation = { success: true };
      console.log('✅ Supabase 클라이언트 생성 성공');
    } catch (error) {
      clientError = error.message;
      debugInfo.tests.clientCreation = { success: false, error: error.message };
      debugInfo.errors.push(`클라이언트 생성 실패: ${error.message}`);
      console.error('❌ Supabase 클라이언트 생성 실패:', error.message);
    }

    // 3. 네트워크 연결 테스트
    console.log('3️⃣ 네트워크 연결 테스트...');
    let networkTest = {};
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        }
      });
      
      networkTest = {
        success: true,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      };
      console.log('✅ 네트워크 연결 성공:', response.status);
    } catch (error) {
      networkTest = {
        success: false,
        error: error.message,
        code: error.code
      };
      debugInfo.errors.push(`네트워크 연결 실패: ${error.message}`);
      console.error('❌ 네트워크 연결 실패:', error.message);
    }
    
    debugInfo.tests.networkTest = networkTest;

    // 4. Supabase 쿼리 테스트
    console.log('4️⃣ Supabase 쿼리 테스트...');
    let queryTest = {};
    
    if (clientCreationSuccess) {
      try {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        
        const { data, error, count } = await supabase
          .from('blog_posts')
          .select('*', { count: 'exact' })
          .limit(1);
        
        if (error) {
          queryTest = {
            success: false,
            error: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          };
          debugInfo.errors.push(`쿼리 실패: ${error.message}`);
          console.error('❌ Supabase 쿼리 실패:', error);
        } else {
          queryTest = {
            success: true,
            dataCount: data?.length || 0,
            totalCount: count,
            sampleData: data?.[0] ? {
              id: data[0].id,
              title: data[0].title,
              status: data[0].status
            } : null
          };
          console.log('✅ Supabase 쿼리 성공:', data?.length, '개 데이터');
        }
      } catch (error) {
        queryTest = {
          success: false,
          error: error.message,
          stack: error.stack
        };
        debugInfo.errors.push(`쿼리 예외: ${error.message}`);
        console.error('❌ Supabase 쿼리 예외:', error.message);
      }
    } else {
      queryTest = { skipped: true, reason: '클라이언트 생성 실패' };
    }
    
    debugInfo.tests.queryTest = queryTest;

    // 5. 대안 방법 테스트
    console.log('5️⃣ 대안 방법 테스트...');
    let alternativeTest = {};
    
    try {
      // 직접 fetch 사용
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/blog_posts?select=*&limit=1`, {
        method: 'GET',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        alternativeTest = {
          success: true,
          status: response.status,
          dataCount: data?.length || 0,
          sampleData: data?.[0] ? {
            id: data[0].id,
            title: data[0].title,
            status: data[0].status
          } : null
        };
        console.log('✅ 대안 방법 성공:', data?.length, '개 데이터');
      } else {
        alternativeTest = {
          success: false,
          status: response.status,
          statusText: response.statusText,
          error: await response.text()
        };
        console.error('❌ 대안 방법 실패:', response.status, response.statusText);
      }
    } catch (error) {
      alternativeTest = {
        success: false,
        error: error.message,
        code: error.code
      };
      console.error('❌ 대안 방법 예외:', error.message);
    }
    
    debugInfo.tests.alternativeTest = alternativeTest;

    // 6. 종합 진단
    console.log('6️⃣ 종합 진단...');
    const diagnosis = {
      overallStatus: 'unknown',
      issues: [],
      recommendations: []
    };

    if (!envCheck.NEXT_PUBLIC_SUPABASE_URL.exists) {
      diagnosis.issues.push('NEXT_PUBLIC_SUPABASE_URL 환경 변수가 설정되지 않음');
      diagnosis.recommendations.push('Vercel에서 NEXT_PUBLIC_SUPABASE_URL 환경 변수를 설정하세요');
    }

    if (!envCheck.SUPABASE_SERVICE_ROLE_KEY.exists) {
      diagnosis.issues.push('SUPABASE_SERVICE_ROLE_KEY 환경 변수가 설정되지 않음');
      diagnosis.recommendations.push('Vercel에서 SUPABASE_SERVICE_ROLE_KEY 환경 변수를 설정하세요');
    }

    if (!clientCreationSuccess) {
      diagnosis.issues.push('Supabase 클라이언트 생성 실패');
      diagnosis.recommendations.push('Supabase 클라이언트 라이브러리 버전을 확인하세요');
    }

    if (!networkTest.success) {
      diagnosis.issues.push('네트워크 연결 실패');
      diagnosis.recommendations.push('Vercel의 네트워크 설정을 확인하세요');
    }

    if (!queryTest.success && !queryTest.skipped) {
      diagnosis.issues.push('Supabase 쿼리 실패');
      diagnosis.recommendations.push('Supabase 프로젝트 설정과 RLS 정책을 확인하세요');
    }

    if (alternativeTest.success) {
      diagnosis.overallStatus = 'partial';
      diagnosis.recommendations.push('대안 방법(fetch)을 사용하여 Supabase에 연결할 수 있습니다');
    } else if (queryTest.success) {
      diagnosis.overallStatus = 'success';
    } else {
      diagnosis.overallStatus = 'failed';
    }

    debugInfo.diagnosis = diagnosis;

    console.log('🔍 디버그 완료:', diagnosis.overallStatus);

    res.status(200).json({
      success: true,
      debugInfo
    });

  } catch (error) {
    console.error('❌ 디버그 중 치명적 오류:', error);
    debugInfo.errors.push(`치명적 오류: ${error.message}`);
    
    res.status(500).json({
      success: false,
      error: error.message,
      debugInfo
    });
  }
}
