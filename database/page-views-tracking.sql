-- 페이지 조회수 추적 테이블 생성
CREATE TABLE IF NOT EXISTS page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id VARCHAR(50) NOT NULL,
  page_url VARCHAR(500) NOT NULL,
  user_agent TEXT,
  ip_address VARCHAR(50),
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_page_views_campaign_id ON page_views(campaign_id);
CREATE INDEX idx_page_views_viewed_at ON page_views(viewed_at);

-- campaigns 테이블에 views 컬럼이 없으면 추가
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- 실시간 조회수 통계를 위한 뷰 생성
CREATE OR REPLACE VIEW campaign_view_stats AS
SELECT 
  campaign_id,
  COUNT(*) as total_views,
  COUNT(DISTINCT ip_address) as unique_views,
  DATE_TRUNC('hour', viewed_at) as view_hour,
  COUNT(*) as hourly_views
FROM page_views
GROUP BY campaign_id, DATE_TRUNC('hour', viewed_at)
ORDER BY view_hour DESC;

-- 일별 조회수 통계 뷰
CREATE OR REPLACE VIEW campaign_daily_stats AS
SELECT 
  campaign_id,
  DATE(viewed_at) as view_date,
  COUNT(*) as daily_views,
  COUNT(DISTINCT ip_address) as daily_unique_views
FROM page_views
GROUP BY campaign_id, DATE(viewed_at)
ORDER BY view_date DESC;
