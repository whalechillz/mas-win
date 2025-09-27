require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBlogStatus() {
  try {
    console.log('📊 블로그 게시물 상태 확인 시작...');

    // 최근 10개 게시물의 상태 확인
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('id, title, status, published_at, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.log('❌ 데이터 조회 에러:', error);
      return;
    }

    console.log(`📈 총 ${posts.length}개의 게시물 상태를 확인했습니다.\n`);

    if (posts.length > 0) {
      console.log('📋 최근 게시물 상태:');
      posts.forEach((post, index) => {
        console.log(`\n${index + 1}. ${post.title}`);
        console.log(`   ID: ${post.id}`);
        console.log(`   상태: ${post.status}`);
        console.log(`   발행일: ${post.published_at ? new Date(post.published_at).toLocaleString() : '없음'}`);
        console.log(`   생성일: ${new Date(post.created_at).toLocaleString()}`);
      });

      // 상태별 통계
      const statusCounts = {};
      posts.forEach(post => {
        statusCounts[post.status] = (statusCounts[post.status] || 0) + 1;
      });

      console.log('\n📊 상태별 통계:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}개`);
      });

      // 발행된 게시물과 초안 게시물 구분
      const publishedPosts = posts.filter(post => post.status === 'published');
      const draftPosts = posts.filter(post => post.status === 'draft');

      console.log(`\n✅ 발행된 게시물: ${publishedPosts.length}개`);
      console.log(`📝 초안 게시물: ${draftPosts.length}개`);

      if (publishedPosts.length > 0) {
        console.log('\n📢 발행된 게시물 예시:');
        publishedPosts.slice(0, 3).forEach((post, index) => {
          console.log(`   ${index + 1}. ${post.title}`);
        });
      }

      if (draftPosts.length > 0) {
        console.log('\n📝 초안 게시물 예시:');
        draftPosts.slice(0, 3).forEach((post, index) => {
          console.log(`   ${index + 1}. ${post.title}`);
        });
      }

    } else {
      console.log('📭 게시물이 없습니다.');
    }

  } catch (error) {
    console.error('❌ 상태 확인 중 오류 발생:', error);
  }
}

checkBlogStatus().then(() => {
  console.log('\n🏁 블로그 게시물 상태 확인 완료');
  process.exit(0);
}).catch((error) => {
  console.error('❌ 스크립트 실행 중 오류:', error);
  process.exit(1);
});
