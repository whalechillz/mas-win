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
      model = 'fal', // 'fal', 'replicate', 'stability', 'vision-enhanced'
      originalPrompt = null, // 저장된 원본 프롬프트
      originalKoreanPrompt = null // 저장된 원본 한글 프롬프트
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

    // OpenAI API 키 검증
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OpenAI API 키 누락:', {
        OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
        allEnvKeys: Object.keys(process.env).filter(key => key.includes('OPENAI'))
      });
      return res.status(400).json({ 
        error: 'OpenAI API 키가 설정되지 않았습니다.' 
      });
    }

    // ChatGPT로 원본 이미지 분석 및 모델별 최적화된 프롬프트 생성
    console.log('🤖 ChatGPT API 호출 시작...');
    const imageAnalysisResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `당신은 이미지 분석 및 AI 모델별 프롬프트 최적화 전문가입니다. 
          
각 AI 모델의 특성을 이해하고 최적화된 프롬프트를 생성합니다:

1. **FAL AI (Flux 모델)**: 빠르고 저비용, 실사 스타일, 간결한 프롬프트 선호
2. **Replicate (Stable Diffusion)**: 안정적, 중간 비용, 상세한 기술적 프롬프트 선호  
3. **Stability AI (SDXL)**: 고품질, 고해상도, 전문적 용어와 구체적 스펙 선호
4. **DALL-E 3**: 창의적, 고품질, 다양한 스타일, 상세하고 명확한 프롬프트 선호

⚠️ 중요: 
- FAL AI: text-to-image 모델 (원본 이미지 스타일을 참고한 새로운 이미지 생성)
- Replicate, Stability AI: image-to-image 모델 (원본 이미지를 기반으로 수정)

사용자가 "텍스트 제거", "글자 제거" 등을 요청한 경우:
- FAL AI: 원본 이미지의 내용을 정확히 파악하여 텍스트가 없는 버전을 생성하는 프롬프트 작성
- Replicate/Stability: 전문적인 텍스트 제거 프롬프트 사용:
  * "clean image without text, remove watermark, remove banner, remove overlay text"
  * "professional photography, no text overlay, clean background"
  * "remove all text elements, maintain original composition and lighting"
  * "inpaint to remove text while preserving image quality"

원본 이미지를 분석하고 사용자 요청을 바탕으로 각 모델에 최적화된 프롬프트를 생성하세요.`
        },
        {
          role: "user",
          content: `원본 이미지 URL: ${imageUrl}
개선 요청사항: ${improvementRequest}
${originalPrompt ? `저장된 원본 프롬프트: ${originalPrompt}` : ''}
${originalKoreanPrompt ? `저장된 원본 한글 설명: ${originalKoreanPrompt}` : ''}

${originalPrompt ? 
  '위 이미지, 요청사항, 그리고 저장된 원본 프롬프트를 분석하여 다음 형식으로 각 AI 모델에 최적화된 프롬프트를 생성해주세요:' :
  '위 이미지와 요청사항을 분석하여 다음 형식으로 각 AI 모델에 최적화된 프롬프트를 생성해주세요:'
}

{
  "image_analysis": "이미지 내용 분석 (한국어)",
  "fal_prompt": "FAL AI용 최적화된 프롬프트 (영어, 간결하고 실사 스타일)",
  "replicate_prompt": "Replicate용 최적화된 프롬프트 (영어, 상세하고 기술적)",
  "stability_prompt": "Stability AI용 최적화된 프롬프트 (영어, 전문적이고 고품질)",
  "dalle_prompt": "DALL-E 3용 최적화된 프롬프트 (영어, 창의적이고 고품질)"
}

⚠️ 중요 지침:
1. 원본 이미지의 주제, 스타일, 색상, 구성을 정확히 파악하세요
2. ${originalPrompt ? '저장된 원본 프롬프트의 스타일과 구성을 참고하여 일관성을 유지하세요' : ''}
3. **인물 및 배경 유지 필수**: 원본 이미지의 인물(얼굴, 체형, 인종, 나이), 배경, 조명, 구도를 절대 변경하지 마세요
4. 텍스트/글자 제거 요청 시:
   - FAL AI: "원본 이미지와 동일한 [주제/스타일/인물/배경]이지만 텍스트나 글자가 없는 깨끗한 버전, maintain original person, maintain original background, keep same model, ABSOLUTELY NO TEXT: no text, no writing, no letters, no words, no symbols, no Korean text, no English text, no promotional text, no marketing copy, no overlays, no watermarks, no captions, no subtitles, no labels, no brand names, no product names, no slogans, no quotes, no numbers, no dates, no signatures, no logos, no text elements whatsoever. Pure clean image without any textual content. Text-free image only."
   - Replicate/Stability: "clean image without text, remove watermark, remove banner, remove overlay text, professional photography, no text overlay, clean background, remove all text elements, maintain original composition and lighting, maintain original person, maintain original background, keep same model, preserve facial features, preserve clothing, preserve setting, inpaint to remove text while preserving image quality, ABSOLUTELY NO TEXT: no text, no writing, no letters, no words, no symbols, no Korean text, no English text, no promotional text, no marketing copy, no overlays, no watermarks, no captions, no subtitles, no labels, no brand names, no product names, no slogans, no quotes, no numbers, no dates, no signatures, no logos, no text elements whatsoever. Pure clean image without any textual content. Text-free image only."
5. 절대 원본 이미지와 전혀 다른 주제(산, 자동차, 숲 등)의 이미지를 생성하지 마세요
6. 각 모델의 특성에 맞는 프롬프트를 작성하되, 원본 이미지의 핵심 요소는 반드시 유지하세요
7. 텍스트 제거 시에는 "remove text", "clean image", "no watermark", "maintain original person", "maintain original background" 등의 키워드를 반드시 포함하세요
8. ${originalPrompt ? '저장된 프롬프트의 품질과 스타일을 유지하면서 요청사항만 반영하세요' : ''}
9. **인물 특징 유지**: 얼굴, 체형, 인종, 나이, 표정, 포즈, 의상 등 모든 인물 특징을 정확히 유지하세요
10. **배경 유지**: 배경의 모든 요소(골프장, 건물, 하늘, 조명 등)를 정확히 유지하세요

각 프롬프트는 해당 모델의 강점을 최대한 활용하도록 작성해주세요.`
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    });

    console.log('✅ ChatGPT API 호출 완료');
    console.log('🔍 ChatGPT 응답 구조:', {
      hasChoices: !!imageAnalysisResponse.choices,
      choicesLength: imageAnalysisResponse.choices?.length,
      hasMessage: !!imageAnalysisResponse.choices?.[0]?.message,
      hasContent: !!imageAnalysisResponse.choices?.[0]?.message?.content
    });

    // ChatGPT 응답 파싱 및 검증
    let analysisResult;
    try {
      if (!imageAnalysisResponse.choices || !imageAnalysisResponse.choices[0] || !imageAnalysisResponse.choices[0].message) {
        throw new Error('ChatGPT 응답 구조가 올바르지 않습니다.');
      }
      
      const responseContent = imageAnalysisResponse.choices[0].message.content;
      console.log('🔍 ChatGPT 원본 응답:', responseContent);
      
      // JSON 파싱 시도
      analysisResult = JSON.parse(responseContent);
      
      // 필수 필드 검증
      if (!analysisResult.fal_prompt || !analysisResult.replicate_prompt || !analysisResult.stability_prompt) {
        throw new Error('ChatGPT 응답에 필수 프롬프트가 누락되었습니다.');
      }
      
      console.log('✅ ChatGPT 이미지 분석 및 모델별 프롬프트 생성 완료:', analysisResult);
    } catch (parseError) {
      console.error('❌ ChatGPT 응답 파싱 실패:', parseError);
      console.error('원본 응답:', imageAnalysisResponse.choices[0].message.content);
      
      // 기본 프롬프트로 폴백
      analysisResult = {
        image_analysis: `이미지 개선 요청: ${improvementRequest}`,
        fal_prompt: `${improvementRequest}, high quality, realistic photography, professional lighting, detailed, photorealistic, natural colors, sharp focus, masterpiece, best quality`,
        replicate_prompt: `${improvementRequest}, high quality, detailed, professional, maintain original composition`,
        stability_prompt: `${improvementRequest}, high quality, professional photography, 1024x1024, maintain original elements`,
        dalle_prompt: `${improvementRequest}, high quality, creative, professional photography`
      };
      
      console.log('⚠️ 기본 프롬프트로 폴백:', analysisResult);
    }
    console.log('🔍 원본 이미지 URL:', imageUrl);
    console.log('🔍 사용자 요청사항:', improvementRequest);
    console.log('🔍 선택된 모델:', model);

    // 선택된 모델에 따라 최적화된 프롬프트로 이미지 편집 API 호출
    let result;
    let editPrompt;
    
    switch (model) {
      case 'fal':
        editPrompt = analysisResult.fal_prompt || `${improvementRequest}, high quality, realistic style`;
        console.log('🎯 FAL AI 사용 프롬프트:', editPrompt);
        result = await editImageWithFAL(imageUrl, editPrompt);
        break;
      case 'replicate':
        editPrompt = analysisResult.replicate_prompt || `${improvementRequest}, high quality, detailed, professional`;
        console.log('🎯 Replicate 사용 프롬프트:', editPrompt);
        result = await editImageWithReplicate(imageUrl, editPrompt);
        break;
      case 'stability':
        editPrompt = analysisResult.stability_prompt || `${improvementRequest}, high quality, professional photography, 1024x1024`;
        console.log('🎯 Stability AI 사용 프롬프트:', editPrompt);
        result = await editImageWithStability(imageUrl, editPrompt);
        break;
      case 'dalle':
        // DALL-E 3는 image-to-image를 지원하지 않으므로 FAL AI로 대체
        editPrompt = analysisResult.fal_prompt || `${improvementRequest}, high quality, realistic, professional photography`;
        console.log('🎯 DALL-E 3 대신 FAL AI 사용 프롬프트:', editPrompt);
        result = await editImageWithFAL(imageUrl, editPrompt);
        break;
      case 'google':
        // Google AI는 image-to-image를 지원하지 않으므로 FAL AI로 대체
        editPrompt = analysisResult.fal_prompt || `${improvementRequest}, high quality, realistic, professional photography`;
        console.log('🎯 Google AI 대신 FAL AI 사용 프롬프트:', editPrompt);
        result = await editImageWithFAL(imageUrl, editPrompt);
        break;
      case 'vision-enhanced':
        // Google Vision API로 이미지 분석 후 새로운 이미지 생성
        console.log('🔍 Google Vision API로 이미지 분석 시작...');
        const visionAnalysis = await analyzeImageWithGoogleVision(imageUrl);
        console.log('✅ Google Vision 분석 완료:', visionAnalysis);
        
        // Vision 분석 결과와 개선 요청사항을 결합한 프롬프트 생성
        const combinedPrompt = `${visionAnalysis.prompt} ${improvementRequest}, high quality, realistic photography, professional lighting, detailed, 8K resolution, photorealistic, natural colors, sharp focus`;
        console.log('🎯 Vision-Enhanced 프롬프트:', combinedPrompt);
        
        // FAL AI로 새로운 이미지 생성
        result = await editImageWithFAL(imageUrl, combinedPrompt);
        result.visionAnalysis = visionAnalysis.analysis; // 분석 결과도 함께 반환
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
      generatedPrompts: analysisResult, // ChatGPT가 생성한 모든 모델별 프롬프트
      imageAnalysis: analysisResult.image_analysis, // 이미지 분석 결과
      usageInfo: {
        model: 'GPT-4o-mini + ' + model.toUpperCase(),
        tokens: imageAnalysisResponse.usage?.total_tokens || 0,
        cost: imageAnalysisResponse.usage?.total_tokens ? (imageAnalysisResponse.usage.total_tokens * 0.00015 / 1000).toFixed(4) : '0.0000'
      }
    });

  } catch (error) {
    console.error('❌ 간단 AI 이미지 개선 오류:', error);
    console.error('❌ 에러 스택:', error.stack);
    console.error('❌ 에러 타입:', typeof error);
    console.error('❌ 에러 이름:', error.name);
    console.error('❌ 요청 정보:', {
      method: req.method,
      url: req.url,
      body: req.body,
      headers: req.headers
    });
    
    const errorMessage = error?.message || error?.toString() || '알 수 없는 오류가 발생했습니다.';
    
    // JSON 응답 형식 보장
    try {
      res.status(500).json({ 
        error: '간단 AI 이미지 개선 중 오류가 발생했습니다.',
        details: errorMessage,
        timestamp: new Date().toISOString(),
        errorType: error.name || 'UnknownError'
      });
    } catch (jsonError) {
      console.error('❌ JSON 응답 생성 실패:', jsonError);
      res.status(500).send('Internal Server Error');
    }
  }
}

