-- 🚨 Supabase 긴급 수정 SQL
-- 이 SQL을 Supabase SQL Editor에서 실행하세요!

-- 1. 기존 테이블 완전 삭제
DROP TABLE IF EXISTS page_views CASCADE;
DROP TABLE IF EXISTS campaign_metrics CASCADE;

-- 2. 테이블 생성 (RLS 없이)
CREATE TABLE page_views (
  id BIGSERIAL PRIMARY KEY,
  campaign_id VARCHAR(50) NOT NULL,
  page_url TEXT,
  user_agent TEXT,
  ip_address VARCHAR(45),
  referer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE campaign_metrics (
  id BIGSERIAL PRIMARY KEY,
  campaign_id VARCHAR(50) UNIQUE NOT NULL,
  views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  phone_clicks INTEGER DEFAULT 0,
  form_submissions INTEGER DEFAULT 0,
  quiz_completions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 인덱스 생성
CREATE INDEX idx_page_views_campaign ON page_views(campaign_id);
CREATE INDEX idx_page_views_created ON page_views(created_at DESC);

-- 4. 테스트 데이터 추가
INSERT INTO campaign_metrics (campaign_id, views, unique_visitors, phone_clicks, form_submissions, quiz_completions, conversion_rate)
VALUES 
  ('2025-07', 1234, 892, 45, 23, 67, 3.7),
  ('2025-06', 2456, 1823, 89, 45, 123, 4.2);

INSERT INTO page_views (campaign_id, page_url)
VALUES 
  ('2025-07', '/test-page-1'),
  ('2025-07', '/test-page-2');

-- 5. 확인
SELECT 'SUCCESS! Tables created!' as status;
SELECT * FROM campaign_metrics;
SELECT COUNT(*) as page_view_count FROM page_views;