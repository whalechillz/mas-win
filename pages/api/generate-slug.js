import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an SEO expert. Convert Korean titles to SEO-optimized English slugs. Rules: 1) Use lowercase 2) Replace spaces with hyphens 3) Remove special characters 4) Keep it concise and keyword-rich 5) Make it URL-friendly. Example: '뜨거운 여름, 완벽한 스윙 로얄살루트 증정 행사' → 'hot-summer-perfect-swing-royal-salute-gift-event'"
        },
        {
          role: "user",
          content: `Convert this Korean title to an SEO-optimized English slug: "${title}"`
        }
      ],
      max_tokens: 50,
      temperature: 0.3,
    });

    const slug = completion.choices[0].message.content.trim();
    
    return res.status(200).json({ slug });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return res.status(500).json({ error: 'Failed to generate slug' });
  }
}