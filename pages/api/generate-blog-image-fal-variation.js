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
    // FAL AI API 키 확인
    if (!process.env.FAL_KEY && !process.env.FAL_API_KEY) {
      return res.status(400).json({ 
        success: false, 
        error: 'FAL AI API 키가 설정되지 않았습니다. 환경 변수 FAL_KEY 또는 FAL_API_KEY를 확인해주세요.' 
      });
    }

    const { 
      title, 
      excerpt, 
      contentType, 
      brandStrategy, 
      baseImageUrl,
      variationStrength = 0.7,
      variationCount = 1
    } = req.body;

    console.log('🎨 FAL AI 이미지 변형 시작...');
    console.log('제목:', title);
    console.log('콘텐츠 유형:', contentType);
    console.log('기본 이미지:', baseImageUrl);
    console.log('변형 강도:', variationStrength);
    console.log('변형 개수:', variationCount);

    // 절대 URL 생성 (전역 스코프)
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';

    // ChatGPT로 변형 프롬프트 생성
    console.log('🤖 ChatGPT로 변형 프롬프트 생성 시작...');
    
    const promptResponse = await fetch(`${baseUrl}/api/generate-smart-prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        title,
        excerpt,
        contentType,
        brandStrategy,
        model: 'fal-variation'
      })
    });

    if (!promptResponse.ok) {
      throw new Error('ChatGPT 프롬프트 생성 실패');
    }

    const { prompt: variationPrompt } = await promptResponse.json();
    console.log('✅ ChatGPT 변형 프롬프트 생성 완료');
    console.log('생성된 프롬프트:', variationPrompt);

    // FAL AI Image-to-Image 변형 API 호출
    const falResponse = await fetch('https://queue.fal.run/fal-ai/flux-schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.FAL_KEY || process.env.FAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: variationPrompt,
        image_url: baseImageUrl,
        num_inference_steps: 4,
        guidance_scale: 1,
        strength: variationStrength,
        num_images: variationCount,
        enable_safety_checker: true
      })
    });

    if (!falResponse.ok) {
      const errorText = await falResponse.text();
      throw new Error(`FAL AI API 오류: ${falResponse.status} - ${errorText}`);
    }

    const falResult = await falResponse.json();
    console.log('FAL AI 응답:', falResult);

    // FAL AI 폴링 로직 (IN_QUEUE 상태 처리)
    let finalResult = falResult;
    if (falResult.status === 'IN_QUEUE') {
      console.log('🔄 FAL AI 큐 대기 중...');
      let attempts = 0;
      const maxAttempts = 30; // 5분 대기
      
      while (finalResult.status === 'IN_QUEUE' || finalResult.status === 'IN_PROGRESS') {
        if (attempts >= maxAttempts) {
          throw new Error('FAL AI 이미지 생성 시간 초과');
        }
        
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10초 대기
        
        const statusResponse = await fetch(falResult.status_url, {
          headers: {
            'Authorization': `Key ${process.env.FAL_KEY || process.env.FAL_API_KEY}`,
          }
        });
        
        if (!statusResponse.ok) {
          throw new Error(`FAL AI 상태 확인 실패: ${statusResponse.status}`);
        }
        
        finalResult = await statusResponse.json();
        console.log(`🔄 FAL AI 상태 확인 (${attempts + 1}/${maxAttempts}):`, finalResult.status);
        attempts++;
      }
    }

    if (!finalResult.images || finalResult.images.length === 0) {
      throw new Error('FAL AI에서 이미지를 생성하지 못했습니다');
    }

    console.log('✅ FAL AI 이미지 변형 완료:', finalResult.images.length, '개');

    // 생성된 이미지들을 Supabase에 저장
    const savedImages = [];
    for (let i = 0; i < finalResult.images.length; i++) {
      const imageUrl = finalResult.images[i].url;
      
      try {
        // 이미지 다운로드
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error(`이미지 다운로드 실패: ${imageResponse.status}`);
        }
        
        const imageBuffer = await imageResponse.arrayBuffer();
        const fileName = `fal-variation-${Date.now()}-${i + 1}.png`;
        
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
      await fetch(`${baseUrl}/api/admin/ai-stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'image-variation-success',
          model: 'FAL AI Image-to-Image',
          cost: 0.02 * savedImages.length,
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
      message: `FAL AI 이미지 변형 완료: ${savedImages.length}개`,
      images: savedImages,
      prompt: variationPrompt,
      variationStrength,
      model: 'FAL AI Image-to-Image'
    });

  } catch (error) {
    console.error('FAL AI 이미지 변형 실패:', error);
    
    // AI 사용량 추적 (실패)
    try {
      await fetch(`${baseUrl}/api/admin/ai-stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'image-variation-failed',
          model: 'FAL AI Image-to-Image',
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
      message: 'FAL AI 이미지 변형에 실패했습니다'
    });
  }
}
