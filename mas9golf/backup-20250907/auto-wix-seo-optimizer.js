const { chromium } = require('playwright');

// SEO 최적화된 영문 제목 및 슬러그 매핑
const seoOptimizedPosts = [
  {
    originalTitle: "새해 특별 혜택! 프리미엄 골프 드라이버와 액세서리 단 30분께만 증정!",
    englishTitle: "New Year Special Offer! Premium Golf Driver & Accessories for 30 People Only | MASGOLF High-Rebound Driver",
    englishSlug: "new-year-special-premium-golf-driver-accessories-30-people",
    metaDescription: "MASGOLF high-rebound driver special New Year offer. Premium golf driver and accessories for only 30 people. Distance up to 30m increase. Professional fitting service available now!"
  },
  {
    originalTitle: "MASGOLF – 초고반발 드라이버 피팅 전문 브랜드 | 비거리 최대 +25m 증가",
    englishTitle: "MASGOLF – High-Rebound Driver Fitting Professional Brand | Max +25m Distance | MASGOLF High-Rebound Driver",
    englishSlug: "masgolf-high-rebound-driver-fitting-professional-brand-25m-distance",
    metaDescription: "MASGOLF high-rebound driver professional fitting service. Maximum 25m distance increase with JFE·DAIDO titanium and NGS shaft. Professional fitting and custom manufacturing to improve your golf skills."
  },
  {
    originalTitle: "뜨거운 여름, 완벽한 스윙 로얄살루트 증정 행사",
    englishTitle: "Hot Summer Perfect Swing Royal Salute Golf Event | MASGOLF Golf Driver Professional",
    englishSlug: "hot-summer-perfect-swing-royal-salute-golf-event",
    metaDescription: "MASGOLF hot summer perfect swing Royal Salute gift event. Meet our golf driver. Professional fitting and custom manufacturing to improve your golf skills."
  },
  {
    originalTitle: "롱기스트 드라이버 찾는다면? MASGOLF(구.마쓰구골프) 고반발 드라이버로 인생 황금기를 완성하세요",
    englishTitle: "Looking for Longest Driver? Complete Your Golden Age with MASGOLF High-Rebound Driver | MASGOLF High-Rebound Driver Professional",
    englishSlug: "longest-driver-masgolf-high-rebound-golden-age-complete",
    metaDescription: "MASGOLF high-rebound driver for seniors. Japanese titanium and NGS shaft for average distance +25m. Experience your golden age now. Various benefits including limousine golf tour and golden hour events!"
  },
  {
    originalTitle: "시니어 골퍼의 인생 드라이버, 마쓰구 고반발로 골프가 즐거워진다! 라운딩 리얼후기",
    englishTitle: "Senior Golfer's Life Driver, MASGOLF High-Rebound Makes Golf Fun! Real Round Review | MASGOLF High-Rebound Driver Professional",
    englishSlug: "senior-golfer-life-driver-masgolf-high-rebound-golf-fun-review",
    metaDescription: "MASGOLF high-rebound driver for seniors. Check out the amazing performance of MASGOLF high-rebound driver through real reviews from senior golfers. Distance improvement, sound, and feel all rated highest!"
  }
];

async function autoOptimizeWixSeo() {
  let browser;
  try {
    console.log('🚀 Wix SEO 자동 최적화 시작...');
    
    browser = await chromium.connectOverCDP('http://localhost:9222');
    const page = await browser.newPage();

    // Wix 대시보드로 이동
    console.log('➡️ Wix 대시보드로 이동...');
    await page.goto('https://www.wix.com/dashboard', { waitUntil: 'networkidle', timeout: 60000 });

    // 블로그 게시물 페이지로 이동
    console.log('➡️ 블로그 게시물 페이지로 이동...');
    await page.goto('https://manage.wix.com/dashboard/9fd66b1e-f894-49ab-9e3a-b41aac392bd7/blog/posts', { waitUntil: 'networkidle', timeout: 60000 });

    // 각 게시물에 대해 SEO 최적화 수행
    for (let i = 0; i < seoOptimizedPosts.length; i++) {
      const post = seoOptimizedPosts[i];
      console.log(`\n📝 ${i + 1}/${seoOptimizedPosts.length} 게시물 처리 중: ${post.originalTitle.substring(0, 30)}...`);

      try {
        // 게시물 편집 버튼 클릭
        const editButton = page.locator(`text=${post.originalTitle.substring(0, 20)}`).locator('..').locator('button:has-text("편집")').first();
        await editButton.click();
        await page.waitForLoadState('networkidle');

        // SEO 설정 탭 클릭
        console.log('  🔍 SEO 설정 탭 클릭...');
        await page.click('[data-hook="seo-tab"]');
        await page.waitForLoadState('networkidle');

        // 기본 탭 클릭
        console.log('  📋 기본 탭 클릭...');
        await page.click('text=기본');
        await page.waitForTimeout(2000);

        // 제목 태그 수정
        console.log('  ✏️ 제목 태그 수정...');
        const titleTagInput = page.locator('input[placeholder*="제목"], input[data-hook*="title"]').first();
        await titleTagInput.clear();
        await titleTagInput.fill(post.englishTitle);

        // URL 슬러그 수정
        console.log('  🔗 URL 슬러그 수정...');
        const slugInput = page.locator('input[placeholder*="URL"], input[data-hook*="slug"]').first();
        await slugInput.clear();
        await slugInput.fill(post.englishSlug);

        // 메타 설명 수정
        console.log('  📄 메타 설명 수정...');
        const metaInput = page.locator('textarea[placeholder*="설명"], textarea[data-hook*="description"]').first();
        await metaInput.clear();
        await metaInput.fill(post.metaDescription);

        // 저장
        console.log('  💾 저장 중...');
        await page.click('button:has-text("저장"), button:has-text("게시")');
        await page.waitForLoadState('networkidle');

        console.log(`  ✅ ${post.originalTitle.substring(0, 30)}... SEO 최적화 완료!`);

        // 목록으로 돌아가기
        await page.goBack();
        await page.waitForLoadState('networkidle');

      } catch (error) {
        console.error(`  ❌ ${post.originalTitle.substring(0, 30)}... 처리 중 오류:`, error.message);
        // 오류 발생 시 목록으로 돌아가기
        try {
          await page.goBack();
          await page.waitForLoadState('networkidle');
        } catch (e) {
          // 무시
        }
      }
    }

    console.log('\n🎉 Wix SEO 자동 최적화 완료!');
    console.log('📊 처리된 게시물 수:', seoOptimizedPosts.length);

  } catch (error) {
    console.error('❌ Wix SEO 자동 최적화 중 오류 발생:', error);
  } finally {
    if (browser) {
      console.log('✨ 브라우저 연결 유지 (수동 확인 가능)');
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  autoOptimizeWixSeo()
    .then(() => {
      console.log('\n🚀 Wix SEO 최적화 작업 완료!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 작업 실패:', error);
      process.exit(1);
    });
}

module.exports = { autoOptimizeWixSeo };
