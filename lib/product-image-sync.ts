/**
 * 갤러리 이미지와 제품 이미지 배열 동기화
 * 갤러리에서 이미지를 추가/삭제할 때 제품의 detail_images, composition_images, gallery_images를 자동으로 업데이트
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export interface ParsedImagePath {
  productSlug: string;
  imageType: 'detail' | 'composition' | 'gallery';
  fileName: string;
  fullPath: string;
}

/**
 * 이미지 경로에서 제품 정보 추출
 * @param imagePath - 이미지 경로 (예: originals/products/black-weapon/detail/image.webp)
 * @returns 파싱된 정보 또는 null
 */
export function parseProductImagePath(imagePath: string): ParsedImagePath | null {
  if (!imagePath) return null;
  
  // originals/products/{slug}/{type}/{filename} 형식 파싱
  const match = imagePath.match(/originals\/products\/([^\/]+)\/(detail|composition|gallery)\/(.+)$/);
  
  if (!match) return null;
  
  return {
    productSlug: match[1],
    imageType: match[2] as 'detail' | 'composition' | 'gallery',
    fileName: match[3],
    fullPath: imagePath
  };
}

/**
 * 이미지를 제품의 이미지 배열에 추가
 * @param imagePath - 이미지 경로
 */
export async function addImageToProduct(imagePath: string): Promise<boolean> {
  if (!supabase) {
    console.warn('⚠️ Supabase 클라이언트가 초기화되지 않았습니다.');
    return false;
  }
  
  const parsed = parseProductImagePath(imagePath);
  if (!parsed) {
    // 제품 이미지 경로가 아니면 무시
    return false;
  }
  
  const { productSlug, imageType, fullPath } = parsed;
  const fieldName = `${imageType}_images`; // detail_images, composition_images, gallery_images
  
  try {
    // 제품 조회
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select(`id, ${fieldName}, name`)
      .eq('slug', productSlug)
      .maybeSingle();
    
    if (fetchError) {
      console.error(`❌ 제품 조회 오류 (${productSlug}):`, fetchError);
      return false;
    }
    
    if (!product) {
      console.warn(`⚠️ 제품을 찾을 수 없음: ${productSlug}`);
      return false;
    }
    
    const currentImages = Array.isArray(product[fieldName]) 
      ? product[fieldName] 
      : (product[fieldName] ? JSON.parse(product[fieldName]) : []);
    
    // 중복 체크
    if (currentImages.includes(fullPath)) {
      console.log(`ℹ️ 이미지가 이미 존재함: ${fullPath}`);
      return true; // 이미 존재하므로 성공으로 처리
    }
    
    // 이미지 배열에 추가
    const updatedImages = [...currentImages, fullPath];
    
    const { error: updateError } = await supabase
      .from('products')
      .update({ 
        [fieldName]: updatedImages,
        updated_at: new Date().toISOString()
      })
      .eq('id', product.id);
    
    if (updateError) {
      console.error(`❌ 제품 이미지 추가 오류 (${productSlug}):`, updateError);
      return false;
    }
    
    console.log(`✅ 제품 이미지 추가 완료: ${product.name} (${fieldName})`);
    return true;
  } catch (error) {
    console.error(`❌ 이미지 추가 중 오류:`, error);
    return false;
  }
}

/**
 * 이미지를 제품의 이미지 배열에서 제거
 * @param imagePath - 이미지 경로
 */
export async function removeImageFromProduct(imagePath: string): Promise<boolean> {
  if (!supabase) {
    console.warn('⚠️ Supabase 클라이언트가 초기화되지 않았습니다.');
    return false;
  }
  
  const parsed = parseProductImagePath(imagePath);
  if (!parsed) {
    // 제품 이미지 경로가 아니면 무시
    return false;
  }
  
  const { productSlug, imageType, fullPath } = parsed;
  const fieldName = `${imageType}_images`;
  
  try {
    // 제품 조회
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select(`id, ${fieldName}, name`)
      .eq('slug', productSlug)
      .maybeSingle();
    
    if (fetchError) {
      console.error(`❌ 제품 조회 오류 (${productSlug}):`, fetchError);
      return false;
    }
    
    if (!product) {
      console.warn(`⚠️ 제품을 찾을 수 없음: ${productSlug}`);
      return false;
    }
    
    const currentImages = Array.isArray(product[fieldName]) 
      ? product[fieldName] 
      : (product[fieldName] ? JSON.parse(product[fieldName]) : []);
    
    // 이미지가 없으면 무시
    if (!currentImages.includes(fullPath)) {
      console.log(`ℹ️ 이미지가 존재하지 않음: ${fullPath}`);
      return true; // 이미 없으므로 성공으로 처리
    }
    
    // 이미지 배열에서 제거
    const updatedImages = currentImages.filter((img: string) => img !== fullPath);
    
    const { error: updateError } = await supabase
      .from('products')
      .update({ 
        [fieldName]: updatedImages,
        updated_at: new Date().toISOString()
      })
      .eq('id', product.id);
    
    if (updateError) {
      console.error(`❌ 제품 이미지 제거 오류 (${productSlug}):`, updateError);
      return false;
    }
    
    console.log(`✅ 제품 이미지 제거 완료: ${product.name} (${fieldName})`);
    return true;
  } catch (error) {
    console.error(`❌ 이미지 제거 중 오류:`, error);
    return false;
  }
}

/**
 * 여러 이미지를 한 번에 제품에서 제거 (일괄 삭제용)
 * @param imagePaths - 이미지 경로 배열
 */
export async function removeImagesFromProducts(imagePaths: string[]): Promise<{
  success: number;
  failed: number;
  skipped: number;
}> {
  const results = {
    success: 0,
    failed: 0,
    skipped: 0
  };
  
  for (const imagePath of imagePaths) {
    const parsed = parseProductImagePath(imagePath);
    if (!parsed) {
      results.skipped++;
      continue;
    }
    
    const success = await removeImageFromProduct(imagePath);
    if (success) {
      results.success++;
    } else {
      results.failed++;
    }
  }
  
  return results;
}

