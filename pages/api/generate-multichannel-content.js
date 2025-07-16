// pages/api/generate-multichannel-content.js
// Node.js 18 호환 버전 - axios 사용

import axios from 'axios';

export default async function handler(req, res) {
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { year, month, selectedChannels = {} } = req.body;
    
    // 환경 변수
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 
                       process.env.SUPABASE_SERVICE_ROLE_KEY ||
                       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ 
        success: false,
        error: 'Supabase 설정이 없습니다'
      });
    }
    
    // 콘텐츠 데이터 준비
    const contentsToCreate = [];
    const channels = {
      blog: selectedChannels.blog !== false,
      kakao: selectedChannels.kakao !== false,
      sms: selectedChannels.sms !== false,
      instagram: selectedChannels.instagram !== false,
      youtube: selectedChannels.youtube !== false
    };
    
    // 월별 테마 가져오기 (선택사항)
    let monthlyTheme = null;
    try {
      const themeResponse = await axios.get(
        `${supabaseUrl}/rest/v1/monthly_themes`,
        {
          params: {
            year: `eq.${year}`,
            month: `eq.${month}`
          },
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        }
      );
      monthlyTheme = themeResponse.data[0];
    } catch (error) {
      console.log('월별 테마 로드 실패:', error.message);
    }
    
    const theme = monthlyTheme?.theme || `${month}월 프로모션`;
    
    // 채널별 콘텐츠 생성
    if (channels.blog) {
      contentsToCreate.push(
        {
          title: `[블로그] ${theme} - 이달의 특별 혜택`,
          content: `${month}월 특별 프로모션 안내`,
          platform: 'blog',
          status: 'idea',
          assignee: '마케팅팀',
          scheduled_date: `${year}-${String(month).padStart(2, '0')}-05`,
          tags: '프로모션,블로그,월간테마'
        },
        {
          title: `[블로그] 골프 꿀팁 - ${month}월 편`,
          content: `${month}월 골프 팁과 노하우`,
          platform: 'blog',
          status: 'idea',
          assignee: '콘텐츠팀',
          scheduled_date: `${year}-${String(month).padStart(2, '0')}-15`,
          tags: '팁,블로그,교육'
        }
      );
    }
    
    if (channels.kakao) {
      contentsToCreate.push({
        title: `[카카오톡] ${theme} 안내`,
        content: '카카오톡 채널 메시지',
        platform: 'kakao',
        status: 'idea',
        assignee: 'CRM팀',
        scheduled_date: `${year}-${String(month).padStart(2, '0')}-01`,
        tags: '카카오톡,공지,프로모션'
      });
    }
    
    if (channels.sms) {
      contentsToCreate.push({
        title: `[SMS] ${month}월 이벤트 문자`,
        content: 'SMS 발송 내용',
        platform: 'sms',
        status: 'idea',
        assignee: 'CRM팀',
        scheduled_date: `${year}-${String(month).padStart(2, '0')}-03`,
        tags: 'SMS,이벤트,문자'
      });
    }
    
    if (channels.instagram) {
      contentsToCreate.push({
        title: `[인스타그램] ${theme} 피드`,
        content: '인스타그램 피드 콘텐츠',
        platform: 'instagram',
        status: 'idea',
        assignee: 'SNS팀',
        scheduled_date: `${year}-${String(month).padStart(2, '0')}-10`,
        tags: '인스타그램,SNS,비주얼'
      });
    }
    
    if (channels.youtube) {
      contentsToCreate.push({
        title: `[유튜브] ${month}월 레슨 영상`,
        content: '유튜브 영상 기획',
        platform: 'youtube',
        status: 'idea',
        assignee: '영상팀',
        scheduled_date: `${year}-${String(month).padStart(2, '0')}-20`,
        tags: '유튜브,영상,레슨'
      });
    }
    
    // 콘텐츠가 없으면 에러
    if (contentsToCreate.length === 0) {
      return res.status(200).json({
        success: true,
        message: '선택된 채널이 없습니다',
        count: 0,
        data: []
      });
    }
    
    // Axios로 데이터 전송
    const response = await axios.post(
      `${supabaseUrl}/rest/v1/content_ideas`,
      contentsToCreate,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      }
    );
    
    return res.status(200).json({
      success: true,
      message: `${contentsToCreate.length}개의 콘텐츠가 생성되었습니다!`,
      count: contentsToCreate.length,
      data: response.data
    });
    
  } catch (error) {
    console.error('API Error:', error);
    
    // Axios 에러 처리
    if (error.response) {
      return res.status(500).json({
        success: false,
        error: error.response.data?.message || error.message,
        details: error.response.data
      });
    }
    
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}