// 권한별 접근 제어 설정
export const PERMISSIONS = {
  admin: {
    // 관리자만 접근 가능
    dashboard: {
      revenue: true,          // 매출 데이터
      costs: true,           // 비용 데이터
      profit: true,          // 수익률
      allCampaigns: true,    // 모든 캠페인
      allBookings: true,     // 모든 예약
      allContacts: true,     // 모든 상담
      teamPerformance: true, // 팀원 성과
      settings: true,        // 시스템 설정
    },
    actions: {
      createCampaign: true,  // 캠페인 생성
      deleteCampaign: true,  // 캠페인 삭제
      editPricing: true,     // 가격 수정
      viewAllData: true,     // 모든 데이터 조회
      exportData: true,      // 데이터 내보내기
      manageUsers: true,     // 사용자 관리
    }
  },
  staff: {
    // 직원 접근 가능
    dashboard: {
      revenue: false,        // 매출 숨김
      costs: false,          // 비용 숨김
      profit: false,         // 수익률 숨김
      allCampaigns: false,   // 자신의 캠페인만
      allBookings: false,    // 자신이 처리한 예약만
      allContacts: false,    // 자신이 담당한 상담만
      teamPerformance: false,// 개인 성과만
      settings: false,       // 설정 접근 불가
    },
    actions: {
      createCampaign: false, // 캠페인 생성 불가
      deleteCampaign: false, // 캠페인 삭제 불가
      editPricing: false,    // 가격 수정 불가
      viewAllData: false,    // 제한된 데이터만
      exportData: false,     // 내보내기 불가
      manageUsers: false,    // 사용자 관리 불가
    }
  }
};

// 사용 예시
export function canAccess(userRole: string, feature: string): boolean {
  return PERMISSIONS[userRole]?.dashboard[feature] || false;
}

export function canPerform(userRole: string, action: string): boolean {
  return PERMISSIONS[userRole]?.actions[action] || false;
}