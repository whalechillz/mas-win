import { fal } from "@fal-ai/client";
import { createClient } from '@supabase/supabase-js';
import { getProductById, generateCompositionPrompt, generateLogoReplacementPrompt, getAbsoluteImageUrl, generateColorChangePrompt } from '../../lib/product-composition';

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
 * 베이스 이미지의 폴더 경로를 기반으로 저장 위치 결정
 * 블로그 폴더인 경우 같은 폴더에 저장, 아니면 제품별 gallery 폴더에 저장
 */
async function saveImageToSupabase(imageUrl, productId, prefix = 'composed', baseImageUrl = null) {
  try {
    console.log('💾 이미지 저장 시작:', { imageUrl, productId, baseImageUrl });
    
    // 베이스 이미지 URL에서 폴더 경로 추출
    let targetFolder = null;
    if (baseImageUrl) {
      try {
        const match = baseImageUrl.match(/blog-images\/([^?]+)/);
        if (match) {
          const fullPath = decodeURIComponent(match[1]);
          const pathParts = fullPath.split('/');
          if (pathParts.length > 1) {
            const baseFolder = pathParts.slice(0, -1).join('/');
            // 블로그 폴더인 경우 같은 폴더에 저장
            if (baseFolder.startsWith('originals/blog/')) {
              targetFolder = baseFolder;
              console.log('📁 블로그 폴더 감지, 같은 폴더에 저장:', targetFolder);
            }
          }
        }
      } catch (err) {
        console.warn('⚠️ 베이스 이미지 폴더 경로 추출 실패:', err.message);
      }
    }
    
    // 제품 정보 조회 (slug 가져오기)
    let productSlug = productId;
    let category = 'driver';
    
    try {
      const { data: productData, error: productError } = await supabase
        .from('product_composition')
        .select('slug, category')
        .or(`id.eq.${productId},slug.eq.${productId}`)
        .limit(1)
        .maybeSingle();
      
      if (!productError && productData) {
        productSlug = productData.slug;
        category = productData.category;
      }
    } catch (err) {
      console.warn('⚠️ 제품 정보 조회 실패, 기본값 사용:', err.message);
    }
    
    // 이미지 다운로드
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`이미지 다운로드 실패: ${imageResponse.status}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const timestamp = Date.now();
    const fileExtension = imageUrl.split('.').pop()?.split('?')[0] || 'png';
    
    // 저장 폴더 결정
    // 블로그 폴더인 경우 같은 폴더에 저장, 아니면 제품별 gallery 폴더에 저장
    const storageFolder = targetFolder 
      ? targetFolder // 블로그 폴더인 경우 같은 폴더에 저장
      : (category === 'hat' || category === 'accessory' || category === 'goods')
        ? `originals/goods/${productSlug}/gallery`
        : `originals/products/${productSlug}/gallery`;
    
    const fileName = `${storageFolder}/${prefix}-${productId}-${timestamp}.${fileExtension}`;
    
    // Supabase Storage에 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(fileName, imageBuffer, {
        contentType: imageResponse.headers.get('content-type') || `image/${fileExtension}`,
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Supabase 업로드 실패: ${uploadError.message}`);
    }

    // 공개 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(fileName);

    console.log('✅ 이미지 저장 완료:', { fileName, publicUrl });

    return {
      fileName: fileName,
      publicUrl: publicUrl,
      path: fileName,
      originalUrl: imageUrl
    };
  } catch (error) {
    console.error('❌ 이미지 저장 실패:', error);
    throw error;
  }
}

/**
 * 제품 이미지 URL을 절대 URL로 변환
 * FAL AI는 공개적으로 접근 가능한 URL만 사용할 수 있으므로 로컬호스트는 사용 불가
 */
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
      outputFormat = 'png',  // 'png' | 'jpeg' | 'webp'
      compositionBackground = 'natural', // 배경 타입: 'natural' | 'studio' | 'product-page'
      productOnlyMode = false, // 제품컷 전용 모드
      baseImageUrl = null // 베이스 이미지 URL (저장 위치 결정용)
    } = req.body;

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
    let compositionPrompt = prompt || generateCompositionPrompt(
      product, 
      hasReferenceImages,
      targetDriverPart,
      compositionBackground
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
      
      validatedModelImageUrl = modelImageUrl;
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
      
      const mainImageNormalized = normalizeUrl(mainImageUrl);
      
      // 메인 이미지와 중복되지 않는 참조 이미지만 추가
      const uniqueRefImages = product.referenceImages.filter(refImg => {
        if (!refImg) return false;
        const refNormalized = normalizeUrl(refImg);
        return refNormalized !== mainImageNormalized;
      });
      
      if (uniqueRefImages.length > 0) {
        for (const refImage of uniqueRefImages) {
        addImageUrl(refImage, '참조 이미지');
        }
        console.log(`✅ ${uniqueRefImages.length}개의 고유 참조 이미지 추가됨 (중복 ${product.referenceImages.length - uniqueRefImages.length}개 제외)`);
      } else {
        console.log(`⚠️ 참조 이미지가 모두 메인 이미지와 중복되어 제외됨`);
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
    
    console.log(`📋 최종 이미지 URL 목록 (${sanitizedUrls.length}개):`, sanitizedUrls);

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
      result = await fal.subscribe(modelName, {
        input: {
          prompt: compositionPrompt,
          image_urls: sanitizedUrls, // 검증된 URL 배열 사용
          num_images: numImages,
          aspect_ratio: aspectRatio,
          output_format: outputFormat,
          resolution: resolution
        },
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

    // 생성된 이미지들을 Supabase에 저장
    const savedImages = [];
    for (let i = 0; i < result.data.images.length; i++) {
      const image = result.data.images[i];
      try {
        const saved = await saveImageToSupabase(
          image.url, 
          productId, 
          `composed-${i + 1}`,
          baseImageUrl || modelImageUrl // 베이스 이미지 URL 전달 (저장 위치 결정용)
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
        fileName: img.fileName
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
        requestId: result.requestId
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

