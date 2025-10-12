// 블로그 배포 완료 시 콘텐츠 캘린더 상태 업데이트
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '설정됨' : '없음');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '설정됨' : '없음');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
    return res.status(500).json({ 
      success: false, 
      message: '서버 설정 오류',
      error: 'Supabase 환경 변수가 설정되지 않았습니다'
    });
  }

  const { blogPostId, status, publishedAt, publishedChannels } = req.body;

  if (!blogPostId || !status) {
    return res.status(400).json({ message: 'Missing required fields: blogPostId, status' });
  }

  try {
    // 1. 블로그 포스트 상태 업데이트
    const { data: updatedBlog, error: blogError } = await supabase
      .from('blog_posts')
      .update({
        status: status,
        published_at: publishedAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', blogPostId)
      .select()
      .single();

    if (blogError) {
      console.error('블로그 상태 업데이트 오류:', blogError);
      throw new Error('블로그 상태 업데이트 실패');
    }

    // 2. 콘텐츠 캘린더에서 해당 블로그 찾기
    const { data: calendarItems, error: calendarError } = await supabase
      .from('cc_content_calendar')
      .select('*')
      .eq('blog_post_id', blogPostId);

    if (calendarError) {
      console.error('콘텐츠 캘린더 조회 오류:', calendarError);
      throw new Error('콘텐츠 캘린더 조회 실패');
    }

    // 3. 콘텐츠 캘린더 상태 업데이트
    if (calendarItems && calendarItems.length > 0) {
      const { data: updatedCalendar, error: updateCalendarError } = await supabase
        .from('cc_content_calendar')
        .update({
          status: status,
          published_channels: publishedChannels || ['blog'],
          updated_at: new Date().toISOString()
        })
        .eq('blog_post_id', blogPostId)
        .select();

      if (updateCalendarError) {
        console.error('콘텐츠 캘린더 상태 업데이트 오류:', updateCalendarError);
        throw new Error('콘텐츠 캘린더 상태 업데이트 실패');
      }

      console.log(`✅ 콘텐츠 캘린더 상태 업데이트 완료: ${blogPostId} -> ${status}`);
    } else {
      // 콘텐츠 캘린더에 등록되지 않은 블로그인 경우 새로 등록
      const { data: newCalendarItem, error: insertError } = await supabase
        .from('cc_content_calendar')
        .insert({
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          content_date: new Date().toISOString().split('T')[0],
          theme: updatedBlog.title,
          content_type: 'blog',
          title: updatedBlog.title,
          description: updatedBlog.excerpt || updatedBlog.content.substring(0, 200),
          content_body: updatedBlog.content,
          status: status,
          published_channels: publishedChannels || ['blog'],
          blog_post_id: blogPostId,
          target_audience: {
            persona: '일반',
            stage: 'awareness'
          },
          conversion_tracking: {
            landingPage: 'https://win.masgolf.co.kr',
            goal: '홈페이지 방문',
            utmParams: {
              source: 'blog',
              medium: 'organic',
              campaign: updatedBlog.category || '일반'
            }
          },
          seo_meta: {
            title: updatedBlog.meta_title || updatedBlog.title,
            description: updatedBlog.meta_description || updatedBlog.excerpt,
            keywords: updatedBlog.meta_keywords || ''
          }
        })
        .select()
        .single();

      if (insertError) {
        console.error('콘텐츠 캘린더 등록 오류:', insertError);
        throw new Error('콘텐츠 캘린더 등록 실패');
      }

      console.log(`✅ 콘텐츠 캘린더에 새로 등록: ${blogPostId}`);
    }

    res.status(200).json({ 
      success: true, 
      message: '블로그 및 콘텐츠 캘린더 상태가 업데이트되었습니다.',
      blogPost: updatedBlog,
      status: status
    });

  } catch (error) {
    console.error('상태 업데이트 오류:', error);
    res.status(500).json({ 
      success: false, 
      message: '상태 업데이트 실패', 
      error: error.message 
    });
  }
}
