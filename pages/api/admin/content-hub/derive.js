// 콘텐츠 허브에서 채널별 파생 API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { contentId, channel, action } = req.body;

  if (!contentId || !channel || !action) {
    return res.status(400).json({ 
      error: 'Missing required parameters: contentId, channel, action' 
    });
  }

  try {
    console.log(`🔄 채널 파생 시작: ${contentId} → ${channel}`);

    // 1. 원본 콘텐츠 조회
    const { data: originalContent, error: fetchError } = await supabase
      .from('cc_content_calendar')
      .select('*')
      .eq('id', contentId)
      .single();

    if (fetchError || !originalContent) {
      return res.status(404).json({ error: '원본 콘텐츠를 찾을 수 없습니다.' });
    }

    // 2. 채널별 파생 로직
    let derivedContent = null;
    let channelContentId = null;

    switch (channel) {
      case 'naver_blog':
        derivedContent = await deriveToNaverBlog(originalContent);
        break;
      case 'sms':
        derivedContent = await deriveToSMS(originalContent);
        break;
      case 'blog':
        derivedContent = await deriveToBlog(originalContent);
        break;
      default:
        return res.status(400).json({ error: '지원하지 않는 채널입니다.' });
    }

    // 3. cc_channel_contents 테이블에 파생 상태 기록
    const { data: channelContent, error: channelError } = await supabase
      .from('cc_channel_contents')
      .insert({
        content_calendar_id: contentId,
        channel_type: channel,
        channel_content_id: channelContentId,
        status: 'pending',
        channel_metadata: derivedContent.metadata || {}
      })
      .select()
      .single();

    if (channelError) {
      console.error('❌ 채널 콘텐츠 기록 오류:', channelError);
      return res.status(500).json({ error: '채널 파생 상태 기록에 실패했습니다.' });
    }

    console.log(`✅ 채널 파생 완료: ${channel}`);
    
    return res.status(200).json({
      success: true,
      message: `${channel} 채널로 파생되었습니다.`,
      derivedContent,
      channelContent
    });

  } catch (error) {
    console.error('❌ 채널 파생 오류:', error);
    return res.status(500).json({ 
      error: '채널 파생 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
}

// 네이버 블로그 파생
async function deriveToNaverBlog(originalContent) {
  console.log('📝 네이버 블로그 파생 처리 중...');
  
  // 네이버 블로그 특화 최적화
  const optimizedContent = {
    title: `[네이버] ${originalContent.title}`,
    content: originalContent.content_body,
    metadata: {
      channel: 'naver_blog',
      optimized_for: 'naver_search',
      tags: ['골프', '마스골프', '드라이버'],
      naver_specific: true
    }
  };

  // TODO: 실제 네이버 블로그 API 연동
  // 현재는 시뮬레이션
  const channelContentId = `naver_${Date.now()}`;
  
  return {
    ...optimizedContent,
    channelContentId
  };
}

// SMS 파생
async function deriveToSMS(originalContent) {
  console.log('📱 SMS 파생 처리 중...');
  
  // SMS 특화 압축 (기존 SMS AI 로직 활용)
  const smsContent = {
    title: originalContent.title.substring(0, 20) + '...',
    content: originalContent.content_body.substring(0, 100) + '...',
    metadata: {
      channel: 'sms',
      optimized_for: 'sms_length',
      char_count: originalContent.content_body.length,
      compressed: true
    }
  };

  // TODO: 실제 SMS API 연동
  const channelContentId = `sms_${Date.now()}`;
  
  return {
    ...smsContent,
    channelContentId
  };
}

// 블로그 파생
async function deriveToBlog(originalContent) {
  console.log('📝 블로그 파생 처리 중...');
  
  // 블로그 특화 최적화
  const blogContent = {
    title: originalContent.title,
    content: originalContent.content_body,
    metadata: {
      channel: 'blog',
      optimized_for: 'seo',
      seo_optimized: true
    }
  };

  // TODO: 실제 블로그 포스트 생성 API 연동
  const channelContentId = `blog_${Date.now()}`;
  
  return {
    ...blogContent,
    channelContentId
  };
}
