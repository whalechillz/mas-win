/**
 * 고객 이미지 파일명 생성 유틸리티
 * 형식: {이니셜}_s{장면코드}_{타입}_{번호}.webp
 */

import { translateKoreanToEnglish } from './korean-to-english-translator';

/**
 * 고객 이름에서 이니셜 추출
 */
export function getCustomerInitials(name: string): string {
  if (!name) return 'unknown';
  
  // 한글 이름인 경우
  if (/[가-힣]/.test(name)) {
    const nameEn = translateKoreanToEnglish(name);
    // 공백이나 하이픈으로 분리하여 이니셜 추출
    const parts = nameEn.split(/[\s-]+/);
    return parts.map(part => part.charAt(0)).join('').toLowerCase();
  }
  
  // 영문 이름인 경우
  const parts = name.split(/[\s-]+/);
  return parts.map(part => part.charAt(0)).join('').toLowerCase();
}

/**
 * 파일명 패턴에서 스토리 장면 분류
 */
export function classifyStoryScene(fileName: string): number {
  const lowerFileName = fileName.toLowerCase();
  
  // 장면 1: 히어로
  if (lowerFileName.includes('히어로') || lowerFileName.includes('hero')) {
    return 1;
  }
  
  // 장면 3: 시타장면, 시타영상
  if (lowerFileName.includes('시타장면') || lowerFileName.includes('swing-scene')) {
    return 3;
  }
  if (lowerFileName.includes('시타영상') && !lowerFileName.includes('편집')) {
    return 3;
  }
  if (lowerFileName.includes('swing-video') && !lowerFileName.includes('edited')) {
    return 3;
  }
  
  // 장면 4: 시타상담, 측정
  if (lowerFileName.includes('시타상담') || lowerFileName.includes('swing-consultation')) {
    return 4;
  }
  if (lowerFileName.includes('측정') || lowerFileName.includes('measurement')) {
    return 4;
  }
  
  // 장면 5: 아트월
  if (lowerFileName.includes('아트월') || lowerFileName.includes('art-wall')) {
    return 5;
  }
  
  // 장면 6: 사인, 스윙장면, 스윙영상
  if (lowerFileName.includes('사인') || lowerFileName.includes('signature')) {
    return 6;
  }
  if (lowerFileName.includes('스윙장면') || lowerFileName.includes('swing-scene-outdoor')) {
    return 6;
  }
  if (lowerFileName.includes('스윙영상') || lowerFileName.includes('swing-video-outdoor')) {
    return 6;
  }
  
  // 장면 7: 후기캡처
  if (lowerFileName.includes('후기캡처') || lowerFileName.includes('review-capture')) {
    return 7;
  }
  
  // 기본값: 장면 1
  return 1;
}

/**
 * 파일명 패턴에서 이미지 타입 추출
 */
export function extractImageType(fileName: string): string {
  const lowerFileName = fileName.toLowerCase();
  
  // 패턴 매핑 (긴 패턴부터)
  const typeMap: Record<string, string> = {
    '후기캡처_네이버스마트스토어': 'review-capture-naver-smartstore',
    'review-capture-naver-smartstore': 'review-capture-naver-smartstore',
    '후기캡처_카카오톡': 'review-capture-kakao-talk',
    'review-capture-kakao-talk': 'review-capture-kakao-talk',
    '후기캡처_카카오채널': 'review-capture-kakao-channel',
    'review-capture-kakao-channel': 'review-capture-kakao-channel',
    '후기캡처_문자': 'review-capture-sms',
    'review-capture-sms': 'review-capture-sms',
    '후기캡처': 'review-capture',
    'review-capture': 'review-capture',
    '스윙영상': 'swing-video-outdoor',
    'swing-video-outdoor': 'swing-video-outdoor',
    '스윙장면': 'swing-scene-outdoor',
    'swing-scene-outdoor': 'swing-scene-outdoor',
    '시타영상_편집': 'swing-video-edited',
    'swing-video-edited': 'swing-video-edited',
    '시타영상': 'swing-video',
    'swing-video': 'swing-video',
    '시타장면': 'swing-scene',
    'swing-scene': 'swing-scene',
    '시타상담': 'swing-consultation',
    'swing-consultation': 'swing-consultation',
    '측정': 'measurement',
    'measurement': 'measurement',
    '아트월': 'art-wall',
    'art-wall': 'art-wall',
    '사인': 'signature',
    'signature': 'signature',
    '히어로': 'hero',
    'hero': 'hero',
  };
  
  // 긴 패턴부터 매칭
  const sortedKeys = Object.keys(typeMap).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (lowerFileName.includes(key)) {
      return typeMap[key];
    }
  }
  
  return 'unknown';
}

/**
 * 파일명에서 번호 추출
 */
export function extractNumber(fileName: string): number {
  // 01, 02 형식의 번호 찾기
  const match = fileName.match(/(\d{2})/);
  if (match) {
    return parseInt(match[1], 10);
  }
  
  // 단일 숫자 찾기
  const singleMatch = fileName.match(/(\d{1})/);
  if (singleMatch) {
    return parseInt(singleMatch[1], 10);
  }
  
  return 1;
}

/**
 * 고객 이미지 파일명 생성
 * 형식: {이니셜}_s{장면코드}_{타입}_{번호}.webp
 */
export function generateCustomerImageFileName(
  customer: { name: string; initials?: string },
  originalFileName: string,
  index?: number
): { fileName: string; scene: number; type: string } {
  const initials = customer.initials || getCustomerInitials(customer.name);
  const scene = classifyStoryScene(originalFileName);
  const type = extractImageType(originalFileName);
  const num = index !== undefined ? index : extractNumber(originalFileName);
  
  const fileName = `${initials}_s${scene}_${type}_${String(num).padStart(2, '0')}.webp`;
  
  return {
    fileName,
    scene,
    type
  };
}
