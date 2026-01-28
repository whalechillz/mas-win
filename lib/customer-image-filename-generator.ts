/**
 * 고객 이미지 파일명 생성 유틸리티
 * 형식: {영문이름}_s{장면코드}_{타입}_{번호}.webp
 * 예: joseotdae_s6_signature_01.webp
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
 * 고객 이미지 파일명 생성 (기존 방식 - 하위 호환성)
 * 형식: {영문이름}_s{장면코드}_{타입}_{번호}.webp
 * 예: joseotdae_s6_signature_01.webp
 */
export function generateCustomerImageFileName(
  customer: { name: string; initials?: string; name_en?: string },
  originalFileName: string,
  index?: number
): { fileName: string; scene: number; type: string } {
  // 고객 영문 이름 가져오기 (이니셜이 아닌 풀네임)
  const { translateKoreanToEnglish } = require('./korean-to-english-translator');
  const customerNameEn = customer.name_en || translateKoreanToEnglish(customer.name);
  // 하이픈과 공백 제거하고 소문자로 변환
  const nameEn = customerNameEn
    .toLowerCase()
    .replace(/[가-힣\s]/g, '') // 한글과 공백 제거
    .replace(/[^a-z0-9]/g, '') // 특수문자 제거
    .replace(/-+/g, '') // 하이픈 제거
    || (customer.initials || getCustomerInitials(customer.name));
  
  // 스캔 문서 감지
  const { detectScannedDocument } = require('./scanned-document-detector');
  const documentDetection = detectScannedDocument(originalFileName);
  const isScannedDocument = documentDetection.isDocument;
  
  // 스캔 문서인 경우 s0_docs 형식으로 파일명 생성
  if (isScannedDocument) {
    const originalExt = originalFileName.match(/\.[^/.]+$/)?.[0] || '.webp';
    
    // 기존 파일명에서 날짜와 번호 추출 시도
    // 예: ahnhuija_s1_seukaen-20260126-2_01.webp -> 날짜: 20260126, 번호: 2, 순번: 01
    const dateMatch = originalFileName.match(/(\d{8})/); // YYYYMMDD 형식
    const dateStr = dateMatch ? dateMatch[1] : new Date().toISOString().slice(0, 10).replace(/-/g, '');
    
    // 번호 추출 (하이픈 뒤의 숫자, 예: -2_)
    const numberMatch = originalFileName.match(/-(\d+)_/);
    const docNumber = numberMatch ? numberMatch[1] : (index !== undefined ? String(index) : '1');
    
    // 순번 추출 (마지막 _ 뒤의 숫자, 예: _01)
    const sequenceMatch = originalFileName.match(/_(\d{2})\./);
    const sequence = sequenceMatch ? sequenceMatch[1] : String(index !== undefined ? index : 1).padStart(2, '0');
    
    // 형식: {영문이름}_s0_docs-{날짜}-{번호}_{순번}.{확장자}
    // 예: ahnhuija_s0_docs-20260126-2_01.webp
    const fileName = `${nameEn}_s0_docs-${dateStr}-${docNumber}_${sequence}${originalExt}`;
    
    return {
      fileName,
      scene: 0, // 문서는 장면 0
      type: 'docs'
    };
  }
  
  const scene = classifyStoryScene(originalFileName);
  let type = extractImageType(originalFileName);
  const num = index !== undefined ? index : extractNumber(originalFileName);
  
  // type이 unknown인 경우 원본 파일명에서 영문 변환 시도
  if (type === 'unknown') {
    // 확장자 제거
    const baseName = originalFileName.replace(/\.[^/.]+$/, '');
    
    // 고객 이름 제거 (파일명 앞부분에 고객 이름이 있을 수 있음)
    let cleanedName = baseName;
    if (customer.name) {
      // 한글 이름 제거
      cleanedName = cleanedName.replace(new RegExp(customer.name, 'g'), '');
      // 영문 이름 제거 시도
      const nameEn = translateKoreanToEnglish(customer.name);
      if (nameEn && nameEn !== customer.name) {
        cleanedName = cleanedName.replace(new RegExp(nameEn, 'gi'), '');
      }
    }
    
    // 언더스코어나 하이픈으로 분리된 부분 중 의미있는 부분 추출
    const parts = cleanedName.split(/[_\-\s]+/).filter(part => part.length > 0);
    
    // 각 부분을 영문으로 변환
    const translatedParts = parts.map(part => {
      const translated = translateKoreanToEnglish(part);
      // 한글 제거 및 특수문자 정리
      return translated
        .toLowerCase()
        .replace(/[가-힣\s]/g, '-') // 한글과 공백을 하이픈으로
        .replace(/[^a-z0-9-]/g, '') // 특수문자 제거
        .replace(/-+/g, '-') // 연속 하이픈 제거
        .replace(/^-|-$/g, ''); // 앞뒤 하이픈 제거
    }).filter(part => part.length > 0);
    
    if (translatedParts.length > 0) {
      // 변환된 부분들을 하이픈으로 연결
      const translatedType = translatedParts.join('-');
      if (translatedType && translatedType.length > 0) {
        type = translatedType;
      }
    }
    
    // 여전히 unknown이면 기본값 사용
    if (type === 'unknown') {
      type = 'image';
    }
  }
  
  // 동영상 파일인지 확인
  const isVideo = /\.(mp4|avi|mov|webm|mkv|flv|m4v|3gp|wmv)$/i.test(originalFileName);
  
  // 동영상인데 type이 'image'이면 동영상 타입으로 변경
  if (isVideo && type === 'image') {
    const lowerFileName = originalFileName.toLowerCase();
    if (lowerFileName.includes('시타영상') || lowerFileName.includes('swing-video')) {
      type = 'swing-video';
    } else if (lowerFileName.includes('스윙영상') || lowerFileName.includes('swing-video-outdoor')) {
      type = 'swing-video-outdoor';
    } else {
      type = 'video'; // 기본 동영상 타입
    }
  }
  
  // 확장자 추출 (동영상은 원본 확장자 유지, 이미지는 .webp)
  const originalExt = originalFileName.match(/\.[^/.]+$/)?.[0] || '';
  const extension = isVideo ? originalExt : '.webp';
  
  // 새 형식: {영문이름}_s{장면코드}_{타입}_{번호}.{확장자}
  const fileName = `${nameEn}_s${scene}_${type}_${String(num).padStart(2, '0')}${extension}`;
  
  return {
    fileName,
    scene,
    type
  };
}

