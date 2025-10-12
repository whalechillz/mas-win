import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 전환 이벤트 추적
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      contentId,
      channel,
      targetAudience,
      eventType,
      eventValue,
      utmParams,
      userAgent,
      ipAddress,
      referrer
    } = req.body;

    // 필수 필드 검증
    if (!contentId || !channel || !eventType) {
      return res.status(400).json({ 
        error: 'contentId, channel, eventType은 필수입니다.' 
      });
    }

    // 전환 이벤트 데이터 저장
    const { data, error } = await supabase
      .from('conversion_tracking')
      .insert({
        content_id: contentId,
        channel: channel,
        target_audience: targetAudience,
        event_type: eventType,
        event_value: eventValue || 0,
        utm_params: utmParams || {},
        user_agent: userAgent,
        ip_address: ipAddress,
        referrer: referrer,
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('전환 추적 데이터 저장 오류:', error);
      throw error;
    }

    // 콘텐츠의 성과 메트릭 업데이트
    await updateContentPerformanceMetrics(contentId, eventType, eventValue);

    return res.json({
      success: true,
      trackingId: data.id,
      message: '전환 이벤트가 추적되었습니다.'
    });

  } catch (error) {
    console.error('전환 추적 오류:', error);
    return res.status(500).json({ 
      error: '전환 추적 실패',
      details: error.message 
    });
  }
}

// 콘텐츠 성과 메트릭 업데이트
async function updateContentPerformanceMetrics(contentId, eventType, eventValue) {
  try {
    // 기존 성과 메트릭 조회
    const { data: content, error: fetchError } = await supabase
      .from('cc_content_calendar')
      .select('performance_metrics')
      .eq('id', contentId)
      .single();

    if (fetchError) {
      console.error('콘텐츠 조회 오류:', fetchError);
      return;
    }

    const currentMetrics = content.performance_metrics || {};
    const today = new Date().toISOString().split('T')[0];

    // 이벤트 타입별 메트릭 업데이트
    if (!currentMetrics[eventType]) {
      currentMetrics[eventType] = {};
    }

    if (!currentMetrics[eventType][today]) {
      currentMetrics[eventType][today] = {
        count: 0,
        value: 0,
        last_updated: new Date().toISOString()
      };
    }

    currentMetrics[eventType][today].count += 1;
    currentMetrics[eventType][today].value += eventValue || 0;
    currentMetrics[eventType][today].last_updated = new Date().toISOString();

    // 업데이트된 메트릭 저장
    const { error: updateError } = await supabase
      .from('cc_content_calendar')
      .update({
        performance_metrics: currentMetrics,
        updated_at: new Date().toISOString()
      })
      .eq('id', contentId);

    if (updateError) {
      console.error('성과 메트릭 업데이트 오류:', updateError);
    }

  } catch (error) {
    console.error('성과 메트릭 업데이트 실패:', error);
  }
}
