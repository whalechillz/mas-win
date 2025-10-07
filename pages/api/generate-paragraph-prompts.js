import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { content, title, excerpt, contentType, imageCount, brandStrategy } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    // 내용을 단락별로 분리 (HTML 태그 제거 후)
    const cleanContent = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    const paragraphs = cleanContent.split('\n\n').filter(p => p.trim().length > 50); // 최소 50자 이상인 단락만
    
    console.log(`📝 단락 분석: 총 ${paragraphs.length}개 단락 발견`);
    
    if (paragraphs.length === 0) {
      return res.status(400).json({ message: '이미지 생성에 적합한 단락이 없습니다. (최소 50자 이상)' });
    }
    
    const prompts = [];

    // 각 단락에 대해 프롬프트 생성 (imageCount 또는 최대 4개 단락)
    const maxParagraphs = Math.min(paragraphs.length, imageCount || 4);
    for (let i = 0; i < maxParagraphs; i++) {
      const paragraph = paragraphs[i].trim();
      
      // 단락 내용을 기반으로 이미지 프롬프트 생성
      const imagePrompt = await generateParagraphImagePrompt(paragraph, title, excerpt, contentType, brandStrategy, i);
      
      prompts.push({
        paragraphIndex: i,
        paragraph: paragraph.substring(0, 100) + '...', // 미리보기용
        fullParagraph: paragraph,
        prompt: imagePrompt
      });
    }

    res.status(200).json({
      success: true,
      prompts: prompts,
      totalParagraphs: paragraphs.length,
      generatedPrompts: prompts.length
    });

  } catch (error) {
    console.error('❌ 단락 프롬프트 생성 에러:', error);
    res.status(500).json({
      error: '단락 프롬프트 생성 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}

// 단락별 이미지 프롬프트 생성 함수 (기존 generate-paragraph-images.js에서 복사)
async function generateParagraphImagePrompt(paragraph, title, excerpt, contentType, brandStrategy, paragraphIndex) {
  const systemPrompt = `You are an expert image prompt generator for golf-related content. 
Create a detailed, vivid English prompt for AI image generation based on the given paragraph content.

Guidelines:
- Focus on visual elements that represent the paragraph's main theme
- Include specific golf-related details (clubs, courses, players, equipment, etc.)
- Use descriptive adjectives and lighting conditions
- Keep prompts between 50-100 words
- Make it suitable for high-quality AI image generation
- Consider the brand strategy and content type

Brand Strategy: ${JSON.stringify(brandStrategy)}
Content Type: ${contentType}
Title: ${title}
Excerpt: ${excerpt}

Generate a compelling visual prompt for paragraph ${paragraphIndex + 1}.`;

  const userPrompt = `Paragraph content: "${paragraph}"

Create a detailed image generation prompt that visually represents this content.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 200,
      temperature: 0.7
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI 프롬프트 생성 오류:', error);
    // 폴백 프롬프트
    return `A professional golf scene related to: ${paragraph.substring(0, 50)}...`;
  }
}
