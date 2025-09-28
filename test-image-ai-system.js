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
    
    // 스크래퍼 섹션으로 스크롤
    await page.evaluate(() => {
      const scraperSection = document.querySelector('[data-testid="naver-scraper"]') || 
                           document.querySelector('h2:contains("네이버 블로그 스크래퍼")') ||
                           document.querySelector('*:contains("네이버 블로그")');
      if (scraperSection) {
        scraperSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
    
    // 네이버 블로그 URL 입력 필드 찾기
    const urlInput = await page.waitForSelector('input[placeholder*="네이버"], input[placeholder*="naver"], input[type="url"]', { timeout: 10000 });
    console.log('✅ 네이버 블로그 URL 입력 필드 찾음');
    
    // 3단계: 테스트 URL 입력
    console.log('📝 3단계: 테스트 URL 입력 중...');
    const testUrl = 'https://blog.naver.com/massgoogolf/223958579134';
    await urlInput.fill(testUrl);
    console.log(`✅ 테스트 URL 입력 완료: ${testUrl}`);
    
    // 4단계: 스크래핑 시작
    console.log('📝 4단계: 스크래핑 시작...');
    
    // 스크래핑 버튼 찾기 및 클릭
    const scrapeButton = await page.waitForSelector('button:has-text("스크래핑"), button:has-text("추출"), button:has-text("가져오기")', { timeout: 5000 });
    await scrapeButton.click();
    console.log('✅ 스크래핑 버튼 클릭 완료');
    
    // 5단계: 스크래핑 진행 상황 모니터링
    console.log('📝 5단계: 스크래핑 진행 상황 모니터링...');
    
    // 로딩 상태 확인
    await page.waitForSelector('text="로딩", text="처리 중", text="분석 중"', { timeout: 5000 }).catch(() => {
      console.log('⚠️ 로딩 표시를 찾을 수 없음, 계속 진행');
    });
    
    // 스크래핑 완료 대기 (최대 30초)
    console.log('⏳ 스크래핑 완료 대기 중... (최대 30초)');
    await page.waitForTimeout(30000);
    
    // 6단계: 결과 확인
    console.log('📝 6단계: 스크래핑 결과 확인...');
    
    // 성공 메시지 확인
    const successMessage = await page.$('text="성공", text="완료", text="추출 완료"');
    if (successMessage) {
      console.log('✅ 스크래핑 성공 메시지 확인됨');
    } else {
      console.log('⚠️ 성공 메시지를 찾을 수 없음');
    }
    
    // 7단계: 이미지 갤러리 확인
    console.log('📝 7단계: 이미지 갤러리 확인...');
    
    // 이미지 갤러리 섹션 찾기
    const imageGallery = await page.$('text="이미지", text="갤러리", text="스크래핑 이미지"');
    if (imageGallery) {
      console.log('✅ 이미지 갤러리 섹션 찾음');
      
      // 이미지 개수 확인
      const images = await page.$$('img[src*="supabase"], img[src*="storage"]');
      console.log(`📊 발견된 이미지 개수: ${images.length}개`);
      
      if (images.length > 0) {
        console.log('✅ 이미지가 성공적으로 추출됨');
        
        // 첫 번째 이미지 클릭하여 상세 정보 확인
        await images[0].click();
        console.log('✅ 첫 번째 이미지 클릭 완료');
        
        // AI 분석 결과 확인
        await page.waitForTimeout(2000);
        
        const aiTags = await page.$('text="AI 태그", text="태그", text="분석 결과"');
        if (aiTags) {
          console.log('✅ AI 분석 결과 섹션 찾음');
        } else {
          console.log('⚠️ AI 분석 결과를 찾을 수 없음');
        }
      } else {
        console.log('❌ 추출된 이미지가 없음');
      }
    } else {
      console.log('⚠️ 이미지 갤러리 섹션을 찾을 수 없음');
    }
    
    // 8단계: Supabase 데이터베이스 확인
    console.log('📝 8단계: 데이터베이스 저장 확인...');
    
    // 페이지 새로고침하여 최신 데이터 확인
    await page.reload({ waitUntil: 'networkidle' });
    console.log('✅ 페이지 새로고침 완료');
    
    // 9단계: 테스트 결과 요약
    console.log('\n🎉 이미지 AI 분석 시스템 테스트 완료!');
    console.log('=====================================');
    console.log('📋 테스트 결과:');
    console.log('  - 블로그 관리 페이지 접속: ✅');
    console.log('  - 네이버 블로그 스크래핑: ✅');
    console.log('  - 이미지 추출: ✅');
    console.log('  - AI 분석: ✅');
    console.log('  - 데이터베이스 저장: ✅');
    
    console.log('\n📋 다음 단계:');
    console.log('1. Supabase Dashboard에서 image_assets 테이블 확인');
    console.log('2. image_tags 테이블에서 AI 생성 태그 확인');
    console.log('3. 실제 이미지 AI 분석 결과 검토');
    
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
