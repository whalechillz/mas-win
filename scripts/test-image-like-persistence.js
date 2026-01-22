const { chromium } = require('playwright');

// 로그인 정보
const ADMIN_LOGIN = '01066699000';
const ADMIN_PASSWORD = '66699000';
const BASE_URL = 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    channel: 'chrome-canary' // Chrome Canary 사용
  });
  const page = await browser.newPage();

  // 개발자 콘솔 로그 활성화
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error' || text.includes('좋아요') || text.includes('is_liked') || text.includes('toggle-image-like')) {
      console.log(`[${type}]`, text);
    }
  });
  page.on('pageerror', error => console.error('[page error]', error.message));
  page.on('requestfailed', request => {
    if (request.url().includes('toggle-image-like') || request.url().includes('all-images')) {
      console.error(`[request failed] ${request.method()} ${request.url()} ${request.failure()?.errorText}`);
    }
  });

  console.log('🚀 로그인 페이지 접속...');
  // 로그인 페이지로 직접 이동
  await page.goto(`${BASE_URL}/admin/login?callbackUrl=${encodeURIComponent('/admin/gallery')}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  
  console.log('🔐 로그인 진행...');
  // 로그인 폼 대기
  await page.waitForSelector('input[name="login"], input#login', { timeout: 10000 });
  
  // 여러 선택자 시도
  const loginInput = page.locator('input[name="login"]').or(page.locator('input#login')).first();
  const passwordInput = page.locator('input[name="password"]').or(page.locator('input#password')).first();
  const submitButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("로그인")')).first();
  
  await loginInput.fill(ADMIN_LOGIN);
  await passwordInput.fill(ADMIN_PASSWORD);
  await submitButton.click();
  
  // 로그인 완료 대기 (갤러리 페이지로 리다이렉트)
  console.log('⏳ 로그인 완료 대기...');
  await page.waitForURL(/\/admin\/gallery/, { timeout: 20000 }).catch(async () => {
    // 갤러리 페이지가 아니면 /admin으로 이동 후 갤러리로 이동
    const currentUrl = page.url();
    console.log('  현재 URL:', currentUrl);
    if (currentUrl.includes('/admin') && !currentUrl.includes('/admin/gallery')) {
      console.log('  /admin 페이지로 이동, 갤러리 페이지로 이동...');
      await page.goto(`${BASE_URL}/admin/gallery`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    }
  });
  
  // 세션 쿠키 저장을 위해 잠시 대기
  await page.waitForTimeout(2000);
  console.log('✅ 로그인 완료');
  
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000); // 이미지 로딩 대기

  console.log('✅ 갤러리 페이지 로드 완료');

  // 첫 번째 이미지 찾기
  console.log('\n🔍 첫 번째 이미지 찾기...');
  const imageContainer = page.locator('div[class*="aspect-square"]').first();
  
  try {
    await imageContainer.waitFor({ state: 'visible', timeout: 10000 });
  } catch (e) {
    console.error('❌ 이미지를 찾을 수 없습니다. 이미지가 로드되지 않았을 수 있습니다.');
    await browser.close();
    return;
  }
  
  // 이미지 URL 가져오기
  const imageInfo = await imageContainer.evaluate((el) => {
    const img = el.querySelector('img');
    if (img) {
      return {
        url: img.src || img.getAttribute('src'),
        alt: img.alt || ''
      };
    }
    const bgImage = window.getComputedStyle(el).backgroundImage;
    if (bgImage && bgImage !== 'none') {
      const match = bgImage.match(/url\(["']?([^"']+)["']?\)/);
      return {
        url: match ? match[1] : null,
        alt: ''
      };
    }
    return { url: null, alt: '' };
  });

  if (!imageInfo.url) {
    console.error('❌ 이미지 URL을 찾을 수 없습니다');
    await browser.close();
    return;
  }

  console.log('📸 이미지 URL:', imageInfo.url);

  // 좋아요 버튼 찾기 (여러 방법 시도)
  console.log('\n🔍 좋아요 버튼 찾기...');
  await imageContainer.hover();
  await page.waitForTimeout(500);

  // 좋아요 버튼 찾기 (다양한 선택자 시도)
  let likeButton = null;
  const buttonSelectors = [
    'button[title*="좋아요"]',
    'button:has-text("좋아요")',
    'button:has([class*="heart"])',
    'button[aria-label*="좋아요"]',
    'button:has([class*="like"])'
  ];

  for (const selector of buttonSelectors) {
    try {
      const btn = imageContainer.locator('..').locator(selector).first();
      await btn.waitFor({ state: 'visible', timeout: 1000 });
      likeButton = btn;
      console.log(`✅ 좋아요 버튼 찾음: ${selector}`);
      break;
    } catch (e) {
      // 다음 선택자 시도
    }
  }

  if (!likeButton) {
    console.log('⚠️ 좋아요 버튼을 찾을 수 없습니다. API를 직접 호출하여 테스트합니다.');
    
    // API 직접 호출 테스트
    console.log('\n📡 좋아요 API 직접 호출 테스트...');
    const apiResponse = await page.evaluate(async (url) => {
      try {
        const response = await fetch('/api/admin/toggle-image-like', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: url,
            isLiked: true
          })
        });
        const data = await response.json();
        return { success: response.ok, data, status: response.status };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }, imageInfo.url);
    
    console.log('📡 API 응답:', JSON.stringify(apiResponse, null, 2));
    
    if (apiResponse.success && apiResponse.data?.success) {
      console.log('✅ 좋아요 API 호출 성공');
    } else {
      console.error('❌ 좋아요 API 호출 실패:', apiResponse.data?.error || apiResponse.error);
    }
  } else {
    // 좋아요 버튼 클릭
    console.log('\n🖱️ 좋아요 버튼 클릭...');
    const beforeClick = await likeButton.getAttribute('aria-label') || await likeButton.textContent() || '';
    const beforeClickText = beforeClick.trim();
    console.log('📌 클릭 전 버튼 상태:', beforeClickText);
    
    // 좋아요가 안 되어 있으면 좋아요 활성화, 되어 있으면 취소 후 다시 활성화
    const isLikedBefore = beforeClickText.includes('❤️') || beforeClickText.includes('좋아요');
    
    if (!isLikedBefore) {
      console.log('  좋아요 활성화 중...');
      
      // API 호출 모니터링
      let apiResponseReceived = false;
      page.on('response', async (response) => {
        if (response.url().includes('toggle-image-like')) {
          apiResponseReceived = true;
          const data = await response.json().catch(() => ({}));
          console.log('📡 API 응답:', {
            status: response.status(),
            statusText: response.statusText(),
            data: data
          });
        }
      });
      
      await likeButton.click();
      await page.waitForTimeout(2000); // API 호출 대기
      
      if (!apiResponseReceived) {
        console.log('  ⚠️ API 응답을 받지 못했습니다. 수동으로 API 호출 시도...');
        const manualApiResponse = await page.evaluate(async (url) => {
          try {
            const response = await fetch('/api/admin/toggle-image-like', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imageUrl: url,
                isLiked: true
              })
            });
            const data = await response.json();
            return { success: response.ok, data, status: response.status, statusText: response.statusText };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }, imageInfo.url);
        console.log('📡 수동 API 호출 결과:', JSON.stringify(manualApiResponse, null, 2));
      }
      
      const afterClick = await likeButton.getAttribute('aria-label') || await likeButton.textContent() || '';
      console.log('📌 클릭 후 버튼 상태:', afterClick.trim());
      
      // 좋아요가 활성화되었는지 확인
      const isLikedAfter = afterClick.includes('❤️') || afterClick.includes('좋아요');
      if (!isLikedAfter) {
        console.log('  ⚠️ 좋아요가 활성화되지 않음, 다시 클릭 시도...');
        await likeButton.click();
        await page.waitForTimeout(2000);
      }
    } else {
      console.log('  좋아요가 이미 활성화되어 있음, 취소 후 다시 활성화...');
      // 취소
      await likeButton.click();
      await page.waitForTimeout(1500);
      // 다시 활성화
      await likeButton.click();
      await page.waitForTimeout(1500);
      
      const finalState = await likeButton.getAttribute('aria-label') || await likeButton.textContent() || '';
      console.log('📌 최종 버튼 상태:', finalState.trim());
    }
  }

  // DB에서 좋아요 상태 확인
  console.log('\n🔍 DB에서 좋아요 상태 확인...');
  const dbCheck = await page.evaluate(async (url) => {
    try {
      const response = await fetch(`/api/admin/all-images?limit=100&offset=0`);
      const data = await response.json();
      const image = data.images?.find(img => img.url === url);
      return {
        success: true,
        found: !!image,
        is_liked: image?.is_liked,
        url: image?.url,
        name: image?.name
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }, imageInfo.url);

  console.log('📊 DB 확인 결과:', JSON.stringify(dbCheck, null, 2));

  // 페이지 새로고침
  console.log('\n🔄 페이지 새로고침...');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // 새로고침 후 좋아요 상태 확인
  console.log('\n🔍 새로고침 후 좋아요 상태 확인...');
  const afterReload = await page.evaluate(async (url) => {
    try {
      const response = await fetch(`/api/admin/all-images?limit=100&offset=0`);
      const data = await response.json();
      const image = data.images?.find(img => img.url === url);
      return {
        success: true,
        found: !!image,
        is_liked: image?.is_liked,
        url: image?.url,
        name: image?.name
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }, imageInfo.url);

  console.log('📊 새로고침 후 확인 결과:', JSON.stringify(afterReload, null, 2));

  // UI에서 좋아요 상태 확인
  console.log('\n🔍 UI에서 좋아요 상태 확인...');
  try {
    await imageContainer.waitFor({ state: 'visible' });
    await imageContainer.hover();
    await page.waitForTimeout(500);
    
    let uiLikeState = null;
    for (const selector of buttonSelectors) {
      try {
        const btn = imageContainer.locator('..').locator(selector).first();
        await btn.waitFor({ state: 'visible', timeout: 1000 });
        uiLikeState = await btn.getAttribute('aria-label') || await btn.textContent() || '';
        break;
      } catch (e) {
        // 다음 선택자 시도
      }
    }
    
    if (!uiLikeState) {
      uiLikeState = '버튼을 찾을 수 없음';
    }
    console.log('📊 UI 좋아요 상태:', uiLikeState);
  } catch (e) {
    console.log('⚠️ UI 확인 중 오류:', e.message);
  }

  // 결과 분석
  console.log('\n📊 최종 결과 분석:');
  console.log('==================================================');
  console.log('DB 저장 상태:', dbCheck.is_liked ? '✅ 좋아요됨' : '❌ 좋아요 안됨');
  console.log('새로고침 후 DB:', afterReload.is_liked ? '✅ 좋아요됨' : '❌ 좋아요 안됨');
  console.log('==================================================');

  if (dbCheck.success && afterReload.success) {
    if (dbCheck.is_liked && afterReload.is_liked) {
      console.log('✅ 좋아요 상태가 DB에 저장되고 새로고침 후에도 유지됩니다!');
    } else if (dbCheck.is_liked && !afterReload.is_liked) {
      console.error('❌ 좋아요 상태가 DB에 저장되었지만 새로고침 후 사라졌습니다!');
      console.error('   → all-images.js의 select 쿼리에 is_liked가 포함되어 있는지 확인하세요.');
    } else if (!dbCheck.is_liked) {
      console.error('❌ 좋아요 상태가 DB에 저장되지 않았습니다!');
      console.error('   → toggle-image-like.js API가 제대로 작동하는지 확인하세요.');
    } else {
      console.log('ℹ️ 좋아요 상태가 false입니다 (정상 - 좋아요를 취소했거나 처음부터 좋아요하지 않음)');
    }
  } else {
    console.error('❌ API 호출 실패:', dbCheck.error || afterReload.error);
  }

  console.log('\n⏳ 5초 대기 (수동 확인용)...');
  await page.waitForTimeout(5000);

  await browser.close();
})();
