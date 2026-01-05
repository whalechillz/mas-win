/**
 * 한글 파일명을 영문으로 변환하는 유틸리티 함수
 * Supabase Storage는 한글 파일명을 key로 사용할 수 없으므로 변환이 필요합니다.
 */

// 한글-영문 매핑 테이블 (골프/고객 관련 키워드)
const KOREAN_TO_ENGLISH_MAP: Record<string, string> = {
  // 골프 용어
  '골프': 'golf',
  '드라이버': 'driver',
  '아이언': 'iron',
  '퍼터': 'putter',
  '웨지': 'wedge',
  '우드': 'wood',
  '골프장': 'golf-course',
  '골프공': 'golf-ball',
  '골프백': 'golf-bag',
  '골프화': 'golf-shoes',
  '골프장갑': 'golf-glove',
  '스윙': 'swing',
  '피팅': 'fitting',
  '상담': 'consultation',
  '시타': 'swing',
  '시타상담': 'swing-consultation',
  '피팅상담': 'fitting-consultation',
  
  // 고객 관련
  '고객': 'customer',
  '방문': 'visit',
  '구매': 'purchase',
  'A/S': 'service',
  '출고': 'delivery',
  
  // 일반 용어
  '이미지': 'image',
  '사진': 'photo',
  '영상': 'video',
  '동영상': 'video',
  '파일': 'file',
  '업로드': 'upload',
  '다운로드': 'download',
  
  // 인명 (자주 사용되는 이름)
  '박영구': 'park-younggu',
  '오길환': 'oh-gilhwan',
  '김종철': 'kim-jongcheol',
  '구수회': 'gu-suhoe',
  '신재식': 'shin-jaesik',
  '채현정': 'chae-hyeonjeong',
  '이남구': 'lee-namgu',
  '강훈': 'kang-hun',
  '구영훈': 'gu-youngun',
  '최태환': 'choi-taehwan',
  '김흥국': 'kim-heunguk',
  '이기환': 'lee-gihwan',
  '김영철': 'kim-youngcheol',
  '권장우': 'kwon-jangwoo',
  '김정무': 'kim-jeongmu',
  '이성수': 'lee-seongsu',
  '장기범': 'jang-gibeom',
  '이성배': 'lee-seongbae',
  '박동렬': 'park-dongryeol',
  '이희철': 'lee-heecheol',
  '차재욱': 'cha-jaeuk',
  '이경순': 'lee-gyeongsun',
  '김석구': 'kim-seokgu',
  '허우범': 'heo-woobeom',
  '오성제': 'oh-seongje',
  '유봉환': 'yoo-bonghwan',
};

/**
 * 한글 파일명을 영문으로 변환하는 함수
 * @param fileName 원본 파일명
 * @returns 변환된 파일명 (한글이 제거되거나 영문으로 변환됨)
 */
export function sanitizeKoreanFileName(fileName: string): string {
  if (!fileName) {
    return `image-${Date.now()}.jpg`;
  }

  // 확장자 분리
  const lastDotIndex = fileName.lastIndexOf('.');
  const extension = lastDotIndex > -1 ? fileName.substring(lastDotIndex + 1).toLowerCase() : 'jpg';
  const nameWithoutExt = lastDotIndex > -1 ? fileName.substring(0, lastDotIndex) : fileName;

  // 한글이 없으면 그대로 반환 (특수문자만 정리)
  if (!/[가-힣]/.test(nameWithoutExt)) {
    const sanitized = nameWithoutExt
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
    return sanitized ? `${sanitized}.${extension}` : `image-${Date.now()}.${extension}`;
  }

  // 한글-영문 매핑 적용
  let sanitized = nameWithoutExt;
  
  // 긴 매핑부터 적용 (예: '시타상담' → 'swing-consultation')
  const sortedEntries = Object.entries(KOREAN_TO_ENGLISH_MAP).sort((a, b) => b[0].length - a[0].length);
  
  for (const [korean, english] of sortedEntries) {
    if (sanitized.includes(korean)) {
      sanitized = sanitized.replace(new RegExp(korean, 'g'), english);
    }
  }

  // 남은 한글 제거 및 특수문자 처리
  sanitized = sanitized
    .replace(/[가-힣]/g, '') // 한글 제거
    .replace(/[^a-zA-Z0-9-_]/g, '-') // 특수문자를 하이픈으로 변환
    .replace(/-+/g, '-') // 연속된 하이픈을 하나로
    .replace(/^-|-$/g, '') // 앞뒤 하이픈 제거
    .toLowerCase();

  // 빈 이름이면 타임스탬프 사용
  const finalName = sanitized || `image-${Date.now()}`;
  return `${finalName}.${extension}`;
}

/**
 * 파일명에 한글이 포함되어 있는지 확인
 * @param fileName 파일명
 * @returns 한글 포함 여부
 */
export function hasKoreanInFileName(fileName: string): boolean {
  if (!fileName) return false;
  return /[가-힣]/.test(fileName);
}

