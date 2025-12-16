/**
 * 블로그 486의 허브 콘텐츠 hub_order 수정 스크립트
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixBlog486HubOrder() {
  console.log('🔧 블로그 486의 허브 콘텐츠 hub_order 수정 시작...\n');
  
  // 1. 블로그 486 확인
  const { data: blog486, error: blogError } = await supabase
    .from('blog_posts')
    .select('id, title, calendar_id')
    .eq('id', 486)
    .single();
  
  if (blogError || !blog486 || !blog486.calendar_id) {
    console.error('❌ 블로그 486 또는 calendar_id를 찾을 수 없습니다:', blogError);
    return;
  }
  
  console.log('✅ 블로그 486 확인:');
  console.log(`   제목: ${blog486.title}`);
  console.log(`   calendar_id: ${blog486.calendar_id}\n`);
  
  // 2. 현재 최대 hub_order 확인
  const { data: allHubs, error: allHubsError } = await supabase
    .from('cc_content_calendar')
    .select('hub_order')
    .eq('is_hub_content', true)
    .not('hub_order', 'is', null);
  
  if (allHubsError) {
    console.error('❌ 허브 콘텐츠 조회 실패:', allHubsError);
    return;
  }
  
  const maxOrder = allHubs && allHubs.length > 0 
    ? Math.max(...allHubs.map(h => h.hub_order || 0))
    : 0;
  
  const newHubOrder = maxOrder + 1;
  
  console.log(`📊 현재 최대 hub_order: ${maxOrder}`);
  console.log(`📊 새로운 hub_order: ${newHubOrder}\n`);
  
  // 3. 허브 콘텐츠의 hub_order 업데이트
  const { data: updatedHub, error: updateError } = await supabase
    .from('cc_content_calendar')
    .update({
      hub_order: newHubOrder,
      updated_at: new Date().toISOString()
    })
    .eq('id', blog486.calendar_id)
    .select()
    .single();
  
  if (updateError) {
    console.error('❌ hub_order 업데이트 실패:', updateError);
    return;
  }
  
  console.log('✅ hub_order 업데이트 완료!');
  console.log(`   허브 ID: ${updatedHub.id}`);
  console.log(`   제목: ${updatedHub.title}`);
  console.log(`   이전 hub_order: 1`);
  console.log(`   새로운 hub_order: ${updatedHub.hub_order}`);
  console.log(`\n🎉 블로그 486의 허브 콘텐츠가 이제 목록 최상단에 표시됩니다!`);
}

fixBlog486HubOrder();

