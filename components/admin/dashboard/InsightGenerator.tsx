import React, { useMemo } from 'react';
import { Campaign } from '../../../lib/campaign-types';

interface InsightGeneratorProps {
  campaigns: Campaign[];
  bookings: any[];
  contacts: any[];
}

export function InsightGenerator({ campaigns, bookings, contacts }: InsightGeneratorProps) {
  const insights = useMemo(() => {
    const activeCampaigns = campaigns.filter(c => c.status === 'active');
    const activeCampaignData = campaigns.filter(c => c.id === '2025-07' && c.metrics.bookings > 0);
    const totalBookings = bookings.length;
    const totalContacts = contacts.length;
    
    // 데이터가 충분히 없으면 기본 인사이트만 표시
    if (totalBookings < 10 && totalContacts < 10) {
      return [
        {
          type: 'info',
          title: '데이터 수집 중',
          content: '충분한 데이터가 수집되면 더 정확한 AI 인사이트를 제공해드리겠습니다.',
          color: 'blue'
        },
        {
        type: 'campaign',
        title: '현재 진행 중인 캠페인',
        content: activeCampaignData.length > 0 
        ? `"${activeCampaignData[0].name}"이 ${bookings.length}건의 예약을 달성했습니다.`
        : '현재 활성 캠페인의 성과를 모니터링하고 있습니다.',
        color: 'green'
        }
      ];
    }
    
    // 시간대별 분석
    const hourlyContacts = contacts.reduce((acc, contact) => {
      const hour = new Date(contact.created_at).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    // 가장 활발한 시간대 찾기
    const peakHour = Object.entries(hourlyContacts)
      .sort(([, a], [, b]) => b - a)[0];
    
    // 캠페인별 성과 분석
    const bestCampaign = campaigns
      .filter(c => c.metrics.conversionRate > 0)
      .sort((a, b) => b.metrics.conversionRate - a.metrics.conversionRate)[0];
    
    // 주간 트렌드 분석
    const thisWeekBookings = bookings.filter(b => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(b.created_at) > weekAgo;
    }).length;
    
    const lastWeekBookings = bookings.filter(b => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(b.created_at) > twoWeeksAgo && new Date(b.created_at) <= weekAgo;
    }).length;
    
    const weeklyGrowth = lastWeekBookings > 0 
      ? ((thisWeekBookings - lastWeekBookings) / lastWeekBookings * 100).toFixed(1)
      : '0';
    
    // 스윙 스타일 분석
    const swingStyles = bookings.reduce((acc, booking) => {
      if (booking.swing_style) {
        acc[booking.swing_style] = (acc[booking.swing_style] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const dominantStyle = Object.entries(swingStyles)
      .sort(([, a], [, b]) => b - a)[0];
    
    // 전환율 예측
    const conversionRate = totalBookings > 0 && totalContacts > 0
      ? (totalBookings / (totalBookings + totalContacts) * 100).toFixed(1)
      : '0';
    
    // 요일별 분석
    const dayOfWeekBookings = bookings.reduce((acc, booking) => {
      const day = new Date(booking.created_at).getDay();
      const dayName = ['일', '월', '화', '수', '목', '금', '토'][day];
      acc[dayName] = (acc[dayName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const bestDay = Object.entries(dayOfWeekBookings)
      .sort(([, a], [, b]) => b - a)[0];
    
    // 클럽 선택 우선순위 분석
    const priorities = bookings.reduce((acc, booking) => {
      if (booking.priority) {
        acc[booking.priority] = (acc[booking.priority] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const topPriority = Object.entries(priorities)
      .sort(([, a], [, b]) => b - a)[0];
    
    // ROI 분석
    const avgROI = campaigns
      .filter(c => c.metrics.bookings > 0)
      .reduce((sum, c) => {
        const revenue = c.metrics.bookings * 1000000;
        const cost = c.metrics.costPerAcquisition * c.metrics.bookings;
        return sum + (cost > 0 ? ((revenue - cost) / cost * 100) : 0);
      }, 0) / campaigns.filter(c => c.metrics.bookings > 0).length || 0;
    
    return [
      {
        type: 'performance',
        title: '최고 성과 캠페인',
        content: bestCampaign && totalBookings > 0
          ? `"${bestCampaign.name}"이 전환율 ${conversionRate}%로 가장 높은 성과를 보이고 있습니다. 현재까지 ${totalBookings}건의 예약을 달성했습니다.`
          : '현재 활성 캠페인의 성과 데이터를 수집 중입니다.',
        color: 'blue'
      },
      {
        type: 'timing',
        title: '최적 상담 시간',
        content: peakHour 
          ? `${peakHour[0]}시에 가장 많은 문의가 발생합니다 (${peakHour[1]}건). 이 시간대에 상담 인력을 집중 배치하면 전환율을 높일 수 있습니다.`
          : '시간대별 문의 패턴을 분석 중입니다.',
        color: 'green'
      },
      {
        type: 'trend',
        title: '주간 성장 트렌드',
        content: thisWeekBookings > lastWeekBookings
          ? `이번 주 예약이 지난주 대비 ${weeklyGrowth}% 증가했습니다. 현재 추세가 지속되면 월간 목표를 초과 달성할 가능성이 높습니다.`
          : `이번 주 예약이 지난주 대비 ${Math.abs(Number(weeklyGrowth))}% 감소했습니다. 캠페인 강화가 필요합니다.`,
        color: Number(weeklyGrowth) > 0 ? 'purple' : 'amber'
      },
      {
        type: 'customer',
        title: '고객 선호 분석',
        content: dominantStyle
          ? `${dominantStyle[0]} 스타일 고객이 전체의 ${(dominantStyle[1] / totalBookings * 100).toFixed(1)}%를 차지합니다. 이 고객층을 위한 맞춤 마케팅을 강화하세요.`
          : '고객 스윙 스타일 데이터를 분석 중입니다.',
        color: 'indigo'
      },
      {
        type: 'dayOfWeek',
        title: '요일별 예약 패턴',
        content: bestDay
          ? `${bestDay[0]}요일에 가장 많은 예약이 발생합니다 (${bestDay[1]}건). 이 요일에 프로모션을 집중하면 효과를 극대화할 수 있습니다.`
          : '요일별 예약 패턴을 분석 중입니다.',
        color: 'green'
      },
      {
        type: 'priority',
        title: '클럽 선택 우선순위',
        content: topPriority
          ? `고객들의 ${(topPriority[1] / totalBookings * 100).toFixed(1)}%가 "${topPriority[0]}"를 가장 중요하게 생각합니다. 이를 강조한 마케팅 메시지가 효과적일 것입니다.`
          : '클럽 선택 우선순위 데이터를 수집 중입니다.',
        color: 'purple'
      },
      {
        type: 'roi',
        title: 'ROI 분석',
        content: avgROI > 0
          ? `현재 캠페인들의 평균 ROI는 ${avgROI.toFixed(1)}%입니다. ${avgROI > 200 ? '매우 우수한 성과를 보이고 있습니다.' : '예산 효율성을 높일 여지가 있습니다.'}`
          : '캠페인 ROI 데이터를 수집 중입니다.',
        color: 'amber'
      }
    ];
  }, [campaigns, bookings, contacts]);
  
  // 매 렌더링마다 2-3개의 인사이트를 무작위로 선택
  const selectedInsights = useMemo(() => {
    const shuffled = [...insights].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }, [insights]);
  
  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-50 border-blue-500 text-blue-900',
      green: 'bg-green-50 border-green-500 text-green-900',
      purple: 'bg-purple-50 border-purple-500 text-purple-900',
      amber: 'bg-amber-50 border-amber-500 text-amber-900',
      indigo: 'bg-indigo-50 border-indigo-500 text-indigo-900'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };
  
  const getTextColorClasses = (color: string) => {
    const colorMap = {
      blue: 'text-blue-700',
      green: 'text-green-700',
      purple: 'text-purple-700',
      amber: 'text-amber-700',
      indigo: 'text-indigo-700'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };
  
  return (
    <div className="space-y-4">
      {selectedInsights.map((insight, index) => {
        const bgColors = getColorClasses(insight.color);
        const textColor = getTextColorClasses(insight.color);
        
        return (
          <div 
            key={index}
            className={`p-4 rounded-lg border-l-4 ${bgColors}`}
          >
            <p className="font-medium">{insight.title}</p>
            <p className={`text-sm mt-1 ${textColor}`}>
              {insight.content}
            </p>
          </div>
        );
      })}
    </div>
  );
}
