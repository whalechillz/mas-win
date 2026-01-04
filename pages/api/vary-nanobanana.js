import { fal } from "@fal-ai/client";
import { createClient } from '@supabase/supabase-js';
import { logFALAIUsage } from '../../lib/ai-usage-logger';

// API 타임아웃 설정 (10분)
export const config = {
  maxDuration: 600, // 10분 (초 단위) - FAL AI 큐 대기 시간 여유 확보
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// FAL AI API 키 설정
if (process.env.FAL_KEY) {
  fal.config({
    credentials: process.env.FAL_KEY
  });
} else if (process.env.FAL_API_KEY) {
  fal.config({
    credentials: process.env.FAL_API_KEY
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 타임아웃 설정 (최대 10분)
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).json({ 
        success: false, 
        error: '이미지 변형 요청 시간 초과 (10분 제한)' 
      });
    }
  }, 600000); // 10분

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
      preserveStyle = true, // 원본 스타일 유지 (기본값 true)
      numImages = 1,
      aspectRatio = '1:1',
      outputFormat = 'jpeg',
      quality = 90,
      title = '갤러리 이미지 변형',
      excerpt = 'Nanobanana로 변형된 이미지',
      contentType = 'gallery',
      brandStrategy = 'professional',
      originalImageFolder = null // 원본 이미지가 있던 폴더 경로
    } = req.body;

    console.log('🎨 Nanobanana 이미지 변형 시작...');
    console.log('원본 이미지:', imageUrl);
    console.log('프롬프트:', prompt?.substring(0, 100) + '...');
    console.log('원본 스타일 유지:', preserveStyle);

    const startTime = Date.now();

    // 1. 프롬프트 생성/개선
    let finalPrompt = prompt;
    
    // 프롬프트가 없으면 AI로 생성
    if (!finalPrompt || finalPrompt.trim() === '') {
      console.log('🤖 ChatGPT로 변형 프롬프트 생성 시작...');
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000';
      
      try {
        // 이미지가 골프 관련인지 일반 이미지인지 판단
        const isGolfImage = imageUrl.includes('golf') || 
                           imageUrl.includes('골프') ||
                           imageUrl.includes('driver') ||
                           imageUrl.includes('club');
        
        const analysisEndpoint = isGolfImage 
          ? '/api/analyze-image-prompt'
          : '/api/analyze-image-general';
        
        const analysisResponse = await fetch(`${baseUrl}${analysisEndpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            imageUrl: imageUrl,
            title: title,
            excerpt: excerpt
          })
        });
        
        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json();
          finalPrompt = analysisData.prompt || analysisData.englishPrompt || '';
          console.log('✅ ChatGPT 프롬프트 생성 완료');
        } else {
          console.warn('⚠️ ChatGPT 프롬프트 생성 실패, 기본 프롬프트 사용');
          finalPrompt = 'high quality image variation, professional photography';
        }
      } catch (e) {
        console.warn('⚠️ ChatGPT 프롬프트 생성 실패, 기본 프롬프트 사용:', e.message);
        finalPrompt = 'high quality image variation, professional photography';
      }
    }

    // 원본 스타일 유지 옵션 적용
    if (preserveStyle) {
      finalPrompt = `maintain original style, preserve character appearance, keep same facial features, same person, ${finalPrompt}`;
      console.log('✅ 원본 스타일 유지 프롬프트 적용');
    }

    // 2. FAL AI Nanobanana 호출
    console.log('🚀 FAL AI Nanobanana API 호출 시작...');
    console.log('📤 FAL AI 요청 파라미터:', {
      prompt: finalPrompt.substring(0, 100) + '...',
      image_urls: [imageUrl],
      num_images: numImages,
      aspect_ratio: aspectRatio,
      output_format: outputFormat,
      quality: quality
    });

    let result;
    try {
      const falInput = {
        prompt: finalPrompt,
        image_urls: [imageUrl],
        num_images: numImages,
        aspect_ratio: aspectRatio,
        output_format: outputFormat,
        resolution: '1K'
      };
      
      // JPG인 경우 quality 파라미터 추가
      if (outputFormat === 'jpeg' && quality) {
        falInput.quality = quality;
      }
      
      result = await fal.subscribe('fal-ai/nano-banana-pro/edit', {
        input: falInput,
        logs: true,
        onQueueUpdate: (update) => {
          console.log('📊 FAL AI 큐 상태:', update.status);
          
          if (update.status === "IN_QUEUE") {
            console.log('⏳ FAL AI 큐 대기 중...');
          }
          
          if (update.status === "IN_PROGRESS") {
            update.logs?.map((log) => log.message).forEach((msg) => {
              console.log('📊 FAL AI 로그:', msg);
            });
          }
          
          if (update.status === "FAILED") {
            console.error('❌ FAL AI 큐 실패:', update);
          }
          
          if (update.status === "COMPLETED") {
            console.log('✅ FAL AI 큐 완료');
          }
        },
      });
    } catch (falError) {
      console.error('❌ FAL AI API 호출 실패:', {
        error: falError.message,
        stack: falError.stack,
        response: falError.response || falError.body
      });
      
      let errorMessage = falError.message || 'FAL AI API 호출에 실패했습니다.';
      
      if (falError.response || falError.body) {
        const errorData = falError.response || falError.body;
        
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail);
        } else if (errorData.message) {
          errorMessage = typeof errorData.message === 'string'
            ? errorData.message
            : JSON.stringify(errorData.message);
        }
      }
      
      throw new Error(`FAL AI Nanobanana 오류: ${errorMessage}`);
    }

    if (!result.data || !result.data.images || result.data.images.length === 0) {
      throw new Error('FAL AI Nanobanana에서 이미지를 생성하지 못했습니다.');
    }

    const generatedImageUrl = result.data.images[0].url;
    console.log('✅ FAL AI Nanobanana 이미지 변형 완료');

    // Nanobanana 사용량 로깅
    await logFALAIUsage({
      model: 'nano-banana-pro',
      prompt: finalPrompt || 'image variation',
      imageCount: 1,
      cost: 0.02, // Nanobanana 비용 (추정)
      duration: Date.now() - startTime,
      endpoint: 'vary-nanobanana',
      user_id: 'admin',
      metadata: {
        originalImageUrl: imageUrl,
        title: title,
        contentType: contentType,
        preserveStyle: preserveStyle
      }
    });

    // 3. 생성된 이미지를 Supabase에 저장
    console.log('🔄 생성된 이미지 Supabase 저장 시작...');
    
    try {
      // 외부 이미지 URL에서 이미지 데이터 다운로드
      const imageFetchResponse = await fetch(generatedImageUrl);
      if (!imageFetchResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageFetchResponse.status}`);
      }
      
      const imageBuffer = await imageFetchResponse.arrayBuffer();
      const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const yearMonth = dateStr.slice(0, 7); // YYYY-MM
      const fileExtension = outputFormat === 'jpeg' ? 'jpg' : outputFormat;
      const fileName = `nanobanana-variation-${Date.now()}.${fileExtension}`;
      
      // 저장 경로 결정: 원본 이미지 폴더가 있으면 그곳에, 없으면 기본 경로에
      let objectPath;
      if (originalImageFolder && originalImageFolder.trim() !== '') {
        // 원본 이미지 폴더에 저장
        objectPath = `${originalImageFolder.trim()}/${fileName}`;
        console.log('📁 원본 이미지 폴더에 저장:', objectPath);
      } else {
        // 기본 경로에 저장 (폴백)
        objectPath = `uploaded/${yearMonth}/${dateStr}/${fileName}`;
        console.log('📁 기본 경로에 저장:', objectPath);
      }
      
      // Supabase Storage에 업로드
      const imageContentType = outputFormat === 'jpeg' ? 'image/jpeg' : `image/${outputFormat}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(objectPath, imageBuffer, {
          contentType: imageContentType,
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

      // 이미지 메타데이터 저장
      const { error: metadataError } = await supabase
        .from('image_metadata')
        .insert({
          image_url: publicUrl,
          original_url: generatedImageUrl,
          prompt: finalPrompt,
          title: title,
          excerpt: excerpt,
          content_type: contentType,
          brand_strategy: brandStrategy,
          created_at: new Date().toISOString(),
          usage_count: 0,
          is_featured: false,
          tags: ['nanobanana', 'variation', 'ai-generated']
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
        prompt: finalPrompt,
        metadata: {
          title: title,
          excerpt: excerpt,
          contentType: contentType,
          preserveStyle: preserveStyle
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
          prompt: finalPrompt,
          warning: 'Supabase 저장 실패, 원본 URL 사용'
        });
      }
    }

  } catch (error) {
    clearTimeout(timeout);
    console.error('❌ Nanobanana 이미지 변형 에러:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Nanobanana 이미지 변형 중 오류가 발생했습니다.',
        details: error.message
      });
    }
  }
}

