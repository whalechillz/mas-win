// 통합 마케팅 시스템 자동화 테스트 스크립트
// 실행: node tests/integrated-marketing/integration-test.js

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// 환경 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 테스트 유틸리티
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`)
};

// 테스트 데이터
const testData = {
  funnelPlan: {
    year: 2025,
    month: 8,
    theme: '테스트 캠페인',
    funnel_data: {
      stages: {
        awareness: {
          goal: '테스트 인지도 향상',
          channels: ['blog', 'instagram'],
          expectedReach: 10000
        },
        interest: {
          goal: '테스트 관심도 증가',
          channels: ['kakao', 'email'],
          expectedCTR: 2.5
        },
        consideration: {
          goal: '테스트 구매 고려',
          landingPageUrl: '/test-campaign',
          expectedConversion: 1.5
        },
        purchase: {
          goal: '테스트 매출',
          promotions: ['테스트 프로모션'],
          expectedRevenue: 5000000
        }
      }
    }
  }
};

// 테스트 함수들
async function testDatabaseConnection() {
  log.info('데이터베이스 연결 테스트 시작...');
  
  try {
    const { data, error } = await supabase
      .from('monthly_funnel_plans')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    log.success('데이터베이스 연결 성공');
    return true;
  } catch (error) {
    log.error(`데이터베이스 연결 실패: ${error.message}`);
    return false;
  }
}

async function testFunnelPlanAPI() {
  log.info('퍼널 계획 API 테스트 시작...');
  
  try {
    // 1. 생성 테스트
    const createResponse = await axios.post(
      `${API_BASE_URL}/integrated/funnel-plans`,
      testData.funnelPlan
    );
    
    if (createResponse.status !== 200) throw new Error('생성 실패');
    log.success('퍼널 계획 생성 성공');
    
    const createdId = createResponse.data.data[0].id;
    
    // 2. 조회 테스트
    const getResponse = await axios.get(
      `${API_BASE_URL}/integrated/funnel-plans?year=2025&month=8`
    );
    
    if (getResponse.status !== 200) throw new Error('조회 실패');
    log.success('퍼널 계획 조회 성공');
    
    // 3. 수정 테스트
    const updateResponse = await axios.put(
      `${API_BASE_URL}/integrated/funnel-plans/${createdId}`,
      { status: 'active' }
    );
    
    if (updateResponse.status !== 200) throw new Error('수정 실패');
    log.success('퍼널 계획 수정 성공');
    
    // 4. 삭제 테스트
    const deleteResponse = await axios.delete(
      `${API_BASE_URL}/integrated/funnel-plans/${createdId}`
    );
    
    if (deleteResponse.status !== 200) throw new Error('삭제 실패');
    log.success('퍼널 계획 삭제 성공');
    
    return true;
  } catch (error) {
    log.error(`퍼널 계획 API 테스트 실패: ${error.message}`);
    return false;
  }
}

async function testContentGenerationAPI() {
  log.info('콘텐츠 생성 API 테스트 시작...');
  
  try {
    // 먼저 퍼널 계획 생성
    const { data: funnelPlan } = await supabase
      .from('monthly_funnel_plans')
      .insert(testData.funnelPlan)
      .select()
      .single();
    
    // 콘텐츠 생성 테스트
    const generateResponse = await axios.post(
      `${API_BASE_URL}/integrated/generate-content`,
      {
        funnelPlanId: funnelPlan.id,
        channels: ['blog', 'kakao'],
        tone: 'professional',
        keywords: ['테스트', '캠페인']
      }
    );
    
    if (generateResponse.status !== 200) throw new Error('콘텐츠 생성 실패');
    log.success('콘텐츠 생성 성공');
    
    // 생성된 콘텐츠 검증
    const validateResponse = await axios.post(
      `${API_BASE_URL}/integrated/validate-content`,
      {
        contentId: generateResponse.data.contents[0].id
      }
    );
    
    if (validateResponse.status !== 200) throw new Error('콘텐츠 검증 실패');
    log.success('콘텐츠 검증 성공');
    
    // 정리
    await supabase
      .from('monthly_funnel_plans')
      .delete()
      .eq('id', funnelPlan.id);
    
    return true;
  } catch (error) {
    log.error(`콘텐츠 생성 API 테스트 실패: ${error.message}`);
    return false;
  }
}

async function testKPIAPI() {
  log.info('KPI API 테스트 시작...');
  
  try {
    // KPI 조회
    const getResponse = await axios.get(
      `${API_BASE_URL}/integrated/kpi?year=2025&month=7`
    );
    
    if (getResponse.status !== 200) throw new Error('KPI 조회 실패');
    log.success('KPI 조회 성공');
    
    // KPI 동기화
    const syncResponse = await axios.post(
      `${API_BASE_URL}/integrated/kpi-sync`,
      {
        year: 2025,
        month: 7
      }
    );
    
    if (syncResponse.status !== 200) throw new Error('KPI 동기화 실패');
    log.success('KPI 동기화 성공');
    
    return true;
  } catch (error) {
    log.error(`KPI API 테스트 실패: ${error.message}`);
    return false;
  }
}

async function testWorkflow() {
  log.info('전체 워크플로우 테스트 시작...');
  
  try {
    // 1. 퍼널 계획 생성
    const { data: funnelPlan } = await supabase
      .from('monthly_funnel_plans')
      .insert({
        year: 2025,
        month: 9,
        theme: '워크플로우 테스트',
        funnel_data: testData.funnelPlan.funnel_data
      })
      .select()
      .single();
    
    log.success('1단계: 퍼널 계획 생성 완료');
    
    // 2. 퍼널 페이지 생성
    const { data: funnelPage } = await supabase
      .from('funnel_pages')
      .insert({
        funnel_plan_id: funnelPlan.id,
        page_data: {
          mainImage: {
            path: '/campaigns/2025-09-workflow-test/main.jpg',
            prompt: '워크플로우 테스트 이미지',
            generatedBy: 'manual'
          },
          content: {
            headline: '워크플로우 테스트 헤드라인',
            subheadline: '서브 헤드라인',
            cta: 'CTA 버튼',
            benefits: ['혜택1', '혜택2']
          }
        }
      })
      .select()
      .single();
    
    log.success('2단계: 퍼널 페이지 생성 완료');
    
    // 3. 콘텐츠 생성
    const { data: contents } = await supabase
      .from('generated_contents')
      .insert([
        {
          funnel_plan_id: funnelPlan.id,
          channel: 'blog',
          content: '테스트 블로그 콘텐츠',
          status: 'draft'
        },
        {
          funnel_plan_id: funnelPlan.id,
          channel: 'kakao',
          content: '테스트 카카오 메시지',
          status: 'draft'
        }
      ])
      .select();
    
    log.success('3단계: 멀티채널 콘텐츠 생성 완료');
    
    // 4. 콘텐츠 검증
    for (const content of contents) {
      await supabase
        .from('generated_contents')
        .update({
          validation_score: {
            seoScore: 85,
            readability: 90,
            brandConsistency: 88,
            channelOptimization: 92,
            suggestions: ['테스트 개선사항']
          },
          status: 'validated'
        })
        .eq('id', content.id);
    }
    
    log.success('4단계: 콘텐츠 검증 완료');
    
    // 5. KPI 업데이트
    const { data: kpi } = await supabase
      .from('monthly_kpis')
      .upsert({
        year: 2025,
        month: 9,
        kpi_data: {
          channels: {
            blog: { target: 10, actual: 2, posts: 2 },
            kakao: { target: 20, actual: 1, posts: 1 }
          },
          overall: { roi: 150, efficiency: 85 }
        }
      })
      .select()
      .single();
    
    log.success('5단계: KPI 업데이트 완료');
    
    // 정리
    await supabase
      .from('monthly_funnel_plans')
      .delete()
      .eq('id', funnelPlan.id);
    
    log.success('전체 워크플로우 테스트 성공!');
    return true;
  } catch (error) {
    log.error(`워크플로우 테스트 실패: ${error.message}`);
    return false;
  }
}

// 메인 테스트 실행
async function runAllTests() {
  console.log('\n🚀 통합 마케팅 시스템 통합 테스트 시작\n');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };
  
  const tests = [
    { name: '데이터베이스 연결', fn: testDatabaseConnection },
    { name: '퍼널 계획 API', fn: testFunnelPlanAPI },
    { name: '콘텐츠 생성 API', fn: testContentGenerationAPI },
    { name: 'KPI API', fn: testKPIAPI },
    { name: '전체 워크플로우', fn: testWorkflow }
  ];
  
  for (const test of tests) {
    console.log(`\n--- ${test.name} ---`);
    results.total++;
    
    const success = await test.fn();
    if (success) {
      results.passed++;
    } else {
      results.failed++;
    }
  }
  
  // 결과 출력
  console.log('\n📊 테스트 결과 요약');
  console.log('─'.repeat(30));
  console.log(`총 테스트: ${results.total}`);
  console.log(`${colors.green}성공: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}실패: ${results.failed}${colors.reset}`);
  console.log(`성공률: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  if (results.failed === 0) {
    console.log(`\n${colors.green}🎉 모든 테스트 통과!${colors.reset}`);
  } else {
    console.log(`\n${colors.red}⚠️ 일부 테스트 실패${colors.reset}`);
  }
}

// 테스트 실행
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testDatabaseConnection,
  testFunnelPlanAPI,
  testContentGenerationAPI,
  testKPIAPI,
  testWorkflow
};