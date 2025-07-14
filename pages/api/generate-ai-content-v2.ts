// AI 모델별 멀티채널 콘텐츠 생성 API
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// AI 모델별 설정
const AI_MODELS = {
  'gpt-3.5-turbo': {
    name: 'GPT-3.5 Turbo',
    costPerContent: 0.5,
    quality: 'basic',
    contentLength: 500
  },
  'gpt-4': {
    name: 'GPT-4',
    costPerContent: 2,
    quality: 'good',
    contentLength: 800
  },
  'claude-sonnet': {
    name: 'Claude Sonnet 3.5',
    costPerContent: 3,
    quality: 'excellent',
    contentLength: 1500
  },
  'claude-opus-4': {
    name: 'Claude Opus 4',
    costPerContent: 5,
    quality: 'premium',
    contentLength: 2000
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { year, month, theme, aiSettings } = req.body;

  try {
    const modelConfig = AI_MODELS[aiSettings.settings.contentModel || 'gpt-3.5-turbo'];
    
    // 플랜별 콘텐츠 개수 결정
    const contentCounts = {
      basic: { blog: 2, kakao: 3, sms: 2, instagram: 2, youtube: 1 },
      standard: { blog: 3, kakao: 4, sms: 3, instagram: 3, youtube: 1 },
      premium: { blog: 5, kakao: 6, sms: 4, instagram: 5, youtube: 2 },
      custom: {
        blog: Math.floor(aiSettings.budget / 50),
        kakao: Math.floor(aiSettings.budget / 30),
        sms: Math.floor(aiSettings.budget / 20),
        instagram: Math.floor(aiSettings.budget / 40),
        youtube: Math.floor(aiSettings.budget / 100)
      }
    };

    const counts = contentCounts[aiSettings.plan];
    let totalCost = 0;
    const generatedContents = [];

    // 블로그 콘텐츠 생성
    for (let i = 0; i < counts.blog; i++) {
      const content = await generateContent('blog', theme, modelConfig, aiSettings);
      generatedContents.push(content);
      totalCost += modelConfig.costPerContent;
    }

    // 카카오톡 콘텐츠 생성
    for (let i = 0; i < counts.kakao; i++) {
      const content = await generateContent('kakao', theme, modelConfig, aiSettings);
      generatedContents.push(content);
      totalCost += modelConfig.costPerContent * 0.3; // 짧은 콘텐츠는 비용 감소
    }

    // SMS 콘텐츠 생성
    for (let i = 0; i < counts.sms; i++) {
      const content = await generateContent('sms', theme, modelConfig, aiSettings);
      generatedContents.push(content);
      totalCost += modelConfig.costPerContent * 0.2;
    }

    // 인스타그램 콘텐츠 생성
    for (let i = 0; i < counts.instagram; i++) {
      const content = await generateContent('instagram', theme, modelConfig, aiSettings);
      generatedContents.push(content);
      totalCost += modelConfig.costPerContent * 0.5;
    }

    // 유튜브 콘텐츠 생성
    for (let i = 0; i < counts.youtube; i++) {
      const content = await generateContent('youtube', theme, modelConfig, aiSettings);
      generatedContents.push(content);
      totalCost += modelConfig.costPerContent * 0.8;
    }

    // Perplexity 사용 시 추가 비용
    if (aiSettings.settings.usePerplexity) {
      totalCost += 5;
    }

    // 이미지 생성 비용
    if (aiSettings.settings.useImageGen) {
      const imageCount = generatedContents.filter(c => c.platform === 'blog' || c.platform === 'instagram').length;
      totalCost += imageCount * aiSettings.settings.imageCount * 0.5;
    }

    // 데이터베이스에 저장
    const { data, error } = await supabase
      .from('content_ideas')
      .insert(generatedContents);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      contentCount: generatedContents.length,
      totalCost: Math.round(totalCost * 100) / 100,
      breakdown: {
        blog: counts.blog,
        kakao: counts.kakao,
        sms: counts.sms,
        instagram: counts.instagram,
        youtube: counts.youtube
      },
      quality: modelConfig.quality,
      message: `${generatedContents.length}개의 AI 콘텐츠가 생성되었습니다. (예상 비용: $${Math.round(totalCost)})`
    });

  } catch (error) {
    console.error('AI 콘텐츠 생성 오류:', error);
    return res.status(500).json({ error: '콘텐츠 생성 중 오류가 발생했습니다.' });
  }
}

