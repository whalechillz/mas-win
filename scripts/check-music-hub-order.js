/**
 * "뮤직과 골프" 허브 콘텐츠의 hub_order 확인 및 수정
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMusicHubOrder() {
  console.log('🔍 "뮤직과 골프" 허브 콘텐츠 확인...\n');
  
  // 1. "뮤직과 골프" 허브 찾기
  const { data: musicHub, error: hubError } = await supabase
    .from('cc_content_calendar')
    .select('id, title, hub_order, blog_post_id, content_date, created_at')
    .ilike('title', '%뮤직과 골프%')
    .eq('is_hub_content', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (hubError || !musicHub) {
    console.error('❌ "뮤직과 골프" 허브를 찾을 수 없습니다:', hubError);
    return;
  }
  
  console.log('✅ "뮤직과 골프" 허브 확인:');
  console.log(`   허브 ID: ${musicHub.id}`);
  console.log(`   제목: ${musicHub.title}`);
  console.log(`   hub_order: ${musicHub.hub_order || 'null'}`);
  console.log(`   blog_post_id: ${musicHub.blog_post_id || 'null'}`);
  console.log(`   content_date: ${musicHub.content_date}`);
  console.log(`   created_at: ${musicHub.created_at}\n`);
  
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
  
  console.log(`📊 현재 최대 hub_order: ${maxOrder}`);
  
  // 3. hub_order가 1이거나 null이면 수정
  if (!musicHub.hub_order || musicHub.hub_order === 1) {
    const newHubOrder = maxOrder + 1;
    console.log(`\n⚠️ hub_order가 ${musicHub.hub_order || 'null'}입니다. ${newHubOrder}로 수정합니다.\n`);
    
    const { data: updatedHub, error: updateError } = await supabase
      .from('cc_content_calendar')
      .update({
        hub_order: newHubOrder,
        updated_at: new Date().toISOString()
      })
      .eq('id', musicHub.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ hub_order 업데이트 실패:', updateError);
      return;
    }
    
    console.log('✅ hub_order 업데이트 완료!');
    console.log(`   이전 hub_order: ${musicHub.hub_order || 'null'}`);
    console.log(`   새로운 hub_order: ${updatedHub.hub_order}`);
  } else {
    console.log(`\n✅ hub_order가 올바르게 설정되어 있습니다: ${musicHub.hub_order}`);
  }
}

checkMusicHubOrder();

