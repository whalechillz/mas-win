import { fal } from "@fal-ai/client";
import { createClient } from '@supabase/supabase-js';

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

// API 타임아웃 설정 (5분)
export const config = {
  maxDuration: 300,
};

/**
 * 이미지 URL에서 Storage 경로 추출
 */
function extractPathFromUrl(url) {
  const match = url.match(/blog-images\/([^?]+)/);
  if (match) {
    return match[1];
  }
  if (!url.includes('http') && !url.includes('storage')) {
    return url;
  }
  return null;
}

/**
 * 중복 파일명 체크 및 고유 파일명 생성
 */
async function generateUniqueFileName(folderPath, baseFileName, maxAttempts = 10) {
  let fileName = baseFileName;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const { data: files, error } = await supabase.storage
        .from('blog-images')
        .list(folderPath || '', {
          search: fileName
        });

      if (error || !files || files.length === 0) {
        return fileName;
      }

      attempts++;
      const nameWithoutExt = baseFileName.replace(/\.[^/.]+$/, '');
      const ext = baseFileName.match(/\.[^/.]+$/)?.[0] || '';
      const randomString = Math.random().toString(36).substring(2, 8);
      fileName = `${nameWithoutExt}-${randomString}${ext}`;
    } catch (error) {
      console.warn('⚠️ 파일 중복 체크 실패, 기본 파일명 사용:', error.message);
      return fileName;
    }
  }

  const nameWithoutExt = baseFileName.replace(/\.[^/.]+$/, '');
  const ext = baseFileName.match(/\.[^/.]+$/)?.[0] || '';
  const timestamp = Date.now();
  return `${nameWithoutExt}-${timestamp}${ext}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    if (!process.env.FAL_KEY && !process.env.FAL_API_KEY) {
      return res.status(400).json({ 
        success: false, 
        error: 'FAL AI API 키가 설정되지 않았습니다.' 
      });
    }

    const { 
      imageUrl,
      prompt,
      preserveStyle = true,
      numImages = 1,
      aspectRatio = '1:1',
      outputFormat = null,
      quality = 90,
      title = '갤러리 이미지 변형',
      excerpt = 'Nanobanana로 변형된 이미지',
      contentType = 'gallery',
      brandStrategy = 'professional'
    } = req.body;

    console.log('🎨 Nanobanana 이미지 변형 시작...');
    console.log('원본 이미지:', imageUrl);

    // 1. 원본 이미지에서 폴더 경로와 확장자 추출
    const fullPath = extractPathFromUrl(imageUrl);
    let folderPath;
    let originalExtension;
    
    if (!fullPath) {
      const dateStr = new Date().toISOString().slice(0, 10);
      const yearMonth = dateStr.slice(0, 7);
      folderPath = `uploaded/${yearMonth}/${dateStr}`;
      originalExtension = 'jpg';
      console.warn('⚠️ 폴더 경로 추출 실패, fallback 경로 사용:', folderPath);
    } else {
      const pathParts = fullPath.split('/');
      const fileName = pathParts[pathParts.length - 1];
      folderPath = pathParts.slice(0, -1).join('/');
      originalExtension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
      console.log('✅ 폴더 경로:', folderPath);
      console.log('✅ 원본 확장자:', originalExtension);
    }

    // 2. 출력 포맷 결정
    let finalOutputFormat = outputFormat;
    if (!finalOutputFormat) {
      if (originalExtension === 'webp') {
        finalOutputFormat = 'webp';
      } else if (originalExtension === 'jpg' || originalExtension === 'jpeg') {
        finalOutputFormat = 'jpeg';
      } else if (originalExtension === 'png') {
        finalOutputFormat = 'png';
      } else {
        finalOutputFormat = 'jpeg';
      }
    }

    // 3. 프롬프트 생성
    let finalPrompt = prompt;
    
    if (!finalPrompt || finalPrompt.trim() === '') {
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000';
      
      try {
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
        } else {
          finalPrompt = 'high quality image variation, professional photography';
        }
      } catch (error) {
        console.warn('⚠️ 프롬프트 자동 생성 실패:', error.message);
        finalPrompt = 'high quality image variation, professional photography';
      }
    }

    // 4. 원본 스타일 유지 옵션 적용
    if (preserveStyle) {
      finalPrompt = `maintain original style, preserve character appearance, keep same facial features, same person, ${finalPrompt}`;
    }

    // 5. FAL AI Nanobanana 호출
    const falInput = {
      prompt: finalPrompt,
      image_urls: [imageUrl],
      num_images: numImages,
      aspect_ratio: aspectRatio,
      output_format: finalOutputFormat,
      resolution: '1K'
    };
    
    if (finalOutputFormat === 'jpeg' && quality) {
      falInput.quality = quality;
    }

    let result;
    try {
      result = await fal.subscribe('fal-ai/nano-banana-pro/edit', {
        input: falInput,
        logs: true,
        onQueueUpdate: (update) => {
          console.log('📊 FAL AI 큐 상태:', update.status);
          if (update.status === "IN_PROGRESS") {
            update.logs?.map((log) => log.message).forEach((msg) => {
              console.log('📊 FAL AI 로그:', msg);
            });
          }
        },
      });
    } catch (falError) {
      console.error('❌ FAL AI API 호출 실패:', falError);
      let errorMessage = falError.message || 'FAL AI API 호출에 실패했습니다.';
      if (falError.response || falError.body) {
        const errorData = falError.response || falError.body;
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail);
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      }
      throw new Error(errorMessage);
    }

    if (!result.data || !result.data.images || result.data.images.length === 0) {
      throw new Error('FAL AI에서 이미지를 생성하지 못했습니다.');
    }

    // 6. 생성된 이미지를 Supabase에 저장
    const generatedImageUrl = result.data.images[0].url;
    
    try {
      const imageFetchResponse = await fetch(generatedImageUrl);
      if (!imageFetchResponse.ok) {
        throw new Error(`이미지 다운로드 실패: ${imageFetchResponse.status}`);
      }
      
      const imageBuffer = await imageFetchResponse.arrayBuffer();
      
      // 원본 이미지의 메타데이터 먼저 조회 (폴더 경로 결정을 위해)
      let originalMetadata = null;
      let targetFolderPath = folderPath;
      let targetDateFolder = folderPath.split('/').pop() || new Date().toISOString().slice(0, 10);
      
      try {
        const { data: metadata, error: metadataError } = await supabase
          .from('image_metadata')
          .select('*')
          .eq('image_url', imageUrl)
          .maybeSingle();

        if (!metadataError && metadata) {
          originalMetadata = metadata;
          
          // 원본이 고객 폴더인 경우 그대로 사용
          if (metadata.folder_path && metadata.folder_path.includes('originals/customers/')) {
            targetFolderPath = metadata.folder_path;
            targetDateFolder = metadata.date_folder || targetDateFolder;
            console.log('✅ 원본이 고객 폴더입니다. 같은 폴더에 저장:', targetFolderPath);
          } else if (metadata.folder_path) {
            // 원본 메타데이터에 folder_path가 있으면 우선 사용
            targetFolderPath = metadata.folder_path;
            targetDateFolder = metadata.date_folder || targetDateFolder;
          }
        }
      } catch (metadataError) {
        console.warn('⚠️ 원본 메타데이터 조회 실패 (기본 경로 사용):', metadataError);
      }
      
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const baseFileName = `nanobanana-variation-${timestamp}-${randomString}.${originalExtension}`;
      
      const uniqueFileName = await generateUniqueFileName(targetFolderPath, baseFileName);
      const objectPath = targetFolderPath ? `${targetFolderPath}/${uniqueFileName}` : uniqueFileName;
      
      const contentType = finalOutputFormat === 'jpeg' 
        ? 'image/jpeg' 
        : finalOutputFormat === 'png' 
          ? 'image/png' 
          : finalOutputFormat === 'webp'
            ? 'image/webp'
            : 'image/jpeg';
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(objectPath, imageBuffer, {
          contentType: contentType,
          upsert: false
        });
      
      if (uploadError) {
        throw new Error(`Supabase 업로드 실패: ${uploadError.message}`);
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(objectPath);
      
      console.log('✅ Supabase 저장 완료:', publicUrl);

      // 원본 이미지의 메타데이터 복사
      let newMetadata = {
        image_url: publicUrl,
        folder_path: targetFolderPath,
        date_folder: targetDateFolder,
        english_filename: uniqueFileName,
        original_filename: uniqueFileName,
        prompt: finalPrompt, // 새 프롬프트 사용
        title: title,
        excerpt: excerpt,
        content_type: contentType || 'gallery',
        brand_strategy: brandStrategy || 'professional',
        upload_source: 'variation-nanobanana', // Nanobanana 변형으로 생성된 이미지 표시
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        usage_count: 0,
        is_featured: false
      };

      // 원본 메타데이터가 있으면 복사
      if (originalMetadata) {
        console.log('📋 원본 메타데이터 발견, 복사 중...', {
          originalUrl: imageUrl,
          newUrl: publicUrl
        });

        // 원본 메타데이터 복사 (파일명, prompt 제외)
        newMetadata = {
          ...newMetadata,
          alt_text: originalMetadata.alt_text || null,
          description: originalMetadata.description || null,
          tags: originalMetadata.tags || null,
          category_id: originalMetadata.category_id || null,
          file_size: imageBuffer.byteLength,
          width: originalMetadata.width || null,
          height: originalMetadata.height || null,
          format: finalOutputFormat,
          status: originalMetadata.status || 'active',
          // 고객 이미지 관련 필드도 복사
          story_scene: originalMetadata.story_scene || null,
          image_type: originalMetadata.image_type || null,
          customer_name_en: originalMetadata.customer_name_en || null,
          customer_initials: originalMetadata.customer_initials || null,
          original_filename: originalMetadata.original_filename || uniqueFileName,
          // GPS 및 촬영일시 복사
          gps_lat: originalMetadata.gps_lat || null,
          gps_lng: originalMetadata.gps_lng || null,
          taken_at: originalMetadata.taken_at || null
        };
      }

      // 이미지 메타데이터 저장
      const { error: metadataError } = await supabase
        .from('image_metadata')
        .upsert(newMetadata, {
          onConflict: 'image_url',
          ignoreDuplicates: false
        });

      if (metadataError) {
        console.warn('⚠️ 메타데이터 저장 실패:', metadataError);
      }

      const duration = Date.now() - startTime;

      return res.status(200).json({
        success: true,
        imageUrl: publicUrl,
        originalUrl: generatedImageUrl,
        fileName: uniqueFileName,
        folderPath: folderPath,
        prompt: finalPrompt,
        preserveStyle: preserveStyle,
        outputFormat: finalOutputFormat,
        metadata: {
          title: title,
          excerpt: excerpt,
          contentType: contentType
        },
        duration: duration
      });

    } catch (saveError) {
      console.error('❌ Supabase 저장 실패:', saveError);
      return res.status(200).json({
        success: true,
        imageUrl: generatedImageUrl,
        originalUrl: generatedImageUrl,
        fileName: null,
        folderPath: folderPath,
        prompt: finalPrompt,
        preserveStyle: preserveStyle,
        outputFormat: finalOutputFormat,
        warning: 'Supabase 저장 실패, 원본 URL 사용',
        metadata: {
          title: title,
          excerpt: excerpt,
          contentType: contentType
        }
      });
    }

  } catch (error) {
    console.error('❌ Nanobanana 이미지 변형 에러:', error);
    const duration = Date.now() - startTime;
    
    return res.status(500).json({
      success: false,
      error: 'Nanobanana 이미지 변형 중 오류가 발생했습니다.',
      details: error.message,
      duration: duration
    });
  }
}
