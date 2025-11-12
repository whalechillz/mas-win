/**
 * 카카오 콘텐츠 프롬프트 및 메시지 자동 생성 API
 * 브랜드 전략을 기반으로 이미지 프롬프트와 메시지를 생성
 */

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { 
      type, // 'background' | 'profile' | 'feed' | 'message'
      accountType, // 'account1' | 'account2'
      brandStrategy,
      weeklyTheme,
      date,
      basePrompt // 기존 프롬프트 (개선용)
    } = req.body;

    if (!brandStrategy) {
      return res.status(400).json({ success: false, message: '브랜드 전략이 필요합니다.' });
    }

    const tone = accountType === 'account1' 
      ? '따뜻한 골드·브라운 톤, 감성적인 분위기, 시니어 골퍼 중심'
      : '쿨 블루·그레이 톤, 현대적인 분위기, 젊은 골퍼 중심';

    let prompt = '';

    if (type === 'message') {
      // 메시지 생성
      prompt = `
마쓰구골프(MASGOLF) 카카오톡 프로필 메시지를 생성해주세요.

**브랜드 전략**:
- 콘텐츠 유형: ${brandStrategy.contentType || '골프 정보'}
- 페르소나: ${brandStrategy.persona || 'tech_enthusiast'}
- 프레임워크: ${brandStrategy.framework || 'PAS'}
- 채널: ${brandStrategy.channel || 'local'}
- 브랜드 강도: ${brandStrategy.brandStrength || '중간'}
- 오디언스 온도: ${brandStrategy.audienceTemperature || 'warm'}
- 전환 목표: ${brandStrategy.conversionGoal || 'consideration'}

**계정 타입**: ${accountType === 'account1' ? '시니어 중심 감성형' : '하이테크 중심 혁신형'}
**톤**: ${tone}
**주별 테마**: ${weeklyTheme || '비거리의 감성 – 스윙과 마음의 연결'}

**요구사항**:
1. 10-15자 이내의 짧고 임팩트 있는 문구
2. 브랜드 가치 전달
3. 주간 테마와 연관
4. 감성적이면서도 전문적인 톤
5. 골프와 비거리 관련

**응답 형식**: JSON
{
  "message": "생성된 메시지"
}
`;
    } else {
      // 이미지 프롬프트 생성/개선
      const imageType = type === 'background' ? '배경 이미지' : type === 'profile' ? '프로필 이미지' : '피드 이미지';
      
      prompt = `
마쓰구골프(MASGOLF) 카카오톡 ${imageType} 프롬프트를 ${basePrompt ? '개선' : '생성'}해주세요.

${basePrompt ? `**기존 프롬프트**: ${basePrompt}` : ''}

**브랜드 전략**:
- 콘텐츠 유형: ${brandStrategy.contentType || '골프 정보'}
- 페르소나: ${brandStrategy.persona || 'tech_enthusiast'}
- 프레임워크: ${brandStrategy.framework || 'PAS'}
- 채널: ${brandStrategy.channel || 'local'}
- 브랜드 강도: ${brandStrategy.brandStrength || '중간'}
- 오디언스 온도: ${brandStrategy.audienceTemperature || 'warm'}

**계정 타입**: ${accountType === 'account1' ? '시니어 중심 감성형' : '하이테크 중심 혁신형'}
**톤**: ${tone}
**주별 테마**: ${weeklyTheme || '비거리의 감성 – 스윙과 마음의 연결'}

**요구사항**:
1. 구체적이고 시각적으로 명확한 설명
2. 색상, 조명, 분위기 명시
3. 골프 관련 요소 포함
4. 브랜드 일관성 유지
5. 100자 이내로 간결하게
6. AI 이미지 생성에 최적화된 영어 프롬프트
7. **중요**: ${accountType === 'account1' 
  ? 'Korean senior golfer (50-70 years old, Korean ethnicity, Asian facial features, silver/gray hair) must be included. Warm golden tone, emotional atmosphere.'
  : 'Korean young golfer (30-50 years old, Korean ethnicity, Asian facial features) or modern tech-focused scene. Cool blue-gray tone, innovative atmosphere.'}
8. **절대 금지**: Western/Caucasian people, non-Asian features. Only Korean/Asian people.

**응답 형식**: JSON
{
  "prompt": "생성된 프롬프트",
  "description": "한국어 설명"
}
`;
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: type === 'message' ? 100 : 200,
      temperature: 0.8
    });

    const content = response.choices[0].message.content.trim();
    let result;

    try {
      result = JSON.parse(content);
    } catch (e) {
      // JSON 파싱 실패 시 텍스트 그대로 사용
      if (type === 'message') {
        result = { message: content.replace(/["'`]/g, '').trim() };
      } else {
        result = { prompt: content, description: content };
      }
    }

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('프롬프트/메시지 생성 오류:', error);
    return res.status(500).json({
      success: false,
      message: error.message || '프롬프트/메시지 생성 실패'
    });
  }
}

