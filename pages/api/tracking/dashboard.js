import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      period = '7days', 
      channel = 'all', 
      targetAudience = 'all',
      contentId = null 
    } = req.query;

    // 기간 설정
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '1day':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case '7days':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    // 기본 통계 조회
    const { data: basicStats, error: basicError } = await supabase
      .from('conversion_tracking')
      .select('*')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .order('timestamp', { ascending: false });

    if (basicError) {
      throw basicError;
    }

    // 필터링 적용
    let filteredStats = basicStats;
    if (channel !== 'all') {
      filteredStats = filteredStats.filter(stat => stat.channel === channel);
    }
    if (targetAudience !== 'all') {
      filteredStats = filteredStats.filter(stat => stat.target_audience === targetAudience);
    }
    if (contentId) {
      filteredStats = filteredStats.filter(stat => stat.content_id === contentId);
    }

    // 통계 계산
    const stats = calculateStats(filteredStats);

    // 채널별 성과
    const channelPerformance = calculateChannelPerformance(filteredStats);

    // 타겟별 성과
    const targetPerformance = calculateTargetPerformance(filteredStats);

    // 일별 트렌드
    const dailyTrends = calculateDailyTrends(filteredStats, startDate, endDate);

    // 이벤트 타입별 분포
    const eventTypeDistribution = calculateEventTypeDistribution(filteredStats);

    // 상위 콘텐츠
    const topContents = calculateTopContents(filteredStats);

    // 시간대별 활동
    const hourlyActivity = calculateHourlyActivity(filteredStats);

    return res.json({
      success: true,
      period: period,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      },
      filters: {
        channel: channel,
        targetAudience: targetAudience,
        contentId: contentId
      },
      stats: stats,
      channelPerformance: channelPerformance,
      targetPerformance: targetPerformance,
      dailyTrends: dailyTrends,
      eventTypeDistribution: eventTypeDistribution,
      topContents: topContents,
      hourlyActivity: hourlyActivity,
      totalEvents: filteredStats.length
    });

  } catch (error) {
    console.error('전환 추적 대시보드 오류:', error);
    return res.status(500).json({ 
      error: '대시보드 데이터 조회 실패',
      details: error.message 
    });
  }
}

// 기본 통계 계산
function calculateStats(data) {
  const totalEvents = data.length;
  const totalValue = data.reduce((sum, item) => sum + (item.event_value || 0), 0);
  const avgValue = totalEvents > 0 ? totalValue / totalEvents : 0;
  
  const uniqueContents = new Set(data.map(item => item.content_id)).size;
  const uniqueChannels = new Set(data.map(item => item.channel)).size;
  
  const eventTypes = data.reduce((acc, item) => {
    acc[item.event_type] = (acc[item.event_type] || 0) + 1;
    return acc;
  }, {});

  return {
    totalEvents,
    totalValue,
    avgValue,
    uniqueContents,
    uniqueChannels,
    eventTypes,
    conversionRate: totalEvents > 0 ? (eventTypes.conversion || 0) / totalEvents * 100 : 0
  };
}

// 채널별 성과 계산
function calculateChannelPerformance(data) {
  const channelStats = data.reduce((acc, item) => {
    if (!acc[item.channel]) {
      acc[item.channel] = {
        channel: item.channel,
        events: 0,
        value: 0,
        uniqueContents: new Set(),
        eventTypes: {}
      };
    }
    
    acc[item.channel].events += 1;
    acc[item.channel].value += item.event_value || 0;
    acc[item.channel].uniqueContents.add(item.content_id);
    acc[item.channel].eventTypes[item.event_type] = (acc[item.channel].eventTypes[item.event_type] || 0) + 1;
    
    return acc;
  }, {});

  return Object.values(channelStats).map(channel => ({
    ...channel,
    uniqueContents: channel.uniqueContents.size,
    avgValue: channel.events > 0 ? channel.value / channel.events : 0,
    conversionRate: channel.events > 0 ? (channel.eventTypes.conversion || 0) / channel.events * 100 : 0
  })).sort((a, b) => b.events - a.events);
}

