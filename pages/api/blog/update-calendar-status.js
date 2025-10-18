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

    // 2. 콘텐츠 캘린더에서 해당 블로그 찾기 (허브 시스템에 맞게 수정)
    const { data: calendarItems, error: calendarError } = await supabase
      .from('cc_content_calendar')
      .select('*')
      .eq('blog_post_id', blogPostId);

    if (calendarError) {
      console.error('콘텐츠 캘린더 조회 오류:', calendarError);
      throw new Error('콘텐츠 캘린더 조회 실패');
    }

    // 3. 콘텐츠 캘린더 상태 업데이트 (허브 시스템에 맞게 수정)
    if (calendarItems && calendarItems.length > 0) {
      // 채널별 상태 업데이트 (허브 시스템 방식)
      const currentChannelStatus = calendarItems[0].channel_status || {};
      currentChannelStatus.blog = {
        status: status === 'published' ? '연결됨' : '미연결',
        post_id: blogPostId,
        updated_at: new Date().toISOString()
      };

      const { data: updatedCalendar, error: updateCalendarError } = await supabase
        .from('cc_content_calendar')
        .update({
          channel_status: currentChannelStatus,
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
      // 콘텐츠 캘린더에 등록되지 않은 블로그인 경우 새로 등록 (허브 시스템 방식)
      const { data: newCalendarItem, error: insertError } = await supabase
        .from('cc_content_calendar')
        .insert({
          title: updatedBlog.title,
          summary: updatedBlog.excerpt || updatedBlog.content.substring(0, 200),
          content_body: updatedBlog.content,
          content_date: new Date().toISOString().split('T')[0],
          blog_post_id: blogPostId,
          channel_status: {
            blog: {
              status: status === 'published' ? '연결됨' : '미연결',
              post_id: blogPostId,
              created_at: new Date().toISOString()
            },
            sms: { status: '미발행', post_id: null, created_at: null },
            naver_blog: { status: '미발행', post_id: null, created_at: null },
            kakao: { status: '미발행', post_id: null, created_at: null }
          },
          is_hub_content: true,
          hub_priority: 1,
          auto_derive_channels: ['blog', 'sms', 'naver_blog', 'kakao']
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
