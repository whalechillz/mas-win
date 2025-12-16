// 허브 기준으로 블로그 날짜 동기화 스크립트
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// .env 파일 로드
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncBlogDatesFromHub() {
  try {
    console.log('🔄 허브 기준 블로그 날짜 동기화 시작...\n');
    
    // 1. 블로그와 연결된 허브 콘텐츠 조회
    const { data: hubContents, error: hubError } = await supabase
      .from('cc_content_calendar')
      .select('id, title, content_date, blog_post_id')
      .eq('is_hub_content', true)
      .not('blog_post_id', 'is', null);
    
    if (hubError) {
      console.error('❌ 허브 콘텐츠 조회 오류:', hubError);
      return;
    }
    
    console.log(`✅ 연결된 허브 콘텐츠: ${hubContents?.length || 0}개\n`);
    
    let syncedCount = 0;
    let skippedCount = 0;
    const results = [];
    
    for (const hubContent of hubContents || []) {
      try {
        // 블로그 포스트 조회
        const { data: blogPost, error: blogError } = await supabase
          .from('blog_posts')
          .select('id, title, published_at, created_at')
          .eq('id', hubContent.blog_post_id)
          .single();
        
        if (blogError || !blogPost) {
          console.error(`❌ 블로그 포스트 조회 실패 (ID: ${hubContent.blog_post_id}):`, blogError);
          continue;
        }
        
        // 허브의 content_date를 날짜로 변환
        const hubDate = new Date(hubContent.content_date);
        const blogDate = blogPost.published_at ? new Date(blogPost.published_at) : null;
        
        // 날짜가 다른 경우에만 업데이트
        if (!blogDate || hubDate.toISOString().split('T')[0] !== blogDate.toISOString().split('T')[0]) {
          // published_at 업데이트 (created_at은 원본 보존)
          const { error: updateError } = await supabase
            .from('blog_posts')
            .update({
              published_at: hubDate.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', blogPost.id);
          
          if (updateError) {
            console.error(`❌ 블로그 날짜 업데이트 실패 (${blogPost.title}):`, updateError);
            results.push({
              blogId: blogPost.id,
              blogTitle: blogPost.title,
              hubDate: hubContent.content_date,
              oldDate: blogPost.published_at,
              status: 'error',
              error: updateError.message
            });
          } else {
            syncedCount++;
            console.log(`✅ 날짜 동기화: ${blogPost.title.substring(0, 50)}... (${blogPost.published_at || 'null'} → ${hubContent.content_date})`);
            results.push({
              blogId: blogPost.id,
              blogTitle: blogPost.title,
              hubDate: hubContent.content_date,
              oldDate: blogPost.published_at,
              status: 'success'
            });
          }
        } else {
          skippedCount++;
          // 날짜가 같으면 스킵
        }
        
      } catch (error) {
        console.error(`❌ 개별 항목 처리 오류 (${hubContent.title}):`, error);
        results.push({
          hubId: hubContent.id,
          hubTitle: hubContent.title,
          status: 'error',
          error: error.message
        });
      }
    }
    
    console.log(`\n✅ 날짜 동기화 완료!`);
    console.log(`   동기화: ${syncedCount}개`);
    console.log(`   스킵 (이미 동일): ${skippedCount}개`);
    console.log(`   실패: ${results.filter(r => r.status === 'error').length}개\n`);
    
    // 결과 저장
    const fs = require('fs');
    const reportPath = path.join(__dirname, '../backup/blog-date-sync-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      syncedCount,
      skippedCount,
      results
    }, null, 2));
    
    console.log(`📄 리포트 저장: ${reportPath}`);
    
  } catch (error) {
    console.error('❌ 날짜 동기화 스크립트 오류:', error);
  }
}

syncBlogDatesFromHub();

