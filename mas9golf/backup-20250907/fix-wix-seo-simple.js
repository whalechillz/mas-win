const { chromium } = require('playwright');

async function fixWixSEOSimple() {
  console.log('🔧 Wix SEO 설정 간단 수정 시작...');
  
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
    
    // 페이지 스크린샷 (현재 상태 확인)
    console.log('📸 현재 페이지 스크린샷 저장...');
    await page.screenshot({ path: 'mas9golf/wix-seo-current.png', fullPage: true });
    
    // 전체 선택 체크박스 찾기
    console.log('☑️ 전체 선택 체크박스 찾기...');
    
    // 다양한 선택자로 전체 선택 체크박스 찾기
    const selectAllSelectors = [
      'input[type="checkbox"][aria-label*="전체"]',
      'input[type="checkbox"][aria-label*="All"]',
      'input[type="checkbox"]:first-of-type',
      'thead input[type="checkbox"]',
      '.select-all input[type="checkbox"]'
    ];
    
    let selectAllCheckbox = null;
    for (const selector of selectAllSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible()) {
          selectAllCheckbox = element;
          console.log(`✅ 전체 선택 체크박스 발견: ${selector}`);
          break;
        }
      } catch (error) {
        // 계속 다음 선택자 시도
      }
    }
    
    if (selectAllCheckbox) {
      // 전체 선택
      console.log('☑️ 모든 블로그 게시물 선택...');
      await selectAllCheckbox.check();
      await page.waitForTimeout(2000);
      
      // 일괄 편집 버튼 찾기
      console.log('📝 일괄 편집 버튼 찾기...');
      const bulkEditSelectors = [
        'button:has-text("일괄 편집")',
        'button:has-text("Bulk Edit")',
        'button:has-text("편집")',
        'button:has-text("Edit")',
        '[data-testid*="bulk"]',
        '.bulk-edit-button'
      ];
      
      let bulkEditButton = null;
      for (const selector of bulkEditSelectors) {
        try {
          const element = await page.locator(selector).first();
          if (await element.isVisible()) {
            bulkEditButton = element;
            console.log(`✅ 일괄 편집 버튼 발견: ${selector}`);
            break;
          }
        } catch (error) {
          // 계속 다음 선택자 시도
        }
      }
      
      if (bulkEditButton) {
        console.log('📝 일괄 편집 모드 진입...');
        await bulkEditButton.click();
        await page.waitForTimeout(3000);
        
        // 수정 후 스크린샷
        await page.screenshot({ path: 'mas9golf/wix-seo-bulk-edit.png', fullPage: true });
        
        console.log('✅ 일괄 편집 모드 진입 완료!');
        console.log('📸 수정 후 스크린샷 저장: mas9golf/wix-seo-bulk-edit.png');
        
      } else {
        console.log('❌ 일괄 편집 버튼을 찾을 수 없습니다.');
        console.log('💡 수동으로 일괄 편집 버튼을 클릭해주세요.');
      }
      
    } else {
      console.log('❌ 전체 선택 체크박스를 찾을 수 없습니다.');
      console.log('💡 수동으로 전체 선택 체크박스를 클릭해주세요.');
    }
    
    console.log('🎉 Wix SEO 설정 수정 준비 완료!');
    console.log('📸 스크린샷 저장됨: mas9golf/wix-seo-current.png');
    
  } catch (error) {
    console.error('❌ SEO 설정 수정 중 오류:', error.message);
  }
}

fixWixSEOSimple();
