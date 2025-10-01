/**
 * AI 기반 콘텐츠 분석 API
 * ChatGPT를 사용하여 콘텐츠를 정확하게 분류
 */

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { title, excerpt, content } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    console.log('🤖 AI 콘텐츠 분석 시작...');
    console.log('제목:', title);
    console.log('요약:', excerpt?.substring(0, 100) + '...');

    // ChatGPT로 콘텐츠 분석 요청
    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `당신은 전문적인 콘텐츠 분석가입니다. 주어진 블로그 콘텐츠를 분석하여 정확한 카테고리를 분류해주세요.

분류 카테고리:
1. golf - 골프 관련 (드라이버, 아이언, 골프장, 라운드, 핸디캡 등)
2. restaurant - 식당/음식 (맛집, 음식, 요리, 레스토랑, 카페, 샤브, 뷔페 등)
3. travel - 여행/휴양 (여행, 휴양, 관광, 호텔, 펜션, 리조트, 해변 등)
4. shopping - 쇼핑/제품 (구매, 제품, 상품, 할인, 특가, 리뷰, 성능 등)
5. lifestyle - 라이프스타일 (일상, 건강, 취미, 문화 등)
6. business - 비즈니스 (경영, 마케팅, 투자, 창업 등)
7. technology - 기술 (IT, 소프트웨어, 하드웨어, 개발 등)
8. education - 교육 (학습, 강의, 교육과정, 자격증 등)
9. health - 건강 (운동, 다이어트, 의료, 건강관리 등)
10. entertainment - 엔터테인먼트 (영화, 음악, 게임, 스포츠 등)

응답 형식:
{
  "category": "분류된_카테고리",
  "confidence": 0.95,
  "keywords": ["키워드1", "키워드2", "키워드3"],
  "reasoning": "분류 이유 설명",
  "suggestions": ["개선 제안1", "개선 제안2"]
}

정확도가 90% 이상일 때만 응답하고, 확신이 없으면 "uncertain"을 반환하세요.`
        },
        {
          role: "user",
          content: `제목: ${title}
요약: ${excerpt || ''}
내용: ${content ? content.substring(0, 1000) : ''}

위 콘텐츠를 분석하여 정확한 카테고리를 분류해주세요.`
        }
      ],
      temperature: 0.1, // 낮은 온도로 일관성 있는 결과
      max_tokens: 500
    });

    const analysisText = analysisResponse.choices[0].message.content;
    console.log('AI 분석 결과:', analysisText);

    // JSON 파싱
    let analysisResult;
    try {
      analysisResult = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError);
      // 파싱 실패 시 기본값 반환
      analysisResult = {
        category: 'general',
        confidence: 0.5,
        keywords: [],
        reasoning: 'AI 분석 결과를 파싱할 수 없습니다.',
        suggestions: ['콘텐츠를 더 명확하게 작성해주세요.']
      };
    }

    // 신뢰도가 낮으면 기본값 사용
    if (analysisResult.confidence < 0.7) {
      analysisResult.category = 'general';
      analysisResult.reasoning += ' (신뢰도가 낮아 일반 카테고리로 분류)';
    }

    console.log('✅ AI 콘텐츠 분석 완료:', analysisResult.category, `(${analysisResult.confidence})`);

    return res.status(200).json({
      success: true,
      category: analysisResult.category,
      confidence: analysisResult.confidence,
      keywords: analysisResult.keywords,
      reasoning: analysisResult.reasoning,
      suggestions: analysisResult.suggestions,
      message: `콘텐츠가 '${analysisResult.category}' 카테고리로 분류되었습니다.`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI 콘텐츠 분석 실패:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      message: 'AI 콘텐츠 분석에 실패했습니다',
      fallback: {
        category: 'general',
        confidence: 0.3,
        keywords: [],
        reasoning: 'AI 분석 실패로 기본 카테고리 사용',
        suggestions: ['콘텐츠를 다시 확인해주세요.']
      }
    });
  }
}
