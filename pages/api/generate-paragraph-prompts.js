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
    
    // 여러 방법으로 단락 분리 시도
    let paragraphs = [];
    
    // 방법 1: \n\n으로 분리
    paragraphs = cleanContent.split('\n\n').filter(p => p.trim().length > 30);
    
    // 방법 2: 문장 단위로 분리 (마침표 기준)
    if (paragraphs.length <= 1) {
      const sentences = cleanContent.split(/[.!?]\s+/).filter(s => s.trim().length > 20);
      // 문장들을 2-3개씩 묶어서 단락 만들기
      for (let i = 0; i < sentences.length; i += 2) {
        const paragraph = sentences.slice(i, i + 2).join('. ') + '.';
        if (paragraph.trim().length > 30) {
          paragraphs.push(paragraph);
        }
      }
    }
    
    // 방법 3: 강제로 내용을 균등 분할
    if (paragraphs.length <= 1 && cleanContent.length > 200) {
      const chunkSize = Math.ceil(cleanContent.length / (imageCount || 4));
      for (let i = 0; i < cleanContent.length; i += chunkSize) {
        const chunk = cleanContent.substring(i, i + chunkSize).trim();
        if (chunk.length > 30) {
          paragraphs.push(chunk);
        }
      }
    }
    
    // 최소 50자 이상인 단락만 유지
    paragraphs = paragraphs.filter(p => p.trim().length > 50);
    
    console.log(`📝 단락 분석: 총 ${paragraphs.length}개 단락 발견`);
    console.log(`📝 요청된 이미지 개수: ${imageCount || 4}개`);
    console.log(`📝 단락 내용 미리보기:`, paragraphs.map((p, i) => `단락 ${i+1}: ${p.substring(0, 100)}...`));
    
    if (paragraphs.length === 0) {
      return res.status(400).json({ message: '이미지 생성에 적합한 단락이 없습니다. (최소 50자 이상)' });
    }
    
    const prompts = [];

    // 각 단락에 대해 프롬프트 생성 (imageCount 또는 최대 4개 단락)
    const maxParagraphs = Math.min(paragraphs.length, imageCount || 4);
    console.log(`📝 처리할 단락 수: ${maxParagraphs}개 (전체 ${paragraphs.length}개 중)`);
    
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
      
      console.log(`✅ 단락 ${i + 1} 프롬프트 생성 완료:`, imagePrompt.substring(0, 100) + '...');
    }

    console.log(`🎉 총 ${prompts.length}개 프롬프트 생성 완료`);

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
