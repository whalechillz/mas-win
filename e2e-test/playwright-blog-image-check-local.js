// Playwright 테스트: 로컬 서버에서 실제 블로그 글의 이미지 확인 및 오류 파악
const { chromium } = require('playwright');

// 로컬 테스트 서버
const BASE_URL = 'http://localhost:3000';
const ADMIN_LOGIN_URL = `${BASE_URL}/admin/login`;
const ADMIN_BLOG_URL = `${BASE_URL}/admin/blog`;
const LOGIN_PHONE = '01066699000';
const LOGIN_PASSWORD = '66699000';

async function checkBlogImages() {
  console.log('🎭 로컬 서버에서 실제 블로그 글 이미지 확인 시작...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. 로그인 (리다이렉션 처리)
    console.log('📝 1단계: 로그인...');
    
    // 로그인 페이지로 이동 (리다이렉션 무시)
    try {
      await page.goto(ADMIN_LOGIN_URL, { 
        waitUntil: 'domcontentloaded', 
        timeout: 15000 
      });
    } catch (error) {
      // 리다이렉션 루프 발생 시 현재 URL 확인
      const currentUrl = page.url();
      console.log(`⚠️ 리다이렉션 감지, 현재 URL: ${currentUrl}`);
      
      // 로그인 페이지가 아닌 경우 다시 시도
      if (!currentUrl.includes('/login')) {
        await page.goto(`${BASE_URL}/admin/login`, { 
          waitUntil: 'domcontentloaded', 
          timeout: 15000 
        });
      }
    }
    
    await page.waitForTimeout(3000);
    
    // 로그인 폼 요소 확인
    try {
      await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    } catch (error) {
      // 이미 로그인되어 있을 수 있음
      console.log('⚠️ 로그인 폼을 찾을 수 없습니다. 이미 로그인되어 있을 수 있습니다.');
      const currentUrl = page.url();
      console.log(`현재 URL: ${currentUrl}`);
      
      if (currentUrl.includes('/admin')) {
        console.log('✅ 이미 로그인된 상태로 보입니다.');
        // 이미 관리자 페이지에 있으므로 계속 진행
      } else {
        throw error;
      }
    }
    
    // 로그인 시도
    try {
      const phoneInput = page.locator('input[type="tel"], input[name*="phone"], input[placeholder*="전화"], input[type="text"], input[placeholder*="아이디"]').first();
      await phoneInput.fill(LOGIN_PHONE);
      await page.waitForTimeout(1000);
      
      const passwordInput = page.locator('input[type="password"]').first();
      await passwordInput.fill(LOGIN_PASSWORD);
      await page.waitForTimeout(1000);
      
      const loginButton = page.locator('button:has-text("로그인"), button[type="submit"]').first();
      await loginButton.click();
      await page.waitForTimeout(3000);
    } catch (error) {
      console.log('⚠️ 로그인 입력 오류, 이미 로그인되어 있을 수 있습니다.');
    }
    
    // 로그인 후 리다이렉트 대기
    try {
      await page.waitForURL(/\/admin/, { timeout: 10000 });
      console.log('✅ 로그인 완료\n');
    } catch (error) {
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        console.log('✅ 이미 관리자 페이지에 있습니다.\n');
      } else {
        console.log(`⚠️ 예상치 못한 URL: ${currentUrl}`);
      }
    }
    
    // 2. 블로그 관리 페이지 이동
    console.log('📁 2단계: 블로그 관리 페이지 이동...');
    
    try {
      await page.goto(ADMIN_BLOG_URL, { 
        waitUntil: 'domcontentloaded',
        timeout: 15000 
      });
    } catch (error) {
      // 리다이렉션 루프 발생 시 현재 URL 확인
      const currentUrl = page.url();
      console.log(`⚠️ 블로그 페이지 이동 중 리다이렉션 발생: ${currentUrl}`);
      
      // 현재 URL에서 직접 접근 시도
      if (!currentUrl.includes('/blog')) {
        await page.goto(`${BASE_URL}/admin/blog`, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });
      }
    }
    
    await page.waitForTimeout(5000);
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(5000);
    console.log('✅ 블로그 관리 페이지 로드 완료\n');
    
    // 3. API를 통해 블로그 글 목록 가져오기
    console.log('📋 3단계: 이미지가 있는 블로그 글 찾기...');
    
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
      throw new Error('블로그 글 목록을 가져올 수 없습니다.');
    }
    
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
    
    // 첫 3개 글 상세 확인
    for (let i = 0; i < Math.min(3, postsWithImages.length); i++) {
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
      
      // 이미지 정렬 버튼 테스트
      console.log(`\n   🔧 이미지 정렬 버튼 테스트 (로컬 API)...`);
      
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
          console.log(`      ✅ 이미지 정렬 API 성공 (로컬)`);
          if (organizeResponse.data) {
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
            }
          }
        } else {
          console.log(`      ❌ 이미지 정렬 API 실패 (${organizeResponse.status || organizeResponse.error})`);
        }
      } catch (error) {
        console.log(`      ⚠️ 이미지 정렬 테스트 오류: ${error.message}`);
      }
      
      await page.waitForTimeout(2000);
    }
    
    console.log('\n✅ 로컬 서버 이미지 확인 완료!');
    
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message);
    console.error('스택:', error.stack);
    
    await page.screenshot({ path: 'blog-image-check-local-error.png', fullPage: true });
    console.log('📸 에러 스크린샷 저장: blog-image-check-local-error.png');
    
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

