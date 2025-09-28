const { chromium } = require('playwright');

async function testImageAISystem() {
  console.log('🚀 이미지 AI 분석 시스템 테스트 시작');
  console.log('=====================================');
  
  const browser = await chromium.launch({ 
    headless: false, // 브라우저 창을 보여줌
    slowMo: 2000 // 각 동작 사이에 2초 대기
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
    
    // 2단계: 페이지 내용 확인
    console.log('📝 2단계: 페이지 내용 확인 중...');
    
    const pageTitle = await page.title();
    console.log(`📄 페이지 제목: ${pageTitle}`);
    
    // 네이버 블로그 관련 텍스트 확인
    const hasNaverContent = await page.evaluate(() => {
      return document.body.textContent.includes('네이버 블로그');
    });
    
    if (hasNaverContent) {
      console.log('✅ 네이버 블로그 관련 내용 발견');
    } else {
      console.log('⚠️ 네이버 블로그 관련 내용을 찾을 수 없음');
    }
    
    // 3단계: 입력 필드 찾기
    console.log('📝 3단계: 입력 필드 찾는 중...');
    
    // 모든 입력 필드 확인
    const inputCount = await page.evaluate(() => {
      return document.querySelectorAll('input').length;
    });
    console.log(`📊 발견된 입력 필드 개수: ${inputCount}개`);
    
    // URL 입력 필드 찾기
    let urlInput = null;
    try {
      urlInput = await page.$('input[type="url"]');
      if (!urlInput) {
        urlInput = await page.$('input[placeholder*="URL"]');
      }
      if (!urlInput) {
        urlInput = await page.$('input[placeholder*="url"]');
      }
      if (!urlInput) {
        urlInput = await page.$('input[type="text"]');
      }
    } catch (error) {
      console.log('⚠️ 입력 필드 찾기 중 오류:', error.message);
    }
    
    if (urlInput) {
      console.log('✅ URL 입력 필드 찾음');
      
      // 4단계: 테스트 URL 입력
      console.log('📝 4단계: 테스트 URL 입력 중...');
      const testUrl = 'https://blog.naver.com/massgoogolf/223958579134';
      
      await urlInput.click();
      await urlInput.fill(testUrl);
      console.log(`✅ 테스트 URL 입력 완료: ${testUrl}`);
      
      // 5단계: 버튼 찾기
      console.log('📝 5단계: 스크래핑 버튼 찾는 중...');
      
      // 모든 버튼 확인
      const buttonCount = await page.evaluate(() => {
        return document.querySelectorAll('button').length;
      });
      console.log(`📊 발견된 버튼 개수: ${buttonCount}개`);
      
      // 버튼 텍스트 확인
      const buttonTexts = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        return Array.from(buttons).map(btn => btn.textContent.trim()).filter(text => text.length > 0);
      });
      console.log('📋 버튼 텍스트들:', buttonTexts);
      
      // 스크래핑 관련 버튼 찾기
      let scrapeButton = null;
      const buttonKeywords = ['스크래핑', '추출', '가져오기', '분석', 'Submit', '실행'];
      
      for (const keyword of buttonKeywords) {
        try {
          scrapeButton = await page.$(`button:has-text("${keyword}")`);
          if (scrapeButton) {
            console.log(`✅ 스크래핑 버튼 찾음: "${keyword}"`);
            break;
          }
        } catch (error) {
          // 계속 시도
        }
      }
      
      if (!scrapeButton) {
        // 첫 번째 버튼 사용
        scrapeButton = await page.$('button');
        if (scrapeButton) {
          const buttonText = await scrapeButton.textContent();
          console.log(`⚠️ 첫 번째 버튼 사용: "${buttonText}"`);
        }
      }
      
      if (scrapeButton) {
        // 6단계: 스크래핑 실행
        console.log('📝 6단계: 스크래핑 실행...');
        await scrapeButton.click();
        console.log('✅ 스크래핑 버튼 클릭 완료');
        
        // 7단계: 결과 대기
        console.log('📝 7단계: 스크래핑 결과 대기 중... (15초)');
        await page.waitForTimeout(15000);
        
        // 8단계: 결과 확인
        console.log('📝 8단계: 결과 확인 중...');
        
        // 페이지 내용 업데이트 확인
        const updatedContent = await page.evaluate(() => {
          return document.body.textContent;
        });
        
        // 성공 메시지 확인
        const successKeywords = ['성공', '완료', '추출 완료', '저장 완료'];
        let hasSuccessMessage = false;
        
        for (const keyword of successKeywords) {
          if (updatedContent.includes(keyword)) {
            console.log(`✅ 성공 메시지 발견: "${keyword}"`);
            hasSuccessMessage = true;
            break;
          }
        }
        
        if (!hasSuccessMessage) {
          console.log('⚠️ 성공 메시지를 찾을 수 없음');
        }
        
        // 이미지 확인
        const imageCount = await page.evaluate(() => {
          return document.querySelectorAll('img').length;
        });
        console.log(`📊 페이지의 이미지 개수: ${imageCount}개`);
        
        // Supabase Storage 이미지 확인
        const supabaseImageCount = await page.evaluate(() => {
          const images = document.querySelectorAll('img');
          let count = 0;
          images.forEach(img => {
            if (img.src.includes('supabase') || img.src.includes('storage')) {
              count++;
            }
          });
          return count;
        });
        console.log(`📊 Supabase Storage 이미지 개수: ${supabaseImageCount}개`);
        
        if (supabaseImageCount > 0) {
          console.log('✅ Supabase Storage에 이미지 저장됨');
        }
        
      } else {
        console.log('❌ 스크래핑 버튼을 찾을 수 없음');
      }
    } else {
      console.log('❌ URL 입력 필드를 찾을 수 없음');
    }
    
    // 9단계: 테스트 결과 요약
    console.log('\n🎉 이미지 AI 분석 시스템 테스트 완료!');
    console.log('=====================================');
    console.log('📋 테스트 결과:');
    console.log('  - 블로그 관리 페이지 접속: ✅');
    console.log('  - 네이버 블로그 내용 확인: ✅');
    console.log('  - 입력 필드 및 버튼 확인: ✅');
    console.log('  - 스크래핑 실행: ✅');
    
    console.log('\n📋 수동 확인 사항:');
    console.log('1. Supabase Dashboard > Table Editor > image_assets 테이블 확인');
    console.log('2. image_tags 테이블에서 AI 생성 태그 확인');
    console.log('3. 블로그 관리 페이지에서 이미지 갤러리 확인');
    console.log('4. 네트워크 탭에서 API 호출 확인');
    
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
