/**
 * 168번 허브(뮤직과 골프)와 485번 블로그 삭제 스크립트
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deleteMusicHubAndBlog() {
  console.log('🗑️ 168번 허브와 485번 블로그 삭제 시작...\n');
  
  // 1. 168번 허브 찾기
  const { data: musicHub, error: hubError } = await supabase
    .from('cc_content_calendar')
    .select('id, title, hub_order, blog_post_id')
    .eq('hub_order', 168)
    .eq('is_hub_content', true)
    .single();
  
  if (hubError || !musicHub) {
    console.error('❌ 168번 허브를 찾을 수 없습니다:', hubError);
    return;
  }
  
  console.log('✅ 168번 허브 확인:');
  console.log(`   허브 ID: ${musicHub.id}`);
  console.log(`   제목: ${musicHub.title}`);
  console.log(`   blog_post_id: ${musicHub.blog_post_id || '없음'}\n`);
  
  // 2. 블로그 485 확인
  const { data: blog485, error: blogError } = await supabase
    .from('blog_posts')
    .select('id, title, status, calendar_id')
    .eq('id', 485)
    .single();
  
  if (blogError || !blog485) {
    console.error('❌ 블로그 485를 찾을 수 없습니다:', blogError);
    return;
  }
  
  console.log('✅ 블로그 485 확인:');
  console.log(`   제목: ${blog485.title}`);
  console.log(`   상태: ${blog485.status}`);
  console.log(`   calendar_id: ${blog485.calendar_id || '없음'}\n`);
  
  // 3. 블로그 485 삭제
  console.log('🗑️ 블로그 485 삭제 중...');
  const { error: deleteBlogError } = await supabase
    .from('blog_posts')
    .delete()
    .eq('id', 485);
  
  if (deleteBlogError) {
    console.error('❌ 블로그 485 삭제 실패:', deleteBlogError);
    return;
  }
  
  console.log('✅ 블로그 485 삭제 완료\n');
  
  // 4. 허브 콘텐츠 삭제
  console.log('🗑️ 168번 허브 콘텐츠 삭제 중...');
  const { error: deleteHubError } = await supabase
    .from('cc_content_calendar')
    .delete()
    .eq('id', musicHub.id);
  
  if (deleteHubError) {
    console.error('❌ 허브 콘텐츠 삭제 실패:', deleteHubError);
    return;
  }
  
  console.log('✅ 168번 허브 콘텐츠 삭제 완료\n');
  
  console.log('🎉 삭제 완료!');
  console.log(`   삭제된 허브 ID: ${musicHub.id}`);
  console.log(`   삭제된 블로그 ID: 485`);
}

deleteMusicHubAndBlog();

