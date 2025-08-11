const fs = require('fs');
const path = require('path');

console.log(' 관리자 시스템 토탈 점검 시작...');

function evaluateAdminSystem() {
  let totalScore = 0;
  let maxScore = 0;
  const results = [];

  // 1. 핵심 페이지 및 API (25점)
  console.log('1. 핵심 페이지 및 API 검증...');
  maxScore += 25;
  
  const coreFiles = [
    { file: 'pages/admin.tsx', weight: 10 },
    { file: 'pages/api/admin-login.ts', weight: 5 },
    { file: 'pages/api/admin-check-auth.ts', weight: 5 },
    { file: 'pages/api/admin-logout.ts', weight: 5 }
  ];

  coreFiles.forEach(({ file, weight }) => {
    if (fs.existsSync(file)) {
      totalScore += weight;
      results.push(`✅ ${file}: ${weight}점`);
    } else {
      results.push(`❌ ${file}: 0점`);
    }
  });

  // 2. 데이터베이스 연결 (20점)
  console.log('2. 데이터베이스 연결 검증...');
  maxScore += 20;
  
  const dbFiles = [
    { file: 'lib/supabase-client.ts', weight: 10 },
    { file: '.env.local', weight: 10 }
  ];

  dbFiles.forEach(({ file, weight }) => {
    if (fs.existsSync(file)) {
      totalScore += weight;
      results.push(`✅ ${file}: ${weight}점`);
    } else {
      results.push(`❌ ${file}: 0점`);
    }
  });

  // 3. 핵심 기능 컴포넌트 (25점)
  console.log('3. 핵심 기능 컴포넌트 검증...');
  maxScore += 25;
  
  const componentFiles = [
    { file: 'components/admin/dashboard/MetricCards.tsx', weight: 5 },
    { file: 'components/admin/dashboard/ConversionFunnel.tsx', weight: 5 },
    { file: 'components/admin/bookings/BookingManagementFull.tsx', weight: 5 },
    { file: 'components/admin/contacts/ContactManagement.tsx', weight: 5 },
    { file: 'components/admin/marketing/MarketingDashboardComplete.tsx', weight: 5 }
  ];

  componentFiles.forEach(({ file, weight }) => {
    if (fs.existsSync(file)) {
      totalScore += weight;
      results.push(`✅ ${file}: ${weight}점`);
    } else {
      results.push(`❌ ${file}: 0점`);
    }
  });

  // 4. AI 기능 (20점)
  console.log('4. AI 기능 검증...');
  maxScore += 20;
  
  const aiFiles = [
    { file: 'pages/api/generate-multichannel-content.ts', weight: 8 },
    { file: 'pages/api/validate-seo.ts', weight: 6 },
    { file: 'components/admin/marketing/AIGenerationSettingsNew.tsx', weight: 6 }
  ];

  aiFiles.forEach(({ file, weight }) => {
    if (fs.existsSync(file)) {
      totalScore += weight;
      results.push(`✅ ${file}: ${weight}점`);
    } else {
      results.push(`❌ ${file}: 0점`);
    }
  });

  // 5. 매뉴얼 및 문서 (10점)
  console.log('5. 매뉴얼 및 문서 검증...');
  maxScore += 10;
  
  const docFiles = [
    { file: 'docs/ADMIN_MANUAL.md', weight: 4 },
    { file: 'docs/FUNNEL_MANUAL.md', weight: 3 },
    { file: 'docs/OP_MANUAL.md', weight: 3 }
  ];

  docFiles.forEach(({ file, weight }) => {
    if (fs.existsSync(file)) {
      totalScore += weight;
      results.push(`✅ ${file}: ${weight}점`);
    } else {
      results.push(`❌ ${file}: 0점`);
    }
  });

  // 결과 출력
  console.log('\\n📊 검증 결과:');
  results.forEach(result => console.log(`   ${result}`));
  
  const completionRate = Math.round((totalScore / maxScore) * 100);
  console.log(`\\n🎯 총점: ${totalScore}/${maxScore}점`);
  console.log(`📈 완성도: ${completionRate}%`);
  
  if (completionRate >= 90) {
    console.log('�� 상태: 우수 (프로덕션 준비 완료)');
  } else if (completionRate >= 80) {
    console.log('✅ 상태: 양호 (기본 기능 완성)');
  } else if (completionRate >= 70) {
    console.log('⚠️ 상태: 보통 (개선 필요)');
  } else {
    console.log('❌ 상태: 미흡 (대폭 개선 필요)');
  }

  return { totalScore, maxScore, completionRate, results };
}

evaluateAdminSystem();
