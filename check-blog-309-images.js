const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBlogImages() {
  try {
    console.log('🔍 블로그 게시물 ID 309의 이미지 확인 중...\n');
    
    // 1. 게시물 조회
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('id, title, featured_image, content')
      .eq('id', 309)
      .single();
    
    if (error || !post) {
      console.error('❌ 게시물을 찾을 수 없습니다:', error);
      return;
    }
    
    console.log(`📝 게시물: ${post.title}`);
    console.log(`📎 ID: ${post.id}\n`);
    
    // 2. 이미지 URL 추출
    const imageUrls = [];
    
    // featured_image
    if (post.featured_image) {
      imageUrls.push({
        url: post.featured_image,
        type: 'featured',
        source: 'featured_image'
      });
    }
    
    // content에서 이미지 URL 추출
    if (post.content) {
      // HTML img 태그
      const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
      let match;
      while ((match = imgRegex.exec(post.content)) !== null) {
        const url = match[1].trim();
        if (url && !imageUrls.find(img => img.url === url)) {
          imageUrls.push({
            url: url,
            type: 'content',
            source: 'content_html'
          });
        }
      }
      
      // 마크다운 이미지
      const markdownImgRegex = /!\[.*?\]\(([^)]+)\)/gi;
      while ((match = markdownImgRegex.exec(post.content)) !== null) {
        const url = match[1].trim();
        if (url && !imageUrls.find(img => img.url === url)) {
          imageUrls.push({
            url: url,
            type: 'content',
            source: 'content_markdown'
          });
        }
      }
    }
    
    console.log(`📊 추출된 이미지 URL: ${imageUrls.length}개\n`);
    
    // 3. 각 이미지 URL 확인
    const brokenImages = [];
    const workingImages = [];
    
    for (let i = 0; i < imageUrls.length; i++) {
      const img = imageUrls[i];
      console.log(`--- 이미지 ${i + 1}/${imageUrls.length} ---`);
      console.log(`  타입: ${img.type} (${img.source})`);
      console.log(`  URL: ${img.url.substring(0, 100)}${img.url.length > 100 ? '...' : ''}`);
      
      // 이미지 URL이 유효한지 확인
      try {
        const response = await fetch(img.url, { method: 'HEAD' });
        const status = response.status;
        const contentType = response.headers.get('content-type') || '';
        
        if (status === 200 && contentType.startsWith('image/')) {
          console.log(`  ✅ 정상 (${status}, ${contentType})`);
          workingImages.push(img);
        } else {
          console.log(`  ❌ 깨진 이미지! (${status}, ${contentType})`);
          brokenImages.push({
            ...img,
            status: status,
            contentType: contentType
          });
        }
      } catch (error) {
        console.log(`  ❌ 깨진 이미지! (오류: ${error.message})`);
        brokenImages.push({
          ...img,
          error: error.message
        });
      }
      
      console.log('');
    }
    
    // 4. 결과 요약
    console.log('='.repeat(60));
    console.log('📊 이미지 상태 요약');
    console.log('='.repeat(60));
    console.log(`전체 이미지: ${imageUrls.length}개`);
    console.log(`정상 이미지: ${workingImages.length}개`);
    console.log(`깨진 이미지: ${brokenImages.length}개\n`);
    
    if (brokenImages.length > 0) {
      console.log('❌ 깨진 이미지 목록:\n');
      brokenImages.forEach((img, index) => {
        console.log(`${index + 1}. ${img.type} (${img.source})`);
        console.log(`   URL: ${img.url}`);
        if (img.status) {
          console.log(`   상태: ${img.status}`);
        }
        if (img.error) {
          console.log(`   오류: ${img.error}`);
        }
        console.log('');
      });
    }
    
    // 5. Storage에서 이미지 확인
    console.log('\n🔍 Supabase Storage에서 이미지 확인 중...\n');
    
    for (const img of imageUrls) {
      // URL에서 경로 추출
      const urlMatch = img.url.match(/\/storage\/v1\/object\/public\/blog-images\/(.+)/);
      if (urlMatch) {
        const path = urlMatch[1];
        console.log(`경로: ${path}`);
        
        const { data, error } = await supabase.storage
          .from('blog-images')
          .list(path.split('/').slice(0, -1).join('/'), {
            search: path.split('/').pop()
          });
        
        if (error) {
          console.log(`  ❌ Storage 확인 실패: ${error.message}`);
        } else if (data && data.length > 0) {
          console.log(`  ✅ Storage에 존재함`);
        } else {
          console.log(`  ❌ Storage에 존재하지 않음`);
        }
      } else {
        console.log(`  ⚠️ Storage 경로를 추출할 수 없음`);
      }
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkBlogImages();

