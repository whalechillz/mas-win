/**
 * 표준화된 파일명 생성 유틸리티
 * 계획서: docs/filename-generation-standardization-plan.md
 */

import { createClient } from '@supabase/supabase-js';
import { translateKoreanToEnglish } from './korean-to-english-translator';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export interface FilenameOptions {
  location: 'daily-kakao' | 'goods' | 'products' | 'blog' | 'uploaded' | 'ai-generated' | 'customers';
  productName?: string; // 제품 slug 또는 고객 이름
  compositionProgram: 'nanobanana' | 'fal' | 'replicate' | 'none';
  compositionFunction: 'tone' | 'background' | 'object' | 'composed' | 'variation' | 'upload' | 'none';
  creationDate?: Date; // 없으면 현재 날짜
  uniqueNumber?: number; // 없으면 자동 생성
  extension: string; // 'webp', 'jpg', 'png' 등
}

export interface StoragePathOptions extends FilenameOptions {
  // 카카오 콘텐츠의 경우
  kakaoDate?: string; // YYYY-MM-DD
  kakaoAccount?: 'account1' | 'account2';
  kakaoType?: 'feed' | 'profile' | 'background';
  // 제품/굿즈 갤러리의 경우
  productSlug?: string;
  // 블로그 이미지의 경우
  blogId?: number;
  // 고객 이미지의 경우
  customerNameEn?: string; // 영문이름-전화번호마지막4자리
  visitDate?: string; // YYYY-MM-DD
  // FAL/Replicate 저장 위치 결정
  originalImageUrl?: string; // 원본 이미지 URL (저장 위치 결정용)
}

/**
 * 표준 파일명 생성 (하이픈으로 연결)
 */
export async function generateStandardFileName(
  options: FilenameOptions
): Promise<string> {
  const {
    location,
    productName = 'none',
    compositionProgram,
    compositionFunction,
    creationDate = new Date(),
    uniqueNumber,
    extension
  } = options;

  // 생성일 포맷팅 (YYYYMMDD)
  const dateStr = creationDate.toISOString().slice(0, 10).replace(/-/g, '');

  // 고유번호 자동 생성 (없는 경우)
  let finalUniqueNumber = uniqueNumber;
  if (!finalUniqueNumber) {
    finalUniqueNumber = await getNextUniqueNumber(
      location,
      productName,
      compositionProgram,
      compositionFunction,
      dateStr
    );
  }

  // 고유번호 2자리 포맷팅
  const uniqueNumberStr = String(finalUniqueNumber).padStart(2, '0');

  // 파일명 조합 (하이픈으로 연결)
  const fileName = `${location}-${productName}-${compositionProgram}-${compositionFunction}-${dateStr}-${uniqueNumberStr}.${extension}`;

  return fileName;
}

/**
 * 블로그 이미지 파일명 생성
 */
export async function generateBlogFileName(
  blogId: number,
  originalFileName: string,
  creationDate?: Date,
  uniqueNumber?: number
): Promise<string> {
  const date = creationDate || new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  
  // 원본 파일명 영문 추출
  const nameWithoutExt = originalFileName.replace(/\.[^/.]+$/, '');
  const extension = originalFileName.split('.').pop()?.toLowerCase() || 'webp';
  
  // 한글 제거 및 영문 변환
  const englishName = translateKoreanToEnglish(nameWithoutExt)
    .toLowerCase()
    .replace(/[가-힣\s]/g, '') // 한글과 공백 제거
    .replace(/[^a-z0-9]/g, '-') // 특수문자를 하이픈으로
    .replace(/-+/g, '-') // 연속된 하이픈을 하나로
    .replace(/^-|-$/g, '') // 앞뒤 하이픈 제거
    || 'image';
  
  // 고유번호 자동 생성 (없는 경우)
  let finalUniqueNumber = uniqueNumber;
  if (!finalUniqueNumber) {
    finalUniqueNumber = await getNextBlogUniqueNumber(blogId, dateStr);
  }
  
  // 고유번호 2자리 포맷팅
  const uniqueNumberStr = String(finalUniqueNumber).padStart(2, '0');
  
  // 파일명 조합
  const fileName = `blog-${blogId}-${dateStr}-${englishName}-${uniqueNumberStr}.${extension}`;
  
  return fileName;
}

/**
 * 저장 경로 생성
 */
