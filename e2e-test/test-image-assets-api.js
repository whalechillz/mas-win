/**
 * image_assets 마이그레이션 후 API 테스트
 * 주요 API 엔드포인트들이 image_assets를 제대로 사용하는지 확인
 */

const { chromium } = require('playwright');

async function testImageAssetsAPI() {
  console.log('🚀 image_assets API 테스트 시작...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const page = await browser.newPage();
  
  // 네트워크 요청/응답 모니터링
  const apiCalls = [];
  const apiErrors = [];
  
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/admin/all-images') || 
        url.includes('/api/admin/image-metadata') ||
        url.includes('/api/admin/image-metadata-batch')) {
      apiCalls.push({
        url: url,
        method: request.method(),
        timestamp: new Date().toISOString()
      });
      console.log(`📡 API 요청: ${request.method()} ${url.substring(0, 100)}...`);
    }
  });
  
  page.on('response', async response => {
    const url = response.url();
    const status = response.status();
    
    if (url.includes('/api/admin/all-images') || 
        url.includes('/api/admin/image-metadata') ||
        url.includes('/api/admin/image-metadata-batch')) {
      
      if (status >= 400) {
        apiErrors.push({ url, status });
        try {
          const text = await response.text();
          console.log(`❌ API 오류: ${url} - ${status}`);
          console.log(`   응답: ${text.substring(0, 200)}`);
        } catch (e) {
          console.log(`   응답 읽기 실패: ${e.message}`);
        }
      } else {
        console.log(`✅ API 성공: ${url.substring(0, 100)}... - ${status}`);
        
        // 응답 데이터 확인 (all-images만)
        if (url.includes('/api/admin/all-images')) {
          try {
            const json = await response.json();
            if (json.images) {
              console.log(`   📸 이미지 개수: ${json.images.length}개`);
              if (json.images.length > 0) {
                const firstImage = json.images[0];
                console.log(`   📋 첫 번째 이미지 샘플:`);
                console.log(`      - cdn_url: ${firstImage.cdn_url || firstImage.image_url || 'N/A'}`);
                console.log(`      - ai_tags: ${Array.isArray(firstImage.ai_tags) ? firstImage.ai_tags.join(', ') : (firstImage.tags ? firstImage.tags.join(', ') : 'N/A')}`);
                console.log(`      - alt_text: ${firstImage.alt_text || 'N/A'}`);
              }
            }
          } catch (e) {
            // JSON 파싱 실패는 무시
          }
        }
      }
    }
  });
  
  // 콘솔 에러 캡처
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error' && (text.includes('image_metadata') || text.includes('image_assets'))) {
      console.log(`🔴 콘솔 오류: ${text}`);
      apiErrors.push({ type: 'console', message: text });
    }
  });
  
  try {
    // 1. 로그인
    console.log('1️⃣ 로그인 중...');
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="text"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/**', { timeout: 10000 });
    console.log('✅ 로그인 완료\n');
    
    // 2. 갤러리 페이지로 이동
    console.log('2️⃣ 갤러리 페이지로 이동 중...');
    await page.goto('http://localhost:3000/admin/gallery', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000); // 이미지 로딩 대기
    console.log('✅ 갤러리 페이지 로드 완료\n');
    
    // 3. 검색 테스트
    console.log('3️⃣ 검색 기능 테스트...');
    const searchInput = await page.waitForSelector('input[placeholder*="파일명, ALT 텍스트, 키워드"]', { timeout: 10000 });
    await searchInput.fill('test');
    await page.waitForTimeout(2000);
    console.log('✅ 검색어 입력 완료\n');
    
    // 4. 이미지 편집 모달 테스트
    console.log('4️⃣ 이미지 편집 모달 테스트...');
    const images = await page.$$('img[src*="supabase"], img[src*="storage"]');
    if (images.length > 0) {
      console.log(`   ${images.length}개의 이미지 발견`);
      
      // 첫 번째 이미지에 호버
      const firstImage = images[0];
      const container = await firstImage.evaluateHandle(el => el.closest('div[class*="group"]'));
      if (container) {
        const containerEl = await container.asElement();
        if (containerEl) {
          await containerEl.hover();
          await page.waitForTimeout(1000);
          
          // 편집 버튼 찾기 및 클릭
          const editButton = await page.$('button:has-text("✏️"), button[title="편집"]');
          if (editButton) {
            await editButton.click();
            await page.waitForTimeout(2000);
            console.log('✅ 편집 모달 열기 성공');
            
            // 모달 닫기
            const closeButton = await page.$('button:has-text("✕"), button[aria-label*="닫기"]');
            if (closeButton) {
              await closeButton.click();
              await page.waitForTimeout(1000);
            }
          }
        }
      }
    }
    console.log('');
    
    // 5. 결과 요약
    console.log('\n📊 테스트 결과 요약:');
    console.log(`   - API 호출 횟수: ${apiCalls.length}회`);
    console.log(`   - API 오류: ${apiErrors.length}개`);
    
    if (apiErrors.length > 0) {
      console.log('\n❌ 발견된 오류:');
      apiErrors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err.url || err.message}`);
      });
    } else {
      console.log('\n✅ 모든 API 호출이 성공했습니다!');
    }
    
    // 6. 스크린샷 저장
    await page.screenshot({ path: 'e2e-test/image-assets-api-test-result.png', fullPage: true });
    console.log('\n📸 스크린샷 저장: e2e-test/image-assets-api-test-result.png');
    
    return {
      success: apiErrors.length === 0,
      apiCalls: apiCalls.length,
      errors: apiErrors.length
    };
    
  } catch (error) {
    console.error('\n❌ 테스트 중 오류 발생:', error);
    await page.screenshot({ path: 'e2e-test/image-assets-api-test-error.png', fullPage: true });
    throw error;
  } finally {
    await browser.close();
    console.log('\n🏁 테스트 완료');
  }
}

// 테스트 실행
testImageAssetsAPI()
  .then(result => {
    console.log('\n📊 최종 결과:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 테스트 실패:', error);
    process.exit(1);
  });
