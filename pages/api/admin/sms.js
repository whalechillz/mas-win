// SMS 관리 API
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // SMS 조회
    const { hub_content_id, id } = req.query;

    try {
      let query = supabase.from('sms_messages').select('*');

      if (hub_content_id) {
        // 허브 콘텐츠 ID로 SMS 조회
        query = query.eq('hub_content_id', hub_content_id);
      } else if (id) {
        // 특정 SMS ID로 조회
        query = query.eq('id', id);
      }

      const { data: smsContent, error } = await query.single();

      if (error) {
        console.error('❌ SMS 조회 오류:', error);
        return res.status(404).json({
          success: false,
          message: 'SMS 콘텐츠를 찾을 수 없습니다.',
          error: error.message
        });
      }

      return res.status(200).json({
        success: true,
        smsContent: smsContent
      });

    } catch (error) {
      console.error('❌ SMS 조회 오류:', error);
      return res.status(500).json({
        success: false,
        message: 'SMS 조회 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  if (req.method === 'POST') {
    // SMS 생성
    const { message, type, status, hub_content_id } = req.body;

    try {
      const { data: newSMS, error } = await supabase
        .from('sms_messages')
        .insert({
          message,
          type: type || 'SMS300',
          status: status || 'draft',
          hub_content_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ SMS 생성 오류:', error);
        return res.status(500).json({
          success: false,
          message: 'SMS 생성에 실패했습니다.',
          error: error.message
        });
      }

      // 허브 콘텐츠의 SMS 상태 동기화
      if (hub_content_id) {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/sync-channel-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hubContentId: hub_content_id,
            channel: 'sms',
            channelContentId: newSMS.id,
            status: '수정중'
          })
        });
      }

      return res.status(200).json({
        success: true,
        message: 'SMS가 생성되었습니다.',
        smsId: newSMS.id,
        smsContent: newSMS
      });

    } catch (error) {
      console.error('❌ SMS 생성 오류:', error);
      return res.status(500).json({
        success: false,
        message: 'SMS 생성 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
