import { fal } from "@fal-ai/client";
import { createClient } from '@supabase/supabase-js';
import { getProductById, generateCompositionPrompt, generateLogoReplacementPrompt, getAbsoluteImageUrl, generateColorChangePrompt } from '../../lib/product-composition';
import { logFALAIUsage } from '../../lib/ai-usage-logger';
import { generateStandardFileName, detectLocation } from '../../lib/filename-generator';

// API 타임아웃 설정 (10분)
export const config = {
  maxDuration: 600, // 10분 (초 단위) - FAL AI 큐 대기 시간 여유 확보
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

/**
 * 이미지를 Supabase Storage에 저장
 * 저장 위치 결정 로직:
 * - 원본 위치가 각 제품 갤러리이면 → 원본 위치에만 저장
 * - 원본 위치가 갤러리가 아니면 → 원본 위치 + 제품 갤러리에 저장
 */
async function saveImageToSupabase(imageUrl, productId, prefix = 'composed', baseImageUrl = null, originalFileName = null, originalFolderPath = null) {
  try {
    console.log('💾 이미지 저장 시작:', { imageUrl, productId, baseImageUrl, originalFileName, originalFolderPath });
    
    // 🔍 디버깅: 입력값 상세 로깅
    console.log('🔍 [디버깅] saveImageToSupabase 입력값:', {
      productId: productId,
      productIdType: typeof productId,
      baseImageUrl: baseImageUrl,
      baseImageUrlType: typeof baseImageUrl,
      prefix: prefix,
      originalFileName: originalFileName,
      originalFolderPath: originalFolderPath
    });
    
    // 1. 소스 폴더 경로 결정 (원본 폴더 경로 우선, 없으면 baseImageUrl에서 추출)
    let sourceFolder = null;
    let sourceFolderType = null; // 'blog', 'kakao', 'other'
    
    // 원본 폴더 경로가 있으면 우선 사용
    if (originalFolderPath) {
      sourceFolder = originalFolderPath;
      // 폴더 타입 판단
      if (originalFolderPath.includes('blog/')) {
        sourceFolderType = 'blog';
      } else if (originalFolderPath.includes('kakao/')) {
        sourceFolderType = 'kakao';
      } else {
        sourceFolderType = 'other';
      }
      console.log('✅ 원본 폴더 경로 사용:', { sourceFolder, sourceFolderType });
    } else if (baseImageUrl) {
      // 원본 폴더 경로가 없으면 baseImageUrl에서 추출
      try {
        // ✅ 여러 패턴 시도
        let match = baseImageUrl.match(/blog-images\/([^?]+)/);
        
        // 패턴 1 실패 시 패턴 2 시도 (public URL에서 직접 경로 추출)
        if (!match) {
          match = baseImageUrl.match(/\/storage\/v1\/object\/public\/blog-images\/([^?]+)/);
        }
        
        // 패턴 2 실패 시 패턴 3 시도 (상대 경로)
        if (!match && baseImageUrl.startsWith('originals/')) {
          match = [null, baseImageUrl];
        }
        
        console.log('🔍 [디버깅] baseImageUrl 패턴 매칭:', {
          match: match ? '성공' : '실패',
          matchedPath: match ? match[1] : null,
          baseImageUrl: baseImageUrl
        });
        
        if (match) {
          const fullPath = decodeURIComponent(match[1]);
          const pathParts = fullPath.split('/');
          
          console.log('🔍 [디버깅] 경로 파싱:', {
            fullPath: fullPath,
            pathParts: pathParts,
            pathPartsLength: pathParts.length
          });
          
          if (pathParts.length > 1) {
            const baseFolder = pathParts.slice(0, -1).join('/');
            
            console.log('🔍 [디버깅] baseFolder 추출:', {
              baseFolder: baseFolder,
              startsWithOriginals: baseFolder.startsWith('originals/'),
              startsWithKakao: baseFolder.startsWith('originals/daily-branding/kakao/'),
              startsWithBlog: baseFolder.startsWith('originals/blog/')
            });
            
            // 소스 폴더 타입 판단
            if (baseFolder.startsWith('originals/blog/')) {
              sourceFolder = baseFolder;
              sourceFolderType = 'blog';
              console.log('📁 블로그 폴더 감지:', sourceFolder);
            } else if (baseFolder.startsWith('originals/daily-branding/kakao/')) {
              sourceFolder = baseFolder;
              sourceFolderType = 'kakao';
              console.log('📁 카카오 콘텐츠 폴더 감지:', sourceFolder);
            } else if (baseFolder.startsWith('originals/')) {
              // 기타 originals 폴더 (추후 확장 가능)
              sourceFolder = baseFolder;
              sourceFolderType = 'other';
              console.log('📁 기타 originals 폴더 감지:', sourceFolder);
            } else {
              console.warn('⚠️ [디버깅] originals로 시작하지 않는 경로:', baseFolder);
            }
          } else {
            console.warn('⚠️ [디버깅] 경로 파트가 부족합니다:', pathParts);
          }
        } else {
          console.warn('⚠️ [디버깅] blog-images 패턴 매칭 실패:', baseImageUrl);
        }
      } catch (err) {
        console.error('❌ [디버깅] 베이스 이미지 폴더 경로 추출 실패:', {
          error: err.message,
          stack: err.stack,
          baseImageUrl: baseImageUrl
        });
      }
    } else {
      console.warn('⚠️ [디버깅] baseImageUrl이 null 또는 undefined입니다');
    }
    
    // 2. 제품 정보 조회 (slug 가져오기)
    let productSlug = productId;
    let category = 'driver';
    
    console.log('🔍 [디버깅] 제품 정보 조회 시작:', {
      productId: productId,
      productIdType: typeof productId
    });
    
    try {
      const { data: productData, error: productError } = await supabase
        .from('product_composition')
        .select('slug, category, id, name')
        .or(`id.eq.${productId},slug.eq.${productId}`)
        .limit(1)
        .maybeSingle();
      
      console.log('🔍 [디버깅] 제품 정보 조회 결과:', {
        found: !!productData,
        productData: productData,
        error: productError,
        query: `id.eq.${productId},slug.eq.${productId}`
      });
      
      if (!productError && productData) {
        productSlug = productData.slug;
        category = productData.category;
        console.log('✅ [디버깅] 제품 정보 조회 성공:', {
          id: productData.id,
          name: productData.name,
          slug: productSlug,
          category: category
        });
      } else {
        console.warn('⚠️ [디버깅] 제품 정보 조회 실패:', {
          error: productError,
          productId: productId,
          usingDefault: { productSlug, category }
        });
      }
    } catch (err) {
      console.error('❌ [디버깅] 제품 정보 조회 중 예외:', {
        error: err.message,
        stack: err.stack,
        productId: productId
      });
    }
    
    // 3. 이미지 다운로드
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`이미지 다운로드 실패: ${imageResponse.status}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const fileExtension = imageUrl.split('.').pop()?.split('?')[0] || 'png';
    const contentType = imageResponse.headers.get('content-type') || `image/${fileExtension}`;
    
    // 4. 위치 감지 및 파일명 생성 (새로운 표준 형식)
    let location = 'products';
    if (sourceFolder) {
      const detectedLocation = detectLocation(sourceFolder);
      if (detectedLocation === 'daily-kakao') {
        location = 'daily-kakao';
      } else if (detectedLocation === 'goods') {
        location = 'goods';
      } else {
        location = 'products';
      }
    } else {
      // 제품 카테고리에 따라 위치 결정
      location = (category === 'cap' || category === 'hat' || category === 'accessory' || category === 'goods')
        ? 'goods'
        : 'products';
    }
    
    // 표준 파일명 생성
    const finalFileName = await generateStandardFileName({
      location: location,
      productName: productSlug || 'none',
      compositionProgram: 'nanobanana',
      compositionFunction: 'composed',
      creationDate: new Date(),
      extension: fileExtension
    });
    
    console.log('✅ 표준 파일명 생성 완료:', {
      location,
      productSlug,
      finalFileName
    });
    
    // 5. 제품 gallery 폴더 경로 결정
    const productGalleryFolder = (category === 'cap' || category === 'hat' || category === 'accessory' || category === 'goods')
      ? `originals/goods/${productSlug}/gallery`
      : `originals/products/${productSlug}/gallery`;
    
    console.log('🔍 [디버깅] 제품 갤러리 폴더 결정:', {
      category: category,
      productSlug: productSlug,
      productGalleryFolder: productGalleryFolder,
      productId: productId
    });
    
    // 6. 소스 폴더 경로 결정 (있는 경우)
    let sourceFileName = null;
    if (sourceFolder) {
      sourceFileName = `${sourceFolder}/${finalFileName}`;
    } else {
      // ✅ baseImageUrl에서 경로 추출 실패 시, baseImageUrl 자체에서 카카오 콘텐츠 경로 추출 시도
      if (baseImageUrl) {
        // baseImageUrl이 카카오 콘텐츠 URL 형식인지 확인
        const kakaoMatch = baseImageUrl.match(/daily-branding\/kakao\/(\d{4}-\d{2}-\d{2})\/(account[12])\/(feed|profile|background)/);
        if (kakaoMatch) {
          const [, dateStr, accountFolder, typeFolder] = kakaoMatch;
          sourceFolder = `originals/daily-branding/kakao/${dateStr}/${accountFolder}/${typeFolder}`;
          sourceFolderType = 'kakao';
          sourceFileName = `${sourceFolder}/${finalFileName}`;
          console.log('✅ baseImageUrl에서 카카오 콘텐츠 경로 추출 성공 (fallback):', {
            sourceFolder: sourceFolder,
            sourceFileName: sourceFileName
          });
        }
      }
    }
    
    // 7. 저장 위치 결정 로직
    // - 원본 위치가 각 제품 갤러리이면 → 원본 위치에만 저장
    // - 원본 위치가 갤러리가 아니면 → 원본 위치 + 제품 갤러리에 저장
    // 제품 갤러리 패턴: originals/products/{productSlug}/gallery 또는 originals/goods/{productSlug}/gallery
    const isSourceGallery = sourceFolder && (
      (sourceFolder.includes('/products/') && sourceFolder.includes('/gallery')) ||
      (sourceFolder.includes('/goods/') && sourceFolder.includes('/gallery'))
    );
    
    console.log('🔍 [디버깅] 저장 위치 결정:', {
      sourceFolder: sourceFolder,
      isSourceGallery: isSourceGallery,
      productGalleryFolder: productGalleryFolder
    });
    
    let savedFileName = null;
    let savedPublicUrl = null;
    let savedPath = null;
    let savedLocations = [];
    let sourcePublicUrl = null;
    let sourcePath = null;
    
    if (isSourceGallery && sourceFileName) {
      // 원본 위치가 각 제품 갤러리이면 → 원본 위치에만 저장
      console.log('📁 원본 위치가 각 제품 갤러리 → 원본 위치에만 저장');
      savedFileName = sourceFileName;
      savedPath = sourceFolder;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(savedFileName, imageBuffer, {
          contentType: contentType,
          upsert: false
        });
      
      if (uploadError) {
        throw new Error(`원본 위치 저장 실패: ${uploadError.message}`);
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(savedFileName);
      savedPublicUrl = publicUrl;
      savedLocations = ['source_folder'];
      
      console.log('✅ 원본 위치(갤러리) 저장 완료:', savedFileName);
    } else {
      // 원본 위치가 갤러리가 아니면 → 원본 위치 + 제품 갤러리에 저장
      console.log('📁 원본 위치가 갤러리가 아님 → 원본 위치 + 제품 갤러리에 저장');
      
      const productFileName = `${productGalleryFolder}/${finalFileName}`;
      
      // 1. 제품 갤러리에 저장 (항상)
      const { data: productUploadData, error: productUploadError } = await supabase.storage
        .from('blog-images')
        .upload(productFileName, imageBuffer, {
          contentType: contentType,
          upsert: false
        });
      
      if (productUploadError) {
        throw new Error(`제품 gallery 저장 실패: ${productUploadError.message}`);
      }
      
      const { data: { publicUrl: productPublicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(productFileName);
      
      savedFileName = productFileName;
      savedPublicUrl = productPublicUrl;
      savedPath = productGalleryFolder;
      savedLocations.push('product_gallery');
      
      console.log('✅ 제품 갤러리 저장 완료:', productFileName);
      
      // 2. 원본 위치에도 저장 (있는 경우)
      if (sourceFileName) {
        try {
          const { data: sourceUploadData, error: sourceUploadError } = await supabase.storage
            .from('blog-images')
            .upload(sourceFileName, imageBuffer, {
              contentType: contentType,
              upsert: false
            });
          
          if (!sourceUploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('blog-images')
              .getPublicUrl(sourceFileName);
            sourcePublicUrl = publicUrl;
            sourcePath = sourceFileName;
            savedLocations.push('source_folder');
            console.log('✅ 원본 위치 저장 완료:', sourceFileName);
          } else {
            console.warn('⚠️ 원본 위치 저장 실패 (제품 갤러리는 저장됨):', sourceUploadError.message);
          }
        } catch (sourceErr) {
          console.warn('⚠️ 원본 위치 저장 중 오류 (제품 갤러리는 저장됨):', sourceErr.message);
        }
      }
    }
    
    // 8. 저장 결과 반환
    const result = {
      fileName: savedFileName,
      publicUrl: savedPublicUrl,
      path: savedPath,
      originalUrl: imageUrl,
      // 저장 위치 정보
      savedLocations: savedLocations,
      // 원본 위치 정보 (있는 경우)
      sourcePath: sourcePath || (isSourceGallery ? savedFileName : null),
      sourceUrl: sourcePublicUrl || (isSourceGallery ? savedPublicUrl : null),
      sourceFolderType: sourceFolderType || null
    };
    
    console.log('✅ 이미지 저장 완료:', {
      savedFileName: savedFileName,
      savedPath: savedPath,
      sourcePath: sourcePath,
      savedLocations: savedLocations,
      isSourceGallery: isSourceGallery
    });
    
    // 메타데이터 저장
    // 제품 갤러리 메타데이터 저장 (원본 이미지 URL 전달)
    await saveImageMetadata(savedPublicUrl, savedFileName, 'product_gallery', null, baseImageUrl);
    
    // 원본 위치 메타데이터 저장 (있는 경우)
    if (sourcePublicUrl && sourcePath) {
      await saveImageMetadata(sourcePublicUrl, sourcePath, sourceFolderType || 'other', null, baseImageUrl);
    }
    
    return result;
  } catch (error) {
    console.error('❌ 이미지 저장 실패:', error);
    throw error;
  }
}

/**
 * 이미지 메타데이터 저장/업데이트
 */
async function saveImageMetadata(imageUrl, filePath, sourceFolderType, platform = null, baseImageUrl = null) {
  try {
    // 소스 타입에 따른 태그 및 채널 설정
    let tags = ['product-composition'];
    let source = 'ai_generated';
    let channel = null;
    
    if (sourceFolderType === 'kakao') {
      tags.push('kakao-content', 'daily-branding');
      source = 'kakao_content';
      channel = 'kakao';
    } else if (sourceFolderType === 'blog') {
      tags.push('blog');
      source = 'blog';
      channel = 'blog';
    } else if (sourceFolderType === 'mms' || sourceFolderType === 'sms' || platform === 'solapi') {
      tags.push('sms', 'mms', 'solapi');
      source = 'sms_mms';
      channel = 'sms';
    } else if (platform === 'naver') {
      tags.push('naver-blog');
      source = 'naver_blog';
      channel = 'naver';
    }
    
    // 원본 이미지가 고객 이미지인 경우 고객 정보 추가
    let customerId = null;
    let visitDate = null;
    
    if (baseImageUrl) {
      try {
        // 원본 이미지 메타데이터 조회
        const { data: originalMetadata } = await supabase
          .from('image_assets')
          .select('file_path, ai_tags')
          .eq('cdn_url', baseImageUrl)
          .maybeSingle();
        
        if (originalMetadata) {
          // file_path에서 고객 폴더 확인
          if (originalMetadata.file_path && originalMetadata.file_path.includes('originals/customers/')) {
            const customerMatch = originalMetadata.file_path.match(/customers\/([^/]+)/);
            if (customerMatch) {
              const customerFolderName = customerMatch[1];
              
              // 고객 정보 조회
              const { data: customer } = await supabase
                .from('customers')
                .select('id, folder_name')
                .eq('folder_name', customerFolderName)
                .maybeSingle();
              
              if (customer) {
                customerId = customer.id;
                
                // 날짜 추출 (file_path에서 또는 현재 날짜)
                const dateMatch = originalMetadata.file_path.match(/(\d{4}-\d{2}-\d{2})/);
                visitDate = dateMatch ? dateMatch[1] : new Date().toISOString().slice(0, 10);
                
                // 고객 태그 추가
                const customerTag = `customer-${customerId}`;
                const visitTag = `visit-${visitDate}`;
                tags.push(customerTag, visitTag);
                
                console.log('✅ 제품 합성: 고객 정보 추가:', {
                  customerId,
                  visitDate,
                  customerTag,
                  visitTag
                });
              }
            }
          }
          
          // ai_tags에서 고객 정보 추출 (file_path에서 찾지 못한 경우)
          if (!customerId && originalMetadata.ai_tags && Array.isArray(originalMetadata.ai_tags)) {
            const customerTag = originalMetadata.ai_tags.find((tag) => 
              typeof tag === 'string' && tag.startsWith('customer-')
            );
            const visitTag = originalMetadata.ai_tags.find((tag) => 
              typeof tag === 'string' && tag.startsWith('visit-')
            );
            
            if (customerTag) {
              customerId = parseInt(customerTag.replace('customer-', ''), 10);
              tags.push(customerTag);
            }
            if (visitTag) {
              visitDate = visitTag.replace('visit-', '');
              tags.push(visitTag);
            }
            
            if (customerId) {
              console.log('✅ 제품 합성: ai_tags에서 고객 정보 추출:', {
                customerId,
                visitDate
              });
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ 원본 이미지 메타데이터 조회 실패 (계속 진행):', error.message);
      }
    }
    
    // image_assets에 저장/업데이트
    const { data: existing } = await supabase
      .from('image_assets')
      .select('id, ai_tags')
      .eq('cdn_url', imageUrl)
      .maybeSingle();
    
    if (existing) {
      // 기존 메타데이터 업데이트 (태그 병합)
      const existingTags = existing.ai_tags || existing.tags || [];
      const mergedTags = [...new Set([...existingTags, ...tags])];
      
      await supabase
        .from('image_assets')
        .update({
          ai_tags: mergedTags,
          upload_source: source,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
      
      console.log('✅ 이미지 메타데이터 업데이트 완료:', { imageUrl, tags: mergedTags, source });
    } else {
      // 새 메타데이터 생성
      const folderPath = filePath.split('/').slice(0, -1).join('/');
      
      await supabase
        .from('image_assets')
        .insert({
          cdn_url: imageUrl,
          file_path: filePath,
          ai_tags: tags,
          upload_source: source,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      console.log('✅ 이미지 메타데이터 생성 완료:', { imageUrl, tags, source });
    }
  } catch (error) {
    console.warn('⚠️ 이미지 메타데이터 저장 실패:', error.message);
    // 메타데이터 저장 실패해도 이미지 저장은 성공으로 처리
  }
}

/**
 * 소스 타입에 따른 출력 포맷 자동 결정
 * - 카카오 콘텐츠: WebP
 * - 블로그/네이버/SMS/MMS: JPG 85%
 * - 기타: PNG (기본값)
 */
function determineOutputFormat(baseImageUrl, requestedFormat = null) {
  // 🔍 디버깅: 입력값 로깅
  console.log('🔍 [디버깅] determineOutputFormat 호출:', {
    baseImageUrl: baseImageUrl,
    baseImageUrlType: typeof baseImageUrl,
    baseImageUrlLength: baseImageUrl?.length,
    requestedFormat: requestedFormat,
    baseImageUrlIncludesKakao: baseImageUrl?.includes('daily-branding/kakao'),
    baseImageUrlIncludesBlogImages: baseImageUrl?.includes('blog-images')
  });
  
  // 명시적으로 요청된 포맷이 있으면 우선 사용
  if (requestedFormat && ['png', 'jpeg', 'webp'].includes(requestedFormat.toLowerCase())) {
    console.log('📦 [디버깅] 명시적 포맷 요청 사용:', requestedFormat);
    return requestedFormat.toLowerCase();
  }
  
  // baseImageUrl에서 소스 타입 감지
  if (baseImageUrl) {
    try {
      const match = baseImageUrl.match(/blog-images\/([^?]+)/);
      console.log('🔍 [디버깅] URL 패턴 매칭 결과:', {
        match: match ? '성공' : '실패',
        matchedPath: match ? match[1] : null
      });
      
      if (match) {
        const fullPath = decodeURIComponent(match[1]);
        console.log('🔍 [디버깅] 디코딩된 경로:', {
          fullPath: fullPath,
          startsWithOriginals: fullPath.startsWith('originals/'),
          startsWithKakao: fullPath.startsWith('originals/daily-branding/kakao/'),
          startsWithBlog: fullPath.startsWith('originals/blog/')
        });
        
        // 카카오 콘텐츠: WebP
        if (fullPath.startsWith('originals/daily-branding/kakao/')) {
          console.log('📦 포맷 자동 결정: 카카오 콘텐츠 → WebP');
          return 'webp';
        }
        
        // 블로그/네이버: JPG 85%
        if (fullPath.startsWith('originals/blog/')) {
          console.log('📦 포맷 자동 결정: 블로그 → JPG 85%');
          return 'jpeg';
        }
        
        // AI 이미지 생성: JPG 85%
        if (fullPath.startsWith('originals/ai-generated/')) {
          console.log('📦 포맷 자동 결정: AI 이미지 생성 → JPG 85%');
          return 'jpeg';
        }
        
        // SMS/MMS: JPG 85% (Solapi는 JPG만 지원)
        if (fullPath.includes('mms/') || fullPath.includes('sms/') || 
            fullPath.includes('solapi/') || baseImageUrl.includes('solapi')) {
          console.log('📦 포맷 자동 결정: SMS/MMS → JPG 85%');
          return 'jpeg';
        }
        
        console.warn('⚠️ [디버깅] 알 수 없는 경로 패턴, 기본값 PNG 사용:', fullPath);
      } else {
        console.warn('⚠️ [디버깅] blog-images 패턴 매칭 실패:', baseImageUrl);
      }
      
      // URL에서 직접 판단 (Solapi 관련)
      if (baseImageUrl.includes('solapi') || baseImageUrl.includes('sms') || baseImageUrl.includes('mms')) {
        console.log('📦 포맷 자동 결정: SMS/MMS (URL 기반) → JPG 85%');
        return 'jpeg';
      }
      
      // URL에서 직접 판단 (AI 이미지 생성 관련)
      if (baseImageUrl.includes('ai-generated')) {
        console.log('📦 포맷 자동 결정: AI 이미지 생성 (URL 기반) → JPG 85%');
        return 'jpeg';
      }
      
      // URL에서 직접 판단 (카카오 콘텐츠 관련)
      if (baseImageUrl.includes('daily-branding/kakao')) {
        console.log('📦 포맷 자동 결정: 카카오 콘텐츠 (URL 기반) → WebP');
        return 'webp';
      }
    } catch (err) {
      console.error('❌ [디버깅] 소스 타입 감지 중 오류:', {
        error: err.message,
        stack: err.stack,
        baseImageUrl: baseImageUrl
      });
    }
  } else {
    console.warn('⚠️ [디버깅] baseImageUrl이 null 또는 undefined입니다');
  }
  
  // 기본값: PNG (기존 호환성 유지)
  console.log('📦 포맷 자동 결정: 기본값 → PNG');
  return 'png';
}

function getAbsoluteProductImageUrl(productImageUrl) {
  // null, undefined, 빈 문자열 체크
  if (!productImageUrl || typeof productImageUrl !== 'string') return null;
  
  // 공백 제거 및 유효성 검사
  const trimmed = productImageUrl.trim();
  if (!trimmed || trimmed === '-' || trimmed.length < 3) {
    console.warn('⚠️ 잘못된 제품 이미지 URL:', productImageUrl);
    return null;
  }
  
  // 이미 절대 URL인 경우 그대로 반환
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // 로컬호스트 URL은 FAL AI에서 접근 불가하므로 에러 발생
    if (trimmed.includes('localhost') || trimmed.includes('127.0.0.1')) {
      throw new Error(`로컬호스트 URL은 FAL AI에서 사용할 수 없습니다: ${trimmed}. 프로덕션 도메인을 사용하거나 Supabase 공개 URL을 사용해주세요.`);
    }
    // 이미 Supabase URL이면 그대로 반환
    if (trimmed.includes('supabase.co')) {
      return trimmed;
    }
    // 다른 절대 URL도 그대로 반환 (예: 외부 이미지)
    return trimmed;
  }
  
  // ✅ 구 형식 경로 변환: /main/products/... → originals/products/... 또는 originals/goods/...
  let cleanPath = trimmed;
  if (cleanPath.startsWith('/main/products/')) {
    // /main/products/... → originals/products/...
    cleanPath = cleanPath.replace('/main/products/', 'originals/products/');
    // goods 카테고리인 경우 추가 변환
    if (cleanPath.includes('/goods/')) {
      cleanPath = cleanPath.replace('originals/products/goods/', 'originals/goods/');
    }
    console.log(`🔄 구 형식 경로 변환: ${trimmed} → ${cleanPath}`);
  } else if (cleanPath.startsWith('/')) {
    // 다른 상대 경로는 앞의 / 제거
    cleanPath = cleanPath.slice(1);
  }
  
  // Supabase Storage 공개 URL로 변환
  const SUPABASE_BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yyytjudftvpmcnppaymw.supabase.co';
  const STORAGE_BUCKET = 'blog-images';
  
  // Supabase Storage 공개 URL 생성
  const supabaseUrl = `${SUPABASE_BASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${cleanPath}`;
  
  console.log(`🔗 제품 이미지 URL 변환: ${productImageUrl} → ${supabaseUrl}`);
  
  return supabaseUrl;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    // FAL AI API 키 확인
    if (!process.env.FAL_KEY && !process.env.FAL_API_KEY) {
      return res.status(400).json({ 
        success: false, 
        error: 'FAL AI API 키가 설정되지 않았습니다. 환경 변수 FAL_KEY 또는 FAL_API_KEY를 확인해주세요.' 
      });
    }

    const { 
      modelImageUrl,      // 생성된 모델 이미지 URL (필수)
      productId,          // 제품 ID (필수)
      productImageUrl,    // 제품 이미지 URL (선택, 제공 시 더 정확한 합성)
      compositionTarget, // 합성 타겟: 'hands' | 'head' | 'body' | 'accessory'
      driverPart,         // 드라이버 부위 (드라이버 전용): 'crown' | 'sole' | 'face' | 'full'
      compositionMethod = 'nano-banana-pro', // 'nano-banana-pro' | 'nano-banana'
      prompt,             // 커스텀 프롬프트 (선택)
      replaceLogo = false, // 로고 교체 옵션
      changeProductColor = false, // 제품 색상 변경 활성화 여부
      productColor,       // 변경할 제품 색상 (예: 'red', 'blue', 'navy', 'beige')
      numImages = 1,      // 생성할 이미지 개수
      resolution = '1K',  // '1K' | '2K' | '4K'
      aspectRatio = 'auto', // 'auto' | '1:1' | '16:9' 등
      outputFormat: requestedFormat = null,  // 클라이언트 요청 포맷 (선택, 자동 감지 우선)
      compositionBackground = 'natural', // 배경 타입: 'natural' | 'studio' | 'product-page'
      productOnlyMode = false, // 제품컷 전용 모드
      baseImageUrl = null, // 베이스 이미지 URL (저장 위치 결정용)
      imageType = null, // 이미지 타입: 'profile' | 'feed' | 'background' (프로필 이미지용 클로즈업 지시사항)
      originalFileName = null, // 원본 파일명 (파일명 최적화용)
      originalFolderPath = null // 원본 폴더 경로 (저장 위치 최적화용)
    } = req.body;

    // 🔍 디버깅: 요청 파라미터 상세 로깅
    console.log('🔍 [디버깅] compose-product-image 요청 파라미터:', {
      productId: productId,
      productIdType: typeof productId,
      modelImageUrl: modelImageUrl,
      baseImageUrl: baseImageUrl,
      baseImageUrlType: typeof baseImageUrl,
      baseImageUrlIncludesKakao: baseImageUrl?.includes('daily-branding/kakao'),
      baseImageUrlIncludesBlogImages: baseImageUrl?.includes('blog-images'),
      compositionTarget: compositionTarget
    });

    // 소스 타입에 따라 포맷 자동 결정
    const outputFormat = determineOutputFormat(baseImageUrl || modelImageUrl, requestedFormat);
    const quality = outputFormat === 'jpeg' ? 85 : undefined; // JPG는 85% 품질
    
    console.log('📦 출력 포맷 결정:', {
      baseImageUrl: baseImageUrl || modelImageUrl,
      requestedFormat,
      finalFormat: outputFormat,
      quality
    });

    // 필수 파라미터 확인
    if (!productId) {
      return res.status(400).json({ 
        success: false, 
        error: 'productId는 필수입니다.' 
      });
    }
    if (!productOnlyMode && !modelImageUrl) {
      return res.status(400).json({ 
        success: false, 
        error: 'modelImageUrl과 productId는 필수입니다.' 
      });
    }

    // 제품 정보 조회 (Supabase 우선, Fallback: 기존 하드코딩)
    let product = null;
    
    // Supabase에서 직접 조회 (서버 사이드에서는 클라이언트 직접 사용)
    try {
      // UUID 또는 slug로 제품 조회
      const { data: supabaseProduct, error: supabaseError } = await supabase
        .from('product_composition')
        .select('*')
        .or(`id.eq.${productId},slug.eq.${productId}`)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (!supabaseError && supabaseProduct) {
        // .png를 .webp로 변환하는 헬퍼 함수
        const convertPngToWebp = (url) => {
          if (!url) return url;
          return url.endsWith('.png') ? url.replace(/\.png$/, '.webp') : url;
        };
        
        // reference_images 배열 변환
        const convertedReferenceImages = (supabaseProduct.reference_images || []).map(img => convertPngToWebp(img));
        
        // Supabase 데이터를 ProductForComposition 형식으로 변환
        product = {
          id: supabaseProduct.id,
          name: supabaseProduct.name,
          category: supabaseProduct.category,
          compositionTarget: supabaseProduct.composition_target,
          imageUrl: convertPngToWebp(supabaseProduct.image_url), // 기본 이미지 (.png → .webp 변환됨)
          referenceImages: convertedReferenceImages, // .png → .webp 변환됨
          // ✅ reference_images_enabled 필드 추가 (참조 이미지 활성화 상태)
          reference_images_enabled: supabaseProduct.reference_images_enabled || {},
          driverParts: supabaseProduct.driver_parts || undefined,
          hatType: supabaseProduct.hat_type,
          slug: supabaseProduct.slug,
          description: supabaseProduct.description,
          features: supabaseProduct.features || [],
        };
        console.log('✅ Supabase에서 제품 조회 성공:', product.id, product.name, 'imageUrl:', product.imageUrl);
      } else if (supabaseError) {
        console.warn('⚠️ Supabase에서 제품 조회 실패:', supabaseError.message);
      }
    } catch (supabaseError) {
      console.warn('⚠️ Supabase에서 제품 조회 실패, 기존 데이터 사용:', supabaseError.message);
    }
    
    // Supabase에서 찾지 못한 경우 기존 하드코딩 데이터 사용
    if (!product) {
      product = getProductById(productId);
    }
    
    if (!product) {
      return res.status(400).json({ 
        success: false, 
        error: `제품을 찾을 수 없습니다: ${productId}` 
      });
    }

    console.log('🎨 제품 합성 시작:', {
      productId: product.id,
      productName: product.name,
      modelImageUrl,
      compositionMethod
    });

    // 제품컷 전용 모드: 모델 이미지 없이 제품/참조 이미지만 사용
    const hasReferenceImages = product.referenceImages && product.referenceImages.length > 0;
    const targetCompositionTarget = compositionTarget || product.compositionTarget || 'hands';
    const targetDriverPart = driverPart || 'full';
    const backgroundPrompt = compositionBackground === 'studio'
      ? 'premium golf shop display, well-lit shelves, product-only, no people, upscale retail'
      : compositionBackground === 'product-page'
        ? 'clean white or light-gray studio background, product-only, e-commerce product page style, soft shadows, no people, no distractions'
        : 'outdoor golf course vibe, product-only, no people, natural light';
    // ✅ 샤프트/배지 이미지 URL 가져오기
    const shaftImageUrl = product.shaftImageUrl || product.shaft_image_url;
    const badgeImageUrl = product.badgeImageUrl || product.badge_image_url;
    
    // ✅ 샤프트/배지 이미지 URL을 product 객체에 추가
    if (shaftImageUrl) {
      product.shaftImageUrl = shaftImageUrl;
    }
    if (badgeImageUrl) {
      product.badgeImageUrl = badgeImageUrl;
    }
    
    let compositionPrompt = prompt || generateCompositionPrompt(
      product, 
      hasReferenceImages,
      targetDriverPart,
      compositionBackground,
      imageType  // ✅ 이미지 타입 전달 (프로필 이미지용 클로즈업 지시사항)
    );
    if (productOnlyMode) {
      // 사람 없이 제품컷 전용 프롬프트
      compositionPrompt = prompt || `Product-only shot, no people. ${backgroundPrompt}. High detail, sharp focus, 4k.`;
    }
    
    // 색상 변경 처리: 프롬프트로 색상 변경
    if (changeProductColor && productColor) {
      const colorChangePrompt = generateColorChangePrompt(
        product,
        productColor,
        targetCompositionTarget
      );
      compositionPrompt = `${compositionPrompt}. ${colorChangePrompt}`;
      console.log('🎨 색상 변경 프롬프트 추가:', productColor);
    }
    
    // 로고 교체 프롬프트 추가
    if (replaceLogo) {
      compositionPrompt += '. ' + generateLogoReplacementPrompt();
      console.log('🔄 로고 교체 프롬프트 추가됨');
    }
    
    console.log('📝 최종 합성 프롬프트:', compositionPrompt);

    // 모델 이미지 URL 검증 및 변환
    let validatedModelImageUrl = null;
    if (!productOnlyMode && modelImageUrl) {
      // 로컬호스트 체크
      if (modelImageUrl.includes('localhost') || modelImageUrl.includes('127.0.0.1')) {
        throw new Error(`모델 이미지 URL이 로컬호스트입니다. FAL AI는 공개적으로 접근 가능한 URL만 사용할 수 있습니다. Supabase 공개 URL을 사용해주세요: ${modelImageUrl}`);
      }
      
      // HTTPS 체크
      if (!modelImageUrl.startsWith('https://')) {
        throw new Error(`모델 이미지 URL은 HTTPS로 시작해야 합니다: ${modelImageUrl}`);
      }
      
      // ✅ 잘못된 v_file 경로를 올바른 형식으로 변환
      if (modelImageUrl.includes('/storage/v_file/')) {
        console.warn('⚠️ 잘못된 v_file URL 형식 감지, 올바른 형식으로 변환 중...');
        
        // 1. baseImageUrl이 있으면 우선 사용 (실제 저장 경로 - 가장 정확)
        if (baseImageUrl && baseImageUrl.includes('supabase.co/storage/v1/object/public/blog-images/')) {
          // baseImageUrl에서 경로 추출
          const basePathMatch = baseImageUrl.match(/blog-images\/([^?]+)/);
          if (basePathMatch) {
            const extractedPath = basePathMatch[1];
            const SUPABASE_BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yyytjudftvpmcnppaymw.supabase.co';
            validatedModelImageUrl = `${SUPABASE_BASE_URL}/storage/v1/object/public/blog-images/${extractedPath}`;
            
            console.log('🔄 v_file URL 변환 완료 (baseImageUrl 사용):', {
              original: modelImageUrl,
              baseImageUrl: baseImageUrl,
              converted: validatedModelImageUrl
            });
          }
        }
        
        // 2. baseImageUrl이 없거나 추출 실패 시 파일명으로 경로 추정
        if (!validatedModelImageUrl) {
          const vFileMatch = modelImageUrl.match(/\/storage\/v_file\/([^?]+)/);
          if (vFileMatch) {
            const fileName = vFileMatch[1];
            
            // 파일명에서 정보 추출
            // 예: kakao-account1-profile-1768230321468-1-1.jpg
            const accountMatch = fileName.match(/kakao-(account[12])-(profile|feed|background)/);
            const accountFolder = accountMatch ? accountMatch[1] : 'account1';
            const typeFolder = accountMatch ? accountMatch[2] : 'profile';
            
            // 날짜 추정 (현재 날짜 또는 파일명의 타임스탬프에서 추출)
            const timestampMatch = fileName.match(/(\d{13})/);
            let dateStr = new Date().toISOString().split('T')[0];
            if (timestampMatch) {
              try {
                const timestamp = parseInt(timestampMatch[1]);
                dateStr = new Date(timestamp).toISOString().split('T')[0];
              } catch (e) {
                // 타임스탬프 파싱 실패 시 현재 날짜 사용
              }
            }
            
            // 올바른 경로로 변환
            const SUPABASE_BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yyytjudftvpmcnppaymw.supabase.co';
            validatedModelImageUrl = `${SUPABASE_BASE_URL}/storage/v1/object/public/blog-images/originals/daily-branding/kakao/${dateStr}/${accountFolder}/${typeFolder}/${fileName}`;
            
            console.log('🔄 v_file URL 변환 완료 (파일명 추정):', {
              original: modelImageUrl,
              converted: validatedModelImageUrl,
              estimatedPath: `originals/daily-branding/kakao/${dateStr}/${accountFolder}/${typeFolder}/${fileName}`
            });
          }
        }
        
        // 3. 변환 실패 시 명확한 에러 메시지
        if (!validatedModelImageUrl) {
          throw new Error(`v_file URL을 올바른 형식으로 변환할 수 없습니다: ${modelImageUrl}. baseImageUrl을 제공하거나 올바른 URL 형식을 사용해주세요.`);
        }
      } else {
        validatedModelImageUrl = modelImageUrl;
      }
      
      // ✅ Supabase Storage URL 접근성 확인 (HEAD 요청)
      if (validatedModelImageUrl && validatedModelImageUrl.includes('supabase.co/storage/v1/object/public/')) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃
          
          const headResponse = await fetch(validatedModelImageUrl, {
            method: 'HEAD',
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          if (!headResponse.ok) {
            console.warn(`⚠️ 모델 이미지 URL 접근 불가 (${headResponse.status}):`, validatedModelImageUrl);
            // 접근 불가해도 계속 진행 (FAL AI가 다시 시도할 수 있음)
          } else {
            console.log('✅ 모델 이미지 URL 접근 가능 확인');
          }
        } catch (fetchError) {
          if (fetchError.name !== 'AbortError') {
            console.warn('⚠️ 모델 이미지 URL 접근성 확인 실패:', fetchError.message);
          }
          // 타임아웃이나 네트워크 오류는 무시하고 계속 진행
        }
      }
      
      console.log('📸 모델 이미지 URL 검증 완료:', validatedModelImageUrl);
    }
    
    // 이미지 URL 배열 구성
    const imageUrls = [];
    if (validatedModelImageUrl) {
      imageUrls.push(validatedModelImageUrl);
    }
    
    // 제품 이미지 URL 추가 (제공된 경우)
    const addImageUrl = (url, label) => {
      try {
        const absolute = getAbsoluteProductImageUrl(url);
        if (absolute) {
          imageUrls.push(absolute);
          console.log(`✅ ${label}:`, absolute);
        } else {
          console.warn(`⚠️ 로컬 개발 환경에서는 ${label}를 제외합니다.`);
        }
      } catch (error) {
        console.error(`❌ ${label} URL 변환 실패:`, error.message);
        if (process.env.NODE_ENV === 'production') {
          throw error;
        } else {
          console.warn(`⚠️ 로컬 개발 환경에서는 ${label}를 제외하고 계속 진행합니다.`);
        }
      }
    };

    if (productImageUrl) {
      addImageUrl(productImageUrl, '제품 이미지');
    } else if (product.imageUrl) {
      addImageUrl(product.imageUrl, '제품 이미지 (데이터베이스)');
    }

    // 참조 이미지들 추가 (메인 이미지와 중복 제거)
    if (product.referenceImages && product.referenceImages.length > 0) {
      console.log(`📐 ${product.referenceImages.length}개의 참조 이미지 발견`);
      
      // 메인 이미지 URL (중복 체크용)
      const mainImageUrl = productImageUrl || product.imageUrl;
      
      // URL 정규화 함수 (경로 비교용)
      const normalizeUrl = (url) => {
        if (!url) return '';
        // 절대 경로로 변환 후 비교
        return url.replace(/^\/+/, '/').toLowerCase();
      };
      
      // ✅ URL 매칭용 정규화 함수 (상대 경로와 절대 경로 모두 처리)
      const normalizeUrlForMatching = (url) => {
        if (!url) return '';
        // 절대 URL에서 경로 부분만 추출
        const pathMatch = url.match(/\/blog-images\/(.+)$/);
        if (pathMatch) {
          return pathMatch[1].toLowerCase();
        }
        // 상대 경로인 경우
        if (url.startsWith('originals/') || url.startsWith('products/')) {
          return url.toLowerCase();
        }
        return url.toLowerCase();
      };
      
      const mainImageNormalized = normalizeUrl(mainImageUrl);
      
      // ✅ 참조 이미지 활성화 상태 확인
      const refImagesEnabled = product.reference_images_enabled || {};
      
      // 메인 이미지와 중복되지 않고 활성화된 참조 이미지만 추가
      const uniqueRefImages = product.referenceImages.filter(refImg => {
        if (!refImg) return false;
        const refNormalized = normalizeUrl(refImg);
        // 중복 체크
        if (refNormalized === mainImageNormalized) return false;
        
        // ✅ 활성화 상태 체크 (URL 정규화하여 매칭)
        // refImagesEnabled의 키도 정규화하여 비교
        const refNormalizedForMatching = normalizeUrlForMatching(refImg);
        const enabledKeys = Object.keys(refImagesEnabled);
        const isDisabled = enabledKeys.some(key => {
          const normalizedKey = normalizeUrlForMatching(key);
          return normalizedKey === refNormalizedForMatching && refImagesEnabled[key] === false;
        });
        
        if (isDisabled) {
          console.log(`⏭️ 참조 이미지 비활성화됨: ${refImg}`);
          return false;
        }
        
        return true;
      });
      
      if (uniqueRefImages.length > 0) {
        for (const refImage of uniqueRefImages) {
        addImageUrl(refImage, '참조 이미지');
        }
        const disabledCount = product.referenceImages.length - uniqueRefImages.length;
        console.log(`✅ ${uniqueRefImages.length}개의 활성화된 참조 이미지 추가됨${disabledCount > 0 ? ` (비활성화 ${disabledCount}개 제외)` : ''}`);
      } else {
        console.log(`⚠️ 활성화된 참조 이미지가 없습니다.`);
      }
    }
    
    // 모든 URL이 공개적으로 접근 가능한지 최종 확인
    const sanitizedUrls = imageUrls.filter(Boolean);
    
    // URL 검증
    for (const url of sanitizedUrls) {
      if (!url.startsWith('https://') || url.includes('localhost') || url.includes('127.0.0.1')) {
        throw new Error(`공개적으로 접근 가능하지 않은 URL이 포함되어 있습니다: ${url}. 모든 이미지 URL은 HTTPS로 시작하는 공개 URL이어야 합니다.`);
      }
    }
    
    // 이미지 URL 개수 확인
    if (productOnlyMode && sanitizedUrls.length === 0) {
      throw new Error('제품컷 모드에서는 제품/참조 이미지가 최소 1개 이상 필요합니다.');
    }
    
    if (!productOnlyMode && sanitizedUrls.length === 0) {
      throw new Error('합성할 이미지가 없습니다. 모델 이미지 또는 제품 이미지가 필요합니다.');
    }
    
    // ✅ FAL AI API 제한: 최대 14개 이미지 URL (안전장치)
    const MAX_IMAGE_URLS = 14;
    let finalUrls = sanitizedUrls;
    if (sanitizedUrls.length > MAX_IMAGE_URLS) {
      console.warn(`⚠️ 이미지 URL이 ${sanitizedUrls.length}개로 제한(${MAX_IMAGE_URLS}개)을 초과합니다. 우선순위에 따라 제한합니다.`);
      
      // 우선순위: 1. 모델 이미지, 2. 제품 메인 이미지, 3. 참조 이미지
      const prioritizedUrls = [];
      
      // 1. 모델 이미지 (필수)
      if (validatedModelImageUrl) {
        prioritizedUrls.push(validatedModelImageUrl);
      }
      
      // 2. 제품 메인 이미지 (필수)
      const mainProductUrl = productImageUrl || product.imageUrl;
      if (mainProductUrl) {
        const absoluteMain = getAbsoluteProductImageUrl(mainProductUrl);
        if (absoluteMain && !prioritizedUrls.includes(absoluteMain)) {
          prioritizedUrls.push(absoluteMain);
        }
      }
      
      // 3. 참조 이미지 (남은 공간만큼만)
      const remainingSlots = MAX_IMAGE_URLS - prioritizedUrls.length;
      const refImages = sanitizedUrls.filter(url => 
        url !== validatedModelImageUrl && 
        url !== getAbsoluteProductImageUrl(mainProductUrl) &&
        url !== getAbsoluteProductImageUrl(product.imageUrl)
      );
      
      if (refImages.length > 0 && remainingSlots > 0) {
        prioritizedUrls.push(...refImages.slice(0, remainingSlots));
        console.log(`✅ ${prioritizedUrls.length}개의 이미지 URL로 제한 (참조 이미지 ${refImages.length}개 중 ${remainingSlots}개만 사용)`);
      }
      
      // 제한된 URL 배열로 교체
      finalUrls = prioritizedUrls;
    }
    
    console.log(`📋 최종 이미지 URL 목록 (${finalUrls.length}개):`, finalUrls);

    // 나노바나나 API 호출
    const modelName = compositionMethod === 'nano-banana' 
      ? 'fal-ai/nano-banana/edit' 
      : 'fal-ai/nano-banana-pro/edit';

    console.log(`🚀 FAL AI API 호출: ${modelName}`);
    console.log('📤 FAL AI 요청 파라미터:', {
      prompt: compositionPrompt.substring(0, 100) + '...',
      image_urls_count: sanitizedUrls.length,
      image_urls: sanitizedUrls,
      num_images: numImages,
      aspect_ratio: aspectRatio,
      output_format: outputFormat,
      resolution: resolution
    });

    let result;
    try {
      // FAL AI 입력 파라미터 구성
      const falInput = {
        prompt: compositionPrompt,
        image_urls: finalUrls, // ✅ 제한된 URL 배열 사용 (최대 14개)
        num_images: numImages,
        aspect_ratio: aspectRatio,
        output_format: outputFormat,
        resolution: resolution
      };
      
      // JPG인 경우 quality 파라미터 추가 (FAL AI가 지원하는 경우)
      if (outputFormat === 'jpeg' && quality) {
        falInput.quality = quality;
      }
      
      result = await fal.subscribe(modelName, {
        input: falInput,
        logs: true,
        onQueueUpdate: (update) => {
          console.log('📊 FAL AI 큐 상태:', update.status);
          
          if (update.status === "IN_QUEUE") {
            console.log('⏳ FAL AI 큐 대기 중... (요청이 큐에 추가됨)');
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
        name: falError.name,
        response: falError.response || falError.body
      });
      
      // FAL AI 오류 메시지 추출 (개선된 파싱)
      let errorMessage = falError.message || 'FAL AI API 호출에 실패했습니다.';
      
      if (falError.response || falError.body) {
        const errorData = falError.response || falError.body;
        
        // 다양한 오류 형식 처리
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
        } else if (errorData.error) {
          errorMessage = typeof errorData.error === 'string'
            ? errorData.error
            : JSON.stringify(errorData.error);
        } else {
          // 전체 오류 객체를 JSON으로 변환 (디버깅용)
          errorMessage = JSON.stringify(errorData, null, 2);
        }
      } else if (falError.message) {
        errorMessage = falError.message;
      }
      
      // 전체 에러 정보 로깅 (디버깅용)
      console.error('❌ FAL AI 전체 에러 정보:', {
        message: errorMessage,
        name: falError.name,
        stack: falError.stack,
        response: falError.response,
        body: falError.body
      });
      
      throw new Error(`FAL AI API 오류: ${errorMessage}`);
    }

    console.log('✅ FAL AI 응답 수신:', {
      imagesCount: result.data?.images?.length || 0,
      description: result.data?.description
    });

    // 결과 확인
    if (!result.data || !result.data.images || result.data.images.length === 0) {
      throw new Error('FAL AI에서 이미지를 생성하지 못했습니다.');
    }

    // ✅ FAL AI 비용 계산 및 로깅
    const generatedImagesCount = result.data.images.length;
    // FAL AI nano-banana-pro 비용: 이미지 1장당 약 $0.01 (추정)
    // nano-banana는 약 $0.008 (더 저렴)
    const costPerImage = modelName.includes('nano-banana-pro') ? 0.01 : 0.008;
    const totalCost = generatedImagesCount * costPerImage;
    
    console.log(`💰 FAL AI 비용: $${totalCost.toFixed(4)} (${generatedImagesCount}장 × $${costPerImage.toFixed(4)}/장)`);
    console.log(`📊 모델: ${modelName}, 해상도: ${resolution}, 포맷: ${outputFormat}`);

    // AI 사용량 로그 저장
    try {
      await logFALAIUsage(
        'compose-product-image',
        'product-composition',
        {
          model: modelName,
          imageCount: generatedImagesCount,
          resolution: resolution,
          output_format: outputFormat,
          product_id: productId,
          product_name: product.name,
          cost_per_image: costPerImage,
          total_cost: totalCost
        }
      );
      console.log('✅ AI 사용량 로그 저장 완료');
    } catch (logError) {
      console.error('⚠️ AI 사용량 로그 저장 실패 (계속 진행):', logError.message);
      // 로그 저장 실패해도 합성은 계속 진행
    }

    // 생성된 이미지들을 Supabase에 저장
    const savedImages = [];
    for (let i = 0; i < result.data.images.length; i++) {
      const image = result.data.images[i];
      try {
        const saved = await saveImageToSupabase(
          image.url, 
          productId, 
          `composed-${i + 1}`,
          baseImageUrl || modelImageUrl, // 베이스 이미지 URL 전달 (저장 위치 결정용)
          originalFileName, // 원본 파일명 (파일명 최적화용)
          originalFolderPath // 원본 폴더 경로 (저장 위치 최적화용)
        );
        savedImages.push({
          ...saved,
          falImage: image
        });
      } catch (saveError) {
        console.error(`❌ 이미지 ${i + 1} 저장 실패:`, saveError);
        // 저장 실패해도 원본 URL은 반환
        savedImages.push({
          publicUrl: image.url,
          originalUrl: image.url,
          falImage: image,
          error: saveError.message
        });
      }
    }

    const processingTime = Date.now() - startTime;

    // 성공 응답
    return res.status(200).json({
      success: true,
      images: savedImages.map(img => ({
        imageUrl: img.publicUrl,
        path: img.path,
        originalUrl: img.originalUrl || img.publicUrl,
        fileName: img.fileName,
        // 두 곳 저장 정보 (있는 경우)
        sourcePath: img.sourcePath || null,
        sourceUrl: img.sourceUrl || null,
        sourceFolderType: img.sourceFolderType || null,
        savedLocations: img.savedLocations || ['product_gallery']
      })),
      product: {
        id: product.id,
        name: product.name,
        displayName: product.displayName,
        category: product.category
      },
      metadata: {
        composedAt: new Date().toISOString(),
        method: compositionMethod,
        processingTime: processingTime,
        description: result.data.description,
        requestId: result.requestId,
        cost: {
          total: totalCost,
          perImage: costPerImage,
          currency: 'USD',
          model: modelName
        }
      },
      falResult: {
        images: result.data.images,
        description: result.data.description
      }
    });

  } catch (error) {
    console.error('❌ 제품 합성 오류:', error);
    const processingTime = Date.now() - startTime;

    return res.status(500).json({
      success: false,
      error: error.message || '제품 합성 중 오류가 발생했습니다.',
      processingTime: processingTime
    });
  }
}

