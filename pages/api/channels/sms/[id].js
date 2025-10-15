import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ success: false, message: 'ID가 필요합니다.' });
  }

  try {
    switch (req.method) {
      case 'GET':
        // SMS 포스트 조회
        const { data: post, error: getError } = await supabase
          .from('channel_sms')
          .select('*')
          .eq('id', id)
          .single();

        if (getError) {
          console.error('SMS 조회 오류:', getError);
          return res.status(404).json({ 
            success: false, 
            message: 'SMS를 찾을 수 없습니다.' 
          });
        }

        return res.status(200).json({ 
          success: true, 
          post: {
            id: post.id,
            calendarId: post.calendar_id,
            blogPostId: post.blog_post_id,
            formData: {
              title: post.message_text.substring(0, 50) + '...',
              content: post.message_text,
              imageUrl: post.image_url,
              shortLink: post.short_link,
              messageType: post.message_type,
              recipientNumbers: post.recipient_numbers,
              status: post.status
            },
            createdAt: post.created_at,
            updatedAt: post.updated_at
          }
        });

      case 'PUT':
        // SMS 포스트 업데이트
        const {
          messageType,
          messageText,
          shortLink,
          imageUrl,
          recipientNumbers,
          status
        } = req.body;

        const updateData = {};
        if (messageType) updateData.message_type = messageType;
        if (messageText) updateData.message_text = messageText;
        if (shortLink !== undefined) updateData.short_link = shortLink;
        if (imageUrl !== undefined) updateData.image_url = imageUrl;
        if (recipientNumbers) updateData.recipient_numbers = recipientNumbers;
        if (status) updateData.status = status;

        const { data: updatedPost, error: updateError } = await supabase
          .from('channel_sms')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (updateError) {
          console.error('SMS 업데이트 오류:', updateError);
          return res.status(500).json({ 
            success: false, 
            message: 'SMS 업데이트 중 오류가 발생했습니다.' 
          });
        }

        return res.status(200).json({ 
          success: true, 
          post: updatedPost,
          message: 'SMS가 성공적으로 업데이트되었습니다.' 
        });

      case 'DELETE':
        // SMS 포스트 삭제
        const { error: deleteError } = await supabase
          .from('channel_sms')
          .delete()
          .eq('id', id);

        if (deleteError) {
          console.error('SMS 삭제 오류:', deleteError);
          return res.status(500).json({ 
            success: false, 
            message: 'SMS 삭제 중 오류가 발생했습니다.' 
          });
        }

        return res.status(200).json({ 
          success: true, 
          message: 'SMS가 성공적으로 삭제되었습니다.' 
        });

      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('SMS API 오류:', error);
    return res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.',
      error: error.message 
    });
  }
}
