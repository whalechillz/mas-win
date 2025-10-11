import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Replicate API 키 확인
    if (!process.env.REPLICATE_API_TOKEN) {
      console.error('❌ Replicate API 키 누락:', {
        REPLICATE_API_TOKEN: !!process.env.REPLICATE_API_TOKEN,
        allEnvKeys: Object.keys(process.env).filter(key => key.includes('REPLICATE'))
      });
      return res.status(400).json({ 
        success: false, 
        error: 'Replicate API 키가 설정되지 않았습니다. 환경 변수 REPLICATE_API_TOKEN을 확인해주세요.' 
      });
    }

    const { 
      title, 
      excerpt, 
      contentType, 
      brandStrategy, 
      baseImageUrl,
      variationStrength = 0.8,
      variationCount = 1
    } = req.body;

    console.log('🎨 Replicate Flux 이미지 변형 시작...');
    console.log('제목:', title);
    console.log('콘텐츠 유형:', contentType);
    console.log('기본 이미지:', baseImageUrl);
    console.log('변형 강도:', variationStrength);
    console.log('변형 개수:', variationCount);

    // ChatGPT로 변형 프롬프트 생성
    console.log('🤖 ChatGPT로 변형 프롬프트 생성 시작...');
    
    // 절대 URL 생성
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
    
    const promptResponse = await fetch(`${baseUrl}/api/generate-smart-prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        title,
        excerpt,
        contentType,
        brandStrategy,
        model: 'replicate-flux'
      })
    });

    if (!promptResponse.ok) {
      throw new Error('ChatGPT 프롬프트 생성 실패');
    }

    const { prompt: variationPrompt } = await promptResponse.json();
    console.log('✅ ChatGPT 변형 프롬프트 생성 완료');
    console.log('생성된 프롬프트:', variationPrompt);

    // Replicate API 호출 (Flux Dev 모델로 이미지 변형 - 더 나은 품질)
    const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "black-forest-labs/flux-dev",
        input: {
          prompt: variationPrompt,
          image: baseImageUrl, // 원본 이미지 추가
          num_inference_steps: 20,
          guidance_scale: 3.5,
          strength: variationStrength, // 변형 강도 적용
          num_outputs: variationCount,
          aspect_ratio: "1:1",
          output_format: "png",
          output_quality: 90
        }
      })
    });

    if (!replicateResponse.ok) {
      const errorText = await replicateResponse.text();
      console.error('❌ Replicate API 오류:', { 
        status: replicateResponse.status, 
        statusText: replicateResponse.statusText,
        error: errorText,
        headers: Object.fromEntries(replicateResponse.headers.entries())
      });
      throw new Error(`Replicate API 오류: ${replicateResponse.status} - ${errorText}`);
    }

    const replicateResult = await replicateResponse.json();
    console.log('Replicate 응답:', replicateResult);

    // 폴링으로 결과 대기
    let prediction = replicateResult;
    let attempts = 0;
    const maxAttempts = 30; // 5분 대기

    while (prediction.status === 'starting' || prediction.status === 'processing') {
      if (attempts >= maxAttempts) {
        throw new Error('Replicate 이미지 변형 시간 초과');
      }

      await new Promise(resolve => setTimeout(resolve, 10000)); // 10초 대기
      
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        }
      });

      if (!statusResponse.ok) {
        throw new Error(`Replicate 상태 확인 실패: ${statusResponse.status}`);
      }

      prediction = await statusResponse.json();
      attempts++;
      console.log(`Replicate 상태 확인 ${attempts}/${maxAttempts}: ${prediction.status}`);
    }

    if (prediction.status === 'failed') {
      throw new Error(`Replicate 이미지 변형 실패: ${prediction.error}`);
    }

    if (!prediction.output || prediction.output.length === 0) {
      throw new Error('Replicate에서 이미지를 생성하지 못했습니다');
    }

    console.log('✅ Replicate Flux 이미지 변형 완료:', prediction.output.length, '개');

    // 생성된 이미지 URL들을 반환 (Supabase에 직접 저장하지 않음)
    const generatedImages = [];
    for (let i = 0; i < prediction.output.length; i++) {
      const imageUrl = prediction.output[i];
      
      generatedImages.push({
        originalUrl: imageUrl,
        variationIndex: i + 1
      });

      console.log(`✅ 이미지 ${i + 1} 생성 완료:`, imageUrl);
    }

    // AI 사용량 추적
    try {
      await fetch(`${baseUrl}/api/admin/ai-stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'image-variation-success',
          model: 'Replicate Flux',
          cost: 0.05 * generatedImages.length,
          details: {
            variationCount: generatedImages.length,
            variationStrength,
            baseImageUrl
          }
        })
      });
    } catch (error) {
      console.error('AI 사용량 추적 실패:', error);
    }

    return res.status(200).json({
      success: true,
      message: `Replicate Flux 이미지 변형 완료: ${generatedImages.length}개`,
      images: generatedImages,
      prompt: variationPrompt,
      variationStrength,
      model: 'Replicate Flux'
    });

  } catch (error) {
    console.error('Replicate Flux 이미지 변형 실패:', error);
    
    // AI 사용량 추적 (실패)
    try {
      await fetch(`${baseUrl}/api/admin/ai-stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'image-variation-failed',
          model: 'Replicate Flux',
          cost: 0,
          details: { error: error.message }
        })
      });
    } catch (trackingError) {
      console.error('AI 사용량 추적 실패:', trackingError);
    }

    return res.status(500).json({
      success: false,
      error: error.message,
      message: 'Replicate Flux 이미지 변형에 실패했습니다'
    });
  }
}
