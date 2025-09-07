const { chromium } = require('playwright');

async function fixWixSEOManual() {
  console.log('🔧 Wix SEO 설정 수동 가이드...');
  
  try {
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    const context = browser.contexts()[0];
    const page = context.pages()[0];
    
    console.log(`📍 현재 페이지: ${page.url()}`);
    console.log(`📝 페이지 제목: ${await page.title()}`);
    
    // 페이지 새로고침
    console.log('🔄 페이지 새로고침...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // 현재 페이지 스크린샷
    console.log('📸 현재 페이지 스크린샷 저장...');
    await page.screenshot({ path: 'mas9golf/wix-seo-manual-guide.png', fullPage: true });
    
    // 페이지의 모든 체크박스와 버튼 정보 수집
    console.log('🔍 페이지 요소 분석...');
    
    const elements = await page.evaluate(() => {
      const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]')).map(cb => ({
        id: cb.id,
        className: cb.className,
        ariaLabel: cb.getAttribute('aria-label'),
        dataHook: cb.getAttribute('data-hook'),
        visible: cb.offsetParent !== null
      }));
      
      const buttons = Array.from(document.querySelectorAll('button')).map(btn => ({
        text: btn.textContent.trim(),
        className: btn.className,
        dataHook: btn.getAttribute('data-hook'),
        visible: btn.offsetParent !== null
      }));
      
      return { checkboxes, buttons };
    });
    
    console.log('📋 발견된 체크박스:');
    elements.checkboxes.forEach((cb, index) => {
      console.log(`  ${index + 1}. ID: ${cb.id}, Label: ${cb.ariaLabel}, Hook: ${cb.dataHook}, Visible: ${cb.visible}`);
    });
    
    console.log('📋 발견된 버튼:');
    elements.buttons.forEach((btn, index) => {
      if (btn.text && btn.visible) {
        console.log(`  ${index + 1}. "${btn.text}" (Hook: ${btn.dataHook})`);
      }
    });
    
    // 특정 체크박스 클릭 시도 (data-hook 사용)
    const bulkSelectionCheckbox = await page.locator('[data-hook="bulk-selection-cell"] input[type="checkbox"]');
    if (await bulkSelectionCheckbox.isVisible()) {
      console.log('☑️ 전체 선택 체크박스 클릭 시도...');
      try {
        await bulkSelectionCheckbox.click({ force: true });
        await page.waitForTimeout(2000);
        console.log('✅ 전체 선택 완료!');
      } catch (error) {
        console.log('❌ 체크박스 클릭 실패, 다른 방법 시도...');
        
        // JavaScript로 직접 클릭
        await page.evaluate(() => {
          const checkbox = document.querySelector('[data-hook="bulk-selection-cell"] input[type="checkbox"]');
          if (checkbox) {
            checkbox.click();
          }
        });
        await page.waitForTimeout(2000);
        console.log('✅ JavaScript로 전체 선택 완료!');
      }
    }
    
    // 일괄 편집 버튼 찾기 및 클릭
    const bulkEditButton = await page.locator('button:has-text("일괄 편집")').or(
      page.locator('button:has-text("Bulk Edit")')
    );
    
    if (await bulkEditButton.isVisible()) {
      console.log('📝 일괄 편집 버튼 클릭...');
      await bulkEditButton.click();
      await page.waitForTimeout(3000);
      console.log('✅ 일괄 편집 모드 진입!');
    } else {
      console.log('❌ 일괄 편집 버튼을 찾을 수 없습니다.');
      console.log('💡 수동으로 일괄 편집 버튼을 클릭해주세요.');
    }
    
    // 최종 스크린샷
    await page.screenshot({ path: 'mas9golf/wix-seo-final.png', fullPage: true });
    
    console.log('🎉 Wix SEO 설정 수정 준비 완료!');
    console.log('📸 스크린샷 저장됨:');
    console.log('  - mas9golf/wix-seo-manual-guide.png (초기 상태)');
    console.log('  - mas9golf/wix-seo-final.png (최종 상태)');
    
  } catch (error) {
    console.error('❌ SEO 설정 수정 중 오류:', error.message);
  }
}

fixWixSEOManual();
