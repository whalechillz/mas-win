require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAIUsageData() {
  try {
    console.log('📊 AI 사용량 데이터 확인 시작...');

    // 전체 사용량 데이터 조회
    const { data: allData, error: allError } = await supabase
      .from('ai_usage_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (allError) {
      console.log('❌ 데이터 조회 에러:', allError);
      return;
    }

    console.log(`📈 총 ${allData.length}개의 AI 사용량 로그가 있습니다.`);

    if (allData.length > 0) {
      console.log('\n📋 최근 사용량 로그:');
      allData.slice(0, 5).forEach((log, index) => {
        console.log(`\n${index + 1}. ${log.api_endpoint}`);
        console.log(`   모델: ${log.model}`);
        console.log(`   토큰: ${log.input_tokens} + ${log.output_tokens} = ${log.total_tokens}`);
        console.log(`   비용: $${log.cost}`);
        console.log(`   시간: ${new Date(log.created_at).toLocaleString()}`);
        console.log(`   개선 타입: ${log.improvement_type}`);
        console.log(`   콘텐츠 타입: ${log.content_type}`);
      });

      // 통계 계산
      const totalRequests = allData.length;
      const totalTokens = allData.reduce((sum, log) => sum + (log.total_tokens || 0), 0);
      const totalCost = allData.reduce((sum, log) => sum + (log.cost || 0), 0);
      const avgCostPerRequest = totalCost / totalRequests;

      console.log('\n📊 전체 통계:');
      console.log(`   총 요청수: ${totalRequests}회`);
      console.log(`   총 토큰: ${totalTokens.toLocaleString()}개`);
      console.log(`   총 비용: $${totalCost.toFixed(6)}`);
      console.log(`   평균 비용/요청: $${avgCostPerRequest.toFixed(6)}`);

      // 모델별 통계
      const modelStats = {};
      allData.forEach(log => {
        if (!modelStats[log.model]) {
          modelStats[log.model] = {
            requests: 0,
            tokens: 0,
            cost: 0
          };
        }
        modelStats[log.model].requests++;
        modelStats[log.model].tokens += log.total_tokens || 0;
        modelStats[log.model].cost += log.cost || 0;
      });

      console.log('\n🤖 모델별 통계:');
      Object.entries(modelStats).forEach(([model, stats]) => {
        console.log(`   ${model}:`);
        console.log(`     요청수: ${stats.requests}회`);
        console.log(`     토큰: ${stats.tokens.toLocaleString()}개`);
        console.log(`     비용: $${stats.cost.toFixed(6)}`);
      });

      // 엔드포인트별 통계
      const endpointStats = {};
      allData.forEach(log => {
        if (!endpointStats[log.api_endpoint]) {
          endpointStats[log.api_endpoint] = {
            requests: 0,
            tokens: 0,
            cost: 0
          };
        }
        endpointStats[log.api_endpoint].requests++;
        endpointStats[log.api_endpoint].tokens += log.total_tokens || 0;
        endpointStats[log.api_endpoint].cost += log.cost || 0;
      });

      console.log('\n🔗 엔드포인트별 통계:');
      Object.entries(endpointStats).forEach(([endpoint, stats]) => {
        console.log(`   ${endpoint}:`);
        console.log(`     요청수: ${stats.requests}회`);
        console.log(`     토큰: ${stats.tokens.toLocaleString()}개`);
        console.log(`     비용: $${stats.cost.toFixed(6)}`);
      });

    } else {
      console.log('📭 아직 AI 사용량 데이터가 없습니다.');
      console.log('💡 AI 개선 기능을 사용하면 데이터가 저장됩니다.');
    }

  } catch (error) {
    console.error('❌ 데이터 확인 중 오류 발생:', error);
  }
}

checkAIUsageData().then(() => {
  console.log('\n🏁 AI 사용량 데이터 확인 완료');
  process.exit(0);
}).catch((error) => {
  console.error('❌ 스크립트 실행 중 오류:', error);
  process.exit(1);
});
