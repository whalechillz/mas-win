/**
 * 제품 이미지 URL 헬퍼 함수
 * Supabase Storage 경로를 공개 URL로 변환
 */

import { createClient } from '@supabase/supabase-js';

// 클라이언트 사이드에서도 환경 변수 접근 가능하도록 수정
const getSupabaseUrl = () => {
  // 환경 변수에서 가져오기 (서버/클라이언트 모두)
  // 클라이언트 사이드에서는 빌드 타임에 주입되지만, 런타임에도 접근 가능
  const envUrl = typeof window !== 'undefined' 
    ? (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_SUPABASE_URL 
      || process.env.NEXT_PUBLIC_SUPABASE_URL
    : process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (envUrl) return envUrl;
  
  // 환경 변수가 없으면 하드코딩된 URL 사용 (프로덕션)
  return 'https://yyytjudftvpmcnppaymw.supabase.co';
};

const SUPABASE_URL = getSupabaseUrl();
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const STORAGE_BUCKET = 'blog-images';

// Supabase 클라이언트 생성 (클라이언트 사이드용)
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

/**
 * 파일명에서 goods 제품의 slug 추출
 * @param fileName - 파일명 (예: white-bucket-hat.webp)
 * @returns 제품 slug 또는 null
 */
function extractGoodsProductSlug(fileName: string): string | null {
  const lowerName = fileName.toLowerCase();
  
  // 버킷햇 패턴
  if (lowerName.includes('bucket-hat-muziik') || lowerName.includes('bucket-hat')) {
    return 'bucket-hat-muziik';
  }
  
  // 골프모자 패턴
  if (lowerName.includes('golf-hat-muziik') || lowerName.includes('golf-cap') || lowerName.includes('golf-hat')) {
    return 'golf-hat-muziik';
  }
  
  // 클러치백 패턴
  if (lowerName.includes('clutch')) {
    if (lowerName.includes('beige') || lowerName.includes('베이지')) {
      return 'massgoo-muziik-clutch-beige';
    }
    if (lowerName.includes('gray') || lowerName.includes('grey') || lowerName.includes('그레이')) {
      return 'massgoo-muziik-clutch-gray';
    }
    return 'massgoo-muziik-clutch-beige'; // 기본값
  }
  
  // 마쓰구 캡 패턴
  if (lowerName.includes('massgoo-white-cap') || lowerName.includes('massgoo-white')) {
    return 'massgoo-white-cap';
  }
  if (lowerName.includes('massgoo-black-cap') || lowerName.includes('massgoo-black')) {
    return 'massgoo-black-cap';
  }
  
  // MAS 한정판 모자
  if (lowerName.includes('mas-limited-cap')) {
    if (lowerName.includes('gray') || lowerName.includes('grey')) {
      return 'mas-limited-cap-gray';
    }
    if (lowerName.includes('black')) {
      return 'mas-limited-cap-black';
    }
  }
  
  return null;
}

/**
 * 상대 경로를 Supabase Storage 공개 URL로 변환
 * @param imagePath - 상대 경로 (예: /originals/products/black-beryl/detail/image.webp)
 * @returns Supabase Storage 공개 URL
 */
export function getProductImageUrl(imagePath: string): string {
  if (!imagePath) return '';
  
  // 이미 절대 URL인 경우 그대로 반환
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // 상대 경로 처리
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  
  // 기존 경로 (/main/products/...)를 새 경로로 변환
  let storagePath = cleanPath;
  
  // 기존 경로를 새 경로로 변환
  if (cleanPath.startsWith('main/products/')) {
    const oldPath = cleanPath.replace('main/products/', '');
    const parts = oldPath.split('/');
    
    if (parts.length >= 2) {
      const firstPart = parts[0];
      const fileName = parts[1];
      
      // /main/products/goods/... 경로 처리
      if (firstPart === 'goods') {
        // 파일명에서 product-slug 추출
        const productSlug = extractGoodsProductSlug(fileName);
        
        if (productSlug) {
          // 파일명으로 타입 추정 (goods는 대부분 gallery)
          const imageType = fileName.includes('-sole-') || fileName.includes('-500')
            ? 'composition'
            : fileName.includes('gallery-')
            ? 'gallery'
            : 'gallery'; // goods는 기본적으로 gallery
          
          storagePath = `originals/goods/${productSlug}/${imageType}/${fileName}`;
        } else {
          // 추출 실패 시 기본 경로 사용 (fallback)
          storagePath = `originals/goods/${fileName}`;
        }
      } else {
        // 드라이버 제품 경로 처리 (기존 로직)
        const productSlug = firstPart;
        
        // 파일명으로 타입 추정
        const imageType = fileName.includes('-sole-') || fileName.includes('-500')
          ? 'composition'
          : fileName.includes('gallery-')
          ? 'gallery'
          : 'detail';
        
        storagePath = `originals/products/${productSlug}/${imageType}/${fileName}`;
      }
    } else if (parts.length === 1 && oldPath.startsWith('goods/')) {
      // /main/products/goods/filename.webp 형식 (2단계 경로)
      const fileName = oldPath.replace('goods/', '');
      const productSlug = extractGoodsProductSlug(fileName);
      
      if (productSlug) {
        const imageType = 'gallery'; // goods는 기본적으로 gallery
        storagePath = `originals/goods/${productSlug}/${imageType}/${fileName}`;
      } else {
        storagePath = `originals/goods/${fileName}`;
      }
    }
  }
  
  // originals/products/... 경로는 그대로 사용 (이미 새 형식)
  // Supabase Storage 공개 URL 직접 생성 (클라이언트 사이드에서도 안정적으로 작동)
  // 항상 하드코딩된 URL 사용 (확실하게 작동)
  const SUPABASE_BASE_URL = 'https://yyytjudftvpmcnppaymw.supabase.co';
  const finalPath = storagePath.startsWith('/') ? storagePath.slice(1) : storagePath;
  
  // 항상 절대 URL 반환
  return `${SUPABASE_BASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${finalPath}`;
}

/**
 * 제품 slug와 파일명으로 이미지 URL 생성
 * @param productSlug - 제품 slug (예: black-beryl)
 * @param fileName - 파일명 (예: image.webp)
 * @param imageType - 이미지 타입 (detail, composition, gallery)
 * @param category - 제품 카테고리 (driver, hat, accessory)
 */
export function buildProductImageUrl(
  productSlug: string,
  fileName: string,
  imageType: 'detail' | 'composition' | 'gallery' = 'detail',
  category: 'driver' | 'hat' | 'accessory' = 'driver'
): string {
  const storagePath = category === 'hat' || category === 'accessory' || category === 'goods'
    ? `originals/goods/${productSlug}/${imageType}/${fileName}`
    : `originals/products/${productSlug}/${imageType}/${fileName}`;
  
  return getSupabasePublicUrl(storagePath);
}

/**
 * Supabase Storage 경로를 공개 URL로 변환
 * @param storagePath - Storage 경로 (예: originals/products/black-beryl/detail/image.webp)
 * @returns Supabase Storage 공개 URL
 */
export function getSupabasePublicUrl(storagePath: string): string {
  if (!storagePath) return '';
  
  // 이미 절대 URL인 경우 그대로 반환
  if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
    return storagePath;
  }
  
  // Supabase 클라이언트가 있으면 사용
  if (supabase) {
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
    return data.publicUrl;
  }
  
  // 클라이언트가 없으면 직접 URL 생성
  if (SUPABASE_URL) {
    const cleanPath = storagePath.startsWith('/') ? storagePath.slice(1) : storagePath;
    return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${cleanPath}`;
  }
  
  // 환경 변수도 없으면 상대 경로 반환
  return `/${storagePath}`;
}

