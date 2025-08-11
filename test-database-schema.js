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

console.log(' 데이터베이스 스키마 검증 시작...');

async function testDatabaseSchema() {
  const requiredTables = [
    'page_views',
    'bookings', 
    'contacts',
    'customer_profiles',
    'campaign_metrics',
    'content_ideas',
    'monthly_themes'
  ];
  
  const results = [];
  
  for (const tableName of requiredTables) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        results.push({ 
          table: tableName, 
          status: '❌', 
          error: error.message,
          exists: false 
        });
      } else {
        results.push({ 
          table: tableName, 
          status: '✅', 
          count: count || 0,
          exists: true 
        });
      }
    } catch (error) {
      results.push({ 
        table: tableName, 
        status: '❌', 
        error: error.message,
        exists: false 
      });
    }
  }
  
  return results;
}

testDatabaseSchema().then(results => {
  console.log('\n📊 데이터베이스 스키마 검증 결과:');
  results.forEach(result => {
    if (result.status === '✅') {
      console.log(`${result.table}: ${result.status} (${result.count}개 레코드)`);
    } else {
      console.log(`${result.table}: ${result.status} ${result.error}`);
    }
  });
  
  const existingTables = results.filter(r => r.exists).length;
  const totalTables = results.length;
  
  console.log(`\n🎯 테이블 존재율: ${existingTables}/${totalTables} (${Math.round(existingTables/totalTables*100)}%)`);
  
  if (existingTables === totalTables) {
    console.log('�� 3단계 완료: 데이터베이스 스키마 검증 성공!');
  } else {
    console.log('⚠️ 일부 테이블이 없습니다. 생성이 필요합니다.');
    
    const missingTables = results.filter(r => !r.exists).map(r => r.table);
    console.log('❌ 누락된 테이블:', missingTables.join(', '));
  }
});