// 타겟별 성과 계산
function calculateTargetPerformance(data) {
  const targetStats = data.reduce((acc, item) => {
    const target = item.target_audience || 'unknown';
    if (!acc[target]) {
      acc[target] = {
        targetAudience: target,
        events: 0,
        value: 0,
        uniqueContents: new Set(),
        channels: new Set()
      };
    }
    
    acc[target].events += 1;
    acc[target].value += item.event_value || 0;
    acc[target].uniqueContents.add(item.content_id);
    acc[target].channels.add(item.channel);
    
    return acc;
  }, {});

  return Object.values(targetStats).map(target => ({
    ...target,
    uniqueContents: target.uniqueContents.size,
    uniqueChannels: target.channels.size,
    avgValue: target.events > 0 ? target.value / target.events : 0
  })).sort((a, b) => b.events - a.events);
}

// 일별 트렌드 계산
function calculateDailyTrends(data, startDate, endDate) {
  const trends = {};
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    trends[dateStr] = {
      date: dateStr,
      events: 0,
      value: 0,
      channels: new Set(),
      eventTypes: {}
    };
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  data.forEach(item => {
    const dateStr = item.timestamp.split('T')[0];
    if (trends[dateStr]) {
      trends[dateStr].events += 1;
      trends[dateStr].value += item.event_value || 0;
      trends[dateStr].channels.add(item.channel);
      trends[dateStr].eventTypes[item.event_type] = (trends[dateStr].eventTypes[item.event_type] || 0) + 1;
    }
  });
  
  return Object.values(trends).map(trend => ({
    ...trend,
    uniqueChannels: trend.channels.size,
    avgValue: trend.events > 0 ? trend.value / trend.events : 0
  }));
}

// 이벤트 타입별 분포 계산
function calculateEventTypeDistribution(data) {
  const distribution = data.reduce((acc, item) => {
    acc[item.event_type] = (acc[item.event_type] || 0) + 1;
    return acc;
  }, {});
  
  const total = data.length;
  
  return Object.entries(distribution).map(([eventType, count]) => ({
    eventType,
    count,
    percentage: total > 0 ? (count / total) * 100 : 0
  })).sort((a, b) => b.count - a.count);
}

// 상위 콘텐츠 계산
function calculateTopContents(data) {
  const contentStats = data.reduce((acc, item) => {
    if (!acc[item.content_id]) {
      acc[item.content_id] = {
        contentId: item.content_id,
        events: 0,
        value: 0,
        channels: new Set(),
        eventTypes: {}
      };
    }
    
    acc[item.content_id].events += 1;
    acc[item.content_id].value += item.event_value || 0;
    acc[item.content_id].channels.add(item.channel);
    acc[item.content_id].eventTypes[item.event_type] = (acc[item.content_id].eventTypes[item.event_type] || 0) + 1;
    
    return acc;
  }, {});
  
  return Object.values(contentStats).map(content => ({
    ...content,
    uniqueChannels: content.channels.size,
    avgValue: content.events > 0 ? content.value / content.events : 0
  })).sort((a, b) => b.events - a.events).slice(0, 10);
}

// 시간대별 활동 계산
function calculateHourlyActivity(data) {
  const hourlyStats = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    events: 0,
    value: 0,
    channels: new Set()
  }));
  
  data.forEach(item => {
    const hour = new Date(item.timestamp).getHours();
    hourlyStats[hour].events += 1;
    hourlyStats[hour].value += item.event_value || 0;
    hourlyStats[hour].channels.add(item.channel);
  });
  
  return hourlyStats.map(hour => ({
    ...hour,
    uniqueChannels: hour.channels.size,
    avgValue: hour.events > 0 ? hour.value / hour.events : 0
  }));
}
