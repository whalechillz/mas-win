// 연간 콘텐츠 자동생성 API
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { period, category, frequency, brandStrategy } = req.body;

  try {
    // 기간별 콘텐츠 개수 계산
    const contentCounts = {
      '1month': 4,
      '3months': 12,
      '6months': 24,
      '1year': 52
    };

    const frequencyMultiplier = {
      'weekly': 1,
      'biweekly': 2,
      'daily': 7
    };

    const totalContentCount = contentCounts[period] * frequencyMultiplier[frequency];

    // 계절별 테마 정의
    const seasonalThemes = {
      spring: ['봄 골프 준비', '신년 골프 목표', '봄 시즌 오픈', '봄 골프 워밍업'],
      summer: ['여름 골프 전략', '더위 속 골프', '여름 골프 장비', '여름 골프 건강관리'],
      autumn: ['가을 골프 정리', '가을 골프 피팅', '겨울 준비', '가을 골프 마무리'],
      winter: ['겨울 골프 연습', '실내 골프', '겨울 골프 장비', '겨울 골프 준비']
    };

    // 카테고리별 콘텐츠 유형
    const categoryTypes = {
      'mixed': ['골프 정보', '고객 후기', '고객 스토리', '이벤트', '튜토리얼'],
      'golf_info': ['골프 정보', '튜토리얼'],
      'customer_stories': ['고객 후기', '고객 스토리'],
      'seasonal': ['계절별 골프 정보', '계절별 이벤트']
    };

    const contentTypes = categoryTypes[category] || categoryTypes['mixed'];

    // AI 프롬프트 생성
    const prompt = `
마쓰구골프(MASGOLF)를 위한 ${period} 연간 콘텐츠 계획을 생성해주세요.

브랜드 전략:
- 콘텐츠 유형: ${brandStrategy.contentType}
- 고객 페르소나: ${brandStrategy.customerPersona}
- 오디언스 온도: ${brandStrategy.audienceTemp}
- 브랜드 강도: ${brandStrategy.brandWeight}
- 스토리텔링 프레임워크: ${brandStrategy.storyFramework}
- 전환 목표: ${brandStrategy.conversionGoal}

요구사항:
- 총 ${totalContentCount}개의 블로그 주제 생성
- 발행 빈도: ${frequency}
- 콘텐츠 유형: ${contentTypes.join(', ')}
- 계절별 테마 고려: ${Object.values(seasonalThemes).flat().join(', ')}
- 마쓰구골프 브랜드와 초고반발 드라이버 중심
- 시니어 골퍼(50-60대) 타겟
- 비거리 향상, 맞춤 피팅, 고객 성공 스토리 중심

각 콘텐츠는 다음 형식으로 생성해주세요:
{
  "title": "제목",
  "contentType": "콘텐츠 유형",
  "seasonalTheme": "계절 테마",
  "targetAudience": "타겟 오디언스",
  "conversionGoal": "전환 목표",
  "storyFramework": "스토리 프레임워크",
  "keywords": ["키워드1", "키워드2"],
  "estimatedPublishDate": "예상 발행일",
  "description": "콘텐츠 설명"
}

JSON 배열 형태로 응답해주세요.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 마쓰구골프의 전문 콘텐츠 기획자입니다. 시니어 골퍼를 위한 초고반발 드라이버와 맞춤 피팅 서비스를 중심으로 한 연간 콘텐츠 계획을 수립합니다."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });

    const responseText = completion.choices[0].message.content;
    
    // JSON 파싱 시도
    let contentPlan;
    try {
      contentPlan = JSON.parse(responseText);
    } catch (parseError) {
      // JSON 파싱 실패 시 기본 구조로 생성
      contentPlan = generateFallbackContentPlan(totalContentCount, contentTypes, seasonalThemes);
    }

    // 콘텐츠 캘린더에 자동 등록
    if (contentPlan && contentPlan.length > 0) {
      try {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const calendarItems = contentPlan.map((content, index) => ({
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          content_date: new Date(Date.now() + index * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          theme: content.title,
          content_type: 'blog',
          title: content.title,
          description: content.description,
          target_audience: {
            persona: content.targetAudience,
            stage: content.conversionGoal
          },
          conversion_tracking: {
            landingPage: 'https://win.masgolf.co.kr',
            goal: content.conversionGoal,
            utmParams: {
              source: 'blog',
              medium: 'organic',
              campaign: content.contentType
            }
          },
          status: 'draft',
          published_channels: ['blog'],
          seo_meta: {
            title: content.title,
            description: content.description,
            keywords: content.keywords.join(', ')
          }
        }));

        const { data, error } = await supabase
          .from('cc_content_calendar')
          .insert(calendarItems);

        if (error) {
          console.error('콘텐츠 캘린더 등록 오류:', error);
        } else {
          console.log(`✅ ${calendarItems.length}개의 콘텐츠가 캘린더에 등록되었습니다.`);
        }
      } catch (calendarError) {
        console.error('콘텐츠 캘린더 등록 실패:', calendarError);
      }
    }

    res.status(200).json({
      success: true,
      message: `${totalContentCount}개의 연간 콘텐츠 계획이 생성되었습니다.`,
      contentPlan: contentPlan,
      totalCount: totalContentCount,
      period: period,
      frequency: frequency,
      category: category
    });

  } catch (error) {
    console.error('연간 콘텐츠 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '연간 콘텐츠 생성 실패',
      error: error.message
    });
  }
}

// JSON 파싱 실패 시 사용할 기본 콘텐츠 계획 생성
function generateFallbackContentPlan(count, contentTypes, seasonalThemes) {
  const plan = [];
  const themes = Object.values(seasonalThemes).flat();
  
  for (let i = 0; i < count; i++) {
    const contentType = contentTypes[i % contentTypes.length];
    const theme = themes[i % themes.length];
    
    plan.push({
      title: `${theme} - 마쓰구골프 ${contentType}`,
      contentType: contentType,
      seasonalTheme: theme,
      targetAudience: '시니어 골퍼',
      conversionGoal: 'consideration',
      storyFramework: 'pixar',
      keywords: ['마쓰구골프', '초고반발 드라이버', '비거리 향상'],
      estimatedPublishDate: new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: `${theme}에 맞는 ${contentType} 콘텐츠입니다.`
    });
  }
  
  return plan;
}
