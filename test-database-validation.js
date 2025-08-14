const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// .env.local 파일에서 환경변수 읽기
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function validateDatabase() {
  console.log('🔍 데이터베이스 검증 시작...\n');
  
  try {
    // 1. 연결 테스트
    console.log('1️⃣ Supabase 연결 테스트...');
    const { data: testData, error: testError } = await supabase
      .from('bookings')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('❌ 연결 실패:', testError.message);
      return;
    }
    console.log('✅ 연결 성공!\n');
    
    // 2. 기존 테이블 확인
    console.log('2️⃣ 기존 테이블 확인...');
    const existingTables = [
      'bookings', 'contacts', 'campaign_metrics', 'page_views', 
      'quiz_results', 'team_members', 'blog_platforms', 'content_categories'
    ];
    
    for (const table of existingTables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count}개 레코드`);
      }
    }
    console.log('');
    
    // 3. 통합 마케팅 시스템 테이블 확인
    console.log('3️⃣ 통합 마케팅 시스템 테이블 확인...');
    const marketingTables = [
      'monthly_funnel_plans', 'funnel_pages', 'generated_contents', 
      'monthly_kpis', 'employee_blog_quotas'
    ];
    
    for (const table of marketingTables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count}개 레코드`);
      }
    }
    console.log('');
    
    // 4. 샘플 데이터 확인
    console.log('4️⃣ 샘플 데이터 확인...');
    const { data: funnelPlans, error: funnelError } = await supabase
      .from('monthly_funnel_plans')
      .select('*')
      .limit(5);
    
    if (funnelError) {
      console.log('❌ 퍼널 계획 데이터 조회 실패:', funnelError.message);
    } else {
      console.log('✅ 퍼널 계획 데이터:');
      funnelPlans.forEach(plan => {
        console.log(`   - ${plan.year}년 ${plan.month}월: ${plan.theme} (${plan.status})`);
      });
    }
    
    const { data: employeeQuotas, error: quotaError } = await supabase
      .from('employee_blog_quotas')
      .select('*')
      .limit(5);
    
    if (quotaError) {
      console.log('❌ 직원 할당량 데이터 조회 실패:', quotaError.message);
    } else {
      console.log('✅ 직원 할당량 데이터:');
      employeeQuotas.forEach(quota => {
        console.log(`   - ${quota.employee_name}: ${quota.completed_count}/${quota.quota_count}`);
      });
    }
    
    // 5. API 엔드포인트 테스트
    console.log('\n5️⃣ API 엔드포인트 테스트...');
    try {
      const response = await fetch('http://localhost:3000/api/integrated/funnel-plans');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ 퍼널 계획 API: 정상 작동');
        console.log(`   - 조회된 계획 수: ${data.length}개`);
      } else {
        console.log('❌ 퍼널 계획 API: 오류 발생');
      }
    } catch (error) {
      console.log('❌ 퍼널 계획 API: 연결 실패');
    }
    
    console.log('\n🎉 데이터베이스 검증 완료!');
    
  } catch (error) {
    console.error('❌ 검증 중 오류 발생:', error);
  }
}

validateDatabase(); 