/**
 * Playwright로 블로그 글의 관련 포스트 표시 여부 확인
 * 사용법: node scripts/check-related-posts-with-playwright.js [slug]
 */

const { chromium } = require('playwright');

async function checkRelatedPosts(slug = 'golf-show-host-kang-seok-secret-weapon-model') {
  console.log(`🔍 블로그 글 관련 포스트 확인 시작: ${slug}\n`);
  console.log('='.repeat(80));
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 페이지 이동
    const url = `http://localhost:3000/blog/${slug}`;
    console.log(`📄 페이지 로드: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // 페이지 로드 대기
    await page.waitForTimeout(2000);
    
    // 관련 포스트 섹션 찾기
    console.log('\n🔍 관련 포스트 섹션 검색 중...\n');
    
    // 관련 포스트 섹션 존재 여부 확인
    const relatedSection = await page.locator('text=관련 게시물').first();
    const sectionExists = await relatedSection.count() > 0;
    
    if (sectionExists) {
      console.log('✅ "관련 게시물" 섹션 발견');
      
      // 관련 포스트 카드 개수 확인
      const relatedPosts = await page.locator('article').filter({ hasText: /관련 게시물|더 많은 인사이트/ }).locator('..').locator('article').all();
      const relatedPostCards = await page.locator('section:has-text("관련 게시물")').locator('article').all();
      
      console.log(`📊 관련 포스트 카드 개수: ${relatedPostCards.length}개`);
      
      if (relatedPostCards.length > 0) {
        console.log('\n📋 관련 포스트 목록:');
        for (let i = 0; i < relatedPostCards.length; i++) {
          const card = relatedPostCards[i];
          const title = await card.locator('h3').textContent().catch(() => '제목 없음');
          const category = await card.locator('span').first().textContent().catch(() => '카테고리 없음');
          console.log(`  ${i + 1}. [${category}] ${title}`);
        }
      } else {
        console.log('⚠️ 관련 포스트 카드가 없습니다.');
      }
    } else {
      console.log('❌ "관련 게시물" 섹션이 없습니다.');
      
      // API 응답 확인
      console.log('\n🔍 API 응답 확인 중...');
      const apiResponse = await page.evaluate(async (slug) => {
        const response = await fetch(`/api/blog/${slug}`);
        const data = await response.json();
        return data;
      }, slug);
      
      console.log(`API 응답 - 관련 포스트 개수: ${apiResponse.relatedPosts?.length || 0}개`);
      if (apiResponse.relatedPosts && apiResponse.relatedPosts.length > 0) {
        console.log('\n📋 API에서 반환된 관련 포스트:');
        apiResponse.relatedPosts.forEach((post, i) => {
          console.log(`  ${i + 1}. [${post.category}] ${post.title}`);
        });
        console.log('\n⚠️ API는 관련 포스트를 반환하지만, 화면에 표시되지 않습니다.');
      } else {
        console.log('⚠️ API도 관련 포스트를 반환하지 않습니다.');
      }
    }
    
    // 페이지 스크린샷
    await page.screenshot({ path: `screenshots/related-posts-${slug}-${Date.now()}.png`, fullPage: true });
    console.log('\n📸 스크린샷 저장 완료');
    
    // 콘솔 로그 확인
    console.log('\n🔍 브라우저 콘솔 로그 확인 중...');
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.text().includes('related') || msg.text().includes('관련')) {
        logs.push(`[${msg.type()}] ${msg.text()}`);
      }
    });
    
    await page.waitForTimeout(1000);
    
    if (logs.length > 0) {
      console.log('\n📋 관련 콘솔 로그:');
      logs.forEach(log => console.log(`  ${log}`));
    }
    
    // React 상태 확인
    console.log('\n🔍 React 상태 확인 중...');
    const reactState = await page.evaluate(() => {
      // window 객체에서 React 상태 확인 시도
      return {
        hasReact: typeof window !== 'undefined',
        location: window.location.href
      };
    });
    console.log(`React 상태: ${JSON.stringify(reactState, null, 2)}`);
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    console.log('\n' + '='.repeat(80));
    console.log('✅ 확인 완료');
    console.log('='.repeat(80));
    
    // 브라우저는 수동으로 닫도록 유지 (확인용)
    console.log('\n💡 브라우저를 확인한 후 수동으로 닫아주세요.');
    // await browser.close();
  }
}

// 스크립트 실행
if (require.main === module) {
  const slug = process.argv[2] || 'golf-show-host-kang-seok-secret-weapon-model';
  
  checkRelatedPosts(slug)
    .then(() => {
      console.log('\n✅ 스크립트 실행 완료');
    })
    .catch(error => {
      console.error('❌ 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { checkRelatedPosts };

