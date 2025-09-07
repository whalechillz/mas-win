// pages/api/generate-blog-content.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { topic, keywords, tone } = req.body;

  try {
    // OpenAI API 호출 (환경변수에 API 키 저장)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: '당신은 시니어 골퍼를 위한 전문 블로그 콘텐츠 작성자입니다. MASGOLF 드라이버의 장점을 자연스럽게 녹여내면서도 유용한 정보를 제공하는 글을 작성합니다.'
          },
          {
            role: 'user',
            content: `주제: ${topic}\n키워드: ${keywords.join(', ')}\n톤앤매너: ${tone}\n\n위 정보를 바탕으로 네이버 블로그용 글을 작성해주세요. 제목과 본문을 포함해주세요.`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    const data = await response.json();
    const content = data.choices[0].message.content;

    // 제목과 본문 분리
    const lines = content.split('\n');
    const title = lines[0].replace(/^제목:?\s*/, '');
    const body = lines.slice(2).join('\n');

    res.status(200).json({
      title,
      content: body,
      keywords,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('OpenAI API 오류:', error);
    res.status(500).json({ error: 'AI 콘텐츠 생성 실패' });
  }
}