import { OpenAI } from 'openai';
import { transformToSlug } from '../../lib/masgolf-brand-data.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log('🔧 슬러그 API 모듈 로드됨');

export default async function handler(req, res) {
  console.log('🔗 슬러그 생성 API 호출:', req.method, req.body);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    console.log('📝 제목:', title);
    // 먼저 MASSGOO 브랜드 규칙에 따라 변환
    const transformedTitle = transformToSlug(title);
    console.log('🔄 변환된 제목:', transformedTitle);
    
    // OpenAI API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️ OpenAI API 키가 없어서 간단한 슬러그 생성');
      const simpleSlug = transformedTitle
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      
      console.log('✅ 간단한 슬러그:', simpleSlug);
      return res.status(200).json({ slug: simpleSlug });
    }
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an SEO expert. Convert Korean titles to SEO-optimized English slugs. Rules: 1) Use lowercase 2) Replace spaces with hyphens 3) Remove special characters 4) Keep it concise and keyword-rich 5) Make it URL-friendly 6) Special brand name conversion: '마쓰구' → 'massgoo', 'MASSGOO' → 'massgoo'. Example: '뜨거운 여름, 완벽한 스윙 로얄살루트 증정 행사' → 'hot-summer-perfect-swing-royal-salute-gift-event'"
        },
        {
          role: "user",
          content: `Convert this Korean title to an SEO-optimized English slug: "${transformedTitle}"`
        }
      ],
      max_tokens: 50,
      temperature: 0.3,
    });

    const slug = completion.choices[0].message.content.trim();
    
    console.log('✅ 생성된 슬러그:', slug);
    return res.status(200).json({ slug });
  } catch (error) {
    console.error('❌ 슬러그 생성 에러:', error);
    return res.status(500).json({ error: 'Failed to generate slug' });
  }
}