export async function generateStoragePath(
  options: StoragePathOptions
): Promise<string> {
  const fileName = await generateStandardFileName(options);
  
  const {
    location,
    productName = 'none',
    compositionProgram,
    compositionFunction,
    creationDate = new Date(),
    kakaoDate,
    kakaoAccount,
    kakaoType,
    productSlug,
    originalImageUrl
  } = options;

  // 생성일 포맷팅
  const dateStr = creationDate.toISOString().slice(0, 10).replace(/-/g, '');
  const dateStrWithDash = creationDate.toISOString().slice(0, 10); // YYYY-MM-DD

  let storagePath = '';

  // 1. 카카오 콘텐츠
  if (location === 'daily-kakao' && kakaoDate && kakaoAccount && kakaoType) {
    storagePath = `originals/daily-branding/kakao/${kakaoDate}/${kakaoAccount}/${kakaoType}/${fileName}`;
  }
  // 2. 제품 갤러리
  else if (location === 'products' && productSlug) {
    storagePath = `originals/products/${productSlug}/gallery/${fileName}`;
  }
  // 3. 굿즈 갤러리
  else if (location === 'goods' && productSlug) {
    storagePath = `originals/goods/${productSlug}/gallery/${fileName}`;
  }
  // 4. 블로그 이미지
  else if (location === 'blog' && options.blogId) {
    const yearMonth = dateStrWithDash.slice(0, 7); // YYYY-MM
    storagePath = `originals/blog/${yearMonth}/${options.blogId}/${fileName}`;
  }
  // 5. 고객 이미지 (기존 규칙 유지)
  else if (location === 'customers' && options.customerNameEn && options.visitDate) {
    storagePath = `originals/customers/${options.customerNameEn}/${options.visitDate}/${fileName}`;
  }
  // 6. AI 생성 이미지 (현재 폴더 위치 없을 때 - FAL, Replicate)
  else if (location === 'ai-generated') {
    storagePath = `originals/ai-generated/${dateStrWithDash}/${fileName}`;
  }
  // 7. 일반 업로드
  else {
    const yearMonth = dateStrWithDash.slice(0, 7); // YYYY-MM
    storagePath = `originals/uploaded/${yearMonth}/${dateStrWithDash}/${fileName}`;
  }

  return storagePath;
}

/**
 * FAL/Replicate 저장 위치 결정
 */
export async function determineStorageLocationForAI(
  originalImageUrl: string,
  compositionProgram: 'fal' | 'replicate'
): Promise<{ location: string; folderPath: string | null; productSlug?: string; productName?: string }> {
  if (!supabase) {
    // Supabase가 없으면 기본값 반환
    const dateStr = new Date().toISOString().slice(0, 10);
    return {
      location: 'ai-generated',
      folderPath: `originals/ai-generated/${dateStr}`
    };
  }

  try {
    // 원본 이미지의 메타데이터 조회
    const { data: metadata } = await supabase
      .from('image_assets')
      .select('file_path, ai_tags')
      .eq('cdn_url', originalImageUrl)
      .maybeSingle();
    
    if (metadata && metadata.file_path) {
      // 현재 폴더 위치가 있으면 원본과 동일한 폴더 사용
      const folderPath = metadata.file_path.substring(0, metadata.file_path.lastIndexOf('/'));
      
      // 제품 정보 추출 시도
      let productSlug: string | undefined;
      let productName: string | undefined;
      
      // file_path에서 제품 slug 추출
      const productMatch = metadata.file_path.match(/products\/([^/]+)\/gallery/);
      const goodsMatch = metadata.file_path.match(/goods\/([^/]+)\/gallery/);
      
      if (productMatch) {
        productSlug = productMatch[1];
        productName = productSlug;
      } else if (goodsMatch) {
        productSlug = goodsMatch[1];
        productName = productSlug;
      }
      
      // ai_tags에서 제품 정보 추출 시도
      if (!productName && metadata.ai_tags && Array.isArray(metadata.ai_tags)) {
        const productTag = metadata.ai_tags.find((tag: string) => tag.startsWith('product-'));
        if (productTag) {
          productName = productTag.replace('product-', '');
        }
      }
      
      return {
        location: 'current-folder',
        folderPath: folderPath,
        productSlug,
        productName
      };
    } else {
      // 현재 폴더 위치가 없으면 ai-generated 폴더 사용
      const dateStr = new Date().toISOString().slice(0, 10);
      return {
        location: 'ai-generated',
        folderPath: `originals/ai-generated/${dateStr}`
      };
    }
  } catch (error) {
    console.warn('⚠️ 저장 위치 결정 실패, 기본값 사용:', error);
    const dateStr = new Date().toISOString().slice(0, 10);
    return {
      location: 'ai-generated',
      folderPath: `originals/ai-generated/${dateStr}`
    };
  }
}

