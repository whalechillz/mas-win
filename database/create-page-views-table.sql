-- 페이지 조회수 추적을 위한 테이블
CREATE TABLE page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_url VARCHAR(255) NOT NULL,
  campaign_id VARCHAR(100),
  session_id VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  referrer TEXT,
  
  -- UTM 파라미터
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  utm_term VARCHAR(100),
  utm_content VARCHAR(100),
  
  -- 디바이스 정보
  device_type VARCHAR(50), -- mobile, tablet, desktop
  browser VARCHAR(50),
  os VARCHAR(50),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX idx_page_views_campaign ON page_views(campaign_id);
CREATE INDEX idx_page_views_created_at ON page_views(created_at);
CREATE INDEX idx_page_views_page_url ON page_views(page_url);

-- 일별 집계 뷰
CREATE VIEW daily_page_views AS
SELECT 
  DATE(created_at) as date,
  campaign_id,
  page_url,
  COUNT(*) as views,
  COUNT(DISTINCT session_id) as unique_visitors
FROM page_views
GROUP BY DATE(created_at), campaign_id, page_url;
