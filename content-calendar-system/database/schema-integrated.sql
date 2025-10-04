-- Updated Database Schema for Content Calendar System
-- Compatible with existing blog system
-- Uses cc_ prefix for all content calendar tables to avoid conflicts

-- =====================================================
-- 1. 콘텐츠 캘린더 테이블 (기존 blog_posts 테이블과 분리)
-- =====================================================
CREATE TABLE IF NOT EXISTS cc_content_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 시간 관련
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  week INTEGER,
  content_date DATE NOT NULL,
  season VARCHAR(10) CHECK (season IN ('spring', 'summer', 'autumn', 'winter')),
  
  -- 콘텐츠 기본 정보
  theme VARCHAR(255),
  campaign_id UUID REFERENCES cc_campaigns(id),
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('blog', 'social', 'email', 'funnel', 'video')),
  
  -- 콘텐츠 내용
  title VARCHAR(500) NOT NULL,
  subtitle VARCHAR(500),
  description TEXT,
  
  -- 타겟 정보
  target_audience JSONB DEFAULT '{}',
  
  -- SEO & 태그
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  hashtags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- 톤앤매너
  tone_and_manner JSONB DEFAULT '{}',
  
  -- 콘텐츠 본문
  content_body TEXT,
  content_html TEXT,
  thumbnail_url VARCHAR(500),
  
  -- 상태 관리
  status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'draft', 'review', 'approved', 'published', 'archived')),
  priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  
  -- 담당자
  assigned_to UUID REFERENCES users(id),
  reviewed_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  
  -- 발행 정보
  published_at TIMESTAMPTZ,
  published_channels JSONB DEFAULT '[]',
  
  -- 성과 메트릭
  performance_metrics JSONB DEFAULT '{}',
  
  -- SEO 메타
  seo_meta JSONB DEFAULT '{}',
  
  -- 기존 블로그 시스템 연동
  blog_post_id UUID REFERENCES blog_posts(id),
  naver_scraper_id UUID REFERENCES naver_scraped_posts(id),
  source VARCHAR(50), -- 'manual', 'ai_generated', 'naver_scraper', 'imported'
  
  -- 시스템 필드
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ, -- Soft delete
  
  -- 인덱스를 위한 필드
  search_vector tsvector,
  
  UNIQUE(year, month, content_date, title)
);

-- 인덱스 생성
CREATE INDEX idx_cc_content_calendar_date ON cc_content_calendar(content_date);
CREATE INDEX idx_cc_content_calendar_status ON cc_content_calendar(status);
CREATE INDEX idx_cc_content_calendar_type ON cc_content_calendar(content_type);
CREATE INDEX idx_cc_content_calendar_assigned ON cc_content_calendar(assigned_to);
CREATE INDEX idx_cc_content_calendar_search ON cc_content_calendar USING gin(search_vector);
CREATE INDEX idx_cc_content_calendar_blog_post ON cc_content_calendar(blog_post_id);
CREATE INDEX idx_cc_content_calendar_naver_scraper ON cc_content_calendar(naver_scraper_id);

-- =====================================================
-- 2. 캠페인 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS cc_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budget DECIMAL(12, 2),
  goals JSONB DEFAULT '{}',
  target_metrics JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'planning',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(name, start_date)
);

-- =====================================================
-- 3. 콘텐츠 템플릿
-- =====================================================
CREATE TABLE IF NOT EXISTS cc_content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  content_type VARCHAR(20) NOT NULL,
  category VARCHAR(100),
  template_body TEXT,
  template_structure JSONB,
  variables JSONB DEFAULT '{}',
  tone_and_manner JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(name, content_type)
);

-- =====================================================
-- 4. 콘텐츠 버전 관리
-- =====================================================
CREATE TABLE IF NOT EXISTS cc_content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES cc_content_calendar(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title VARCHAR(500),
  content_body TEXT,
  content_html TEXT,
  changes_summary TEXT,
  edited_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(content_id, version_number)
);

