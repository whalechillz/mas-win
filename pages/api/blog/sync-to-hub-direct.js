import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { blogPostId, hubContentId, title, content, excerpt } = req.body;

    if (!blogPostId || !hubContentId || !title || !content) {
      return res.status(400).json({
        success: false,
        message: '필수 파라미터가 누락되었습니다.'
      });
    }

    console.log('⚡ 직접 허브 동기화 시작:', { blogPostId, hubContentId, title });

    // 1. 블로그 포스트 정보 조회
    const { data: blogPost, error: blogError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', blogPostId)
      .single();

    if (blogError || !blogPost) {
      console.error('❌ 블로그 포스트 조회 실패:', blogError);
      return res.status(404).json({
        success: false,
        message: '블로그 포스트를 찾을 수 없습니다.'
      });
    }

    // 2. 허브 콘텐츠 정보 조회
    const { data: hubContent, error: hubError } = await supabase
      .from('cc_content_calendar')
      .select('*')
      .eq('id', hubContentId)
      .single();

    if (hubError || !hubContent) {
      console.error('❌ 허브 콘텐츠 조회 실패:', hubError);
      return res.status(404).json({
        success: false,
        message: '허브 콘텐츠를 찾을 수 없습니다.'
      });
    }

    // 3. 직접 동기화: 블로그 내용을 그대로 복사
    // 이미지 링크를 [이미지] 텍스트로 변환
    const processedContent = content
      .replace(/<img[^>]*src="[^"]*"[^>]*>/gi, '[이미지]')
      .replace(/<img[^>]*>/gi, '[이미지]')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<p[^>]*>/gi, '')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]*>/g, '') // 모든 HTML 태그 제거
      .replace(/\n\s*\n/g, '\n\n') // 연속된 줄바꿈 정리
      .trim();

    // 요약 생성 (excerpt가 있으면 사용, 없으면 내용의 앞부분)
    const directSummary = excerpt || 
      (processedContent.length > 100 
        ? processedContent.substring(0, 100) + '...' 
        : processedContent);

    // 4. 허브 콘텐츠 업데이트
    const { error: updateError } = await supabase
      .from('cc_content_calendar')
      .update({
        title: title,
        summary: directSummary,
        content_body: processedContent,
        updated_at: new Date().toISOString()
      })
      .eq('id', hubContentId);

    if (updateError) {
      console.error('❌ 허브 콘텐츠 업데이트 실패:', updateError);
      return res.status(500).json({
        success: false,
        message: '허브 콘텐츠 업데이트에 실패했습니다.',
        error: updateError.message
      });
    }

    // 5. 채널 상태 업데이트
    const { error: statusError } = await supabase
      .from('cc_content_calendar')
      .update({
        channel_status: {
          ...hubContent.channel_status,
          blog: {
            status: '연결됨',
            post_id: blogPostId,
            updated_at: new Date().toISOString()
          }
        }
      })
      .eq('id', hubContentId);

    if (statusError) {
      console.error('⚠️ 채널 상태 업데이트 실패:', statusError);
      // 상태 업데이트 실패는 치명적이지 않으므로 경고만 로그
    }

    console.log('✅ 직접 허브 동기화 완료:', { hubContentId, directSummary });

    return res.status(200).json({
      success: true,
      message: '직접 허브 콘텐츠가 성공적으로 동기화되었습니다.',
      data: {
        hubContentId,
        title,
        summary: directSummary,
        content: processedContent
      }
    });

  } catch (error) {
    console.error('❌ 직접 허브 동기화 오류:', error);
    return res.status(500).json({
      success: false,
      message: '직접 허브 동기화 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}
