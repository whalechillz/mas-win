// 163번 허브에 블로그 482 연결
// 166번 허브에 블로그 483만 연결 (482 제거)
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixHubBlogConnections() {
  try {
    console.log('🔍 허브-블로그 연결 수정 시작...\n');
    
    // 1. 163번 허브 찾기
    const { data: hub163, error: hub163Error } = await supabase
      .from('cc_content_calendar')
      .select('*')
      .eq('hub_order', 163)
      .eq('is_hub_content', true)
      .single();
    
    if (hub163Error || !hub163) {
      console.error('❌ 163번 허브를 찾을 수 없습니다:', hub163Error);
      return;
    }
    
    console.log('✅ 163번 허브 찾음:', hub163.title);
    
    // 2. 166번 허브 찾기
    const { data: hub166, error: hub166Error } = await supabase
      .from('cc_content_calendar')
      .select('*')
      .eq('hub_order', 166)
      .eq('is_hub_content', true)
      .single();
    
    if (hub166Error || !hub166) {
      console.error('❌ 166번 허브를 찾을 수 없습니다:', hub166Error);
      return;
    }
    
    console.log('✅ 166번 허브 찾음:', hub166.title);
    
    // 3. 블로그 482, 483 확인
    const { data: blogPosts, error: blogError } = await supabase
      .from('blog_posts')
      .select('id, title, status')
      .in('id', [482, 483]);
    
    if (blogError || !blogPosts || blogPosts.length < 2) {
      console.error('❌ 블로그 포스트를 찾을 수 없습니다:', blogError);
      return;
    }
    
    const blog482 = blogPosts.find(p => p.id === 482);
    const blog483 = blogPosts.find(p => p.id === 483);
    
    console.log('✅ 블로그 포스트 확인:');
    console.log(`   블로그 482: ${blog482.title}`);
    console.log(`   블로그 483: ${blog483.title}\n`);
    
    // 4. 163번 허브에 블로그 482 연결
    const currentChannels163 = hub163.channel_status || {};
    const published482 = blog482.status === 'published';
    
    const updatedChannels163 = {
      ...currentChannels163,
      blog: {
        status: published482 ? '발행됨' : '연결됨',
        post_id: 482,
        primary_post_id: 482,
        posts: [482],
        created_at: currentChannels163.blog?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };
    
    const { error: update163Error } = await supabase
      .from('cc_content_calendar')
      .update({
        blog_post_id: 482,
        channel_status: updatedChannels163,
        updated_at: new Date().toISOString()
      })
      .eq('id', hub163.id);
    
    if (update163Error) {
      console.error('❌ 163번 허브 업데이트 실패:', update163Error);
    } else {
      console.log('✅ 163번 허브에 블로그 482 연결 완료');
    }
    
    // 5. 166번 허브에 블로그 483만 연결 (482 제거)
    const currentChannels166 = hub166.channel_status || {};
    const published483 = blog483.status === 'published';
    
    const updatedChannels166 = {
      ...currentChannels166,
      blog: {
        status: published483 ? '발행됨' : '연결됨',
        post_id: 483,
        primary_post_id: 483,
        posts: [483], // 483만 포함
        created_at: currentChannels166.blog?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };
    
    const { error: update166Error } = await supabase
      .from('cc_content_calendar')
      .update({
        blog_post_id: 483,
        channel_status: updatedChannels166,
        updated_at: new Date().toISOString()
      })
      .eq('id', hub166.id);
    
    if (update166Error) {
      console.error('❌ 166번 허브 업데이트 실패:', update166Error);
    } else {
      console.log('✅ 166번 허브에 블로그 483 연결 완료 (482 제거)');
    }
    
    // 6. 블로그 포스트의 calendar_id 업데이트
    const { error: update482Error } = await supabase
      .from('blog_posts')
      .update({
        calendar_id: hub163.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', 482);
    
    if (update482Error) {
      console.error('❌ 블로그 482 calendar_id 업데이트 실패:', update482Error);
    } else {
      console.log('✅ 블로그 482 calendar_id 업데이트 완료');
    }
    
    const { error: update483Error } = await supabase
      .from('blog_posts')
      .update({
        calendar_id: hub166.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', 483);
    
    if (update483Error) {
      console.error('❌ 블로그 483 calendar_id 업데이트 실패:', update483Error);
    } else {
      console.log('✅ 블로그 483 calendar_id 업데이트 완료');
    }
    
    console.log('\n🎉 허브-블로그 연결 수정 완료!');
    console.log('   163번 허브 ↔ 블로그 482');
    console.log('   166번 허브 ↔ 블로그 483');
    
  } catch (error) {
    console.error('❌ 연결 수정 오류:', error);
  }
}

fixHubBlogConnections();

