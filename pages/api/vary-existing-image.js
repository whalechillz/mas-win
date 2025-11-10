import { createClient } from '@supabase/supabase-js';
import { logFALAIUsage } from '../../lib/ai-usage-logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 타임아웃 설정 (최대 3분)
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).json({ 
        success: false, 
        error: '이미지 변형 요청 시간 초과 (3분 제한)' 
      });
    }
  }, 180000); // 3분

  try {
    // FAL AI API 키 확인
    if (!process.env.FAL_KEY && !process.env.FAL_API_KEY) {
      return res.status(400).json({ 
        success: false, 
        error: 'FAL AI API 키가 설정되지 않았습니다. 환경 변수 FAL_KEY 또는 FAL_API_KEY를 확인해주세요.' 
      });
    }

    const { 
      imageUrl,
      prompt,
      title, 
      excerpt, 
      contentType, 
      brandStrategy,
      preset = 'creative'
    } = req.body;

    console.log('🎨 기존 이미지 변형 시작...');
    console.log('원본 이미지:', imageUrl);
    console.log('프롬프트:', prompt?.substring(0, 100) + '...');
    console.log('제목:', title);
    console.log('FAL API 키 확인:', {
      FAL_KEY: process.env.FAL_KEY ? `${process.env.FAL_KEY.substring(0, 8)}...` : '없음',
      FAL_API_KEY: process.env.FAL_API_KEY ? `${process.env.FAL_API_KEY.substring(0, 8)}...` : '없음',
      사용할키: (process.env.FAL_KEY || process.env.FAL_API_KEY) ? '있음' : '없음'
    });

    // FAL AI API 호출
    const falApiKey = process.env.FAL_KEY || process.env.FAL_API_KEY;
    const startTime = Date.now();

    // 프리셋 설정값 (8단계 확장)
const PRESETS = {
  ultra_extreme_free: { guidance_scale: 0.2, num_inference_steps: 50 }, // 초극자유 창의
  extreme_max_free: { guidance_scale: 0.4, num_inference_steps: 50 },   // 극최대자유 창의
  max_free: { guidance_scale: 0.6, num_inference_steps: 50 },           // 최대자유 창의
  ultra_free: { guidance_scale: 0.8, num_inference_steps: 50 },         // 초자유 창의
  super_free: { guidance_scale: 1.0, num_inference_steps: 50 },         // 슈퍼자유 창의
  hyper_free: { guidance_scale: 1.2, num_inference_steps: 50 },         // 하이퍼자유 창의
  extreme_creative: { guidance_scale: 1.4, num_inference_steps: 50 },   // 극자유 창의
  mega_creative: { guidance_scale: 1.6, num_inference_steps: 50 },      // 메가자유 창의
  free_creative: { guidance_scale: 1.8, num_inference_steps: 50 },      // 자유 창의
  creative: { guidance_scale: 2.0, num_inference_steps: 50 },           // 창의적
  balanced: { guidance_scale: 2.1, num_inference_steps: 50 },           // 균형
  precise: { guidance_scale: 2.2, num_inference_steps: 50 },            // 정밀
  ultra_precise: { guidance_scale: 2.3, num_inference_steps: 50 },      // 초정밀
  high_precision: { guidance_scale: 2.5, num_inference_steps: 50 },     // 고정밀
  ultra_high_precision: { guidance_scale: 2.7, num_inference_steps: 50 }, // 초고정밀
  extreme_precision: { guidance_scale: 2.9, num_inference_steps: 50 } // 극고정밀
};
    
    const presetSettings = PRESETS[preset] || PRESETS.creative;
    console.log(`🔄 이미지 변형 프리셋 적용: ${preset}`, presetSettings);
    
    // 프리셋별 최적화된 프롬프트 설정 (원본 이미지 유지 강조)
    let optimizedPrompt;
    if (preset === 'ultra_precise') {
      optimizedPrompt = prompt || 'Maintain EXACT same image content, same composition, same colors, same lighting, same all visual elements. Only make minimal subtle improvements to quality and sharpness. Do not change anything about the image content.';
    } else if (preset === 'precise') {
      optimizedPrompt = prompt || 'Maintain same image content and composition, same colors and lighting. Only make subtle improvements to quality and details. Preserve all visual elements exactly as they are.';
    } else if (preset === 'balanced') {
      optimizedPrompt = prompt || 'Maintain same image content and overall composition. Allow subtle creative variations in lighting or details while preserving the main visual elements.';
    } else {
      optimizedPrompt = prompt || 'Create a variation of this image with similar style and composition, maintaining the overall theme and setting while allowing creative changes.';
    }
    
    // FAL AI flux-dev 엔드포인트가 존재하지 않으므로 Replicate로 대체
    // Replicate API 키 확인
    if (!process.env.REPLICATE_API_TOKEN) {
      return res.status(400).json({ 
        success: false, 
        error: 'Replicate API 키가 설정되지 않았습니다. 환경 변수 REPLICATE_API_TOKEN을 확인해주세요.' 
      });
    }

    // 프롬프트가 없으면 ChatGPT로 생성
    let finalPrompt = optimizedPrompt;
    if (!prompt || prompt.trim() === '') {
      console.log('🤖 ChatGPT로 변형 프롬프트 생성 시작...');
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000';
      
      try {
        const promptResponse = await fetch(`${baseUrl}/api/generate-smart-prompt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title: title || '이미지 변형',
            excerpt: excerpt || '이미지를 변형하여 생성',
            contentType: contentType || 'gallery',
            brandStrategy: brandStrategy || 'professional',
            model: 'replicate-flux'
          })
        });

        if (promptResponse.ok) {
          const { prompt: generatedPrompt } = await promptResponse.json();
          finalPrompt = generatedPrompt;
          console.log('✅ ChatGPT 변형 프롬프트 생성 완료');
        }
      } catch (e) {
        console.warn('⚠️ ChatGPT 프롬프트 생성 실패, 기본 프롬프트 사용:', e.message);
      }
    }

    // Replicate API 호출 (Flux Dev 모델로 이미지 변형)
    const strength = preset === 'ultra_precise' ? 0.2 : preset === 'precise' ? 0.3 : preset === 'balanced' ? 0.4 : 0.5;
    
    console.log('📤 Replicate API 호출:', {
      url: 'https://api.replicate.com/v1/predictions',
      method: 'POST',
      body: {
        version: 'black-forest-labs/flux-dev',
        image: imageUrl,
        prompt: finalPrompt?.substring(0, 100) + '...',
        strength: strength,
        num_inference_steps: presetSettings.num_inference_steps
      }
    });
    
    const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "black-forest-labs/flux-dev",
        input: {
          prompt: finalPrompt,
          image: imageUrl,
          num_inference_steps: Math.min(presetSettings.num_inference_steps, 20), // Replicate는 최대 20
          guidance_scale: Math.min(presetSettings.guidance_scale, 3.5), // Replicate는 최대 3.5
          strength: strength,
          num_outputs: 1,
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
        error: errorText
      });
      throw new Error(`Replicate API 오류: ${replicateResponse.status} - ${errorText || 'Unknown error'}`);
    }

    const replicateResult = await replicateResponse.json();
    console.log('✅ Replicate 초기 응답:', replicateResult);

    // Replicate는 폴링이 필요함
    let finalResult = replicateResult;
    if (replicateResult.status === 'starting' || replicateResult.status === 'processing') {
      let attempts = 0;
      const maxAttempts = 60; // 10분 대기
      
      while (finalResult.status === 'starting' || finalResult.status === 'processing') {
        if (attempts >= maxAttempts) {
          throw new Error('Replicate 이미지 변형 시간 초과');
        }
        
        // 타임아웃 체크 (2분 30초 남았는지 확인)
        if ((Date.now() - startTime) > 150000) {
          throw new Error('이미지 변형 요청 시간 초과 (3분 제한)');
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기
        
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

    if (finalResult.status !== 'succeeded') {
      console.error('❌ Replicate 최종 결과 오류:', finalResult);
      throw new Error(`Replicate 이미지 변형 실패: ${finalResult.error || '알 수 없는 오류'} (상태: ${finalResult.status})`);
    }

    // Replicate 응답 구조 확인
    let generatedImageUrl = null;
    if (finalResult.output && finalResult.output.length > 0) {
      generatedImageUrl = Array.isArray(finalResult.output) ? finalResult.output[0] : finalResult.output;
    } else if (finalResult.output) {
      generatedImageUrl = finalResult.output;
    }

    if (!generatedImageUrl) {
      throw new Error('Replicate에서 이미지를 생성하지 못했습니다.');
    }

    console.log('✅ Replicate 이미지 변형 완료');

    // Replicate 사용량 로깅 (FAL AI 로거 재사용)
    await logFALAIUsage({
      model: 'replicate-flux-dev',
      prompt: finalPrompt || 'image variation',
      imageCount: 1,
      cost: 0.01, // Replicate flux-dev 비용 (추정)
      duration: Date.now() - startTime,
      endpoint: 'vary-existing-image',
      user_id: 'admin',
      metadata: {
        originalImageUrl: imageUrl,
        title: title,
        contentType: contentType,
        preset: preset
      }
    });

    // 생성된 이미지를 Supabase에 저장
    // generatedImageUrl은 위에서 이미 설정됨
    console.log('🔄 생성된 이미지 Supabase 저장 시작...');
    
    try {
      // 외부 이미지 URL에서 이미지 데이터 다운로드
      const imageFetchResponse = await fetch(generatedImageUrl);
      if (!imageFetchResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageFetchResponse.status}`);
      }
      
      const imageBuffer = await imageFetchResponse.arrayBuffer();
      const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const fileName = `existing-variation-${Date.now()}.png`;
      const objectPath = `originals/${dateStr}/${fileName}`; // originals/YYYY-MM-DD/ 형식으로 통일
      
      // Supabase Storage에 업로드
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(objectPath, imageBuffer, {
          contentType: 'image/png',
          upsert: false
        });
      
      if (uploadError) {
        throw new Error(`Supabase 업로드 실패: ${uploadError.message}`);
      }
      
      // 공개 URL 생성
      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(objectPath);
      
      console.log('✅ Supabase 저장 완료:', publicUrl);

      // 이미지 메타데이터 저장 (프롬프트 포함)
      const { error: metadataError } = await supabase
        .from('image_metadata')
        .insert({
          image_url: publicUrl,
          original_url: generatedImageUrl,
          prompt: prompt,
          title: title || '기존 이미지 변형',
          excerpt: excerpt || '기존 이미지를 변형하여 생성된 이미지',
          content_type: contentType || 'blog',
          brand_strategy: brandStrategy || 'professional',
          created_at: new Date().toISOString(),
          usage_count: 0,
          is_featured: false
        });

      if (metadataError) {
        console.warn('⚠️ 메타데이터 저장 실패:', metadataError);
      } else {
        console.log('✅ 메타데이터 저장 완료');
      }

      clearTimeout(timeout);
      res.status(200).json({
        success: true,
        imageUrl: publicUrl,
        originalUrl: generatedImageUrl,
        fileName: fileName,
        prompt: prompt,
        metadata: {
          title: title,
          excerpt: excerpt,
          contentType: contentType
        }
      });

    } catch (saveError) {
      clearTimeout(timeout);
      console.error('❌ Supabase 저장 실패:', saveError);
      // 저장 실패해도 원본 URL 반환
      if (!res.headersSent) {
        res.status(200).json({
          success: true,
          imageUrl: generatedImageUrl,
          originalUrl: generatedImageUrl,
          fileName: null,
          prompt: prompt,
          warning: 'Supabase 저장 실패, 원본 URL 사용'
        });
      }
    }

  } catch (error) {
    clearTimeout(timeout);
    console.error('❌ 기존 이미지 변형 에러:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: '기존 이미지 변형 중 오류가 발생했습니다.',
        details: error.message
      });
    }
  }
}
