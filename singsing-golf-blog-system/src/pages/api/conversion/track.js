// 전환 추적 API
// 클라이언트에서 전송된 전환 이벤트를 처리

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      contentId,
      channel,
      eventType,
      userId,
      utmParams,
      conversionValue,
      landingPage,
      conversionGoal,
      userAgent,
      referrer
    } = req.body;

    // 전환 이벤트 데이터 구성
    const conversionData = {
      content_id: contentId,
      channel: channel,
      event_type: eventType,
      user_id: userId || generateAnonymousId(),
      utm_params: utmParams,
      conversion_value: conversionValue || 0,
      landing_page: landingPage,
      conversion_goal: conversionGoal,
      user_agent: userAgent,
      referrer: referrer,
      ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      timestamp: new Date().toISOString()
    };

    // 실제로는 Supabase나 다른 DB에 저장
    // const { data, error } = await supabase
    //   .from('conversion_events')
    //   .insert([conversionData]);

    // 임시로 로그에만 기록
    console.log('전환 이벤트:', conversionData);

    // Google Analytics 4 이벤트 전송 (서버 사이드)
    if (process.env.GA4_MEASUREMENT_ID) {
      await sendGA4Event(conversionData);
    }

    return res.json({
      success: true,
      eventId: generateEventId(),
      timestamp: conversionData.timestamp
    });

  } catch (error) {
    console.error('전환 추적 API 오류:', error);
    return res.status(500).json({ 
      error: '전환 추적 실패',
      details: error.message 
    });
  }
}

// 익명 사용자 ID 생성
function generateAnonymousId() {
  return 'anon_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// 이벤트 ID 생성
function generateEventId() {
  return 'evt_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// Google Analytics 4 이벤트 전송
async function sendGA4Event(conversionData) {
  try {
    const measurementId = process.env.GA4_MEASUREMENT_ID;
    const apiSecret = process.env.GA4_API_SECRET;
    
    if (!measurementId || !apiSecret) {
      console.log('GA4 설정이 없습니다.');
      return;
    }

    const eventData = {
      client_id: conversionData.user_id,
      events: [{
        name: conversionData.event_type,
        params: {
          event_category: 'conversion',
          event_label: conversionData.channel,
          value: conversionData.conversion_value,
          custom_parameter_content_id: conversionData.content_id,
          custom_parameter_conversion_goal: conversionData.conversion_goal,
          custom_parameter_utm_source: conversionData.utm_params?.utm_source,
          custom_parameter_utm_medium: conversionData.utm_params?.utm_medium,
          custom_parameter_utm_campaign: conversionData.utm_params?.utm_campaign
        }
      }]
    };

    const response = await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData)
    });

    if (!response.ok) {
      console.error('GA4 이벤트 전송 실패:', response.statusText);
    }
  } catch (error) {
    console.error('GA4 이벤트 전송 오류:', error);
  }
}
