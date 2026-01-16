/**
 * "대표로" 버튼 클릭 시 내용이 안 보이는 오류 재현 (간단 버전)
 * 브라우저를 열어두고 수동으로 로그인한 후 테스트 진행
 */

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // 콘솔 로그 캡처
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('getAllImages') || text.includes('handleSetMainImage') || text.includes('이미지')) {
      console.log(`[${msg.type()}] ${text}`);
    }
  });
  
  try {
    console.log('🚀 제품 합성 관리 페이지 접속');
    await page.goto('http://localhost:3000/admin/product-composition', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // 로그인 필요 여부 확인
    if (page.url().includes('/login')) {
      console.log('⚠️  로그인 필요. 브라우저에서 수동으로 로그인한 후 Enter를 누르세요...');
      await new Promise(resolve => {
        process.stdin.once('data', () => resolve());
      });
      await page.goto('http://localhost:3000/admin/product-composition', { waitUntil: 'networkidle' });
    }
    
    console.log('✅ 페이지 로드 완료');
    
    // 제품 목록 대기
    await page.waitForTimeout(2000);
    
    // 첫 번째 제품의 수정 버튼 찾기
    console.log('🔍 수정 버튼 찾는 중...');
    const editButton = page.locator('button:has-text("수정")').first();
    
    if (!(await editButton.isVisible({ timeout: 5000 }))) {
      await page.screenshot({ path: 'test-1-no-edit-button.png', fullPage: true });
      throw new Error('수정 버튼을 찾을 수 없습니다.');
    }
    
    // 클릭 전 상태 확인
    const stateBefore = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img[src*="supabase"]'));
      return {
        count: images.length,
        urls: images.map(img => img.src).slice(0, 5)
      };
    });
    console.log('📊 클릭 전 상태:', stateBefore);
    
    await editButton.click();
    console.log('✅ 수정 버튼 클릭');
    
    // 모달 대기
    await page.waitForTimeout(2000);
    
    // 이미지 그리드 찾기
    const imageGrid = page.locator('[class*="grid"]').filter({ has: page.locator('img') }).first();
    await imageGrid.waitFor({ timeout: 5000 });
    
    // 이미지 개수 확인 (before)
    const imagesBefore = await page.evaluate(() => {
      const grid = document.querySelector('[class*="grid"]');
      if (!grid) return { count: 0, items: [] };
      const items = Array.from(grid.children);
      return {
        count: items.length,
        items: items.map((item, idx) => ({
          index: idx,
          hasImage: !!item.querySelector('img'),
          hasMainButton: !!item.querySelector('button:has-text("대표로")'),
          text: item.textContent?.substring(0, 50) || ''
        }))
      };
    });
    console.log('📊 모달 내 이미지 (before):', imagesBefore);
    
    if (imagesBefore.count < 2) {
      console.log('⚠️  이미지가 2개 미만입니다. 테스트를 진행할 수 없습니다.');
      await page.screenshot({ path: 'test-2-insufficient-images.png', fullPage: true });
      return;
    }
    
    // 두 번째 이미지의 "대표로" 버튼 찾기
    const mainButtons = page.locator('button:has-text("대표로")');
    const buttonCount = await mainButtons.count();
    console.log(`🔍 "대표로" 버튼 개수: ${buttonCount}`);
    
    if (buttonCount === 0) {
      await page.screenshot({ path: 'test-3-no-main-buttons.png', fullPage: true });
      throw new Error('"대표로" 버튼을 찾을 수 없습니다.');
    }
    
    // 첫 번째 "대표로" 버튼 클릭 (두 번째 이미지)
    const secondMainButton = mainButtons.first();
    await page.screenshot({ path: 'test-4-before-click-main.png', fullPage: true });
    
    console.log('🖱️ "대표로" 버튼 클릭');
    await secondMainButton.click();
    
    // 상태 변경 대기
    await page.waitForTimeout(2000);
    
    // 이미지 개수 확인 (after)
    const imagesAfter = await page.evaluate(() => {
      const grid = document.querySelector('[class*="grid"]');
      if (!grid) return { count: 0, items: [] };
      const items = Array.from(grid.children);
      return {
        count: items.length,
        items: items.map((item, idx) => ({
          index: idx,
          hasImage: !!item.querySelector('img'),
          hasMainButton: !!item.querySelector('button:has-text("대표로")'),
          text: item.textContent?.substring(0, 50) || ''
        }))
      };
    });
    console.log('📊 모달 내 이미지 (after):', imagesAfter);
    
    await page.screenshot({ path: 'test-5-after-click-main.png', fullPage: true });
    
    // React 상태 확인 (가능한 경우)
    const reactState = await page.evaluate(() => {
      // getAllImages 함수 결과 시뮬레이션
      const form = document.querySelector('form');
      if (!form) return 'Form not found';
      
      // 이미지 URL 추출
      const images = Array.from(document.querySelectorAll('img[src*="supabase"]'));
      return {
        imageCount: images.length,
        imageUrls: images.map(img => img.src).slice(0, 3)
      };
    });
    console.log('📋 React 상태 (시뮬레이션):', reactState);
    
    // 결과 분석
    console.log('\n📊 결과 분석:');
    console.log(`  - 클릭 전 이미지 개수: ${imagesBefore.count}`);
    console.log(`  - 클릭 후 이미지 개수: ${imagesAfter.count}`);
    
    if (imagesAfter.count < imagesBefore.count) {
      console.log(`  ❌ 문제 발견: ${imagesBefore.count - imagesAfter.count}개 이미지가 사라졌습니다!`);
    } else if (imagesAfter.count === 0 && imagesBefore.count > 0) {
      console.log('  ❌ 심각한 문제: 모든 이미지가 사라졌습니다!');
    } else if (imagesAfter.count === imagesBefore.count) {
      console.log('  ✅ 이미지 개수는 유지되었습니다.');
      
      // 이미지가 실제로 렌더링되는지 확인
      const visibleImages = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img[src*="supabase"]'));
        return images.filter(img => {
          const rect = img.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        }).length;
      });
      console.log(`  - 실제 렌더링된 이미지: ${visibleImages}개`);
      
      if (visibleImages < imagesAfter.count) {
        console.log(`  ⚠️  렌더링 문제: ${imagesAfter.count - visibleImages}개 이미지가 보이지 않습니다.`);
      }
    }
    
    console.log('\n✅ 테스트 완료. 스크린샷을 확인하세요.');
    
    // 10초 대기 (결과 확인용)
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    await page.screenshot({ path: 'test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
