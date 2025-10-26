import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔗 누락된 blog_post_id 연결 시작...');

    // 1. blog_post_id가 NULL인 허브 콘텐츠 조회
    const { data: missingHubContent, error: hubError } = await supabase
      .from('cc_content_calendar')
      .select('id, title, created_at')
      .is('blog_post_id', null)
      .order('created_at', { ascending: false });

    if (hubError) throw hubError;

    console.log(`📋 누락된 허브 콘텐츠: ${missingHubContent.length}개`);

    let connectedCount = 0;

    for (const hubContent of missingHubContent) {
      try {
        // 2. 제목으로 매칭되는 블로그 포스트 찾기
        const titlePart = hubContent.title.split(' : ')[0]; // " : 네이버 블로그" 부분 제거
        
        const { data: matchingBlog, error: blogError } = await supabase
          .from('blog_posts')
          .select('id, title, created_at')
          .ilike('title', `%${titlePart}%`)
          .is('calendar_id', null) // 아직 연결되지 않은 블로그 포스트
          .order('created_at', { ascending: false })
          .limit(1);

        if (blogError) {
          console.error(`❌ 블로그 포스트 조회 오류 (${hubContent.title}):`, blogError);
          continue;
        }

        if (matchingBlog && matchingBlog.length > 0) {
          // 3. 연결 업데이트
          const { error: updateError } = await supabase
            .from('cc_content_calendar')
            .update({ 
              blog_post_id: matchingBlog[0].id,
              updated_at: new Date().toISOString()
            })
            .eq('id', hubContent.id);

          if (updateError) {
            console.error(`❌ 연결 업데이트 오류 (${hubContent.title}):`, updateError);
          } else {
            console.log(`✅ 연결 완료: ${hubContent.title} → ${matchingBlog[0].id}`);
            connectedCount++;
          }
        } else {
          console.log(`⚠️ 매칭되는 블로그 포스트 없음: ${hubContent.title}`);
        }
      } catch (itemError) {
        console.error(`❌ 개별 항목 처리 오류 (${hubContent.title}):`, itemError);
      }
    }

    console.log(`✅ 누락된 blog_post_id 연결 완료: ${connectedCount}개`);

    return res.status(200).json({
      success: true,
      message: `누락된 blog_post_id 연결 완료: ${connectedCount}개`,
      connectedCount,
      totalMissing: missingHubContent.length
    });

  } catch (error) {
    console.error('❌ 누락된 blog_post_id 연결 오류:', error);
    return res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error.message
    });
  }
}
