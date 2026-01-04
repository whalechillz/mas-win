/**
 * 클라이언트 측 이미지 처리 유틸리티 (Canvas API 사용)
 * Sharp 대신 브라우저 Canvas API를 사용하여 이미지 회전/변환 처리
 */

/**
 * 이미지를 회전시킵니다 (90도 단위)
 * @param imageUrl - 회전할 이미지 URL
 * @param rotation - 회전 각도 (90, -90, 180, 270)
 * @param format - 출력 포맷 ('webp', 'png', 'jpg')
 * @returns 처리된 이미지 Blob
 */
export async function rotateImageWithCanvas(
  imageUrl: string,
  rotation: number,
  format: 'webp' | 'png' | 'jpg' = 'png'
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context를 가져올 수 없습니다.'));
        return;
      }
      
      const width = img.width;
      const height = img.height;
      
      // 회전 각도에 따라 캔버스 크기 조정
      let canvasWidth: number;
      let canvasHeight: number;
      
      if (rotation === 90 || rotation === -90 || rotation === 270) {
        // 90도 회전 시 가로/세로 교체
        canvasWidth = height;
        canvasHeight = width;
      } else {
        // 180도 회전 시 크기 유지
        canvasWidth = width;
        canvasHeight = height;
      }
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      // 회전 적용
      const radians = (rotation * Math.PI) / 180;
      ctx.translate(canvasWidth / 2, canvasHeight / 2);
      ctx.rotate(radians);
      ctx.drawImage(img, -width / 2, -height / 2);
      
      // Blob으로 변환
      const mimeType = format === 'webp' ? 'image/webp' : 
                      format === 'jpg' ? 'image/jpeg' : 'image/png';
      const quality = format === 'webp' ? 0.85 : 
                     format === 'jpg' ? 0.85 : undefined;
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('이미지 회전 변환 실패'));
          }
        },
        mimeType,
        quality
      );
    };
    
    img.onerror = () => {
      reject(new Error('이미지를 로드할 수 없습니다. CORS 문제일 수 있습니다.'));
    };
    
    img.src = imageUrl;
  });
}

/**
 * 이미지 포맷을 변환합니다
 * @param imageUrl - 변환할 이미지 URL
 * @param format - 목표 포맷 ('webp', 'png', 'jpg')
 * @param quality - 품질 (0-1, webp/jpg만 적용)
 * @param maxWidth - 최대 너비 (선택사항)
 * @param maxHeight - 최대 높이 (선택사항)
 * @returns 처리된 이미지 Blob
 */
export async function convertImageWithCanvas(
  imageUrl: string,
  format: 'webp' | 'png' | 'jpg',
  quality: number = 0.85,
  maxWidth?: number,
  maxHeight?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context를 가져올 수 없습니다.'));
        return;
      }
      
      let width = img.width;
      let height = img.height;
      
      // 리사이징 (선택사항)
      if (maxWidth || maxHeight) {
        const ratio = Math.min(
          maxWidth ? maxWidth / width : 1,
          maxHeight ? maxHeight / height : 1
        );
        width = width * ratio;
        height = height * ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // 투명도가 있는 이미지를 JPG로 변환할 때 흰색 배경 추가
      if (format === 'jpg' || format === 'jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
      }
      
      // 이미지 그리기
      ctx.drawImage(img, 0, 0, width, height);
      
      // Blob으로 변환
      const mimeType = format === 'webp' ? 'image/webp' : 
                      format === 'jpg' ? 'image/jpeg' : 'image/png';
      const outputQuality = format === 'webp' || format === 'jpg' ? quality : undefined;
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('이미지 변환 실패'));
          }
        },
        mimeType,
        outputQuality
      );
    };
    
    img.onerror = () => {
      reject(new Error('이미지를 로드할 수 없습니다. CORS 문제일 수 있습니다.'));
    };
    
    img.src = imageUrl;
  });
}

/**
 * 이미지 메타데이터를 가져옵니다
 * @param imageUrl - 이미지 URL
 * @returns 이미지 메타데이터
 */
export async function getImageMetadata(imageUrl: string): Promise<{
  width: number;
  height: number;
  hasAlpha: boolean;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // 투명도 확인을 위해 Canvas에 그려보기
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      if (!ctx) {
        resolve({
          width: img.width,
          height: img.height,
          hasAlpha: false
        });
        return;
      }
      
      // 투명도 확인 (간단한 방법: 작은 영역 샘플링)
      ctx.drawImage(img, 0, 0, 1, 1);
      const imageData = ctx.getImageData(0, 0, 1, 1);
      const hasAlpha = imageData.data[3] < 255; // alpha 채널 확인
      
      resolve({
        width: img.width,
        height: img.height,
        hasAlpha
      });
    };
    
    img.onerror = () => {
      reject(new Error('이미지를 로드할 수 없습니다.'));
    };
    
    img.src = imageUrl;
  });
}










