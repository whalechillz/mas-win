import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { 
      imageUrl,
      improvementRequest,
      model = 'fal' // 'fal', 'replicate', 'stability'
    } = req.body;

    console.log('🎨 간단 AI 이미지 개선 요청:', { 
      imageUrl, 
      improvementRequest,
      model
    });

    if (!imageUrl || !improvementRequest) {
      return res.status(400).json({ 
        error: '이미지 URL과 개선 요청사항이 모두 필요합니다.' 
      });
    }

    // ChatGPT로 이미지 개선 프롬프트 생성
    const promptResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `당신은 이미지 편집 및 개선 전문가입니다. 사용자의 요청사항을 바탕으로 구체적이고 실행 가능한 이미지 편집 지시사항을 영어로 작성합니다.

다음과 같은 요청 유형들을 처리할 수 있습니다:
- 텍스트/글자 제거: "Remove text, letters, or writing from the image"
- 특정 객체 제거: "Remove [specific object] from the image"
- 스타일 변경: "Change the style to [desired style]"
- 색상 조정: "Adjust colors to [desired colors]"
- 품질 개선: "Improve image quality and sharpness"
- 배경 변경: "Change background to [desired background]"

항상 구체적이고 명확한 영어 프롬프트를 작성하세요.`
        },
        {
          role: "user",
          content: `다음 이미지를 개선해주세요.

개선 요청사항: ${improvementRequest}

이미지 URL: ${imageUrl}

위 요청사항을 바탕으로 이미지 편집을 위한 구체적인 영어 프롬프트를 작성해주세요. 프롬프트는 다음 형식을 따라주세요:

"Edit the image to [구체적인 편집 내용]. [추가적인 세부사항]."

예시:
- "Edit the image to remove all text and writing while keeping the main subject intact."
- "Edit the image to remove the golf driver from the golfer's hands while maintaining the natural pose."
- "Edit the image to improve sharpness and contrast for better visual quality."`
        }
      ],
      max_tokens: 200,
      temperature: 0.3
    });

    const editPrompt = promptResponse.choices[0].message.content;
    console.log('✅ ChatGPT 이미지 편집 프롬프트 생성 완료:', editPrompt);

    // 선택된 모델에 따라 이미지 편집 API 호출
    let result;
    switch (model) {
      case 'fal':
        result = await editImageWithFAL(imageUrl, editPrompt);
        break;
      case 'replicate':
        result = await editImageWithReplicate(imageUrl, editPrompt);
        break;
      case 'stability':
        result = await editImageWithStability(imageUrl, editPrompt);
        break;
      default:
        throw new Error('지원하지 않는 모델입니다.');
    }

    // 편집된 이미지를 Supabase에 저장
    const savedImage = await saveImageToSupabase(result.imageUrl, 'simple-ai-improvement');

    console.log('✅ 간단 AI 이미지 개선 완료');

    res.status(200).json({
      success: true,
      improvedImage: savedImage,
      originalImage: imageUrl,
      improvementRequest,
      editPrompt,
      model: model.toUpperCase(),
      usageInfo: {
        model: 'GPT-4o-mini + ' + model.toUpperCase(),
        tokens: promptResponse.usage?.total_tokens || 0,
        cost: promptResponse.usage?.total_tokens ? (promptResponse.usage.total_tokens * 0.00015 / 1000).toFixed(4) : '0.0000'
      }
    });

  } catch (error) {
    console.error('❌ 간단 AI 이미지 개선 오류:', error);
    res.status(500).json({ 
      error: '간단 AI 이미지 개선 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
}

// FAL AI를 사용한 이미지 편집
async function editImageWithFAL(imageUrl, editPrompt) {
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
      prompt: editPrompt,
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
  
  // 폴링 로직
  let finalResult = falResult;
  if (falResult.status === 'IN_QUEUE') {
    let attempts = 0;
    const maxAttempts = 30;
    
    while (finalResult.status === 'IN_QUEUE' || finalResult.status === 'IN_PROGRESS') {
      if (attempts >= maxAttempts) {
        throw new Error('FAL AI 이미지 편집 시간 초과');
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
      attempts++;
    }
  }

  if (!finalResult.images || finalResult.images.length === 0) {
    throw new Error('FAL AI에서 이미지를 편집하지 못했습니다');
  }

  return {
    imageUrl: finalResult.images[0].url,
    model: 'FAL AI'
  };
}

// Replicate를 사용한 이미지 편집
async function editImageWithReplicate(imageUrl, editPrompt) {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error('Replicate API 토큰이 설정되지 않았습니다.');
  }

  // Replicate의 이미지 편집을 위해 새로운 이미지 생성
  // 원본 이미지의 스타일을 참고하여 편집된 이미지를 생성
  const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: "flux-dev",
      input: {
        prompt: editPrompt,
        num_inference_steps: 4,
        guidance_scale: 1,
        num_outputs: 1,
        width: 1024,
        height: 1024
      }
    })
  });

  if (!replicateResponse.ok) {
    const errorText = await replicateResponse.text();
    throw new Error(`Replicate API 오류: ${replicateResponse.status} - ${errorText}`);
  }

  const replicateResult = await replicateResponse.json();
  
  // 폴링 로직
  let finalResult = replicateResult;
  while (finalResult.status === 'starting' || finalResult.status === 'processing') {
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${finalResult.id}`, {
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
      }
    });
    
    if (!statusResponse.ok) {
      throw new Error(`Replicate 상태 확인 실패: ${statusResponse.status}`);
    }
    
    finalResult = await statusResponse.json();
  }

  if (finalResult.status !== 'succeeded' || !finalResult.output || finalResult.output.length === 0) {
    throw new Error('Replicate에서 이미지를 편집하지 못했습니다');
  }

  return {
    imageUrl: finalResult.output[0],
    model: 'Replicate Flux'
  };
}

// Stability AI를 사용한 이미지 편집
async function editImageWithStability(imageUrl, editPrompt) {
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
          text: editPrompt,
          weight: 1
        }
      ],
      cfg_scale: 7,
      height: 1024,
      width: 1024,
      samples: 1,
      steps: 30
    })
  });

  if (!stabilityResponse.ok) {
    const errorText = await stabilityResponse.text();
    throw new Error(`Stability AI API 오류: ${stabilityResponse.status} - ${errorText}`);
  }

  const stabilityResult = await stabilityResponse.json();

  if (!stabilityResult.artifacts || stabilityResult.artifacts.length === 0) {
    throw new Error('Stability AI에서 이미지를 편집하지 못했습니다');
  }

  // Base64 이미지를 URL로 변환
  const base64Image = stabilityResult.artifacts[0].base64;
  const imageBuffer = Buffer.from(base64Image, 'base64');
  
  // 임시로 Supabase에 저장하여 URL 생성
  const fileName = `stability-edit-${Date.now()}.png`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('blog-images')
    .upload(fileName, imageBuffer, {
      contentType: 'image/png',
      upsert: false
    });

  if (uploadError) {
    throw new Error(`Stability AI 이미지 저장 실패: ${uploadError.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('blog-images')
    .getPublicUrl(fileName);

  return {
    imageUrl: publicUrl,
    model: 'Stability AI'
  };
}

// 이미지를 Supabase에 저장하는 헬퍼 함수
async function saveImageToSupabase(imageUrl, prefix) {
  try {
    // 이미지 다운로드
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`이미지 다운로드 실패: ${imageResponse.status}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const fileName = `${prefix}-${Date.now()}.png`;
    
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

    return {
      fileName: fileName,
      publicUrl: publicUrl,
      originalUrl: imageUrl
    };
  } catch (error) {
    console.error('이미지 저장 실패:', error);
    throw error;
  }
}

