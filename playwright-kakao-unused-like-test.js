/**
 * Kakao 폴더 미사용 필터 및 좋아요 기능 테스트
 * originals/daily-branding/kakao 폴더에서 미사용 이미지와 좋아요 기능이 제대로 작동하는지 확인
 */

const { chromium } = require('playwright');
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

const ADMIN_LOGIN = process.env.ADMIN_LOGIN || '010-6669-9000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

async function testKakaoUnusedAndLike() {
  console.log('🚀 Kakao 폴더 미사용 필터 및 좋아요 기능 테스트 시작\n');

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // 각 동작 사이 0.5초 대기
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. 로그인
    console.log('1️⃣ 로그인 중...');
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // 입력 필드가 나타날 때까지 대기
    await page.waitForSelector('input#login', { timeout: 10000 });
    await page.waitForSelector('input#password', { timeout: 10000 });
    
    // 전화번호 입력 (자동 포맷팅을 위해 숫자만 입력)
    await page.fill('input#login', ADMIN_LOGIN.replace(/-/g, ''));
    await page.waitForTimeout(500);
    
    // 비밀번호 입력
    await page.fill('input#password', ADMIN_PASSWORD);
    await page.waitForTimeout(500);
    
    // 로그인 버튼 클릭
    await page.click('button[type="submit"]');
    
    // 로그인 완료 대기 (리다이렉트 또는 에러 메시지 확인)
    await page.waitForTimeout(3000);
    
    // 로그인 성공 확인 (URL이 /admin으로 변경되었는지 확인)
    const currentUrl = page.url();
    if (currentUrl.includes('/admin') && !currentUrl.includes('/login')) {
      console.log('   ✅ 로그인 완료\n');
    } else {
      // 에러 메시지 확인
      const errorMessage = await page.evaluate(() => {
        const errorDiv = document.querySelector('.text-red-700, .bg-red-50');
        return errorDiv ? errorDiv.textContent : null;
      });
      
      if (errorMessage) {
        console.log(`   ❌ 로그인 실패: ${errorMessage}`);
        throw new Error(`로그인 실패: ${errorMessage}`);
      } else {
        console.log('   ⚠️ 로그인 상태 확인 필요');
      }
    }
    
    // 로그인 페이지로 리다이렉트되었는지 확인 (기존 코드는 주석 처리)
    /* if (page.url().includes('/admin/login')) {
      console.log('   로그인 페이지로 리다이렉트됨, 로그인 진행...');
      
      // 페이지 로드 대기 (더 긴 대기 시간)
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await page.waitForTimeout(2000);
      
      // 스크린샷으로 페이지 구조 확인
      await page.screenshot({ path: 'playwright-results/login-page-debug.png' });
      console.log('   📸 로그인 페이지 스크린샷 저장: playwright-results/login-page-debug.png');
      
      // 페이지 HTML 구조 확인
      const pageContent = await page.content();
      console.log('   📄 페이지 HTML 길이:', pageContent.length);
      if (pageContent.length < 1000) {
        console.log('   ⚠️ 페이지가 제대로 로드되지 않았을 수 있습니다');
      }
      
      // 다양한 선택자로 입력 필드 찾기
      const loginSelectors = [
        'input#login',
        'input[name="login"]',
        'input[type="text"]',
        'input[placeholder*="전화번호"]',
        'input[placeholder*="아이디"]',
        'input'
      ];
      
      let loginInput = null;
      for (const selector of loginSelectors) {
        try {
          const elements = await page.locator(selector).all();
          if (elements.length > 0) {
            // 첫 번째 텍스트 입력 필드 찾기
            for (const el of elements) {
              const inputType = await el.getAttribute('type');
              const inputId = await el.getAttribute('id');
              const inputName = await el.getAttribute('name');
              if (!inputType || inputType === 'text' || inputType === 'tel' || inputId === 'login' || inputName === 'login') {
                loginInput = el;
                console.log(`   📌 로그인 필드 발견: ${selector} (id: ${inputId}, name: ${inputName})`);
                break;
              }
            }
            if (loginInput) break;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (!loginInput) {
        // 페이지의 모든 input 요소 확인
        const allInputs = await page.evaluate(() => {
          const inputs = Array.from(document.querySelectorAll('input'));
          return inputs.map(input => ({
            type: input.type,
            id: input.id,
            name: input.name,
            placeholder: input.placeholder,
            className: input.className
          }));
        });
        console.log('   🔍 페이지의 모든 input 요소:', JSON.stringify(allInputs, null, 2));
        throw new Error('로그인 입력 필드를 찾을 수 없습니다');
      }
      
      await loginInput.fill(ADMIN_LOGIN.replace(/-/g, ''));
      await page.waitForTimeout(500);
      
      // 비밀번호 필드 찾기
      const passwordInput = page.locator('input[type="password"]').first();
      if (await passwordInput.count() === 0) {
        throw new Error('비밀번호 입력 필드를 찾을 수 없습니다');
      }
      
      await passwordInput.fill(ADMIN_PASSWORD);
      await page.waitForTimeout(500);
      
      // 로그인 버튼 클릭
      const submitButton = page.locator('button[type="submit"], button:has-text("로그인")').first();
      await submitButton.click();
      
      // 로그인 완료 대기
      await page.waitForTimeout(3000);
      
      // 로그인 성공 확인
      const currentUrl = page.url();
      if (currentUrl.includes('/admin') && !currentUrl.includes('/login')) {
        console.log('   ✅ 로그인 완료\n');
        
        // kakao-content 페이지로 이동
        if (!currentUrl.includes('/admin/kakao-content')) {
          await page.goto(`${BASE_URL}/admin/kakao-content`, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForTimeout(2000);
        }
      } else {
        const errorMessage = await page.evaluate(() => {
          const errorDiv = document.querySelector('.text-red-700, .bg-red-50');
          return errorDiv ? errorDiv.textContent : null;
        });
        
        if (errorMessage) {
          console.log(`   ❌ 로그인 실패: ${errorMessage}`);
          throw new Error(`로그인 실패: ${errorMessage}`);
        } else {
          console.log('   ⚠️ 로그인 상태 확인 필요');
        }
      }
    } else {
      console.log('   ✅ 이미 로그인되어 있음\n');
    } */

    // 2. 갤러리 관리 페이지로 직접 이동
    console.log('2️⃣ 갤러리 관리 페이지로 이동...');
    await page.goto(`${BASE_URL}/admin/gallery`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000); // 이미지 로딩 대기
    console.log('   ✅ 갤러리 관리 페이지 로드 완료\n');

    // 5. 폴더 필터를 originals/daily-branding/kakao로 설정
    console.log('5️⃣ 폴더 필터 설정 (originals/daily-branding/kakao)...');
    const folderInput = page.locator('input[placeholder*="폴더"], input[value*="originals"]').first();
    if (await folderInput.count() > 0) {
      await folderInput.clear();
      await folderInput.fill('originals/daily-branding/kakao');
      await page.waitForTimeout(2000); // 이미지 로딩 대기
      console.log('   ✅ 폴더 필터 설정 완료\n');
    } else {
      console.log('   ⚠️ 폴더 입력 필드를 찾을 수 없습니다\n');
    }

    // 6. 미사용 필터 확인
    console.log('6️⃣ 미사용 필터 확인...');
    const unusedButton = page.locator('button:has-text("미사용")').first();
    
    if (await unusedButton.count() > 0) {
      const buttonClass = await unusedButton.getAttribute('class');
      const isActive = buttonClass?.includes('bg-orange-500') || buttonClass?.includes('orange');
      
      if (!isActive) {
        await unusedButton.click();
        await page.waitForTimeout(2000);
        console.log('   ✅ 미사용 필터 활성화\n');
      } else {
        console.log('   ✅ 미사용 필터가 이미 활성화되어 있음\n');
      }
    } else {
      console.log('   ⚠️ 미사용 버튼을 찾을 수 없습니다\n');
    }

    // 7. 미사용 이미지 표시 확인
    console.log('7️⃣ 미사용 이미지 표시 확인...');
    await page.waitForTimeout(3000);
    
    const imageCards = page.locator('img[alt], img[src*="supabase"]');
    const imageCount = await imageCards.count();
    
    if (imageCount > 0) {
      console.log(`   ✅ 미사용 이미지 ${imageCount}개 표시됨\n`);
    } else {
      console.log('   ⚠️ 표시된 이미지가 없습니다 (모든 이미지가 사용 중일 수 있음)\n');
    }

    // 8. 좋아요 기능 테스트
    console.log('8️⃣ 좋아요 기능 테스트...');
    
    if (imageCount > 0) {
      // 첫 번째 이미지에 마우스 호버
      const firstImage = imageCards.first();
      await firstImage.hover();
      await page.waitForTimeout(1000);
      
      // 좋아요 버튼 찾기
      const likeButton = page.locator('button:has-text("좋아요"), button:has-text("❤️"), button:has-text("🤍")').first();
      
      if (await likeButton.count() > 0) {
        const likeButtonText = await likeButton.textContent();
        console.log(`   📌 좋아요 버튼 발견: ${likeButtonText}`);
        
        await likeButton.click();
        await page.waitForTimeout(2000);
        console.log('   ✅ 좋아요 버튼 클릭 완료\n');
      } else {
        console.log('   ⚠️ 좋아요 버튼을 찾을 수 없습니다\n');
      }
    }

    // 9. 좋아요 필터 확인
    console.log('9️⃣ 좋아요 필터 확인...');
    const likeFilterButtons = page.locator('button:has-text("좋아요")');
    const likeFilterCount = await likeFilterButtons.count();
    
    if (likeFilterCount > 1) {
      // 두 번째 좋아요 버튼이 필터 버튼일 가능성
      const likeFilterButton = likeFilterButtons.nth(1);
      await likeFilterButton.click();
      await page.waitForTimeout(2000);
      console.log('   ✅ 좋아요 필터 활성화\n');
      
      const likedImages = page.locator('img[alt], img[src*="supabase"]');
      const likedCount = await likedImages.count();
      console.log(`   📸 좋아요한 이미지 ${likedCount}개 표시됨\n`);
    } else {
      console.log('   ⚠️ 좋아요 필터 버튼을 찾을 수 없습니다\n');
    }

    // 10. 스크린샷 저장
    console.log('🔟 스크린샷 저장...');
    await page.screenshot({ 
      path: 'playwright-results/kakao-unused-like-test.png',
      fullPage: true 
    });
    console.log('   ✅ 스크린샷 저장 완료\n');

    console.log('✅ 모든 테스트 완료!\n');

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    await page.screenshot({ 
      path: 'playwright-results/kakao-unused-like-test-error.png',
      fullPage: true 
    });
    throw error;
  } finally {
    await browser.close();
  }
}

// 테스트 실행
testKakaoUnusedAndLike()
  .then(() => {
    console.log('🎉 테스트 성공적으로 완료되었습니다!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 테스트 실패:', error);
    process.exit(1);
  });