/**
 * 블로그 고유번호 자동 생성
 */
async function getNextBlogUniqueNumber(
  blogId: number,
  creationDate: string
): Promise<number> {
  if (!supabase) return 1;

  try {
    const yearMonth = `${creationDate.slice(0, 4)}-${creationDate.slice(4, 6)}`;
    const folderPath = `originals/blog/${yearMonth}/${blogId}`;
    
    // 해당 폴더의 파일 목록 조회
    const { data: files, error } = await supabase.storage
      .from('blog-images')
      .list(folderPath, {
        limit: 1000,
        sortBy: { column: 'name', order: 'desc' }
      });

    if (error || !files || files.length === 0) {
      return 1;
    }

    // 파일명에서 고유번호 추출 (blog-{blogId}-{YYYYMMDD}-{영문파일명}-{NN}.{ext})
    const pattern = new RegExp(`blog-${blogId}-${creationDate}-[^-]+-(\\d{2})\\.`);
    let maxNumber = 0;

    for (const file of files) {
      const match = file.name.match(pattern);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    }

    return maxNumber + 1;
  } catch (error) {
    console.warn('⚠️ 블로그 고유번호 생성 실패, 기본값 사용:', error);
    return 1;
  }
}

/**
 * 표준 파일명 고유번호 자동 생성
 */
async function getNextUniqueNumber(
  location: string,
  productName: string,
  compositionProgram: string,
  compositionFunction: string,
  creationDate: string
): Promise<number> {
  if (!supabase) return 1;

  try {
    // 파일명 패턴: {location}-{productName}-{compositionProgram}-{compositionFunction}-{creationDate}-{NN}.{ext}
    const pattern = `${location}-${productName}-${compositionProgram}-${compositionFunction}-${creationDate}-(\\d{2})\\.`;
    const regex = new RegExp(pattern);

    // 제품 갤러리 폴더에서 검색
    let searchFolders: string[] = [];
    
    if (location === 'products' && productName !== 'none') {
      searchFolders.push(`originals/products/${productName}/gallery`);
    } else if (location === 'goods' && productName !== 'none') {
      searchFolders.push(`originals/goods/${productName}/gallery`);
    } else if (location === 'daily-kakao') {
      // 카카오 콘텐츠는 날짜별 폴더 검색
      const dateStr = `${creationDate.slice(0, 4)}-${creationDate.slice(4, 6)}-${creationDate.slice(6, 8)}`;
      searchFolders.push(`originals/daily-branding/kakao/${dateStr}`);
    } else if (location === 'ai-generated') {
      const dateStr = `${creationDate.slice(0, 4)}-${creationDate.slice(4, 6)}-${creationDate.slice(6, 8)}`;
      searchFolders.push(`originals/ai-generated/${dateStr}`);
    }

    let maxNumber = 0;

    for (const folderPath of searchFolders) {
      try {
        const { data: files, error } = await supabase.storage
          .from('blog-images')
          .list(folderPath, {
            limit: 1000,
            sortBy: { column: 'name', order: 'desc' }
          });

        if (!error && files) {
          for (const file of files) {
            const match = file.name.match(regex);
            if (match) {
              const num = parseInt(match[1], 10);
              if (num > maxNumber) {
                maxNumber = num;
              }
            }
          }
        }
      } catch (folderError) {
        console.warn(`⚠️ 폴더 검색 실패: ${folderPath}`, folderError);
      }
    }

    return maxNumber + 1;
  } catch (error) {
    console.warn('⚠️ 고유번호 생성 실패, 기본값 사용:', error);
    return 1;
  }
}

/**
 * 위치 자동 감지
 */
export function detectLocation(folderPath: string): 'daily-kakao' | 'goods' | 'products' | 'blog' | 'uploaded' | 'ai-generated' | 'customers' {
  if (folderPath.includes('daily-branding/kakao/')) return 'daily-kakao';
  if (folderPath.includes('originals/goods/')) return 'goods';
  if (folderPath.includes('originals/products/')) return 'products';
  if (folderPath.includes('originals/blog/')) return 'blog';
  if (folderPath.includes('originals/customers/')) return 'customers';
  if (folderPath.includes('originals/ai-generated/')) return 'ai-generated';
  return 'uploaded';
}

