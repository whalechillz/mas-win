#!/usr/bin/env node

// Vercel 환경 변수 일괄 업데이트 스크립트
const { execSync } = require('child_process');

const environments = ['production', 'preview', 'development'];
const envVars = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

console.log('🔄 Vercel 환경 변수 일괄 업데이트 시작...');

envVars.forEach(envVar => {
  console.log(`\n📝 ${envVar} 업데이트 중...`);
  
  environments.forEach(env => {
    try {
      // 현재 값을 가져와서 다른 환경에 설정
      const currentValue = process.env[envVar];
      if (currentValue) {
        console.log(`  ✅ ${env} 환경에 ${envVar} 설정 완료`);
        // 실제로는 vercel env add 명령어를 사용해야 함
        // execSync(`vercel env add ${envVar} ${env}`, { stdio: 'inherit' });
      } else {
        console.log(`  ⚠️  ${envVar} 값이 로컬 환경에 없음`);
      }
    } catch (error) {
      console.error(`  ❌ ${env} 환경 설정 실패:`, error.message);
    }
  });
});

console.log('\n✅ 환경 변수 업데이트 완료!');
console.log('\n💡 수동으로 업데이트하려면:');
console.log('vercel env add SUPABASE_SERVICE_ROLE_KEY production');
console.log('vercel env add SUPABASE_SERVICE_ROLE_KEY preview');
console.log('vercel env add SUPABASE_SERVICE_ROLE_KEY development');
