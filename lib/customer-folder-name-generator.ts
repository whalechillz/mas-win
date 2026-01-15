/**
 * 고객 폴더명 생성 유틸리티
 * 형식: {영문이름}-{전화번호마지막4자리} 또는 {영문이름}-{고객ID}
 */

import { translateKoreanToEnglish } from './korean-to-english-translator';

/**
 * 고객 폴더명 생성
 * 형식: {영문이름}-{전화번호마지막4자리} 또는 {영문이름}-{고객ID}
 */
export function generateCustomerFolderName(
  customer: { name: string; phone?: string; id?: number }
): string {
  const nameEn = translateKoreanToEnglish(customer.name);
  
  // 전화번호가 있으면: {영문이름}-{전화번호마지막4자리}
  if (customer.phone) {
    const phoneLast4 = customer.phone.replace(/-/g, '').slice(-4);
    return `${nameEn}-${phoneLast4}`;
  }
  
  // 전화번호가 없으면: {영문이름}-{고객ID}
  if (customer.id) {
    return `${nameEn}-${String(customer.id).padStart(4, '0')}`;
  }
  
  // ID도 없으면: {영문이름}-unknown
  return `${nameEn}-unknown`;
}

/**
 * 고객 이름 영문 변환
 */
export function getCustomerNameEn(name: string): string {
  return translateKoreanToEnglish(name);
}
