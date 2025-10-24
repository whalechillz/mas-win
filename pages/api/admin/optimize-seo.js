// 네이버 블로그 SEO 최적화 API
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    title, 
    content, 
    contentType = '네이버 블로그'
  } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: '제목과 내용이 필요합니다.' });
  }

  try {
    console.log('🔍 네이버 블로그 SEO 최적화 시작...');
    console.log('📝 제목:', title);
    console.log('📄 내용 길이:', content.length);
    
    // 네이버 블로그에 최적화된 SEO 프롬프트 생성
    const prompt = `
당신은 네이버 블로그 SEO 최적화 전문가입니다.

**현재 콘텐츠:**
제목: ${title}
내용: ${content.substring(0, 1000)}...

**SEO 최적화 요구사항:**
1. 네이버 블로그에 최적화된 메타 제목 (30-60자)
2. 네이버 블로그에 최적화된 메타 설명 (120-160자)
3. 네이버 블로그 태그에 적합한 키워드 (5-10개)
4. URL 친화적인 슬러그 생성
5. 네이버 검색에 최적화된 키워드 포함

**응답 형식:**
{
  "metaTitle": "SEO 최적화된 메타 제목",
  "metaDescription": "SEO 최적화된 메타 설명",
  "metaKeywords": "키워드1, 키워드2, 키워드3",
  "urlSlug": "seo-optimized-slug",
  "seoScore": 85,
  "recommendations": [
    "추천사항 1",
    "추천사항 2"
  ]
}

위 형식으로 JSON 응답해주세요.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 네이버 블로그 SEO 최적화 전문가입니다. 네이버 검색 알고리즘에 최적화된 메타데이터를 생성합니다."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    });

    const aiResponse = response.choices[0].message.content.trim();
    console.log('✅ AI SEO 응답 받음:', aiResponse.substring(0, 200) + '...');

    // JSON 파싱 시도
    let result;
    try {
      result = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('❌ JSON 파싱 오류:', parseError);
      // JSON 파싱 실패 시 기본 구조로 응답
      result = {
        metaTitle: title.length > 60 ? title.substring(0, 60) : title,
        metaDescription: content.substring(0, 150) + "...",
        metaKeywords: "골프, 드라이버, 비거리, 마쓰구프",
        urlSlug: title.toLowerCase().replace(/[^a-z0-9가-힣\s]/g, '').replace(/\s+/g, '-').substring(0, 50),
        seoScore: 70,
        recommendations: ["제목을 더 구체적으로 작성하세요", "키워드를 자연스럽게 포함하세요"]
      };
    }

    console.log('✅ 네이버 블로그 SEO 최적화 완료');
    
    res.status(200).json({
      success: true,
      metaTitle: result.metaTitle || title,
      metaDescription: result.metaDescription || content.substring(0, 150) + "...",
      metaKeywords: result.metaKeywords || "골프, 드라이버, 비거리",
      urlSlug: result.urlSlug || title.toLowerCase().replace(/[^a-z0-9가-힣\s]/g, '').replace(/\s+/g, '-').substring(0, 50),
      seoScore: result.seoScore || 70,
      recommendations: result.recommendations || ["SEO 최적화를 위해 더 많은 키워드를 포함하세요"],
      optimizedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ SEO 최적화 오류:', error);
    res.status(500).json({ 
      error: 'SEO 최적화 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
}
