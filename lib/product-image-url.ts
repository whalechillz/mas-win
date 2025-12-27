/**
 * 제품 이미지 URL 헬퍼 함수
 * Supabase Storage 경로를 공개 URL로 변환
 */

import { createClient } from '@supabase/supabase-js';

// 클라이언트 사이드에서도 환경 변수 접근 가능하도록 수정
const getSupabaseUrl = () => {
  // 서버 사이드
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  }
  // 클라이언트 사이드 - 환경 변수는 빌드 타임에 주입됨
  return process.env.NEXT_PUBLIC_SUPABASE_URL || '';
};

const SUPABASE_URL = getSupabaseUrl();
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const STORAGE_BUCKET = 'blog-images';

// Supabase 클라이언트 생성 (클라이언트 사이드용)
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

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
      const productSlug = parts[0];
      const fileName = parts[1];
      
      // 파일명으로 타입 추정
      const imageType = fileName.includes('-sole-') || fileName.includes('-500')
        ? 'composition'
        : fileName.includes('gallery-')
        ? 'gallery'
        : 'detail';
      
      storagePath = `originals/products/${productSlug}/${imageType}/${fileName}`;
    }
  }
  
  // originals/products/... 경로는 그대로 사용 (이미 새 형식)
  // Supabase Storage 공개 URL 직접 생성 (클라이언트 사이드에서도 안정적으로 작동)
  if (SUPABASE_URL) {
    const finalPath = storagePath.startsWith('/') ? storagePath.slice(1) : storagePath;
    return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${finalPath}`;
  }
  
  // 환경 변수가 없으면 상대 경로 반환 (개발 환경)
  return `/${storagePath}`;
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
  const storagePath = category === 'hat' || category === 'accessory'
    ? `originals/products/goods/${productSlug}/${imageType}/${fileName}`
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

