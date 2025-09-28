// 이미지 최적화 시스템 테스트 스크립트
const { chromium } = require('playwright');

async function testImageOptimization() {
  console.log('🚀 이미지 최적화 시스템 테스트 시작...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. 관리자 페이지로 이동
    console.log('📱 관리자 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/blog');
    await page.waitForLoadState('networkidle');
    
    // 2. 네이버 블로그 스크래퍼 섹션 찾기
    console.log('🔍 네이버 블로그 스크래퍼 섹션 찾기...');
    await page.waitForSelector('h2:has-text("네이버 블로그 스크래퍼")', { timeout: 10000 });
    
    // 3. 테스트용 네이버 블로그 URL 입력
    const testUrl = 'https://blog.naver.com/massgoogolf/223958579134';
    console.log('📝 테스트 URL 입력:', testUrl);
    
    const urlInput = await page.locator('input[placeholder*="네이버 블로그 URL"]').first();
    await urlInput.fill(testUrl);
    
    // 4. 스크래핑 시작
    console.log('🔄 스크래핑 시작...');
    const scrapeButton = await page.locator('button:has-text("스크래핑 시작")').first();
    await scrapeButton.click();
    
    // 5. 스크래핑 완료 대기
    console.log('⏳ 스크래핑 완료 대기...');
    await page.waitForSelector('text=스크래핑 완료', { timeout: 30000 });
    
    // 6. 게시물 생성 버튼 클릭
    console.log('📝 게시물 생성...');
    const createButton = await page.locator('button:has-text("게시물 생성")').first();
    await createButton.click();
    
    // 7. 게시물 생성 완료 대기
    console.log('⏳ 게시물 생성 완료 대기...');
    await page.waitForSelector('text=게시물이 성공적으로 생성되었습니다', { timeout: 30000 });
    
    // 8. 생성된 게시물로 이동
    console.log('🔗 생성된 게시물로 이동...');
    const viewButton = await page.locator('button:has-text("보기")').first();
    await viewButton.click();
    
    // 9. 이미지 갤러리 섹션 확인
    console.log('🖼️ 이미지 갤러리 섹션 확인...');
    await page.waitForSelector('text=스크래핑 이미지 및 대표 이미지 관리', { timeout: 10000 });
    
    // 10. "모든 이미지를 Supabase에 저장" 버튼 클릭
    console.log('💾 모든 이미지를 Supabase에 저장...');
    const saveAllButton = await page.locator('button:has-text("모든 이미지를 Supabase에 저장")').first();
    await saveAllButton.click();
    
    // 11. 저장 완료 메시지 대기
    console.log('⏳ 이미지 저장 완료 대기...');
    await page.waitForSelector('text=이미지가 Supabase에 성공적으로 저장되었습니다', { timeout: 60000 });
    
    console.log('✅ 이미지 최적화 테스트 완료!');
    
    // 12. 결과 확인
    console.log('📊 테스트 결과 확인...');
    
    // 터미널에서 로그 확인을 위해 잠시 대기
    await page.waitForTimeout(5000);
    
    console.log('🎉 모든 테스트가 성공적으로 완료되었습니다!');
    console.log('📋 확인 사항:');
    console.log('   - 다양한 크기 이미지 생성 (썸네일, 중간크기, WebP)');
    console.log('   - Supabase Storage에 자동 저장');
    console.log('   - 데이터베이스에 최적화된 URL 저장');
    console.log('   - AI 이미지 분석 (Google Vision)');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

// 테스트 실행
testImageOptimization().catch(console.error);
