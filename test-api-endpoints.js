const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });
    return envVars;
  }
  return {};
}

const env = loadEnvFile();
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

console.log(' API 엔드포인트 검증 시작...');

async function testAPIs() {
  const results = [];
  
  // 1. track-view API 테스트
  try {
    const { error } = await supabase.from('page_views').insert({
      campaign_id: 'test-2025-07',
      page_url: '/test',
      user_agent: 'test-agent',
      ip_address: '127.0.0.1',
      referer: 'test',
      created_at: new Date().toISOString()
    });
    
    if (error) {
      results.push({ api: 'track-view', status: '❌', error: error.message });
    } else {
      results.push({ api: 'track-view', status: '✅', message: '성공' });
    }
  } catch (error) {
    results.push({ api: 'track-view', status: '❌', error: error.message });
  }
  
  // 2. contact API 테스트
  try {
    const { error } = await supabase.from('contacts').insert({
      name: '테스트',
      phone: '010-1234-5678',
      call_times: '시간무관',
      inquiry_type: 'test',
      notes: 'API 테스트',
      status: 'new',
      created_at: new Date().toISOString()
    });
    
    if (error) {
      results.push({ api: 'contact', status: '❌', error: error.message });
    } else {
      results.push({ api: 'contact', status: '✅', message: '성공' });
    }
  } catch (error) {
    results.push({ api: 'contact', status: '❌', error: error.message });
  }
  
  // 3. booking API 테스트
  try {
    const { error } = await supabase.from('bookings').insert({
      name: '테스트',
      phone: '010-1234-5678',
      date: '2025-07-20',
      time: '14:00',
      club: '드라이버',
      notes: 'API 테스트',
      created_at: new Date().toISOString()
    });
    
    if (error) {
      results.push({ api: 'booking', status: '❌', error: error.message });
    } else {
      results.push({ api: 'booking', status: '✅', message: '성공' });
    }
  } catch (error) {
    results.push({ api: 'booking', status: '❌', error: error.message });
  }
  
  // 4. KPI API 테스트
  try {
    const { data, error } = await supabase
      .from('campaign_metrics')
      .select('*')
      .limit(1);
    
    if (error) {
      results.push({ api: 'kpi', status: '❌', error: error.message });
    } else {
      results.push({ api: 'kpi', status: '✅', message: `데이터 ${data?.length || 0}개` });
    }
  } catch (error) {
    results.push({ api: 'kpi', status: '❌', error: error.message });
  }
  
  return results;
}

testAPIs().then(results => {
  console.log('\n📊 API 검증 결과:');
  results.forEach(result => {
    console.log(`${result.api}: ${result.status} ${result.message || result.error}`);
  });
  
  const successCount = results.filter(r => r.status === '✅').length;
  const totalCount = results.length;
  
  console.log(`\n🎯 성공률: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);
  
  if (successCount === totalCount) {
    console.log('🎉 2단계 완료: API 엔드포인트 검증 성공!');
  } else {
    console.log('⚠️ 일부 API에 문제가 있습니다. 수정이 필요합니다.');
  }
});
