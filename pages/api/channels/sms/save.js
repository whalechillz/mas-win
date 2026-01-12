import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // 요청 본문 전체 로깅
    console.log('[save.js] 요청 본문 전체:', {
      body: req.body,
      bodyKeys: Object.keys(req.body || {}),
      bodyStringified: JSON.stringify(req.body, null, 2),
    });

    const {
      calendarId,
      blogPostId,
      messageType,
      messageText,
      shortLink,
      imageUrl,
      recipientNumbers,
      status = 'draft',
      messageCategory, // 메시지 카테고리: 'booking' | 'promotion' | 'prize' | 'order' | null
      messageSubcategory // 메시지 서브 카테고리: 'prize_winner' | 'booking_received' | 등
    } = req.body;

    // 필수 필드 검증
    if (!messageType || !messageText) {
      return res.status(400).json({ 
        success: false, 
        message: '메시지 타입과 내용은 필수입니다.' 
      });
    }

    // recipientNumbers 검증 (배열이어야 하고, 최소 1개 이상 있어야 함)
    if (!recipientNumbers || !Array.isArray(recipientNumbers) || recipientNumbers.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: '수신자 번호는 최소 1개 이상 필요합니다.' 
      });
    }

    // 메시지 타입 검증
    if (!['SMS', 'SMS300', 'LMS', 'MMS'].includes(messageType)) {
      return res.status(400).json({ 
        success: false, 
        message: '메시지 타입은 SMS, SMS300, LMS, MMS 중 하나여야 합니다.' 
      });
    }

    // 문자 길이 검증
    if (messageType === 'SMS' && messageText.length > 90) {
      return res.status(400).json({ 
        success: false, 
        message: 'SMS는 90자를 초과할 수 없습니다.' 
      });
    }

    if (messageType === 'SMS300' && messageText.length > 300) {
      return res.status(400).json({ 
        success: false, 
        message: 'SMS300은 300자를 초과할 수 없습니다.' 
      });
    }

    if (messageType === 'LMS' && messageText.length > 2000) {
      return res.status(400).json({ 
        success: false, 
        message: 'LMS는 2000자를 초과할 수 없습니다.' 
      });
    }

    // 데이터베이스에 저장
    const insertData = {
        calendar_id: calendarId || null,
        blog_post_id: blogPostId || null,
        message_type: messageType,
        message_text: messageText,
        short_link: shortLink || null,
        image_url: imageUrl || null,
        recipient_numbers: recipientNumbers || [],
      status: status,
      message_category: messageCategory || null,
      message_subcategory: messageSubcategory || null
    };

    console.log('[save.js] 저장할 데이터:', {
      messageType,
      messageTextLength: messageText.length,
      recipientNumbers: recipientNumbers,
      recipientNumbersType: typeof recipientNumbers,
      recipientNumbersIsArray: Array.isArray(recipientNumbers),
      recipientNumbersCount: recipientNumbers?.length || 0,
      messageCategory,
      messageSubcategory,
      status,
      insertDataKeys: Object.keys(insertData),
      insertDataRecipientNumbers: insertData.recipient_numbers,
      insertDataRecipientNumbersType: typeof insertData.recipient_numbers,
      insertDataRecipientNumbersIsArray: Array.isArray(insertData.recipient_numbers),
    });

    const { data, error } = await supabase
      .from('channel_sms')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[save.js] SMS 저장 오류 상세:', {
        error: error,
        errorMessage: error.message,
        errorCode: error.code,
        errorDetails: error.details,
        errorHint: error.hint,
        insertData: insertData,
        insertDataStringified: JSON.stringify(insertData, null, 2),
        recipientNumbersValue: insertData.recipient_numbers,
        recipientNumbersStringified: JSON.stringify(insertData.recipient_numbers),
      });
      return res.status(500).json({ 
        success: false, 
        message: 'SMS 저장 중 오류가 발생했습니다.',
        error: error.message,
        errorCode: error.code,
        errorDetails: error.details,
        errorHint: error.hint,
        debugInfo: {
          messageType,
          messageTextLength: messageText.length,
          recipientNumbersCount: recipientNumbers?.length || 0,
        }
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
