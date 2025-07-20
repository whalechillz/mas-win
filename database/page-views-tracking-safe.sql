-- 기존 인덱스와 테이블을 안전하게 처리하는 스크립트
-- 이미 존재하는 경우를 고려한 버전

-- 1. 기존 인덱스 삭제 (존재하는 경우만)
DROP INDEX IF EXISTS idx_page_views_campaign_id;
DROP INDEX IF EXISTS idx_page_views_viewed_at;

-- 2. page_views 테이블 생성 (이미 존재하면 무시)
CREATE TABLE IF NOT EXISTS page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id VARCHAR(50) NOT NULL,
  page_url VARCHAR(500) NOT NULL,
  user_agent TEXT,
  ip_address VARCHAR(50),
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 인덱스 재생성
CREATE INDEX idx_page_views_campaign_id ON page_views(campaign_id);
CREATE INDEX idx_page_views_viewed_at ON page_views(viewed_at);

-- 4. campaigns 테이블에 views 컬럼 추가 (없으면)
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- 5. 뷰 생성/교체
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

CREATE OR REPLACE VIEW campaign_daily_stats AS
SELECT 
  campaign_id,
  DATE(viewed_at) as view_date,
  COUNT(*) as daily_views,
  COUNT(DISTINCT ip_address) as daily_unique_views
FROM page_views
GROUP BY campaign_id, DATE(viewed_at)
ORDER BY view_date DESC;

-- 6. 설치 확인
SELECT 
  'Setup Complete' as status,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'page_views') as table_exists,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'views') as views_column_exists;
