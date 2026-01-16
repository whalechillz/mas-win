/**
 * "대표로" 버튼 클릭 시 내용이 안 보이는 오류 재현 및 원인 파악
 */

const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // 디버깅을 위해 느리게 실행
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: './test-videos/',
      size: { width: 1920, height: 1080 }
    }
  });
  
  const page = await context.newPage();
  
  // 콘솔 로그 캡처
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(`[${msg.type()}] ${text}`);
    console.log(`[${msg.type()}] ${text}`);
  });
  
  // 페이지 에러 캡처
  page.on('pageerror', error => {
    console.error('❌ 페이지 에러:', error.message);
    consoleLogs.push(`[ERROR] ${error.message}`);
  });
  
  try {
    console.log('🚀 테스트 시작: 제품 합성 관리 페이지 접속');
    console.log('⚠️  참고: 수동으로 로그인한 후 테스트를 진행하거나, 쿠키를 사용하세요.');
    
    // 1. 제품 합성 관리 페이지로 직접 이동 (로그인은 수동 또는 쿠키 사용)
    await page.goto('http://localhost:3000/admin/product-composition', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    console.log('✅ 제품 합성 관리 페이지 로드 완료');
    
    // 로그인 페이지로 리다이렉트되었는지 확인
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('⚠️  로그인 페이지로 리다이렉트되었습니다.');
      console.log('⚠️  수동으로 로그인한 후 브라우저를 닫지 말고 스크립트를 다시 실행하세요.');
      await page.screenshot({ path: 'test-login-required.png', fullPage: true });
      throw new Error('로그인이 필요합니다. 수동으로 로그인한 후 테스트를 진행하세요.');
    }
    
    // 4. 제품 목록이 로드될 때까지 대기
    await page.waitForSelector('table, .grid, [class*="grid"]', { timeout: 10000 });
    console.log('✅ 제품 목록 로드 완료');
    
    // 5. 첫 번째 제품의 "수정" 버튼 찾기 및 클릭
    console.log('🔍 제품 수정 버튼 찾는 중...');
    
    // 여러 가능한 선택자 시도
    const editButtonSelectors = [
      'button:has-text("수정")',
      'button:has-text("Edit")',
      '[class*="edit"]',
      'tr:first-child button:first-child',
      'tbody tr:first-child button',
    ];
    
    let editButton = null;
    for (const selector of editButtonSelectors) {
      try {
        editButton = await page.locator(selector).first();
        if (await editButton.isVisible({ timeout: 2000 })) {
          console.log(`✅ 수정 버튼 발견: ${selector}`);
          break;
        }
      } catch (e) {
        // 다음 선택자 시도
      }
    }
    
    if (!editButton || !(await editButton.isVisible())) {
      // 스크린샷 저장
      await page.screenshot({ path: 'test-main-image-issue-1-no-edit-button.png', fullPage: true });
      throw new Error('수정 버튼을 찾을 수 없습니다.');
    }
    
    await editButton.click();
    console.log('✅ 수정 버튼 클릭 완료');
    
    // 6. 모달이 열릴 때까지 대기
    await page.waitForSelector('[class*="modal"], [class*="Modal"], [role="dialog"]', { timeout: 5000 });
    console.log('✅ 제품 수정 모달 열림');
    
    // 7. 이미지 목록이 로드될 때까지 대기
    await page.waitForTimeout(1000);
    
    // 8. 현재 이미지 목록 상태 확인
    console.log('📊 현재 이미지 목록 상태 확인');
    const imageCountBefore = await page.evaluate(() => {
      const images = document.querySelectorAll('[class*="grid"] img, img[src*="supabase"]');
      return images.length;
    });
    console.log(`  - 이미지 개수 (before): ${imageCountBefore}`);
    
    // 9. getAllImages 함수 결과 확인 (콘솔에서)
    const formDataBefore = await page.evaluate(() => {
      // React DevTools를 통해 formData 확인 (실제로는 window 객체에 노출되어야 함)
      return {
        image_url: null,
        reference_images: null,
        reference_images_enabled: null
      };
    });
    
    // 10. "대표로" 버튼 찾기 및 클릭
    console.log('🔍 "대표로" 버튼 찾는 중...');
    
    const mainImageButtonSelectors = [
      'button:has-text("대표로")',
      'button:has-text("대표")',
      '[class*="main"] button',
      'button[title*="대표"]',
    ];
    
    let mainImageButton = null;
    for (const selector of mainImageButtonSelectors) {
      try {
        const buttons = await page.locator(selector).all();
        if (buttons.length > 0) {
          // 첫 번째가 아닌 두 번째 이미지의 "대표로" 버튼 찾기
          for (let i = 0; i < buttons.length; i++) {
            if (await buttons[i].isVisible({ timeout: 1000 })) {
              mainImageButton = buttons[i];
              console.log(`✅ "대표로" 버튼 발견: ${selector} (인덱스 ${i})`);
              break;
            }
          }
          if (mainImageButton) break;
        }
      } catch (e) {
        // 다음 선택자 시도
      }
    }
    
    if (!mainImageButton || !(await mainImageButton.isVisible())) {
      await page.screenshot({ path: 'test-main-image-issue-2-no-main-button.png', fullPage: true });
      throw new Error('"대표로" 버튼을 찾을 수 없습니다.');
    }
    
    // 11. 클릭 전 스크린샷
    await page.screenshot({ path: 'test-main-image-issue-3-before-click.png', fullPage: true });
    console.log('📸 클릭 전 스크린샷 저장 완료');
    
    // 12. "대표로" 버튼 클릭
    console.log('🖱️ "대표로" 버튼 클릭');
    await mainImageButton.click();
    
    // 13. 상태 변경 대기
    await page.waitForTimeout(1000);
    
    // 14. 클릭 후 스크린샷
    await page.screenshot({ path: 'test-main-image-issue-4-after-click.png', fullPage: true });
    console.log('📸 클릭 후 스크린샷 저장 완료');
    
    // 15. 이미지 목록 상태 확인 (after)
    const imageCountAfter = await page.evaluate(() => {
      const images = document.querySelectorAll('[class*="grid"] img, img[src*="supabase"]');
      return images.length;
    });
    console.log(`  - 이미지 개수 (after): ${imageCountAfter}`);
    
    // 16. React 상태 확인 (가능한 경우)
    const reactState = await page.evaluate(() => {
      // React DevTools가 있으면 확인
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        return 'React DevTools available';
      }
      return 'React DevTools not available';
    });
    console.log(`  - React 상태: ${reactState}`);
    
    // 17. DOM 구조 확인
    const domStructure = await page.evaluate(() => {
      const grid = document.querySelector('[class*="grid"]');
      if (!grid) return 'Grid not found';
      
      return {
        childrenCount: grid.children.length,
        hasImages: grid.querySelectorAll('img').length,
        innerHTML: grid.innerHTML.substring(0, 500) // 처음 500자만
      };
    });
    console.log('📋 DOM 구조:', JSON.stringify(domStructure, null, 2));
    
    // 18. 콘솔 로그 분석
    console.log('\n📝 콘솔 로그 분석:');
    const errorLogs = consoleLogs.filter(log => log.includes('ERROR') || log.includes('error'));
    const warningLogs = consoleLogs.filter(log => log.includes('WARN') || log.includes('warn'));
    
    if (errorLogs.length > 0) {
      console.log('  ❌ 에러 로그:');
      errorLogs.forEach(log => console.log(`    - ${log}`));
    }
    
    if (warningLogs.length > 0) {
      console.log('  ⚠️  경고 로그:');
      warningLogs.forEach(log => console.log(`    - ${log}`));
    }
    
    // 19. 결과 분석
    console.log('\n📊 결과 분석:');
    console.log(`  - 클릭 전 이미지 개수: ${imageCountBefore}`);
    console.log(`  - 클릭 후 이미지 개수: ${imageCountAfter}`);
    
    if (imageCountAfter < imageCountBefore) {
      console.log('  ❌ 문제 발견: 이미지가 사라졌습니다!');
      console.log(`  - 사라진 이미지 개수: ${imageCountBefore - imageCountAfter}`);
    } else if (imageCountAfter === 0 && imageCountBefore > 0) {
      console.log('  ❌ 심각한 문제: 모든 이미지가 사라졌습니다!');
    } else {
      console.log('  ✅ 이미지 개수는 유지되었습니다.');
    }
    
    // 20. 로그 파일 저장
    const logContent = {
      timestamp: new Date().toISOString(),
      imageCountBefore,
      imageCountAfter,
      domStructure,
      consoleLogs: consoleLogs.slice(-50), // 마지막 50개만
      errorLogs,
      warningLogs
    };
    
    fs.writeFileSync(
      'test-main-image-issue-log.json',
      JSON.stringify(logContent, null, 2)
    );
    console.log('✅ 로그 파일 저장 완료: test-main-image-issue-log.json');
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    await page.screenshot({ path: 'test-main-image-issue-error.png', fullPage: true });
    throw error;
  } finally {
    await page.waitForTimeout(2000); // 비디오 녹화를 위해 잠시 대기
    await browser.close();
  }
})();