/**
 * 고객 이름 추출 (폴더 경로에서)
 * 예: originals/customers/ahnhuija-4404/2026-01-26 -> ahnhuija
 */
export function extractCustomerName(folderPath: string): string | undefined {
  if (!folderPath) return undefined;
  
  // originals/customers/{고객이름-숫자}/ 형식에서 고객 이름 추출
  const customerMatch = folderPath.match(/originals\/customers\/([^/]+)/);
  if (customerMatch) {
    const customerFolder = customerMatch[1];
    // 하이픈으로 분리하여 이름 부분만 추출 (예: ahnhuija-4404 -> ahnhuija)
    const namePart = customerFolder.split('-').slice(0, -1).join('-');
    // 숫자만 있는 경우는 제외
    if (namePart && !/^\d+$/.test(namePart)) {
      return namePart;
    }
    // 숫자가 없으면 전체를 반환
    if (customerFolder && !/^\d+$/.test(customerFolder)) {
      return customerFolder;
    }
  }
  
  return undefined;
}

/**
 * 제품 이미지 파일명 생성
 * 형식: massgoo-{풀제품명}-{날짜}-{순번}.webp
 */
export async function generateProductImageFileName(
  productSlug: string,
  creationDate?: Date,
  uniqueNumber?: number
): Promise<string> {
  const date = creationDate || new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  
  // 고유번호 자동 생성 (없는 경우)
  let finalUniqueNumber = uniqueNumber;
  if (!finalUniqueNumber) {
    finalUniqueNumber = await getNextProductImageUniqueNumber(productSlug, dateStr);
  }
  
  // 고유번호 2자리 포맷팅
  const uniqueNumberStr = String(finalUniqueNumber).padStart(2, '0');
  
  // 파일명 조합
  const fileName = `massgoo-${productSlug}-${dateStr}-${uniqueNumberStr}.webp`;
  
  return fileName;
}

/**
 * 제품 이미지 고유번호 자동 생성
 */
async function getNextProductImageUniqueNumber(
  productSlug: string,
  creationDate: string
): Promise<number> {
  if (!supabase) return 1;
  
  try {
    // 해당 제품의 해당 날짜 이미지 개수 조회
    const productsFolderPath = `originals/products/${productSlug}/detail`;
    const goodsFolderPath = `originals/goods/${productSlug}/detail`;
    
    // products와 goods 폴더 모두 확인
    const [productsFiles, goodsFiles] = await Promise.all([
      supabase.storage.from('blog-images').list(productsFolderPath, { limit: 1000 }),
      supabase.storage.from('blog-images').list(goodsFolderPath, { limit: 1000 })
    ]);
    
    const allFiles = [
      ...(productsFiles.data || []),
      ...(goodsFiles.data || [])
    ];
    
    // 해당 날짜의 파일만 필터링
    const datePattern = new RegExp(`massgoo-${productSlug}-${creationDate}-(\\d{2})\\.webp`);
    const matchingFiles = allFiles.filter(file => datePattern.test(file.name));
    
    if (matchingFiles.length === 0) {
      return 1;
    }
    
    // 최대 번호 찾기
    const maxNumber = matchingFiles.reduce((max, file) => {
      const match = file.name.match(datePattern);
      if (match) {
        const num = parseInt(match[1], 10);
        return Math.max(max, num);
      }
      return max;
    }, 0);
    
    return maxNumber + 1;
  } catch (error) {
    console.warn('⚠️ 제품 이미지 고유번호 생성 실패, 기본값 사용:', error);
    return 1;
  }
}

/**
 * 제품명 추출 (원본 이미지 메타데이터에서)
 */
/**
 * 회전 파일명 생성
 */
