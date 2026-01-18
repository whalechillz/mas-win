/**
 * 최석호 폴더의 블로그 이미지가 사용된 블로그 포스트 확인
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 최석호 폴더의 블로그 이미지 파일명
const blogImageFiles = [
  '01.massgoo_customer_seokho_first_impression_golf_pose.png',
  '02.autumn_korean_golf_course_massgoo_sunset.jpg',
  '03.massgoo_driver_shaft_head_technology.png',
  '04.massgoo_driver_korean_golf_course.png.jpg',
  '05.massgoo_korean_golf_course_scenic_fairway_with_ball_near_green.jpg',
  '06.golfer_fairway_long_drive_massgoo_view.jpg.jpg'
];

/**
 * 파일명에서 검색 키워드 추출
 */
function extractSearchKeywords(fileName) {
  // 확장자 제거
  let name = fileName.replace(/\.[^/.]+$/, '');
  
  // 번호 제거 (01., 02. 등)
  name = name.replace(/^\d+\./, '').trim();
  
  // massgoo_ 제거
  name = name.replace(/^massgoo_/, '').trim();
  
  // customer_seokho 제거
  name = name.replace(/customer_seokho_/, '').trim();
  
  // 언더스코어를 공백으로 변환
  name = name.replace(/_/g, ' ');
  
  // 키워드 추출 (2글자 이상)
  const keywords = name.split(/\s+/)
    .filter(word => word.length >= 2)
    .map(word => word.toLowerCase());
  
  return keywords;
}

/**
 * 블로그 포스트에서 이미지 URL 검색
 */
async function searchBlogPostsByImage(fileName) {
  const keywords = extractSearchKeywords(fileName);
  console.log(`\n🔍 검색: ${fileName}`);
  console.log(`   키워드: ${keywords.join(', ')}`);
  
  const foundPosts = [];
  
  // 1. image_metadata에서 파일명으로 검색
  const { data: metadata, error: metadataError } = await supabase
    .from('image_metadata')
    .select('id, image_url, original_filename, english_filename, blog_posts, folder_path')
    .or(`original_filename.ilike.%${fileName}%,english_filename.ilike.%${fileName}%`)
    .limit(10);
  
  if (!metadataError && metadata && metadata.length > 0) {
    console.log(`   ✅ image_metadata에서 발견: ${metadata.length}개`);
    
    for (const img of metadata) {
      if (img.blog_posts && img.blog_posts.length > 0) {
        console.log(`   📝 연결된 블로그 ID: ${img.blog_posts.join(', ')}`);
        
        // 블로그 포스트 정보 조회
        const { data: posts, error: postsError } = await supabase
          .from('blog_posts')
          .select('id, title, slug, published_at, created_at')
          .in('id', img.blog_posts);
        
        if (!postsError && posts) {
          for (const post of posts) {
            if (!foundPosts.find(p => p.id === post.id)) {
              foundPosts.push(post);
            }
          }
        }
      }
    }
  }
  
  // 2. blog_posts의 content에서 이미지 URL 검색
  const searchTerms = [
    fileName,
    fileName.replace(/\.[^/.]+$/, ''), // 확장자 제거
    ...keywords.slice(0, 3) // 상위 3개 키워드
  ];
  
  for (const term of searchTerms) {
    if (term.length < 2) continue;
    
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select('id, title, slug, content, featured_image, published_at, created_at')
      .or(`content.ilike.%${term}%,featured_image.ilike.%${term}%,title.ilike.%${term}%`)
      .limit(20);
    
    if (!postsError && posts) {
      for (const post of posts) {
        // content나 featured_image에 파일명이 포함되어 있는지 확인
        const contentMatch = post.content && (
          post.content.includes(fileName) ||
          post.content.includes(fileName.replace(/\.[^/.]+$/, '')) ||
          keywords.some(kw => kw.length >= 3 && post.content.toLowerCase().includes(kw))
        );
        
        const featuredMatch = post.featured_image && (
          post.featured_image.includes(fileName) ||
          post.featured_image.includes(fileName.replace(/\.[^/.]+$/, ''))
        );
        
        if (contentMatch || featuredMatch) {
          // 중복 제거
          if (!foundPosts.find(p => p.id === post.id)) {
            foundPosts.push(post);
          }
        }
      }
    }
  }
  
  if (foundPosts.length > 0) {
    console.log(`   ✅ blog_posts에서 발견: ${foundPosts.length}개`);
    for (const post of foundPosts) {
      const date = post.published_at || post.created_at;
      const dateStr = date ? new Date(date).toLocaleDateString('ko-KR') : '날짜 없음';
      const blogUrl = `https://win.masgolf.co.kr/blog/${post.slug}`;
      console.log(`      - [${post.id}] ${post.title}`);
      console.log(`        날짜: ${dateStr}`);
      console.log(`        링크: ${blogUrl}`);
    }
  } else {
    console.log(`   ❌ 블로그에서 발견되지 않음`);
  }
  
  return foundPosts;
}

/**
 * 메인 함수
 */
async function checkBlogImages() {
  console.log('🔍 최석호 폴더의 블로그 이미지 사용 현황 확인\n');
  console.log('='.repeat(60));
  
  const allFoundPosts = new Map();
  
  for (const fileName of blogImageFiles) {
    const posts = await searchBlogPostsByImage(fileName);
    
    for (const post of posts) {
      if (!allFoundPosts.has(post.id)) {
        allFoundPosts.set(post.id, post);
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 요약');
  console.log('='.repeat(60));
  console.log(`총 블로그 이미지: ${blogImageFiles.length}개`);
  console.log(`발견된 블로그 포스트: ${allFoundPosts.size}개\n`);
  
  if (allFoundPosts.size > 0) {
    console.log('📝 발견된 블로그 포스트 목록:');
    const sortedPosts = Array.from(allFoundPosts.values())
      .sort((a, b) => {
        const dateA = new Date(a.published_at || a.created_at || 0);
        const dateB = new Date(b.published_at || b.created_at || 0);
        return dateB - dateA;
      });
    
    for (const post of sortedPosts) {
      const date = post.published_at || post.created_at;
      const dateStr = date ? new Date(date).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : '날짜 없음';
      const blogUrl = `https://win.masgolf.co.kr/blog/${post.slug}`;
      console.log(`\n[${post.id}] ${post.title}`);
      console.log(`   날짜: ${dateStr}`);
      console.log(`   링크: ${blogUrl}`);
    }
  } else {
    console.log('❌ 블로그에서 사용된 이미지를 찾을 수 없습니다.');
    console.log('   → 이 이미지들은 아직 블로그에 사용되지 않았을 수 있습니다.');
  }
}

// 실행
if (require.main === module) {
  checkBlogImages().catch(console.error);
}

module.exports = { checkBlogImages };
