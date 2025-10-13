import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { campaignId, dateFrom, dateTo } = req.query;
    
    // 날짜 범위 설정 (기본값: 오늘)
    const today = new Date();
    const startDate = dateFrom || today.toISOString().split('T')[0];
    const endDate = dateTo || new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // 페이지뷰 조회
    let pageViewQuery = supabase
      .from('page_views')
      .select('*')
      .gte('created_at', startDate)
      .lt('created_at', endDate);
    
    if (campaignId && campaignId !== 'all') {
      pageViewQuery = pageViewQuery.eq('campaign_id', campaignId);
    }
    
    const { data: pageViews, error: pvError } = await pageViewQuery;
    
    if (pvError) {
      console.error('페이지뷰 조회 오류:', pvError);
      throw pvError;
    }
    
    // 전환 조회
    let conversionQuery = supabase
      .from('conversions')
      .select('*')
      .gte('created_at', startDate)
      .lt('created_at', endDate);
    
    if (campaignId && campaignId !== 'all') {
      conversionQuery = conversionQuery.eq('campaign_id', campaignId);
    }
    
    const { data: conversions, error: convError } = await conversionQuery;
    
    if (convError) {
      console.error('전환 조회 오류:', convError);
      throw convError;
    }
    
    // 통계 계산
    const uniqueVisitors = new Set(pageViews?.map(pv => pv.session_id) || []).size;
    const bookings = conversions?.filter(c => c.conversion_type === 'booking') || [];
    const inquiries = conversions?.filter(c => c.conversion_type === 'inquiry') || [];
    
    // UTM 소스별 통계
    const utmSourceStats = {};
    pageViews?.forEach(pv => {
      const source = pv.utm_source || 'direct';
      if (!utmSourceStats[source]) {
        utmSourceStats[source] = {
          views: 0,
          uniqueVisitors: new Set(),
          bookings: 0,
          inquiries: 0
        };
      }
      utmSourceStats[source].views++;
      utmSourceStats[source].uniqueVisitors.add(pv.session_id);
    });
    
    // 전환 데이터 매칭
    conversions?.forEach(conv => {
      const source = conv.utm_source || 'direct';
      if (utmSourceStats[source]) {
        if (conv.conversion_type === 'booking') {
          utmSourceStats[source].bookings++;
        } else if (conv.conversion_type === 'inquiry') {
          utmSourceStats[source].inquiries++;
        }
      }
    });
    
    // Set을 숫자로 변환
    Object.keys(utmSourceStats).forEach(source => {
      utmSourceStats[source].uniqueVisitors = utmSourceStats[source].uniqueVisitors.size;
    });
    
    // 디바이스별 통계
    const deviceStats = {};
    pageViews?.forEach(pv => {
      const device = pv.device_type || 'unknown';
      if (!deviceStats[device]) {
        deviceStats[device] = { views: 0, uniqueVisitors: new Set() };
      }
      deviceStats[device].views++;
      deviceStats[device].uniqueVisitors.add(pv.session_id);
    });
    
    // Set을 숫자로 변환
    Object.keys(deviceStats).forEach(device => {
      deviceStats[device].uniqueVisitors = deviceStats[device].uniqueVisitors.size;
    });
    
    // 시간별 통계 (최근 24시간)
    const hourlyStats = {};
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourKey = hour.toISOString().slice(0, 13); // YYYY-MM-DDTHH
      hourlyStats[hourKey] = { views: 0, bookings: 0, inquiries: 0 };
    }
    
    pageViews?.forEach(pv => {
      const hourKey = new Date(pv.created_at).toISOString().slice(0, 13);
      if (hourlyStats[hourKey]) {
        hourlyStats[hourKey].views++;
      }
    });
    
    conversions?.forEach(conv => {
      const hourKey = new Date(conv.created_at).toISOString().slice(0, 13);
      if (hourlyStats[hourKey]) {
        if (conv.conversion_type === 'booking') {
          hourlyStats[hourKey].bookings++;
        } else if (conv.conversion_type === 'inquiry') {
          hourlyStats[hourKey].inquiries++;
        }
      }
    });
    
    // 응답 데이터
    const stats = {
      summary: {
        totalViews: pageViews?.length || 0,
        uniqueVisitors,
        totalBookings: bookings.length,
        totalInquiries: inquiries.length,
        bookingConversionRate: uniqueVisitors > 0 
          ? ((bookings.length / uniqueVisitors) * 100).toFixed(2) 
          : '0',
        inquiryConversionRate: uniqueVisitors > 0 
          ? ((inquiries.length / uniqueVisitors) * 100).toFixed(2) 
          : '0',
        totalConversionRate: uniqueVisitors > 0 
          ? (((bookings.length + inquiries.length) / uniqueVisitors) * 100).toFixed(2) 
          : '0'
      },
      utmSourceStats,
      deviceStats,
      hourlyStats,
      dateRange: {
        from: startDate,
        to: endDate
      }
    };
    
    res.status(200).json(stats);
    
  } catch (error) {
    console.error('통계 조회 오류:', error);
    res.status(500).json({ 
      error: '통계 조회 중 오류가 발생했습니다',
      details: error.message 
    });
  }
}
