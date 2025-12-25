// 채널별 상태 동기화 API
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { hubContentId, channel, channelContentId, status } = req.body;

  try {
    console.log('🔄 채널 상태 동기화 시작:', { hubContentId, channel, channelContentId, status });

    // 허브 콘텐츠 조회
    const { data: hubContent, error: fetchError } = await supabase
      .from('cc_content_calendar')
      .select('*')
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

    // 채널 상태 업데이트
    const currentChannelStatus = hubContent.channel_status || {};
    const currentChannel = currentChannelStatus[channel] || {};
    
    let updatedChannelStatus;
    
    // 블로그 채널의 경우 다중 연결 지원 (posts 배열)
    if (channel === 'blog' && channelContentId) {
      const existingPosts = currentChannel.posts || [];
      const primaryPostId = currentChannel.post_id || currentChannel.primary_post_id;
      
      // posts 배열에 없으면 추가
      if (!existingPosts.includes(channelContentId)) {
        existingPosts.push(channelContentId);
      }
      
      updatedChannelStatus = {
        ...currentChannelStatus,
        [channel]: {
          status: status,
          post_id: primaryPostId || channelContentId, // 기존 호환성 유지
          primary_post_id: primaryPostId || channelContentId, // 대표 블로그
          posts: existingPosts, // 여러 블로그 ID 배열
          created_at: currentChannel.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };
    } else {
      // 다른 채널은 기존 방식 유지
      updatedChannelStatus = {
      ...currentChannelStatus,
      [channel]: {
        status: status,
        post_id: channelContentId,
          created_at: currentChannel.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };
    }

    const { data: updatedContent, error: updateError } = await supabase
      .from('cc_content_calendar')
      .update({
        channel_status: updatedChannelStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', hubContentId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ 채널 상태 업데이트 오류:', updateError);
      return res.status(500).json({
        success: false,
        message: '채널 상태 업데이트에 실패했습니다.',
        error: updateError.message
      });
    }

    console.log('✅ 채널 상태 동기화 완료:', { channel, status });

    return res.status(200).json({
      success: true,
      message: `${channel} 채널 상태가 ${status}로 업데이트되었습니다.`,
      updatedContent: updatedContent
    });

  } catch (error) {
    console.error('❌ 채널 상태 동기화 오류:', error);
    return res.status(500).json({
      success: false,
      message: '채널 상태 동기화 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}
