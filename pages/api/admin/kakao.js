// 카카오 채널 관리 API (SMS와 동일한 구조)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { id, hub_content_id, status, sortBy = 'sent_at', sortOrder = 'desc' } = req.query;
      
      let query = supabase
        .from('channel_kakao')
        .select('*');

      // 단일 조회 (id가 있으면)
      if (id) {
        query = query.eq('id', id);
      }

      // 허브 콘텐츠 ID로 필터링
      if (hub_content_id) {
        query = query.eq('calendar_id', hub_content_id);
      }

      // 상태 필터링 (id가 없을 때만)
      if (!id && status && status !== 'all') {
        query = query.eq('status', status);
      }

      // 정렬 (id가 없을 때만)
      if (!id) {
        if (sortBy === 'sent_at') {
          query = query.order('sent_at', { ascending: sortOrder === 'asc', nullsFirst: false });
        } else if (sortBy === 'created_at') {
          query = query.order('created_at', { ascending: sortOrder === 'asc' });
        } else {
          query = query.order('created_at', { ascending: false });
        }
      } else {
        // 단일 조회 시 기본 정렬
        query = query.order('created_at', { ascending: false });
      }

      const { data: kakaoChannels, error } = await query;

      if (error) {
        console.error('❌ 카카오 채널 조회 오류:', error);
        return res.status(500).json({
          success: false,
          message: '카카오 채널 조회에 실패했습니다.',
          error: error.message
        });
      }

      // content 필드가 없으면 message_text 사용
      const processedChannels = (kakaoChannels || []).map(channel => ({
        ...channel,
        content: channel.content || channel.message_text || ''
      }));

      return res.status(200).json({
        success: true,
        data: processedChannels
      });

    } catch (error) {
      console.error('❌ 카카오 채널 조회 중 오류:', error);
      return res.status(500).json({
        success: false,
        message: '카카오 채널 조회 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  if (req.method === 'POST') {
    // 카카오 채널 생성
    try {
      const { 
        title, 
        content, 
        message_type, 
        template_id, 
        button_text, 
        button_link, 
        recipient_uuids, 
        status, 
        hub_content_id 
      } = req.body;

      if (!title || !content) {
        return res.status(400).json({
          success: false,
          message: '제목과 내용은 필수입니다.'
        });
      }

      const { data: newKakaoChannel, error } = await supabase
        .from('channel_kakao')
        .insert({
          title,
          content,
          message_type: message_type || 'ALIMTALK',
          template_id: template_id || null,
          button_text: button_text || null,
          button_link: button_link || null,
          recipient_uuids: recipient_uuids || [],
          status: status || 'draft',
          calendar_id: hub_content_id || null, // 허브 ID를 calendar_id에 저장
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ 카카오 채널 생성 오류:', error);
        return res.status(500).json({
          success: false,
          message: '카카오 채널 생성에 실패했습니다.',
          error: error.message
        });
      }

      // 허브 상태 동기화
      if (hub_content_id) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/sync-channel-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              hubContentId: hub_content_id,
              channel: 'kakao',
              channelContentId: newKakaoChannel.id,
              status: '수정중'
            })
          });
        } catch (syncError) {
          console.error('❌ 허브 상태 동기화 오류:', syncError);
        }
      }

      return res.status(200).json({
        success: true,
        message: '카카오 채널이 생성되었습니다.',
        kakaoChannelId: newKakaoChannel.id,
        kakaoChannelContent: newKakaoChannel
      });

    } catch (error) {
      console.error('❌ 카카오 채널 생성 중 오류:', error);
      return res.status(500).json({
        success: false,
        message: '카카오 채널 생성 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  if (req.method === 'PUT') {
    // 카카오 채널 수정
    try {
      const { 
        id, 
        title, 
        content, 
        message_type, 
        template_id, 
        button_text, 
        button_link, 
        recipient_uuids, 
        status, 
        hub_content_id 
      } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: '카카오 채널 ID가 필요합니다.'
        });
      }

      const updateData = {
        updated_at: new Date().toISOString()
      };

      if (title) updateData.title = title;
      if (content) updateData.content = content;
      if (message_type) updateData.message_type = message_type;
      if (template_id !== undefined) updateData.template_id = template_id;
      if (button_text !== undefined) updateData.button_text = button_text;
      if (button_link !== undefined) updateData.button_link = button_link;
      if (recipient_uuids) updateData.recipient_uuids = recipient_uuids;
      if (status) updateData.status = status;
      if (hub_content_id) updateData.calendar_id = hub_content_id;

      const { data: updatedKakaoChannel, error } = await supabase
        .from('channel_kakao')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ 카카오 채널 수정 오류:', error);
        return res.status(500).json({
          success: false,
          message: '카카오 채널 수정에 실패했습니다.',
          error: error.message
        });
      }

      // 허브 상태 동기화
      if (hub_content_id) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/sync-channel-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              hubContentId: hub_content_id,
              channel: 'kakao',
              channelContentId: id,
              status: '수정중'
            })
          });
        } catch (syncError) {
          console.error('❌ 허브 상태 동기화 오류:', syncError);
        }
      }

      return res.status(200).json({
        success: true,
        message: '카카오 채널이 수정되었습니다.',
        kakaoChannelContent: updatedKakaoChannel
      });

    } catch (error) {
      console.error('❌ 카카오 채널 수정 중 오류:', error);
      return res.status(500).json({
        success: false,
        message: '카카오 채널 수정 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  if (req.method === 'DELETE') {
    // 카카오 채널 삭제
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: '카카오 채널 ID가 필요합니다.'
        });
      }

      const { error } = await supabase
        .from('channel_kakao')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ 카카오 채널 삭제 오류:', error);
        return res.status(500).json({
          success: false,
          message: '카카오 채널 삭제에 실패했습니다.',
          error: error.message
        });
      }

      return res.status(200).json({
        success: true,
        message: '카카오 채널이 삭제되었습니다.'
      });

    } catch (error) {
      console.error('❌ 카카오 채널 삭제 중 오류:', error);
      return res.status(500).json({
        success: false,
        message: '카카오 채널 삭제 중 오류가 발생했습니다.',
        error: error.message
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: '허용되지 않은 메서드입니다.'
  });
}
