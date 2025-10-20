// 동적 채널 관리 API
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // 채널 추가
    const { hubContentId, channelType, accountName } = req.body;

    if (!hubContentId || !channelType || !accountName) {
      return res.status(400).json({
        success: false,
        message: '필수 파라미터가 누락되었습니다.',
        error: 'Missing required parameters'
      });
    }

    try {
      // 현재 허브 콘텐츠 조회
      const { data: hubContent, error: fetchError } = await supabase
        .from('cc_content_calendar')
        .select('channel_status')
        .eq('id', hubContentId)
        .single();

      if (fetchError) {
        console.error('❌ 허브 콘텐츠 조회 오류:', fetchError);
        return res.status(404).json({
          success: false,
          message: '허브 콘텐츠를 찾을 수 없습니다.',
          error: fetchError.message
        });
      }

      // 새 채널 키 생성 (타입_타임스탬프)
      const channelKey = `${channelType}_${Date.now()}`;
      
      // 현재 채널 상태에 새 채널 추가
      const currentChannels = hubContent.channel_status || {};
      const newChannel = {
        status: '미발행',
        post_id: null,
        account_name: accountName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const updatedChannels = {
        ...currentChannels,
        [channelKey]: newChannel
      };

      // 허브 콘텐츠 업데이트
      const { data: updatedContent, error: updateError } = await supabase
        .from('cc_content_calendar')
        .update({
          channel_status: updatedChannels,
          updated_at: new Date().toISOString()
        })
        .eq('id', hubContentId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ 채널 추가 오류:', updateError);
        return res.status(500).json({
          success: false,
          message: '채널 추가에 실패했습니다.',
          error: updateError.message
        });
      }

      console.log('✅ 새 채널 추가 완료:', { channelKey, accountName });

      return res.status(200).json({
        success: true,
        message: `새 ${channelType} 채널이 추가되었습니다.`,
        channelKey: channelKey,
        channelData: newChannel,
        updatedContent: updatedContent
      });

    } catch (error) {
      console.error('❌ 채널 추가 오류:', error);
      return res.status(500).json({
        success: false,
        message: '채널 추가 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  if (req.method === 'DELETE') {
    // 채널 삭제
    const { hubContentId, channelKey } = req.body;

    if (!hubContentId || !channelKey) {
      return res.status(400).json({
        success: false,
        message: '필수 파라미터가 누락되었습니다.',
        error: 'Missing required parameters'
      });
    }

    try {
      // 현재 허브 콘텐츠 조회
      const { data: hubContent, error: fetchError } = await supabase
        .from('cc_content_calendar')
        .select('channel_status')
        .eq('id', hubContentId)
        .single();

      if (fetchError) {
        console.error('❌ 허브 콘텐츠 조회 오류:', fetchError);
        return res.status(404).json({
          success: false,
          message: '허브 콘텐츠를 찾을 수 없습니다.',
          error: fetchError.message
        });
      }

      // 채널 삭제
      const currentChannels = hubContent.channel_status || {};
      if (!currentChannels[channelKey]) {
        return res.status(404).json({
          success: false,
          message: '삭제할 채널을 찾을 수 없습니다.',
          error: 'Channel not found'
        });
      }

      const updatedChannels = { ...currentChannels };
      delete updatedChannels[channelKey];

      // 허브 콘텐츠 업데이트
      const { data: updatedContent, error: updateError } = await supabase
        .from('cc_content_calendar')
        .update({
          channel_status: updatedChannels,
          updated_at: new Date().toISOString()
        })
        .eq('id', hubContentId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ 채널 삭제 오류:', updateError);
        return res.status(500).json({
          success: false,
          message: '채널 삭제에 실패했습니다.',
          error: updateError.message
        });
      }

      console.log('✅ 채널 삭제 완료:', { channelKey });

      return res.status(200).json({
        success: true,
        message: '채널이 삭제되었습니다.',
        deletedChannel: channelKey,
        updatedContent: updatedContent
      });

    } catch (error) {
      console.error('❌ 채널 삭제 오류:', error);
      return res.status(500).json({
        success: false,
        message: '채널 삭제 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: '지원하지 않는 HTTP 메서드입니다.'
  });
}
