import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { originalPost, variationType, brandStrategy } = req.body;

    if (!originalPost) {
      return res.status(400).json({ error: '원본 포스트가 필요합니다.' });
    }

    // 베리에이션 타입별 프롬프트 생성
    const variationPrompts = {
      rewrite: `다음 블로그 포스트를 같은 내용이지만 완전히 다른 표현과 구조로 재작성해주세요. 
      핵심 메시지는 유지하되, 문체, 단어 선택, 문단 구성 등을 모두 바꿔서 새로운 느낌의 글로 만들어주세요.`,
      
      expand: `다음 블로그 포스트를 기반으로 더 상세하고 깊이 있는 내용으로 확장해주세요. 
      각 섹션에 더 많은 정보, 예시, 설명을 추가하여 독자에게 더 많은 가치를 제공하는 글로 만들어주세요.`,
      
      summarize: `다음 블로그 포스트의 핵심 내용만 간추려서 요약본을 만들어주세요. 
      중요한 포인트는 유지하되, 불필요한 설명은 제거하고 간결하고 명확한 글로 만들어주세요.`,
      
      different_angle: `다음 블로그 포스트를 완전히 다른 관점에서 접근하여 새로운 글로 작성해주세요. 
      같은 주제이지만 다른 시각, 다른 스토리텔링, 다른 접근 방식을 사용해주세요.`
    };

    const basePrompt = variationPrompts[variationType] || variationPrompts.rewrite;

    // 브랜드 전략에 따른 추가 지시사항
    let brandInstructions = '';
    if (brandStrategy.brandWeight === 'none') {
      brandInstructions = '브랜드명이나 제품명을 최소화하고 순수한 정보 제공에 집중해주세요.';
    } else if (brandStrategy.brandWeight === 'low') {
      brandInstructions = '브랜드명이나 제품명을 자연스럽게 언급하되 과도하지 않게 해주세요.';
    } else if (brandStrategy.brandWeight === 'medium') {
      brandInstructions = '브랜드명이나 제품명을 적절히 강조하여 비교 우위를 보여주세요.';
    } else if (brandStrategy.brandWeight === 'high') {
      brandInstructions = '브랜드명이나 제품명을 적극적으로 강조하여 브랜드의 장점을 부각시켜주세요.';
    }

    const prompt = `${basePrompt}

원본 포스트:
제목: ${originalPost.title}
요약: ${originalPost.excerpt}
내용: ${originalPost.content}

브랜드 전략: ${brandInstructions}

다음 형식으로 응답해주세요:
{
  "title": "새로운 제목",
  "slug": "새로운-슬러그",
  "excerpt": "새로운 요약",
  "content": "새로운 내용 (마크다운 형식)",
  "meta_title": "SEO 메타 제목",
  "meta_description": "SEO 메타 설명",
  "meta_keywords": "키워드1, 키워드2, 키워드3"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "당신은 전문적인 블로그 콘텐츠 작가입니다. 주어진 지시사항에 따라 고품질의 블로그 포스트를 생성해주세요. JSON 형식으로 정확히 응답해주세요."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const responseText = completion.choices[0].message.content;
    
    try {
      const result = JSON.parse(responseText);
      
      // 슬러그 생성 (한글 제목을 영문 슬러그로 변환)
      if (!result.slug || result.slug === '새로운-슬러그') {
        result.slug = generateSlug(result.title);
      }

      res.status(200).json(result);
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError);
      console.error('응답 텍스트:', responseText);
      
      // JSON 파싱 실패 시 기본 구조로 응답
      res.status(200).json({
        title: originalPost.title + ' (베리에이션)',
        slug: generateSlug(originalPost.title) + '-variation',
        excerpt: originalPost.excerpt,
        content: originalPost.content,
        meta_title: originalPost.meta_title || originalPost.title,
        meta_description: originalPost.meta_description || originalPost.excerpt,
        meta_keywords: originalPost.meta_keywords || ''
      });
    }

  } catch (error) {
    console.error('베리에이션 생성 오류:', error);
    res.status(500).json({ error: '베리에이션 생성 중 오류가 발생했습니다.' });
  }
}

// 한글 제목을 영문 슬러그로 변환하는 함수
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // 특수문자 제거
    .replace(/\s+/g, '-') // 공백을 하이픈으로
    .replace(/-+/g, '-') // 연속된 하이픈을 하나로
    .trim();
}
