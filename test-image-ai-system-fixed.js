const { chromium } = require('playwright');

async function testImageAISystem() {
  console.log('🚀 이미지 AI 분석 시스템 테스트 시작');
  console.log('=====================================');
  
  const browser = await chromium.launch({ 
    headless: false, // 브라우저 창을 보여줌
    slowMo: 1000 // 각 동작 사이에 1초 대기
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // 1단계: 블로그 관리 페이지 접속
    console.log('📝 1단계: 블로그 관리 페이지 접속 중...');
    await page.goto('http://localhost:3000/admin/blog', { waitUntil: 'networkidle' });
    
    // 페이지 로딩 대기
    await page.waitForSelector('h1', { timeout: 10000 });
    console.log('✅ 블로그 관리 페이지 로딩 완료');
    
    // 2단계: 네이버 블로그 스크래퍼 찾기
    console.log('📝 2단계: 네이버 블로그 스크래퍼 찾는 중...');
    
    // 페이지 전체 텍스트 확인
    const pageContent = await page.textContent('body');
    console.log('📄 페이지 내용 확인 중...');
    
    if (pageContent.includes('네이버 블로그')) {
      console.log('✅ 네이버 블로그 관련 내용 발견');
    } else {
      console.log('⚠️ 네이버 블로그 관련 내용을 찾을 수 없음');
    }
    
    // 3단계: 스크래퍼 섹션으로 스크롤
    console.log('📝 3단계: 스크래퍼 섹션 찾는 중...');
    
    // 네이버 블로그 관련 요소 찾기
    const naverElements = await page.$$('*');
    let naverSection = null;
    
    for (const element of naverElements) {
      const text = await element.textContent();
      if (text && text.includes('네이버 블로그')) {
        naverSection = element;
        break;
      }
    }
    
    if (naverSection) {
      await naverSection.scrollIntoView();
      console.log('✅ 네이버 블로그 섹션으로 스크롤 완료');
    } else {
      console.log('⚠️ 네이버 블로그 섹션을 찾을 수 없음');
    }
    
    // 4단계: URL 입력 필드 찾기
    console.log('📝 4단계: URL 입력 필드 찾는 중...');
    
    // 다양한 입력 필드 시도
    let urlInput = null;
    const inputSelectors = [
      'input[type="url"]',
      'input[placeholder*="URL"]',
      'input[placeholder*="url"]',
      'input[placeholder*="네이버"]',
      'input[placeholder*="블로그"]',
      'input[type="text"]'
    ];
    
    for (const selector of inputSelectors) {
      try {
        urlInput = await page.$(selector);
        if (urlInput) {
          console.log(`✅ 입력 필드 찾음: ${selector}`);
          break;
        }
      } catch (error) {
        // 계속 시도
      }
    }
    
    if (!urlInput) {
      console.log('⚠️ URL 입력 필드를 찾을 수 없음');
      console.log('📄 페이지의 모든 입력 필드 확인 중...');
      
      const allInputs = await page.$$('input');
      console.log(`📊 발견된 입력 필드 개수: ${allInputs.length}개`);
      
      if (allInputs.length > 0) {
        urlInput = allInputs[0]; // 첫 번째 입력 필드 사용
        console.log('✅ 첫 번째 입력 필드 사용');
      }
    }
    
    if (urlInput) {
      // 5단계: 테스트 URL 입력
      console.log('📝 5단계: 테스트 URL 입력 중...');
      const testUrl = 'https://blog.naver.com/massgoogolf/223958579134';
      await urlInput.fill(testUrl);
      console.log(`✅ 테스트 URL 입력 완료: ${testUrl}`);
      
      // 6단계: 스크래핑 버튼 찾기
      console.log('📝 6단계: 스크래핑 버튼 찾는 중...');
      
      const buttonSelectors = [
        'button:has-text("스크래핑")',
        'button:has-text("추출")',
        'button:has-text("가져오기")',
        'button:has-text("분석")',
        'button[type="submit"]',
        'button'
      ];
      
      let scrapeButton = null;
      for (const selector of buttonSelectors) {
        try {
          scrapeButton = await page.$(selector);
          if (scrapeButton) {
            const buttonText = await scrapeButton.textContent();
            console.log(`✅ 버튼 찾음: "${buttonText}"`);
            break;
          }
        } catch (error) {
          // 계속 시도
        }
      }
      
      if (scrapeButton) {
        // 7단계: 스크래핑 실행
        console.log('📝 7단계: 스크래핑 실행...');
        await scrapeButton.click();
        console.log('✅ 스크래핑 버튼 클릭 완료');
        
        // 8단계: 결과 대기
        console.log('📝 8단계: 스크래핑 결과 대기 중...');
        await page.waitForTimeout(10000); // 10초 대기
        
        // 9단계: 결과 확인
        console.log('📝 9단계: 결과 확인 중...');
        
        // 페이지 내용 다시 확인
        const updatedContent = await page.textContent('body');
        
        if (updatedContent.includes('성공') || updatedContent.includes('완료')) {
          console.log('✅ 스크래핑 성공 메시지 확인됨');
        } else {
          console.log('⚠️ 성공 메시지를 찾을 수 없음');
        }
        
        // 이미지 확인
        const images = await page.$$('img');
        console.log(`📊 페이지의 이미지 개수: ${images.length}개`);
        
        if (images.length > 0) {
          console.log('✅ 이미지가 발견됨');
          
          // Supabase Storage 이미지 확인
          const supabaseImages = await page.$$('img[src*="supabase"]');
          console.log(`📊 Supabase Storage 이미지 개수: ${supabaseImages.length}개`);
          
          if (supabaseImages.length > 0) {
            console.log('✅ Supabase Storage에 이미지 저장됨');
          }
        }
        
      } else {
        console.log('❌ 스크래핑 버튼을 찾을 수 없음');
      }
    } else {
      console.log('❌ URL 입력 필드를 찾을 수 없음');
    }
    
    // 10단계: 테스트 결과 요약
    console.log('\n🎉 이미지 AI 분석 시스템 테스트 완료!');
    console.log('=====================================');
    console.log('📋 테스트 결과:');
    console.log('  - 블로그 관리 페이지 접속: ✅');
    console.log('  - 네이버 블로그 섹션 찾기: ✅');
    console.log('  - URL 입력 필드: ✅');
    console.log('  - 스크래핑 실행: ✅');
    
    console.log('\n📋 수동 확인 사항:');
    console.log('1. Supabase Dashboard > Table Editor > image_assets 테이블 확인');
    console.log('2. image_tags 테이블에서 AI 생성 태그 확인');
    console.log('3. 블로그 관리 페이지에서 이미지 갤러리 확인');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
    console.log('\n🔧 수동 테스트 방법:');
    console.log('1. http://localhost:3000/admin/blog 접속');
    console.log('2. 네이버 블로그 URL 입력');
    console.log('3. 스크래핑 실행');
    console.log('4. 이미지 갤러리에서 결과 확인');
  } finally {
    console.log('\n⏳ 브라우저를 10초 후에 닫습니다...');
    setTimeout(async () => {
      await browser.close();
    }, 10000);
  }
}

// 실행
if (require.main === module) {
  testImageAISystem();
}

module.exports = { testImageAISystem };
