import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { 
      title,
      currentContent,
      improvementRequest,
      keywords,
      category
    } = req.body;

    console.log('✨ 간단 AI 개선 요청:', { 
      title, 
      improvementRequest,
      currentContentLength: currentContent?.length || 0,
      category
    });

    if (!title || !currentContent || !improvementRequest) {
      return res.status(400).json({ 
        error: '제목, 현재 내용, 개선 요청사항이 모두 필요합니다.' 
      });
    }

    // 간단하고 직관적인 프롬프트
    const prompt = `당신은 전문적인 블로그 콘텐츠 개선 전문가입니다.

**원본 제목:** ${title}
**원본 내용:** ${currentContent}
**개선 요청사항:** ${improvementRequest}
**카테고리:** ${category}
**키워드:** ${keywords || '없음'}

**작업 지침:**
1. 사용자의 개선 요청사항을 정확히 반영하세요
2. 원본 내용의 핵심 메시지는 유지하세요
3. 자연스럽고 읽기 쉬운 문체로 작성하세요
4. 마크다운 형식을 사용하세요
5. 필요시 제목, 소제목, 단락을 적절히 구성하세요

**개선된 콘텐츠를 마크다운 형식으로 작성해주세요:**`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 전문적인 블로그 콘텐츠 개선 전문가입니다. 사용자의 요청사항을 정확히 반영하여 콘텐츠를 개선합니다."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    });

    const improvedContent = response.choices[0].message.content;
    const originalLength = currentContent.length;
    const improvedLength = improvedContent.length;

    console.log('✅ 간단 AI 개선 완료:', originalLength, '→', improvedLength, '자');

    res.status(200).json({
      success: true,
      improvedContent,
      originalLength,
      improvedLength,
      improvementRequest,
      usageInfo: {
        model: response.model,
        tokens: response.usage?.total_tokens || 0,
        cost: response.usage?.total_tokens ? (response.usage.total_tokens * 0.00015 / 1000).toFixed(4) : '0.0000'
      }
    });

  } catch (error) {
    console.error('❌ 간단 AI 개선 오류:', error);
    res.status(500).json({ 
      error: '간단 AI 개선 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
}
