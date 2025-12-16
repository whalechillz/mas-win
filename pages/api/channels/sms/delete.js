import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: '메시지 ID는 필수입니다.'
      });
    }

    // ✅ SMS 데이터 조회 (calendar_id 포함)
    const { data: smsData, error: readErr } = await supabase
      .from('channel_sms')
      .select('id, status, solapi_group_id, solapi_message_id, calendar_id')
      .eq('id', id)
      .single();
      
    if (readErr || !smsData) {
      console.error('삭제 전 조회 오류:', readErr);
      return res.status(404).json({
        success: false,
        message: 'SMS 메시지를 찾을 수 없습니다.'
      });
    }

    const linkedWithSolapi = !!(smsData?.solapi_group_id || smsData?.solapi_message_id);

    let error;
    if (!linkedWithSolapi) {
      // 실제 삭제 (초안 또는 Solapi 미연동 데이터)
      ({ error } = await supabase.from('channel_sms').delete().eq('id', id));
    } else {
      // 보관(소프트 삭제)
      ({ error } = await supabase
        .from('channel_sms')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id));
    }

    if (error) {
      console.error('SMS 삭제 오류:', error);
      return res.status(500).json({
        success: false,
        message: 'SMS 삭제 중 오류가 발생했습니다.',
        error: error.message
      });
    }

    // ✅ 허브 상태 완전 동기화 (SMS 삭제 시 channel_status에서 해당 SMS 채널 제거)
    if (smsData?.calendar_id) {
      try {
        // 허브 콘텐츠 조회
        const { data: hubContent, error: fetchError } = await supabase
          .from('cc_content_calendar')
          .select('channel_status')
          .eq('id', smsData.calendar_id)
          .single();

        if (!fetchError && hubContent) {
          // channel_status에서 SMS 관련 동적 채널 찾기
          const currentChannels = hubContent.channel_status || {};
          const updatedChannels = { ...currentChannels };
          
          // ✅ SMS 관련 채널 키 찾아서 삭제
          // 1. 동적 채널 키 찾기 (sms_로 시작하는 키들)
          const smsChannelKeys = Object.keys(updatedChannels).filter(key => 
            key.startsWith('sms_') && updatedChannels[key]?.post_id === id.toString()
          );
          
          // 2. 기본 'sms' 채널 확인
          const isDefaultSMS = updatedChannels['sms']?.post_id === id.toString();
          
          // 3. 찾은 채널 키들 삭제
          smsChannelKeys.forEach(key => {
            delete updatedChannels[key];
          });
          
          // 4. 기본 SMS 채널이 삭제된 경우 처리
          if (isDefaultSMS) {
            // 다른 SMS가 있는지 확인
            const { data: otherSMS, error: smsCheckError } = await supabase
              .from('channel_sms')
              .select('id')
              .eq('calendar_id', smsData.calendar_id)
              .is('deleted_at', null)
              .neq('id', id)
              .limit(1);
            
            if (!smsCheckError && otherSMS && otherSMS.length > 0) {
              // 다른 SMS가 있으면 첫 번째 SMS로 기본 채널 업데이트
              updatedChannels['sms'] = {
                status: '수정중',
                post_id: otherSMS[0].id.toString(),
                updated_at: new Date().toISOString()
              };
            } else {
              // 다른 SMS가 없으면 미발행으로 변경
              updatedChannels['sms'] = {
                status: '미발행',
                post_id: null,
                updated_at: new Date().toISOString()
              };
            }
          }

          // ✅ 허브 콘텐츠 업데이트 (다른 채널은 그대로 유지)
          const { error: updateError } = await supabase
            .from('cc_content_calendar')
            .update({
              channel_status: updatedChannels,
              updated_at: new Date().toISOString()
            })
            .eq('id', smsData.calendar_id);

          if (updateError) {
            console.error('❌ SMS 삭제 후 허브 상태 업데이트 실패:', updateError);
          } else {
            console.log('✅ SMS 삭제 후 허브 상태 완전 동기화 완료 (동적 채널 키 포함)');
          }
        }
      } catch (syncError) {
        console.error('❌ SMS 삭제 후 허브 상태 동기화 오류:', syncError);
        // 동기화 실패해도 SMS 삭제는 성공한 것으로 처리
      }
    }

    return res.status(200).json({
      success: true,
      message: linkedWithSolapi ? '보관 처리되었습니다.' : '완전 삭제되었습니다.'
    });

  } catch (error) {
    console.error('SMS 삭제 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
}
