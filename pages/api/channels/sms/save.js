import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const {
      calendarId,
      blogPostId,
      messageType,
      messageText,
      shortLink,
      imageUrl,
      recipientNumbers,
      status = 'draft'
    } = req.body;

    // 필수 필드 검증
    if (!messageType || !messageText) {
      return res.status(400).json({ 
        success: false, 
        message: '메시지 타입과 내용은 필수입니다.' 
      });
    }

    // 메시지 타입 검증
    if (!['SMS', 'LMS', 'MMS'].includes(messageType)) {
      return res.status(400).json({ 
        success: false, 
        message: '메시지 타입은 SMS, LMS, MMS 중 하나여야 합니다.' 
      });
    }

    // 문자 길이 검증
    if (messageType === 'SMS' && messageText.length > 90) {
      return res.status(400).json({ 
        success: false, 
        message: 'SMS는 90자를 초과할 수 없습니다.' 
      });
    }

    if (messageType === 'LMS' && messageText.length > 2000) {
      return res.status(400).json({ 
        success: false, 
        message: 'LMS는 2000자를 초과할 수 없습니다.' 
      });
    }

    // 데이터베이스에 저장
    const { data, error } = await supabase
      .from('channel_sms')
      .insert({
        calendar_id: calendarId || null,
        blog_post_id: blogPostId || null,
        message_type: messageType,
        message_text: messageText,
        short_link: shortLink || null,
        image_url: imageUrl || null,
        recipient_numbers: recipientNumbers || [],
        status: status
      })
      .select()
      .single();

    if (error) {
      console.error('SMS 저장 오류:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'SMS 저장 중 오류가 발생했습니다.',
        error: error.message 
      });
    }

    return res.status(200).json({ 
      success: true, 
      channelPostId: data.id,
      message: 'SMS가 성공적으로 저장되었습니다.' 
    });

  } catch (error) {
    console.error('SMS 저장 오류:', error);
    return res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.',
      error: error.message 
    });
  }
}
