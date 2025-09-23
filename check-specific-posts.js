// 특정 게시물들의 featured_image 상태 확인
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSpecificPosts() {
  console.log('🔍 특정 게시물들의 featured_image 상태 확인 중...');

  try {
    // 문제가 되는 두 게시물 찾기
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('id, title, featured_image, published_at')
      .or('title.ilike.%가을 골프 시즌 특가%', 'title.ilike.%휴가철 골프 휴양지%')
      .order('published_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase 쿼리 에러:', error);
      return;
    }

    console.log(`\n📊 찾은 게시물: ${posts.length}개\n`);
    
    posts.forEach((post, index) => {
      const hasImage = post.featured_image && post.featured_image !== '';
      console.log(`${index + 1}. [ID: ${post.id}] ${post.title}`);
      console.log(`   발행일: ${post.published_at}`);
      console.log(`   ${hasImage ? '✅' : '❌'} 대표이미지: ${post.featured_image || '없음'}`);
      console.log(`   이미지 URL: ${post.featured_image}`);
      console.log('');
    });

    // 최근 10개 게시물도 확인
    console.log('\n🔍 최근 10개 게시물의 featured_image 상태:\n');
    
    const { data: recentPosts, error: recentError } = await supabase
      .from('blog_posts')
      .select('id, title, featured_image, published_at')
      .order('published_at', { ascending: false })
      .limit(10);

    if (recentError) {
      console.error('❌ 최근 게시물 쿼리 에러:', recentError);
      return;
    }

    let hasImageCount = 0;
    let noImageCount = 0;

    recentPosts.forEach((post, index) => {
      const hasImage = post.featured_image && post.featured_image !== '';
      if (hasImage) {
        hasImageCount++;
      } else {
        noImageCount++;
      }
      console.log(`${index + 1}. [ID: ${post.id}] ${post.title}`);
      console.log(`   발행일: ${post.published_at}`);
      console.log(`   ${hasImage ? '✅' : '❌'} 대표이미지: ${post.featured_image || '없음'}\n`);
    });

    console.log('📈 최근 10개 게시물 통계:');
    console.log(`   - 대표이미지 있음: ${hasImageCount}개`);
    console.log(`   - 대표이미지 없음: ${noImageCount}개`);
    console.log(`   - 비율: ${(hasImageCount / recentPosts.length * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('❌ 스크립트 실행 중 에러:', error);
  }
}

checkSpecificPosts();

