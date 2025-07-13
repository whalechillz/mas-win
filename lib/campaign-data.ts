import { calculateRemainingSlots } from './campaign-utils';

// 캠페인 데이터 타입 정의
export interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'ended' | 'planned';
  period: {
    start: string;
    end: string;
  };
  files: {
    landingPage: string;
    landingPageUrl: string;
    opManual?: string;
    googleAds?: string;
  };
  settings: {
    phoneNumber: string;
    eventDate: string;
    remainingSlots: number;
    discountRate: number;
  };
  metrics: {
    views: number;
    bookings: number;
    inquiries: number;
    conversionRate: number;
  };
}

// 통합된 캠페인 데이터 (DB 연동 전까지 사용)
export const campaignsData: Campaign[] = [
  {
    id: "2025-07",
    name: "여름 특별 캠페인",
    status: "active",
    period: {
      start: "2025-07-01",
      end: "2025-07-31"
    },
    files: {
      landingPage: "/versions/funnel-2025-07-complete.html",
      landingPageUrl: "/funnel-2025-07",
      opManual: "/op-manual-2025-07.html",
      googleAds: "https://ads.google.com/aw/campaigns?campaignId=22712889806"
    },
    settings: {
      phoneNumber: "080-028-8888",
      eventDate: "7월 31일",
      remainingSlots: calculateRemainingSlots('2025-07-01', '2025-07-31', 20),
      discountRate: 50
    },
    metrics: {
      views: 1523,
      bookings: 87,
      inquiries: 245,
      conversionRate: 5.7
    }
  },
  {
    id: "2025-06",
    name: "프라임타임 캠페인",
    status: "ended",
    period: {
      start: "2025-06-01",
      end: "2025-06-30"
    },
    files: {
      landingPage: "/versions/funnel-2025-06.html",
      landingPageUrl: "/funnel-2025-06",
      opManual: "/docs/op-manuals/2025-06-프라임타임/",
      googleAds: "/google_ads/2025.06.11.프라임타임/"
    },
    settings: {
      phoneNumber: "080-028-8888",
      eventDate: "6월 30일",
      remainingSlots: 0,
      discountRate: 40
    },
    metrics: {
      views: 2341,
      bookings: 134,
      inquiries: 389,
      conversionRate: 5.7
    }
  },
  {
    id: "2025-05",
    name: "가정의 달 캠페인",
    status: "ended",
    period: {
      start: "2025-05-01",
      end: "2025-05-31"
    },
    files: {
      landingPage: "/versions/funnel-2025-05.html",
      landingPageUrl: "/funnel-2025-05",
      opManual: "/docs/op-manuals/2025-05-가정의달/",
      googleAds: "/google_ads/2025.05.01.가정의달/"
    },
    settings: {
      phoneNumber: "080-028-8888",
      eventDate: "5월 31일",
      remainingSlots: 0,
      discountRate: 30
    },
    metrics: {
      views: 2897,
      bookings: 156,
      inquiries: 412,
      conversionRate: 5.4
    }
  }
];

// 캠페인 생성 헬퍼 함수
export function createNewCampaign({
  month,
  year,
  name,
  discountRate = 50
}: {
  month: number;
  year: number;
  name: string;
  discountRate?: number;
}): Campaign {
  const monthStr = String(month).padStart(2, '0');
  const lastDay = new Date(year, month, 0).getDate();
  
  return {
    id: `${year}-${monthStr}`,
    name: name,
    status: "planned",
    period: {
      start: `${year}-${monthStr}-01`,
      end: `${year}-${monthStr}-${lastDay}`
    },
    files: {
      landingPage: `/versions/funnel-${year}-${monthStr}.html`,
      landingPageUrl: `/funnel-${year}-${monthStr}`,
      opManual: `/docs/op-manuals/${year}-${monthStr}-${name}/`,
      googleAds: undefined
    },
    settings: {
      phoneNumber: "080-028-8888",
      eventDate: `${month}월 ${lastDay}일`,
      remainingSlots: 30,
      discountRate: discountRate
    },
    metrics: {
      views: 0,
      bookings: 0,
      inquiries: 0,
      conversionRate: 0
    }
  };
}

// 현재 활성 캠페인 가져오기
export function getActiveCampaign(): Campaign | undefined {
  return campaignsData.find(c => c.status === "active");
}

// 캠페인 상태 업데이트 (자동)
export function updateCampaignStatuses(): void {
  const today = new Date();
  campaignsData.forEach(campaign => {
    const endDate = new Date(campaign.period.end);
    const startDate = new Date(campaign.period.start);
    
    if (endDate < today && campaign.status !== "ended") {
      campaign.status = "ended";
    } else if (startDate <= today && endDate >= today && campaign.status === "planned") {
      campaign.status = "active";
    }
  });
}

// 캠페인별 성과 계산
export function calculateCampaignROI(campaign: Campaign): {
  roi: number;
  costPerAcquisition: number;
  averageValue: number;
} {
  const totalLeads = campaign.metrics.bookings + campaign.metrics.inquiries;
  const estimatedCost = 1000000; // 임시 값 (실제로는 Google Ads API에서 가져와야 함)
  const averageValue = 1000000; // 평균 고객 가치
  
  const revenue = campaign.metrics.bookings * averageValue;
  const roi = ((revenue - estimatedCost) / estimatedCost) * 100;
  const costPerAcquisition = totalLeads > 0 ? estimatedCost / totalLeads : 0;
  
  return {
    roi: Math.round(roi),
    costPerAcquisition: Math.round(costPerAcquisition),
    averageValue
  };
}