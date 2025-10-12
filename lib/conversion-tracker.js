// 전환 추적 시스템
// UTM 파라미터 기반 전환 이벤트 추적

// 전환 이벤트 타입
export const CONVERSION_EVENTS = {
  VIEW: 'view',
  CLICK: 'click',
  CONVERSION: 'conversion',
  BOUNCE: 'bounce',
  EXIT: 'exit'
};

// 전환 목표 타입
export const CONVERSION_GOALS = {
  HOMEPAGE_VISIT: 'homepage_visit',
  CONSULTATION_REQUEST: 'consultation_request',
  PURCHASE: 'purchase',
  FUNNEL_VISIT: 'funnel_visit',
  PHONE_CALL: 'phone_call',
  KAKAO_MESSAGE: 'kakao_message'
};

// 전환 이벤트 추적
export async function trackConversion(event) {
  try {
    // 실제로는 Supabase나 다른 DB에 저장
    const conversionData = {
      content_id: event.contentId,
      channel: event.channel,
      event_type: event.type,
      user_id: event.userId || generateAnonymousId(),
      utm_params: event.utmParams,
      conversion_value: event.value || 0,
      landing_page: event.landingPage,
      conversion_goal: event.goal,
      user_agent: event.userAgent,
      referrer: event.referrer,
      timestamp: new Date().toISOString()
    };

    // 로컬 스토리지에 저장 (실제로는 API 호출)
    const existingData = JSON.parse(localStorage.getItem('conversion_events') || '[]');
    existingData.push(conversionData);
    localStorage.setItem('conversion_events', JSON.stringify(existingData));

    // Google Analytics 4 이벤트 전송
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', event.type, {
        event_category: 'conversion',
        event_label: event.channel,
        value: event.value,
        custom_parameter_content_id: event.contentId,
        custom_parameter_conversion_goal: event.goal
      });
    }

    return { success: true, data: conversionData };
  } catch (error) {
    console.error('전환 추적 오류:', error);
    return { success: false, error: error.message };
  }
}

// UTM 파라미터 파싱
export function parseUTMParams(url = window.location.href) {
  const urlObj = new URL(url);
  const params = urlObj.searchParams;
  
  return {
    utm_source: params.get('utm_source') || 'direct',
    utm_medium: params.get('utm_medium') || 'none',
    utm_campaign: params.get('utm_campaign') || 'none',
    utm_content: params.get('utm_content') || 'none',
    utm_term: params.get('utm_term') || 'none'
  };
}

// 채널별 전환율 분석
export async function getConversionMetrics(contentId) {
  try {
    const events = JSON.parse(localStorage.getItem('conversion_events') || '[]');
    const contentEvents = events.filter(e => e.content_id === contentId);
    
    const views = contentEvents.filter(e => e.event_type === CONVERSION_EVENTS.VIEW);
    const clicks = contentEvents.filter(e => e.event_type === CONVERSION_EVENTS.CLICK);
    const conversions = contentEvents.filter(e => e.event_type === CONVERSION_EVENTS.CONVERSION);
    
    const conversionRate = clicks.length > 0 ? (conversions.length / clicks.length * 100).toFixed(2) : 0;
    const clickThroughRate = views.length > 0 ? (clicks.length / views.length * 100).toFixed(2) : 0;
    
    return {
      totalViews: views.length,
      totalClicks: clicks.length,
      totalConversions: conversions.length,
      conversionRate: parseFloat(conversionRate),
      clickThroughRate: parseFloat(clickThroughRate),
      channels: getChannelMetrics(contentEvents)
    };
  } catch (error) {
    console.error('전환 메트릭 분석 오류:', error);
    return null;
  }
}

// 채널별 메트릭 계산
function getChannelMetrics(events) {
  const channelMetrics = {};
  
  events.forEach(event => {
    if (!channelMetrics[event.channel]) {
      channelMetrics[event.channel] = {
        views: 0,
        clicks: 0,
        conversions: 0
      };
    }
    
    switch (event.event_type) {
      case CONVERSION_EVENTS.VIEW:
        channelMetrics[event.channel].views++;
        break;
      case CONVERSION_EVENTS.CLICK:
        channelMetrics[event.channel].clicks++;
        break;
      case CONVERSION_EVENTS.CONVERSION:
        channelMetrics[event.channel].conversions++;
        break;
    }
  });
  
  // 전환율 계산
  Object.keys(channelMetrics).forEach(channel => {
    const metrics = channelMetrics[channel];
    metrics.conversionRate = metrics.clicks > 0 
      ? (metrics.conversions / metrics.clicks * 100).toFixed(2)
      : 0;
    metrics.clickThroughRate = metrics.views > 0
      ? (metrics.clicks / metrics.views * 100).toFixed(2)
      : 0;
  });
  
  return channelMetrics;
}

