// 캠페인 관련 유틸리티 함수들

/**
 * 남은 인원 수를 실시간으로 계산
 * @param startDate 캠페인 시작일
 * @param endDate 캠페인 종료일  
 * @param totalSlots 전체 가능 인원
 * @param actualBookings 실제 예약 수 (DB에서 가져온 값)
 * @returns 남은 인원 수
 */
export function calculateRemainingSlots(
  startDate: string,
  endDate: string,
  totalSlots: number,
  actualBookings?: number
): number {
  // 실제 예약 수가 있으면 그것을 사용
  if (actualBookings !== undefined) {
    return Math.max(0, totalSlots - actualBookings);
  }

  // 없으면 날짜 기반 자동 감소 (임시)
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  
  // 캠페인 시작 전
  if (today < start) {
    return totalSlots;
  }
  
  // 캠페인 종료 후
  if (today > end) {
    return 0;
  }
  
  // 진행 중인 캠페인 - 날짜별 비례 감소
  const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const daysElapsed = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const progressRatio = daysElapsed / totalDays;
  
  // 남은 인원 계산 (점진적 감소)
  const remaining = Math.floor(totalSlots * (1 - progressRatio));
  
  return Math.max(0, remaining);
}

/**
 * 캠페인 진행률 계산
 * @param startDate 캠페인 시작일
 * @param endDate 캠페인 종료일
 * @returns 진행률 (0~100)
 */
export function calculateCampaignProgress(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  
  if (today < start) return 0;
  if (today > end) return 100;
  
  const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const daysElapsed = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  return Math.round((daysElapsed / totalDays) * 100);
}

/**
 * D-Day 계산
 * @param endDate 캠페인 종료일
 * @returns D-Day 문자열
 */
export function calculateDDay(endDate: string): string {
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return '종료됨';
  if (diffDays === 0) return 'D-Day';
  return `D-${diffDays}`;
}

/**
 * Google Ads 캠페인 ID 추출
 * @param googleAdsUrl Google Ads URL
 * @returns 캠페인 ID 또는 null
 */
export function extractGoogleAdsCampaignId(googleAdsUrl?: string): string | null {
  if (!googleAdsUrl) return null;
  
  const match = googleAdsUrl.match(/campaignId=(\d+)/);
  return match ? match[1] : null;
}

/**
 * 캠페인 URL 생성
 * @param baseUrl 기본 URL
 * @param utmParams UTM 파라미터
 * @returns 전체 URL
 */
export function generateCampaignUrl(
  baseUrl: string,
  utmParams: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  }
): string {
  const url = new URL(baseUrl, window.location.origin);
  
  if (utmParams.source) url.searchParams.set('utm_source', utmParams.source);
  if (utmParams.medium) url.searchParams.set('utm_medium', utmParams.medium);
  if (utmParams.campaign) url.searchParams.set('utm_campaign', utmParams.campaign);
  if (utmParams.term) url.searchParams.set('utm_term', utmParams.term);
  if (utmParams.content) url.searchParams.set('utm_content', utmParams.content);
  
  return url.toString();
}
