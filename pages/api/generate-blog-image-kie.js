// Kie AI 이미지 생성 API
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { 
    title, 
    excerpt, 
    contentType = 'information',
    brandStrategy = {
      customerPersona: 'competitive_maintainer',
      customerChannel: 'local_customers',
      brandWeight: 'medium'
    },
    imageCount = 1,
    customPrompt = null
  } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  try {
    console.log('🎨 Kie AI 이미지 생성 시작...');
    console.log('제목:', title);
    console.log('콘텐츠 유형:', contentType);
    
    // ChatGPT로 프롬프트 생성 (FAL AI와 동일한 로직)
    const promptResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/generate-smart-prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        title,
        excerpt,
        contentType,
        brandStrategy,
        model: 'kie' // Kie AI용으로 설정
      })
    });

    if (!promptResponse.ok) {
      throw new Error('ChatGPT 프롬프트 생성 실패');
    }

    const { prompt: smartPrompt } = await promptResponse.json();
    console.log('생성된 프롬프트:', smartPrompt);
    
    // Kie AI API 호출 (실제 API 엔드포인트는 Kie AI 문서 확인 필요)
    const kieResponse = await fetch('https://api.kie.ai/v1/images/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: smartPrompt,
        num_images: Math.min(Math.max(imageCount, 1), 4),
        size: "1024x1024",
        quality: "high",
        model: "kie-v1"
      })
    });

    if (!kieResponse.ok) {
      const error = await kieResponse.text();
      console.error('Kie AI API 에러:', error);
      throw new Error(`Kie AI API 에러: ${error}`);
    }

    const kieResult = await kieResponse.json();
    const imageUrls = kieResult.images || kieResult.data || [];

    console.log('✅ Kie AI 이미지 생성 완료:', imageUrls.length, '개');

    res.status(200).json({ 
      success: true,
      imageUrl: imageUrls[0], // 첫 번째 이미지 (기존 호환성)
      imageUrls: imageUrls, // 모든 이미지 URL 배열
      imageCount: imageUrls.length,
      prompt: smartPrompt,
      model: 'Kie AI',
      metadata: {
        title,
        contentType,
        brandStrategy,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Kie AI 이미지 생성 에러:', error);
    res.status(500).json({ 
      message: 'Failed to generate image with Kie AI', 
      error: error.message 
    });
  }
}