// 플랫폼별 콘텐츠 생성 함수
async function generateContent(platform: string, theme: any, modelConfig: any, aiSettings: any) {
  const date = new Date(theme.year, theme.month - 1, Math.floor(Math.random() * 28) + 1);
  
  // 실제 AI API 호출 대신 시뮬레이션
  const templates = {
    blog: {
      titles: [
        `${theme.theme} - 전문가가 알려주는 꿀팁`,
        `2025년 ${theme.month}월 ${theme.theme} 완벽 가이드`,
        `${theme.theme} 베스트 아이템 TOP 10`,
        `${theme.theme} 성공 사례와 후기 모음`,
        `${theme.theme} 시작하기 전 꼭 알아야 할 것들`
      ],
      assignee: '제이'
    },
    kakao: {
      titles: [
        `[마스골프] ${theme.theme} 시작! 🎉`,
        `[마스골프] 이번 주 특별 혜택 안내`,
        `[마스골프] ${theme.theme} 이벤트 당첨자 발표`,
        `[마스골프] 놓치면 후회하는 ${theme.theme}`,
        `[마스골프] VIP 고객님만을 위한 특별 제안`,
        `[마스골프] ${theme.theme} 마지막 기회!`
      ],
      assignee: '스테피'
    },
    sms: {
      titles: [
        `[마스골프] ${theme.theme.substring(0, 10)}... 할인코드: ${generateCode()}`,
        `[마스골프] 특가 마감 D-3! 서두르세요`,
        `[마스골프] VIP 전용 ${theme.theme.substring(0, 8)}...`,
        `[마스골프] 감사 쿠폰 ${generateCode()}`
      ],
      assignee: '허상원'
    },
    instagram: {
      titles: [
        `${theme.theme} 스타일링 💚`,
        `고객님들의 ${theme.theme} 후기 모음`,
        `${theme.theme} BEST ITEM 공개`,
        `${theme.theme} 이벤트 참여하기`,
        `프로가 선택한 ${theme.theme} 아이템`
      ],
      assignee: '스테피'
    },
    youtube: {
      titles: [
        `${theme.theme} - 10분 마스터 클래스`,
        `${theme.theme} 장비 리뷰 & 비교 분석`
      ],
      assignee: '허상원'
    }
  };

  const platformTemplates = templates[platform];
  const title = platformTemplates.titles[Math.floor(Math.random() * platformTemplates.titles.length)];
  
  // 품질에 따른 콘텐츠 설명 생성
  const qualityDescriptions = {
    basic: '기본적인 정보를 담은 콘텐츠',
    good: '상세한 설명과 팁이 포함된 콘텐츠',
    excellent: '전문적이고 깊이 있는 분석이 담긴 콘텐츠',
    premium: 'SEO 최적화와 고급 인사이트가 포함된 프리미엄 콘텐츠'
  };

  return {
    title,
    content: `[${modelConfig.name}로 생성] ${qualityDescriptions[modelConfig.quality]}`,
    platform,
    status: 'idea',
    assignee: platformTemplates.assignee,
    scheduled_date: date,
    tags: theme.focus_keywords.join(','),
    ai_generated: true,
    ai_model: aiSettings.settings.contentModel,
    ai_quality: modelConfig.quality,
    estimated_cost: modelConfig.costPerContent
  };
}

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
