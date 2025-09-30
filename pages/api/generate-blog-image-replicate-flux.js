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
    const promptResponse = await fetch('/api/generate-smart-prompt', {
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

    // Replicate Flux API 호출
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
          image: baseImageUrl,
          num_inference_steps: 20,
          guidance_scale: 3.5,
          strength: variationStrength,
          num_outputs: variationCount,
          aspect_ratio: "1:1",
          output_format: "png",
          output_quality: 90
        }
      })
    });

    if (!replicateResponse.ok) {
      const errorText = await replicateResponse.text();
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

    // 생성된 이미지들을 Supabase에 저장
    const savedImages = [];
    for (let i = 0; i < prediction.output.length; i++) {
      const imageUrl = prediction.output[i];
      
      try {
        // 이미지 다운로드
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error(`이미지 다운로드 실패: ${imageResponse.status}`);
        }
        
        const imageBuffer = await imageResponse.arrayBuffer();
        const fileName = `replicate-flux-${Date.now()}-${i + 1}.png`;
        
        // Supabase Storage에 업로드
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('blog-images')
          .upload(fileName, imageBuffer, {
            contentType: 'image/png',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Supabase 업로드 실패: ${uploadError.message}`);
        }

        // 공개 URL 생성
        const { data: { publicUrl } } = supabase.storage
          .from('blog-images')
          .getPublicUrl(fileName);

        savedImages.push({
          originalUrl: imageUrl,
          fileName: fileName,
          publicUrl: publicUrl,
          variationIndex: i + 1
        });

        console.log(`✅ 이미지 ${i + 1} 저장 완료:`, publicUrl);
      } catch (error) {
        console.error(`이미지 ${i + 1} 저장 실패:`, error);
      }
    }

    // AI 사용량 추적
    try {
      await fetch('/api/admin/ai-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'image-variation-success',
          model: 'Replicate Flux',
          cost: 0.05 * savedImages.length,
          details: {
            variationCount: savedImages.length,
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
      message: `Replicate Flux 이미지 변형 완료: ${savedImages.length}개`,
      images: savedImages,
      prompt: variationPrompt,
      variationStrength,
      model: 'Replicate Flux'
    });

  } catch (error) {
    console.error('Replicate Flux 이미지 변형 실패:', error);
    
    // AI 사용량 추적 (실패)
    try {
      await fetch('/api/admin/ai-stats', {
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
