/**
 * 블로그 486과 허브 연결 상태 확인 스크립트
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBlog486() {
  console.log('🔍 블로그 486과 허브 연결 확인...\n');
  
  // 1. 블로그 486 확인
  const { data: blog486, error: blogError } = await supabase
    .from('blog_posts')
    .select('id, title, status, calendar_id, created_at')
    .eq('id', 486)
    .single();
  
  if (blogError || !blog486) {
    console.error('❌ 블로그 486을 찾을 수 없습니다:', blogError);
    return;
  }
  
  console.log('✅ 블로그 486 확인:');
  console.log(`   제목: ${blog486.title}`);
  console.log(`   상태: ${blog486.status}`);
  console.log(`   calendar_id: ${blog486.calendar_id || '없음'}`);
  console.log(`   생성일: ${blog486.created_at}\n`);
  
  // 2. calendar_id로 허브 찾기
  if (blog486.calendar_id) {
    const { data: hubContent, error: hubError } = await supabase
      .from('cc_content_calendar')
      .select('id, title, hub_order, blog_post_id, channel_status, content_date, is_hub_content')
      .eq('id', blog486.calendar_id)
      .single();
    
    if (hubError || !hubContent) {
      console.error('❌ 연결된 허브 콘텐츠를 찾을 수 없습니다:', hubError);
    } else {
      console.log('✅ 연결된 허브 콘텐츠:');
      console.log(`   허브 ID: ${hubContent.id}`);
      console.log(`   제목: ${hubContent.title}`);
      console.log(`   hub_order: ${hubContent.hub_order || 'null'}`);
      console.log(`   blog_post_id: ${hubContent.blog_post_id || 'null'}`);
      console.log(`   content_date: ${hubContent.content_date}`);
      console.log(`   is_hub_content: ${hubContent.is_hub_content}`);
      console.log(`   channel_status.blog:`, JSON.stringify(hubContent.channel_status?.blog, null, 2));
      
      // hub_order가 null이면 수정 필요
      if (!hubContent.hub_order) {
        console.log('\n⚠️ hub_order가 null입니다. 수정이 필요합니다.');
      }
    }
  } else {
    console.log('⚠️ 블로그 486에 calendar_id가 없습니다.');
  }
  
  // 3. blog_post_id로 허브 찾기
  const { data: hubByBlogId, error: hubByBlogIdError } = await supabase
    .from('cc_content_calendar')
    .select('id, title, hub_order, blog_post_id, content_date, is_hub_content')
    .eq('blog_post_id', 486)
    .eq('is_hub_content', true);
  
  if (hubByBlogId && hubByBlogId.length > 0) {
    console.log('\n✅ blog_post_id로 찾은 허브 콘텐츠:');
    hubByBlogId.forEach(hub => {
      console.log(`   허브 ID: ${hub.id}`);
      console.log(`   제목: ${hub.title}`);
      console.log(`   hub_order: ${hub.hub_order || 'null'}`);
      console.log(`   content_date: ${hub.content_date}`);
    });
  } else {
    console.log('\n⚠️ blog_post_id로 허브를 찾을 수 없습니다.');
  }
  
  // 4. 허브 목록에서 최신 hub_order 확인
  const { data: latestHubs, error: latestError } = await supabase
    .from('cc_content_calendar')
    .select('id, title, hub_order, content_date')
    .eq('is_hub_content', true)
    .not('hub_order', 'is', null)
    .order('hub_order', { ascending: false })
    .limit(5);
  
  if (latestHubs && latestHubs.length > 0) {
    console.log('\n📊 최신 hub_order 상위 5개:');
    latestHubs.forEach((hub, index) => {
      console.log(`   ${index + 1}. hub_order: ${hub.hub_order}, 제목: ${hub.title.substring(0, 50)}...`);
    });
  }
}

checkBlog486();

