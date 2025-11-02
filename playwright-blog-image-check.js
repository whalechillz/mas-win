// Playwright 테스트: 실제 블로그 글의 이미지 확인 및 오류 파악
const { chromium } = require('playwright');

// 로컬 테스트 서버
const BASE_URL = 'http://localhost:3000';
const ADMIN_LOGIN_URL = `${BASE_URL}/admin/login`;
const ADMIN_BLOG_URL = `${BASE_URL}/admin/blog`;
const LOGIN_PHONE = '01066699000';
const LOGIN_PASSWORD = '66699000';

async function checkBlogImages() {
  console.log('🎭 실제 블로그 글 이미지 확인 시작...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. 로그인
    console.log('📝 1단계: 로그인...');
    await page.goto(ADMIN_LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);
    
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    const phoneInput = page.locator('input[type="tel"], input[name*="phone"], input[placeholder*="전화"], input[type="text"], input[placeholder*="아이디"]').first();
    await phoneInput.fill(LOGIN_PHONE);
    await page.waitForTimeout(1000);
    
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill(LOGIN_PASSWORD);
    await page.waitForTimeout(1000);
    
    const loginButton = page.locator('button:has-text("로그인"), button[type="submit"]').first();
    await loginButton.click();
    await page.waitForURL(/\/admin/, { timeout: 15000 });
    await page.waitForTimeout(3000);
    console.log('✅ 로그인 완료\n');
    
    // 2. 블로그 관리 페이지 이동
    console.log('📁 2단계: 블로그 관리 페이지 이동...');
    await page.goto(ADMIN_BLOG_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(5000);
    console.log('✅ 블로그 관리 페이지 로드 완료\n');
    
    // 3. 블로그 글 목록에서 이미지가 있는 글 찾기
    console.log('📋 3단계: 이미지가 있는 블로그 글 찾기...');
    
    // API를 통해 블로그 글 목록 가져오기
    const blogPostsResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/admin/blog/?sortBy=published_at&sortOrder=desc');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('블로그 글 목록 API 오류:', error);
        return null;
      }
    });
    
    if (!blogPostsResponse || !blogPostsResponse.posts || blogPostsResponse.posts.length === 0) {
      console.log('⚠️ 블로그 글 목록 API 사용 불가, DOM에서 직접 찾기...');
      
      // DOM에서 직접 찾기
      const posts = await page.locator('div.border.rounded, div[class*="border"][class*="rounded"], tr, article').all();
      console.log(`📊 DOM에서 찾은 블로그 글: ${posts.length}개`);
      
      // 첫 몇 개 글 확인
      for (let i = 0; i < Math.min(5, posts.length); i++) {
        const post = posts[i];
        const title = await post.locator('h3, h2, td, [class*="title"]').first().textContent().catch(() => '제목 없음');
        console.log(`  ${i + 1}. ${title}`);
        
        // 이미지 정렬 버튼이 있는지 확인
        const organizeButton = post.locator('button:has-text("이미지 정렬"), button:has-text("📁")').first();
        const hasOrganizeButton = await organizeButton.count() > 0;
        
        if (hasOrganizeButton) {
          console.log(`    ✅ 이미지 정렬 버튼 있음`);
          
          // 버튼 클릭해서 이미지 확인
          await organizeButton.scrollIntoViewIfNeeded();
          await page.waitForTimeout(1000);
          
          // 다이얼로그 처리
          page.once('dialog', async dialog => {
            console.log(`    📋 다이얼로그: ${dialog.message()}`);
            await dialog.accept();
          });
          
          await organizeButton.click();
          await page.waitForTimeout(5000);
          
          // API 응답 확인
          page.on('response', response => {
            if (response.url().includes('organize-images-by-blog')) {
              console.log(`    📡 API 응답: ${response.status()} ${response.url()}`);
              if (response.status() === 200) {
                response.json().then(data => {
                  console.log(`    📊 응답 데이터:`, JSON.stringify(data, null, 2));
                }).catch(() => {});
              }
            }
          });
        }
      }
      
      return;
    }
    
    // API로 블로그 글 확인
    const blogPosts = blogPostsResponse.posts || [];
    console.log(`📊 API로 찾은 블로그 글: ${blogPosts.length}개\n`);
    
    // featured_image나 content에 이미지가 있는 글 찾기
    const postsWithImages = blogPosts.filter(post => {
      const hasFeaturedImage = post.featured_image && post.featured_image.trim() !== '';
      const hasContentImages = post.content && (
        post.content.includes('<img') || 
        post.content.includes('![') ||
        post.content.includes('https://') || 
        post.content.includes('storage.googleapis.com') ||
        post.content.includes('supabase.co')
      );
      return hasFeaturedImage || hasContentImages;
    });
    
    console.log(`📸 이미지가 있는 블로그 글: ${postsWithImages.length}개\n`);
    
    // 첫 5개 글 상세 확인
    for (let i = 0; i < Math.min(5, postsWithImages.length); i++) {
      const post = postsWithImages[i];
      console.log(`\n📝 ${i + 1}. "${post.title}" (ID: ${post.id})`);
      
      // 이미지 URL 추출
      const imageUrls = [];
      
      // featured_image
      if (post.featured_image) {
        imageUrls.push({
          url: post.featured_image,
          type: 'featured',
          source: 'featured_image'
        });
        console.log(`   📸 Featured Image: ${post.featured_image}`);
      }
      
      // content에서 이미지 URL 추출
      if (post.content) {
        // HTML 이미지 태그
        const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
        let match;
        while ((match = imgRegex.exec(post.content)) !== null) {
          const url = match[1];
          if (url && !imageUrls.find(img => img.url === url)) {
            imageUrls.push({
              url: url,
              type: 'content',
              source: 'content_html'
            });
            console.log(`   📸 Content Image (HTML): ${url}`);
          }
        }
        
        // 마크다운 이미지
        const markdownImgRegex = /!\[.*?\]\(([^)]+)\)/gi;
        while ((match = markdownImgRegex.exec(post.content)) !== null) {
          const url = match[1];
          if (url && !imageUrls.find(img => img.url === url)) {
            imageUrls.push({
              url: url,
              type: 'content',
              source: 'content_markdown'
            });
            console.log(`   📸 Content Image (Markdown): ${url}`);
          }
        }
      }
      
      console.log(`   📊 총 이미지: ${imageUrls.length}개`);
      
      // 각 이미지 URL 확인
      for (const img of imageUrls) {
        try {
          // URL에서 파일명 추출
          const urlParts = img.url.split('/');
          const fileName = urlParts[urlParts.length - 1].split('?')[0];
          console.log(`      - 파일명: ${fileName}`);
          
          // 이미지 접근 가능 여부 확인
          const imageResponse = await page.evaluate(async (imageUrl) => {
            try {
              const response = await fetch(imageUrl, { method: 'HEAD' });
              return {
                status: response.status,
                ok: response.ok,
                contentType: response.headers.get('content-type')
              };
            } catch (error) {
              return {
                status: 'error',
                error: error.message
              };
            }
          }, img.url);
          
          if (imageResponse.status === 200 || imageResponse.ok) {
            console.log(`        ✅ 이미지 접근 가능 (${imageResponse.contentType || 'N/A'})`);
          } else {
            console.log(`        ❌ 이미지 접근 불가 (${imageResponse.status || imageResponse.error})`);
          }
        } catch (error) {
          console.log(`        ⚠️ 이미지 확인 오류: ${error.message}`);
        }
      }
      
      // 이미지 정렬 버튼 테스트
      console.log(`\n   🔧 이미지 정렬 버튼 테스트...`);
      
      // API 직접 호출
      try {
        const organizeResponse = await page.evaluate(async (postId) => {
          try {
            const response = await fetch(`/api/admin/organize-images-by-blog?blogPostId=${postId}`);
            const data = await response.json();
            return {
              status: response.status,
              ok: response.ok,
              data: data
            };
          } catch (error) {
            return {
              status: 'error',
              error: error.message
            };
          }
        }, post.id);
        
        if (organizeResponse.ok || organizeResponse.status === 200) {
          console.log(`      ✅ 이미지 정렬 API 성공`);
          if (organizeResponse.data) {
            // ✅ 개선: 응답 구조 올바르게 파싱
            const results = organizeResponse.data.results || [];
            if (results.length > 0) {
              const result = results[0];
              const totalImages = result.totalImages || 0;
              const foundImages = result.images?.length || 0;
              
              console.log(`         - 블로그 글 이미지: ${totalImages}개`);
              console.log(`         - Storage에서 찾은 이미지: ${foundImages}개`);
              
              if (foundImages > 0) {
                console.log(`         ✅ 성공! 이미지 예시:`);
                result.images.slice(0, 3).forEach((img, idx) => {
                  console.log(`            ${idx + 1}. ${img.name || img.currentPath}`);
                });
              } else {
                console.log(`         ⚠️ Storage에서 이미지를 찾지 못함`);
              }
            } else {
              console.log(`         ⚠️ 결과가 없습니다`);
            }
          }
        } else {
          console.log(`      ❌ 이미지 정렬 API 실패 (${organizeResponse.status || organizeResponse.error})`);
        }
      } catch (error) {
        console.log(`      ⚠️ 이미지 정렬 테스트 오류: ${error.message}`);
      }
      
      // 메타 동기화 버튼 테스트
      console.log(`\n   🔄 메타 동기화 버튼 테스트...`);
      
      try {
        const syncResponse = await page.evaluate(async (postId) => {
          try {
            const response = await fetch(`/api/admin/sync-metadata-by-blog`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ blogPostId: postId })
            });
            const data = await response.json();
            return {
              status: response.status,
              ok: response.ok,
              data: data
            };
          } catch (error) {
            return {
              status: 'error',
              error: error.message
            };
          }
        }, post.id);
        
        if (syncResponse.ok || syncResponse.status === 200) {
          console.log(`      ✅ 메타 동기화 API 성공`);
          if (syncResponse.data) {
            console.log(`         - 처리: ${syncResponse.data.processed || 0}개`);
            console.log(`         - 스킵: ${syncResponse.data.skipped || 0}개`);
            console.log(`         - 오류: ${syncResponse.data.errors?.length || 0}개`);
          }
        } else {
          console.log(`      ❌ 메타 동기화 API 실패 (${syncResponse.status || syncResponse.error})`);
        }
      } catch (error) {
        console.log(`      ⚠️ 메타 동기화 테스트 오류: ${error.message}`);
      }
      
      await page.waitForTimeout(2000);
    }
    
    console.log('\n✅ 이미지 확인 완료!');
    
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message);
    console.error('스택:', error.stack);
    
    await page.screenshot({ path: 'blog-image-check-error.png', fullPage: true });
    console.log('📸 에러 스크린샷 저장: blog-image-check-error.png');
    
    throw error;
  } finally {
    await browser.close();
  }
}

// 테스트 실행
checkBlogImages()
  .then(() => {
    console.log('\n🎉 모든 테스트 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 테스트 실패:', error);
    process.exit(1);
  });

