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

    // FAL AI API 호출
    const falApiKey = process.env.FAL_KEY || process.env.FAL_API_KEY;
    const startTime = Date.now();

    // 프리셋 설정값 (8단계 확장)
    const PRESETS = {
      extreme_creative: { guidance_scale: 1.8, num_inference_steps: 50 }, // 최고 창의성
      free_creative: { guidance_scale: 2.0, num_inference_steps: 50 },    // 자유 창의
      creative: { guidance_scale: 2.1, num_inference_steps: 50 },         // 창의적
      balanced: { guidance_scale: 2.2, num_inference_steps: 50 },         // 균형
      precise: { guidance_scale: 2.3, num_inference_steps: 50 },          // 정밀
      ultra_precise: { guidance_scale: 2.5, num_inference_steps: 50 },    // 초정밀
      high_precision: { guidance_scale: 2.7, num_inference_steps: 50 },   // 고정밀
      ultra_high_precision: { guidance_scale: 2.9, num_inference_steps: 50 } // 초고정밀
    };
    
    const presetSettings = PRESETS[preset] || PRESETS.creative;
    console.log(`🔄 이미지 변형 프리셋 적용: ${preset}`, presetSettings);
    
    // 프리셋별 최적화된 프롬프트 설정
    let optimizedPrompt;
    if (preset === 'ultra_precise') {
      optimizedPrompt = prompt || 'Create a variation of this image maintaining EXACT same person, same ethnicity, same facial features, same clothing, same pose, same background composition, same lighting, same colors. Only make minimal adjustments to lighting or background details while preserving ALL human characteristics and appearance. Keep the same person identity completely unchanged.';
    } else if (preset === 'precise') {
      optimizedPrompt = prompt || 'Create a variation of this image maintaining same person characteristics, same clothing style, same pose, same background setting. Preserve human features and identity while allowing some creative variations in lighting or composition.';
    } else {
      optimizedPrompt = prompt || 'Create a variation of this image with similar style and composition, maintaining the overall theme and setting while allowing creative changes.';
    }
    
    const falResponse = await fetch('https://fal.run/fal-ai/hidream-i1-dev', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: imageUrl,
        prompt: optimizedPrompt,
        num_inference_steps: presetSettings.num_inference_steps,
        guidance_scale: presetSettings.guidance_scale,
        seed: Math.floor(Math.random() * 1000000)
      })
    });

    const falResult = await falResponse.json();
    const duration = Date.now() - startTime;

    if (!falResponse.ok) {
      console.error('❌ FAL AI API 오류:', falResult);
      throw new Error(`FAL AI API 오류: ${falResult.message || 'Unknown error'}`);
    }

    if (!falResult.images || falResult.images.length === 0) {
      throw new Error('FAL AI에서 이미지를 생성하지 못했습니다.');
    }

    console.log('✅ FAL AI 이미지 생성 완료');

    // FAL AI 사용량 로깅
    await logFALAIUsage({
      model: 'hidream-i1-dev',
      prompt: prompt || 'image variation',
      imageCount: 1,
      cost: 0.01, // FAL AI hidream-i1-dev 비용 (추정)
      duration: duration,
      endpoint: 'vary-existing-image',
      user_id: 'admin',
      metadata: {
        originalImageUrl: imageUrl,
        title: title,
        contentType: contentType
      }
    });

    // 생성된 이미지를 Supabase에 저장
    const generatedImageUrl = falResult.images[0].url;
    console.log('🔄 생성된 이미지 Supabase 저장 시작...');
    
    try {
      // 외부 이미지 URL에서 이미지 데이터 다운로드
      const imageFetchResponse = await fetch(generatedImageUrl);
      if (!imageFetchResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageFetchResponse.status}`);
      }
      
      const imageBuffer = await imageFetchResponse.arrayBuffer();
      const fileName = `existing-variation-${Date.now()}.png`;
      
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
      console.error('❌ Supabase 저장 실패:', saveError);
      // 저장 실패해도 원본 URL 반환
      res.status(200).json({
        success: true,
        imageUrl: generatedImageUrl,
        originalUrl: generatedImageUrl,
        fileName: null,
        prompt: prompt,
        warning: 'Supabase 저장 실패, 원본 URL 사용'
      });
    }

  } catch (error) {
    console.error('❌ 기존 이미지 변형 에러:', error);
    res.status(500).json({
      success: false,
      error: '기존 이미지 변형 중 오류가 발생했습니다.',
      details: error.message
    });
  }
}
