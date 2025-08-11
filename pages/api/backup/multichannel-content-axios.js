// pages/api/multichannel-content-axios.js
// Axios를 사용한 완전히 새로운 버전

const axios = require('axios');

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { year, month, selectedChannels = {} } = req.body;
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 
                       process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase 설정이 없습니다');
    }
    
    const api = axios.create({
      baseURL: `${supabaseUrl}/rest/v1`,
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    // 월별 테마 가져오기
    const themeResponse = await api.get('/monthly_themes', {
      params: {
        year: `eq.${year}`,
        month: `eq.${month}`
      }
    });
    
    const theme = themeResponse.data[0]?.theme || `${month}월 마케팅`;
    const contentsToCreate = [];
    
    // 채널별 콘텐츠 생성
    const channels = {
      blog: selectedChannels.blog !== false,
      kakao: selectedChannels.kakao !== false,
      sms: selectedChannels.sms !== false,
      instagram: selectedChannels.instagram !== false,
      youtube: selectedChannels.youtube !== false
    };
    
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
    
    // 콘텐츠 일괄 생성
    if (contentsToCreate.length > 0) {
      const insertResponse = await api.post('/content_ideas', contentsToCreate, {
        headers: {
          'Prefer': 'return=representation'
        }
      });
      
      return res.status(200).json({
        success: true,
        message: `${contentsToCreate.length}개의 콘텐츠가 생성되었습니다!`,
        data: insertResponse.data,
        count: contentsToCreate.length
      });
    }
    
    return res.status(200).json({
      success: true,
      message: '선택된 채널이 없습니다',
      count: 0
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
}