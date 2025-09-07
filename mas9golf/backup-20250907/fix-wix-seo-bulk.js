const { chromium } = require('playwright');

async function fixWixSEOBulk() {
  console.log('🔧 Wix 블로그 게시물 SEO 설정 일괄 수정 시작...');
  
  try {
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    const context = browser.contexts()[0];
    const page = context.pages()[0] || await context.newPage();
    
    // 1. Wix SEO 설정 페이지로 이동
    console.log('📍 Wix SEO 설정 페이지로 이동...');
    await page.goto('https://manage.wix.com/dashboard/your-site-id/seo-settings/blog-post', { 
      waitUntil: 'networkidle', 
      timeout: 30000 
    });
    
    // 2. 페이지 로딩 대기
    await page.waitForTimeout(3000);
    
    // 3. 모든 게시물 선택 (전체 선택 체크박스)
    console.log('☑️ 모든 블로그 게시물 선택...');
    const selectAllCheckbox = await page.locator('input[type="checkbox"]').first();
    if (await selectAllCheckbox.isVisible()) {
      await selectAllCheckbox.check();
      console.log('✅ 전체 선택 완료');
    }
    
    // 4. 일괄 편집 버튼 클릭
    console.log('📝 일괄 편집 모드 진입...');
    const bulkEditButton = await page.locator('button:has-text("일괄 편집")').or(
      page.locator('button:has-text("Bulk Edit")')
    );
    if (await bulkEditButton.isVisible()) {
      await bulkEditButton.click();
      await page.waitForTimeout(2000);
    }
    
    // 5. URL 슬러그 일괄 수정
    console.log('🔗 URL 슬러그 영문 변환...');
    const urlSlugField = await page.locator('input[placeholder*="URL"]').or(
      page.locator('input[name*="slug"]')
    );
    if (await urlSlugField.isVisible()) {
      // 한글 슬러그를 영문으로 변환하는 로직
      await urlSlugField.fill('english-slug-pattern');
      console.log('✅ URL 슬러그 패턴 설정');
    }
    
    // 6. 메타 태그 일괄 설정
    console.log('🏷️ 메타 태그 일괄 설정...');
    
    // 제목 태그 설정
    const titleTagField = await page.locator('input[placeholder*="제목"]').or(
      page.locator('input[name*="title"]')
    );
    if (await titleTagField.isVisible()) {
      await titleTagField.fill('MASGOLF - 고반발 드라이버 전문 브랜드');
      console.log('✅ 제목 태그 설정');
    }
    
    // 메타 설명 설정
    const metaDescField = await page.locator('textarea[placeholder*="설명"]').or(
      page.locator('textarea[name*="description"]')
    );
    if (await metaDescField.isVisible()) {
      await metaDescField.fill('MASGOLF 고반발 드라이버로 비거리 최대 25m 증가. 시니어 골퍼를 위한 전문 피팅 서비스.');
      console.log('✅ 메타 설명 설정');
    }
    
    // 핵심 키워드 설정
    const keywordsField = await page.locator('input[placeholder*="키워드"]').or(
      page.locator('input[name*="keyword"]')
    );
    if (await keywordsField.isVisible()) {
      await keywordsField.fill('고반발 드라이버, 골프 드라이버, 비거리 증가, 시니어 골프, MASGOLF');
      console.log('✅ 핵심 키워드 설정');
    }
    
    // 7. 색인 생성 허용 설정
    console.log('🔍 검색 엔진 색인 설정...');
    const indexCheckbox = await page.locator('input[type="checkbox"][name*="index"]');
    if (await indexCheckbox.isVisible()) {
      await indexCheckbox.check();
      console.log('✅ 색인 생성 허용');
    }
    
    // 8. 변경사항 저장
    console.log('💾 변경사항 저장...');
    const saveButton = await page.locator('button:has-text("저장")').or(
      page.locator('button:has-text("Save")').or(
        page.locator('button:has-text("적용")')
      )
    );
    if (await saveButton.isVisible()) {
      await saveButton.click();
      await page.waitForTimeout(3000);
      console.log('✅ 저장 완료');
    }
    
    // 9. 결과 확인
    console.log('📊 수정 결과 확인...');
    const successMessage = await page.locator('.success-message, .alert-success').textContent();
    if (successMessage) {
      console.log(`✅ 성공 메시지: ${successMessage}`);
    }
    
    console.log('🎉 Wix SEO 설정 일괄 수정 완료!');
    
  } catch (error) {
    console.error('❌ SEO 설정 수정 중 오류:', error.message);
  }
}

// 개별 게시물 SEO 설정 수정 함수
async function fixIndividualPostSEO(page, postTitle, englishSlug) {
  try {
    console.log(`📝 개별 게시물 수정: ${postTitle}`);
    
    // 게시물 행 찾기
    const postRow = await page.locator(`tr:has-text("${postTitle}")`);
    if (!(await postRow.isVisible())) {
      console.log(`❌ 게시물을 찾을 수 없음: ${postTitle}`);
      return false;
    }
    
    // 편집 버튼 클릭
    const editButton = await postRow.locator('button:has-text("편집")').or(
      postRow.locator('button:has-text("Edit")')
    );
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(2000);
    }
    
    // URL 슬러그 수정
    const slugField = await page.locator('input[name*="slug"]');
    if (await slugField.isVisible()) {
      await slugField.fill(englishSlug);
    }
    
    // 저장
    const saveBtn = await page.locator('button:has-text("저장")');
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForTimeout(1000);
    }
    
    console.log(`✅ ${postTitle} 수정 완료`);
    return true;
    
  } catch (error) {
    console.error(`❌ ${postTitle} 수정 실패:`, error.message);
    return false;
  }
}

// 한글 제목을 영문 슬러그로 변환하는 함수
function convertToEnglishSlug(koreanTitle) {
  const slugMap = {
    '뜨거운 여름, 완벽한 스윙 로얄살루트 증정 행사': 'hot-summer-perfect-swing-royal-salute-event',
    '롱기스트 드라이버 찾는다면': 'longest-driver-finder',
    'MASGOLF - 초고반발 드라이버 피팅 전문 브랜드': 'masgolf-super-rebound-driver-fitting',
    '시니어 골퍼를 위한 드라이버': 'driver-for-senior-golfers',
    '고반발 드라이버 추천': 'high-rebound-driver-recommendation',
    '골프 비거리 증가': 'golf-distance-increase',
    '마쓰구 골프 후기': 'masgolf-review',
    '프리미엄 드라이버': 'premium-driver'
  };
  
  return slugMap[koreanTitle] || koreanTitle
    .toLowerCase()
    .replace(/[가-힣]/g, '') // 한글 제거
    .replace(/[^a-z0-9\s-]/g, '') // 특수문자 제거
    .replace(/\s+/g, '-') // 공백을 하이픈으로
    .replace(/-+/g, '-') // 연속 하이픈 제거
    .replace(/^-|-$/g, ''); // 앞뒤 하이픈 제거
}

// 메인 실행
fixWixSEOBulk().catch(console.error);
