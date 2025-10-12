// 전환 분석 API
// 전환 데이터를 분석하여 메트릭 제공

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      contentId, 
      channel, 
      startDate, 
      endDate,
      metric = 'all'
    } = req.query;

    // 실제로는 DB에서 데이터 조회
    // const { data: events, error } = await supabase
    //   .from('conversion_events')
    //   .select('*')
    //   .gte('timestamp', startDate)
    //   .lte('timestamp', endDate);

    // 임시 데이터 (실제로는 DB에서 조회)
    const events = [
      {
        content_id: 'blog-1',
        channel: 'kakao',
        event_type: 'view',
        conversion_goal: 'homepage_visit',
        conversion_value: 0,
        timestamp: new Date().toISOString()
      },
      {
        content_id: 'blog-1',
        channel: 'kakao',
        event_type: 'click',
        conversion_goal: 'homepage_visit',
        conversion_value: 0,
        timestamp: new Date().toISOString()
      },
      {
        content_id: 'blog-1',
        channel: 'kakao',
        event_type: 'conversion',
        conversion_goal: 'consultation_request',
        conversion_value: 1,
        timestamp: new Date().toISOString()
      }
    ];

    let result = {};

    switch (metric) {
      case 'funnel':
        result = getConversionFunnel(events);
        break;
      case 'channels':
        result = getChannelMetrics(events);
        break;
      case 'top-content':
        result = getTopPerformingContent(events);
        break;
      case 'content':
        result = getContentMetrics(events, contentId);
        break;
      default:
        result = {
          funnel: getConversionFunnel(events),
          channels: getChannelMetrics(events),
          topContent: getTopPerformingContent(events),
          summary: getSummaryMetrics(events)
        };
    }

    return res.json({
      success: true,
      data: result,
      period: {
        startDate: startDate || 'all',
        endDate: endDate || 'all'
      }
    });

  } catch (error) {
    console.error('전환 분석 API 오류:', error);
    return res.status(500).json({ 
      error: '전환 분석 실패',
      details: error.message 
    });
  }
}

// 전환 퍼널 분석
function getConversionFunnel(events) {
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
}

// 채널별 메트릭
function getChannelMetrics(events) {
  const channelMetrics = {};
  
  events.forEach(event => {
    if (!channelMetrics[event.channel]) {
      channelMetrics[event.channel] = {
        views: 0,
        clicks: 0,
        conversions: 0,
        totalValue: 0
      };
    }
    
    const metrics = channelMetrics[event.channel];
    
    switch (event.event_type) {
      case 'view':
        metrics.views++;
        break;
      case 'click':
        metrics.clicks++;
        break;
      case 'conversion':
        metrics.conversions++;
        metrics.totalValue += event.conversion_value || 0;
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

// 최고 성과 콘텐츠
function getTopPerformingContent(events, limit = 10) {
  const contentMetrics = {};
  
  events.forEach(event => {
    if (!contentMetrics[event.content_id]) {
      contentMetrics[event.content_id] = {
        contentId: event.content_id,
        views: 0,
        clicks: 0,
        conversions: 0,
        totalValue: 0,
        channels: new Set()
      };
    }
    
    const metrics = contentMetrics[event.content_id];
    metrics.channels.add(event.channel);
    
    switch (event.event_type) {
      case 'view':
        metrics.views++;
        break;
      case 'click':
        metrics.clicks++;
        break;
      case 'conversion':
        metrics.conversions++;
        metrics.totalValue += event.conversion_value || 0;
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
}

// 특정 콘텐츠 메트릭
function getContentMetrics(events, contentId) {
  const contentEvents = events.filter(e => e.content_id === contentId);
  
  const views = contentEvents.filter(e => e.event_type === 'view');
  const clicks = contentEvents.filter(e => e.event_type === 'click');
  const conversions = contentEvents.filter(e => e.event_type === 'conversion');
  
  const conversionRate = clicks.length > 0 ? (conversions.length / clicks.length * 100).toFixed(2) : 0;
  const clickThroughRate = views.length > 0 ? (clicks.length / views.length * 100).toFixed(2) : 0;
  
  return {
    contentId,
    totalViews: views.length,
    totalClicks: clicks.length,
    totalConversions: conversions.length,
    conversionRate: parseFloat(conversionRate),
    clickThroughRate: parseFloat(clickThroughRate),
    totalValue: conversions.reduce((sum, c) => sum + (c.conversion_value || 0), 0),
    channels: getChannelMetrics(contentEvents)
  };
}

// 전체 요약 메트릭
function getSummaryMetrics(events) {
  const views = events.filter(e => e.event_type === 'view');
  const clicks = events.filter(e => e.event_type === 'click');
  const conversions = events.filter(e => e.event_type === 'conversion');
  
  const totalValue = conversions.reduce((sum, c) => sum + (c.conversion_value || 0), 0);
  const conversionRate = clicks.length > 0 ? (conversions.length / clicks.length * 100).toFixed(2) : 0;
  const clickThroughRate = views.length > 0 ? (clicks.length / views.length * 100).toFixed(2) : 0;
  
  return {
    totalViews: views.length,
    totalClicks: clicks.length,
    totalConversions: conversions.length,
    totalValue: totalValue,
    conversionRate: parseFloat(conversionRate),
    clickThroughRate: parseFloat(clickThroughRate),
    uniqueChannels: new Set(events.map(e => e.channel)).size,
    uniqueContent: new Set(events.map(e => e.content_id)).size
  };
}
