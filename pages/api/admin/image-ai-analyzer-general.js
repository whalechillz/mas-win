import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: '이미지 URL이 필요합니다.' });
    }

    console.log('🤖 범용 이미지 AI 키워드 추출 시작:', imageUrl);

    // OpenAI Vision API를 사용하여 범용 키워드 추출
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert image analyzer for general content. 
Analyze the given image and extract relevant keywords and tags in Korean.

Guidelines:
- Extract keywords for all types of images (buildings, food, people, landscapes, products, etc.)
- Extract object-related keywords (사람, 건물, 음식, 풍경, 제품, 동물, 식물 등)
- Extract environment keywords (야외, 실내, 자연, 도시, 바다, 산, 호수 등)
- Extract color keywords (흰색, 검은색, 파란색, 초록색, 빨간색, 노란색, 갈색, 회색 등)
- Extract style keywords (모던, 클래식, 미니멀, 컬러풀, 따뜻한, 차가운 등)
- Return only the keywords separated by commas
- Maximum 8 keywords
- All keywords should be in Korean`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "이 이미지에서 관련 키워드를 추출해주세요. 한국어로 8개 이하의 키워드를 쉼표로 구분해서 반환해주세요."
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 100,
      temperature: 0.1
    });

    const keywordsText = response.choices[0].message.content.trim();
    const keywords = keywordsText.split(',').map(k => k.trim()).filter(k => k.length > 0);
    
    console.log('✅ 범용 이미지 AI 키워드 추출 완료:', keywords);

    return res.status(200).json({
      success: true,
      keywords: keywords,
      source: 'ai_analysis'
    });

  } catch (error) {
    console.error('❌ 범용 이미지 AI 키워드 추출 오류:', error);
    return res.status(500).json({
      error: '범용 이미지 AI 키워드 추출 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}

