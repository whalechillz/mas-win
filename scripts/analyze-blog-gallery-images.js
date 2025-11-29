/**
 * 블로그 글과 갤러리 이미지 비교 분석
 * 사용법: node scripts/analyze-blog-gallery-images.js <blogPostId>
 */

require('dotenv').config({ path: require('path').join(process.cwd(), '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeBlogGalleryImages(blogPostId) {
  console.log(`🔍 블로그 글(ID: ${blogPostId}) 이미지 분석 시작...\n`);
  console.log('='.repeat(80));
  
  // 1. 블로그 글 조회
  const { data: post, error: postError } = await supabase
    .from('blog_posts')
    .select('id, title, featured_image, content, published_at')
    .eq('id', blogPostId)
    .single();
  
  if (postError || !post) {
    console.error('❌ 블로그 글을 찾을 수 없습니다:', postError);
    return;
  }
  
  console.log(`📝 블로그 글: ${post.title}`);
  console.log(`📎 ID: ${post.id}\n`);
  
  // 2. 블로그 글의 이미지 URL 추출
  const blogImages = [];
  
  // featured_image
  if (post.featured_image) {
    blogImages.push({
      url: post.featured_image,
      type: 'featured',
      source: 'featured_image',
      alt: '대표 이미지'
    });
  }
  
  // content에서 이미지 추출
  if (post.content) {
    // 마크다운 이미지: ![alt](url)
    const markdownRegex = /!\[([^\]]*)\]\(([^)]+)\)/gi;
    let match;
    let index = 0;
    while ((match = markdownRegex.exec(post.content)) !== null) {
      const alt = match[1].trim();
      const url = match[2].trim();
      blogImages.push({
        url,
        alt,
        type: 'content',
        source: 'content_markdown',
        index: index++
      });
    }
    
    // HTML 이미지: <img src="url">
    const htmlRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    while ((match = htmlRegex.exec(post.content)) !== null) {
      const url = match[1].trim();
      blogImages.push({
        url,
        alt: '',
        type: 'content',
        source: 'content_html',
        index: index++
      });
    }
  }
  
  console.log(`📊 블로그 글의 이미지: ${blogImages.length}개\n`);
  
  // 3. 고유 이미지 URL 추출
  const uniqueUrls = [...new Set(blogImages.map(img => img.url))];
  console.log(`📊 고유 이미지 URL: ${uniqueUrls.length}개\n`);
  
  // 4. 갤러리 폴더 확인 (originals/blog/YYYY-MM/{blogPostId})
  let galleryFolder = '';
  if (post.published_at) {
    const publishedAt = new Date(post.published_at);
    const yearMonth = publishedAt.toISOString().substring(0, 7); // YYYY-MM
    galleryFolder = `originals/blog/${yearMonth}/${blogPostId}`;
  } else {
    // published_at이 없으면 현재 날짜 기준으로 추정
    galleryFolder = `originals/blog/2015-08/${blogPostId}`;
  }
  
  console.log(`📁 갤러리 폴더: ${galleryFolder}\n`);
  
  const { data: galleryFiles, error: galleryError } = await supabase.storage
    .from('blog-images')
    .list(galleryFolder, { limit: 100 });
  
  let galleryImages = [];
  
  if (galleryError) {
    console.error('⚠️ 갤러리 폴더를 찾을 수 없습니다:', galleryError.message);
  } else {
    galleryImages = galleryFiles
      .filter(f => f.id) // 파일만 (폴더 제외)
      .map(f => {
        const { data: urlData } = supabase.storage
          .from('blog-images')
          .getPublicUrl(`${galleryFolder}/${f.name}`);
        return {
          name: f.name,
          url: urlData.publicUrl,
          size: f.metadata?.size || 0
        };
      });
    
    console.log(`📊 갤러리 이미지: ${galleryImages.length}개\n`);
  }
  
  // 5. 비교 분석
  console.log('='.repeat(80));
  console.log('📊 비교 분석 결과:');
  console.log('='.repeat(80));
  console.log(`블로그 글 이미지: ${blogImages.length}개`);
  console.log(`고유 이미지 URL: ${uniqueUrls.length}개`);
  console.log(`갤러리 이미지: ${galleryImages.length}개\n`);
  
  // 블로그에만 있는 이미지
  const blogOnlyUrls = uniqueUrls.filter(url => 
    !galleryImages.some(g => g.url === url)
  );
  
  // 갤러리에만 있는 이미지
  const galleryOnlyUrls = galleryImages
    .map(g => g.url)
    .filter(url => !uniqueUrls.includes(url));
  
  // 중복 이미지 URL (블로그 글 내)
  const urlCounts = {};
  blogImages.forEach(img => {
    urlCounts[img.url] = (urlCounts[img.url] || 0) + 1;
  });
  const duplicateUrls = Object.entries(urlCounts)
    .filter(([url, count]) => count > 1)
    .map(([url]) => url);
  
  console.log(`\n🔍 블로그에만 있는 이미지: ${blogOnlyUrls.length}개`);
  if (blogOnlyUrls.length > 0) {
    blogOnlyUrls.forEach((url, idx) => {
      const fileName = url.substring(url.lastIndexOf('/') + 1);
      console.log(`  ${idx + 1}. ${fileName}`);
    });
  }
  
  console.log(`\n🔍 갤러리에만 있는 이미지: ${galleryOnlyUrls.length}개`);
  if (galleryOnlyUrls.length > 0) {
    galleryOnlyUrls.forEach((url, idx) => {
      const fileName = url.substring(url.lastIndexOf('/') + 1);
      console.log(`  ${idx + 1}. ${fileName}`);
    });
  }
  
  console.log(`\n🔍 블로그 글 내 중복 이미지: ${duplicateUrls.length}개`);
  if (duplicateUrls.length > 0) {
    duplicateUrls.forEach((url, idx) => {
      const fileName = url.substring(url.lastIndexOf('/') + 1);
      const count = urlCounts[url];
      const images = blogImages.filter(img => img.url === url);
      console.log(`\n  ${idx + 1}. ${fileName} - ${count}번 사용:`);
      images.forEach((img, imgIdx) => {
        console.log(`     ${imgIdx + 1}. [${img.alt || '(alt 없음)'}] (${img.source}${img.index !== undefined ? `, 위치: ${img.index}번째` : ''})`);
      });
    });
  }
  
  // 6. 상세 이미지 목록
  console.log('\n' + '='.repeat(80));
  console.log('📋 블로그 글 이미지 상세 목록:');
  console.log('='.repeat(80));
  blogImages.forEach((img, idx) => {
    const fileName = img.url.substring(img.url.lastIndexOf('/') + 1);
    console.log(`\n${idx + 1}. [${img.alt || '(alt 없음)'}]`);
    console.log(`   파일명: ${fileName}`);
    console.log(`   URL: ${img.url.substring(0, 100)}...`);
    console.log(`   타입: ${img.type} (${img.source})`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ 분석 완료');
  console.log('='.repeat(80));
  
  return {
    blogImages,
    uniqueUrls,
    galleryImages,
    blogOnlyUrls,
    galleryOnlyUrls,
    duplicateUrls
  };
}

// 스크립트 실행
if (require.main === module) {
  const blogPostId = process.argv[2] ? parseInt(process.argv[2]) : 123;
  analyzeBlogGalleryImages(blogPostId)
    .then(() => {
      console.log('\n✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { analyzeBlogGalleryImages };

