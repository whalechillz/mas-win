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
    console.log('API 키 존재 여부:', !!process.env.KIE_AI_API_KEY);
    console.log('API 키 길이:', process.env.KIE_AI_API_KEY ? process.env.KIE_AI_API_KEY.length : 0);
    console.log('API 키 앞 10자리:', process.env.KIE_AI_API_KEY ? process.env.KIE_AI_API_KEY.substring(0, 10) + '...' : '없음');
    
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
    
    // Kie AI API 호출 - 올바른 엔드포인트 사용
    const possibleEndpoints = [
      'https://kieai.erweima.ai/api/v1/gpt4o-image/generate',
      'https://api.kie.ai/v1/images/generate',
      'https://api.kie.ai/images/generate',
      'https://kie.ai/api/v1/images/generate',
      'https://kie.ai/api/images/generate'
    ];

    let kieResponse = null;
    let lastError = null;

    for (const endpoint of possibleEndpoints) {
      try {
        console.log(`🔄 Kie AI 엔드포인트 시도: ${endpoint}`);
        
        // 여러 인증 방식 시도
        const authHeaders = [
          { 'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}` },
          { 'X-API-Key': process.env.KIE_AI_API_KEY },
          { 'api-key': process.env.KIE_AI_API_KEY },
          { 'Authorization': `Api-Key ${process.env.KIE_AI_API_KEY}` }
        ];

        for (const authHeader of authHeaders) {
          try {
            kieResponse = await fetch(endpoint, {
              method: 'POST',
              headers: {
                ...authHeader,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                prompt: smartPrompt,
                size: "1:1",
                fileUrl: null, // 이미지 생성이므로 null
                callBackUrl: null // 콜백 URL이 필요하지 않으면 null
              })
            });

            if (kieResponse.ok) {
              console.log(`✅ 성공한 인증 방식: ${Object.keys(authHeader)[0]}`);
              break;
            } else {
              const errorText = await kieResponse.text();
              console.log(`❌ 인증 실패: ${Object.keys(authHeader)[0]} - ${kieResponse.status}: ${errorText}`);
            }
          } catch (error) {
            console.log(`❌ 인증 에러: ${Object.keys(authHeader)[0]} - ${error.message}`);
          }
        }

        if (kieResponse.ok) {
          console.log(`✅ 성공한 엔드포인트: ${endpoint}`);
          break;
        } else {
          const errorText = await kieResponse.text();
          console.log(`❌ 실패한 엔드포인트: ${endpoint} - ${kieResponse.status}: ${errorText}`);
          lastError = errorText;
        }
      } catch (error) {
        console.log(`❌ 연결 실패: ${endpoint} - ${error.message}`);
        lastError = error.message;
      }
    }

    if (!kieResponse || !kieResponse.ok) {
      throw new Error(`모든 Kie AI 엔드포인트 실패. 마지막 에러: ${lastError}`);
    }

    const kieResult = await kieResponse.json();
    console.log('Kie AI 응답:', kieResult);
    
    // Kie AI 응답 형식에 맞게 이미지 URL 추출
    let imageUrls = kieResult.images || kieResult.data || kieResult.result || [];
    
    // 단일 이미지 URL인 경우 배열로 변환
    if (typeof imageUrls === 'string') {
      imageUrls = [imageUrls];
    }

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

