import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { originalTitle, persona, contentType, targetProduct, brandWeight, conversionGoal } = req.body;

    if (!originalTitle) {
      return res.status(400).json({ success: false, message: '제목이 필요합니다.' });
    }

    const prompt = `
다음 제목을 개선하여 5개의 최적화된 제목을 생성해주세요.

원본 제목: ${originalTitle}
타겟: ${persona}
콘텐츠 유형: ${contentType}
제품: ${targetProduct}
브랜드 톤: ${brandWeight}
전환 목표: ${conversionGoal}

요구사항:
- 각 제목은 30자 이내
- 후킹력 있는 첫 문장
- 명확한 CTA 포함
- 브랜드 톤에 맞는 표현
- 카카오톡 메시지에 적합한 톤

JSON 형식으로 배열로 반환:
["제목1", "제목2", "제목3", "제목4", "제목5"]
`;

    if (!process.env.OPENAI_API_KEY) {
      // OpenAI API 키가 없으면 기본 제목 변형 제공
      const baseTitles = [
        `${originalTitle} 🎁`,
        `[특별 이벤트] ${originalTitle}`,
        `${originalTitle} - 지금 참여하세요!`,
        `✨ ${originalTitle} ✨`,
        `[한정] ${originalTitle}`
      ];
      
      return res.status(200).json({
        success: true,
        titles: baseTitles
      });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a Korean marketing copywriter expert specializing in KakaoTalk messages.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const content = completion.choices[0].message.content || '[]';
    let titles: string[] = [];
    
    try {
      titles = JSON.parse(content);
    } catch {
      // JSON 파싱 실패 시 줄바꿈으로 분리
      titles = content.split('\n')
        .map(line => line.replace(/^[-•\d.]+\s*/, '').replace(/["'`]/g, '').trim())
        .filter(line => line.length > 0 && line.length < 50)
        .slice(0, 5);
    }

    return res.status(200).json({
      success: true,
      titles: titles.slice(0, 5)
    });

  } catch (error: any) {
    console.error('제목 생성 오류:', error);
    return res.status(500).json({
      success: false,
      message: '제목 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
}

