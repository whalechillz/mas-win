/**
 * 간단한 관련 포스트 확인 스크립트
 */

const { chromium } = require('playwright');

async function checkRelatedPosts() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3000/blog/golf-show-host-kang-seok-secret-weapon-model', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // 관련 포스트 섹션 확인
    const hasRelatedSection = await page.locator('text=관련 게시물').count() > 0;
    const relatedPostCount = await page.locator('section:has-text("관련 게시물")').locator('article').count();
    
    console.log('='.repeat(80));
    console.log('📊 관련 포스트 확인 결과');
    console.log('='.repeat(80));
    console.log(`관련 게시물 섹션 존재: ${hasRelatedSection ? '✅ 예' : '❌ 아니오'}`);
    console.log(`관련 포스트 개수: ${relatedPostCount}개`);
    
    if (relatedPostCount > 0) {
      console.log('\n✅ 관련 포스트가 정상적으로 표시됩니다!');
    } else {
      console.log('\n❌ 관련 포스트가 표시되지 않습니다.');
      
      // React 상태 확인
      const reactState = await page.evaluate(() => {
        // window.__NEXT_DATA__에서 확인
        return window.__NEXT_DATA__?.props?.pageProps || null;
      });
      
      if (reactState) {
        console.log('\n📋 Next.js Props:');
        console.log(`  post: ${reactState.post ? '있음' : '없음'}`);
        console.log(`  relatedPosts: ${reactState.relatedPosts?.length || 0}개`);
      }
    }
    
    await page.screenshot({ path: 'screenshots/related-posts-check.png', fullPage: true });
    console.log('\n📸 스크린샷 저장: screenshots/related-posts-check.png');
    
  } catch (error) {
    console.error('오류:', error.message);
  } finally {
    console.log('\n💡 브라우저를 확인한 후 수동으로 닫아주세요.');
    // await browser.close();
  }
}

checkRelatedPosts();

