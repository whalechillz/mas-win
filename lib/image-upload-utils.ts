// 이미지 업로드 유틸리티 함수
// 클라이언트 사이드에서 사용할 수 있는 Supabase 이미지 업로드 함수

interface UploadOptions {
  targetFolder?: string; // 업로드할 폴더 경로 (예: 'originals/daily-branding/kakao/2025-11-16/account1/feed')
  enableHEICConversion?: boolean; // HEIC 파일 자동 변환
  enableEXIFBackfill?: boolean; // EXIF 메타데이터 백필
  uploadMode?: 'auto' | 'preserve-name' | 'preserve-original'; // 업로드 모드
  // 하위 호환성: 기존 옵션들 (deprecated)
  preserveFilename?: boolean; // 원본 파일명 전체 유지 옵션 (deprecated, uploadMode 사용 권장)
  preserveExtension?: boolean; // 원본 확장자만 유지 옵션 (deprecated, uploadMode 사용 권장)
}

interface UploadResult {
  url: string; // 업로드된 이미지의 공개 URL
  fileName?: string; // 업로드된 파일명
}

/**
 * 이미지를 Supabase Storage에 업로드하는 함수
 * @param file - 업로드할 이미지 파일
 * @param options - 업로드 옵션
 * @returns 업로드된 이미지의 URL
 */
export async function uploadImageToSupabase(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    // HEIC 파일 변환 처리
    let processedFile = file;
    
    if (options.enableHEICConversion && (
      file.type === 'image/heic' || 
      file.type === 'image/heif' || 
      file.name.toLowerCase().endsWith('.heic') || 
      file.name.toLowerCase().endsWith('.heif')
    )) {
      console.log('🔄 HEIC 파일 변환 중...');
      
      try {
        // 동적 import로 heic2any 로드
        const heic2any = (await import('heic2any')).default;
        
        const convertedBlob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.8
        });
        
        processedFile = new File(
          [convertedBlob[0] as Blob], 
          file.name.replace(/\.(heic|heif)$/i, '.jpg'), 
          {
            type: 'image/jpeg'
          }
        );
        
        console.log('✅ HEIC → JPG 변환 완료');
      } catch (heicError) {
        console.warn('⚠️ HEIC 변환 실패, 원본 파일 사용:', heicError);
        // 변환 실패 시 원본 파일 사용
      }
    }

    // FormData 생성
    const formData = new FormData();
    formData.append('file', processedFile);
    
    // targetFolder가 있으면 추가
    if (options.targetFolder) {
      formData.append('targetFolder', options.targetFolder);
    }
    
    // uploadMode 옵션 추가 (우선순위)
    if (options.uploadMode) {
      formData.append('uploadMode', options.uploadMode);
    }
    
    // 하위 호환성: 기존 옵션들 (uploadMode가 없을 때만 사용)
    if (!options.uploadMode) {
      if (options.preserveFilename) {
        formData.append('preserveFilename', 'true');
      }
      if (options.preserveExtension) {
        formData.append('preserveExtension', 'true');
      }
    }

    // 업로드 API 호출
    const response = await fetch('/api/upload-image-supabase', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `업로드 실패: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.url) {
      throw new Error('업로드 응답에 URL이 없습니다.');
    }

    console.log('✅ 이미지 업로드 완료:', data.url);
    
    return {
      url: data.url,
      fileName: data.fileName || processedFile.name
    };
  } catch (error: any) {
    console.error('❌ 이미지 업로드 오류:', error);
    throw new Error(error.message || '이미지 업로드에 실패했습니다.');
  }
}





