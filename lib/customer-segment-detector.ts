/**
 * 고객 세그먼트 감지 유틸리티
 * 고객의 방문 횟수, VIP 등급 등을 기반으로 세그먼트를 판단
 */

/**
 * 고객 세그먼트 타입
 */
export type CustomerSegment = 'new' | 'returning' | 'vip';

/**
 * 고객 정보 인터페이스
 */
export interface CustomerInfo {
  visit_count?: number;
  customer_grade?: string;
  last_visit_date?: string;
}

/**
 * 고객 정보를 기반으로 세그먼트를 감지
 * @param customer - 고객 정보 객체
 * @returns 고객 세그먼트
 */
export function detectCustomerSegment(customer: CustomerInfo | null): CustomerSegment {
  if (!customer) return 'new';

  // VIP 등급 확인
  const grade = (customer.customer_grade || '').toLowerCase();
  if (['gold', 'vip', 'platinum'].includes(grade)) {
    return 'vip';
  }

  // 방문 횟수 확인
  const visitCount = customer.visit_count || 0;
  if (visitCount > 0) {
    return 'returning';
  }

  return 'new';
}

/**
 * 세그먼트별 맞춤 메시지 생성
 * @param segment - 고객 세그먼트
 * @param customer - 고객 정보
 * @returns 맞춤 메시지 객체
 */
export function getSegmentMessage(segment: CustomerSegment, customer: CustomerInfo) {
  const messages = {
    new: {
      greeting: '골프 비거리로 고민이신가요?',
      valueProp: '22년 전통의 맞춤형 드라이버 전문 브랜드',
      cta: '무료 시타로 직접 확인하기',
      tone: '신뢰감과 전문성',
    },
    returning: {
      greeting: '다시 방문해주셔서 감사합니다',
      valueProp: customer.last_visit_date 
        ? `마지막 방문일: ${customer.last_visit_date} (총 ${customer.visit_count}회 방문)`
        : `총 ${customer.visit_count}회 방문해주신 고객님`,
      cta: '업그레이드 혜택 확인하기',
      tone: '친근하고 감사의 마음',
    },
    vip: {
      greeting: 'VIP 고객님께 특별한 혜택을 드립니다',
      valueProp: `${(customer.customer_grade || '').toUpperCase()} 등급 고객님을 위한 프리미엄 서비스`,
      cta: 'VIP 전용 예약 시간 확인하기',
      tone: '프리미엄과 특별함',
    },
  };

  return messages[segment] || messages.new;
}

/**
 * 세그먼트별 랜딩 페이지 경로
 * @param segment - 고객 세그먼트
 * @param serviceType - 서비스 타입
 * @returns 랜딩 페이지 경로
 */
export function getLandingPagePath(segment: CustomerSegment, serviceType?: string): string {
  const basePaths = {
    new: '/try-a-massgoo',
    returning: '/try-a-massgoo',
    vip: '/try-a-massgoo',
  };

  if (serviceType === 'check-distance') {
    return '/booking/check-distance';
  }

  return basePaths[segment] || '/try-a-massgoo';
}

/**
 * 세그먼트별 UI 커스터마이징 옵션
 * @param segment - 고객 세그먼트
 * @returns UI 옵션
 */
export function getSegmentUIOptions(segment: CustomerSegment) {
  const options = {
    new: {
      showTrustBadges: true,
      showTestimonials: true,
      showProcessSteps: true,
      primaryColor: 'red',
    },
    returning: {
      showVisitHistory: true,
      showUpgradeOptions: true,
      showLoyaltyBenefits: true,
      primaryColor: 'blue',
    },
    vip: {
      showVIPBadge: true,
      showPremiumServices: true,
      showPriorityBooking: true,
      primaryColor: 'purple',
    },
  };

  return options[segment] || options.new;
}


