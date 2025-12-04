import { fal } from "@fal-ai/client";
import { createClient } from '@supabase/supabase-js';
import { getProductById, generateCompositionPrompt, generateLogoReplacementPrompt, getAbsoluteImageUrl } from '../../lib/product-composition';

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
 */
async function saveImageToSupabase(imageUrl, productId, prefix = 'composed') {
  try {
    console.log('💾 이미지 저장 시작:', { imageUrl, productId });
    
    // 이미지 다운로드
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`이미지 다운로드 실패: ${imageResponse.status}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const timestamp = Date.now();
    const fileExtension = imageUrl.split('.').pop()?.split('?')[0] || 'png';
    const fileName = `originals/composed/${new Date().toISOString().split('T')[0]}/${prefix}-${productId}-${timestamp}.${fileExtension}`;
    
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
  // 이미 절대 URL인 경우 그대로 반환
  if (productImageUrl.startsWith('http://') || productImageUrl.startsWith('https://')) {
    // 로컬호스트 URL은 FAL AI에서 접근 불가하므로 에러 발생
    if (productImageUrl.includes('localhost') || productImageUrl.includes('127.0.0.1')) {
      throw new Error(`로컬호스트 URL은 FAL AI에서 사용할 수 없습니다: ${productImageUrl}. 프로덕션 도메인을 사용하거나 Supabase 공개 URL을 사용해주세요.`);
    }
    return productImageUrl;
  }
  
  // 상대 경로인 경우 공개 도메인으로 변환
  // 프로덕션 환경에서는 실제 도메인 사용
  // 로컬 개발 환경에서는 환경 변수가 없으면 null 반환 (제품 이미지 제외)
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
      compositionMethod = 'nano-banana-pro', // 'nano-banana-pro' | 'nano-banana'
      prompt,             // 커스텀 프롬프트 (선택)
      replaceLogo = false, // 로고 교체 옵션
      numImages = 1,      // 생성할 이미지 개수
      resolution = '1K',  // '1K' | '2K' | '4K'
      aspectRatio = 'auto', // 'auto' | '1:1' | '16:9' 등
      outputFormat = 'png'  // 'png' | 'jpeg' | 'webp'
    } = req.body;

    // 필수 파라미터 확인
    if (!modelImageUrl || !productId) {
      return res.status(400).json({ 
        success: false, 
        error: 'modelImageUrl과 productId는 필수입니다.' 
      });
    }

    // 제품 정보 조회
    const product = getProductById(productId);
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

    // 프롬프트 생성 (참조 이미지 사용 여부 확인)
    const hasReferenceImages = product.referenceImages && product.referenceImages.length > 0;
    let compositionPrompt = prompt || generateCompositionPrompt(product, hasReferenceImages);
    
    // 로고 교체 프롬프트 추가
    if (replaceLogo) {
      compositionPrompt += '. ' + generateLogoReplacementPrompt();
      console.log('🔄 로고 교체 프롬프트 추가됨');
    }
    
    console.log('📝 최종 합성 프롬프트:', compositionPrompt);

    // 모델 이미지 URL 검증 (로컬호스트인지 확인)
    if (modelImageUrl.includes('localhost') || modelImageUrl.includes('127.0.0.1')) {
      throw new Error(`모델 이미지 URL이 로컬호스트입니다. FAL AI는 공개적으로 접근 가능한 URL만 사용할 수 있습니다. Supabase 공개 URL을 사용해주세요: ${modelImageUrl}`);
    }
    
    // 이미지 URL 배열 구성
    const imageUrls = [modelImageUrl];
    console.log('📸 모델 이미지 URL:', modelImageUrl);
    
    // 제품 이미지 URL 추가 (제공된 경우)
    if (productImageUrl) {
      try {
        const absoluteProductUrl = getAbsoluteProductImageUrl(productImageUrl);
        if (absoluteProductUrl) {
          imageUrls.push(absoluteProductUrl);
          console.log('✅ 제품 이미지 포함:', absoluteProductUrl);
        } else {
          console.warn('⚠️ 로컬 개발 환경에서는 제품 이미지를 제외합니다. FAL AI는 로컬호스트에 접근할 수 없습니다.');
        }
      } catch (error) {
        console.error('❌ 제품 이미지 URL 변환 실패:', error.message);
        // 로컬 개발 환경에서는 에러를 던지지 않고 경고만
        if (process.env.NODE_ENV === 'production') {
          throw error;
        } else {
          console.warn('⚠️ 로컬 개발 환경에서는 제품 이미지를 제외하고 계속 진행합니다.');
        }
      }
    } else if (product.imageUrl) {
      // 제품 데이터에서 이미지 URL 사용
      try {
        const absoluteProductUrl = getAbsoluteProductImageUrl(product.imageUrl);
        if (absoluteProductUrl) {
          imageUrls.push(absoluteProductUrl);
          console.log('✅ 제품 이미지 포함 (데이터베이스):', absoluteProductUrl);
        } else {
          console.warn('⚠️ 로컬 개발 환경에서는 제품 이미지를 제외합니다.');
        }
      } catch (error) {
        console.error('❌ 제품 이미지 URL 변환 실패:', error.message);
        // 로컬 개발 환경에서는 에러를 던지지 않고 경고만
        if (process.env.NODE_ENV === 'production') {
          throw error;
        } else {
          console.warn('⚠️ 로컬 개발 환경에서는 제품 이미지를 제외하고 계속 진행합니다.');
        }
      }
    }

    // 참조 이미지들 추가 (다양한 각도) - NEW!
    if (product.referenceImages && product.referenceImages.length > 0) {
      console.log(`📐 ${product.referenceImages.length}개의 참조 이미지 발견`);
      for (const refImage of product.referenceImages) {
        try {
          const absoluteRefUrl = getAbsoluteProductImageUrl(refImage);
          if (absoluteRefUrl) {
            imageUrls.push(absoluteRefUrl);
            console.log('✅ 참조 이미지 추가:', absoluteRefUrl);
          } else {
            console.warn(`⚠️ 참조 이미지 URL 변환 실패 (로컬 개발 환경): ${refImage}`);
          }
        } catch (error) {
          console.warn(`⚠️ 참조 이미지 URL 변환 실패: ${refImage}`, error.message);
          // 로컬 개발 환경에서는 에러를 던지지 않고 경고만
          if (process.env.NODE_ENV === 'production') {
            throw error;
          }
        }
      }
      console.log(`✅ 총 ${imageUrls.length - 1}개의 제품 참조 이미지 추가됨 (기본 이미지 + 참조 이미지)`);
    }
    
    // 모든 URL이 공개적으로 접근 가능한지 최종 확인
    for (const url of imageUrls) {
      if (!url.startsWith('https://') || url.includes('localhost') || url.includes('127.0.0.1')) {
        throw new Error(`공개적으로 접근 가능하지 않은 URL이 포함되어 있습니다: ${url}. 모든 이미지 URL은 HTTPS로 시작하는 공개 URL이어야 합니다.`);
      }
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

