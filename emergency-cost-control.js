#!/usr/bin/env node

/**
 * 🚨 긴급 비용 제어 스크립트
 * Google Cloud API 사용량 급증 시 즉시 실행
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function emergencyCostControl() {
  console.log('🚨 긴급 비용 제어 시작...');
  
  try {
    // 1. 최근 24시간 API 사용량 확인
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { data: recentUsage, error } = await supabase
      .from('ai_usage_logs')
      .select('*')
      .gte('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ 사용량 조회 실패:', error);
      return;
    }
    
    console.log(`📊 최근 24시간 API 사용량: ${recentUsage.length}회`);
    
    // 2. 비용 계산
    const totalCost = recentUsage.reduce((sum, log) => sum + (log.cost || 0), 0);
    console.log(`💰 최근 24시간 비용: $${totalCost.toFixed(4)}`);
    
    // 3. 비용 임계값 체크
    const COST_THRESHOLD = 10; // $10
    if (totalCost > COST_THRESHOLD) {
      console.log('🚨 비용 임계값 초과! 긴급 조치 필요');
      
      // 4. 환경 변수 비활성화 안내
      console.log('\n🔧 즉시 조치 방법:');
      console.log('1. .env.local 파일에서 다음 키들을 "disabled"로 변경:');
      console.log('   GOOGLE_API_KEY=disabled');
      console.log('   GOOGLE_AI_API_KEY=disabled');
      console.log('   GOOGLE_VISION_API_KEY=disabled');
      console.log('\n2. Vercel 환경 변수도 동일하게 업데이트');
      console.log('\n3. Google Cloud Console에서 API 할당량을 0으로 설정');
      
      // 5. 대안 서비스 안내
      console.log('\n💡 대안 서비스:');
      console.log('- FAL AI: $0.01/이미지 (가장 저렴)');
      console.log('- Replicate: $0.05/이미지');
      console.log('- OpenAI DALL-E: $0.04/이미지');
      
      // 6. 환불 신청 안내
      console.log('\n🔄 환불 신청:');
      console.log('1. https://console.cloud.google.com/billing 접속');
      console.log('2. Billing → Account Management → Request a refund');
      console.log('3. 환불 사유: "Unexpected high usage due to API misconfiguration"');
      
    } else {
      console.log('✅ 비용이 정상 범위 내에 있습니다.');
    }
    
    // 7. 사용량 상위 API 확인
    const apiStats = {};
    recentUsage.forEach(log => {
      const api = log.api_name || 'unknown';
      apiStats[api] = (apiStats[api] || 0) + 1;
    });
    
    console.log('\n📈 API별 사용량:');
    Object.entries(apiStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([api, count]) => {
        console.log(`   ${api}: ${count}회`);
      });
    
  } catch (error) {
    console.error('❌ 긴급 비용 제어 실패:', error);
  }
}

// 실행
if (require.main === module) {
  emergencyCostControl();
}

module.exports = { emergencyCostControl };
