// 허브 콘텐츠의 hub_order를 블로그 published_at 기준으로 초기화
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function initializeHubOrderFromBlog() {
  try {
    console.log('🔍 허브 콘텐츠와 블로그 포스트 조회 중...\n');
    
    // 1. 모든 허브 콘텐츠 조회 (블로그 연결 정보 포함)
    const { data: hubContents, error: hubError } = await supabase
      .from('cc_content_calendar')
      .select(`
        id,
        title,
        content_date,
        blog_post_id,
        channel_status,
        hub_order
      `)
      .eq('is_hub_content', true);
    
    if (hubError) {
      console.error('❌ 허브 콘텐츠 조회 실패:', hubError);
      return;
    }
    
    console.log(`✅ 총 ${hubContents.length}개 허브 콘텐츠 발견\n`);
    
    // 2. 블로그 포스트의 published_at 기준으로 정렬
    const hubWithBlogDates = [];
    const hubWithoutBlog = [];
    
    for (const hub of hubContents) {
      // 블로그 포스트 ID 확인 (다중 연결 지원)
      const blogPostIds = [];
      
      // channel_status에서 블로그 ID 추출
      if (hub.channel_status?.blog) {
        if (hub.channel_status.blog.posts && Array.isArray(hub.channel_status.blog.posts)) {
          blogPostIds.push(...hub.channel_status.blog.posts);
        } else if (hub.channel_status.blog.post_id) {
          blogPostIds.push(hub.channel_status.blog.post_id);
        } else if (hub.channel_status.blog.primary_post_id) {
          blogPostIds.push(hub.channel_status.blog.primary_post_id);
        }
      }
      
      // blog_post_id 필드 확인
      if (hub.blog_post_id) {
        blogPostIds.push(hub.blog_post_id);
      }
      
      // 중복 제거
      const uniqueBlogIds = [...new Set(blogPostIds.map(id => parseInt(id)).filter(id => !isNaN(id)))];
      
      if (uniqueBlogIds.length > 0) {
        // 블로그 포스트 조회
        const { data: blogPosts, error: blogError } = await supabase
          .from('blog_posts')
          .select('id, published_at, status')
          .in('id', uniqueBlogIds)
          .eq('status', 'published')
          .order('published_at', { ascending: false });
        
        if (!blogError && blogPosts && blogPosts.length > 0) {
          // 가장 최근 발행일 사용
          const latestPublishedAt = blogPosts[0].published_at;
          hubWithBlogDates.push({
            hub,
            publishedAt: latestPublishedAt ? new Date(latestPublishedAt) : null,
            blogPostIds: uniqueBlogIds
          });
        } else {
          // 블로그가 있지만 published_at이 없는 경우 content_date 사용
          hubWithoutBlog.push({
            hub,
            publishedAt: hub.content_date ? new Date(hub.content_date) : new Date(hub.created_at || Date.now())
          });
        }
      } else {
        // 블로그가 없는 경우 content_date 사용
        hubWithoutBlog.push({
          hub,
          publishedAt: hub.content_date ? new Date(hub.content_date) : new Date(hub.created_at || Date.now())
        });
      }
    }
    
    console.log(`📊 블로그 연결된 허브: ${hubWithBlogDates.length}개`);
    console.log(`📊 블로그 없는 허브: ${hubWithoutBlog.length}개\n`);
    
    // 3. 날짜 기준으로 정렬 (내림차순 - 최신이 1번)
    const allHubs = [
      ...hubWithBlogDates.map(item => ({
        hub: item.hub,
        date: item.publishedAt,
        source: 'blog'
      })),
      ...hubWithoutBlog.map(item => ({
        hub: item.hub,
        date: item.publishedAt,
        source: 'content_date'
      }))
    ];
    
    // 날짜 내림차순 정렬 (최신이 위로)
    allHubs.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return b.date.getTime() - a.date.getTime();
    });
    
    // 4. hub_order 할당 (1부터 시작, 최신이 1번)
    let order = 1;
    const updates = [];
    
    for (const item of allHubs) {
      if (item.hub.hub_order !== order) {
        updates.push({
          id: item.hub.id,
          hub_order: order,
          title: item.hub.title.substring(0, 50),
          date: item.date ? item.date.toISOString().split('T')[0] : 'N/A',
          source: item.source
        });
      }
      order++;
    }
    
    console.log(`🔄 ${updates.length}개 항목 업데이트 예정...\n`);
    
    // 5. 배치 업데이트
    let successCount = 0;
    let failCount = 0;
    
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('cc_content_calendar')
        .update({ hub_order: update.hub_order })
        .eq('id', update.id);
      
      if (updateError) {
        console.error(`❌ ${update.id} 업데이트 실패:`, updateError.message);
        failCount++;
      } else {
        console.log(`✅ [${String(update.hub_order).padStart(3, '0')}] ${update.title}... (${update.date}, ${update.source})`);
        successCount++;
      }
    }
    
    console.log(`\n🎉 hub_order 초기화 완료!`);
    console.log(`   ✅ 성공: ${successCount}개`);
    console.log(`   ❌ 실패: ${failCount}개`);
    console.log(`   📊 총 허브 콘텐츠: ${hubContents.length}개`);
    console.log(`   📊 최신 순번: 1번 (가장 최근 발행일)`);
    console.log(`   📊 오래된 순번: ${hubContents.length}번 (가장 오래된 발행일)\n`);
    
  } catch (error) {
    console.error('❌ 초기화 오류:', error);
  }
}

initializeHubOrderFromBlog();

