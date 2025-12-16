// 164번 허브에 블로그 481 연결
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function connectHub164ToBlog481() {
  try {
    console.log('🔍 164번 허브와 블로그 481 연결 시작...\n');
    
    // 1. 164번 허브 찾기
    const { data: hub164, error: hub164Error } = await supabase
      .from('cc_content_calendar')
      .select('*')
      .eq('hub_order', 164)
      .eq('is_hub_content', true)
      .single();
    
    if (hub164Error || !hub164) {
      console.error('❌ 164번 허브를 찾을 수 없습니다:', hub164Error);
      return;
    }
    
    console.log('✅ 164번 허브 찾음:', hub164.title);
    console.log(`   허브 ID: ${hub164.id}\n`);
    
    // 2. 블로그 481 확인
    const { data: blog481, error: blogError } = await supabase
      .from('blog_posts')
      .select('id, title, status, calendar_id')
      .eq('id', 481)
      .single();
    
    if (blogError || !blog481) {
      console.error('❌ 블로그 481을 찾을 수 없습니다:', blogError);
      return;
    }
    
    console.log('✅ 블로그 481 확인:');
    console.log(`   제목: ${blog481.title}`);
    console.log(`   상태: ${blog481.status}`);
    console.log(`   현재 calendar_id: ${blog481.calendar_id || '없음'}\n`);
    
    // 3. 허브 콘텐츠의 channel_status 업데이트
    const currentChannels = hub164.channel_status || {};
    const currentBlogChannel = currentChannels.blog || {};
    const existingPosts = currentBlogChannel.posts || [];
    
    // 481을 posts 배열에 추가 (중복 제거)
    const updatedPosts = [...new Set([...existingPosts, 481])];
    
    // 발행된 블로그인지 확인하여 상태 결정
    const blogStatus = blog481.status === 'published' ? '발행됨' : '연결됨';
    
    const updatedChannels = {
      ...currentChannels,
      blog: {
        status: blogStatus,
        post_id: 481,
        primary_post_id: 481,
        posts: updatedPosts,
        created_at: currentBlogChannel.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };
    
    // 4. 허브 콘텐츠 업데이트
    const { error: updateHubError } = await supabase
      .from('cc_content_calendar')
      .update({
        blog_post_id: 481,
        channel_status: updatedChannels,
        updated_at: new Date().toISOString()
      })
      .eq('id', hub164.id);
    
    if (updateHubError) {
      console.error('❌ 허브 콘텐츠 업데이트 실패:', updateHubError);
      return;
    }
    
    console.log('✅ 허브 콘텐츠 업데이트 완료');
    console.log(`   channel_status.blog.posts: [${updatedPosts.join(', ')}]`);
    console.log(`   blog_post_id: 481`);
    console.log(`   블로그 상태: ${blogStatus}\n`);
    
    // 5. 블로그 포스트의 calendar_id 업데이트
    const { error: updateBlogError } = await supabase
      .from('blog_posts')
      .update({
        calendar_id: hub164.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', 481);
    
    if (updateBlogError) {
      console.error('❌ 블로그 481 calendar_id 업데이트 실패:', updateBlogError);
    } else {
      console.log('✅ 블로그 481 calendar_id 업데이트 완료');
    }
    
    console.log('\n🎉 164번 허브에 블로그 481 연결 완료!');
    console.log(`   허브 ID: ${hub164.id}`);
    console.log(`   블로그 ID: 481`);
    console.log(`   블로그 상태: ${blogStatus}`);
    
  } catch (error) {
    console.error('❌ 연결 오류:', error);
  }
}

connectHub164ToBlog481();

