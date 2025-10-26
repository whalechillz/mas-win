/**
 * 누락된 blog_post_id 연결을 수정하는 API
 * 기존 블로그 포스트와 허브 콘텐츠를 연결
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔧 누락된 blog_post_id 연결 수정 시작...');

    // 1. blog_post_id가 null인 허브 콘텐츠 조회
    const { data: hubContents, error: hubError } = await supabase
      .from('cc_content_calendar')
      .select('*')
      .is('blog_post_id', null)
      .order('created_at', { ascending: false });

    if (hubError) {
      throw new Error(`허브 콘텐츠 조회 실패: ${hubError.message}`);
    }

    console.log(`📋 blog_post_id가 누락된 허브 콘텐츠: ${hubContents.length}개`);

    if (hubContents.length === 0) {
      return res.status(200).json({
        success: true,
        message: '수정할 누락된 연결이 없습니다.',
        fixedCount: 0
      });
    }

    // 2. 각 허브 콘텐츠에 대해 매칭되는 블로그 포스트 찾기
    let fixedCount = 0;
    const results = [];

    for (const hubContent of hubContents) {
      try {
        // 제목으로 매칭되는 블로그 포스트 찾기
        const { data: blogPosts, error: blogError } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('title', hubContent.title)
          .order('created_at', { ascending: false });

        if (blogError) {
          console.error(`❌ 블로그 포스트 조회 실패 (${hubContent.title}):`, blogError);
          continue;
        }

        if (blogPosts.length === 0) {
          console.log(`⚠️ 매칭되는 블로그 포스트 없음: ${hubContent.title}`);
          results.push({
            hubId: hubContent.id,
            title: hubContent.title,
            status: 'no_match',
            message: '매칭되는 블로그 포스트가 없습니다.'
          });
          continue;
        }

        // 가장 최근 블로그 포스트 사용
        const blogPost = blogPosts[0];

        // 3. 허브 콘텐츠에 blog_post_id 업데이트
        const { error: updateError } = await supabase
          .from('cc_content_calendar')
          .update({ 
            blog_post_id: blogPost.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', hubContent.id);

        if (updateError) {
          console.error(`❌ blog_post_id 업데이트 실패 (${hubContent.title}):`, updateError);
          results.push({
            hubId: hubContent.id,
            title: hubContent.title,
            status: 'update_failed',
            message: `업데이트 실패: ${updateError.message}`
          });
          continue;
        }

        // 4. channel_status도 업데이트
        const currentStatus = hubContent.channel_status || {};
        const updatedStatus = {
          ...currentStatus,
          blog: {
            status: '연결됨',
            post_id: blogPost.id,
            created_at: new Date().toISOString()
          }
        };

        const { error: statusError } = await supabase
          .from('cc_content_calendar')
          .update({ channel_status: updatedStatus })
          .eq('id', hubContent.id);

        if (statusError) {
          console.error(`❌ channel_status 업데이트 실패 (${hubContent.title}):`, statusError);
        }

        console.log(`✅ 연결 완료: ${hubContent.title} → ${blogPost.id}`);
        fixedCount++;

        results.push({
          hubId: hubContent.id,
          blogId: blogPost.id,
          title: hubContent.title,
          status: 'success',
          message: '성공적으로 연결되었습니다.'
        });

      } catch (error) {
        console.error(`❌ 처리 중 오류 (${hubContent.title}):`, error);
        results.push({
          hubId: hubContent.id,
          title: hubContent.title,
          status: 'error',
          message: `처리 중 오류: ${error.message}`
        });
      }
    }

    console.log(`✅ 누락된 blog_post_id 연결 수정 완료: ${fixedCount}개`);

    return res.status(200).json({
      success: true,
      message: `누락된 blog_post_id 연결 수정 완료`,
      fixedCount,
      totalProcessed: hubContents.length,
      results
    });

  } catch (error) {
    console.error('❌ 누락된 blog_post_id 연결 수정 오류:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
