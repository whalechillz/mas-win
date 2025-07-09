-- 전환 추적 테이블
CREATE TABLE conversions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversion_type VARCHAR(50) NOT NULL, -- booking, inquiry, purchase
  campaign_id VARCHAR(100),
  session_id VARCHAR(255),
  conversion_value DECIMAL(10,2) DEFAULT 0,
  
  -- UTM 파라미터
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  
  page_url VARCHAR(255),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_conversions_type ON conversions(conversion_type);
CREATE INDEX idx_conversions_campaign ON conversions(campaign_id);
CREATE INDEX idx_conversions_created_at ON conversions(created_at);

-- 전환율 계산 뷰
CREATE VIEW conversion_metrics AS
SELECT 
  pv.campaign_id,
  COUNT(DISTINCT pv.session_id) as total_visitors,
  COUNT(DISTINCT cb.session_id) as booking_conversions,
  COUNT(DISTINCT ci.session_id) as inquiry_conversions,
  CASE 
    WHEN COUNT(DISTINCT pv.session_id) > 0 
    THEN ROUND(COUNT(DISTINCT cb.session_id)::DECIMAL / COUNT(DISTINCT pv.session_id) * 100, 2)
    ELSE 0 
  END as booking_conversion_rate,
  CASE 
    WHEN COUNT(DISTINCT pv.session_id) > 0 
    THEN ROUND(COUNT(DISTINCT ci.session_id)::DECIMAL / COUNT(DISTINCT pv.session_id) * 100, 2)
    ELSE 0 
  END as inquiry_conversion_rate
FROM page_views pv
LEFT JOIN conversions cb ON pv.session_id = cb.session_id AND cb.conversion_type = 'booking'
LEFT JOIN conversions ci ON pv.session_id = ci.session_id AND ci.conversion_type = 'inquiry'
GROUP BY pv.campaign_id;