// 최고 성과 콘텐츠 분석
export async function getTopPerformingContent(limit = 10) {
  try {
    const events = JSON.parse(localStorage.getItem('conversion_events') || '[]');
    const contentMetrics = {};
    
    // 콘텐츠별 메트릭 집계
    events.forEach(event => {
      if (!contentMetrics[event.content_id]) {
        contentMetrics[event.content_id] = {
          contentId: event.content_id,
          views: 0,
          clicks: 0,
          conversions: 0,
          channels: new Set()
        };
      }
      
      const metrics = contentMetrics[event.content_id];
      metrics.channels.add(event.channel);
      
      switch (event.event_type) {
        case CONVERSION_EVENTS.VIEW:
          metrics.views++;
          break;
        case CONVERSION_EVENTS.CLICK:
          metrics.clicks++;
          break;
        case CONVERSION_EVENTS.CONVERSION:
          metrics.conversions++;
          break;
      }
    });
    
    // 전환율 계산 및 정렬
    const topContent = Object.values(contentMetrics)
      .map(metrics => ({
        ...metrics,
        channels: Array.from(metrics.channels),
        conversionRate: metrics.clicks > 0 
          ? (metrics.conversions / metrics.clicks * 100).toFixed(2)
          : 0,
        clickThroughRate: metrics.views > 0
          ? (metrics.clicks / metrics.views * 100).toFixed(2)
          : 0
      }))
      .sort((a, b) => b.conversions - a.conversions)
      .slice(0, limit);
    
    return topContent;
  } catch (error) {
    console.error('최고 성과 콘텐츠 분석 오류:', error);
    return [];
  }
}

// 전환 퍼널 분석
export async function getConversionFunnel() {
  try {
    const events = JSON.parse(localStorage.getItem('conversion_events') || '[]');
    
    const funnel = {
      awareness: {
        name: '인지 단계',
        count: events.filter(e => e.conversion_goal === 'homepage_visit').length,
        goal: '홈페이지 방문'
      },
      consideration: {
        name: '고려 단계',
        count: events.filter(e => e.conversion_goal === 'consultation_request').length,
        goal: '상담 신청'
      },
      decision: {
        name: '결정 단계',
        count: events.filter(e => e.conversion_goal === 'purchase').length,
        goal: '구매 완료'
      },
      funnel: {
        name: '퍼널 단계',
        count: events.filter(e => e.conversion_goal === 'funnel_visit').length,
        goal: '퍼널 페이지 방문'
      }
    };
    
    return funnel;
  } catch (error) {
    console.error('전환 퍼널 분석 오류:', error);
    return null;
  }
}

// 익명 사용자 ID 생성
function generateAnonymousId() {
  return 'anon_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// 실시간 전환 추적 (클라이언트 사이드)
export function initConversionTracking() {
  if (typeof window === 'undefined') return;
  
  // 페이지 뷰 추적
  const utmParams = parseUTMParams();
  trackConversion({
    contentId: window.location.pathname,
    channel: utmParams.utm_source,
    type: CONVERSION_EVENTS.VIEW,
    utmParams: utmParams,
    landingPage: window.location.href,
    goal: getGoalFromPath(window.location.pathname),
    userAgent: navigator.userAgent,
    referrer: document.referrer
  });
  
  // 링크 클릭 추적
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (link && link.href) {
      const utmParams = parseUTMParams(link.href);
      trackConversion({
        contentId: window.location.pathname,
        channel: utmParams.utm_source,
        type: CONVERSION_EVENTS.CLICK,
        utmParams: utmParams,
        landingPage: link.href,
        goal: getGoalFromPath(link.href)
      });
    }
  });
  
  // 전화번호 클릭 추적
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="tel:"]');
    if (link) {
      trackConversion({
        contentId: window.location.pathname,
        channel: 'phone',
        type: CONVERSION_EVENTS.CONVERSION,
        goal: CONVERSION_GOALS.PHONE_CALL,
        value: 1
      });
    }
  });
}

// 경로에서 전환 목표 추론
function getGoalFromPath(path) {
  if (path.includes('/shop')) return CONVERSION_GOALS.PURCHASE;
  if (path.includes('/booking')) return CONVERSION_GOALS.CONSULTATION_REQUEST;
  if (path.includes('/25-10')) return CONVERSION_GOALS.FUNNEL_VISIT;
  if (path.includes('/about')) return CONVERSION_GOALS.HOMEPAGE_VISIT;
  return CONVERSION_GOALS.HOMEPAGE_VISIT;
}

// 전환 데이터 내보내기
export function exportConversionData() {
  try {
    const events = JSON.parse(localStorage.getItem('conversion_events') || '[]');
    const csv = convertToCSV(events);
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversion_data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    console.error('전환 데이터 내보내기 오류:', error);
    return { success: false, error: error.message };
  }
}

// JSON을 CSV로 변환
function convertToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
  ].join('\n');
  
  return csvContent;
}
