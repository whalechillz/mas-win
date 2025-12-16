// 166번 허브에 블로그 482, 483 연결
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function connectHub166ToBlogs() {
  try {
    console.log('🔍 166번 허브 콘텐츠 찾는 중...\n');
    
    // 1. 166번 허브 콘텐츠 찾기 (hub_order = 166)
    const { data: hubContent, error: hubError } = await supabase
      .from('cc_content_calendar')
      .select('*')
      .eq('hub_order', 166)
      .eq('is_hub_content', true)
      .single();
    
    if (hubError || !hubContent) {
      console.error('❌ 166번 허브 콘텐츠를 찾을 수 없습니다:', hubError);
      return;
    }
    
    console.log('✅ 허브 콘텐츠 찾음:');
    console.log(`   ID: ${hubContent.id}`);
    console.log(`   제목: ${hubContent.title}`);
    console.log(`   현재 hub_order: ${hubContent.hub_order}\n`);
    
    // 2. 블로그 포스트 482, 483 확인
    const { data: blogPosts, error: blogError } = await supabase
      .from('blog_posts')
      .select('id, title, status, calendar_id')
      .in('id', [482, 483]);
    
    if (blogError || !blogPosts || blogPosts.length === 0) {
      console.error('❌ 블로그 포스트를 찾을 수 없습니다:', blogError);
      return;
    }
    
    console.log('✅ 블로그 포스트 확인:');
    blogPosts.forEach(post => {
      console.log(`   ID ${post.id}: ${post.title}`);
      console.log(`      상태: ${post.status}`);
      console.log(`      현재 calendar_id: ${post.calendar_id || '없음'}`);
    });
    console.log();
    
    // 3. 허브 콘텐츠의 channel_status 업데이트
    const currentChannels = hubContent.channel_status || {};
    const currentBlogChannel = currentChannels.blog || {};
    const existingPosts = currentBlogChannel.posts || [];
    
    // 482, 483을 posts 배열에 추가 (중복 제거)
    const newPosts = [482, 483];
    const updatedPosts = [...new Set([...existingPosts, ...newPosts])];
    
    // 발행된 블로그가 있는지 확인하여 상태 결정
    const publishedPosts = blogPosts.filter(p => p.status === 'published');
    const blogStatus = publishedPosts.length > 0 ? '발행됨' : '연결됨';
    
    const updatedChannels = {
      ...currentChannels,
      blog: {
        status: blogStatus,
        post_id: 482, // 첫 번째 블로그를 대표로
        primary_post_id: 482, // 대표 블로그
        posts: updatedPosts, // [482, 483] 배열
        created_at: currentBlogChannel.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };
    
    // 4. 허브 콘텐츠 업데이트
    const { error: updateHubError } = await supabase
      .from('cc_content_calendar')
      .update({
        blog_post_id: 482, // 대표 블로그 ID
        channel_status: updatedChannels,
        updated_at: new Date().toISOString()
      })
      .eq('id', hubContent.id);
    
    if (updateHubError) {
      console.error('❌ 허브 콘텐츠 업데이트 실패:', updateHubError);
      return;
    }
    
    console.log('✅ 허브 콘텐츠 업데이트 완료');
    console.log(`   channel_status.blog.posts: [${updatedPosts.join(', ')}]`);
    console.log(`   blog_post_id: 482 (대표)\n`);
    
    // 5. 블로그 포스트의 calendar_id 업데이트
    for (const blogPost of blogPosts) {
      const { error: updateBlogError } = await supabase
        .from('blog_posts')
        .update({
          calendar_id: hubContent.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', blogPost.id);
      
      if (updateBlogError) {
        console.error(`❌ 블로그 ${blogPost.id} 업데이트 실패:`, updateBlogError);
      } else {
        console.log(`✅ 블로그 ${blogPost.id} calendar_id 업데이트 완료`);
      }
    }
    
    console.log('\n🎉 166번 허브에 블로그 482, 483 연결 완료!');
    console.log(`   허브 ID: ${hubContent.id}`);
    console.log(`   연결된 블로그: 482, 483`);
    console.log(`   블로그 상태: ${blogStatus}`);
    
  } catch (error) {
    console.error('❌ 연결 오류:', error);
  }
}

connectHub166ToBlogs();

