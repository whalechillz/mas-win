/**
 * 카카오 콘텐츠 자동 생성 테스트 스크립트
 * - 브랜드 전략 적용 버튼 테스트
 * - 자동 생성 기능 테스트
 * - 글감 관리 확인
 */

const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@masgolf.co.kr';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function testKakaoContentAutoGeneration() {
  console.log('🚀 카카오 콘텐츠 자동 생성 테스트 시작\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. 로그인
    console.log('📝 1. 로그인...');
    await page.goto(`${BASE_URL}/admin/login`);
    await page.waitForTimeout(1000);
    
    const loginInput = await page.locator('input[type="text"], input[name="login"]').first();
    if (await loginInput.isVisible()) {
      await loginInput.fill(ADMIN_EMAIL);
      await page.fill('input[type="password"]', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
      console.log('✅ 로그인 완료\n');
    } else {
      console.log('✅ 이미 로그인되어 있습니다.\n');
    }
    
    // 2. 카카오 콘텐츠 페이지로 이동
    console.log('📱 2. 카카오 콘텐츠 페이지로 이동...');
    await page.goto(`${BASE_URL}/admin/kakao-content`);
    await page.waitForSelector('h1', { timeout: 10000 });
    
    const pageTitle = await page.textContent('h1');
    console.log(`   페이지 제목: ${pageTitle}`);
    
    if (pageTitle.includes('카카오톡 콘텐츠')) {
      console.log('✅ 카카오 콘텐츠 페이지 로드 성공\n');
    } else {
      console.log('❌ 카카오 콘텐츠 페이지 로드 실패\n');
      return;
    }
    
    await page.waitForTimeout(2000);
    
    // 3. 브랜드 전략 섹션 확인
    console.log('🎯 3. 브랜드 전략 섹션 확인...');
    
    // 브랜드 전략 선택자 확인
    const brandStrategySection = await page.locator('text=마쓰구 브랜드 전략').first();
    if (await brandStrategySection.isVisible()) {
      console.log('✅ 브랜드 전략 섹션 발견');
    } else {
      console.log('❌ 브랜드 전략 섹션을 찾을 수 없습니다.');
    }
    
    // 콘텐츠 유형 확인
    const contentTypeSelect = await page.locator('select, [role="combobox"]').first();
    if (await contentTypeSelect.isVisible()) {
      const contentTypeValue = await contentTypeSelect.inputValue();
      console.log(`   현재 콘텐츠 유형: ${contentTypeValue || '선택 안 됨'}`);
    }
    
    // 브랜드 전략 적용 버튼 확인
    const applyButton = await page.locator('button:has-text("브랜드 전략 적용"), button:has-text("적용")').first();
    if (await applyButton.isVisible()) {
      console.log('✅ 브랜드 전략 적용 버튼 발견');
      
      // 버튼 클릭 테스트
      console.log('\n   브랜드 전략 적용 버튼 클릭 테스트...');
      await applyButton.click();
      await page.waitForTimeout(1000);
      
      // 반응 확인 (알림, 상태 변경 등)
      const alerts = await page.locator('.alert, .notification, [role="alert"]').count();
      if (alerts > 0) {
        console.log(`✅ 알림/피드백 발견: ${alerts}개`);
      } else {
        console.log('⚠️ 버튼 클릭 후 시각적 피드백이 없습니다.');
      }
      
      // 콘솔 로그 확인
      const consoleMessages = [];
      page.on('console', msg => {
        if (msg.type() === 'error' || msg.type() === 'log') {
          consoleMessages.push(msg.text());
        }
      });
      
      await page.waitForTimeout(1000);
      
      if (consoleMessages.length > 0) {
        console.log(`   콘솔 메시지: ${consoleMessages.join(', ')}`);
      }
      
    } else {
      console.log('❌ 브랜드 전략 적용 버튼을 찾을 수 없습니다.');
    }
    
    console.log('');
    
    // 4. 프롬프트 자동 생성 확인
    console.log('🤖 4. 프롬프트 자동 생성 기능 확인...');
    
    // 계정 1 섹션 확인
    const account1Section = await page.locator('text=대표폰, text=010-6669-9000').first();
    if (await account1Section.isVisible()) {
      console.log('✅ 계정 1 섹션 발견');
      
      // 배경 이미지 프롬프트 확인
      const backgroundPrompt = await page.locator('text=배경, text=프롬프트').first();
      if (await backgroundPrompt.isVisible()) {
        console.log('✅ 배경 이미지 프롬프트 섹션 발견');
      }
      
      // 골드톤 이미지 생성 버튼 확인
      const goldToneButton = await page.locator('button:has-text("골드톤"), button:has-text("골드")').first();
      if (await goldToneButton.isVisible()) {
        console.log('✅ 골드톤 이미지 생성 버튼 발견');
      }
    }
    
    // 계정 2 섹션 확인
    const account2Section = await page.locator('text=업무폰, text=010-5704-0013').first();
    if (await account2Section.isVisible()) {
      console.log('✅ 계정 2 섹션 발견');
    }
    
    console.log('');
    
    // 5. 자동 생성 버튼 확인
    console.log('🚀 5. 자동 생성 버튼 확인...');
    
    const autoCreateButton = await page.locator('button:has-text("자동 생성"), button:has-text("전체 자동 생성")').first();
    if (await autoCreateButton.isVisible()) {
      console.log('✅ 자동 생성 버튼 발견');
      
      // 버튼 상태 확인
      const isDisabled = await autoCreateButton.isDisabled();
      console.log(`   버튼 상태: ${isDisabled ? '비활성화' : '활성화'}`);
    } else {
      console.log('❌ 자동 생성 버튼을 찾을 수 없습니다.');
    }
    
    console.log('');
    
    // 6. 글감 관리 확인
    console.log('📝 6. 글감 관리 확인...');
    
    // 허브 시스템으로 이동하여 글감 확인
    await page.goto(`${BASE_URL}/admin/content-calendar-hub`);
    await page.waitForTimeout(2000);
    
    const hubTitle = await page.textContent('h1');
    if (hubTitle && hubTitle.includes('허브')) {
      console.log('✅ 허브 시스템 페이지 로드 성공');
      
      // 콘텐츠 목록 확인
      const contentList = await page.locator('table, .content-list, [data-content]').first();
      if (await contentList.isVisible()) {
        console.log('✅ 콘텐츠 목록 발견');
        
        // 콘텐츠 개수 확인
        const contentItems = await page.locator('tr, .content-item').count();
        console.log(`   콘텐츠 개수: ${contentItems}개`);
      }
    }
    
    console.log('');
    
    // 7. 스크린샷 저장
    console.log('📸 7. 스크린샷 저장...');
    await page.screenshot({ 
      path: 'test-results/kakao-content-auto-generation.png',
      fullPage: true 
    });
    console.log('✅ 스크린샷 저장 완료: test-results/kakao-content-auto-generation.png\n');
    
    console.log('✅ 모든 테스트 완료!\n');
    
    // 8. 개선 사항 제안
    console.log('💡 개선 사항 제안:');
    console.log('   1. 브랜드 전략 적용 버튼 클릭 시 프롬프트 자동 생성');
    console.log('   2. 글감(content_ideas) 테이블과 연동');
    console.log('   3. 브랜드 전략 기반 메시지 자동 생성');
    console.log('   4. 시각적 피드백 추가 (로딩, 성공 메시지 등)\n');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    
    try {
      await page.screenshot({ 
        path: 'test-results/kakao-content-error.png',
        fullPage: true 
      });
      console.log('📸 오류 스크린샷 저장: test-results/kakao-content-error.png');
    } catch (screenshotError) {
      console.error('스크린샷 저장 실패:', screenshotError);
    }
    
    throw error;
  } finally {
    await browser.close();
  }
}

// 스크립트 실행
if (require.main === module) {
  testKakaoContentAutoGeneration()
    .then(() => {
      console.log('🎉 테스트 성공적으로 완료되었습니다!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 테스트 실패:', error);
      process.exit(1);
    });
}

module.exports = { testKakaoContentAutoGeneration };


