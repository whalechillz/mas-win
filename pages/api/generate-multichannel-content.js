// pages/api/generate-multichannel-content.js
// 실제 콘텐츠 생성 API (JavaScript 버전)

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
    
    // 기본 채널 설정
    const channels = {
      blog: selectedChannels.blog !== false,
      kakao: selectedChannels.kakao !== false,
      sms: selectedChannels.sms !== false,
      instagram: selectedChannels.instagram !== false,
      youtube: selectedChannels.youtube !== false
    };
    
    // 월별 테마 가져오기
    const { data: monthlyTheme } = await supabase
      .from('monthly_themes')
      .select('*')
      .eq('year', year)
      .eq('month', month)
      .single();
    
    const theme = monthlyTheme?.theme || `${month}월 프로모션`;
    const contentsToCreate = [];
    
    // 채널별 콘텐츠 생성
    if (channels.blog) {
      contentsToCreate.push(
        {
          title: `${theme} - 이달의 추천 상품`,
          content: '이번 달 테마에 맞는 베스트 상품을 소개합니다.',
          platform: 'blog',
          status: 'idea',
          assignee: '제이',
          scheduled_date: `${year}-${String(month).padStart(2, '0')}-05`,
          tags: `${theme},추천상품`
        },
        {
          title: `${theme} - 전문가 팁`,
          content: '프로들이 알려주는 꿀팁입니다.',
          platform: 'blog',
          status: 'idea',
          assignee: '제이',
          scheduled_date: `${year}-${String(month).padStart(2, '0')}-15`,
          tags: `${theme},팁`
        },
        {
          title: `${theme} - 고객 후기`,
          content: '실제 고객님들의 생생한 후기입니다.',
          platform: 'blog',
          status: 'idea',
          assignee: '제이',
          scheduled_date: `${year}-${String(month).padStart(2, '0')}-25`,
          tags: `${theme},후기`
        }
      );
    }
    
    if (channels.kakao) {
      contentsToCreate.push(
        {
          title: `[마스골프] ${theme} 시작!`,
          content: monthlyTheme?.promotion_details || '특별 프로모션 진행중',
          platform: 'kakao',
          status: 'idea',
          assignee: '스테피',
          scheduled_date: `${year}-${String(month).padStart(2, '0')}-01`,
          tags: `${theme},프로모션`
        },
        {
          title: '[마스골프] 주간 특가',
          content: '이번 주 특가 상품 안내',
          platform: 'kakao',
          status: 'idea',
          assignee: '스테피',
          scheduled_date: `${year}-${String(month).padStart(2, '0')}-08`,
          tags: `${theme},특가`
        },
        {
          title: '[마스골프] 이벤트 안내',
          content: '참여하고 선물 받아가세요!',
          platform: 'kakao',
          status: 'idea',
          assignee: '나과장',
          scheduled_date: `${year}-${String(month).padStart(2, '0')}-15`,
          tags: `${theme},이벤트`
        },
        {
          title: '[마스골프] 마지막 기회!',
          content: '이번 달 프로모션 마감 임박',
          platform: 'kakao',
          status: 'idea',
          assignee: '나과장',
          scheduled_date: `${year}-${String(month).padStart(2, '0')}-28`,
          tags: `${theme},마감`
        }
      );
    }
    
    if (channels.sms) {
      contentsToCreate.push(
        {
          title: '[마스골프] 할인코드',
          content: `쿠폰: ${theme.substring(0, 4).toUpperCase().replace(/\s/g, '')}${month}`,
          platform: 'sms',
          status: 'idea',
          assignee: '허상원',
          scheduled_date: `${year}-${String(month).padStart(2, '0')}-01`,
          tags: `${theme},쿠폰`
        },
        {
          title: '[마스골프] 마감 D-3',
          content: '특가 마감 임박!',
          platform: 'sms',
          status: 'idea',
          assignee: '허상원',
          scheduled_date: `${year}-${String(month).padStart(2, '0')}-26`,
          tags: `${theme},마감`
        }
      );
    }
    
    if (channels.instagram) {
      contentsToCreate.push(
        {
          title: `${theme} 시작!`,
          content: '이번 달 특별 이벤트를 소개합니다',
          platform: 'instagram',
          status: 'idea',
          assignee: '스테피',
          scheduled_date: `${year}-${String(month).padStart(2, '0')}-02`,
          tags: `${theme},이벤트`
        },
        {
          title: '고객 후기 이벤트',
          content: '후기 남기고 선물 받아가세요',
          platform: 'instagram',
          status: 'idea',
          assignee: '스테피',
          scheduled_date: `${year}-${String(month).padStart(2, '0')}-10`,
          tags: `${theme},후기`
        },
        {
          title: `${theme} BEST`,
          content: '이번 달 인기 상품',
          platform: 'instagram',
          status: 'idea',
          assignee: '제이',
          scheduled_date: `${year}-${String(month).padStart(2, '0')}-20`,
          tags: `${theme},베스트`
        }
      );
    }
    
    if (channels.youtube) {
      contentsToCreate.push(
        {
          title: `${theme} - 전문가 리뷰`,
          content: '10분 안에 마스터하는 팁',
          platform: 'youtube',
          status: 'idea',
          assignee: '허상원',
          scheduled_date: `${year}-${String(month).padStart(2, '0')}-15`,
          tags: `${theme},리뷰`
        }
      );
    }
    
    // 데이터베이스에 삽입
    if (contentsToCreate.length > 0) {
      const { data, error } = await supabase
        .from('content_ideas')
        .insert(contentsToCreate);
      
      if (error) {
        console.error('Insert error:', error);
        return res.status(500).json({ 
          success: false,
          error: error.message,
          details: error
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      contentCount: contentsToCreate.length,
      message: `${contentsToCreate.length}개의 콘텐츠가 생성되었습니다!`,
      contents: contentsToCreate.map(c => ({
        title: c.title,
        platform: c.platform
      }))
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}