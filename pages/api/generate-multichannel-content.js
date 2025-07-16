// pages/api/generate-multichannel-content.js
// Node.js 18 fetch 문제 완전 해결 버전

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
    
    // Node.js 내장 https 모듈 사용 (fetch 대신)
    const https = require('https');
    const url = new URL(`${supabaseUrl}/rest/v1/content_ideas`);
    
    // 콘텐츠 데이터 준비
    const contentsToCreate = [];
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
          title: `[블로그] ${month}월 프로모션`,
          content: '이달의 특별 혜택',
          platform: 'blog',
          status: 'idea',
          assignee: '마케팅팀',
          scheduled_date: `${year}-${String(month).padStart(2, '0')}-05`,
          tags: '프로모션,블로그'
        }
      );
    }
    
    if (channels.kakao) {
      contentsToCreate.push({
        title: `[카카오톡] ${month}월 이벤트`,
        content: '카카오톡 이벤트',
        platform: 'kakao',
        status: 'idea',
        assignee: 'CRM팀',
        scheduled_date: `${year}-${String(month).padStart(2, '0')}-01`,
        tags: '카카오톡,이벤트'
      });
    }
    
    if (channels.sms) {
      contentsToCreate.push({
        title: `[SMS] ${month}월 할인`,
        content: 'SMS 할인 정보',
        platform: 'sms',
        status: 'idea',
        assignee: 'CRM팀',
        scheduled_date: `${year}-${String(month).padStart(2, '0')}-03`,
        tags: 'SMS,할인'
      });
    }
    
    if (channels.instagram) {
      contentsToCreate.push({
        title: `[인스타그램] ${month}월 콘텐츠`,
        content: '인스타그램 피드',
        platform: 'instagram',
        status: 'idea',
        assignee: 'SNS팀',
        scheduled_date: `${year}-${String(month).padStart(2, '0')}-07`,
        tags: '인스타그램,SNS'
      });
    }
    
    if (channels.youtube) {
      contentsToCreate.push({
        title: `[유튜브] ${month}월 영상`,
        content: '유튜브 콘텐츠',
        platform: 'youtube',
        status: 'idea',
        assignee: '영상팀',
        scheduled_date: `${year}-${String(month).padStart(2, '0')}-15`,
        tags: '유튜브,영상'
      });
    }
    
    // https 요청으로 데이터 전송
    return new Promise((resolve) => {
      const postData = JSON.stringify(contentsToCreate);
      
      const options = {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=representation'
        }
      };
      
      const request = https.request(options, (response) => {
        let data = '';
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          try {
            const result = JSON.parse(data);
            
            if (response.statusCode === 201 || response.statusCode === 200) {
              res.status(200).json({
                success: true,
                message: `${contentsToCreate.length}개의 콘텐츠가 생성되었습니다!`,
                count: contentsToCreate.length,
                data: result
              });
            } else {
              res.status(500).json({
                success: false,
                error: result.message || 'API 오류',
                details: result
              });
            }
          } catch (error) {
            res.status(500).json({
              success: false,
              error: 'JSON 파싱 에러',
              response: data
            });
          }
        });
      });
      
      request.on('error', (error) => {
        res.status(500).json({
          success: false,
          error: error.message
        });
      });
      
      request.write(postData);
      request.end();
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}