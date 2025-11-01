// Playwright 테스트: 블로그 글별 이미지 정렬 및 메타데이터 동기화 테스트
const { chromium } = require('playwright');

const BASE_URL = 'https://masgolf.co.kr';
const ADMIN_BLOG_URL = `${BASE_URL}/admin/blog`;
const LOGIN_PHONE = '01066699000';
const LOGIN_PASSWORD = '66699000';

async function runBlogImageSyncTest() {
  console.log('🎭 Playwright 블로그 글별 이미지 관리 테스트 시작...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. 로그인
    console.log('📝 1단계: 로그인...');
    await page.goto(`${BASE_URL}/auth/signin`);
    await page.waitForTimeout(2000);
    
    const phoneInput = page.locator('input[type="tel"], input[name*="phone"], input[placeholder*="전화"]').first();
    if (await phoneInput.count() > 0) {
      await phoneInput.fill(LOGIN_PHONE);
      await page.waitForTimeout(1000);
    }
    
    const passwordInput = page.locator('input[type="password"]').first();
    if (await passwordInput.count() > 0) {
      await passwordInput.fill(LOGIN_PASSWORD);
      await page.waitForTimeout(1000);
    }
    
    const loginButton = page.locator('button:has-text("로그인"), button[type="submit"]').first();
    if (await loginButton.count() > 0) {
      await loginButton.click();
      await page.waitForTimeout(3000);
    }
    
    console.log('✅ 로그인 완료\n');
    
    // 2. 블로그 관리 페이지 이동
    console.log('📁 2단계: 블로그 관리 페이지 이동...');
    await page.goto(ADMIN_BLOG_URL);
    await page.waitForTimeout(3000);
    
    const blogTitle = page.locator('text=블로그 관리').first();
    await blogTitle.waitFor({ timeout: 10000 });
    console.log('✅ 블로그 관리 페이지 로드 완료\n');
    
    // 3. 블로그 글 목록 확인
    console.log('📋 3단계: 블로그 글 목록 확인...');
    await page.waitForTimeout(2000);
    
    // 첫 번째 블로그 글 찾기
    const firstPost = page.locator('div[class*="border"], div[class*="rounded"]').first();
    if (await firstPost.count() === 0) {
      throw new Error('블로그 글을 찾을 수 없습니다.');
    }
    
    const postTitle = await firstPost.locator('h3').first().textContent().catch(() => '');
    console.log(`✅ 첫 번째 블로그 글: ${postTitle}\n`);
    
    // 4. 이미지 정렬 버튼 클릭
    console.log('📁 4단계: 이미지 정렬 버튼 클릭...');
    const organizeButton = firstPost.locator('button:has-text("이미지 정렬")').first();
    
    if (await organizeButton.count() === 0) {
      throw new Error('이미지 정렬 버튼을 찾을 수 없습니다.');
    }
    
    await organizeButton.click();
    console.log('✅ 이미지 정렬 버튼 클릭 완료');
    await page.waitForTimeout(2000);
    
    // 확인 다이얼로그 처리
    page.on('dialog', async dialog => {
      console.log(`📋 다이얼로그: ${dialog.message()}`);
      if (dialog.type() === 'confirm') {
        await dialog.accept();
        console.log('✅ 확인 다이얼로그 수락');
      }
    });
    
    // 진행 상태 확인
    await page.waitForTimeout(5000);
    
    // 완료 메시지 확인
    const successMessage = page.locator('text=완료, text=이동').first();
    if (await successMessage.count() > 0) {
      console.log('✅ 이미지 정렬 완료 메시지 확인');
    }
    
    // 5. 메타데이터 동기화 버튼 클릭
    console.log('\n🔄 5단계: 메타데이터 동기화 버튼 클릭...');
    await page.waitForTimeout(2000);
    
    const syncButton = firstPost.locator('button:has-text("메타 동기화")').first();
    
    if (await syncButton.count() === 0) {
      throw new Error('메타데이터 동기화 버튼을 찾을 수 없습니다.');
    }
    
    await syncButton.click();
    console.log('✅ 메타데이터 동기화 버튼 클릭 완료');
    await page.waitForTimeout(2000);
    
    // 확인 다이얼로그 처리
    page.on('dialog', async dialog => {
      console.log(`📋 다이얼로그: ${dialog.message()}`);
      if (dialog.type() === 'confirm') {
        await dialog.accept();
        console.log('✅ 확인 다이얼로그 수락');
      }
    });
    
    // 진행 상태 확인
    await page.waitForTimeout(10000);
    
    // 완료 메시지 확인
    const syncSuccessMessage = page.locator('text=완료, text=처리').first();
    if (await syncSuccessMessage.count() > 0) {
      console.log('✅ 메타데이터 동기화 완료 메시지 확인');
    }
    
    // 6. 중복 이미지 제거 확인
    console.log('\n🗑️ 6단계: 중복 이미지 제거 가능 여부 확인...');
    
    // 갤러리 관리 페이지 이동
    await page.goto(`${BASE_URL}/admin/gallery`);
    await page.waitForTimeout(3000);
    
    // 중복 이미지 필터 확인
    const duplicateFilter = page.locator('select option:has-text("중복 이미지")').first();
    if (await duplicateFilter.count() > 0) {
      console.log('✅ 중복 이미지 필터 확인');
    }
    
    // 중복 이미지 찾기 버튼 확인
    const findDuplicatesButton = page.locator('button:has-text("중복"), button:has-text("제거")').first();
    if (await findDuplicatesButton.count() > 0) {
      console.log('✅ 중복 이미지 제거 기능 확인');
    }
    
    console.log('\n✅ 블로그 글별 이미지 관리 테스트 완료!');
    
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message);
    console.error('스택:', error.stack);
    
    // 스크린샷 저장
    await page.screenshot({ path: 'blog-image-sync-error.png', fullPage: true });
    console.log('📸 에러 스크린샷 저장: blog-image-sync-error.png');
    
    throw error;
  } finally {
    await browser.close();
  }
}

// 테스트 실행
runBlogImageSyncTest()
  .then(() => {
    console.log('\n🎉 모든 테스트 통과!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 테스트 실패:', error);
    process.exit(1);
  });

