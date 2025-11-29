/**
 * Playwright로 강석 글(ID 123)의 이미지 표시 확인
 */

require('dotenv').config({ path: require('path').join(process.cwd(), '.env.local') });
const { createClient } = require('@supabase/supabase-js');
const { chromium } = require('playwright');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkKangSeokPostWithPlaywright() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🔍 강석 글(ID 123) 정보 조회 중...\n');
    
    // 1. 강석 글 조회
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('id, title, slug, content')
      .eq('id', 123)
      .single();
    
    if (error || !post) {
      console.error('❌ 강석 글을 찾을 수 없습니다:', error);
      return;
    }
    
    console.log(`📝 글 제목: ${post.title}`);
    console.log(`📎 Slug: ${post.slug}`);
    console.log(`🌐 URL: http://localhost:3000/blog/${post.slug}\n`);
    
    // 2. content에서 이미지 URL 추출
    const imageUrls = [];
    if (post.content) {
      const markdownImgRegex = /!\[([^\]]*)\]\(([^)]+)\)/gi;
      let match;
      while ((match = markdownImgRegex.exec(post.content)) !== null) {
        const url = match[2].trim();
        const alt = match[1].trim();
        if (url && !imageUrls.find(img => img.url === url)) {
          imageUrls.push({ url, alt });
        }
      }
    }
    
    console.log(`📊 Content에 있는 이미지 URL: ${imageUrls.length}개\n`);
    imageUrls.forEach((img, idx) => {
      console.log(`${idx + 1}. [${img.alt}]`);
      console.log(`   ${img.url}`);
    });
    
    // 3. Playwright로 페이지 열기
    const blogUrl = `http://localhost:3000/blog/${post.slug}`;
    console.log(`\n🌐 블로그 페이지 열기: ${blogUrl}`);
    await page.goto(blogUrl, { waitUntil: 'networkidle' });
    
    // 4. 페이지 스크린샷
    await page.screenshot({ path: 'backup/kang-seok-post-screenshot.png', fullPage: true });
    console.log('📸 스크린샷 저장: backup/kang-seok-post-screenshot.png');
    
    // 5. 페이지의 모든 이미지 요소 찾기
    const images = await page.$$eval('img', (imgs) => {
      return imgs.map((img, idx) => ({
        index: idx + 1,
        src: img.src,
        alt: img.alt || '',
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        complete: img.complete,
        onerror: img.onerror ? 'error' : 'ok'
      }));
    });
    
    console.log(`\n📊 페이지에 표시된 이미지: ${images.length}개\n`);
    console.log('='.repeat(80));
    
    images.forEach((img, idx) => {
      console.log(`\n${idx + 1}. 이미지:`);
      console.log(`   Alt: ${img.alt || '(없음)'}`);
      console.log(`   Src: ${img.src.substring(0, 100)}...`);
      console.log(`   크기: ${img.naturalWidth}x${img.naturalHeight}`);
      console.log(`   로드 상태: ${img.complete ? '완료' : '로딩 중'}`);
      console.log(`   에러: ${img.onerror}`);
    });
    
    // 6. Content의 이미지 URL과 페이지의 이미지 비교
    console.log('\n\n📋 Content vs 페이지 이미지 비교:');
    console.log('='.repeat(80));
    
    imageUrls.forEach((contentImg, idx) => {
      const fileName = contentImg.url.split('/').pop();
      const foundInPage = images.find(pageImg => pageImg.src.includes(fileName));
      
      if (foundInPage) {
        console.log(`✅ ${idx + 1}. [${contentImg.alt}] - 페이지에 표시됨`);
        console.log(`   Content: ${contentImg.url}`);
        console.log(`   Page: ${foundInPage.src}`);
      } else {
        console.log(`❌ ${idx + 1}. [${contentImg.alt}] - 페이지에 표시 안 됨`);
        console.log(`   Content: ${contentImg.url}`);
      }
    });
    
    // 7. 콘솔 에러 확인
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // 8. 네트워크 에러 확인
    const networkErrors = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        networkErrors.push({
          url: response.url(),
          status: response.status()
        });
      }
    });
    
    // 잠시 대기하여 에러 수집
    await page.waitForTimeout(3000);
    
    if (consoleErrors.length > 0) {
      console.log('\n\n⚠️ 콘솔 에러:');
      console.log('='.repeat(80));
      consoleErrors.forEach((error, idx) => {
        console.log(`${idx + 1}. ${error}`);
      });
    }
    
    if (networkErrors.length > 0) {
      console.log('\n\n⚠️ 네트워크 에러:');
      console.log('='.repeat(80));
      networkErrors.forEach((error, idx) => {
        console.log(`${idx + 1}. ${error.status} - ${error.url}`);
      });
    }
    
    return {
      post,
      imageUrls,
      pageImages: images,
      consoleErrors,
      networkErrors
    };
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// 스크립트 실행
if (require.main === module) {
  checkKangSeokPostWithPlaywright()
    .then(() => {
      console.log('\n✅ 확인 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { checkKangSeokPostWithPlaywright };

