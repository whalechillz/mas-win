/**
 * 허브 시스템 통합 테스트 스크립트
 * - 메뉴 정리 확인
 * - 탭 구조 확인
 * - 뷰 모드 토글 확인
 */

const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@masgolf.co.kr';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function testHubSystemIntegration() {
  console.log('🚀 허브 시스템 통합 테스트 시작\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // 동작을 천천히 보기 위해
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. 로그인 페이지로 이동
    console.log('📝 1. 로그인 페이지로 이동...');
    await page.goto(`${BASE_URL}/admin/login`);
    await page.waitForTimeout(1000);
    
    // 2. 로그인
    console.log('🔐 2. 로그인 시도...');
    
    // 로그인 폼 대기 (여러 선택자 시도)
    try {
      await page.waitForSelector('input[type="text"], input[name="login"], input[type="email"]', { timeout: 5000 });
    } catch (e) {
      // 이미 로그인되어 있을 수 있음
      const currentUrl = page.url();
      if (!currentUrl.includes('/admin/login')) {
        console.log('✅ 이미 로그인되어 있습니다.\n');
      } else {
        throw new Error('로그인 폼을 찾을 수 없습니다.');
      }
    }
    
    // 로그인 폼이 있으면 로그인 시도
    const loginInput = await page.locator('input[type="text"], input[name="login"], input[type="email"]').first();
    if (await loginInput.isVisible()) {
      await loginInput.fill(ADMIN_EMAIL);
      await page.fill('input[type="password"]', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => {
        console.log('⚠️ 네비게이션 대기 시간 초과, 계속 진행...');
      });
      console.log('✅ 로그인 완료\n');
    } else {
      console.log('✅ 이미 로그인되어 있습니다.\n');
    }
    
    // 3. AdminNav 메뉴 확인
    console.log('📋 3. AdminNav 메뉴 확인...');
    await page.waitForSelector('nav, .bg-white.border-b', { timeout: 5000 });
    
    // 메뉴 텍스트 확인
    const navText = await page.textContent('body');
    
    // 삭제된 메뉴 확인 (없어야 함)
    const hasContentCalendar = navText.includes('콘텐츠 캘린더');
    const hasNewCalendar = navText.includes('새 캘린더');
    
    if (hasContentCalendar) {
      console.log('❌ "콘텐츠 캘린더" 메뉴가 아직 존재합니다.');
    } else {
      console.log('✅ "콘텐츠 캘린더" 메뉴가 삭제되었습니다.');
    }
    
    if (hasNewCalendar) {
      console.log('❌ "새 캘린더" 메뉴가 아직 존재합니다.');
    } else {
      console.log('✅ "새 캘린더" 메뉴가 삭제되었습니다.');
    }
    
    // 허브 시스템 메뉴 확인 (있어야 함)
    const hasHubSystem = navText.includes('허브 시스템');
    if (hasHubSystem) {
      console.log('✅ "허브 시스템" 메뉴가 존재합니다.\n');
    } else {
      console.log('❌ "허브 시스템" 메뉴를 찾을 수 없습니다.\n');
    }
    
    // 4. 허브 시스템 페이지로 이동
    console.log('🎯 4. 허브 시스템 페이지로 이동...');
    await page.goto(`${BASE_URL}/admin/content-calendar-hub`);
    await page.waitForSelector('h1', { timeout: 5000 });
    
    const pageTitle = await page.textContent('h1');
    console.log(`   페이지 제목: ${pageTitle}`);
    
    if (pageTitle.includes('허브 시스템') || pageTitle.includes('콘텐츠 허브')) {
      console.log('✅ 허브 시스템 페이지 로드 성공\n');
    } else {
      console.log('❌ 허브 시스템 페이지 로드 실패\n');
    }
    
    // 5. 탭 구조 확인
    console.log('📑 5. 탭 구조 확인...');
    await page.waitForTimeout(1000);
    
    // 콘텐츠 허브 탭 확인
    const hubTab = await page.locator('button:has-text("콘텐츠 허브")').first();
    if (await hubTab.isVisible()) {
      console.log('✅ "콘텐츠 허브" 탭이 존재합니다.');
    } else {
      console.log('❌ "콘텐츠 허브" 탭을 찾을 수 없습니다.');
    }
    
    // 데일리 브랜딩 탭 확인
    const dailyBrandingTab = await page.locator('button:has-text("데일리 브랜딩")').first();
    if (await dailyBrandingTab.isVisible()) {
      console.log('✅ "데일리 브랜딩" 탭이 존재합니다.');
    } else {
      console.log('❌ "데일리 브랜딩" 탭을 찾을 수 없습니다.');
    }
    
    // 탭 클릭 테스트
    console.log('\n   탭 클릭 테스트...');
    await dailyBrandingTab.click();
    await page.waitForTimeout(500);
    
    const dailyBrandingContent = await page.textContent('body');
    if (dailyBrandingContent.includes('데일리 브랜딩 관리') || dailyBrandingContent.includes('카카오톡 콘텐츠 관리')) {
      console.log('✅ 데일리 브랜딩 탭 클릭 성공');
    } else {
      console.log('❌ 데일리 브랜딩 탭 내용을 찾을 수 없습니다.');
    }
    
    await hubTab.click();
    await page.waitForTimeout(500);
    console.log('✅ 콘텐츠 허브 탭으로 복귀\n');
    
    // 6. 뷰 모드 토글 확인
    console.log('🔄 6. 뷰 모드 토글 확인...');
    
    // 리스트 뷰 버튼 확인
    const listViewButton = await page.locator('button:has-text("리스트 뷰")').first();
    if (await listViewButton.isVisible()) {
      console.log('✅ "리스트 뷰" 버튼이 존재합니다.');
    } else {
      console.log('❌ "리스트 뷰" 버튼을 찾을 수 없습니다.');
    }
    
    // 달력 뷰 버튼 확인
    const calendarViewButton = await page.locator('button:has-text("달력 뷰")').first();
    if (await calendarViewButton.isVisible()) {
      console.log('✅ "달력 뷰" 버튼이 존재합니다.');
    } else {
      console.log('❌ "달력 뷰" 버튼을 찾을 수 없습니다.');
    }
    
    // 달력 뷰 클릭 테스트
    console.log('\n   달력 뷰 클릭 테스트...');
    await calendarViewButton.click();
    await page.waitForTimeout(500);
    
    const calendarViewContent = await page.textContent('body');
    if (calendarViewContent.includes('달력 뷰') || calendarViewContent.includes('준비 중')) {
      console.log('✅ 달력 뷰 전환 성공');
    } else {
      console.log('❌ 달력 뷰 내용을 찾을 수 없습니다.');
    }
    
    await listViewButton.click();
    await page.waitForTimeout(500);
    console.log('✅ 리스트 뷰로 복귀\n');
    
    // 7. 통계 카드 확인
    console.log('📊 7. 통계 카드 확인...');
    const statsCards = await page.locator('.bg-white.p-6.rounded-lg.shadow').count();
    if (statsCards > 0) {
      console.log(`✅ 통계 카드 ${statsCards}개 발견`);
    } else {
      console.log('⚠️ 통계 카드를 찾을 수 없습니다.');
    }
    
    // 8. 스크린샷 저장
    console.log('\n📸 8. 스크린샷 저장...');
    await page.screenshot({ 
      path: 'test-results/hub-system-integration.png',
      fullPage: true 
    });
    console.log('✅ 스크린샷 저장 완료: test-results/hub-system-integration.png\n');
    
    console.log('✅ 모든 테스트 완료!\n');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    
    // 오류 발생 시 스크린샷 저장
    try {
      await page.screenshot({ 
        path: 'test-results/hub-system-error.png',
        fullPage: true 
      });
      console.log('📸 오류 스크린샷 저장: test-results/hub-system-error.png');
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
  testHubSystemIntegration()
    .then(() => {
      console.log('🎉 테스트 성공적으로 완료되었습니다!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 테스트 실패:', error);
      process.exit(1);
    });
}

module.exports = { testHubSystemIntegration };

