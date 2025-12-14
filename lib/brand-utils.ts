/**
 * 브랜드 관련 유틸리티 함수
 * 브랜드 등록일 기준으로 연도 계산
 */

// 브랜드 등록일: 2003년 7월 31일 (상표권 등록일 기준)
export const BRAND_FOUNDED_YEAR = 2003;
export const BRAND_FOUNDED_DATE = new Date(2003, 6, 31); // 7월 = 6 (0-based)

/**
 * 현재 연도 기준으로 브랜드 경력 연수 계산
 * @returns 브랜드 경력 연수 (예: 2025년이면 22년)
 */
export function getBrandYears(): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  return currentYear - BRAND_FOUNDED_YEAR;
}

/**
 * 브랜드 경력 연수를 한국어로 포맷팅
 * @param includeLabel 라벨 포함 여부 (예: "22년" vs "22")
 * @returns 포맷팅된 연수 문자열
 */
export function formatBrandYears(includeLabel: boolean = true): string {
  const years = getBrandYears();
  return includeLabel ? `${years}년` : `${years}`;
}

/**
 * "X년 전" 형식으로 포맷팅
 * @returns "22년 전" 형식의 문자열
 */
export function formatBrandYearsAgo(): string {
  const years = getBrandYears();
  return `${years}년 전`;
}

/**
 * "X년간" 형식으로 포맷팅
 * @returns "22년간" 형식의 문자열
 */
export function formatBrandYearsDuration(): string {
  const years = getBrandYears();
  return `${years}년간`;
}

/**
 * "X년의 여정" 형식으로 포맷팅
 * @returns "22년의 여정" 형식의 문자열
 */
export function formatBrandYearsJourney(): string {
  const years = getBrandYears();
  return `${years}년의 여정`;
}

/**
 * "X년 전통" 형식으로 포맷팅
 * @returns "22년 전통" 형식의 문자열
 */
export function formatBrandYearsTradition(): string {
  const years = getBrandYears();
  return `${years}년 전통`;
}

/**
 * "마쓰구 X년 비거리 연구 노하우" 형식으로 포맷팅
 * @returns "마쓰구 22년 비거리 연구 노하우" 형식의 문자열
 */
export function formatBrandDistanceResearch(): string {
  const years = getBrandYears();
  return `마쓰구 ${years}년 비거리 연구 노하우`;
}

