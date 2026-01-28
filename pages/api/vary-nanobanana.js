import { fal } from "@fal-ai/client";
import { createClient } from '@supabase/supabase-js';
import { generateStandardFileName, detectLocation, extractProductName } from '../../lib/filename-generator';

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
      variationMode = 'preserve-style', // 'preserve-style' | 'tone-only' | 'background-only' | 'object-only'
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
    
    // variationMode에 따라 preserveStyle 자동 설정
    let finalPreserveStyle = preserveStyle;
    if (variationMode === 'tone-only' || variationMode === 'background-only' || variationMode === 'object-only') {
      finalPreserveStyle = false; // 톤/배경/오브젝트 변경 시 스타일 유지 비활성화
    }

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
        // cdn_url로 먼저 조회 시도
        let { data: metadata, error: metadataError } = await supabase
          .from('image_assets')
          .select('*')
          .eq('cdn_url', imageUrl)
          .maybeSingle();

        // cdn_url로 찾지 못한 경우 file_path로 조회 시도
        if (metadataError || !metadata) {
          const pathFromUrl = extractPathFromUrl(imageUrl);
          if (pathFromUrl) {
            const { data: metadataByPath, error: pathError } = await supabase
              .from('image_assets')
              .select('*')
              .eq('file_path', pathFromUrl)
              .maybeSingle();
            
            if (!pathError && metadataByPath) {
              metadata = metadataByPath;
              metadataError = null;
            }
          }
        }

        if (!metadataError && metadata) {
          originalMetadata = metadata;
          
          // ✅ 배경 변형 모드일 때도 현재 위치(고객 일자)에 생성
          // 원본이 고객 폴더인 경우 그대로 사용 (file_path 사용)
          if (metadata.file_path && metadata.file_path.includes('originals/customers/')) {
            targetFolderPath = metadata.file_path.substring(0, metadata.file_path.lastIndexOf('/'));
            console.log('✅ 원본이 고객 폴더입니다. 같은 폴더에 저장:', {
              targetFolderPath,
              variationMode,
              originalFilePath: metadata.file_path
            });
          } else if (metadata.file_path) {
            // 원본 메타데이터에 file_path가 있으면 우선 사용
            targetFolderPath = metadata.file_path.substring(0, metadata.file_path.lastIndexOf('/'));
            console.log('✅ 원본 메타데이터의 file_path 사용:', {
              targetFolderPath,
              variationMode,
              originalFilePath: metadata.file_path
            });
          }
          
          // ✅ 배경 변형 모드일 때 명시적으로 현재 위치 사용 확인
          if (variationMode === 'background-only' && targetFolderPath) {
            console.log('✅ 배경 변형 모드: 현재 위치에 생성:', targetFolderPath);
          }
        }
      } catch (metadataError) {
        console.warn('⚠️ 원본 메타데이터 조회 실패 (기본 경로 사용):', metadataError);
      }
      
      // 위치 감지 및 제품명/고객명 추출
      let location = 'uploaded';
      let productName = 'none';
      
      if (targetFolderPath) {
        location = detectLocation(targetFolderPath);
        
        // 고객 이미지인 경우 고객 이름 추출
        if (location === 'customers') {
          const { extractCustomerName } = require('../../../lib/filename-generator');
          const extractedCustomerName = extractCustomerName(targetFolderPath);
          if (extractedCustomerName) {
            productName = extractedCustomerName;
            console.log('✅ 고객 이름 추출 완료:', {
              targetFolderPath,
              extractedCustomerName
            });
          }
        } else {
          // 제품명 추출 시도
          const extractedProductName = await extractProductName(imageUrl);
          if (extractedProductName) {
            productName = extractedProductName;
          }
        }
      }
      
      // 합성 기능 결정
      let compositionFunction = 'variation';
      if (variationMode === 'tone-only') {
        compositionFunction = 'tone';
      } else if (variationMode === 'background-only') {
        compositionFunction = 'background';
      } else if (variationMode === 'object-only') {
        compositionFunction = 'object';
      }
      
      // 표준 파일명 생성
      const uniqueFileName = await generateStandardFileName({
        location: location,
        productName: productName,
        compositionProgram: 'nanobanana',
        compositionFunction: compositionFunction,
        creationDate: new Date(),
        extension: originalExtension
      });
      
      const objectPath = targetFolderPath ? `${targetFolderPath}/${uniqueFileName}` : uniqueFileName;
      
      console.log('✅ 표준 파일명 생성 완료:', {
        location,
        productName,
        compositionFunction,
        uniqueFileName
      });
      
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

      // 원본 이미지의 메타데이터 복사 (image_assets 형식)
      let newMetadata = {
        cdn_url: publicUrl,
        file_path: targetFolderPath ? `${targetFolderPath}/${uniqueFileName}` : uniqueFileName,
        title: title,
        upload_source: 'variation-nanobanana', // Nanobanana 변형으로 생성된 이미지 표시
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        usage_count: 0
        // ⚠️ image_assets에는 다음 필드들이 없음: folder_path, date_folder, english_filename, original_filename, prompt, excerpt, content_type, brand_strategy, is_featured
      };

      // 원본 메타데이터가 있으면 복사
      if (originalMetadata) {
        console.log('📋 원본 메타데이터 발견, 복사 중...', {
          originalUrl: imageUrl,
          newUrl: publicUrl
        });

        // 원본 메타데이터 복사 (image_assets 형식)
        newMetadata = {
          ...newMetadata,
          alt_text: originalMetadata.alt_text || null,
          description: originalMetadata.description || null,
          ai_tags: originalMetadata.ai_tags || originalMetadata.tags || null,
          file_size: imageBuffer.byteLength,
          width: originalMetadata.width || null,
          height: originalMetadata.height || null,
          format: finalOutputFormat,
          status: originalMetadata.status || 'active',
          // GPS 및 촬영일시 복사
          gps_lat: originalMetadata.gps_lat || null,
          gps_lng: originalMetadata.gps_lng || null,
          taken_at: originalMetadata.taken_at || null
          // ⚠️ image_assets에는 다음 필드들이 없음: category_id, story_scene, image_type, customer_name_en, customer_initials, original_filename
        };
      }

      // ✅ 고객 이미지인 경우 고객 정보 조회 및 ai_tags에 추가
      // 배경 변형 모드일 때도 고객 정보를 정확히 추출
      if (location === 'customers' && productName !== 'none') {
        try {
          // 고객 이름 추출 (folder_name 형식: 영문이름-전화번호마지막4자리)
          const { data: customer, error: customerError } = await supabase
            .from('customers')
            .select('id, folder_name, name')
            .eq('folder_name', productName)
            .maybeSingle();

          if (!customerError && customer) {
            console.log('✅ 고객 정보 조회 완료:', {
              customerId: customer.id,
              folderName: customer.folder_name
            });

            // 날짜 추출 (file_path에서 또는 현재 날짜)
            const dateMatch = newMetadata.file_path?.match(/(\d{4}-\d{2}-\d{2})/);
            const visitDate = dateMatch ? dateMatch[1] : new Date().toISOString().slice(0, 10);
            
            // ai_tags에 고객 정보 추가
            const customerTag = `customer-${customer.id}`;
            const visitTag = `visit-${visitDate}`;
            
            // 기존 ai_tags가 있으면 배열로 변환, 없으면 새 배열 생성
            const existingTags = Array.isArray(newMetadata.ai_tags) 
              ? newMetadata.ai_tags 
              : newMetadata.ai_tags 
                ? [newMetadata.ai_tags] 
                : [];
            
            // 고객 태그가 이미 있으면 제거 후 다시 추가 (중복 방지)
            const tagsWithoutCustomer = existingTags.filter(
              (tag) => typeof tag === 'string' && !tag.startsWith('customer-') && !tag.startsWith('visit-')
            );
            
            newMetadata.ai_tags = [customerTag, visitTag, ...tagsWithoutCustomer];
            
            console.log('✅ 고객 태그 추가 완료:', {
              customerTag,
              visitTag,
              ai_tags: newMetadata.ai_tags
            });
          } else {
            console.warn('⚠️ 고객 정보 조회 실패:', customerError?.message || '고객을 찾을 수 없음');
          }
        } catch (error) {
          console.warn('⚠️ 고객 정보 조회 중 오류 (계속 진행):', error.message);
        }
      }

      // 이미지 메타데이터 저장
      const { error: metadataError } = await supabase
        .from('image_assets')
        .upsert(newMetadata, {
          onConflict: 'cdn_url',
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
