const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 블로그 편집 페이지 깨진 이미지 확인 시작...');

    // 1. 로그인
    console.log('1️⃣ 로그인 중...');
    await page.goto('http://localhost:3000/admin/login');
    await page.waitForLoadState('networkidle');
    
    const loginInput = page.locator('input[name="login"], input[id="login"]').first();
    const passwordInput = page.locator('input[name="password"], input[id="password"]').first();
    const submitButton = page.locator('button[type="submit"], button:has-text("로그인")').first();
    
    await loginInput.waitFor({ state: 'visible', timeout: 10000 });
    await loginInput.fill('010-6669-9000');
    
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.fill('66699000');
    
    await submitButton.waitFor({ state: 'visible', timeout: 10000 });
    await submitButton.click();
    
    await page.waitForURL('**/admin/**', { timeout: 15000 });
    console.log('✅ 로그인 완료');

    // 2. 블로그 관리 페이지로 이동
    console.log('2️⃣ 블로그 관리 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/blog');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('✅ 블로그 관리 페이지 로드 완료');

    // 3. "가을 골프 시즌 특가!" 게시물 찾기 및 수정 버튼 클릭
    console.log('3️⃣ "가을 골프 시즌 특가!" 게시물 찾기...');
    
    // 게시물 제목으로 찾기
    const postTitle = '가을 골프 시즌 특가! MASGOLF 고반발드라이버 + Royal Salute 위스키 증정';
    
    // 제목이 포함된 카드/영역 찾기
    const postCard = page.locator(`text=${postTitle}`).locator('..').locator('..').locator('..');
    
    // 수정 버튼 찾기
    const editButton = postCard.locator('button:has-text("수정"), a:has-text("수정")').first();
    
    try {
      await editButton.waitFor({ state: 'visible', timeout: 10000 });
      await editButton.click();
      console.log('✅ 수정 버튼 클릭 완료');
    } catch (e) {
      // 대안: 페이지에서 모든 수정 버튼 찾기
      console.log('⚠️ 직접 수정 버튼 찾기 시도...');
      const allEditButtons = await page.locator('button, a').all();
      for (const btn of allEditButtons) {
        const text = await btn.textContent();
        if (text && text.includes('수정')) {
          await btn.click();
          console.log('✅ 수정 버튼 클릭 완료 (대안 방법)');
          break;
        }
      }
    }
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // 에디터 초기화 대기
    console.log('✅ 수정 모드 진입 완료');

    // 4. 에디터에서 모든 이미지 찾기
    console.log('4️⃣ 에디터에서 이미지 찾기...');
    
    // TipTap 에디터 영역 찾기
    const editorArea = page.locator('.ProseMirror, [contenteditable="true"]').first();
    await editorArea.waitFor({ state: 'visible', timeout: 10000 });
    
    // 에디터 내부의 모든 이미지 찾기
    const images = await page.evaluate(() => {
      const editor = document.querySelector('.ProseMirror, [contenteditable="true"]');
      if (!editor) return [];
      
      const imgElements = editor.querySelectorAll('img');
      const imageInfo = [];
      
      imgElements.forEach((img, index) => {
        imageInfo.push({
          index: index + 1,
          src: img.src,
          alt: img.alt || '',
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          complete: img.complete,
          className: img.className,
          style: img.getAttribute('style') || ''
        });
      });
      
      return imageInfo;
    });
    
    console.log(`📊 발견된 이미지 개수: ${images.length}개`);
    
    // 5. 각 이미지의 로드 상태 확인
    console.log('\n5️⃣ 이미지 로드 상태 확인...');
    
    const brokenImages = [];
    const workingImages = [];
    
    for (const img of images) {
      console.log(`\n--- 이미지 ${img.index} ---`);
      console.log(`  URL: ${img.src}`);
      console.log(`  ALT: ${img.alt || '(없음)'}`);
      console.log(`  크기: ${img.naturalWidth}x${img.naturalHeight}`);
      console.log(`  로드 완료: ${img.complete}`);
      
      // 이미지 로드 상태 확인
      const imageStatus = await page.evaluate((imgSrc) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ loaded: true, width: img.width, height: img.height });
          img.onerror = () => resolve({ loaded: false, error: '로드 실패' });
          img.src = imgSrc;
          
          // 타임아웃 (5초)
          setTimeout(() => {
            if (!img.complete) {
              resolve({ loaded: false, error: '타임아웃' });
            }
          }, 5000);
        });
      }, img.src);
      
      const isBroken = !imageStatus.loaded || img.naturalWidth === 0 || img.naturalHeight === 0;
      
      if (isBroken) {
        console.log(`  ❌ 깨진 이미지 감지!`);
        console.log(`     오류: ${imageStatus.error || '크기가 0'}`);
        brokenImages.push({
          ...img,
          error: imageStatus.error || '크기가 0'
        });
      } else {
        console.log(`  ✅ 정상 이미지`);
        workingImages.push(img);
      }
    }
    
    // 6. 결과 요약
    console.log('\n' + '='.repeat(60));
    console.log('📊 이미지 상태 요약');
    console.log('='.repeat(60));
    console.log(`전체 이미지: ${images.length}개`);
    console.log(`정상 이미지: ${workingImages.length}개`);
    console.log(`깨진 이미지: ${brokenImages.length}개`);
    
    if (brokenImages.length > 0) {
      console.log('\n❌ 깨진 이미지 목록:');
      brokenImages.forEach((img, index) => {
        console.log(`\n${index + 1}. 이미지 ${img.index}`);
        console.log(`   URL: ${img.src}`);
        console.log(`   ALT: ${img.alt || '(없음)'}`);
        console.log(`   오류: ${img.error}`);
        console.log(`   크기: ${img.naturalWidth}x${img.naturalHeight}`);
      });
    }
    
    // 7. 네트워크 요청 확인 (404 에러)
    console.log('\n7️⃣ 네트워크 요청 확인...');
    const networkRequests = await page.evaluate(() => {
      const performanceEntries = performance.getEntriesByType('resource');
      const imageRequests = performanceEntries.filter(entry => 
        entry.name.match(/\.(jpg|jpeg|png|gif|webp|svg)/i) || 
        entry.initiatorType === 'img'
      );
      
      return imageRequests.map(entry => ({
        url: entry.name,
        status: entry.responseStatus || 'unknown',
        duration: entry.duration,
        size: entry.transferSize || 0
      }));
    });
    
    const failedRequests = networkRequests.filter(req => 
      req.status >= 400 || req.status === 'unknown' || req.size === 0
    );
    
    if (failedRequests.length > 0) {
      console.log(`⚠️ 실패한 네트워크 요청: ${failedRequests.length}개`);
      failedRequests.forEach((req, index) => {
        console.log(`  ${index + 1}. ${req.url}`);
        console.log(`     상태: ${req.status}, 크기: ${req.size} bytes`);
      });
    }
    
    // 8. 스크린샷 저장
    console.log('\n8️⃣ 스크린샷 저장...');
    await page.screenshot({ path: 'test-blog-broken-images-result.png', fullPage: true });
    console.log('✅ 스크린샷 저장 완료: test-blog-broken-images-result.png');
    
    // 9. 깨진 이미지 URL 목록 저장
    if (brokenImages.length > 0) {
      const fs = require('fs');
      const brokenUrls = brokenImages.map(img => ({
        index: img.index,
        url: img.src,
        alt: img.alt,
        error: img.error
      }));
      
      fs.writeFileSync(
        'test-blog-broken-images-urls.json',
        JSON.stringify(brokenUrls, null, 2),
        'utf-8'
      );
      console.log('✅ 깨진 이미지 URL 목록 저장: test-blog-broken-images-urls.json');
    }
    
    console.log('\n✅ 테스트 완료!');
    
    // 결과 반환
    return {
      total: images.length,
      working: workingImages.length,
      broken: brokenImages.length,
      brokenImages: brokenImages
    };
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
    await page.screenshot({ path: 'test-blog-broken-images-error.png', fullPage: true });
    throw error;
  } finally {
    console.log('\n⚠️ 브라우저를 수동으로 닫아주세요.');
    // await browser.close();
  }
})();