-- =====================================================
-- 5. 발행 로그
-- =====================================================
CREATE TABLE IF NOT EXISTS cc_publishing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES cc_content_calendar(id),
  channel VARCHAR(50) NOT NULL,
  channel_post_id VARCHAR(255),
  published_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'pending',
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  published_by UUID REFERENCES users(id),
  published_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_cc_publishing_logs_content ON cc_publishing_logs(content_id),
  INDEX idx_cc_publishing_logs_channel ON cc_publishing_logs(channel)
);

-- =====================================================
-- 6. 콘텐츠 성과 분석
-- =====================================================
CREATE TABLE IF NOT EXISTS cc_content_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES cc_content_calendar(id),
  measurement_date DATE NOT NULL,
  channel VARCHAR(50),
  
  -- 주요 메트릭
  views INTEGER DEFAULT 0,
  unique_views INTEGER DEFAULT 0,
  engagement_count INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5, 2),
  click_through_rate DECIMAL(5, 2),
  conversion_rate DECIMAL(5, 2),
  conversions INTEGER DEFAULT 0,
  
  -- 소셜 메트릭
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  
  -- 비즈니스 메트릭
  revenue_impact DECIMAL(12, 2),
  roi DECIMAL(8, 2),
  
  -- 추가 데이터
  raw_data JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(content_id, measurement_date, channel)
);

CREATE INDEX idx_cc_performance_content ON cc_content_performance(content_id);
CREATE INDEX idx_cc_performance_date ON cc_content_performance(measurement_date);
CREATE INDEX idx_cc_performance_channel ON cc_content_performance(channel);

-- =====================================================
-- 7. AI 생성 이력
-- =====================================================
CREATE TABLE IF NOT EXISTS cc_ai_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES cc_content_calendar(id),
  prompt TEXT NOT NULL,
  model VARCHAR(50),
  tokens_used INTEGER,
  cost DECIMAL(8, 4),
  response_quality_score INTEGER CHECK (response_quality_score >= 0 AND response_quality_score <= 100),
  generation_time_ms INTEGER,
  error_message TEXT,
  status VARCHAR(20) DEFAULT 'success',
  generated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 8. 콘텐츠 품질 평가
-- =====================================================
CREATE TABLE IF NOT EXISTS cc_quality_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES cc_content_calendar(id),
  check_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  -- 품질 점수
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  brand_compliance_score INTEGER,
  tone_consistency_score INTEGER,
  seo_optimization_score INTEGER,
  readability_score INTEGER,
  fact_accuracy_score INTEGER,
  legal_compliance_score INTEGER,
  
  -- 상세 결과
  issues JSONB DEFAULT '[]',
  suggestions JSONB DEFAULT '[]',
  
  checked_by UUID REFERENCES users(id),
  approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 9. 네이버 스크래퍼 연동 테이블 (기존 테이블 확장)
-- =====================================================
ALTER TABLE naver_scraped_posts ADD COLUMN IF NOT EXISTS 
  imported_to_calendar BOOLEAN DEFAULT false;

ALTER TABLE naver_scraped_posts ADD COLUMN IF NOT EXISTS 
  calendar_content_id UUID REFERENCES cc_content_calendar(id);

ALTER TABLE naver_scraped_posts ADD COLUMN IF NOT EXISTS 
  import_date TIMESTAMPTZ;

-- =====================================================
-- 10. 블로그 포스트 연동 (기존 테이블 확장)
-- =====================================================
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS 
  calendar_content_id UUID REFERENCES cc_content_calendar(id);

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS 
  sync_from_calendar BOOLEAN DEFAULT false;

-- =====================================================
-- Functions & Triggers
-- =====================================================

-- 자동 업데이트 시간 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 트리거 적용
CREATE TRIGGER update_cc_content_calendar_updated_at 
  BEFORE UPDATE ON cc_content_calendar
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cc_campaigns_updated_at 
  BEFORE UPDATE ON cc_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cc_content_templates_updated_at 
  BEFORE UPDATE ON cc_content_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 전체 텍스트 검색을 위한 함수
