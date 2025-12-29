import { fal } from "@fal-ai/client";
import { createClient } from '@supabase/supabase-js';
import { getProductById, generateCompositionPrompt, generateLogoReplacementPrompt, getAbsoluteImageUrl, generateColorChangePrompt } from '../../lib/product-composition';

// API 타임아웃 설정 (5분)
export const config = {
  maxDuration: 300, // 5분 (초 단위)
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
 * 제품별 gallery 폴더에 저장
 */
async function saveImageToSupabase(imageUrl, productId, prefix = 'composed') {
  try {
    console.log('💾 이미지 저장 시작:', { imageUrl, productId });
    
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
    
    // 제품별 gallery 폴더에 저장
    // 굿즈/액세서리: originals/goods/{slug}/gallery
    // 드라이버 제품: originals/products/{slug}/gallery
    const storageFolder = category === 'hat' || category === 'accessory' || category === 'goods'
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
  if (!productImageUrl) return null;
  
  // 이미 절대 URL인 경우 그대로 반환
  if (productImageUrl.startsWith('http://') || productImageUrl.startsWith('https://')) {
    // 로컬호스트 URL은 FAL AI에서 접근 불가하므로 에러 발생
    if (productImageUrl.includes('localhost') || productImageUrl.includes('127.0.0.1')) {
      throw new Error(`로컬호스트 URL은 FAL AI에서 사용할 수 없습니다: ${productImageUrl}. 프로덕션 도메인을 사용하거나 Supabase 공개 URL을 사용해주세요.`);
    }
    return productImageUrl;
  }
  
  // 상대 경로인 경우
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
  
  if (!baseUrl) {
    // 로컬 개발 환경에서는 제품 이미지를 제외하고 계속 진행
    if (process.env.NODE_ENV === 'development') {
      return null; // null 반환하여 제품 이미지 제외
    }
    throw new Error(`제품 이미지 URL을 공개 URL로 변환할 수 없습니다. NEXT_PUBLIC_SITE_URL 또는 VERCEL_URL 환경 변수를 설정해주세요. 상대 경로: ${productImageUrl}`);
  }
  
  return `${baseUrl}${productImageUrl}`;
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
      productOnlyMode = false // 제품컷 전용 모드
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
        
        // 색상 변경이 요청된 경우 color_variants에서 해당 색상 이미지 사용
        let productImageUrl = convertPngToWebp(supabaseProduct.image_url);
        if (changeProductColor && productColor && supabaseProduct.color_variants) {
          const colorVariants = supabaseProduct.color_variants;
          const colorVariantImage = colorVariants[productColor] || colorVariants[productColor.toLowerCase()];
          if (colorVariantImage) {
            productImageUrl = convertPngToWebp(colorVariantImage);
            console.log(`🎨 색상 변형 이미지 사용: ${productColor} → ${productImageUrl}`);
          } else {
            console.warn(`⚠️ 색상 변형 이미지 없음: ${productColor}, 기본 이미지 사용`);
          }
        }
        
        // color_variants 객체의 모든 값 변환
        const convertedColorVariants = {};
        if (supabaseProduct.color_variants) {
          for (const [key, value] of Object.entries(supabaseProduct.color_variants)) {
            convertedColorVariants[key] = convertPngToWebp(value);
          }
        }
        
        // reference_images 배열 변환
        const convertedReferenceImages = (supabaseProduct.reference_images || []).map(img => convertPngToWebp(img));
        
        // Supabase 데이터를 ProductForComposition 형식으로 변환
        product = {
          id: supabaseProduct.id,
          name: supabaseProduct.name,
          displayName: supabaseProduct.display_name || supabaseProduct.name,
          category: supabaseProduct.category,
          compositionTarget: supabaseProduct.composition_target,
          imageUrl: productImageUrl, // 색상 변형 이미지 또는 기본 이미지 (.png → .webp 변환됨)
          referenceImages: convertedReferenceImages, // .png → .webp 변환됨
          driverParts: supabaseProduct.driver_parts || undefined,
          hatType: supabaseProduct.hat_type,
          slug: supabaseProduct.slug,
          badge: supabaseProduct.badge,
          description: supabaseProduct.description,
          price: supabaseProduct.price,
          features: supabaseProduct.features || [],
          colorVariants: convertedColorVariants, // .png → .webp 변환됨
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
    
    // 색상 변경 처리: color_variants가 있으면 이미지 사용, 없으면 프롬프트 사용
    if (changeProductColor && productColor) {
      // color_variants에서 색상별 이미지가 있는 경우 프롬프트 없이 이미지만 사용
      if (product.colorVariants && product.colorVariants[productColor]) {
        console.log(`🎨 색상 변형 이미지 사용 (프롬프트 불필요): ${productColor}`);
        // 이미 product.imageUrl이 색상 변형 이미지로 설정되어 있음
      } else {
        // color_variants가 없으면 프롬프트로 색상 변경 시도
        const colorChangePrompt = generateColorChangePrompt(
          product,
          productColor,
          targetCompositionTarget
        );
        compositionPrompt = `${compositionPrompt}. ${colorChangePrompt}`;
        console.log('🎨 색상 변경 프롬프트 추가 (color_variants 없음):', productColor);
      }
    }
    
    // 로고 교체 프롬프트 추가
    if (replaceLogo) {
      compositionPrompt += '. ' + generateLogoReplacementPrompt();
      console.log('🔄 로고 교체 프롬프트 추가됨');
    }
    
    console.log('📝 최종 합성 프롬프트:', compositionPrompt);

    // 모델 이미지 URL 검증 (로컬호스트인지 확인) - URL이 있을 때만 체크
    if (modelImageUrl && (modelImageUrl.includes('localhost') || modelImageUrl.includes('127.0.0.1'))) {
      throw new Error(`모델 이미지 URL이 로컬호스트입니다. FAL AI는 공개적으로 접근 가능한 URL만 사용할 수 있습니다. Supabase 공개 URL을 사용해주세요: ${modelImageUrl}`);
    }
    
    // 이미지 URL 배열 구성
    const imageUrls = [];
    if (!productOnlyMode && modelImageUrl) {
      imageUrls.push(modelImageUrl);
      console.log('📸 모델 이미지 URL:', modelImageUrl);
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
    for (const url of sanitizedUrls) {
      if (!url.startsWith('https://') || url.includes('localhost') || url.includes('127.0.0.1')) {
        throw new Error(`공개적으로 접근 가능하지 않은 URL이 포함되어 있습니다: ${url}. 모든 이미지 URL은 HTTPS로 시작하는 공개 URL이어야 합니다.`);
      }
    }
    if (productOnlyMode && sanitizedUrls.length === 0) {
      throw new Error('제품컷 모드에서는 제품/참조 이미지가 최소 1개 이상 필요합니다.');
    }

    // 나노바나나 API 호출
    const modelName = compositionMethod === 'nano-banana' 
      ? 'fal-ai/nano-banana/edit' 
      : 'fal-ai/nano-banana-pro/edit';

    console.log(`🚀 FAL AI API 호출: ${modelName}`);

    const result = await fal.subscribe(modelName, {
      input: {
        prompt: compositionPrompt,
        image_urls: imageUrls,
        num_images: numImages,
        aspect_ratio: aspectRatio,
        output_format: outputFormat,
        resolution: resolution
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs?.map((log) => log.message).forEach((msg) => {
            console.log('📊 FAL AI 로그:', msg);
          });
        }
      },
    });

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
          `composed-${i + 1}`
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

