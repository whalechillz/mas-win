// 실제 블로그 게시물의 이미지 URL 확인 및 Storage 상태 체크
require('dotenv').config({ path: '.env.local' });
const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '설정됨' : '없음');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '설정됨' : '없음');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testBlogImageUrls() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🔍 블로그 게시물 이미지 URL 확인 중...');
    
    // 1. 블로그 게시물 데이터베이스에서 이미지 URL 확인
    const { data: blogPost, error } = await supabase
      .from('blog_posts')
      .select('id, title, slug, featured_image, content')
      .eq('id', 309)
      .single();
    
    if (error || !blogPost) {
      console.error('❌ 블로그 글을 찾을 수 없습니다:', error);
      return;
    }
    
    console.log(`\n📝 블로그 글: ${blogPost.title}`);
    console.log(`📎 Slug: ${blogPost.slug}`);
    
    // 2. featured_image 확인
    if (blogPost.featured_image) {
      console.log(`\n🖼️ 대표 이미지: ${blogPost.featured_image.substring(0, 100)}...`);
    }
    
    // 3. content에서 이미지 URL 추출
    const imageUrls = [];
    if (blogPost.content) {
      // HTML img 태그
      const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
      const matches = blogPost.content.matchAll(imgRegex);
      for (const match of matches) {
        const url = match[1];
        if (url && !imageUrls.includes(url)) {
          imageUrls.push(url);
        }
      }
      
      // 마크다운 이미지
      const markdownImgRegex = /!\[.*?\]\(([^)]+)\)/gi;
      const markdownMatches = blogPost.content.matchAll(markdownImgRegex);
      for (const match of markdownMatches) {
        const url = match[1];
        if (url && !imageUrls.includes(url)) {
          imageUrls.push(url);
        }
      }
    }
    
    console.log(`\n📊 추출된 이미지 URL: ${imageUrls.length}개`);
    imageUrls.forEach((url, idx) => {
      console.log(`  ${idx + 1}. ${url.substring(0, 100)}...`);
    });
    
    // 4. Storage에서 이미지 찾기
    console.log(`\n🔍 Storage에서 이미지 확인 중...`);
    const storageCheckResults = [];
    
    for (const url of imageUrls) {
      // URL에서 경로 추출
      let imagePath = null;
      if (url.includes('/storage/v1/object/public/blog-images/')) {
        const urlMatch = url.match(/\/blog-images\/(.+)$/);
        if (urlMatch) {
          imagePath = urlMatch[1].split('?')[0];
        }
      }
      
      // 파일명만 추출
      const fileName = imagePath ? imagePath.split('/').pop() : url.split('/').pop().split('?')[0];
      
      let found = false;
      let storagePath = null;
      
      // 경로로 확인
      if (imagePath) {
        const { data: urlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(imagePath);
        
        try {
          const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
          if (response.ok) {
            found = true;
            storagePath = imagePath;
          }
        } catch (e) {
          // HEAD 요청 실패
        }
      }
      
      // 파일명으로 검색
      if (!found) {
        try {
          const { data: files, error } = await supabase.storage
            .from('blog-images')
            .list('', { limit: 1000, search: fileName });
          
          if (!error && files && files.length > 0) {
            for (const file of files) {
              if (file.id && file.name.toLowerCase() === fileName.toLowerCase()) {
                found = true;
                storagePath = file.name;
                break;
              }
            }
          }
        } catch (e) {
          console.error(`검색 오류 (${fileName}):`, e.message);
        }
      }
      
      storageCheckResults.push({
        url,
        fileName,
        imagePath,
        found,
        storagePath
      });
      
      console.log(`  ${found ? '✅' : '❌'} ${fileName}: ${found ? storagePath : '찾을 수 없음'}`);
    }
    
    // 5. originals/blog/2025-09 폴더 확인
    console.log(`\n📁 originals/blog/2025-09 폴더 확인 중...`);
    const { data: folderFiles, error: folderError } = await supabase.storage
      .from('blog-images')
      .list('originals/blog/2025-09', { limit: 100 });
    
    if (folderError) {
      console.error(`❌ 폴더 조회 오류:`, folderError);
    } else {
      const imageFiles = folderFiles?.filter(f => f.id) || [];
      console.log(`📊 폴더 내 이미지: ${imageFiles.length}개`);
      imageFiles.forEach((file, idx) => {
        console.log(`  ${idx + 1}. ${file.name}`);
      });
    }
    
    // 6. 실제 블로그 페이지 접속하여 이미지 확인
    console.log(`\n🌐 실제 블로그 페이지 확인 중...`);
    await page.goto(`https://www.masgolf.co.kr/blog/${blogPost.slug}`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(3000);
    
    // 페이지의 이미지 요소 확인
    const images = await page.$$eval('img', imgs => 
      imgs.map(img => ({
        src: img.src,
        alt: img.alt,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        complete: img.complete
      }))
    );
    
    console.log(`\n📊 페이지의 이미지 요소: ${images.length}개`);
    images.forEach((img, idx) => {
      const status = img.complete && img.naturalWidth > 0 ? '✅ 로드됨' : '❌ 로드 실패';
      console.log(`  ${idx + 1}. ${status}: ${img.src.substring(0, 80)}...`);
      if (!img.complete || img.naturalWidth === 0) {
        console.log(`     ⚠️ 완전히 로드되지 않음 (width: ${img.naturalWidth}, height: ${img.naturalHeight})`);
      }
    });
    
    // 스크린샷 저장
    await page.screenshot({ path: 'test-blog-page-images.png', fullPage: true });
    console.log(`\n📸 스크린샷 저장: test-blog-page-images.png`);
    
    // 결과 요약
    console.log(`\n📊 결과 요약:`);
    console.log(`  - 데이터베이스 이미지 URL: ${imageUrls.length}개`);
    console.log(`  - Storage에서 찾음: ${storageCheckResults.filter(r => r.found).length}개`);
    console.log(`  - Storage에서 못 찾음: ${storageCheckResults.filter(r => !r.found).length}개`);
    console.log(`  - originals/blog/2025-09 폴더 이미지: ${folderFiles?.filter(f => f.id).length || 0}개`);
    console.log(`  - 페이지 이미지 요소: ${images.length}개`);
    console.log(`  - 페이지에서 로드 성공: ${images.filter(img => img.complete && img.naturalWidth > 0).length}개`);
    console.log(`  - 페이지에서 로드 실패: ${images.filter(img => !img.complete || img.naturalWidth === 0).length}개`);
    
  } catch (error) {
    console.error('❌ 테스트 오류:', error);
  } finally {
    await browser.close();
  }
}

testBlogImageUrls();