export async function generateRotationFileName(
  options: {
    location: 'daily-kakao' | 'goods' | 'products' | 'blog' | 'uploaded' | 'ai-generated' | 'customers';
    productName?: string;
    rotation: number; // 90, 180, 270
    format: 'webp' | 'jpg' | 'png';
    quality?: number; // 85, 90 등
    creationDate?: Date;
    uniqueNumber?: number;
    extension: string;
  }
): Promise<string> {
  const {
    location,
    productName = 'none',
    rotation,
    format,
    quality,
    creationDate = new Date(),
    uniqueNumber,
    extension
  } = options;

  const dateStr = creationDate.toISOString().slice(0, 10).replace(/-/g, '');

  // 고유번호 자동 생성
  let finalUniqueNumber = uniqueNumber;
  if (!finalUniqueNumber) {
    finalUniqueNumber = await getNextUniqueNumber(
      location,
      productName,
      'rotate',
      `rotate-${rotation}-${format}${quality || ''}`,
      dateStr
    );
  }

  const uniqueNumberStr = String(finalUniqueNumber).padStart(2, '0');

  // 포맷 품질 표기
  let formatQualityStr = format;
  if (format === 'webp' && quality) {
    formatQualityStr = `webp${quality}`;
  } else if (format === 'jpg' && quality) {
    formatQualityStr = `jpg${quality}`;
  } else if (format === 'png') {
    formatQualityStr = 'png';
  }

  // 파일명 조합
  const fileName = `${location}-${productName}-rotate-${rotation}-${formatQualityStr}-${dateStr}-${uniqueNumberStr}.${extension}`;

  return fileName;
}

/**
 * 변환 파일명 생성
 */
export async function generateConvertFileName(
  options: {
    location: 'daily-kakao' | 'goods' | 'products' | 'blog' | 'uploaded' | 'ai-generated' | 'customers';
    productName?: string;
    tool: string; // 'sharp'
    format: 'webp' | 'jpg' | 'png';
    quality?: number;
    creationDate?: Date;
    uniqueNumber?: number;
    extension: string;
  }
): Promise<string> {
  const {
    location,
    productName = 'none',
    tool,
    format,
    quality,
    creationDate = new Date(),
    uniqueNumber,
    extension
  } = options;

  const dateStr = creationDate.toISOString().slice(0, 10).replace(/-/g, '');

  // 고유번호 자동 생성
  let finalUniqueNumber = uniqueNumber;
  if (!finalUniqueNumber) {
    finalUniqueNumber = await getNextUniqueNumber(
      location,
      productName,
      'convert',
      `convert-${tool}-${format}${quality || ''}`,
      dateStr
    );
  }

  const uniqueNumberStr = String(finalUniqueNumber).padStart(2, '0');

  // 포맷 품질 표기
  let formatQualityStr = format;
  if (format === 'webp' && quality) {
    formatQualityStr = `webp${quality}`;
  } else if (format === 'jpg' && quality) {
    formatQualityStr = `jpg${quality}`;
  } else if (format === 'png') {
    formatQualityStr = 'png';
  }

  // 파일명 조합
  const fileName = `${location}-${productName}-convert-${tool}-${formatQualityStr}-${dateStr}-${uniqueNumberStr}.${extension}`;

  return fileName;
}

export async function extractProductName(imageUrl?: string, targetFolder?: string): Promise<string | undefined> {
  if (!supabase) return undefined;

  // targetFolder에서 제품명 추출 시도 (우선)
  if (targetFolder) {
    // originals/products/{제품slug}/ 형식에서 제품명 추출
    const productMatch = targetFolder.match(/originals\/products\/([^/]+)/);
    if (productMatch) {
      return productMatch[1];
    }
    
    // originals/goods/{제품slug}/ 형식에서 제품명 추출
    const goodsMatch = targetFolder.match(/originals\/goods\/([^/]+)/);
    if (goodsMatch) {
      return goodsMatch[1];
    }
  }

  // imageUrl이 있으면 메타데이터에서 추출
  if (imageUrl) {
    try {
      const { data: metadata } = await supabase
        .from('image_assets')
        .select('file_path, ai_tags')
        .eq('cdn_url', imageUrl)
        .maybeSingle();

      if (metadata) {
        // file_path에서 제품 slug 추출
        if (metadata.file_path) {
          const productMatch = metadata.file_path.match(/products\/([^/]+)\/gallery/);
          const goodsMatch = metadata.file_path.match(/goods\/([^/]+)\/gallery/);
          
          if (productMatch) return productMatch[1];
          if (goodsMatch) return goodsMatch[1];
        }

        // ai_tags에서 제품 정보 추출
        if (metadata.ai_tags && Array.isArray(metadata.ai_tags)) {
          const productTag = metadata.ai_tags.find((tag: string) => tag.startsWith('product-'));
          if (productTag) {
            return productTag.replace('product-', '');
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ 제품명 추출 실패:', error);
    }
  }

  return undefined;
}
