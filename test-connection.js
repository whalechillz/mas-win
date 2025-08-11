const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// .env.local 파일 직접 읽기
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
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('�� Supabase 연결 테스트 시작...');
console.log('URL:', supabaseUrl);
console.log('Key exists:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 환경변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('page_views')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ 연결 실패:', error.message);
      return false;
    }
    
    console.log('✅ Supabase 연결 성공!');
    console.log('�� page_views 테이블 레코드 수:', data);
    return true;
  } catch (error) {
    console.error('❌ 연결 테스트 실패:', error.message);
    return false;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('🎉 1단계 완료: 데이터베이스 연결 통일화 성공!');
  } else {
    console.log('💥 1단계 실패: 연결 문제 발생');
  }
});