CREATE OR REPLACE FUNCTION cc_content_search_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('korean', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('korean', coalesce(NEW.subtitle, '')), 'B') ||
    setweight(to_tsvector('korean', coalesce(NEW.content_body, '')), 'C') ||
    setweight(to_tsvector('korean', coalesce(array_to_string(NEW.keywords, ' '), '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cc_content_search_update 
  BEFORE INSERT OR UPDATE ON cc_content_calendar
  FOR EACH ROW EXECUTE FUNCTION cc_content_search_trigger();

-- =====================================================
-- Views for Integration
-- =====================================================

-- 통합 콘텐츠 뷰 (캘린더 + 블로그)
CREATE OR REPLACE VIEW v_integrated_content AS
SELECT 
  cc.id as calendar_id,
  cc.title,
  cc.content_type,
  cc.content_date,
  cc.status as calendar_status,
  cc.published_at,
  bp.id as blog_post_id,
  bp.status as blog_status,
  bp.published_at as blog_published_at,
  ns.id as scraper_id,
  ns.original_url as naver_url,
  cc.source,
  cc.performance_metrics
FROM cc_content_calendar cc
LEFT JOIN blog_posts bp ON cc.blog_post_id = bp.id
LEFT JOIN naver_scraped_posts ns ON cc.naver_scraper_id = ns.id;

-- 성과 대시보드 뷰
CREATE OR REPLACE VIEW v_content_performance_dashboard AS
SELECT 
  cc.id,
  cc.title,
  cc.content_type,
  cc.content_date,
  cc.status,
  cp.views,
  cp.engagement_rate,
  cp.conversion_rate,
  cp.revenue_impact,
  cp.roi,
  cp.measurement_date
FROM cc_content_calendar cc
LEFT JOIN cc_content_performance cp ON cc.id = cp.content_id
WHERE cp.measurement_date = (
  SELECT MAX(measurement_date) 
  FROM cc_content_performance 
  WHERE content_id = cc.id
);

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- 콘텐츠 캘린더 RLS
ALTER TABLE cc_content_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY cc_content_calendar_select ON cc_content_calendar
  FOR SELECT USING (true);  -- 모든 사용자가 볼 수 있음

CREATE POLICY cc_content_calendar_insert ON cc_content_calendar
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY cc_content_calendar_update ON cc_content_calendar
  FOR UPDATE USING (
    auth.uid() = created_by OR 
    auth.uid() = assigned_to OR
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY cc_content_calendar_delete ON cc_content_calendar
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- =====================================================
-- Initial Data & Settings
-- =====================================================

-- 기본 템플릿 삽입
INSERT INTO cc_content_templates (name, content_type, category, template_body) VALUES
('블로그 기본 템플릿', 'blog', 'general', '# {title}\n\n## 서론\n{introduction}\n\n## 본론\n{main_content}\n\n## 결론\n{conclusion}'),
('소셜 미디어 템플릿', 'social', 'promotion', '{greeting}\n\n{main_message}\n\n{hashtags}\n\n{cta}'),
('이메일 뉴스레터', 'email', 'newsletter', '<h1>{title}</h1>\n<p>{greeting}</p>\n<div>{content}</div>\n<a href="{cta_link}">{cta_text}</a>')
ON CONFLICT DO NOTHING;

-- 권한 설정
GRANT ALL ON cc_content_calendar TO authenticated;
GRANT ALL ON cc_campaigns TO authenticated;
GRANT ALL ON cc_content_templates TO authenticated;
GRANT ALL ON cc_content_versions TO authenticated;
GRANT ALL ON cc_publishing_logs TO authenticated;
GRANT ALL ON cc_content_performance TO authenticated;
GRANT ALL ON cc_ai_generation_logs TO authenticated;
GRANT ALL ON cc_quality_checks TO authenticated;

-- 시퀀스 권한
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
