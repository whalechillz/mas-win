// "천안 직산" 허브 콘텐츠와 블로그 재연결 스크립트
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// .env 파일 로드
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function reconnectCheonanJiksan() {
  try {
    console.log('🔍 "천안 직산" 허브 콘텐츠 찾는 중...');
    
    // 1. 허브 콘텐츠 찾기
    const { data: hubContent, error: hubError } = await supabase
      .from('cc_content_calendar')
      .select('*')
      .ilike('title', '%천안 직산%')
      .eq('is_hub_content', true)
      .single();
    
    if (hubError || !hubContent) {
      console.error('❌ 허브 콘텐츠를 찾을 수 없습니다:', hubError);
      return;
    }
    
    console.log('✅ 허브 콘텐츠 찾음:', hubContent.id, hubContent.title);
    
    // 2. 블로그 포스트 찾기 (제목으로 매칭)
    const { data: blogPosts, error: blogError } = await supabase
      .from('blog_posts')
      .select('*')
      .ilike('title', '%천안 직산%')
      .order('created_at', { ascending: false });
    
    if (blogError || !blogPosts || blogPosts.length === 0) {
      console.error('❌ 블로그 포스트를 찾을 수 없습니다:', blogError);
      return;
    }
    
    // 가장 최근 블로그 포스트 선택
    const blogPost = blogPosts[0];
    console.log('✅ 블로그 포스트 찾음:', blogPost.id, blogPost.title);
    
    // 3. 허브 콘텐츠와 블로그 연결
    const currentChannels = hubContent.channel_status || {};
    const updatedChannels = {
      ...currentChannels,
      blog: {
        status: '연결됨',
        post_id: blogPost.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };
    
    // 허브 콘텐츠 업데이트
    const { error: updateError } = await supabase
      .from('cc_content_calendar')
      .update({
        blog_post_id: blogPost.id,
        channel_status: updatedChannels,
        updated_at: new Date().toISOString()
      })
      .eq('id', hubContent.id);
    
    if (updateError) {
      console.error('❌ 허브 콘텐츠 업데이트 실패:', updateError);
      return;
    }
    
    // 4. 블로그 포스트에 calendar_id 설정
    const { error: blogUpdateError } = await supabase
      .from('blog_posts')
      .update({
        calendar_id: hubContent.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', blogPost.id);
    
    if (blogUpdateError) {
      console.error('❌ 블로그 포스트 업데이트 실패:', blogUpdateError);
      return;
    }
    
    console.log('\n✅ "천안 직산" 허브 콘텐츠와 블로그 재연결 완료!');
    console.log(`   허브 ID: ${hubContent.id}`);
    console.log(`   블로그 ID: ${blogPost.id}`);
    console.log(`   제목: ${blogPost.title}\n`);
    
  } catch (error) {
    console.error('❌ 재연결 오류:', error);
  }
}

reconnectCheonanJiksan();

