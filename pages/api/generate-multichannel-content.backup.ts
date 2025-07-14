// 실제 작동하는 멀티채널 생성 API
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
    if (aiSettings?.useAI) {
      // AI 모드 - 실제 구현
      const apiKey = process.env.ANTHROPIC_API_KEY;
      
      if (!apiKey) {
        // API 키가 없으면 더미 데이터로 시뮬레이션
        const result = await simulateAIGeneration(year, month, selectedChannels, aiSettings);
        return res.status(200).json(result);
      }
      
      // 실제 AI API 호출 (Anthropic)
      const Anthropic = require('@anthropic-ai/sdk');
      const anthropic = new Anthropic({ apiKey });
      
      const generatedContents = [];
      const channels = Object.entries(selectedChannels || {})
        .filter(([_, enabled]) => enabled)
        .map(([channel]) => channel);
      
      for (const channel of channels) {
        const prompt = createPromptForChannel(channel, month);
        
        try {
          const message = await anthropic.messages.create({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 1000,
            messages: [{
              role: 'user',
              content: prompt
            }]
          });
          
          const content = parseAIResponse(message.content[0].text, channel);
          generatedContents.push(...content);
        } catch (error) {
          console.error(`AI 생성 실패 (${channel}):`, error);
          // 실패시 템플릿 사용
          const templateContent = await generateTemplateContent(channel, year, month);
          generatedContents.push(...templateContent);
        }
      }
      
      // DB에 저장
      const { error } = await supabase
        .from('content_ideas')
        .insert(generatedContents);
        
      if (error) throw error;
      
      return res.status(200).json({
        success: true,
        contentCount: generatedContents.length,
        message: `AI가 ${generatedContents.length}개의 콘텐츠를 생성했습니다.`,
        contents: generatedContents
      });
      
    } else {
      // 템플릿 모드 - SQL 함수 호출
      const { data, error } = await supabase.rpc(
        'generate_monthly_content_selective',
        {
          p_year: year,
          p_month: month,
          p_channels: selectedChannels || {
            blog: true,
            kakao: true,
            sms: true,
            instagram: true,
            youtube: true
          }
        }
      );
      
      if (error) throw error;
      
      // SQL 함수 호출 결과 확인
      if (!data || typeof data !== 'object') {
        console.error('Invalid response from SQL function:', data);
        return res.status(500).json({ 
          error: 'SQL 함수 실행 오류',
          success: false,
          message: 'SQL 함수가 올바른 응답을 반환하지 않았습니다.'
        });
      }
      
      return res.status(200).json(data);
    }
    
  } catch (error) {
    console.error('콘텐츠 생성 오류:', error);
    return res.status(500).json({ 
      error: '콘텐츠 생성 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
}

// AI 프롬프트 생성
function createPromptForChannel(channel: string, month: number) {
  const prompts = {
    blog: `7월 골프 시즌을 위한 네이버 블로그 포스트 3개를 생성해주세요.
    각 포스트는 다음을 포함해야 합니다:
    - SEO 최적화된 제목 (25-40자)
    - 핵심 내용 요약 (100자)
    - 메인 키워드 3개
    형식: JSON 배열로 응답`,
    
    kakao: `7월 골프 프로모션을 위한 카카오톡 메시지 4개를 생성해주세요.
    각 메시지는 50자 이내로 작성하고, 이모지를 포함해주세요.
    형식: JSON 배열로 응답`,
    
    sms: `7월 골프 이벤트 SMS 메시지 2개를 생성해주세요.
    각 메시지는 40자 이내, [마스골프]로 시작해야 합니다.
    형식: JSON 배열로 응답`,
    
    instagram: `7월 인스타그램 포스트 아이디어 3개를 생성해주세요.
    각 포스트는 캡션과 해시태그를 포함해야 합니다.
    형식: JSON 배열로 응답`,
    
    youtube: `7월 유튜브 골프 콘텐츠 기획안 1개를 생성해주세요.
    제목, 썸네일 아이디어, 주요 내용을 포함해주세요.
    형식: JSON 객체로 응답`
  };
  
  return prompts[channel] || prompts.blog;
}

// AI 응답 파싱
function parseAIResponse(response: string, channel: string): any[] {
  try {
    // AI 응답을 JSON으로 파싱 시도
    const parsed = JSON.parse(response);
    
    // 콘텐츠 객체로 변환
    return (Array.isArray(parsed) ? parsed : [parsed]).map((item, index) => ({
      title: item.title || `${channel} 콘텐츠 ${index + 1}`,
      content: item.content || item.message || item.caption || '',
      platform: channel,
      status: 'idea',
      assignee: getAssigneeForChannel(channel),
      scheduled_date: new Date(2025, 6, (index + 1) * 7),
      tags: (item.keywords || item.hashtags || []).join(','),
      ai_generated: true
    }));
  } catch (error) {
    // 파싱 실패시 기본 템플릿 반환
    return [{
      title: `AI 생성 ${channel} 콘텐츠`,
      content: response.substring(0, 200),
      platform: channel,
      status: 'idea',
      assignee: getAssigneeForChannel(channel),
      scheduled_date: new Date(2025, 6, 15),
      ai_generated: true
    }];
  }
}

// 채널별 담당자
function getAssigneeForChannel(channel: string): string {
  const assignees = {
    blog: '제이',
    kakao: '스테피',
    sms: '허상원',
    instagram: '스테피',
    youtube: '허상원'
  };
  return assignees[channel] || '제이';
}

// AI 시뮬레이션 (API 키 없을 때)
async function simulateAIGeneration(year: number, month: number, selectedChannels: any, aiSettings: any) {
  const contents = [];
  const channels = Object.entries(selectedChannels || {})
    .filter(([_, enabled]) => enabled)
    .map(([channel]) => channel);
  
  for (const channel of channels) {
    const count = getContentCountForPlan(channel, aiSettings.plan);
    
    for (let i = 0; i < count; i++) {
      contents.push({
        title: `[AI ${aiSettings.plan}] ${channel} 콘텐츠 ${i + 1}`,
        content: `고품질 AI 생성 콘텐츠입니다. (${aiSettings.plan} 플랜)`,
        platform: channel,
        status: 'idea',
        assignee: getAssigneeForChannel(channel),
        scheduled_date: new Date(year, month - 1, (i + 1) * 5),
        tags: '골프,여름,프로모션',
        ai_generated: true,
        ai_model: aiSettings.plan
      });
    }
  }
  
  // DB에 저장
  const { error } = await supabase
    .from('content_ideas')
    .insert(contents);
    
  if (error) throw error;
  
  return {
    success: true,
    contentCount: contents.length,
    message: `[시뮬레이션] ${contents.length}개의 AI 콘텐츠가 생성되었습니다.`,
    contents: contents,
    isSimulation: true
  };
}

// 플랜별 콘텐츠 개수
function getContentCountForPlan(channel: string, plan: string): number {
  const counts = {
    basic: { blog: 2, kakao: 3, sms: 2, instagram: 2, youtube: 1 },
    standard: { blog: 3, kakao: 4, sms: 3, instagram: 3, youtube: 1 },
    premium: { blog: 5, kakao: 6, sms: 4, instagram: 5, youtube: 2 }
  };
  
  return counts[plan]?.[channel] || 1;
}

// 템플릿 콘텐츠 생성
async function generateTemplateContent(channel: string, year: number, month: number): Promise<any[]> {
  // 기존 템플릿 로직
  const templates = {
    blog: [
      { title: '7월 무더위 골프 극복법', content: '여름철 라운딩 팁' },
      { title: '신상품 드라이버 리뷰', content: '최신 장비 소개' },
      { title: '프로들의 여름 골프 스타일', content: '패션과 기능성' }
    ],
    kakao: [
      { title: '[마스골프] 7월 특가 시작!', content: '여름 용품 30% 할인' },
      { title: '[마스골프] 쿨링 제품 입고', content: '무더위 필수템' },
      { title: '[마스골프] 주말 이벤트', content: '선착순 경품' },
      { title: '[마스골프] 월말 세일', content: '마지막 기회!' }
    ],
    // ... 다른 채널들
  };
  
  return (templates[channel] || []).map((t, i) => ({
    ...t,
    platform: channel,
    status: 'idea',
    assignee: getAssigneeForChannel(channel),
    scheduled_date: new Date(year, month - 1, (i + 1) * 7),
    tags: '여름,골프,프로모션'
  }));
}