// FAL AI를 사용한 이미지 편집 (inpainting 모델 사용)
async function editImageWithFAL(imageUrl, editPrompt) {
  const falApiKey = process.env.FAL_KEY || process.env.FAL_API_KEY;
  if (!falApiKey) {
    console.error('❌ FAL AI API 키 누락:', {
      FAL_KEY: !!process.env.FAL_KEY,
      FAL_API_KEY: !!process.env.FAL_API_KEY,
      allEnvKeys: Object.keys(process.env).filter(key => key.includes('FAL'))
    });
    throw new Error('FAL AI API 키가 설정되지 않았습니다.');
  }
  
  console.log('🎯 FAL AI API 호출 시작:', { 
    imageUrl, 
    editPrompt,
    apiKeyLength: falApiKey.length,
    apiKeyPrefix: falApiKey.substring(0, 8) + '...'
  });

  // FAL AI는 text-to-image 모델이므로 원본 이미지 스타일을 참고한 새로운 이미지 생성
  // 원본 이미지 URL을 참고 이미지로 사용하여 스타일 일관성 유지
  const falResponse = await fetch('https://queue.fal.run/fal-ai/flux', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${falApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: editPrompt, // ChatGPT가 최적화한 FAL AI용 프롬프트 사용
      num_inference_steps: 20,
      guidance_scale: 3.5,
      num_images: 1,
      enable_safety_checker: true
    })
  });

  if (!falResponse.ok) {
    const errorText = await falResponse.text();
    console.error('❌ FAL AI API 오류:', { 
      status: falResponse.status, 
      statusText: falResponse.statusText,
      error: errorText,
      headers: Object.fromEntries(falResponse.headers.entries())
    });
    throw new Error(`FAL AI API 오류: ${falResponse.status} - ${errorText}`);
  }

  const falResult = await falResponse.json();
  console.log('🔍 FAL AI 초기 응답:', falResult);
  
  // 폴링 로직
  let finalResult = falResult;
  if (falResult.status === 'IN_QUEUE') {
    let attempts = 0;
    const maxAttempts = 60;
    
    while (finalResult.status === 'IN_QUEUE' || finalResult.status === 'IN_PROGRESS') {
      if (attempts >= maxAttempts) {
        throw new Error('FAL AI 이미지 편집 시간 초과');
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const statusResponse = await fetch(finalResult.status_url, {
        headers: {
          'Authorization': `Key ${falApiKey}`,
        }
      });
      
      if (!statusResponse.ok) {
        const statusErrorText = await statusResponse.text();
        console.error('❌ FAL AI 상태 확인 실패:', { 
          status: statusResponse.status, 
          error: statusErrorText 
        });
        throw new Error(`FAL AI 상태 확인 실패: ${statusResponse.status} - ${statusErrorText}`);
      }
      
      finalResult = await statusResponse.json();
      console.log(`🔍 FAL AI 상태 확인 (${attempts + 1}/${maxAttempts}):`, {
        status: finalResult.status,
        hasImages: !!finalResult.images,
        hasOutput: !!finalResult.output,
        hasData: !!finalResult.data,
        hasResult: !!finalResult.result,
        hasOutputs: !!finalResult.outputs,
        allKeys: Object.keys(finalResult)
      });
      attempts++;
    }
  }

  console.log('🔍 FAL AI 최종 결과:', finalResult);
  console.log('🔍 FAL AI 결과 구조 분석:', {
    hasImages: !!finalResult.images,
    imagesLength: finalResult.images?.length,
    hasOutput: !!finalResult.output,
    outputLength: finalResult.output?.length,
    status: finalResult.status,
    keys: Object.keys(finalResult)
  });
  
  if (finalResult.status === 'failed') {
    console.error('❌ FAL AI 작업 실패:', finalResult);
    throw new Error(`FAL AI 작업 실패: ${finalResult.error || '알 수 없는 오류'}`);
  }
  
  // FAL AI 응답 구조가 다양할 수 있으므로 여러 가능성 확인
  let resultImageUrl = null;
  
  // Case 1: images 배열
  if (finalResult.images && finalResult.images.length > 0) {
    resultImageUrl = finalResult.images[0].url || finalResult.images[0];
    console.log('✅ FAL AI 이미지 발견 (images 배열):', resultImageUrl);
  }
  // Case 2: output 배열
  else if (finalResult.output && finalResult.output.length > 0) {
    resultImageUrl = finalResult.output[0].url || finalResult.output[0];
    console.log('✅ FAL AI 이미지 발견 (output 배열):', resultImageUrl);
  }
  // Case 3: 직접 URL
  else if (finalResult.url) {
    resultImageUrl = finalResult.url;
    console.log('✅ FAL AI 이미지 발견 (직접 URL):', resultImageUrl);
  }
  // Case 4: data 배열
  else if (finalResult.data && finalResult.data.length > 0) {
    resultImageUrl = finalResult.data[0].url || finalResult.data[0];
    console.log('✅ FAL AI 이미지 발견 (data 배열):', resultImageUrl);
  }
  // Case 5: result 배열
  else if (finalResult.result && finalResult.result.length > 0) {
    resultImageUrl = finalResult.result[0].url || finalResult.result[0];
    console.log('✅ FAL AI 이미지 발견 (result 배열):', resultImageUrl);
  }
  // Case 6: outputs 배열
  else if (finalResult.outputs && finalResult.outputs.length > 0) {
    resultImageUrl = finalResult.outputs[0].url || finalResult.outputs[0];
    console.log('✅ FAL AI 이미지 발견 (outputs 배열):', resultImageUrl);
  }
  
  if (!resultImageUrl) {
    console.error('❌ FAL AI 결과에 이미지가 없음:', finalResult);
    console.error('❌ 사용 가능한 키들:', Object.keys(finalResult));
    throw new Error('FAL AI에서 이미지를 생성하지 못했습니다. 결과에 이미지가 없습니다.');
  }

  return {
    imageUrl: resultImageUrl,
    model: 'FAL AI'
  };
}

