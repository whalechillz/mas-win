const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    channel: 'chrome' // Chrome 브라우저 사용
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('🔍 AI 이미지 생성 페이지 최종 개선 사항 확인 시작...\n');
    
    // 1. 로그인 페이지로 이동
    console.log('1️⃣ 로그인 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    // 로그인 (환경변수나 설정에서 가져오기)
    const email = process.env.ADMIN_EMAIL || 'admin@masgolf.co.kr';
    const password = process.env.ADMIN_PASSWORD || 'your-password';
    
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // 2. AI 이미지 생성 페이지로 이동
    console.log('2️⃣ AI 이미지 생성 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/ai-image-generator', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // 3. 현재 상태 확인
    console.log('\n📊 현재 상태 확인:\n');
    
    // 3-1. 프리셋 목록 확인
    console.log('3-1. 프리셋 목록 확인...');
    const presetElements = await page.locator('[data-preset-id]').all();
    console.log(`   ✅ 프리셋 개수: ${presetElements.length}개`);
    
    // 3-2. 장면3 시니어 프리셋 선택
    console.log('\n3-2. 장면3 문제 발생 (시니어) 프리셋 선택...');
    const scene3Senior = await page.locator('[data-preset-id="scene3-senior"]').first();
    if (await scene3Senior.count() > 0) {
      await scene3Senior.click();
      await page.waitForTimeout(500);
      console.log('   ✅ 프리셋 선택 완료');
    } else {
      console.log('   ⚠️  프리셋 요소를 찾을 수 없음');
    }
    
    // 3-3. 프리셋 적용 상태 확인
    console.log('\n3-3. 프리셋 적용 상태 확인...');
    const presetApplied = await page.locator('text=프리셋 적용됨').first();
    if (await presetApplied.count() > 0) {
      const presetText = await presetApplied.textContent();
      console.log(`   ✅ ${presetText}`);
    }
    
    // 3-4. 브랜딩 톤 확인
    console.log('\n3-4. 브랜딩 톤 확인...');
    const seniorTone = await page.locator('text=시니어 중심 감성적').first();
    if (await seniorTone.count() > 0) {
      const isSelected = await seniorTone.evaluate(el => {
        const parent = el.closest('label, div');
        return parent?.classList.contains('bg-yellow') || 
               parent?.classList.contains('ring-2') ||
               parent?.querySelector('input[type="radio"]:checked') !== null;
      });
      console.log(`   ${isSelected ? '✅' : '⚠️'} 시니어 톤 선택 상태: ${isSelected}`);
    }
    
    // 3-5. 고급 설정 확인
    console.log('\n3-5. 고급 설정 토글 확인...');
    const advancedToggle = await page.locator('text=고급 설정').first();
    if (await advancedToggle.count() > 0) {
      console.log('   ✅ 고급 설정 섹션 존재');
      const isExpanded = await page.locator('text=숨기기').count() > 0;
      console.log(`   ${isExpanded ? '✅' : '⚠️'} 고급 설정 ${isExpanded ? '펼쳐짐' : '접혀있음'}`);
    }
    
    // 3-6. 장소 선택 기능 확인 (현재 없어야 함)
    console.log('\n3-6. 장소 선택 기능 확인 (현재 없어야 함)...');
    const locationSelector = await page.locator('text=장소 선택, text=배경 선택').first();
    if (await locationSelector.count() === 0) {
      console.log('   ✅ 장소 선택 기능 없음 (추가 필요)');
    } else {
      console.log('   ⚠️  장소 선택 기능이 이미 존재함');
    }
    
    // 3-7. ChatGPT 최적화 옵션 확인
    console.log('\n3-7. ChatGPT 최적화 옵션 확인...');
    const chatgptOption = await page.locator('text=ChatGPT, text=최적화').first();
    if (await chatgptOption.count() > 0) {
      console.log('   ✅ ChatGPT 최적화 옵션 존재');
      // 고급 설정이 접혀있으면 펼치기
      const isExpanded = await page.locator('text=숨기기').count() > 0;
      if (!isExpanded) {
        await page.locator('text=펼치기').first().click();
        await page.waitForTimeout(500);
      }
    } else {
      console.log('   ⚠️  ChatGPT 최적화 옵션을 찾을 수 없음');
    }
    
    // 3-8. 프롬프트 입력란 확인
    console.log('\n3-8. 프롬프트 입력란 확인...');
    const promptInput = await page.locator('textarea[name="prompt"], textarea[placeholder*="프롬프트"]').first();
    if (await promptInput.count() > 0) {
      const promptValue = await promptInput.inputValue();
      console.log(`   ✅ 프롬프트 입력란 존재`);
      console.log(`   📝 현재 프롬프트: ${promptValue.substring(0, 50)}...`);
    }
    
    // 4. 스크린샷 저장
    console.log('\n4️⃣ 현재 상태 스크린샷 저장...');
    await page.screenshot({ 
      path: 'test-ai-image-current-state.png',
      fullPage: true 
    });
    console.log('   ✅ 스크린샷 저장 완료: test-ai-image-current-state.png');
    
    // 5. 개선 필요 사항 정리
    console.log('\n\n📋 최종 개선 계획:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. 파일명에 scene 번호 추가');
    console.log('   - 현재: ai-generated-senior-emotional-feed-{timestamp}-{index}.jpg');
    console.log('   - 개선: ai-generated-senior-emotional-scene3-feed-{timestamp}-{index}.jpg');
    console.log('   - 위치: pages/api/kakao-content/generate-images.js:240');
    console.log('');
    console.log('2. 장소 선택 기능 추가');
    console.log('   - 7개 장소 옵션: 실내 스튜디오, 피팅 스튜디오, 골프장 코스, 티샷 장소,');
    console.log('                    인도어 드라이버 연습장, 실내 스포츠 센터, 실내 스크린 골프장');
    console.log('   - 프리셋 선택 후 장소 선택 섹션 표시');
    console.log('   - 선택한 장소를 프롬프트에 동적으로 추가');
    console.log('   - 위치: pages/admin/ai-image-generator.tsx (프리셋 섹션 아래)');
    console.log('');
    console.log('3. 시니어/하이테크 톤 강화');
    console.log('   - 시니어: warm golden lighting, gold-tinted atmosphere 추가');
    console.log('   - 하이테크: cool blue-gray tones, black accents, LED lighting 추가');
    console.log('   - 위치: pages/admin/ai-image-generator.tsx buildUniversalPrompt 함수');
    console.log('');
    console.log('4. ChatGPT 최적화 통합 확인');
    console.log('   - 현재 useChatGPT 옵션이 작동하는지 확인');
    console.log('   - 최적화된 프롬프트가 제대로 표시되는지 확인');
    console.log('   - 위치: pages/admin/ai-image-generator.tsx:336');
    console.log('');
    console.log('5. sceneStep을 API에 전달');
    console.log('   - 프리셋 선택 시 sceneStep을 formData에 저장');
    console.log('   - API 호출 시 metadata.sceneStep으로 전달');
    console.log('   - 위치: pages/admin/ai-image-generator.tsx handleGenerate 함수');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('✅ 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    await page.screenshot({ path: 'test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();

