// 이미지 업로드 유틸리티 함수
// 클라이언트 사이드에서 사용할 수 있는 Supabase 이미지 업로드 함수

interface UploadOptions {
  targetFolder?: string; // 업로드할 폴더 경로 (예: 'originals/daily-branding/kakao/2025-11-16/account1/feed')
  enableHEICConversion?: boolean; // HEIC 파일 자동 변환
  enableEXIFBackfill?: boolean; // EXIF 메타데이터 백필
  uploadMode?: 'preserve-original' | 'preserve-original-optimized-name'; // 업로드 모드 (기본값: preserve-original)
  onProgress?: (progress: number) => void; // 업로드 진행률 콜백 (0-100)
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
    // 한글 파일명 감지 및 자동 모드 전환
    const hasKoreanInFileName = /[가-힣]/.test(file.name);
    let finalUploadMode = options.uploadMode || 'preserve-original';
    
    if (hasKoreanInFileName && finalUploadMode === 'preserve-original') {
      console.log('🔄 한글 파일명 감지, 자동으로 파일명 최적화 모드로 전환:', file.name);
      finalUploadMode = 'preserve-original-optimized-name';
    }
    
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
    
    // uploadMode 옵션 추가 (한글 감지 시 자동 변경된 모드 사용)
    if (finalUploadMode) {
      formData.append('uploadMode', finalUploadMode);
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

    // 업로드 시작 로깅
    console.log('📤 업로드 시작:', {
      fileName: processedFile.name,
      fileSize: `${(processedFile.size / 1024 / 1024).toFixed(2)}MB`,
      fileType: processedFile.type,
      targetFolder: options.targetFolder || '기본 폴더',
      uploadMode: finalUploadMode,
      hasKorean: hasKoreanInFileName
    });

    // 진행률 추적을 위해 XMLHttpRequest 사용
    return new Promise<UploadResult>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // 타임아웃 설정 (90초로 단축)
      xhr.timeout = 90000; // 90초
      
      // readyState 변경 추적
      xhr.addEventListener('readystatechange', () => {
        if (xhr.readyState === XMLHttpRequest.OPENED) {
          console.log('📤 XMLHttpRequest OPENED: 요청 준비 완료');
        } else if (xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
          console.log('📥 XMLHttpRequest HEADERS_RECEIVED: 서버 응답 헤더 수신');
        } else if (xhr.readyState === XMLHttpRequest.LOADING) {
          console.log('⏳ XMLHttpRequest LOADING: 응답 데이터 수신 중...');
        } else if (xhr.readyState === XMLHttpRequest.DONE) {
          console.log('✅ XMLHttpRequest DONE: 요청 완료');
        }
      });
      
      // 타임아웃 이벤트 리스너
      xhr.addEventListener('timeout', () => {
        console.error('❌ 업로드 타임아웃 (90초 초과)');
        reject(new Error('업로드 시간이 초과되었습니다. (90초) 파일 크기를 확인하거나 네트워크 연결을 확인해주세요.'));
      });

      // 진행률 이벤트 리스너
      if (options.onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            options.onProgress!(progress);
          }
        });
      }

      // 완료 이벤트 리스너
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            
            if (!data.url) {
              throw new Error('업로드 응답에 URL이 없습니다.');
            }

            console.log('✅ 이미지 업로드 완료:', data.url);
            
            resolve({
              url: data.url,
              fileName: data.fileName || processedFile.name
            });
          } catch (parseError: any) {
            console.error('❌ 응답 파싱 오류:', parseError);
            reject(new Error('서버 응답을 파싱할 수 없습니다.'));
          }
        } else {
          // 에러 응답 처리
          let errorMessage = `업로드 실패: ${xhr.status} ${xhr.statusText}`;
          try {
            const errorData = JSON.parse(xhr.responseText);
            errorMessage = errorData.details || errorData.error || errorMessage;
            
            // 개발 환경에서 상세 정보 표시
            if (process.env.NODE_ENV === 'development' && errorData.stack) {
              console.error('서버 오류 상세:', errorData);
            }
          } catch {
            // JSON 파싱 실패 시 기본 메시지 사용
          }
          reject(new Error(errorMessage));
        }
      });

      // 에러 이벤트 리스너
      xhr.addEventListener('error', () => {
        reject(new Error('네트워크 오류가 발생했습니다.'));
      });

      // 중단 이벤트 리스너
      xhr.addEventListener('abort', () => {
        reject(new Error('업로드가 취소되었습니다.'));
      });

      // 요청 시작
      try {
        console.log('🚀 XMLHttpRequest 시작: POST /api/upload-image-supabase');
        xhr.open('POST', '/api/upload-image-supabase');
        xhr.send(formData);
        console.log('📤 XMLHttpRequest.send() 호출 완료');
      } catch (sendError: any) {
        console.error('❌ XMLHttpRequest.send() 오류:', sendError);
        reject(new Error(`요청 전송 실패: ${sendError.message || '알 수 없는 오류'}`));
      }
    });
  } catch (error: any) {
    console.error('❌ 이미지 업로드 오류:', error);
    throw new Error(error.message || '이미지 업로드에 실패했습니다.');
  }
}





