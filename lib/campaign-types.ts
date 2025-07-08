// 통합 캠페인 데이터 타입 정의
export interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'ended' | 'planned' | 'draft';
  period: {
    start: string;
    end: string;
  };
  assets: {
    landingPage: string;
    landingPageUrl: string;
    opManual?: string;
    googleAds?: string;
    creatives?: string[];
  };
  settings: {
    phoneNumber: string;
    eventDate: string;
    remainingSlots: number;
    discountRate: number;
    targetAudience?: string;
  };
  metrics: {
    views: number;
    bookings: number;
    inquiries: number;
    conversionRate: number;
    roi?: number;
    costPerAcquisition?: number;
  };
  performance: {
    daily: Array<{
      date: string;
      views: number;
      bookings: number;
      inquiries: number;
    }>;
    hourly?: Array<{
      hour: number;
      views: number;
      conversions: number;
    }>;
  };
  quickActions?: Array<{
    label: string;
    action: string;
    icon?: string;
  }>;
}

export interface CampaignMetrics {
  totalCampaigns: number;
  activeCampaigns: number;
  totalBookings: number;
  totalRevenue: number;
  averageConversionRate: number;
  topPerformer: Campaign | null;
}

export interface CampaignFilters {
  status?: Campaign['status'][];
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
  sortBy?: 'date' | 'performance' | 'status' | 'roi';
  sortOrder?: 'asc' | 'desc';
}

// 캠페인 생성 헬퍼
export function createCampaign(params: {
  month: number;
  year: number;
  name: string;
  discountRate?: number;
  targetAudience?: string;
}): Campaign {
  const { month, year, name, discountRate = 50, targetAudience = '골프 입문자' } = params;
  const monthStr = String(month).padStart(2, '0');
  const lastDay = new Date(year, month, 0).getDate();
  
  return {
    id: `${year}-${monthStr}`,
    name,
    status: 'draft',
    period: {
      start: `${year}-${monthStr}-01`,
      end: `${year}-${monthStr}-${lastDay}`
    },
    assets: {
      landingPage: `/versions/funnel-${year}-${monthStr}.html`,
      landingPageUrl: `/funnel-${year}-${monthStr}`,
    },
    settings: {
      phoneNumber: '080-028-8888',
      eventDate: `${month}월 ${lastDay}일`,
      remainingSlots: 30,
      discountRate,
      targetAudience
    },
    metrics: {
      views: 0,
      bookings: 0,
      inquiries: 0,
      conversionRate: 0,
      roi: 0,
      costPerAcquisition: 0
    },
    performance: {
      daily: [],
      hourly: []
    },
    quickActions: [
      { label: '페이지 편집', action: 'edit_page', icon: 'edit' },
      { label: 'OP 메뉴얼', action: 'view_manual', icon: 'book' },
      { label: '성과 분석', action: 'analyze', icon: 'chart' },
      { label: '복제하기', action: 'duplicate', icon: 'copy' }
    ]
  };
}

// 캠페인 상태 업데이트
export function updateCampaignStatus(campaigns: Campaign[]): Campaign[] {
  const today = new Date();
  
  return campaigns.map(campaign => {
    const startDate = new Date(campaign.period.start);
    const endDate = new Date(campaign.period.end);
    
    let status: Campaign['status'] = campaign.status;
    
    if (campaign.status !== 'draft') {
      if (today < startDate) {
        status = 'planned';
      } else if (today >= startDate && today <= endDate) {
        status = 'active';
      } else if (today > endDate) {
        status = 'ended';
      }
    }
    
    return { ...campaign, status };
  });
}

// 캠페인 성과 계산
export function calculateCampaignMetrics(campaigns: Campaign[]): CampaignMetrics {
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const totalBookings = campaigns.reduce((sum, c) => sum + c.metrics.bookings, 0);
  const totalViews = campaigns.reduce((sum, c) => sum + c.metrics.views, 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + (c.metrics.bookings * 1000000), 0); // 임시 계산
  
  const averageConversionRate = totalViews > 0 
    ? (totalBookings / totalViews * 100) 
    : 0;
  
  const topPerformer = campaigns
    .filter(c => c.metrics.views > 0)
    .sort((a, b) => b.metrics.conversionRate - a.metrics.conversionRate)[0] || null;
  
  return {
    totalCampaigns: campaigns.length,
    activeCampaigns,
    totalBookings,
    totalRevenue,
    averageConversionRate,
    topPerformer
  };
}

// 모의 실시간 데이터 생성 (개발용)
export function generateMockPerformanceData(campaign: Campaign): Campaign {
  const today = new Date();
  const startDate = new Date(campaign.period.start);
  const days = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const daily = Array.from({ length: Math.min(days, 30) }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    return {
      date: date.toISOString().split('T')[0],
      views: Math.floor(Math.random() * 500) + 100,
      bookings: Math.floor(Math.random() * 20) + 1,
      inquiries: Math.floor(Math.random() * 30) + 5
    };
  });
  
  const hourly = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    views: Math.floor(Math.random() * 100) + 10,
    conversions: Math.floor(Math.random() * 5)
  }));
  
  return {
    ...campaign,
    performance: { daily, hourly }
  };
}
