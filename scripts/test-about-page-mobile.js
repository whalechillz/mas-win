const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  
  // iPhone 12 Pro 시뮬레이션
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  });
  
  const page = await context.newPage();
  
  console.log('📱 브랜드 페이지 모바일 분석 시작...\n');
  
  // 프로덕션 URL
  const url = 'https://www.masgolf.co.kr/about';
  console.log(`🌐 페이지 로드: ${url}`);
  
  await page.goto(url, { 
    waitUntil: 'networkidle',
    timeout: 30000 
  });
  
  // 페이지 로드 대기
  await page.waitForTimeout(3000);
  
  // 결과 디렉토리 생성
  const resultsDir = 'test-results';
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  // 전체 페이지 스크린샷
  await page.screenshot({ 
    path: path.join(resultsDir, 'about-page-mobile-full.png'),
    fullPage: true 
  });
  console.log('✅ 전체 페이지 스크린샷 저장');
  
  // 히어로 섹션만 캡처
  try {
    const heroSection = await page.locator('section').first();
    await heroSection.screenshot({ 
      path: path.join(resultsDir, 'about-page-mobile-hero.png')
    });
    console.log('✅ 히어로 섹션 스크린샷 저장');
  } catch (e) {
    console.log(`⚠️ 히어로 섹션 캡처 실패: ${e.message}`);
  }
  
  // 텍스트 크기 및 레이아웃 정보 수집
  const analysis = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const h2Elements = Array.from(document.querySelectorAll('h2'));
    const paragraphs = Array.from(document.querySelectorAll('section p'));
    const buttons = Array.from(document.querySelectorAll('a[href], button'));
    const sections = Array.from(document.querySelectorAll('section'));
    
    return {
      hero: {
        h1: h1 ? {
          text: h1.textContent?.trim(),
          fontSize: window.getComputedStyle(h1).fontSize,
          lineHeight: window.getComputedStyle(h1).lineHeight,
          width: h1.offsetWidth,
          height: h1.offsetHeight,
          lines: Math.ceil(h1.offsetHeight / parseFloat(window.getComputedStyle(h1).lineHeight))
        } : null,
        paragraphs: paragraphs.slice(0, 3).map(p => ({
          text: p.textContent?.trim().substring(0, 50),
          fontSize: window.getComputedStyle(p).fontSize,
          width: p.offsetWidth,
          lines: Math.ceil(p.offsetHeight / parseFloat(window.getComputedStyle(p).lineHeight))
        }))
      },
      sections: sections.map((section, index) => {
        const h2 = section.querySelector('h2');
        return {
          index,
          h2: h2 ? {
            text: h2.textContent?.trim(),
            fontSize: window.getComputedStyle(h2).fontSize
          } : null,
          height: section.offsetHeight,
          padding: {
            top: window.getComputedStyle(section).paddingTop,
            bottom: window.getComputedStyle(section).paddingBottom
          }
        };
      }),
      buttons: buttons.slice(0, 5).map(btn => ({
        text: btn.textContent?.trim().substring(0, 30),
        fontSize: window.getComputedStyle(btn).fontSize,
        width: btn.offsetWidth,
        height: btn.offsetHeight
      })),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  });
  
  console.log('\n📊 분석 결과:');
  console.log('='.repeat(60));
  console.log('\n🎯 히어로 섹션:');
  if (analysis.hero.h1) {
    console.log(`  메인 타이틀: ${analysis.hero.h1.text}`);
    console.log(`  폰트 크기: ${analysis.hero.h1.fontSize}`);
    console.log(`  줄 수: ${analysis.hero.h1.lines}`);
    console.log(`  너비: ${analysis.hero.h1.width}px`);
  }
  analysis.hero.paragraphs.forEach((p, i) => {
    console.log(`  문단 ${i + 1}: ${p.text}...`);
    console.log(`    폰트 크기: ${p.fontSize}, 줄 수: ${p.lines}`);
  });
  
  console.log('\n📑 섹션 정보:');
  analysis.sections.forEach((section, i) => {
    if (section.h2) {
      console.log(`  섹션 ${i + 1}: ${section.h2.text}`);
      console.log(`    제목 폰트: ${section.h2.fontSize}`);
      console.log(`    섹션 높이: ${section.height}px`);
    }
  });
  
  console.log('\n🔘 버튼 정보:');
  analysis.buttons.forEach((btn, i) => {
    console.log(`  버튼 ${i + 1}: ${btn.text}`);
    console.log(`    폰트: ${btn.fontSize}, 크기: ${btn.width}x${btn.height}px`);
  });
  
  console.log('\n📱 뷰포트:');
  console.log(`  너비: ${analysis.viewport.width}px`);
  console.log(`  높이: ${analysis.viewport.height}px`);
  
  // 개선 제안
  console.log('\n💡 개선 제안:');
  console.log('='.repeat(60));
  
  if (analysis.hero.h1 && analysis.hero.h1.lines === 1 && analysis.hero.h1.width > 350) {
    console.log('⚠️ 메인 타이틀이 한 줄로 표시되어 가독성 저하');
    console.log('   → 모바일에서 행바꿈 필요');
  }
  
  analysis.hero.paragraphs.forEach((p, i) => {
    if (p.lines === 1 && p.width > 350) {
      console.log(`⚠️ 문단 ${i + 1}이 한 줄로 표시되어 가독성 저하`);
      console.log('   → 모바일에서 행바꿈 고려');
    }
  });
  
  analysis.sections.forEach((section, i) => {
    if (section.h2 && parseFloat(section.h2.fontSize) > 36) {
      console.log(`⚠️ 섹션 ${i + 1} 제목 폰트가 모바일에서 너무 큼 (${section.h2.fontSize})`);
      console.log('   → 모바일 폰트 크기 조정 필요');
    }
  });
  
  // 결과를 JSON으로 저장
  fs.writeFileSync(
    path.join(resultsDir, 'about-page-analysis.json'),
    JSON.stringify(analysis, null, 2)
  );
  console.log('\n✅ 분석 결과 저장: test-results/about-page-analysis.json');
  
  await browser.close();
  console.log('\n✅ 분석 완료!');
})();