/**
 * 최종 파일명 생성 (스토리 기반 장면 형식)
 * 형식: {고객명}-S{장면코드}-{YYYYMMDD}-{순번}.{확장자}
 * 예: ahnhuija-S1-20260127-01.webp (장면1: 행복한 주인공 - 골프장 단독샷)
 * 예: ahnhuija-S6-20260127-01.webp (장면6: 골프장 단독사진, 여러명 등장, 웃는 모습)
 */
export async function generateFinalCustomerImageFileName(
  customer: { 
    name: string; 
    name_en?: string;
    folder_name?: string;
    phone?: string;
  },
  visitDate: string, // YYYY-MM-DD 형식
  typeDetection: {
    scene: number;
    type: string;
  },
  originalFileName: string,
  index: number = 1
): Promise<{ fileName: string; filePath: string; scene: number; type: string }> {
  // 고객 영문 이름
  const customerNameEn = customer.name_en || translateKoreanToEnglish(customer.name);
  const nameEn = customerNameEn.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // 날짜 형식: YYYY-MM-DD → YYYYMMDD
  const dateStr = visitDate.replace(/-/g, '');
  
  // 장면 코드: S1, S2, S3, S4, S5, S6, S7 (서류는 S0 또는 docs)
  const sceneCode = typeDetection.scene > 0 ? `S${typeDetection.scene}` : 'S0';
  
  // 순번 생성
  const sequenceStr = String(index).padStart(2, '0');
  
  // 확장자 (동영상은 원본 확장자 유지, 이미지는 webp)
  const isVideo = /\.(mp4|mov|avi|webm|mkv)$/i.test(originalFileName);
  const originalExt = originalFileName.match(/\.[^/.]+$/)?.[0] || '.webp';
  const extension = isVideo ? originalExt : '.webp';
  
  // 파일명 생성: {고객명}-S{장면코드}-{YYYYMMDD}-{순번}.{확장자}
  const fileName = `${nameEn}-${sceneCode}-${dateStr}-${sequenceStr}${extension}`;
  
  // 고객 폴더명 생성
  const { generateCustomerFolderName } = require('./customer-folder-name-generator');
  const customerFolderName = customer.folder_name || generateCustomerFolderName({
    name: customer.name,
    phone: customer.phone || ''
  });
  
  // 파일 경로
  const filePath = `originals/customers/${customerFolderName}/${visitDate}/${fileName}`;
  
  return {
    fileName,
    filePath,
    scene: typeDetection.scene,
    type: typeDetection.type
  };
}
