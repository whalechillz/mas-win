// 전화번호 포맷 유틸리티 함수

/**
 * 전화번호 포맷팅 (하이픈 추가)
 * @param phone - 전화번호 문자열
 * @returns 포맷된 전화번호 (예: 010-1234-5678)
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  
  // 숫자만 추출
  const numbers = phone.replace(/[^0-9]/g, '');
  
  // 전화번호 길이에 따라 포맷팅
  if (numbers.length === 11) {
    // 휴대전화 (010-xxxx-xxxx)
    return numbers.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  } else if (numbers.length === 10) {
    // 지역번호가 2자리인 경우 (02-xxxx-xxxx)
    if (numbers.startsWith('02')) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
    }
    // 지역번호가 3자리인 경우 (031-xxx-xxxx)
    return numbers.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  } else if (numbers.length === 9) {
    // 서울 지역번호 (02-xxx-xxxx)
    return numbers.replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2-$3');
  } else if (numbers.length === 8) {
    // 지역번호 없는 경우 (xxxx-xxxx)
    return numbers.replace(/(\d{4})(\d{4})/, '$1-$2');
  }
  
  return numbers;
}

/**
 * 전화번호에서 하이픈 제거
 * @param phone - 전화번호 문자열
 * @returns 숫자만 있는 전화번호
 */
export function removePhoneHyphens(phone: string | null | undefined): string {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '');
}

/**
 * 전화번호 입력 시 자동 포맷팅
 * @param value - 입력된 값
 * @param previousValue - 이전 값
 * @returns 포맷된 전화번호
 */
export function formatPhoneNumberOnInput(value: string, previousValue: string): string {
  // 백스페이스 처리
  if (value.length < previousValue.length) {
    return value;
  }
  
  // 숫자만 추출
  const numbers = value.replace(/[^0-9]/g, '');
  
  // 길이 제한
  if (numbers.length > 11) {
    return previousValue;
  }
  
  // 포맷팅
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  } else if (numbers.length <= 11) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
  }
  
  return numbers;
}

/**
 * 전화번호 유효성 검사
 * @param phone - 전화번호 문자열
 * @returns 유효한 전화번호인지 여부
 */
export function isValidPhoneNumber(phone: string | null | undefined): boolean {
  if (!phone) return false;
  
  const numbers = removePhoneHyphens(phone);
  
  // 한국 전화번호 패턴
  // 휴대전화: 010, 011, 016, 017, 018, 019
  // 일반전화: 02(서울), 031~033, 041~044, 051~055, 061~064
  const mobilePattern = /^01[016789]\d{7,8}$/;
  const landlinePattern = /^0(2|3[1-3]|4[1-4]|5[1-5]|6[1-4])\d{7,8}$/;
  
  return mobilePattern.test(numbers) || landlinePattern.test(numbers);
}

/**
 * 휴대전화 번호인지 확인
 * @param phone - 전화번호 문자열
 * @returns 휴대전화 번호인지 여부
 */
export function isMobileNumber(phone: string | null | undefined): boolean {
  if (!phone) return false;
  
  const numbers = removePhoneHyphens(phone);
  const mobilePattern = /^01[016789]\d{7,8}$/;
  
  return mobilePattern.test(numbers);
}

/**
 * 전화번호 마스킹 처리
 * @param phone - 전화번호 문자열
 * @param showLast - 마지막 4자리 표시 여부
 * @returns 마스킹된 전화번호 (예: 010-****-5678)
 */
export function maskPhoneNumber(phone: string | null | undefined, showLast: boolean = true): string {
  if (!phone) return '';
  
  const formatted = formatPhoneNumber(phone);
  const parts = formatted.split('-');
  
  if (parts.length === 3) {
    if (showLast) {
      return `${parts[0]}-****-${parts[2]}`;
    } else {
      return `${parts[0]}-****-****`;
    }
  } else if (parts.length === 2) {
    return `${parts[0]}-****`;
  }
  
  return formatted;
}

