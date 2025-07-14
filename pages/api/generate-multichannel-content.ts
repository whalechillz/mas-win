// 안전한 멀티채널 콘텐츠 생성 API (에러 핸들링 강화)
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { year, month, aiSettings, selectedChannels } = req.body;

  try {
    // 1. 먼저 기존 콘텐츠 확인
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    
    const { data: existingContents, error: checkError } = await supabase
      .from('content_ideas')
      .select('platform, count')
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate)
      .neq('status', 'deleted');
    
    if (checkError) {
      console.error('Check error:', checkError);
      // 에러가 있어도 계속 진행
    }
    
    // 2. 기존 콘텐츠 개수 계산
    const existingByPlatform = {};
    if (existingContents) {
      existingContents.forEach(content => {
        existingByPlatform[content.platform] = (existingByPlatform[content.platform] || 0) + 1;
      });
    }
    
    // 3. 수동으로 콘텐츠 생성 (SQL 함수 대신)
    const contentsToCreate = [];
    const channels = Object.entries(selectedChannels || {
      blog: true,
      kakao: true,
      sms: true,
      instagram: true,
      youtube: true
    }).filter(([_, enabled]) => enabled);
    
    // 월별 테마 가져오기
    const { data: monthlyTheme } = await supabase
      .from('monthly_themes')
      .select('*')
      .eq('year', year)
      .eq('month', month)
      .single();
    
    const theme = monthlyTheme?.theme || `${month}월 프로모션`;
    
    // 채널별 콘텐츠 생성
    for (const [channel, enabled] of channels) {
      if (!enabled) continue;
      
      // 이미 있는 콘텐츠는 건너뛰기
      if (existingByPlatform[channel] > 0) {
        console.log(`${channel}에 이미 ${existingByPlatform[channel]}개의 콘텐츠가 있습니다.`);
        continue;
      }
      
      switch (channel) {
        case 'blog':
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
          break;
          
        case 'kakao':
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
          break;
          
        case 'sms':
          contentsToCreate.push(
            {
              title: '[마스골프] 할인코드',
              content: `쿠폰: ${theme.substring(0, 4).toUpperCase()}${month}`,
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
          break;
          
        case 'instagram':
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
          break;
          
        case 'youtube':
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
          break;
      }
    }
    
    // 4. 콘텐츠 삽입
    if (contentsToCreate.length > 0) {
      const { data: insertedData, error: insertError } = await supabase
        .from('content_ideas')
        .insert(contentsToCreate);
      
      if (insertError) {
        console.error('Insert error:', insertError);
        return res.status(500).json({ 
          error: '콘텐츠 생성 중 오류가 발생했습니다.',
          details: insertError.message,
          hint: insertError.hint 
        });
      }
    }
    
    // 5. 성공 응답
    return res.status(200).json({
      success: true,
      message: `${contentsToCreate.length}개의 콘텐츠가 생성되었습니다.`,
      contentCount: contentsToCreate.length,
      existingContents: existingByPlatform,
      createdContents: contentsToCreate.map(c => ({
        title: c.title,
        platform: c.platform
      }))
    });
    
  } catch (error) {
    console.error('콘텐츠 생성 오류:', error);
    return res.status(500).json({ 
      error: '콘텐츠 생성 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
}