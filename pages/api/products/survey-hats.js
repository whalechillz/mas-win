/**
 * Survey 페이지용 모자 제품 API
 * Supabase Storage의 gallery 폴더에서 실시간으로 이미지 조회
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * 특정 폴더의 모든 이미지 파일 조회 (배치 처리)
 * @param {string} folderPath - Storage 폴더 경로
 * @returns {Promise<string[]>} 이미지 URL 배열
 */
async function listGalleryImages(folderPath) {
  try {
    const allImages = [];
    let offset = 0;
    const batchSize = 1000;

    while (true) {
      const { data: files, error } = await supabase.storage
        .from('blog-images')
        .list(folderPath, {
          limit: batchSize,
          offset: offset,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        // 폴더가 없을 수도 있으므로 빈 배열 반환
        if (error.message && error.message.includes('not found')) {
          console.warn(`[survey-hats] ⚠️ 폴더 없음: ${folderPath}`);
          return [];
        }
        throw error;
      }

      if (!files || files.length === 0) {
        break;
      }

      // 이미지 파일만 필터링 (폴더 제외, .keep.png 제외)
      const imageFiles = files
        .filter(file => file.id !== null) // 폴더 제외
        .filter(file => {
          const ext = file.name.toLowerCase();
          return (ext.endsWith('.webp') || ext.endsWith('.png') || 
                  ext.endsWith('.jpg') || ext.endsWith('.jpeg')) &&
                 !file.name.toLowerCase().includes('.keep');
        })
        .map(file => {
          const filePath = `${folderPath}/${file.name}`;
          const { data: { publicUrl } } = supabase.storage
            .from('blog-images')
            .getPublicUrl(filePath);
          return publicUrl;
        });

      allImages.push(...imageFiles);
      offset += batchSize;

      if (files.length < batchSize) {
        break;
      }
    }

    return allImages;
  } catch (error) {
    console.error(`[survey-hats] ❌ 폴더 조회 실패: ${folderPath}`, error.message);
    return [];
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type } = req.query; // 'bucket' or 'golf'

  if (!type || !['bucket', 'golf'].includes(type)) {
    return res.status(400).json({ error: 'Invalid type. Use "bucket" or "golf"' });
  }

  try {
    // ✅ 옵션 2: Supabase Storage의 gallery 폴더에서 실시간 조회
    let folderSlugs = [];
    
    if (type === 'bucket') {
      // 버킷햇: 블랙, 화이트
      folderSlugs = ['bucket-hat-muziik-black', 'bucket-hat-muziik-white'];
    } else {
      // 골프모자: 블랙, 화이트, 네이비, 베이지
      folderSlugs = ['golf-hat-muziik-black', 'golf-hat-muziik-white', 'golf-hat-muziik-navy', 'golf-hat-muziik-beige'];
    }

    console.log(`[survey-hats] ${type} 갤러리 조회 시작:`, folderSlugs);

    // 각 제품의 gallery 폴더에서 실시간으로 이미지 조회
    const allGalleryImages = [];
    const folderResults = [];

    // 병렬 처리로 성능 최적화
    const imagePromises = folderSlugs.map(async (folderSlug) => {
      const galleryPath = `originals/goods/${folderSlug}/gallery`;
      console.log(`[survey-hats] 갤러리 조회 중: ${galleryPath}`);
      
      const images = await listGalleryImages(galleryPath);
      console.log(`[survey-hats] ${galleryPath}: ${images.length}개 이미지 발견`);
      
      return {
        folder: galleryPath,
        slug: folderSlug,
        count: images.length,
        images: images
      };
    });

    const results = await Promise.all(imagePromises);

    // 모든 이미지 합치기
    results.forEach(result => {
      allGalleryImages.push(...result.images);
      folderResults.push({
        folder: result.folder,
        slug: result.slug,
        count: result.count,
        sample_images: result.images.slice(0, 3) // 샘플만 (로깅용)
      });
    });

    // 중복 제거 (같은 URL이 여러 폴더에 있을 수 있음)
    const uniqueImages = [...new Set(allGalleryImages)];

    console.log(`[survey-hats] ${type} 총 이미지: ${uniqueImages.length}개 (중복 제거 전: ${allGalleryImages.length}개)`);

    // 제품 정보 조회 (로깅용, 선택사항)
    let products = [];
    try {
      const skus = type === 'bucket'
        ? ['BUCKET_HAT_MUZIIK_BLACK', 'BUCKET_HAT_MUZIIK_WHITE']
        : ['GOLF_HAT_MUZIIK_BLACK', 'GOLF_HAT_MUZIIK_WHITE', 'GOLF_HAT_MUZIIK_NAVY', 'GOLF_HAT_MUZIIK_BEIGE'];
      
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, slug, sku')
        .in('sku', skus)
        .eq('is_active', true);
      
      products = productsData || [];
      console.log(`[survey-hats] ${type} 제품 정보 조회:`, products.length, '개');
    } catch (productError) {
      console.warn(`[survey-hats] 제품 정보 조회 실패 (무시):`, productError.message);
    }

    return res.status(200).json({
      success: true,
      product: {
        name: type === 'bucket' ? 'MASSGOO X MUZIIK 버킷햇' : 'MASSGOO X MUZIIK 골프모자',
        gallery_images: uniqueImages,
        folder_results: folderResults, // 디버깅용
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          sku: p.sku
        }))
      }
    });
  } catch (error) {
    console.error('[survey-hats] ❌ Survey 제품 API 오류:', error);
    return res.status(500).json({
      success: false,
      error: error.message || '제품 조회에 실패했습니다.'
    });
  }
}

