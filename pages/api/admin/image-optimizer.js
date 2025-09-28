// 이미지 자동 최적화 API - 용도별 최적 크기 선택
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { imageId, usageType, deviceType = 'desktop' } = req.body;

    if (!imageId) {
      return res.status(400).json({ error: '이미지 ID가 필요합니다.' });
    }

    console.log('🎯 이미지 최적화 요청:', { imageId, usageType, deviceType });

    // 이미지 정보 조회
    const { data: imageAsset, error: fetchError } = await supabase
      .from('image_assets')
      .select('*')
      .eq('id', imageId)
      .single();

    if (fetchError || !imageAsset) {
      return res.status(404).json({ error: '이미지를 찾을 수 없습니다.' });
    }

    // 용도별 최적 이미지 선택
    const optimizedImage = selectOptimalImage(imageAsset, usageType, deviceType);

    // 사용 통계 업데이트
    await updateUsageStats(imageId, usageType, deviceType);

    console.log('✅ 이미지 최적화 완료:', optimizedImage);

    return res.status(200).json({
      success: true,
      optimizedImage,
      originalImage: {
        url: imageAsset.cdn_url,
        size: imageAsset.file_size,
        format: imageAsset.format
      },
      optimization: {
        usageType,
        deviceType,
        selectedSize: optimizedImage.type,
        sizeReduction: calculateSizeReduction(imageAsset.file_size, optimizedImage.size)
      }
    });

  } catch (error) {
    console.error('❌ 이미지 최적화 오류:', error);
    return res.status(500).json({
      error: '이미지 최적화에 실패했습니다',
      details: error.message
    });
  }
}

// 용도별 최적 이미지 선택
function selectOptimalImage(imageAsset, usageType, deviceType) {
  const options = {
    // 썸네일 옵션
    thumbnail: {
      url: imageAsset.thumbnail_url || imageAsset.cdn_url,
      size: imageAsset.thumbnail_size || imageAsset.file_size,
      type: 'thumbnail',
      format: 'jpeg'
    },
    // 중간 크기 옵션
    medium: {
      url: imageAsset.medium_url || imageAsset.cdn_url,
      size: imageAsset.medium_size || imageAsset.file_size,
      type: 'medium',
      format: 'jpeg'
    },
    // WebP 옵션
    webp: {
      url: imageAsset.webp_url || imageAsset.cdn_url,
      size: imageAsset.webp_size || imageAsset.file_size,
      type: 'webp',
      format: 'webp'
    },
    // WebP 썸네일 옵션
    webpThumbnail: {
      url: imageAsset.webp_thumbnail_url || imageAsset.cdn_url,
      size: imageAsset.webp_thumbnail_size || imageAsset.file_size,
      type: 'webp_thumbnail',
      format: 'webp'
    },
    // 원본 옵션
    original: {
      url: imageAsset.cdn_url,
      size: imageAsset.file_size,
      type: 'original',
      format: imageAsset.format || 'jpeg'
    }
  };

  // 용도별 최적화 규칙
  const optimizationRules = {
    // 블로그 썸네일
    'blog_thumbnail': deviceType === 'mobile' ? 'webpThumbnail' : 'thumbnail',
    
    // 블로그 본문 이미지
    'blog_content': deviceType === 'mobile' ? 'medium' : 'webp',
    
    // 갤러리 썸네일
    'gallery_thumbnail': 'webpThumbnail',
    
    // 갤러리 원본
    'gallery_original': 'webp',
    
    // 소셜 미디어 공유
    'social_share': 'medium',
    
    // 검색 결과 썸네일
    'search_thumbnail': 'thumbnail',
    
    // 대시보드 미리보기
    'dashboard_preview': 'webpThumbnail',
    
    // 인쇄용
    'print': 'original',
    
    // 기본값
    'default': deviceType === 'mobile' ? 'webpThumbnail' : 'webp'
  };

  const selectedType = optimizationRules[usageType] || optimizationRules['default'];
  const selectedImage = options[selectedType] || options['original'];

  // WebP 지원 여부 확인 (브라우저별)
  if (selectedImage.format === 'webp' && !supportsWebP(deviceType)) {
    // WebP를 지원하지 않는 경우 JPEG 버전으로 대체
    if (selectedType === 'webp') {
      return options['medium'];
    } else if (selectedType === 'webpThumbnail') {
      return options['thumbnail'];
    }
  }

  return selectedImage;
}

// WebP 지원 여부 확인
function supportsWebP(deviceType) {
  // 모바일은 대부분 WebP 지원
  if (deviceType === 'mobile') return true;
  
  // 데스크톱은 최신 브라우저에서 지원
  // 실제로는 클라이언트에서 확인해야 하지만, 여기서는 기본적으로 지원한다고 가정
  return true;
}

// 크기 감소율 계산
function calculateSizeReduction(originalSize, optimizedSize) {
  if (!originalSize || !optimizedSize) return 0;
  return Math.round(((originalSize - optimizedSize) / originalSize) * 100);
}

// 사용 통계 업데이트
async function updateUsageStats(imageId, usageType, deviceType) {
  try {
    await supabase
      .from('image_usage_logs')
      .insert({
        image_id: imageId,
        usage_type: usageType,
        device_type: deviceType,
        used_at: new Date().toISOString()
      });
  } catch (error) {
    console.log('⚠️ 사용 통계 업데이트 실패:', error.message);
  }
}
