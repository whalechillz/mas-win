/**
 * AI 이미지 생성 프리셋 기능 Playwright 테스트
 * 프리셋 클릭 시 프롬프트, 이미지 타입, 브랜딩 옵션이 제대로 업데이트되는지 확인
 */

const { chromium } = require('playwright');

async function testAIImagePreset() {
  console.log('🚀 AI 이미지 생성 프리셋 기능 테스트 시작...');
  console.log('==========================================\n');
  
  // Chrome 브라우저 실행 (최신 안정 버전 사용)
  const browser = await chromium.launch({
    headless: false, // 브라우저 창 표시
    slowMo: 500, // 각 동작 사이에 0.5초 대기
    channel: 'chrome' // Chrome 안정 버전 사용
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();

    // 1. AI 이미지 생성 페이지 접속
    console.log('📝 1단계: AI 이미지 생성 페이지 접속 중...');
    await page.goto('http://localhost:3000/admin/ai-image-generator', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // 페이지 로딩 대기
    await page.waitForSelector('h1, h2', { timeout: 10000 });
    console.log('✅ 페이지 로딩 완료\n');

    // 초기 상태 확인
    console.log('📊 초기 상태 확인...');
    const initialPrompt = await page.locator('textarea').inputValue();
    console.log(`초기 프롬프트 길이: ${initialPrompt.length}자`);
    
    const initialImageType = await page.locator('select').filter({ hasText: '이미지 타입' }).first().inputValue().catch(() => 
      page.locator('select').nth(0).inputValue()
    );
    console.log(`초기 이미지 타입: ${initialImageType || '확인 불가'}\n`);

    // 2. "피팅 이미지 생성" 프리셋 클릭
    console.log('🎯 2단계: "피팅 이미지 생성" 프리셋 클릭...');
    const fittingPresetButton = page.locator('button:has-text("피팅 이미지 생성")').first();
    await fittingPresetButton.waitFor({ state: 'visible', timeout: 10000 });
    await fittingPresetButton.click();
    await page.waitForTimeout(1000); // 상태 업데이트 대기

    console.log('✅ 피팅 이미지 프리셋 클릭 완료\n');

    // 3. 피팅 프리셋 적용 후 상태 확인
    console.log('🔍 3단계: 피팅 프리셋 적용 후 상태 확인...');
    
    // 프롬프트 확인
    const fittingPrompt = await page.locator('textarea').inputValue();
    const expectedFittingPrompt = '한국인 전문 피터가 골프 스튜디오에서 스윙 데이터를 태블릿으로 분석하는 장면';
    const promptMatches = fittingPrompt.includes(expectedFittingPrompt);
    console.log(`프롬프트 업데이트: ${promptMatches ? '✅ 성공' : '❌ 실패'}`);
    if (!promptMatches) {
      console.log(`   예상: "${expectedFittingPrompt}"`);
      console.log(`   실제: "${fittingPrompt.substring(0, 100)}..."`);
    }

    // 이미지 타입 확인 (select 요소 찾기)
    const imageTypeSelect = page.locator('select').filter({ hasText: /이미지 타입|피드|배경|프로필/ }).first();
    const imageTypeValue = await imageTypeSelect.inputValue().catch(async () => {
      // 다른 방법으로 찾기
      const allSelects = await page.locator('select').all();
      for (const select of allSelects) {
        const text = await select.textContent();
        if (text && (text.includes('피드') || text.includes('배경') || text.includes('프로필'))) {
          return await select.inputValue();
        }
      }
      return null;
    });
    const imageTypeMatches = imageTypeValue === 'feed';
    console.log(`이미지 타입 업데이트: ${imageTypeMatches ? '✅ 성공 (feed)' : `❌ 실패 (현재: ${imageTypeValue})`}`);

    // 브랜딩 옵션 확인
    const brandingSelect = page.locator('select').filter({ hasText: /브랜딩|로고/ }).first();
    const brandingValue = await brandingSelect.inputValue().catch(async () => {
      const allSelects = await page.locator('select').all();
      for (const select of allSelects) {
        const text = await select.textContent();
        if (text && (text.includes('브랜딩') || text.includes('로고'))) {
          return await select.inputValue();
        }
      }
      return null;
    });
    const brandingMatches = brandingValue === 'full-brand';
    console.log(`브랜딩 옵션 업데이트: ${brandingMatches ? '✅ 성공 (full-brand)' : `❌ 실패 (현재: ${brandingValue})`}`);

    // 프리셋 적용 표시 확인
    const presetApplied = await page.locator('text=프리셋 적용됨').isVisible();
    console.log(`프리셋 적용 표시: ${presetApplied ? '✅ 표시됨' : '❌ 표시 안됨'}\n`);

    // 4. "히어로 섹션 이미지 생성" 프리셋 클릭
    console.log('🌟 4단계: "히어로 섹션 이미지 생성" 프리셋 클릭...');
    const heroPresetButton = page.locator('button:has-text("히어로 섹션 이미지 생성")').first();
    await heroPresetButton.waitFor({ state: 'visible', timeout: 10000 });
    await heroPresetButton.click();
    await page.waitForTimeout(1000); // 상태 업데이트 대기

    console.log('✅ 히어로 섹션 프리셋 클릭 완료\n');

    // 5. 히어로 프리셋 적용 후 상태 확인
    console.log('🔍 5단계: 히어로 프리셋 적용 후 상태 확인...');
    
    // 프롬프트 확인
    const heroPrompt = await page.locator('textarea').inputValue();
    const expectedHeroPrompt = '밝고 현대적인 시타장(피팅 스튜디오) 내부';
    const heroPromptMatches = heroPrompt.includes(expectedHeroPrompt);
    console.log(`프롬프트 업데이트: ${heroPromptMatches ? '✅ 성공' : '❌ 실패'}`);
    if (!heroPromptMatches) {
      console.log(`   예상: "${expectedHeroPrompt}"`);
      console.log(`   실제: "${heroPrompt.substring(0, 100)}..."`);
    }

    // 이미지 타입 확인
    const heroImageTypeValue = await imageTypeSelect.inputValue().catch(async () => {
      const allSelects = await page.locator('select').all();
      for (const select of allSelects) {
        const text = await select.textContent();
        if (text && (text.includes('피드') || text.includes('배경') || text.includes('프로필'))) {
          return await select.inputValue();
        }
      }
      return null;
    });
    const heroImageTypeMatches = heroImageTypeValue === 'background';
    console.log(`이미지 타입 업데이트: ${heroImageTypeMatches ? '✅ 성공 (background)' : `❌ 실패 (현재: ${heroImageTypeValue})`}`);

    // 브랜딩 옵션 확인
    const heroBrandingValue = await brandingSelect.inputValue().catch(async () => {
      const allSelects = await page.locator('select').all();
      for (const select of allSelects) {
        const text = await select.textContent();
        if (text && (text.includes('브랜딩') || text.includes('로고'))) {
          return await select.inputValue();
        }
      }
      return null;
    });
    const heroBrandingMatches = heroBrandingValue === 'full-brand';
    console.log(`브랜딩 옵션 업데이트: ${heroBrandingMatches ? '✅ 성공 (full-brand)' : `❌ 실패 (현재: ${heroBrandingValue})`}`);

    // 프리셋 적용 표시 확인
    const heroPresetApplied = await page.locator('text=프리셋 적용됨').isVisible();
    console.log(`프리셋 적용 표시: ${heroPresetApplied ? '✅ 표시됨' : '❌ 표시 안됨'}\n`);

    // 스크린샷 저장
    await page.screenshot({ 
      path: 'test-results/ai-image-preset-test.png',
      fullPage: true 
    });
    console.log('📸 스크린샷 저장: test-results/ai-image-preset-test.png\n');

    // 최종 결과 요약
    console.log('==========================================');
    console.log('📊 테스트 결과 요약:');
    console.log('==========================================');
    console.log(`피팅 프리셋 - 프롬프트: ${promptMatches ? '✅' : '❌'}`);
    console.log(`피팅 프리셋 - 이미지 타입: ${imageTypeMatches ? '✅' : '❌'}`);
    console.log(`피팅 프리셋 - 브랜딩 옵션: ${brandingMatches ? '✅' : '❌'}`);
    console.log(`히어로 프리셋 - 프롬프트: ${heroPromptMatches ? '✅' : '❌'}`);
    console.log(`히어로 프리셋 - 이미지 타입: ${heroImageTypeMatches ? '✅' : '❌'}`);
    console.log(`히어로 프리셋 - 브랜딩 옵션: ${heroBrandingMatches ? '✅' : '❌'}`);
    
    const allPassed = promptMatches && imageTypeMatches && brandingMatches && 
                      heroPromptMatches && heroImageTypeMatches && heroBrandingMatches;
    
    console.log('==========================================');
    if (allPassed) {
      console.log('✅ 모든 테스트 통과!');
    } else {
      console.log('❌ 일부 테스트 실패');
    }
    console.log('==========================================\n');

    // 브라우저를 잠시 열어두어 결과 확인 가능하게 함
    console.log('⏳ 5초 후 브라우저를 닫습니다...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    await page.screenshot({ 
      path: 'test-results/ai-image-preset-error.png',
      fullPage: true 
    });
    throw error;
  } finally {
    await browser.close();
  }
}

// 테스트 실행
testAIImagePreset()
  .then(() => {
    console.log('✅ 테스트 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 테스트 실패:', error);
    process.exit(1);
  });

