// 이미지 업로드 유틸리티 함수
// 클라이언트 사이드에서 사용할 수 있는 Supabase 이미지 업로드 함수

interface UploadOptions {
  targetFolder?: string; // 업로드할 폴더 경로 (예: 'originals/daily-branding/kakao/2025-11-16/account1/feed')
  enableHEICConversion?: boolean; // HEIC 파일 자동 변환
  enableEXIFBackfill?: boolean; // EXIF 메타데이터 백필
  uploadMode?: 'optimize-filename' | 'preserve-filename' | 'auto' | 'preserve-name' | 'preserve-original'; // 업로드 모드 (새 모드: optimize-filename, preserve-filename | 기존 모드: 하위 호환)
  customFileName?: string; // 커스텀 파일명 (고객 이미지 업로드 시 사용)
  onProgress?: (progress: number) => void; // 업로드 진행률 콜백 (0-100)
  // 하위 호환성: 기존 옵션들 (deprecated)
  preserveFilename?: boolean; // 원본 파일명 전체 유지 옵션 (deprecated, uploadMode 사용 권장)
  preserveExtension?: boolean; // 원본 확장자만 유지 옵션 (deprecated, uploadMode 사용 권장)
}

interface UploadResult {
  url: string; // 업로드된 이미지의 공개 URL
  fileName?: string; // 업로드된 파일명
  metadata?: {
    width?: number;
    height?: number;
    format?: string;
    file_size?: number;
    is_video?: boolean;
  };
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
    // 한글 파일명 감지 및 경고
    const hasKoreanInFileName = /[가-힣]/.test(file.name);
    if (hasKoreanInFileName && options.uploadMode === 'preserve-original') {
      const userConfirmed = confirm(
        `⚠️ 한글 파일명 감지: "${file.name}"\n\n` +
        `한글 파일명은 Supabase Storage에서 문제가 발생할 수 있습니다.\n\n` +
        `파일명을 최적화하여 업로드하시겠습니까?\n` +
        `(예: ${file.name.split('.')[0]}-{타임스탬프}-{랜덤}.${file.name.split('.').pop()})\n\n` +
        `[확인] = 파일명 최적화하여 업로드\n` +
        `[취소] = 원본 파일명 그대로 업로드 시도 (오류 가능)`
      );
      
      if (userConfirmed) {
        // 파일명 최적화 모드로 자동 전환
        options.uploadMode = 'preserve-original-optimized-name';
        console.log('🔄 한글 파일명 감지, 파일명 최적화 모드로 자동 전환');
      } else {
        console.warn('⚠️ 사용자가 한글 파일명 그대로 업로드를 선택했습니다. 오류가 발생할 수 있습니다.');
      }
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
    
    // uploadMode 옵션 추가 (우선순위)
    if (options.uploadMode) {
      formData.append('uploadMode', options.uploadMode);
    }
    
    // 커스텀 파일명 추가 (고객 이미지 등)
    if (options.customFileName) {
      formData.append('customFileName', options.customFileName);
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
      uploadMode: options.uploadMode || 'auto'
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
              fileName: data.fileName || processedFile.name,
              metadata: data.metadata // 서버 응답의 metadata 포함
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
            
            // 한글 파일명 관련 에러 메시지 개선
            if (errorData.error && errorData.error.includes('한글 파일명')) {
              errorMessage = `⚠️ ${errorData.error}`;
              if (errorData.details) {
                errorMessage += `\n\n${errorData.details}`;
              }
              if (errorData.suggestion) {
                errorMessage += `\n\n💡 해결 방법: ${errorData.suggestion}`;
              }
            } else {
              errorMessage = errorData.details || errorData.error || errorMessage;
            }
            
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

/**
 * 중복 파일명 체크 및 고유 파일명 생성
 * @param supabase - Supabase 클라이언트
 * @param folderPath - 폴더 경로
 * @param fileName - 원본 파일명
 * @param showWarning - 경고창 표시 여부
 * @returns 고유한 파일명
 */
async function generateUniqueFileName(
  supabase: any,
  folderPath: string,
  fileName: string,
  showWarning: boolean = true
): Promise<string> {
  const folderOnly = folderPath || '';
  const fullPath = folderOnly ? `${folderOnly}/${fileName}` : fileName;
  const pathParts = fileName.split('/');
  const fileNameOnly = pathParts[pathParts.length - 1];
  
  try {
    // 방법 1: 전체 경로로 파일 존재 확인 (HEAD 요청 - 더 정확함)
    try {
      const { data: urlData } = supabase.storage
        .from('blog-images')
        .getPublicUrl(fullPath);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      try {
        const headResponse = await fetch(urlData.publicUrl, { 
          method: 'HEAD',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (headResponse.ok) {
          // 파일이 존재함 - 자동으로 _01, _02, _03 형식으로 번호 추가
          console.log(`⚠️ 파일이 이미 존재함: ${fullPath}, 자동으로 번호 추가 중...`);
          
          const ext = fileName.match(/\.[^/.]+$/)?.[0] || '';
          // 기존 번호 제거 (예: file_01.webp -> file.webp)
          let baseName = fileName.replace(/\.[^/.]+$/, '').replace(/_\d{2}$/, '');
          
          let counter = 1;
          while (counter < 100) {
            const newFileName = `${baseName}_${String(counter).padStart(2, '0')}${ext}`;
            const newFullPath = folderOnly ? `${folderOnly}/${newFileName}` : newFileName;
            
            // 새 파일명으로 존재 확인
            const { data: newUrlData } = supabase.storage
              .from('blog-images')
              .getPublicUrl(newFullPath);
            
            const newController = new AbortController();
            const newTimeoutId = setTimeout(() => newController.abort(), 2000);
            
            try {
              const newHeadResponse = await fetch(newUrlData.publicUrl, { 
                method: 'HEAD',
                signal: newController.signal
              });
              clearTimeout(newTimeoutId);
              
              if (!newHeadResponse.ok) {
                // 파일이 없음 - 사용 가능
                console.log(`✅ 고유 파일명 생성: ${newFileName} (자동 번호 추가)`);
                return newFileName;
              }
            } catch {
              clearTimeout(newTimeoutId);
              // 에러 발생 시 파일이 없는 것으로 간주
              console.log(`✅ 고유 파일명 생성: ${newFileName} (자동 번호 추가)`);
              return newFileName;
            }
            
            counter++;
          }
          
          // 99까지 모두 사용된 경우 타임스탬프 추가
          const timestamp = Date.now();
          const newFileName = `${baseName}-${timestamp}${ext}`;
          console.log(`✅ 고유 파일명 생성: ${newFileName} (타임스탬프 추가, 번호 99까지 사용됨)`);
          return newFileName;
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        // HEAD 요청 실패 시 파일이 없는 것으로 간주
        if (fetchError.name !== 'AbortError') {
          console.warn('⚠️ 파일 존재 확인 실패, 원본 파일명 사용:', fetchError);
        }
      }
    } catch (urlError) {
      console.warn('⚠️ Public URL 생성 실패, 원본 파일명 사용:', urlError);
    }
    
    return fileName;
  } catch (error) {
    console.warn('⚠️ 파일 존재 여부 확인 실패, 원본 파일명 사용:', error);
    return fileName;
  }
}

/**
 * 대용량 파일을 클라이언트에서 직접 Supabase Storage로 업로드하는 함수
 * Vercel Serverless Function의 4.5MB 제한을 우회하기 위해 사용
 * @param file - 업로드할 파일
 * @param targetFolder - 업로드할 폴더 경로
 * @param customFileName - 커스텀 파일명 (선택사항)
 * @param onProgress - 업로드 진행률 콜백 (0-100)
 * @param showWarning - 중복 파일명 경고창 표시 여부
 * @returns 업로드된 파일의 URL
 */
export async function uploadLargeFileDirectlyToSupabase(
  file: File,
  targetFolder: string,
  customFileName?: string,
  onProgress?: (progress: number) => void,
  showWarning: boolean = true
): Promise<UploadResult> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase 환경변수가 설정되지 않았습니다');
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    let fileName = customFileName || file.name;
    let uploadPath = targetFolder ? `${targetFolder}/${fileName}`.replace(/\/+/g, '/') : fileName;
    let retryCount = 0;
    const maxRetries = 3;
    let useNumberSuffix = false; // 번호 추가 모드 여부
    
    while (retryCount < maxRetries) {
      // 중복 파일명 체크 및 고유 파일명 생성 (경고창 포함)
      // 번호 추가 모드가 아닐 때만 generateUniqueFileName 호출
      if (!useNumberSuffix) {
        fileName = await generateUniqueFileName(
          supabase,
          targetFolder || '',
          fileName,
          showWarning && retryCount === 0 // 첫 시도에만 경고창 표시
        );
      }
      
      uploadPath = targetFolder ? `${targetFolder}/${fileName}`.replace(/\/+/g, '/') : fileName;
      
      console.log(`📤 클라이언트에서 직접 업로드 시작 (시도 ${retryCount + 1}/${maxRetries}):`, {
        fileName,
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        fileType: file.type,
        uploadPath
      });
      
      try {
        // 1. 서버에서 서명된 업로드 URL 발급 (RLS 정책 우회)
        const signRes = await fetch('/api/admin/storage-signed-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: uploadPath })
        });
        
        if (!signRes.ok) {
          const errorData = await signRes.json().catch(() => ({}));
          const errorMessage = errorData.error || signRes.statusText;
          
          // 409 Conflict 또는 "already exists" 에러인 경우 고유 파일명 생성 후 재시도
          if (signRes.status === 409 || errorMessage.includes('already exists') || errorMessage.includes('resource already')) {
            console.warn(`⚠️ 파일이 이미 존재함 (${signRes.status}), 고유 파일명 생성 후 재시도: ${uploadPath}`);
            
            // 자동으로 _01, _02, _03 형식으로 번호 추가
            console.warn(`⚠️ 파일이 이미 존재함, 자동으로 번호 추가 중: ${uploadPath}`);
            
            const ext = fileName.match(/\.[^/.]+$/)?.[0] || '';
            // 기존 번호 제거 (예: file_01.webp -> file.webp)
            let baseName = fileName.replace(/\.[^/.]+$/, '').replace(/_\d{2}$/, '');
            const counter = retryCount + 1;
            fileName = `${baseName}_${String(counter).padStart(2, '0')}${ext}`;
            uploadPath = targetFolder ? `${targetFolder}/${fileName}`.replace(/\/+/g, '/') : fileName;
            retryCount++;
            continue; // 재시도 (번호 자동 증가)
          }
          
          throw new Error(`서명 URL 발급 실패: ${errorMessage}`);
        }
        
        const { token } = await signRes.json();
        if (!token) {
          throw new Error('서명 토큰을 받지 못했습니다');
        }
        
        console.log('✅ 서명된 URL 발급 완료');
        
        // 2. 서명된 URL로 직접 업로드 (RLS 정책 우회)
        const { error } = await supabase.storage
          .from('blog-images')
          .uploadToSignedUrl(uploadPath, token, file);
        
        if (error) {
          console.error('❌ Supabase 서명 URL 업로드 오류:', error);
          
          // "already exists" 에러인 경우, 실제로 파일이 업로드되었는지 확인
          if (error.message?.includes('already exists') || error.message?.includes('resource already')) {
            console.warn(`⚠️ 업로드 중 파일 중복 감지: ${uploadPath}`);
            
            // 파일이 실제로 존재하는지 확인
            const { data: { publicUrl } } = supabase.storage
              .from('blog-images')
              .getPublicUrl(uploadPath);
            
            try {
              const headResponse = await fetch(publicUrl, { method: 'HEAD' });
              if (headResponse.ok) {
                // 파일이 실제로 존재함 - 업로드 성공으로 처리
                console.log('✅ 파일이 이미 존재함 (업로드 성공으로 처리):', publicUrl);
                // 업로드 성공 - 루프 종료
                break;
              }
            } catch (checkError) {
              console.warn('⚠️ 파일 존재 확인 실패, 재시도:', checkError);
            }
            
            // 파일이 없으면 재시도 (_01, _02, _03 형식)
            if (retryCount < maxRetries - 1) {
              console.warn(`⚠️ 고유 파일명 생성 후 재시도: ${uploadPath}`);
              const ext = fileName.match(/\.[^/.]+$/)?.[0] || '';
              // 기존 번호 제거
              let baseName = fileName.replace(/\.[^/.]+$/, '').replace(/_\d{2}$/, '');
              const counter = retryCount + 1;
              fileName = `${baseName}_${String(counter).padStart(2, '0')}${ext}`;
              uploadPath = targetFolder ? `${targetFolder}/${fileName}`.replace(/\/+/g, '/') : fileName;
              retryCount++;
              continue; // 재시도
            }
          }
          
          throw new Error(`업로드 실패: ${error.message || '알 수 없는 오류'}`);
        }
        
        // 업로드 성공 - 루프 종료
        break;
        
      } catch (signError: any) {
        // "already exists" 에러인 경우 재시도 (_01, _02, _03 형식)
        if (signError.message?.includes('already exists') && retryCount < maxRetries - 1) {
          console.warn(`⚠️ 에러 발생, 자동으로 번호 추가 후 재시도: ${signError.message}`);
          const ext = fileName.match(/\.[^/.]+$/)?.[0] || '';
          // 기존 번호 제거
          let baseName = fileName.replace(/\.[^/.]+$/, '').replace(/_\d{2}$/, '');
          const counter = retryCount + 1;
          fileName = `${baseName}_${String(counter).padStart(2, '0')}${ext}`;
          uploadPath = targetFolder ? `${targetFolder}/${fileName}`.replace(/\/+/g, '/') : fileName;
          retryCount++;
          continue; // 재시도
        }
        throw signError;
      }
    }
    
    if (retryCount >= maxRetries) {
      throw new Error(`최대 재시도 횟수(${maxRetries})를 초과했습니다. 파일명: ${fileName}`);
    }
    
    // 공개 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(uploadPath);
    
    console.log('✅ 클라이언트 직접 업로드 완료:', publicUrl);
    
    // 진행률 콜백 호출 (완료)
    if (onProgress) {
      onProgress(100);
    }
    
    return {
      url: publicUrl,
      fileName,
      metadata: {
        file_size: file.size,
        is_video: file.type.startsWith('video/')
      }
    };
  } catch (error: any) {
    console.error('❌ 대용량 파일 직접 업로드 오류:', error);
    throw new Error(error.message || '대용량 파일 업로드에 실패했습니다.');
  }
}

