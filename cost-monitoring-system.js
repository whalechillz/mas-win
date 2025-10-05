#!/usr/bin/env node

/**
 * 💰 비용 모니터링 및 제어 시스템
 * Google API 사용량 추적 및 자동 제한
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 비용 제한 설정
const COST_LIMITS = {
  daily: 5,      // 일일 $5
  monthly: 50,   // 월 $50
  perRequest: 0.1 // 요청당 $0.1
};

// API별 비용 (USD)
const API_COSTS = {
  'google-vision': 0.0015,  // $1.50/1000회
  'google-ai-imagen': 0.04, // $0.04/이미지
  'google-ai-gemini': 0.0005, // $0.0005/1K tokens
  'fal-ai': 0.01,          // $0.01/이미지
  'replicate': 0.05,       // $0.05/이미지
  'openai-dalle': 0.04     // $0.04/이미지
};

class CostMonitor {
  constructor() {
    this.dailyUsage = new Map();
    this.monthlyUsage = new Map();
  }

  // API 사용 전 비용 체크
  async checkCostLimit(apiName, estimatedCost) {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().substring(0, 7);

    // 일일 사용량 체크
    const dailyCost = await this.getDailyCost(today);
    if (dailyCost + estimatedCost > COST_LIMITS.daily) {
      throw new Error(`일일 비용 한도 초과: $${dailyCost.toFixed(2)} + $${estimatedCost.toFixed(2)} > $${COST_LIMITS.daily}`);
    }

    // 월간 사용량 체크
    const monthlyCost = await this.getMonthlyCost(thisMonth);
    if (monthlyCost + estimatedCost > COST_LIMITS.monthly) {
      throw new Error(`월간 비용 한도 초과: $${monthlyCost.toFixed(2)} + $${estimatedCost.toFixed(2)} > $${COST_LIMITS.monthly}`);
    }

    // 요청당 비용 체크
    if (estimatedCost > COST_LIMITS.perRequest) {
      throw new Error(`요청당 비용 한도 초과: $${estimatedCost.toFixed(2)} > $${COST_LIMITS.perRequest}`);
    }

    return true;
  }

  // 일일 비용 조회
  async getDailyCost(date) {
    const { data, error } = await supabase
      .from('ai_usage_logs')
      .select('cost')
      .gte('created_at', `${date}T00:00:00.000Z`)
      .lt('created_at', `${date}T23:59:59.999Z`);

    if (error) {
      console.error('일일 비용 조회 실패:', error);
      return 0;
    }

    return data.reduce((sum, log) => sum + (log.cost || 0), 0);
  }

  // 월간 비용 조회
  async getMonthlyCost(month) {
    const { data, error } = await supabase
      .from('ai_usage_logs')
      .select('cost')
      .gte('created_at', `${month}-01T00:00:00.000Z`)
      .lt('created_at', `${month}-31T23:59:59.999Z`);

    if (error) {
      console.error('월간 비용 조회 실패:', error);
      return 0;
    }

    return data.reduce((sum, log) => sum + (log.cost || 0), 0);
  }

  // 비용 로그 기록
  async logCost(apiName, action, actualCost, tokens = 0) {
    try {
      await supabase
        .from('ai_usage_logs')
        .insert({
          api_name: apiName,
          action: action,
          total_tokens: tokens,
          cost: actualCost,
          processing_time_ms: 0,
          improvement_type: `${apiName}-${action}`,
          created_at: new Date().toISOString()
        });

      console.log(`💰 비용 로그 기록: ${apiName} - ${action} ($${actualCost.toFixed(4)})`);
    } catch (error) {
      console.error('비용 로그 기록 실패:', error);
    }
  }

  // 비용 알림 발송
  async sendCostAlert(currentCost, limit, period) {
    const alertMessage = `🚨 비용 알림: ${period} 비용이 $${currentCost.toFixed(2)}에 도달했습니다. (한도: $${limit})`;
    
    console.log(alertMessage);
    
    // Slack 알림 (선택사항)
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: alertMessage,
            channel: '#alerts',
            username: 'Cost Monitor'
          })
        });
      } catch (error) {
        console.error('Slack 알림 실패:', error);
      }
    }
  }

  // 비용 리포트 생성
  async generateCostReport() {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().substring(0, 7);

    const dailyCost = await this.getDailyCost(today);
    const monthlyCost = await this.getMonthlyCost(thisMonth);

    console.log('\n📊 비용 리포트');
    console.log('=====================================');
    console.log(`📅 일일 비용 (${today}): $${dailyCost.toFixed(4)} / $${COST_LIMITS.daily}`);
    console.log(`📅 월간 비용 (${thisMonth}): $${monthlyCost.toFixed(4)} / $${COST_LIMITS.monthly}`);
    console.log(`📈 일일 사용률: ${((dailyCost / COST_LIMITS.daily) * 100).toFixed(1)}%`);
    console.log(`📈 월간 사용률: ${((monthlyCost / COST_LIMITS.monthly) * 100).toFixed(1)}%`);

    // API별 사용량
    const { data: apiUsage } = await supabase
      .from('ai_usage_logs')
      .select('api_name, cost')
      .gte('created_at', `${thisMonth}-01T00:00:00.000Z`);

    if (apiUsage) {
      const apiStats = {};
      apiUsage.forEach(log => {
        const api = log.api_name || 'unknown';
        apiStats[api] = (apiStats[api] || 0) + (log.cost || 0);
      });

      console.log('\n🔍 API별 월간 비용:');
      Object.entries(apiStats)
        .sort(([,a], [,b]) => b - a)
        .forEach(([api, cost]) => {
          console.log(`   ${api}: $${cost.toFixed(4)}`);
        });
    }

    return { dailyCost, monthlyCost };
  }
}

// 비용 모니터링 실행
async function runCostMonitoring() {
  const monitor = new CostMonitor();
  
  try {
    console.log('💰 비용 모니터링 시작...');
    
    const report = await monitor.generateCostReport();
    
    // 알림 체크
    if (report.dailyCost > COST_LIMITS.daily * 0.8) {
      await monitor.sendCostAlert(report.dailyCost, COST_LIMITS.daily, '일일');
    }
    
    if (report.monthlyCost > COST_LIMITS.monthly * 0.8) {
      await monitor.sendCostAlert(report.monthlyCost, COST_LIMITS.monthly, '월간');
    }
    
    console.log('\n✅ 비용 모니터링 완료');
    
  } catch (error) {
    console.error('❌ 비용 모니터링 실패:', error);
  }
}

// 실행
if (require.main === module) {
  runCostMonitoring();
}

module.exports = { CostMonitor, runCostMonitoring };
