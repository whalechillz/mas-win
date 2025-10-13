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
    // Stability AI API 키 확인
    if (!process.env.STABILITY_API_KEY) {
      return res.status(400).json({ 
        success: false, 
        error: 'Stability AI API 키가 설정되지 않았습니다. 환경 변수 STABILITY_API_KEY를 확인해주세요.' 
      });
    }

    const { 
      title, 
      excerpt, 
      contentType, 
      brandStrategy, 
      baseImageUrl,
      variationStrength = 0.6,
      variationCount = 1
    } = req.body;

    console.log('🎨 Stability AI 이미지 변형 시작...');
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
        model: 'stability-ai'
      })
    });

    if (!promptResponse.ok) {
      throw new Error('ChatGPT 프롬프트 생성 실패');
    }

    const { prompt: variationPrompt } = await promptResponse.json();
    console.log('✅ ChatGPT 변형 프롬프트 생성 완료');
    console.log('생성된 프롬프트:', variationPrompt);

    // Stability AI Image-to-Image API 호출 (올바른 엔드포인트 사용)
    const stabilityResponse = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        init_image: baseImageUrl,
        text_prompts: [
          {
            text: variationPrompt,
            weight: 1.0
          }
        ],
        cfg_scale: 7,
        steps: 30,
        samples: variationCount,
        style_preset: 'photographic',
        init_image_mode: 'IMAGE_STRENGTH',
        image_strength: variationStrength,
        seed: Math.floor(Math.random() * 1000000) // 시드 추가로 다양성 확보
      })
    });

    if (!stabilityResponse.ok) {
      const errorText = await stabilityResponse.text();
      throw new Error(`Stability AI API 오류: ${stabilityResponse.status} - ${errorText}`);
    }

    const stabilityResult = await stabilityResponse.json();
    console.log('Stability AI 응답:', stabilityResult);

    if (!stabilityResult.artifacts || stabilityResult.artifacts.length === 0) {
      throw new Error('Stability AI에서 이미지를 생성하지 못했습니다');
    }

    console.log('✅ Stability AI 이미지 변형 완료:', stabilityResult.artifacts.length, '개');

    // 생성된 이미지들을 Supabase에 저장
    const savedImages = [];
    for (let i = 0; i < stabilityResult.artifacts.length; i++) {
      const artifact = stabilityResult.artifacts[i];
      const imageBuffer = Buffer.from(artifact.base64, 'base64');
      const fileName = `stability-ai-${Date.now()}-${i + 1}.png`;
      
      try {
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
          fileName: fileName,
          publicUrl: publicUrl,
          variationIndex: i + 1,
          seed: artifact.seed
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
          model: 'Stability AI',
          cost: 0.03 * savedImages.length,
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
      message: `Stability AI 이미지 변형 완료: ${savedImages.length}개`,
      images: savedImages,
      prompt: variationPrompt,
      variationStrength,
      model: 'Stability AI'
    });

  } catch (error) {
    console.error('Stability AI 이미지 변형 실패:', error);
    
    // AI 사용량 추적 (실패)
    try {
      await fetch(`${baseUrl}/api/admin/ai-stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'image-variation-failed',
          model: 'Stability AI',
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
      message: 'Stability AI 이미지 변형에 실패했습니다'
    });
  }
}
