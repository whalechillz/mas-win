const { chromium } = require('playwright');

async function navigateToSEOSettings() {
  console.log('🔧 Wix SEO 설정 페이지로 이동...');
  
  try {
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    const context = browser.contexts()[0];
    const page = context.pages()[0];
    
    console.log(`📍 현재 페이지: ${page.url()}`);
    console.log(`📝 페이지 제목: ${await page.title()}`);
    
    // SEO 대시보드로 이동 버튼 클릭
    console.log('🎯 SEO 대시보드로 이동...');
    const seoButton = await page.locator('button:has-text("SEO 대시보드로 이동")');
    
    if (await seoButton.isVisible()) {
      await seoButton.click();
      await page.waitForTimeout(3000);
      console.log('✅ SEO 대시보드로 이동 완료!');
    } else {
      console.log('❌ SEO 대시보드 버튼을 찾을 수 없습니다.');
      
      // 직접 SEO 설정 URL로 이동
      console.log('🔗 직접 SEO 설정 URL로 이동...');
      const seoUrl = 'https://manage.wix.com/dashboard/9fd66b1e-f894-49ab-9e3a-b41aac392bd7/seo-home/seo-settings/blog-post';
      await page.goto(seoUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);
      console.log('✅ SEO 설정 페이지로 직접 이동 완료!');
    }
    
    console.log(`📍 이동 후 페이지: ${page.url()}`);
    console.log(`📝 이동 후 제목: ${await page.title()}`);
    
    // 페이지 스크린샷
    await page.screenshot({ path: 'mas9golf/wix-seo-settings-page.png', fullPage: true });
    console.log('📸 SEO 설정 페이지 스크린샷 저장: mas9golf/wix-seo-settings-page.png');
    
    // 블로그 게시물이 있는지 확인
    const blogPosts = await page.locator('tr[data-hook*="post"], .blog-post-row, [data-hook*="blog-post"]');
    const postCount = await blogPosts.count();
    console.log(`📊 발견된 블로그 게시물: ${postCount}개`);
    
    if (postCount > 0) {
      console.log('✅ 블로그 게시물 목록을 찾았습니다!');
      
      // 전체 선택 체크박스 찾기
      const selectAllCheckbox = await page.locator('thead input[type="checkbox"], [data-hook*="select-all"] input[type="checkbox"]');
      if (await selectAllCheckbox.isVisible()) {
        console.log('☑️ 전체 선택 체크박스 발견!');
        console.log('💡 이제 전체 선택을 클릭하고 일괄 편집을 진행할 수 있습니다.');
      } else {
        console.log('❌ 전체 선택 체크박스를 찾을 수 없습니다.');
      }
      
      // 일괄 편집 버튼 찾기
      const bulkEditButton = await page.locator('button:has-text("일괄 편집")').or(
        page.locator('button:has-text("Bulk Edit")').or(
          page.locator('button:has-text("편집")')
        )
      );
      
      if (await bulkEditButton.isVisible()) {
        console.log('📝 일괄 편집 버튼 발견!');
      } else {
        console.log('❌ 일괄 편집 버튼을 찾을 수 없습니다.');
      }
      
    } else {
      console.log('❌ 블로그 게시물을 찾을 수 없습니다.');
    }
    
    console.log('🎉 SEO 설정 페이지 이동 완료!');
    console.log('💡 이제 수동으로 전체 선택 → 일괄 편집을 진행하세요.');
    
  } catch (error) {
    console.error('❌ SEO 설정 페이지 이동 중 오류:', error.message);
  }
}

navigateToSEOSettings();
