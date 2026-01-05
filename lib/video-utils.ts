/**
 * 클라이언트 사이드 동영상 처리 유틸리티
 * 브라우저의 Canvas API와 Video API를 사용하여 동영상 첫 프레임 및 메타데이터 추출
 */

/**
 * 동영상 첫 프레임을 Canvas로 추출하여 Base64 이미지로 변환
 * @param videoUrl 동영상 URL
 * @param quality JPEG 품질 (0.0 ~ 1.0, 기본값: 0.9)
 * @returns Base64 인코딩된 이미지 (data:image/jpeg;base64,...)
 */
export async function extractVideoThumbnailClient(
  videoUrl: string,
  quality: number = 0.9
): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous'; // CORS 허용
    video.src = videoUrl;
    video.currentTime = 0.1; // 첫 프레임으로 이동 (0은 로드 안 될 수 있음)
    video.muted = true; // 음소거 (자동 재생 정책 준수)
    video.playsInline = true; // 인라인 재생
    
    // 타임아웃 처리 (10초)
    const timeout = setTimeout(() => {
      reject(new Error('동영상 로드 시간 초과'));
    }, 10000);
    
    // 메타데이터 로드 완료 시 첫 프레임 추출
    video.onloadeddata = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context를 가져올 수 없습니다'));
          return;
        }
        
        // 첫 프레임을 Canvas에 그리기
        ctx.drawImage(video, 0, 0);
        
        // JPEG 품질로 변환
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      } catch (error: any) {
        reject(new Error(`썸네일 추출 실패: ${error.message}`));
      }
    };
    
    // 에러 처리
    video.onerror = (error) => {
      clearTimeout(timeout);
      reject(new Error('동영상 로드 실패: 동영상 파일을 불러올 수 없습니다'));
    };
    
    // 동영상 로드 시작
    video.load();
  });
}

/**
 * 동영상 메타데이터 추출 (브라우저 Video API 사용)
 * @param videoUrl 동영상 URL
 * @returns 동영상 메타데이터 (width, height, duration)
 * @note codec, fps, bitrate는 브라우저 API로 추출 불가 (null 반환)
 */
export async function extractVideoMetadataClient(videoUrl: string): Promise<{
  width: number;
  height: number;
  duration: number;
  codec?: string | null;
  fps?: string | null;
  bitrate?: number | null;
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = videoUrl;
    video.preload = 'metadata'; // 메타데이터만 로드 (전체 파일 다운로드 방지)
    video.crossOrigin = 'anonymous'; // CORS 허용
    
    // 타임아웃 처리 (10초)
    const timeout = setTimeout(() => {
      reject(new Error('동영상 메타데이터 로드 시간 초과'));
    }, 10000);
    
    video.onloadedmetadata = () => {
      clearTimeout(timeout);
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
        // 브라우저 API로는 추출 불가
        codec: null,
        fps: null,
        bitrate: null,
      });
    };
    
    video.onerror = (error) => {
      clearTimeout(timeout);
      reject(new Error('동영상 메타데이터 추출 실패: 동영상 파일을 불러올 수 없습니다'));
    };
    
    // 동영상 로드 시작
    video.load();
  });
}
