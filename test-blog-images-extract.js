// 블로그 포스트의 이미지 URL 추출 테스트 스크립트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testImageExtraction() {
  try {
    console.log('🔍 블로그 포스트 이미지 URL 추출 테스트 시작...\n');
    
    // ID 309 블로그 포스트 가져오기
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('id, title, slug, featured_image, content')
      .eq('id', 309)
      .single();
    
    if (error || !post) {
      console.error('❌ 블로그 포스트를 찾을 수 없음:', error);
      return;
    }
    
    console.log(`📝 블로그 포스트: ${post.title}`);
    console.log(`📝 슬러그: ${post.slug}\n`);
    
    // featured_image 확인
    if (post.featured_image) {
      console.log(`🖼️ 대표 이미지: ${post.featured_image.substring(0, 100)}...\n`);
    } else {
      console.log('⚠️ 대표 이미지 없음\n');
    }
    
    // content에서 이미지 URL 추출
    const imageUrls = [];
    
    // 1. HTML <img> 태그에서 추출
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let imgMatch;
    while ((imgMatch = imgRegex.exec(post.content)) !== null) {
      let url = imgMatch[1];
      url = url.replace(/%22/g, '').replace(/%27/g, '').split('?')[0].split('#')[0].trim();
      if (url && !url.startsWith('images/') && !imageUrls.includes(url)) {
        imageUrls.push(url);
        console.log(`📸 HTML 이미지: ${url.substring(0, 120)}...`);
      }
    }
    
    // 2. 마크다운 이미지 문법에서 추출
    const markdownImgRegex = /!\[[^\]]*\]\(([^)]+)\)/gi;
    let markdownMatch;
    while ((markdownMatch = markdownImgRegex.exec(post.content)) !== null) {
      let url = markdownMatch[1];
      url = url.replace(/%22/g, '').replace(/%27/g, '').split('?')[0].split('#')[0].trim();
      if (url && !url.startsWith('images/') && !imageUrls.includes(url)) {
        imageUrls.push(url);
        console.log(`📸 마크다운 이미지: ${url.substring(0, 120)}...`);
      }
    }
    
    // 3. 일반 URL 패턴 추출
    const urlPattern = /(https?:\/\/[^\s<>"']+\.(jpg|jpeg|png|gif|webp|svg))/gi;
    let urlMatch;
    while ((urlMatch = urlPattern.exec(post.content)) !== null) {
      let url = urlMatch[1];
      url = url.replace(/%22/g, '').replace(/%27/g, '').split('?')[0].split('#')[0];
      if (url && !imageUrls.includes(url) && !imageUrls.some(existing => url.includes(existing) || existing.includes(url))) {
        imageUrls.push(url);
        console.log(`📸 URL 패턴 이미지: ${url.substring(0, 120)}...`);
      }
    }
    
    console.log(`\n📊 총 추출된 이미지 URL: ${imageUrls.length}개`);
    console.log(`📊 대표 이미지 포함 시: ${post.featured_image ? imageUrls.length + 1 : imageUrls.length}개\n`);
    
    // 이미지 URL 상세 출력
    if (post.featured_image && !imageUrls.includes(post.featured_image)) {
      console.log(`1. [대표이미지] ${post.featured_image.substring(0, 120)}...`);
    }
    imageUrls.forEach((url, idx) => {
      const num = post.featured_image && !imageUrls.includes(post.featured_image) ? idx + 2 : idx + 1;
      console.log(`${num}. ${url.substring(0, 120)}...`);
    });
    
    // content에서 이미지 관련 부분 검색
    console.log('\n🔍 Content에서 이미지 관련 키워드 검색:');
    if (post.content.includes('golf-driver-male-massgoo-207')) {
      console.log('✅ "golf-driver-male-massgoo-207" 발견');
      // 해당 부분 주변 텍스트 추출
      const index = post.content.indexOf('golf-driver-male-massgoo-207');
      const snippet = post.content.substring(Math.max(0, index - 50), Math.min(post.content.length, index + 200));
      console.log(`   컨텍스트: ...${snippet}...`);
    } else {
      console.log('❌ "golf-driver-male-massgoo-207" 미발견');
    }
    
    // 전체 content 길이 확인
    console.log(`\n📏 Content 길이: ${post.content.length}자`);
    
  } catch (error) {
    console.error('❌ 테스트 오류:', error);
  }
}

testImageExtraction();

