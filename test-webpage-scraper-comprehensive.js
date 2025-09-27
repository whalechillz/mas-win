const { chromium } = require('playwright');

async function testWebpageScraper() {
  console.log('🚀 웹페이지 이미지 스크래퍼 종합 테스트 시작...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. 관리자 페이지로 이동
    console.log('📝 관리자 페이지로 이동...');
    await page.goto('http://localhost:3000/admin/blog');
    await page.waitForLoadState('networkidle');
    
    // 2. 새 게시물 작성 탭 클릭 (이미지 갤러리가 보이도록)
    console.log('✍️ 새 게시물 작성 탭 클릭...');
    await page.click('button:has-text("✍️ 새 게시물 작성")');
    await page.waitForTimeout(2000);
    
    // 3. 이미지 갤러리 섹션 찾기
    console.log('🖼️ 이미지 갤러리 섹션 확인...');
    const imageGallerySection = page.locator('text=🖼️ 이미지 갤러리').first();
    await imageGallerySection.waitFor({ timeout: 10000 });
    
    // 4. 전체 이미지 보기 버튼 클릭
    console.log('👁️ 전체 이미지 보기 버튼 클릭...');
    await page.click('button:has-text("👁️ 전체 이미지 보기")');
    await page.waitForTimeout(2000);
    
    // 5. 웹페이지 이미지 수집 버튼 찾기 및 클릭
    console.log('🌐 웹페이지 이미지 수집 버튼 찾기...');
    const scraperButton = page.locator('button:has-text("🌐 웹페이지 이미지 수집")');
    await scraperButton.waitFor({ timeout: 10000 });
    await scraperButton.click();
    await page.waitForTimeout(2000);
    
    // 6. 테스트할 URL들
    const testUrls = [
      {
        name: '네이버 블로그 (실패 예상)',
        url: 'https://blog.naver.com/massgoogolf/223958579134',
        expectedResult: 'fail'
      },
      {
        name: '골프 디스틸러리 (실패 예상)',
        url: 'https://www.golfdistillery.com/swing-tips/setup-address/ball-position/',
        expectedResult: 'fail'
      },
      {
        name: '네이버 뉴스 (성공 예상)',
        url: 'https://n.news.naver.com/article/050/0000096697',
        expectedResult: 'success'
      }
    ];
    
    for (const testCase of testUrls) {
      console.log(`\n🔍 테스트: ${testCase.name}`);
      console.log(`📄 URL: ${testCase.url}`);
      
      // URL 입력 필드 찾기 (웹페이지 스크래퍼 섹션 내의 것)
      const urlInput = page.locator('div:has-text("🌐 웹페이지 이미지 수집") input[type="url"]').first();
      await urlInput.fill(testCase.url);
      
      // 스크래핑 시작 버튼 클릭
      console.log('▶️ 스크래핑 시작...');
      await page.click('button:has-text("🔍 이미지 수집 시작")');
      
      // 결과 대기 (최대 30초)
      console.log('⏳ 결과 대기 중...');
      await page.waitForTimeout(5000);
      
      // 결과 확인
      const successMessage = page.locator('text=개의 이미지를 발견했습니다').first();
      const errorMessage = page.locator('text=오류가 발생').first();
      
      try {
        // 성공 메시지 확인 (5초 대기)
        await successMessage.waitFor({ timeout: 5000 });
        const messageText = await successMessage.textContent();
        console.log(`✅ 성공: ${messageText}`);
        
        // 이미지 목록 확인
        const imageItems = page.locator('div:has-text("🌐 웹페이지 이미지 수집") .grid .border').count();
        const imageCount = await imageItems;
        console.log(`🖼️ 발견된 이미지 수: ${imageCount}개`);
        
        if (testCase.expectedResult === 'success') {
          console.log('✅ 예상 결과와 일치: 성공');
        } else {
          console.log('⚠️ 예상과 다름: 실패 예상이었지만 성공');
        }
        
      } catch (error) {
        // 에러 메시지 확인
        try {
          await errorMessage.waitFor({ timeout: 2000 });
          const errorText = await errorMessage.textContent();
          console.log(`❌ 실패: ${errorText}`);
          
          if (testCase.expectedResult === 'fail') {
            console.log('✅ 예상 결과와 일치: 실패');
          } else {
            console.log('⚠️ 예상과 다름: 성공 예상이었지만 실패');
          }
        } catch (error2) {
          console.log('❓ 결과를 확인할 수 없음');
        }
      }
      
      // 다음 테스트를 위해 URL 필드 클리어
      await urlInput.clear();
      await page.waitForTimeout(1000);
    }
    
    console.log('\n🎉 종합 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

testWebpageScraper().catch(console.error);
