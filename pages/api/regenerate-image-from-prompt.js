import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 이미지를 Supabase에 저장하는 함수
async function saveImageToSupabase(imageUrl, prefix = 'regenerated') {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`이미지 다운로드 실패: ${response.status}`);
    }
    
    const imageBuffer = await response.arrayBuffer();
    const fileName = `${prefix}-${Date.now()}.png`;
    
    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: false
      });
    
    if (error) {
      throw new Error(`Supabase 업로드 실패: ${error.message}`);
    }
    
    const { data: publicData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(fileName);
    
    return {
      fileName,
      publicUrl: publicData.publicUrl
    };
  } catch (error) {
    console.error('이미지 저장 오류:', error);
    throw error;
  }
}

// FAL AI로 이미지 생성
async function generateImageWithFAL(prompt) {
  if (!process.env.FAL_KEY && !process.env.FAL_API_KEY) {
    throw new Error('FAL AI API 키가 설정되지 않았습니다.');
  }

  const falResponse = await fetch('https://queue.fal.run/fal-ai/flux', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${process.env.FAL_KEY || process.env.FAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: prompt,
      num_inference_steps: 4,
      guidance_scale: 1,
      num_images: 1,
      enable_safety_checker: true
    })
  });

  if (!falResponse.ok) {
    const errorText = await falResponse.text();
    throw new Error(`FAL AI API 오류: ${falResponse.status} - ${errorText}`);
  }

  const falResult = await falResponse.json();
  console.log('FAL AI 응답:', falResult);

  // FAL AI 폴링 로직
  let finalResult = falResult;
  if (falResult.status === 'IN_QUEUE') {
    console.log('🔄 FAL AI 큐 대기 중...');
    let attempts = 0;
    const maxAttempts = 30;
    
    while (finalResult.status === 'IN_QUEUE' || finalResult.status === 'IN_PROGRESS') {
      if (attempts >= maxAttempts) {
        throw new Error('FAL AI 이미지 생성 시간 초과');
      }
      
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      const statusResponse = await fetch(finalResult.status_url, {
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
    throw new Error('FAL AI에서 이미지를 생성하지 못했습니다.');
  }

  return finalResult.images[0].url;
}

// Replicate로 이미지 생성
async function generateImageWithReplicate(prompt) {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error('Replicate API 토큰이 설정되지 않았습니다.');
  }

  const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: "black-forest-labs/flux-dev",
      input: {
        prompt: prompt,
        num_inference_steps: 20,
        guidance_scale: 3.5,
        num_outputs: 1,
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

  // Replicate 폴링 로직
  let finalResult = replicateResult;
  if (replicateResult.status === 'starting' || replicateResult.status === 'processing') {
    console.log('🔄 Replicate 처리 중...');
    let attempts = 0;
    const maxAttempts = 30;
    
    while (finalResult.status === 'starting' || finalResult.status === 'processing') {
      if (attempts >= maxAttempts) {
        throw new Error('Replicate 이미지 생성 시간 초과');
      }
      
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${finalResult.id}`, {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        }
      });
      
      if (!statusResponse.ok) {
        throw new Error(`Replicate 상태 확인 실패: ${statusResponse.status}`);
      }
      
      finalResult = await statusResponse.json();
      console.log(`🔄 Replicate 상태 확인 (${attempts + 1}/${maxAttempts}):`, finalResult.status);
      attempts++;
    }
  }

  if (finalResult.status !== 'succeeded' || !finalResult.output || finalResult.output.length === 0) {
    throw new Error('Replicate에서 이미지를 생성하지 못했습니다.');
  }

  return finalResult.output[0];
}

// Stability AI로 이미지 생성
async function generateImageWithStability(prompt) {
  if (!process.env.STABILITY_API_KEY) {
    throw new Error('Stability AI API 키가 설정되지 않았습니다.');
  }

  const stabilityResponse = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text_prompts: [
        {
          text: prompt,
          weight: 1
        }
      ],
      cfg_scale: 7,
      height: 1024,
      width: 1024,
      samples: 1,
      steps: 20,
      style_preset: 'photographic'
    })
  });

  if (!stabilityResponse.ok) {
    const errorText = await stabilityResponse.text();
    throw new Error(`Stability AI API 오류: ${stabilityResponse.status} - ${errorText}`);
  }

  const stabilityResult = await stabilityResponse.json();
  console.log('Stability AI 응답:', stabilityResult);

  if (!stabilityResult.artifacts || stabilityResult.artifacts.length === 0) {
    throw new Error('Stability AI에서 이미지를 생성하지 못했습니다.');
  }

  // Base64 이미지를 임시 URL로 변환
  const base64Image = stabilityResult.artifacts[0].base64;
  const imageBuffer = Buffer.from(base64Image, 'base64');
  
  // 임시로 Supabase에 저장하여 URL 생성
  const fileName = `stability-regenerated-${Date.now()}.png`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('blog-images')
    .upload(fileName, imageBuffer, {
      contentType: 'image/png',
      upsert: false
    });

  if (uploadError) {
    throw new Error(`Supabase 업로드 실패: ${uploadError.message}`);
  }

  const { data: publicData } = supabase.storage
    .from('blog-images')
    .getPublicUrl(fileName);

  return publicData.publicUrl;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { 
      translatedPrompt,
      model = 'fal',
      originalImageUrl = null
    } = req.body;

    console.log('🔄 프롬프트로 이미지 재생성 요청:', { 
      translatedPrompt,
      model
    });

    if (!translatedPrompt) {
      return res.status(400).json({ 
        error: '번역된 프롬프트가 필요합니다.' 
      });
    }

    let imageUrl;
    
    // 모델별 이미지 생성
    switch (model.toLowerCase()) {
      case 'fal':
        console.log('🎯 FAL AI로 이미지 재생성 중...');
        imageUrl = await generateImageWithFAL(translatedPrompt);
        break;
      case 'replicate':
        console.log('🎯 Replicate로 이미지 재생성 중...');
        imageUrl = await generateImageWithReplicate(translatedPrompt);
        break;
      case 'stability':
        console.log('🎯 Stability AI로 이미지 재생성 중...');
        imageUrl = await generateImageWithStability(translatedPrompt);
        break;
      default:
        throw new Error(`지원하지 않는 모델: ${model}`);
    }

    // 생성된 이미지를 Supabase에 저장
    const savedImage = await saveImageToSupabase(imageUrl, 'regenerated');

    console.log('✅ 프롬프트로 이미지 재생성 완료');

    res.status(200).json({
      success: true,
      newImageUrl: savedImage.publicUrl,
      fileName: savedImage.fileName,
      translatedPrompt,
      model: model.toUpperCase(),
      originalImageUrl,
      regeneratedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 프롬프트로 이미지 재생성 오류:', error);
    const errorMessage = error?.message || error?.toString() || '알 수 없는 오류가 발생했습니다.';
    res.status(500).json({ 
      error: '프롬프트로 이미지 재생성 중 오류가 발생했습니다.',
      details: errorMessage 
    });
  }
}
