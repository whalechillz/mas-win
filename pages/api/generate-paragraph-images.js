import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { content, title, excerpt, contentType, brandStrategy } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    // 내용을 단락별로 분리
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
    const paragraphImages = [];

    // 각 단락에 대해 이미지 생성
    for (let i = 0; i < Math.min(paragraphs.length, 3); i++) { // 최대 3개 단락
      const paragraph = paragraphs[i].trim();
      
      // 단락 내용을 기반으로 이미지 프롬프트 생성
      const imagePrompt = await generateParagraphImagePrompt(paragraph, title, excerpt, contentType, brandStrategy, i);
      
      // DALL-E 3로 이미지 생성
      const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: imagePrompt,
        n: 1,
        size: "1792x1024",
        quality: "hd",
        style: "natural"
      });

      paragraphImages.push({
        paragraphIndex: i,
        paragraph: paragraph.substring(0, 100) + '...', // 미리보기용
        imageUrl: imageResponse.data[0].url,
        prompt: imagePrompt
      });
    }

    res.status(200).json({
      success: true,
      paragraphImages: paragraphImages,
      totalParagraphs: paragraphs.length
    });

  } catch (error) {
    console.error('단락별 이미지 생성 오류:', error);
    res.status(500).json({ 
      message: 'Failed to generate paragraph images',
      error: error.message 
    });
  }
}

// 단락별 이미지 프롬프트 생성 함수
async function generateParagraphImagePrompt(paragraph, title, excerpt, contentType, brandStrategy, paragraphIndex) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `당신은 전문적인 AI 이미지 생성 프롬프트 작성자입니다.
          
          단락 내용을 기반으로 다양한 시각적 요소를 포함한 이미지 프롬프트를 작성해주세요.
          
          프롬프트 작성 규칙:
          1. 단락의 핵심 내용을 시각적으로 표현
          2. 다양한 상황과 장면 생성 (드라이버만 들고 있는 모습 피하기)
          3. 한국인 50-70대 골퍼가 주인공
          4. MASSGOO 브랜드 자연스럽게 포함
          5. 다양한 시간대와 환경 활용
          6. 텍스트나 글자는 절대 포함하지 않음
          7. 각 단락마다 다른 시각적 요소 활용
          
          단락별 시각적 요소 가이드:
          - 0번째 단락: 고객의 방문, 만남, 인사 장면
          - 1번째 단락: 피팅 과정, 테스트, 검사 장면  
          - 2번째 단락: 결과, 만족, 성과 장면
          
          다양한 이미지 타입 지원:
          - 인물 이미지: 골퍼, 상담사, 직원 등
          - 풍경 이미지: 골프장, 자연 경관, 매장 외관
          - 사물 이미지: 드라이버, 골프 용품, 장비
          - 상황별 이미지: 매장 내부, 테스트 장면, 상담 공간
          
          상황에 따른 이미지 선택:
          - 인물이 필요한 경우: 골퍼, 상담사, 직원
          - 풍경이 적합한 경우: 골프장, 자연, 매장 외관
          - 사물이 적합한 경우: 드라이버, 골프 용품, 장비
          - 상황이 적합한 경우: 매장 내부, 테스트 장면
          
          응답은 영어로 된 이미지 생성 프롬프트만 제공하세요.`
        },
        {
          role: "user",
          content: `제목: "${title}"
요약: "${excerpt || '요약이 없습니다.'}"
단락 ${paragraphIndex + 1}: "${paragraph}"`
        }
      ],
      temperature: 0.8,
      max_tokens: 300,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('단락별 프롬프트 생성 오류:', error);
    // 기본 프롬프트 반환
    return `Korean senior golfer (60-70 years old Asian man) in a golf-related scene, natural lighting, professional photography style, no text, clean composition.`;
  }
}
