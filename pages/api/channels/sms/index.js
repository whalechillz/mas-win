import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      messageType,
      calendarId,
      blogPostId 
    } = req.query;

    // 쿼리 조건 구성
    let query = supabase
      .from('channel_sms')
      .select(`
        *,
        cc_content_calendar!inner(title, content_date),
        blog_posts!inner(title, slug)
      `)
      .order('created_at', { ascending: false });

    // 필터 조건 추가
    if (status) {
      query = query.eq('status', status);
    }
    if (messageType) {
      query = query.eq('message_type', messageType);
    }
    if (calendarId) {
      query = query.eq('calendar_id', calendarId);
    }
    if (blogPostId) {
      query = query.eq('blog_post_id', blogPostId);
    }

    // 페이지네이션
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: posts, error, count } = await query;

    if (error) {
      console.error('SMS 목록 조회 오류:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'SMS 목록 조회 중 오류가 발생했습니다.' 
      });
    }

    // 응답 데이터 변환
    const transformedPosts = posts.map(post => ({
      id: post.id,
      calendarId: post.calendar_id,
      blogPostId: post.blog_post_id,
      messageType: post.message_type,
      messageText: post.message_text,
      shortLink: post.short_link,
      imageUrl: post.image_url,
      recipientNumbers: post.recipient_numbers,
      status: post.status,
      solapiGroupId: post.solapi_group_id,
      solapiMessageId: post.solapi_message_id,
      sentAt: post.sent_at,
      sentCount: post.sent_count,
      successCount: post.success_count,
      failCount: post.fail_count,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
      // 관련 데이터
      calendarTitle: post.cc_content_calendar?.title,
      calendarDate: post.cc_content_calendar?.content_date,
      blogTitle: post.blog_posts?.title,
      blogSlug: post.blog_posts?.slug
    }));

    return res.status(200).json({ 
      success: true, 
      posts: transformedPosts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('SMS 목록 API 오류:', error);
    return res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.',
      error: error.message 
    });
  }
}
