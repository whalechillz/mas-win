/**
 * 고객 이미지 로드 실패 문제 재현 및 원인 파악 테스트
 * 
 * 문제:
 * - 고객 목록에서 썸네일이 로드되지 않음
 * - "이미지 로드 실패" 오류 반복 발생
 * - CORB (Cross-Origin Read Blocking) 오류 발생
 */

const { chromium } = require('playwright');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '010-6669-9000';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '66699000';

async function testCustomerImageLoad() {
  console.log('🎭 Playwright 고객 이미지 로드 테스트 시작...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true 
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // 네트워크 요청/응답 모니터링
  const failedRequests = [];
  const imageRequests = [];
  const corsErrors = [];
  
  page.on('request', request => {
    const url = request.url();
    if (url.includes('supabase.co') && (url.includes('blog-images') || url.includes('storage'))) {
      imageRequests.push({
        url: url.substring(0, 150),
        method: request.method(),
        headers: request.headers(),
        timestamp: new Date().toISOString()
      });
    }
  });
  
  page.on('response', async response => {
    const url = response.url();
    const status = response.status();
    
    if (url.includes('supabase.co') && (url.includes('blog-images') || url.includes('storage'))) {
      const headers = response.headers();
      const contentType = headers['content-type'] || '';
      
      if (status >= 400) {
        failedRequests.push({
          url: url.substring(0, 150),
          status,
          statusText: response.statusText(),
          headers: Object.keys(headers).reduce((acc, key) => {
            if (key.toLowerCase().includes('cors') || key.toLowerCase().includes('origin') || key.toLowerCase().includes('access-control')) {
              acc[key] = headers[key];
            }
            return acc;
          }, {}),
          contentType
        });
      }
      
      // CORS 관련 헤더 확인
      const corsHeaders = {
        'access-control-allow-origin': headers['access-control-allow-origin'],
        'access-control-allow-methods': headers['access-control-allow-methods'],
        'access-control-allow-credentials': headers['access-control-allow-credentials'],
        'content-type': contentType
      };
      
      if (Object.values(corsHeaders).some(v => v)) {
        corsErrors.push({
          url: url.substring(0, 150),
          status,
          corsHeaders
        });
      }
    }
  });
  
  // 콘솔 메시지 수집 (모든 메시지)
  const consoleMessages = [];
  const allConsoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    allConsoleMessages.push({
      type: msg.type(),
      text: text,
      location: msg.location()?.url || 'unknown'
    });
    
    if (text.includes('이미지 로드 실패') || 
        text.includes('Image load failed') || 
        text.includes('CORB') ||
        text.includes('CORS') ||
        text.includes('MediaRenderer') ||
        text.includes('404') ||
        text.includes('Failed to load')) {
      consoleMessages.push({
        type: msg.type(),
        text: text.substring(0, 300),
        location: msg.location()?.url || 'unknown'
      });
    }
  });
  
  // 페이지 오류 수집
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push({
      message: error.message,
      stack: error.stack?.substring(0, 300)
    });
  });
  
  try {
    // 1. 로그인
    console.log('1️⃣ 로그인 중...');
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.fill('input[type="text"], input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"], button:has-text("로그인")');
    await page.waitForURL(/\/admin/, { timeout: 10000 });
    await page.waitForTimeout(2000); // 로그인 후 세션 설정 대기
    console.log('✅ 로그인 완료\n');
    
    // 2. 고객 관리 페이지로 이동
    console.log('2️⃣ 고객 관리 페이지로 이동...');
    await page.goto(`${BASE_URL}/admin/customers`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // 페이지 로드 대기
    console.log('✅ 고객 관리 페이지 로드 완료\n');
    
    // 3. 고객 목록 로드 대기
    console.log('3️⃣ 고객 목록 로드 대기...');
    await page.waitForSelector('table, tbody, tr', { timeout: 10000 });
    await page.waitForTimeout(3000); // 이미지 로드 대기
    console.log('✅ 고객 목록 로드 완료\n');
    
    // 4. 썸네일 이미지 상태 확인
    console.log('4️⃣ 썸네일 이미지 상태 확인...');
    
    // 모든 이미지 태그 확인 (supabase URL 포함)
    const allImages = await page.$$eval('td img', imgs => {
      return imgs.map(img => ({
        src: img.src.substring(0, 200),
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        alt: img.alt,
        display: window.getComputedStyle(img).display,
        parentHtml: img.parentElement?.innerHTML.substring(0, 200) || ''
      }));
    }).catch(() => []);
    
    const thumbnails = allImages.filter(img => 
      img.src.includes('supabase') || img.src.includes('storage')
    );
    
    const brokenThumbnails = allImages.filter(img => {
      return img.display === 'none' || 
             (img.complete && img.naturalWidth === 0 && img.naturalHeight === 0);
    });
    
    // Placeholder div 확인
    const placeholderDivs = await page.evaluate(() => {
      const divs = Array.from(document.querySelectorAll('td div'));
      return divs.filter(div => {
        const text = div.textContent || '';
        const classes = div.className || '';
        return text.includes('없음') || classes.includes('thumbnail-placeholder');
      }).length;
    }).catch(() => 0);
    
    // 고객 데이터에서 thumbnailUrl 확인
    const customerData = await page.evaluate(() => {
      // React 컴포넌트의 state나 props에 접근하기 어려우므로 DOM에서 확인
      const rows = Array.from(document.querySelectorAll('tbody tr'));
      return rows.slice(0, 10).map(row => {
        const cells = row.querySelectorAll('td');
        const thumbnailCell = cells[0];
        const nameCell = cells[1];
        return {
          name: nameCell?.textContent?.trim() || '',
          hasImage: thumbnailCell?.querySelector('img') !== null,
          hasPlaceholder: thumbnailCell?.textContent?.includes('없음') || false,
          thumbnailHtml: thumbnailCell?.innerHTML.substring(0, 200) || ''
        };
      });
    }).catch(() => []);
    
    console.log(`   📊 썸네일 통계:`);
    console.log(`      - 총 이미지 태그: ${allImages.length}개`);
    console.log(`      - Supabase URL 이미지: ${thumbnails.length}개`);
    console.log(`      - 로드 완료된 이미지: ${allImages.filter(t => t.complete && t.naturalWidth > 0).length}개`);
    console.log(`      - 로드 실패한 이미지: ${brokenThumbnails.length}개`);
    console.log(`      - Placeholder 표시: ${placeholderDivs}개`);
    console.log(`      - 고객 데이터 샘플: ${customerData.length}개\n`);
    
    if (customerData.length > 0) {
      console.log('   📋 고객 데이터 샘플:');
      customerData.slice(0, 5).forEach((c, idx) => {
        console.log(`      [${idx + 1}] ${c.name}`);
        console.log(`          이미지 태그: ${c.hasImage ? '있음' : '없음'}`);
        console.log(`          Placeholder: ${c.hasPlaceholder ? '있음' : '없음'}`);
        if (c.thumbnailHtml) {
          console.log(`          HTML: ${c.thumbnailHtml.substring(0, 100)}...`);
        }
      });
      console.log('');
    }
    
    // 5. API 응답 확인 (네트워크 요청 인터셉트)
    console.log('5️⃣ API 응답 확인...');
    
    const apiResponses = [];
    
    // 네트워크 요청을 인터셉트하여 API 응답 확인
    await page.route('**/api/admin/customers*', async route => {
      const request = route.request();
      const response = await route.fetch();
      const url = request.url();
      
      try {
        const json = await response.json();
        const responseData = {
          url: url.substring(0, 100),
          status: response.status(),
          totalCount: json.data?.length || 0,
          thumbnailCount: json.data?.filter(c => c.thumbnailUrl).length || 0,
          thumbnails: json.data?.filter(c => c.thumbnailUrl).slice(0, 3) || []
        };
        apiResponses.push(responseData);
        
        console.log(`   📡 API 응답 캡처: ${url.substring(0, 80)}...`);
        console.log(`      상태: ${response.status()}`);
        console.log(`      총 고객 수: ${responseData.totalCount}명`);
        console.log(`      썸네일 있는 고객: ${responseData.thumbnailCount}명`);
        
        if (responseData.thumbnails.length > 0) {
          console.log(`      썸네일 URL 샘플:`);
          responseData.thumbnails.forEach((c, idx) => {
            console.log(`         [${idx + 1}] ${c.name}: ${(c.thumbnailUrl || '').substring(0, 100)}...`);
          });
        } else if (response.status() === 200) {
          console.log(`      ⚠️ 썸네일 URL이 있는 고객이 없음`);
        }
        console.log('');
        
        await route.fulfill({ response, json });
      } catch (e) {
        await route.continue();
      }
    });
    
    // 페이지 새로고침하여 API 호출 캡처
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // API 응답 요약은 이미 위에서 출력됨
    if (apiResponses.length === 0) {
      console.log(`   ⚠️ API 응답을 캡처하지 못함 (인증 문제일 수 있음)`);
      console.log('');
    }
    
    // 6. 네트워크 요청 분석
    console.log('6️⃣ 네트워크 요청 분석...');
    console.log(`   📡 이미지 요청: ${imageRequests.length}개`);
    console.log(`   ❌ 실패한 요청: ${failedRequests.length}개`);
    console.log(`   🔒 CORS 관련 응답: ${corsErrors.length}개\n`);
    
    if (failedRequests.length > 0) {
      console.log('   ❌ 실패한 요청 상세:');
      failedRequests.slice(0, 5).forEach((req, idx) => {
        console.log(`      [${idx + 1}] ${req.url}`);
        console.log(`          상태: ${req.status} ${req.statusText}`);
        console.log(`          Content-Type: ${req.contentType}`);
        if (Object.keys(req.headers).length > 0) {
          console.log(`          CORS 헤더:`, req.headers);
        }
      });
      console.log('');
    }
    
    if (corsErrors.length > 0) {
      console.log('   🔒 CORS 헤더 상세:');
      corsErrors.slice(0, 3).forEach((err, idx) => {
        console.log(`      [${idx + 1}] ${err.url}`);
        console.log(`          상태: ${err.status}`);
        console.log(`          CORS 헤더:`, err.corsHeaders);
      });
      console.log('');
    }
    
    // 7. 콘솔 오류 분석
    console.log('7️⃣ 콘솔 오류 분석...');
    console.log(`   📋 관련 콘솔 메시지: ${consoleMessages.length}개`);
    console.log(`   📋 전체 콘솔 메시지: ${allConsoleMessages.length}개\n`);
    
    if (consoleMessages.length > 0) {
      console.log('   주요 오류 메시지:');
      const uniqueMessages = [...new Set(consoleMessages.map(m => m.text))];
      uniqueMessages.slice(0, 10).forEach((msg, idx) => {
        console.log(`      [${idx + 1}] ${msg.substring(0, 200)}`);
      });
      console.log('');
    }
    
    // 에러 타입 메시지 확인
    const errorMessages = allConsoleMessages.filter(m => m.type === 'error');
    if (errorMessages.length > 0) {
      console.log(`   ❌ 에러 타입 메시지: ${errorMessages.length}개`);
      errorMessages.slice(0, 5).forEach((msg, idx) => {
        console.log(`      [${idx + 1}] ${msg.text.substring(0, 200)}`);
        console.log(`          위치: ${msg.location.substring(0, 100)}`);
      });
      console.log('');
    }
    
    // 경고 타입 메시지 확인
    const warningMessages = allConsoleMessages.filter(m => m.type === 'warning');
    if (warningMessages.length > 0) {
      console.log(`   ⚠️ 경고 타입 메시지: ${warningMessages.length}개`);
      const corbWarnings = warningMessages.filter(m => 
        m.text.includes('CORB') || 
        m.text.includes('Cross-Origin') ||
        m.text.includes('blocked')
      );
      if (corbWarnings.length > 0) {
        console.log(`      CORB 관련 경고: ${corbWarnings.length}개`);
        corbWarnings.slice(0, 3).forEach((msg, idx) => {
          console.log(`         [${idx + 1}] ${msg.text.substring(0, 200)}`);
        });
      }
      console.log('');
    }
    
    // 8. 페이지 오류 확인
    if (pageErrors.length > 0) {
      console.log('8️⃣ 페이지 오류:');
      pageErrors.forEach((err, idx) => {
        console.log(`   [${idx + 1}] ${err.message}`);
      });
      console.log('');
    }
    
    // 9. 실제 이미지 URL 샘플 확인
    console.log('9️⃣ 이미지 URL 샘플 확인...');
    const sampleUrls = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('td img[src]'));
      return imgs.slice(0, 5).map(img => ({
        src: img.src,
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight
      }));
    });
    
    if (sampleUrls.length > 0) {
      console.log('   샘플 URL:');
      sampleUrls.forEach((url, idx) => {
        console.log(`      [${idx + 1}] ${url.src.substring(0, 120)}...`);
        console.log(`          로드 상태: ${url.complete ? '완료' : '진행 중'}`);
        console.log(`          크기: ${url.naturalWidth}x${url.naturalHeight}`);
      });
    }
    console.log('');
    
    // 10. 원인 분석 요약
    console.log('🔍 원인 분석 요약:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (failedRequests.length > 0) {
      console.log('❌ 주요 원인: 네트워크 요청 실패');
      const statusCounts = {};
      failedRequests.forEach(req => {
        statusCounts[req.status] = (statusCounts[req.status] || 0) + 1;
      });
      console.log(`   - 실패한 요청: ${failedRequests.length}개`);
      console.log(`   - 상태 코드 분포:`, statusCounts);
      
      if (failedRequests.some(r => r.status === 404)) {
        console.log('   ⚠️ 404 오류: 파일이 존재하지 않음 (file_path는 있지만 실제 파일 없음)');
      }
      if (failedRequests.some(r => r.status === 403)) {
        console.log('   ⚠️ 403 오류: 접근 권한 문제 (CORS 또는 인증)');
      }
    }
    
    if (corsErrors.length > 0) {
      const missingCors = corsErrors.filter(err => 
        !err.corsHeaders['access-control-allow-origin']
      );
      if (missingCors.length > 0) {
        console.log('❌ 주요 원인: CORS 설정 문제');
        console.log(`   - CORS 헤더가 없는 응답: ${missingCors.length}개`);
        console.log('   ⚠️ Supabase Storage의 CORS 설정 확인 필요');
      }
    }
    
    if (brokenThumbnails.length > 0 && failedRequests.length === 0) {
      console.log('❌ 주요 원인: 이미지 URL은 유효하지만 로드 실패');
      console.log(`   - 깨진 이미지: ${brokenThumbnails.length}개`);
      console.log('   ⚠️ 브라우저가 이미지를 로드하지 못함 (CORB 또는 다른 정책)');
    }
    
    // CORB 관련 오류 확인
    const corbErrors = allConsoleMessages.filter(m => 
      m.text.includes('CORB') || 
      m.text.includes('Cross-Origin Read Blocking') ||
      m.text.includes('blocked by CORB')
    );
    
    if (corbErrors.length > 0) {
      console.log('❌ 주요 원인: CORB (Cross-Origin Read Blocking)');
      console.log(`   ⚠️ CORB 오류: ${corbErrors.length}개`);
      console.log('   ⚠️ 브라우저가 이미지 응답을 차단함');
      console.log('   ⚠️ Supabase Storage의 Content-Type 헤더 확인 필요');
      console.log('   ⚠️ 해결 방법:');
      console.log('      1. Supabase Storage 버킷의 CORS 설정 확인');
      console.log('      2. Content-Type 헤더가 올바르게 설정되었는지 확인');
      console.log('      3. 이미지 파일이 실제로 존재하는지 확인');
    }
    
    // 실제 이미지 로드 실패 확인
    if (brokenThumbnails.length > 0 && failedRequests.length === 0) {
      console.log('❌ 주요 원인: 이미지 URL은 유효하지만 브라우저가 로드하지 못함');
      console.log(`   ⚠️ 깨진 이미지: ${brokenThumbnails.length}개`);
      console.log('   ⚠️ 가능한 원인:');
      console.log('      1. CORB 정책으로 인한 차단');
      console.log('      2. Content Security Policy (CSP) 제한');
      console.log('      3. 파일이 실제로 존재하지 않음 (404는 네트워크 레벨에서만 감지됨)');
    }
    
    // 이미지가 모두 로드되었지만 사용자가 보지 못하는 경우
    if (allImages.length > 0 && allImages.every(img => img.complete && img.naturalWidth > 0)) {
      console.log('✅ 이미지 로드는 정상적으로 완료됨');
      console.log('   ⚠️ 사용자가 보는 화면과 다를 수 있음 (캐시 문제 또는 다른 브라우저)');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // 스크린샷 저장
    await page.screenshot({ 
      path: 'e2e-test/customer-image-load-test-result.png',
      fullPage: true 
    });
    console.log('📸 스크린샷 저장: e2e-test/customer-image-load-test-result.png\n');
    
    console.log('✅ 테스트 완료');
    
  } catch (error) {
    console.error('❌ 테스트 오류:', error);
    await page.screenshot({ 
      path: 'e2e-test/customer-image-load-test-error.png',
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

testCustomerImageLoad().catch(console.error);
