/**
 * Supabase Storage URL에서 파일 경로(imageName) 추출 유틸리티
 * 
 * image_metadata → image_assets 마이그레이션 이후
 * 삭제 API가 imageName을 요구하므로 imageUrl을 imageName으로 변환하는 함수
 */

/**
 * Supabase Storage URL에서 파일 경로(imageName) 추출
 * @param imageUrl - Supabase Storage URL 또는 파일 경로
 * @returns 파일 경로 (예: originals/customers/ahnhuija/2026-01-26/file.webp)
 * @throws Error - 경로 추출 실패 시
 */
export function extractImageNameFromUrl(imageUrl: string): string {
  if (!imageUrl) {
    throw new Error('imageUrl이 제공되지 않았습니다.');
  }

  // 이미 파일 경로인 경우 (URL이 아닌 경우)
  if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
    // 이미 경로 형식이면 그대로 반환
    return imageUrl;
  }

  // Supabase Storage URL 패턴 1: /storage/v1/object/public/{bucket}/{path}
  // 예: https://xxx.supabase.co/storage/v1/object/public/blog-images/originals/customers/...
  const pattern1 = imageUrl.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
  if (pattern1) {
    return decodeURIComponent(pattern1[1]);
  }

  // Supabase Storage URL 패턴 2: /storage/v1/object/sign/{bucket}/{path}?...
  // 예: https://xxx.supabase.co/storage/v1/object/sign/blog-images/originals/...?token=...
  const pattern2 = imageUrl.match(/\/storage\/v1\/object\/sign\/[^/]+\/(.+?)(?:\?|$)/);
  if (pattern2) {
    return decodeURIComponent(pattern2[1]);
  }

  // 일반 URL에서 경로 추출 시도
  try {
    const url = new URL(imageUrl);
    const pathname = url.pathname;
    
    // originals 또는 blog-images로 시작하는 경로 찾기
    const pathMatch = pathname.match(/(?:originals|blog-images)\/.+$/);
    if (pathMatch) {
      return decodeURIComponent(pathMatch[0]);
    }
    
    // 마지막 경로 세그먼트가 파일명인 경우
    const fileNameMatch = pathname.match(/\/([^/]+\.(webp|jpg|jpeg|png|gif|mp4|mov|avi|webm|mkv))$/i);
    if (fileNameMatch) {
      return decodeURIComponent(fileNameMatch[1]);
    }
  } catch (error) {
    // URL 파싱 실패 - 다음 단계로 진행
  }

  // 모든 패턴 실패 시 원본 반환 (에러 발생)
  throw new Error(
    `이미지 URL에서 파일 경로를 추출할 수 없습니다: ${imageUrl.substring(0, 100)}${imageUrl.length > 100 ? '...' : ''}`
  );
}
