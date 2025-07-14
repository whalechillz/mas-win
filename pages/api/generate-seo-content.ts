// AI 기반 네이버 블로그 콘텐츠 생성 (Claude Opus 4 + Perplexity)
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { year, month, theme, keywords } = req.body;

  try {
    // 1. Perplexity로 최신 트렌드 리서치 (별도 구현 필요)
    const trendData = await fetchPerplexityTrends(keywords);
    
    // 2. Claude Opus 4로 SEO 최적화 콘텐츠 생성
    const systemPrompt = `당신은 네이버 블로그 SEO 전문가입니다. 
    다음 원칙을 반드시 지켜주세요:
    
    1. 네이버 SEO 최적화
    - 자연스러운 키워드 배치 (과도한 반복 X)
    - 소제목 활용 (H2, H3 태그)
    - 이미지 alt 텍스트 최적화
    - 1,500-2,000자 분량
    
    2. 콘텐츠 품질
    - 독창적이고 유용한 정보
    - 개인 경험담 포함
    - 구체적인 수치나 사례
    - 신뢰할 수 있는 출처 인용
    
    3. 사용자 경험
    - 읽기 쉬운 문단 구성
    - 요약 박스 활용
    - 관련 이미지 3-5개 제안`;

    const userPrompt = `
    테마: ${theme.theme}
    설명: ${theme.description}
    키워드: ${keywords.join(', ')}
    최신 트렌드: ${JSON.stringify(trendData)}
    
    위 정보를 바탕으로 네이버 블로그 포스트를 작성해주세요.
    
    다음 형식으로 응답해주세요:
    {
      "title": "SEO 최적화된 제목",
      "content": "본문 내용 (HTML 형식)",
      "keywords": ["주요", "키워드", "배열"],
      "meta_description": "150자 이내 요약",
      "images": [
        {
          "prompt": "이미지 생성 프롬프트",
          "alt": "이미지 설명"
        }
      ]
    }`;

    const message = await anthropic.messages.create({
      model: 'claude-3-opus-20240229', // Opus 4 모델
      max_tokens: 4000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    });

    const generatedContent = JSON.parse(message.content[0].text);

    // 3. Fal.ai로 이미지 생성
    const imageUrls = await generateImages(generatedContent.images);

    // 4. 콘텐츠 저장
    const { data, error } = await supabase
      .from('content_ideas')
      .insert({
        title: generatedContent.title,
        content: generatedContent.content,
        platform: 'blog',
        status: 'draft',
        scheduled_date: new Date(year, month - 1, 15),
        tags: generatedContent.keywords.join(','),
        media_urls: imageUrls,
        ai_generated: true,
        ai_model: 'claude-opus-4',
        seo_score: calculateSEOScore(generatedContent)
      });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: 'SEO 최적화 콘텐츠가 생성되었습니다.',
      content: generatedContent,
      images: imageUrls
    });

  } catch (error) {
    console.error('콘텐츠 생성 오류:', error);
    return res.status(500).json({ error: '콘텐츠 생성 중 오류가 발생했습니다.' });
  }
}

// Perplexity API 호출 함수
async function fetchPerplexityTrends(keywords: string[]) {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'pplx-70b-online', // 최신 온라인 모델
      messages: [
        {
          role: 'user',
          content: `골프 관련 키워드 "${keywords.join(', ')}"의 최신 트렌드와 인기 검색어를 알려주세요. 네이버 검색 트렌드 중심으로 답변해주세요.`
        }
      ],
      stream: false
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

// Fal.ai 이미지 생성
async function generateImages(imagePrompts: any[]) {
  const imageUrls = [];
  
  for (const img of imagePrompts) {
    const response = await fetch('https://fal.run/fal-ai/flux/dev', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: img.prompt + ', high quality, professional golf equipment photo',
        image_size: 'landscape_16_9',
        num_inference_steps: 28,
        guidance_scale: 3.5
      })
    });

    const result = await response.json();
    imageUrls.push({
      url: result.images[0].url,
      alt: img.alt
    });
  }
  
  return imageUrls;
}

// SEO 점수 계산
function calculateSEOScore(content: any): number {
  let score = 0;
  
  // 제목 길이 (25-60자 적정)
  if (content.title.length >= 25 && content.title.length <= 60) score += 20;
  
  // 본문 길이 (1500자 이상)
  if (content.content.length >= 1500) score += 20;
  
  // 키워드 밀도 (2-3% 적정)
  const keywordDensity = calculateKeywordDensity(content.content, content.keywords);
  if (keywordDensity >= 2 && keywordDensity <= 3) score += 20;
  
  // 이미지 개수 (3개 이상)
  if (content.images.length >= 3) score += 20;
  
  // 메타 설명 존재
  if (content.meta_description) score += 20;
  
  return score;
}

function calculateKeywordDensity(content: string, keywords: string[]): number {
  const words = content.split(/\s+/).length;
  let keywordCount = 0;
  
  keywords.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi');
    const matches = content.match(regex);
    if (matches) keywordCount += matches.length;
  });
  
  return (keywordCount / words) * 100;
}
