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
      let query = supabase.from('channel_sms').select('*');

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
    const { message, type, status, hub_content_id, calendar_id, recipientNumbers, imageUrl, shortLink, note, scheduledAt, honorific } = req.body;

    try {
      const insertData = {
        message_text: message || '새 SMS 메시지를 입력하세요',
        message_type: type || 'SMS300',
        status: status || 'draft',
        calendar_id: calendar_id || hub_content_id || null, // calendar_id 우선 사용
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // 선택적 필드 추가
      if (recipientNumbers) insertData.recipient_numbers = recipientNumbers;
      if (imageUrl) insertData.image_url = imageUrl;
      if (shortLink) insertData.short_link = shortLink;
      if (note) insertData.note = note;
      if (scheduledAt) {
        // scheduledAt이 유효한 ISO 문자열인지 검증하고 UTC로 변환
        try {
          const date = new Date(scheduledAt);
          if (Number.isNaN(date.getTime())) {
            console.error('❌ 잘못된 예약 시간 형식:', scheduledAt);
            throw new Error('유효하지 않은 예약 시간 형식입니다.');
          }
          // UTC ISO 문자열로 명시적 변환
          insertData.scheduled_at = date.toISOString();
          console.log(`✅ 예약 시간 저장: ${scheduledAt} -> ${insertData.scheduled_at}`);
        } catch (error) {
          console.error('❌ 예약 시간 변환 오류:', error);
          throw new Error('예약 시간 변환 중 오류가 발생했습니다.');
        }
      }
      if (honorific) insertData.honorific = honorific;

      const { data: newSMS, error } = await supabase
        .from('channel_sms')
        .insert(insertData)
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

      // 허브 콘텐츠의 SMS 상태 동기화 (허브 연동이 있는 경우)
      const hubId = calendar_id || hub_content_id;
      if (hubId) {
        try {
          const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/sync-channel-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              hubContentId: hubId,
              channel: 'sms',
              channelContentId: newSMS.id,
              status: '수정중'
            })
          });
          
          if (syncResponse.ok) {
            console.log('✅ 허브 상태 동기화 완료');
          } else {
            console.error('❌ 허브 상태 동기화 실패');
          }
        } catch (syncError) {
          console.error('❌ 허브 상태 동기화 오류:', syncError);
        }
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

  if (req.method === 'PUT') {
    // SMS 수정
    const { id, message, type, status, hub_content_id, calendar_id, recipientNumbers, imageUrl, shortLink, note, scheduledAt, honorific } = req.body;

    if (!id) {
      console.error('❌ SMS 수정 오류: ID가 필요합니다.');
      return res.status(400).json({
        success: false,
        message: 'SMS ID가 필요합니다.',
        error: 'Missing SMS ID'
      });
    }

    try {
        const updateData = {
          message_text: message,
          message_type: type || 'SMS300',
          status: status || 'draft',
          calendar_id: calendar_id || hub_content_id || null, // calendar_id 업데이트
          updated_at: new Date().toISOString()
        };

        // 선택적 필드 업데이트
        if (recipientNumbers !== undefined) updateData.recipient_numbers = recipientNumbers;
        if (imageUrl !== undefined) updateData.image_url = imageUrl;
        if (shortLink !== undefined) updateData.short_link = shortLink;
        if (note !== undefined) updateData.note = note;
        if (scheduledAt !== undefined) {
          // scheduledAt이 유효한 ISO 문자열인지 검증하고 UTC로 변환
          if (scheduledAt) {
            try {
              const date = new Date(scheduledAt);
              if (Number.isNaN(date.getTime())) {
                console.error('❌ 잘못된 예약 시간 형식:', scheduledAt);
                throw new Error('유효하지 않은 예약 시간 형식입니다.');
              }
              // UTC ISO 문자열로 명시적 변환
              updateData.scheduled_at = date.toISOString();
              console.log(`✅ 예약 시간 저장: ${scheduledAt} -> ${updateData.scheduled_at}`);
            } catch (error) {
              console.error('❌ 예약 시간 변환 오류:', error);
              throw new Error('예약 시간 변환 중 오류가 발생했습니다.');
            }
          } else {
            updateData.scheduled_at = null;
          }
        }
        if (honorific !== undefined) updateData.honorific = honorific;

        const { data: updatedSMS, error } = await supabase
          .from('channel_sms')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

      if (error) {
        console.error('❌ SMS 수정 오류:', error);
        return res.status(500).json({
          success: false,
          message: 'SMS 수정에 실패했습니다.',
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
            channelContentId: updatedSMS.id,
            status: '수정중'
          })
        });
      }

      return res.status(200).json({
        success: true,
        message: 'SMS가 수정되었습니다.',
        smsId: updatedSMS.id,
        smsContent: updatedSMS
      });

    } catch (error) {
      console.error('❌ SMS 수정 오류:', error);
      return res.status(500).json({
        success: false,
        message: 'SMS 수정 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  if (req.method === 'DELETE') {
    // SMS 삭제
    const { id } = req.body;

    if (!id) {
      console.error('❌ SMS 삭제 오류: ID가 필요합니다.');
      return res.status(400).json({
        success: false,
        message: 'SMS ID가 필요합니다.',
        error: 'Missing SMS ID'
      });
    }

    try {
      // SMS 삭제 전에 허브 상태 확인
      const { data: smsData, error: fetchError } = await supabase
        .from('channel_sms')
        .select('calendar_id')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('❌ SMS 조회 오류:', fetchError);
        return res.status(404).json({
          success: false,
          message: 'SMS를 찾을 수 없습니다.',
          error: fetchError.message
        });
      }

      // SMS 삭제
      const { error: deleteError } = await supabase
        .from('channel_sms')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('❌ SMS 삭제 오류:', deleteError);
        return res.status(500).json({
          success: false,
          message: 'SMS 삭제에 실패했습니다.',
          error: deleteError.message
        });
      }

      // 허브 상태 동기화 (SMS 삭제 시 상태를 미발행으로 변경)
      if (smsData?.calendar_id) {
        try {
          const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/sync-channel-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              hubContentId: smsData.calendar_id,
              channel: 'sms',
              channelContentId: null,
              status: '미발행'
            })
          });
          
          if (syncResponse.ok) {
            console.log('✅ SMS 삭제 후 허브 상태 동기화 완료');
          } else {
            console.error('❌ SMS 삭제 후 허브 상태 동기화 실패');
          }
        } catch (syncError) {
          console.error('❌ SMS 삭제 후 허브 상태 동기화 오류:', syncError);
        }
      }

      return res.status(200).json({
        success: true,
        message: 'SMS가 삭제되었습니다.'
      });

    } catch (error) {
      console.error('❌ SMS 삭제 오류:', error);
      return res.status(500).json({
        success: false,
        message: 'SMS 삭제 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}

