const { chromium } = require('playwright');

async function testGalleryStatus() {
  let browser;
  try {
    console.log('🚀 갤러리 상태 확인 테스트 시작...');
    browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    // 1. 관리자 페이지 접속
    console.log('📝 1. 관리자 페이지 접속...');
    await page.goto('https://win.masgolf.co.kr/admin/blog');
    await page.waitForTimeout(3000);
    
    // 2. 첫 번째 게시물 수정 버튼 클릭
    console.log('🔍 2. 첫 번째 게시물 수정...');
    await page.click('button:has-text("수정")');
    await page.waitForTimeout(2000);
    
    // 3. 갤러리 열기
    console.log('🖼️ 3. 갤러리 열기...');
    await page.click('button:has-text("갤러리 닫기"), button:has-text("전체 이미지 보기")');
    await page.waitForTimeout(2000);
    
    // 4. 갤러리 이미지 개수 확인
    console.log('📊 4. 갤러리 이미지 개수 확인...');
    const galleryImages = await page.locator('.grid img').count();
    console.log(`✅ 갤러리 이미지 개수: ${galleryImages}개`);
    
    // 5. 대표 이미지 URL 확인
    console.log('🔗 5. 대표 이미지 URL 확인...');
    const featuredImageUrl = await page.inputValue('input[placeholder*="대표 이미지"]');
    console.log(`✅ 대표 이미지 URL: ${featuredImageUrl}`);
    
    // 6. Supabase URL인지 확인
    const isSupabaseUrl = featuredImageUrl.includes('supabase');
    console.log(`✅ Supabase URL 여부: ${isSupabaseUrl ? '예' : '아니오'}`);
    
    // 7. 갤러리에 대표 이미지가 있는지 확인
    if (galleryImages > 0) {
      console.log('✅ 갤러리에 이미지가 있습니다!');
      
      // 갤러리 이미지 URL들 확인
      const galleryImageUrls = [];
      for (let i = 0; i < galleryImages; i++) {
        const imgSrc = await page.locator('.grid img').nth(i).getAttribute('src');
        galleryImageUrls.push(imgSrc);
      }
      console.log('📋 갤러리 이미지 URL들:', galleryImageUrls);
      
      // 대표 이미지가 갤러리에 있는지 확인
      const featuredInGallery = galleryImageUrls.some(url => 
        url === featuredImageUrl || 
        (featuredImageUrl.includes('supabase') && url.includes('supabase'))
      );
      console.log(`✅ 대표 이미지가 갤러리에 있는지: ${featuredInGallery ? '예' : '아니오'}`);
    } else {
      console.log('❌ 갤러리가 비어있습니다.');
    }
    
    console.log('🎉 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testGalleryStatus();
