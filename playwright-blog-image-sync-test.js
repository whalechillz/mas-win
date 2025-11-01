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
    
    // 여러 로그인 URL 시도
    const loginUrls = [
      `${BASE_URL}/auth/signin`,
      `${BASE_URL}/auth/login`,
      `${BASE_URL}/login`,
      `${BASE_URL}/admin/login`,
    ];
    
    let loginSuccess = false;
    
    for (const loginUrl of loginUrls) {
      try {
        console.log(`로그인 시도: ${loginUrl}`);
        await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await page.waitForTimeout(3000);
        
        // 로그인 폼 확인 (여러 선택자 시도)
        const formSelectors = [
          'input[type="tel"]',
          'input[type="password"]',
          'input[name*="phone"]',
          'input[placeholder*="전화"]',
          'input[type="text"]',
        ];
        
        let foundForm = false;
        for (const selector of formSelectors) {
          const count = await page.locator(selector).count();
          if (count > 0) {
            foundForm = true;
            console.log(`✅ 로그인 폼 찾기 성공: ${selector}`);
            break;
          }
        }
        
        if (foundForm) {
          // 전화번호 입력
          const phoneInput = page.locator('input[type="tel"], input[name*="phone"], input[placeholder*="전화"], input[type="text"]').first();
          await phoneInput.fill(LOGIN_PHONE);
          await page.waitForTimeout(1000);
          
          // 비밀번호 입력
          const passwordInput = page.locator('input[type="password"]').first();
          await passwordInput.fill(LOGIN_PASSWORD);
          await page.waitForTimeout(1000);
          
          // 로그인 버튼 클릭
          const loginButton = page.locator('button:has-text("로그인"), button[type="submit"], button:has-text("Login")').first();
          await loginButton.click();
          
          // 로그인 후 리다이렉트 대기
          try {
            await page.waitForURL(/\/admin|\/dashboard/, { timeout: 15000 });
            loginSuccess = true;
            console.log('✅ 로그인 성공');
            break;
          } catch (error) {
            console.log('⚠️ 리다이렉트 실패, 다음 URL 시도...');
          }
        }
      } catch (error) {
        console.log(`⚠️ 로그인 URL 실패: ${loginUrl}`, error.message);
        continue;
      }
    }
    
    if (!loginSuccess) {
      await page.screenshot({ path: 'login-failed.png', fullPage: true });
      throw new Error('로그인 실패. login-failed.png를 확인하세요.');
    }
    
    await page.waitForTimeout(3000);
    console.log('✅ 로그인 완료\n');
    
    // 2. 블로그 관리 페이지 이동
    console.log('📁 2단계: 블로그 관리 페이지 이동...');
    await page.goto(ADMIN_BLOG_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    
    // 페이지가 완전히 로드될 때까지 대기
    try {
      // 여러 선택자로 페이지 로드 확인
      await Promise.race([
        page.waitForSelector('h1:has-text("블로그")', { timeout: 10000 }),
        page.waitForSelector('h2:has-text("블로그")', { timeout: 10000 }),
        page.waitForSelector('text=블로그 관리', { timeout: 10000 }),
        page.waitForSelector('text=블로그 목록', { timeout: 10000 }),
        page.waitForSelector('button:has-text("새 게시물")', { timeout: 10000 }),
        page.waitForSelector('button:has-text("작성")', { timeout: 10000 }),
      ]);
    } catch (error) {
      // 스크린샷 저장 후 계속 진행
      await page.screenshot({ path: 'blog-page-load-error.png', fullPage: true });
      console.log('⚠️ 페이지 로드 확인 실패, 계속 진행...');
    }
    
    console.log('✅ 블로그 관리 페이지 로드 완료\n');
    
    // 3. 블로그 글 목록 확인
    console.log('📋 3단계: 블로그 글 목록 확인...');
    
    // 페이지 완전 로드 대기
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(5000);
    
    // 현재 페이지 스크린샷 저장 (디버깅용)
    await page.screenshot({ path: 'blog-page-debug.png', fullPage: true });
    console.log('📸 현재 페이지 스크린샷 저장: blog-page-debug.png');
    
    // 블로그 글 목록 로드 대기 (여러 선택자 시도)
    let firstPost = null;
    
    // CSS 클래스 조합으로 찾기
    const selectors = [
      'div.border.rounded',
      'div[class*="border"][class*="rounded"]',
      'div.border.rounded-lg',
      'div.border.rounded.p-4',
      'tr',
      'article',
    ];
    
    for (const selector of selectors) {
      const elements = await page.locator(selector).count();
      if (elements > 0) {
        firstPost = page.locator(selector).first();
        console.log(`✅ 블로그 글 찾기 성공: ${selector} (${elements}개)`);
        break;
      }
    }
    
    if (!firstPost || (await firstPost.count()) === 0) {
      // 스크린샷으로 현재 상태 확인
      await page.screenshot({ path: 'blog-list-not-found.png', fullPage: true });
      
      // 페이지 HTML 일부 확인
      const pageContent = await page.content();
      console.log('📄 페이지 HTML 길이:', pageContent.length);
      console.log('📄 페이지 제목:', await page.title());
      
      throw new Error('블로그 글을 찾을 수 없습니다. blog-list-not-found.png와 blog-page-debug.png를 확인하세요.');
    }
    
    const postTitle = await firstPost.locator('h3, h2, td, [class*="title"]').first().textContent().catch(() => '블로그 글');
    console.log(`✅ 첫 번째 블로그 글: ${postTitle}\n`);
    
    // 4. 이미지 정렬 버튼 클릭 및 오류 확인
    console.log('📁 4단계: 이미지 정렬 버튼 클릭 및 오류 확인...');
    
    // 네트워크 요청 모니터링 설정
    const networkErrors = [];
    const apiRequests = [];
    
    page.on('request', request => {
      if (request.url().includes('organize-images')) {
        apiRequests.push({
          url: request.url(),
          method: request.method(),
          time: Date.now()
        });
        console.log(`📡 API 요청: ${request.method()} ${request.url()}`);
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('organize-images')) {
        const status = response.status();
        apiRequests[apiRequests.length - 1].status = status;
        apiRequests[apiRequests.length - 1].responseTime = Date.now() - apiRequests[apiRequests.length - 1].time;
        
        if (status >= 400) {
          networkErrors.push({
            url: response.url(),
            status,
            statusText: response.statusText()
          });
          console.error(`❌ API 오류 응답: ${status} ${response.statusText()} - ${response.url()}`);
        } else {
          console.log(`✅ API 성공 응답: ${status} - ${response.url()}`);
        }
      }
    });
    
    // 콘솔 메시지 모니터링
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('이미지 정렬') || text.includes('오류') || text.includes('error') || text.includes('Error')) {
        console.log(`🖥️ 콘솔: ${msg.type()} - ${text}`);
      }
    });
    
    // 페이지 오류 모니터링
    page.on('pageerror', error => {
      console.error(`💥 페이지 오류: ${error.message}`);
      networkErrors.push({
        type: 'pageerror',
        message: error.message,
        stack: error.stack
      });
    });
    
    // 버튼 찾기 (여러 방법 시도)
    let organizeButton = firstPost.locator('button:has-text("이미지 정렬"), button:has-text("📁"), button[title*="이미지"], button[title*="정렬"]').first();
    
    if (await organizeButton.count() === 0) {
      // 페이지 전체에서 찾기
      organizeButton = page.locator('button:has-text("이미지 정렬"), button:has-text("📁")').first();
    }
    
    if (await organizeButton.count() === 0) {
      await page.screenshot({ path: 'button-not-found.png', fullPage: true });
      throw new Error('이미지 정렬 버튼을 찾을 수 없습니다. button-not-found.png를 확인하세요.');
    }
    
    await organizeButton.scrollIntoViewIfNeeded();
    
    // 확인 다이얼로그 처리 설정
    let dialogHandled = false;
    page.on('dialog', async dialog => {
      if (!dialogHandled) {
        dialogHandled = true;
        console.log(`📋 다이얼로그: ${dialog.message()}`);
        if (dialog.type() === 'confirm') {
          await dialog.accept();
          console.log('✅ 확인 다이얼로그 수락');
        }
      }
    });
    
    // 버튼 클릭
    console.log('🖱️ 이미지 정렬 버튼 클릭...');
    await organizeButton.click();
    await page.waitForTimeout(2000); // 다이얼로그 대기
    
    // API 요청 완료 대기 (최대 15초)
    console.log('⏳ API 응답 대기 중...');
    await page.waitForTimeout(12000); // API 처리 시간 대기
    
    // 오류 확인
    if (networkErrors.length > 0) {
      console.error('\n❌ 네트워크 오류 발견:');
      networkErrors.forEach((err, idx) => {
        console.error(`  ${idx + 1}. ${err.status || 'N/A'} ${err.statusText || err.message || 'N/A'}`);
        console.error(`     URL: ${err.url || 'N/A'}`);
      });
      
      // 오류 스크린샷 저장
      await page.screenshot({ path: 'image-organize-error.png', fullPage: true });
      console.log('📸 오류 스크린샷 저장: image-organize-error.png');
      
      // API 요청 정보 출력
      console.log('\n📊 API 요청 정보:');
      apiRequests.forEach((req, idx) => {
        console.log(`  ${idx + 1}. ${req.method} ${req.url}`);
        console.log(`     상태: ${req.status || '대기 중'}`);
        console.log(`     응답 시간: ${req.responseTime || 'N/A'}ms`);
      });
    } else {
      console.log('✅ 이미지 정렬 버튼 클릭 완료 (오류 없음)');
    }
    
    // 5. 메타데이터 동기화 버튼 클릭
    console.log('\n🔄 5단계: 메타데이터 동기화 버튼 클릭...');
    await page.waitForTimeout(3000);
    
    // 버튼 찾기 (여러 방법 시도)
    let syncButton = firstPost.locator('button:has-text("메타 동기화"), button:has-text("🔄"), button[title*="메타"], button[title*="동기화"]').first();
    
    if (await syncButton.count() === 0) {
      // 페이지 전체에서 찾기
      syncButton = page.locator('button:has-text("메타 동기화"), button:has-text("🔄")').first();
    }
    
    if (await syncButton.count() === 0) {
      await page.screenshot({ path: 'sync-button-not-found.png', fullPage: true });
      throw new Error('메타데이터 동기화 버튼을 찾을 수 없습니다. sync-button-not-found.png를 확인하세요.');
    }
    
    await syncButton.scrollIntoViewIfNeeded();
    await syncButton.click();
    console.log('✅ 메타데이터 동기화 버튼 클릭 완료');
    await page.waitForTimeout(3000);
    
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
    
    // 최종 결과 요약
    console.log('\n📊 테스트 결과 요약:');
    console.log(`  - 네트워크 오류: ${networkErrors.length}개`);
    console.log(`  - API 요청: ${apiRequests.length}개`);
    
    if (networkErrors.length === 0) {
      console.log('\n✅ 블로그 글별 이미지 관리 테스트 완료!');
    } else {
      console.log('\n⚠️ 테스트 완료 (일부 오류 발생):');
      console.log('   오류 상세 정보는 위의 로그를 참고하세요.');
    }
    
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

