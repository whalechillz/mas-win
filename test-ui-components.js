const fs = require('fs');
const path = require('path');

console.log(' UI 컴포넌트 통합 검증 시작...');

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function checkFileContent(filePath, requiredImports = []) {
  if (!fs.existsSync(filePath)) {
    return { exists: false, error: '파일이 없습니다' };
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const missingImports = [];
  
  requiredImports.forEach(importItem => {
    if (!content.includes(importItem)) {
      missingImports.push(importItem);
    }
  });
  
  return {
    exists: true,
    hasAllImports: missingImports.length === 0,
    missingImports,
    content: content.substring(0, 200) + '...'
  };
}

const componentTests = [
  {
    name: 'pages/admin.tsx',
    path: 'pages/admin.tsx',
    requiredImports: ['supabase', 'useState', 'useEffect']
  },
  {
    name: 'MarketingDashboard.tsx',
    path: 'components/admin/marketing/MarketingDashboard.tsx',
    requiredImports: ['useState', 'useEffect', 'AIGenerationSettingsNew']
  },
  {
    name: 'AIGenerationSettingsNew.tsx',
    path: 'components/admin/marketing/AIGenerationSettingsNew.tsx',
    requiredImports: ['useState', 'useEffect', 'Zap', 'Brain']
  },
  {
    name: 'lib/supabase-client.ts',
    path: 'lib/supabase-client.ts',
    requiredImports: ['createClient', 'NEXT_PUBLIC_SUPABASE_URL']
  },
  {
    name: 'lib/supabase.ts',
    path: 'lib/supabase.ts',
    requiredImports: ['createClient', 'SUPABASE_SERVICE_ROLE_KEY']
  }
];

const results = [];

componentTests.forEach(test => {
  const result = checkFileContent(test.path, test.requiredImports);
  
  if (result.exists && result.hasAllImports) {
    results.push({ 
      component: test.name, 
      status: '✅', 
      message: '정상' 
    });
  } else if (result.exists) {
    results.push({ 
      component: test.name, 
      status: '⚠️', 
      message: `누락된 import: ${result.missingImports.join(', ')}` 
    });
  } else {
    results.push({ 
      component: test.name, 
      status: '❌', 
      message: result.error 
    });
  }
});

console.log('\n�� UI 컴포넌트 검증 결과:');
results.forEach(result => {
  console.log(`${result.component}: ${result.status} ${result.message}`);
});

const successCount = results.filter(r => r.status === '✅').length;
const totalCount = results.length;

console.log(`\n🎯 컴포넌트 정상율: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);

if (successCount === totalCount) {
  console.log('�� 4단계 완료: UI 컴포넌트 통합 검증 성공!');
} else {
  console.log('⚠️ 일부 컴포넌트에 문제가 있습니다. 수정이 필요합니다.');
}
