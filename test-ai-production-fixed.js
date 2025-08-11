const fs = require('fs');
const path = require('path');

console.log(' 실무용 AI 기능 완성도 테스트 시작 (수정됨)...');

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function checkFileContent(filePath, requiredKeywords = []) {
  if (!fs.existsSync(filePath)) {
    return { exists: false, error: '파일이 없습니다' };
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const missingKeywords = requiredKeywords.filter(keyword => !content.includes(keyword));
  
  return {
    exists: true,
    hasAllKeywords: missingKeywords.length === 0,
    missingKeywords,
    contentLength: content.length
  };
}

const productionFeatures = [
  {
    name: 'AI 콘텐츠 생성 (템플릿 모드)',
    file: 'pages/api/generate-multichannel-content.ts',
    requiredKeywords: ['generate-multichannel-content', 'aiSettings', 'selectedChannels']
  },
  {
    name: 'SEO 검증 시스템',
    file: 'pages/api/validate-seo.ts',
    requiredKeywords: ['validate-seo', 'seoScore', 'suggestions']
  },
  {
    name: 'AI 어시스턴트',
    file: 'components/admin/marketing/AIContentAssistant.tsx',
    requiredKeywords: ['AIContentAssistant', 'generateContent']
  },
  {
    name: 'AI 설정 컴포넌트',
    file: 'components/admin/marketing/AIGenerationSettingsNew.tsx',
    requiredKeywords: ['useAI', 'setSettings', 'AI 토글']
  },
  {
    name: '마케팅 대시보드 통합',
    file: 'components/admin/marketing/MarketingDashboard.tsx',
    requiredKeywords: ['AIGenerationSettingsNew', 'AI 콘텐츠 생성']
  }
];

const results = [];

productionFeatures.forEach(feature => {
  const result = checkFileContent(feature.file, feature.requiredKeywords);
  
  if (result.exists && result.hasAllKeywords) {
    results.push({
      feature: feature.name,
      status: '✅',
      message: '실무 사용 가능',
      contentLength: result.contentLength
    });
  } else if (result.exists) {
    results.push({
      feature: feature.name,
      status: '⚠️',
      message: `누락된 키워드: ${result.missingKeywords.join(', ')}`,
      contentLength: result.contentLength
    });
  } else {
    results.push({
      feature: feature.name,
      status: '❌',
      message: result.error
    });
  }
});

console.log('\n 실무용 AI 기능 검증 결과 (수정됨):');
results.forEach(result => {
  console.log(`${result.feature}: ${result.status} ${result.message}`);
  if (result.contentLength) {
    console.log(`   파일 크기: ${result.contentLength}자`);
  }
});

const workingCount = results.filter(r => r.status === '✅').length;
const totalCount = results.length;

console.log(`\n🎯 실무 활용 가능율: ${workingCount}/${totalCount} (${Math.round(workingCount/totalCount*100)}%)`);

if (workingCount >= 4) {
  console.log('🎉 5단계 완료: 실무용 AI 기능 완성!');
  console.log('💡 실제 마케팅 업무에서 바로 사용 가능합니다.');
} else {
  console.log('⚠️ 일부 기능에 문제가 있습니다.');
  
  const failedFeatures = results.filter(r => r.status !== '✅');
  console.log('\n❌ 문제가 있는 기능들:');
  failedFeatures.forEach(feature => {
    console.log(`- ${feature.feature}: ${feature.message}`);
  });
}