// Replicate를 사용한 이미지 편집 (inpainting 모델 사용)
async function editImageWithReplicate(imageUrl, editPrompt) {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error('Replicate API 토큰이 설정되지 않았습니다.');
  }

  // Replicate의 image-to-image 편집 (원본 이미지를 기반으로 수정)
  const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: "black-forest-labs/flux-dev",
      input: {
        prompt: editPrompt, // ChatGPT가 최적화한 Replicate용 프롬프트 사용
        image: imageUrl, // 원본 이미지 URL 추가
        num_inference_steps: 20,
        guidance_scale: 3.5,
        strength: 0.8, // 이미지 변형 강도
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

  // Stability AI의 image-to-image 편집 (원본 이미지를 기반으로 수정)
  // 이미지를 다운로드하여 FormData로 전송
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`이미지 다운로드 실패: ${imageResponse.status}`);
  }
  const imageBuffer = await imageResponse.arrayBuffer();
  
  const formData = new FormData();
  formData.append('text_prompts[0][text]', editPrompt);
  formData.append('text_prompts[0][weight]', '1');
  formData.append('init_image', new Blob([imageBuffer], { type: 'image/png' }), 'image.png');
  formData.append('image_strength', '0.8');
  formData.append('cfg_scale', '7');
  formData.append('height', '1024');
  formData.append('width', '1024');
  formData.append('samples', '1');
  formData.append('steps', '20');
  formData.append('style_preset', 'photographic');
  
  const stabilityResponse = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
    },
    body: formData
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
  const stabilityImageBuffer = Buffer.from(base64Image, 'base64');
  
  // 임시로 Supabase에 저장하여 URL 생성
  const fileName = `stability-edit-${Date.now()}.png`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('blog-images')
    .upload(fileName, stabilityImageBuffer, {
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

// DALL-E 3를 사용한 이미지 편집
async function editImageWithDALLE(imageUrl, editPrompt) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API 키가 설정되지 않았습니다.');
  }

  // DALL-E 3는 이미지 편집보다는 새로운 이미지 생성에 특화되어 있음
  // 원본 이미지의 스타일을 참고하여 새로운 이미지를 생성
  const dalleResponse = await openai.images.generate({
    model: "dall-e-3",
    prompt: editPrompt,
    size: "1024x1024",
    quality: "hd",
    n: 1,
  });

  if (!dalleResponse.data || dalleResponse.data.length === 0) {
    throw new Error('DALL-E 3에서 이미지를 생성하지 못했습니다');
  }

  // DALL-E 3는 URL을 직접 반환하므로 Supabase에 저장
  const dalleImageUrl = dalleResponse.data[0].url;
  const savedImage = await saveImageToSupabase(dalleImageUrl, 'dalle-edit');

  return {
    imageUrl: savedImage.publicUrl,
    model: 'DALL-E 3'
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

// Google Vision API를 사용한 이미지 분석
async function analyzeImageWithGoogleVision(imageUrl) {
  const googleApiKey = process.env.GOOGLE_API_KEY;
  if (!googleApiKey) {
    console.error('❌ Google API 키 누락:', {
      GOOGLE_API_KEY: !!process.env.GOOGLE_API_KEY,
      allEnvKeys: Object.keys(process.env).filter(key => key.includes('GOOGLE'))
    });
    throw new Error('Google API 키가 설정되지 않았습니다.');
  }

  console.log('🔍 Google Vision API로 이미지 분석 시작:', imageUrl);

  try {
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${googleApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                source: {
                  imageUri: imageUrl
                }
              },
              features: [
                {
                  type: 'LABEL_DETECTION',
                  maxResults: 20
                },
                {
                  type: 'OBJECT_LOCALIZATION',
                  maxResults: 20
                },
                {
                  type: 'TEXT_DETECTION',
                  maxResults: 10
                },
                {
                  type: 'FACE_DETECTION',
                  maxResults: 10
                },
                {
                  type: 'LANDMARK_DETECTION',
                  maxResults: 10
                },
                {
                  type: 'LOGO_DETECTION',
                  maxResults: 10
                },
                {
                  type: 'SAFE_SEARCH_DETECTION'
                }
              ]
            }
          ]
        })
      }
    );

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error('❌ Google Vision API 오류:', { 
        status: visionResponse.status, 
        error: errorText 
      });
      throw new Error(`Google Vision API 오류: ${visionResponse.status} - ${errorText}`);
    }

    const visionResult = await visionResponse.json();
    console.log('✅ Google Vision API 분석 완료:', visionResult);

    // 분석 결과를 구조화된 형태로 정리
    const analysis = {
      labels: visionResult.responses[0]?.labelAnnotations?.map(label => ({
        description: label.description,
        score: label.score
      })) || [],
      objects: visionResult.responses[0]?.localizedObjectAnnotations?.map(obj => ({
        name: obj.name,
        score: obj.score,
        boundingPoly: obj.boundingPoly
      })) || [],
      text: visionResult.responses[0]?.textAnnotations?.map(text => ({
        description: text.description,
        confidence: text.confidence
      })) || [],
      faces: visionResult.responses[0]?.faceAnnotations?.length || 0,
      landmarks: visionResult.responses[0]?.landmarkAnnotations?.map(landmark => ({
        description: landmark.description,
        score: landmark.score
      })) || [],
      logos: visionResult.responses[0]?.logoAnnotations?.map(logo => ({
        description: logo.description,
        score: logo.score
      })) || [],
      safeSearch: visionResult.responses[0]?.safeSearchAnnotation || {}
    };

    // 분석 결과를 프롬프트로 변환
    const promptFromAnalysis = generatePromptFromVisionAnalysis(analysis);
    
    return {
      analysis,
      prompt: promptFromAnalysis
    };

  } catch (error) {
    console.error('❌ Google Vision API 분석 실패:', error);
    throw error;
  }
}

