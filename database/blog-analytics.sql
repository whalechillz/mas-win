-- 블로그 분석 테이블 생성
CREATE TABLE IF NOT EXISTS blog_analytics (
  id BIGSERIAL PRIMARY KEY,
  blog_title TEXT NOT NULL,
  blog_slug TEXT NOT NULL,
  blog_category TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  referrer TEXT,
  search_keyword TEXT,
  traffic_source TEXT,
  user_agent TEXT,
  ip_address TEXT,
  page_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_blog_analytics_blog_slug ON blog_analytics(blog_slug);
CREATE INDEX IF NOT EXISTS idx_blog_analytics_created_at ON blog_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_blog_analytics_traffic_source ON blog_analytics(traffic_source);
CREATE INDEX IF NOT EXISTS idx_blog_analytics_utm_source ON blog_analytics(utm_source);
CREATE INDEX IF NOT EXISTS idx_blog_analytics_search_keyword ON blog_analytics(search_keyword);

-- RLS (Row Level Security) 설정
ALTER TABLE blog_analytics ENABLE ROW LEVEL SECURITY;

-- 서비스 역할이 모든 데이터에 접근할 수 있도록 정책 생성
CREATE POLICY "Service role can do everything" ON blog_analytics
  FOR ALL USING (true);

-- 인증된 사용자가 읽기만 할 수 있도록 정책 생성
CREATE POLICY "Authenticated users can read" ON blog_analytics
  FOR SELECT USING (auth.role() = 'authenticated');
