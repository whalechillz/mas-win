const { chromium } = require('playwright');

async function testBrandIntegration() {
  console.log('🎯 마쓰구 브랜드 통합 AI 시스템 테스트 시작...');
  
  const browser = await chromium.launch({ 
    headless: false,
    channel: 'chrome-canary'
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. 관리자 페이지 접속
    console.log('📝 관리자 페이지 접속 중...');
    await page.goto('http://localhost:3000/admin/blog');
    await page.waitForLoadState('networkidle');
    
    // 2. 새 게시물 작성 버튼 클릭
    console.log('➕ 새 게시물 작성 폼 열기...');
    await page.click('button:has-text("새 게시물 작성")');
    await page.waitForTimeout(1000);
    
    // 3. 제목 입력
    console.log('📝 테스트 제목 입력...');
    await page.fill('input[name="title"]', '초고반발 드라이버로 비거리 25m 증가하는 비밀');
    
    // 4. 브랜드 전략 설정
    console.log('🎯 브랜드 전략 설정...');
    
    // 콘텐츠 유형: 이벤트/프로모션
    await page.selectOption('select:has(option[value="event"])', 'event');
    
    // 오디언스 온도: 뜨거운 오디언스
    await page.selectOption('select:has(option[value="hot"])', 'hot');
    
    // 브랜드 강도: 높음
    await page.selectOption('select:has(option[value="high"])', 'high');
    
    // 지역 타겟: 수원
    await page.selectOption('select:has(option[value="suwon"])', 'suwon');
    
    // 오디언스 세그먼트: 중급자
    await page.selectOption('select:has(option[value="intermediate"])', 'intermediate');
    
    // 페인 포인트: 비거리 부족
    await page.selectOption('select:has(option[value="distance"])', 'distance');
    
    await page.waitForTimeout(1000);
    
    // 5. AI 요약 생성 테스트
    console.log('🤖 AI 요약 생성 테스트...');
    await page.click('button:has-text("🤖 AI 요약")');
    await page.waitForTimeout(3000);
    
    // 요약 필드 확인
    const excerptValue = await page.inputValue('textarea[name="excerpt"]');
    console.log('✅ 생성된 요약:', excerptValue);
    
    if (excerptValue && excerptValue.length > 0) {
      console.log('✅ AI 요약 생성 성공!');
      
      // 마쓰구 브랜드 키워드 포함 여부 확인
      const brandKeywords = ['MASGOLF', '마쓰구', '초고반발', '비거리', '수원', '광교'];
      const foundKeywords = brandKeywords.filter(keyword => 
        excerptValue.includes(keyword)
      );
      
      console.log('🎯 발견된 브랜드 키워드:', foundKeywords);
      console.log('📊 브랜드 키워드 포함률:', (foundKeywords.length / brandKeywords.length * 100).toFixed(1) + '%');
      
    } else {
      console.log('❌ AI 요약 생성 실패');
    }
    
    // 6. AI 본문 생성 테스트
    console.log('🤖 AI 본문 생성 테스트...');
    await page.click('button:has-text("🤖 AI 본문")');
    await page.waitForTimeout(5000);
    
    // 본문 필드 확인
    const contentValue = await page.inputValue('textarea[name="content"]');
    console.log('✅ 생성된 본문 길이:', contentValue ? contentValue.length : 0, '자');
    
    if (contentValue && contentValue.length > 100) {
      console.log('✅ AI 본문 생성 성공!');
      
      // 지역 정보 포함 여부 확인
      const localKeywords = ['수원', '광교', '갤러리아', '5분'];
      const foundLocalKeywords = localKeywords.filter(keyword => 
        contentValue.includes(keyword)
      );
      
      console.log('📍 발견된 지역 키워드:', foundLocalKeywords);
      console.log('📊 지역 키워드 포함률:', (foundLocalKeywords.length / localKeywords.length * 100).toFixed(1) + '%');
      
    } else {
      console.log('❌ AI 본문 생성 실패');
    }
    
    // 7. 다른 브랜드 전략으로 테스트
    console.log('🔄 다른 브랜드 전략으로 테스트...');
    
    // 콘텐츠 유형: 골프 정보
    await page.selectOption('select:has(option[value="information"])', 'information');
    
    // 브랜드 강도: 낮음
    await page.selectOption('select:has(option[value="low"])', 'low');
    
    // 지역 타겟: 용인
    await page.selectOption('select:has(option[value="yongin"])', 'yongin');
    
    await page.waitForTimeout(1000);
    
    // AI 메타 생성 테스트
    console.log('🤖 AI 메타 생성 테스트...');
    await page.click('button:has-text("🤖 AI 메타")');
    await page.waitForTimeout(3000);
    
    const metaValue = await page.inputValue('textarea[name="excerpt"]');
    console.log('✅ 생성된 메타 설명:', metaValue);
    
    if (metaValue && metaValue.length > 0) {
      console.log('✅ AI 메타 생성 성공!');
    } else {
      console.log('❌ AI 메타 생성 실패');
    }
    
    console.log('🎉 마쓰구 브랜드 통합 AI 시스템 테스트 완료!');
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

testBrandIntegration();
