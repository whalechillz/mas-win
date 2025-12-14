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
  
  console.log('📱 모바일 시타 예약 페이지 분석 시작...\n');
  
  // 프로덕션 URL
  const url = 'https://www.masgolf.co.kr/try-a-massgoo';
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
    path: path.join(resultsDir, 'try-a-massgoo-mobile-full.png'),
    fullPage: true 
  });
  console.log('✅ 전체 페이지 스크린샷 저장');
  
  // 히어로 섹션만 캡처
  try {
    const heroSection = await page.locator('section').first();
    await heroSection.screenshot({ 
      path: path.join(resultsDir, 'try-a-massgoo-mobile-hero.png')
    });
    console.log('✅ 히어로 섹션 스크린샷 저장');
  } catch (e) {
    console.log(`⚠️ 히어로 섹션 캡처 실패: ${e.message}`);
  }
  
  // 매장 정보 섹션 캡처
  try {
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(1000);
    
    const storeInfo = await page.locator('text=시타 매장 정보').locator('..').locator('..');
    await storeInfo.screenshot({ 
      path: path.join(resultsDir, 'try-a-massgoo-mobile-store-info.png')
    });
    console.log('✅ 매장 정보 섹션 스크린샷 저장');
  } catch (e) {
    console.log(`⚠️ 매장 정보 섹션 캡처 실패: ${e.message}`);
  }
  
  // 텍스트 크기 및 레이아웃 정보 수집
  const analysis = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const subtitle = document.querySelector('section p');
    const storeInfoDiv = Array.from(document.querySelectorAll('div')).find(div => 
      div.textContent?.includes('비거리 상담')
    );
    const ctaButton = document.querySelector('a[href*="booking"]');
    const sectionTitle = Array.from(document.querySelectorAll('h2')).find(h2 => 
      h2.textContent?.includes('왜 마쓰구')
    );
    
    return {
      hero: {
        h1: {
          text: h1?.textContent?.trim(),
          fontSize: h1 ? window.getComputedStyle(h1).fontSize : null,
          lineHeight: h1 ? window.getComputedStyle(h1).lineHeight : null,
          width: h1?.offsetWidth,
          height: h1?.offsetHeight,
          lines: h1 ? Math.ceil(h1.offsetHeight / parseFloat(window.getComputedStyle(h1).lineHeight)) : 0
        },
        subtitle: {
          text: subtitle?.textContent?.trim(),
          fontSize: subtitle ? window.getComputedStyle(subtitle).fontSize : null,
          width: subtitle?.offsetWidth,
          height: subtitle?.offsetHeight,
          lines: subtitle ? Math.ceil(subtitle.offsetHeight / parseFloat(window.getComputedStyle(subtitle).lineHeight)) : 0
        },
        ctaButton: {
          text: ctaButton?.textContent?.trim(),
          fontSize: ctaButton ? window.getComputedStyle(ctaButton).fontSize : null,
          width: ctaButton?.offsetWidth,
          height: ctaButton?.offsetHeight
        }
      },
      storeInfo: {
        title: {
          text: sectionTitle?.textContent?.trim(),
          fontSize: sectionTitle ? window.getComputedStyle(sectionTitle).fontSize : null
        },
        phone: {
          text: storeInfoDiv?.textContent?.trim(),
          fontSize: storeInfoDiv ? window.getComputedStyle(storeInfoDiv).fontSize : null
        }
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  });
  
  console.log('\n📊 분석 결과:');
  console.log('='.repeat(60));
  console.log('\n🎯 히어로 섹션:');
  console.log(`  메인 타이틀: ${analysis.hero.h1.text}`);
  console.log(`  폰트 크기: ${analysis.hero.h1.fontSize}`);
  console.log(`  줄 수: ${analysis.hero.h1.lines}`);
  console.log(`  너비: ${analysis.hero.h1.width}px`);
  console.log(`  서브타이틀: ${analysis.hero.subtitle.text}`);
  console.log(`  폰트 크기: ${analysis.hero.subtitle.fontSize}`);
  console.log(`  줄 수: ${analysis.hero.subtitle.lines}`);
  console.log(`  CTA 버튼 폰트: ${analysis.hero.ctaButton.fontSize}`);
  
  console.log('\n📞 매장 정보:');
  console.log(`  섹션 제목 폰트: ${analysis.storeInfo.title.fontSize}`);
  console.log(`  비거리 상담 폰트: ${analysis.storeInfo.phone.fontSize}`);
  console.log(`  비거리 상담 텍스트: ${analysis.storeInfo.phone.text}`);
  
  console.log('\n📱 뷰포트:');
  console.log(`  너비: ${analysis.viewport.width}px`);
  console.log(`  높이: ${analysis.viewport.height}px`);
  
  // 개선 제안
  console.log('\n💡 개선 제안:');
  console.log('='.repeat(60));
  
  if (analysis.hero.h1.lines === 1 && analysis.hero.h1.width > 350) {
    console.log('⚠️ 메인 타이틀이 한 줄로 표시되어 가독성 저하');
    console.log('   → 모바일에서 행바꿈 필요');
  }
  
  if (parseFloat(analysis.storeInfo.phone.fontSize) < 14) {
    console.log('⚠️ 비거리 상담 전화번호 폰트가 너무 작음');
    console.log('   → 최소 14px 이상 권장');
  }
  
  if (analysis.hero.subtitle.lines === 1 && analysis.hero.subtitle.width > 350) {
    console.log('⚠️ 서브타이틀이 한 줄로 표시되어 가독성 저하');
    console.log('   → 모바일에서 행바꿈 고려');
  }
  
  // 결과를 JSON으로 저장
  fs.writeFileSync(
    path.join(resultsDir, 'try-a-massgoo-analysis.json'),
    JSON.stringify(analysis, null, 2)
  );
  console.log('\n✅ 분석 결과 저장: test-results/try-a-massgoo-analysis.json');
  
  await browser.close();
  console.log('\n✅ 분석 완료!');
})();

