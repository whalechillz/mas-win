-- 페이지 뷰 추적 테이블
CREATE TABLE IF NOT EXISTS page_views (
  id BIGSERIAL PRIMARY KEY,
  campaign_id VARCHAR(50) NOT NULL,
  page_url TEXT,
  user_agent TEXT,
  ip_address VARCHAR(45),
  referer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 캠페인 메트릭스 테이블
CREATE TABLE IF NOT EXISTS campaign_metrics (
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

-- 인덱스 생성
CREATE INDEX idx_page_views_campaign ON page_views(campaign_id);
CREATE INDEX idx_page_views_created ON page_views(created_at DESC);
CREATE INDEX idx_campaign_metrics_campaign ON campaign_metrics(campaign_id);

-- RLS 설정
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for all users" ON page_views
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users" ON page_views
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Enable all for authenticated users" ON campaign_metrics
  FOR ALL TO authenticated
  USING (true);