// Vision 분석 결과를 프롬프트로 변환
function generatePromptFromVisionAnalysis(analysis) {
  let prompt = '';
  
  // 라벨 정보 추가 (높은 신뢰도만)
  const highConfidenceLabels = analysis.labels
    .filter(label => label.score > 0.7)
    .map(label => label.description)
    .slice(0, 10);
  
  if (highConfidenceLabels.length > 0) {
    prompt += `Main elements: ${highConfidenceLabels.join(', ')}. `;
  }

  // 객체 정보 추가
  if (analysis.objects.length > 0) {
    const objects = analysis.objects
      .filter(obj => obj.score > 0.6)
      .map(obj => obj.name)
      .slice(0, 5);
    if (objects.length > 0) {
      prompt += `Objects: ${objects.join(', ')}. `;
    }
  }

  // 텍스트 정보 추가
  if (analysis.text.length > 0) {
    const texts = analysis.text
      .filter(text => text.confidence > 0.7)
      .map(text => text.description)
      .slice(0, 3);
    if (texts.length > 0) {
      prompt += `Text elements: ${texts.join(', ')}. `;
    }
  }

  // 얼굴 정보 추가
  if (analysis.faces > 0) {
    prompt += `Contains ${analysis.faces} face(s). `;
  }

  // 랜드마크 정보 추가
  if (analysis.landmarks.length > 0) {
    const landmarks = analysis.landmarks
      .filter(landmark => landmark.score > 0.6)
      .map(landmark => landmark.description)
      .slice(0, 3);
    if (landmarks.length > 0) {
      prompt += `Landmarks: ${landmarks.join(', ')}. `;
    }
  }

  // 로고 정보 추가
  if (analysis.logos.length > 0) {
    const logos = analysis.logos
      .filter(logo => logo.score > 0.6)
      .map(logo => logo.description)
      .slice(0, 3);
    if (logos.length > 0) {
      prompt += `Brands/Logos: ${logos.join(', ')}. `;
    }
  }

  // 안전 검색 결과 추가
  if (analysis.safeSearch) {
    const safeLevels = [];
    if (analysis.safeSearch.adult === 'LIKELY' || analysis.safeSearch.adult === 'VERY_LIKELY') {
      safeLevels.push('adult content');
    }
    if (analysis.safeSearch.violence === 'LIKELY' || analysis.safeSearch.violence === 'VERY_LIKELY') {
      safeLevels.push('violent content');
    }
    if (safeLevels.length > 0) {
      prompt += `Content warnings: ${safeLevels.join(', ')}. `;
    }
  }

  return prompt.trim();
}

