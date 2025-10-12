-- 전환 추적을 위한 테이블 생성
CREATE TABLE IF NOT EXISTS conversion_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL,
  channel VARCHAR(50) NOT NULL,
  target_audience VARCHAR(50),
  event_type VARCHAR(100) NOT NULL,
  event_value NUMERIC DEFAULT 0,
  utm_params JSONB DEFAULT '{}',
  user_agent TEXT,
  ip_address INET,
  referrer TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_conversion_tracking_content_id ON conversion_tracking(content_id);
CREATE INDEX IF NOT EXISTS idx_conversion_tracking_channel ON conversion_tracking(channel);
CREATE INDEX IF NOT EXISTS idx_conversion_tracking_event_type ON conversion_tracking(event_type);
CREATE INDEX IF NOT EXISTS idx_conversion_tracking_timestamp ON conversion_tracking(timestamp);
CREATE INDEX IF NOT EXISTS idx_conversion_tracking_target_audience ON conversion_tracking(target_audience);

-- 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_conversion_tracking_content_channel ON conversion_tracking(content_id, channel);
CREATE INDEX IF NOT EXISTS idx_conversion_tracking_channel_event ON conversion_tracking(channel, event_type);
CREATE INDEX IF NOT EXISTS idx_conversion_tracking_date_range ON conversion_tracking(timestamp, channel, event_type);

-- RLS (Row Level Security) 정책
ALTER TABLE conversion_tracking ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자만 읽기/쓰기 가능
CREATE POLICY "인증된 사용자는 전환 추적 데이터를 읽을 수 있음" ON conversion_tracking
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "인증된 사용자는 전환 추적 데이터를 삽입할 수 있음" ON conversion_tracking
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "인증된 사용자는 전환 추적 데이터를 업데이트할 수 있음" ON conversion_tracking
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 전환 추적 통계 뷰 생성
CREATE OR REPLACE VIEW conversion_tracking_stats AS
SELECT 
  content_id,
  channel,
  target_audience,
  event_type,
  COUNT(*) as event_count,
  SUM(event_value) as total_value,
  AVG(event_value) as avg_value,
  DATE(timestamp) as event_date,
  EXTRACT(HOUR FROM timestamp) as event_hour
FROM conversion_tracking
GROUP BY content_id, channel, target_audience, event_type, DATE(timestamp), EXTRACT(HOUR FROM timestamp)
ORDER BY event_date DESC, event_hour DESC;

-- 일별 전환 추적 요약 뷰
CREATE OR REPLACE VIEW daily_conversion_summary AS
SELECT 
  DATE(timestamp) as date,
  channel,
  target_audience,
  event_type,
  COUNT(*) as daily_events,
  SUM(event_value) as daily_value,
  COUNT(DISTINCT content_id) as unique_contents
FROM conversion_tracking
GROUP BY DATE(timestamp), channel, target_audience, event_type
ORDER BY date DESC;

-- 채널별 성과 뷰
CREATE OR REPLACE VIEW channel_performance AS
SELECT 
  channel,
  target_audience,
  COUNT(*) as total_events,
  COUNT(DISTINCT content_id) as unique_contents,
  SUM(event_value) as total_value,
  AVG(event_value) as avg_value,
  MIN(timestamp) as first_event,
  MAX(timestamp) as last_event
FROM conversion_tracking
GROUP BY channel, target_audience
ORDER BY total_events DESC;

-- 전환 추적 데이터 정리 함수 (30일 이상 된 데이터)
CREATE OR REPLACE FUNCTION cleanup_old_conversion_data()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM conversion_tracking 
  WHERE timestamp < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 전환 추적 데이터 집계 함수
CREATE OR REPLACE FUNCTION get_conversion_metrics(
  p_content_id UUID DEFAULT NULL,
  p_channel VARCHAR DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  content_id UUID,
  channel VARCHAR,
  target_audience VARCHAR,
  event_type VARCHAR,
  event_count BIGINT,
  total_value NUMERIC,
  avg_value NUMERIC,
  date_range TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ct.content_id,
    ct.channel,
    ct.target_audience,
    ct.event_type,
    COUNT(*) as event_count,
    SUM(ct.event_value) as total_value,
    AVG(ct.event_value) as avg_value,
    COALESCE(
      CASE 
        WHEN p_start_date IS NOT NULL AND p_end_date IS NOT NULL 
        THEN p_start_date::TEXT || ' ~ ' || p_end_date::TEXT
        ELSE '전체 기간'
      END, 
      '전체 기간'
    ) as date_range
  FROM conversion_tracking ct
  WHERE 
    (p_content_id IS NULL OR ct.content_id = p_content_id)
    AND (p_channel IS NULL OR ct.channel = p_channel)
    AND (p_start_date IS NULL OR DATE(ct.timestamp) >= p_start_date)
    AND (p_end_date IS NULL OR DATE(ct.timestamp) <= p_end_date)
  GROUP BY ct.content_id, ct.channel, ct.target_audience, ct.event_type
  ORDER BY event_count DESC;
END;
$$ LANGUAGE plpgsql;

-- 권한 설정
GRANT SELECT, INSERT, UPDATE ON conversion_tracking TO authenticated;
GRANT SELECT ON conversion_tracking_stats TO authenticated;
GRANT SELECT ON daily_conversion_summary TO authenticated;
GRANT SELECT ON channel_performance TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_conversion_data() TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversion_metrics(UUID, VARCHAR, DATE, DATE) TO authenticated;

-- 샘플 데이터 삽입 (테스트용)
INSERT INTO conversion_tracking (
  content_id,
  channel,
  target_audience,
  event_type,
  event_value,
  utm_params,
  user_agent,
  ip_address,
  referrer
) VALUES (
  gen_random_uuid(),
  'kakao',
  'existing_customer',
  'click',
  1,
  '{"utm_source": "kakao", "utm_medium": "message", "utm_campaign": "test"}',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  '127.0.0.1',
  'https://kakao.com'
) ON CONFLICT DO NOTHING;

-- 완료 메시지
SELECT '전환 추적 시스템 테이블 생성 완료!' as message;
