-- MASSGOO 콘텐츠 캘린더 시스템 데이터베이스 스키마
-- Created: 2025-01-15
-- Database: PostgreSQL (Supabase)

-- =====================================================
-- 1. 콘텐츠 캘린더 마스터 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS content_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  week INTEGER NOT NULL CHECK (week >= 1 AND week <= 5),
  content_date DATE NOT NULL,
  season VARCHAR(20) NOT NULL CHECK (season IN ('spring', 'summer', 'autumn', 'winter')),
  theme VARCHAR(100) NOT NULL,
  campaign_id VARCHAR(50),
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('blog', 'social', 'email', 'funnel', 'video')),
  title VARCHAR(200) NOT NULL,
  subtitle VARCHAR(300),
  description TEXT,
  target_audience JSONB DEFAULT '{"primary": "senior_golfers", "age_range": "50-70"}',
  keywords TEXT[],
  hashtags TEXT[],
  tone_and_manner JSONB DEFAULT '{"tone": "professional", "voice": "encouraging"}',
  content_body TEXT,
  content_html TEXT,
  thumbnail_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'planned' CHECK (status IN ('planned', 'draft', 'review', 'approved', 'published', 'archived')),
  priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  assigned_to VARCHAR(100),
  reviewed_by VARCHAR(100),
  approved_by VARCHAR(100),
  published_at TIMESTAMP,
  published_channels JSONB DEFAULT '[]',
  performance_metrics JSONB DEFAULT '{}',
  seo_meta JSONB DEFAULT '{}',
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(content_date, content_type, title)
);

-- 인덱스 생성
CREATE INDEX idx_content_calendar_date ON content_calendar(content_date);
CREATE INDEX idx_content_calendar_status ON content_calendar(status);
CREATE INDEX idx_content_calendar_type ON content_calendar(content_type);
CREATE INDEX idx_content_calendar_campaign ON content_calendar(campaign_id);

-- =====================================================
-- 2. 콘텐츠 템플릿 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(100) NOT NULL UNIQUE,
  content_type VARCHAR(50) NOT NULL,
  category VARCHAR(50),
  structure JSONB NOT NULL,
  placeholders JSONB DEFAULT '{}',
  tone_keywords TEXT[],
  sample_content TEXT,
  preview_html TEXT,
  usage_count INTEGER DEFAULT 0,
  performance_score DECIMAL(3,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 3. 브랜드 가이드라인 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS brand_guidelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL,
  guideline_type VARCHAR(50) NOT NULL CHECK (guideline_type IN ('tone', 'visual', 'content', 'legal')),
  do_guidelines TEXT[],
  dont_guidelines TEXT[],
  voice_attributes JSONB DEFAULT '{}',
  visual_guidelines JSONB DEFAULT '{}',
  sample_phrases TEXT[],
  forbidden_words TEXT[],
  power_words TEXT[],
  color_palette JSONB DEFAULT '{}',
  font_guidelines JSONB DEFAULT '{}',
  image_guidelines JSONB DEFAULT '{}',
  priority INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 4. 연간 캠페인 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS annual_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id VARCHAR(50) NOT NULL UNIQUE,
  campaign_name VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  quarter INTEGER CHECK (quarter >= 1 AND quarter <= 4),
  month INTEGER CHECK (month >= 1 AND month <= 12),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  theme VARCHAR(100) NOT NULL,
  objectives TEXT[],
  target_metrics JSONB DEFAULT '{}',
  budget DECIMAL(10,2),
  channels TEXT[],
  key_messages TEXT[],
  content_pillars JSONB DEFAULT '[]',
  status VARCHAR(50) DEFAULT 'planned',
  actual_metrics JSONB DEFAULT '{}',
  roi DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 5. 콘텐츠 성과 분석 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS content_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES content_calendar(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL,
  measurement_date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  unique_views INTEGER DEFAULT 0,
  engagement_count INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2),
  clicks INTEGER DEFAULT 0,
  click_through_rate DECIMAL(5,2),
  conversions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2),
  revenue_impact DECIMAL(10,2),
  bounce_rate DECIMAL(5,2),
  avg_time_on_page INTEGER,
  social_shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  sentiment_score DECIMAL(3,2),
  analyzed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(content_id, channel, measurement_date)
);

-- 인덱스 생성
CREATE INDEX idx_performance_content ON content_performance(content_id);
CREATE INDEX idx_performance_date ON content_performance(measurement_date);

-- =====================================================
-- 6. AI 생성 로그 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES content_calendar(id),
  generation_type VARCHAR(50) NOT NULL,
  prompt TEXT NOT NULL,
  model_used VARCHAR(50),
  parameters JSONB DEFAULT '{}',
  generated_content TEXT,
  quality_score DECIMAL(3,2),
  tokens_used INTEGER,
  cost DECIMAL(6,4),
  error_message TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 7. 콘텐츠 버전 관리 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES content_calendar(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title VARCHAR(200),
  content_body TEXT,
  content_html TEXT,
  changes_summary TEXT,
  edited_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(content_id, version_number)
);

-- =====================================================
-- 8. 팀 협업 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS content_collaboration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES content_calendar(id) ON DELETE CASCADE,
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(100),
  action VARCHAR(50) NOT NULL,
  comment TEXT,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 9. 콘텐츠 체크리스트 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS content_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES content_calendar(id) ON DELETE CASCADE,
  checklist_type VARCHAR(50) NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  completed_items JSONB DEFAULT '[]',
  completion_rate DECIMAL(5,2) DEFAULT 0,
  checked_by VARCHAR(100),
  checked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 10. 채널 설정 테이블
-- =====================================================
CREATE TABLE IF NOT EXISTS channel_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_name VARCHAR(50) NOT NULL UNIQUE,
  channel_type VARCHAR(50) NOT NULL,
  api_credentials JSONB DEFAULT '{}',
  posting_schedule JSONB DEFAULT '{}',
  auto_publish BOOLEAN DEFAULT false,
  default_hashtags TEXT[],
  character_limit INTEGER,
  image_requirements JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 트리거 함수: updated_at 자동 업데이트
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER update_content_calendar_updated_at BEFORE UPDATE ON content_calendar
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_templates_updated_at BEFORE UPDATE ON content_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_guidelines_updated_at BEFORE UPDATE ON brand_guidelines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_annual_campaigns_updated_at BEFORE UPDATE ON annual_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_checklist_updated_at BEFORE UPDATE ON content_checklist
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channel_settings_updated_at BEFORE UPDATE ON channel_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS (Row Level Security) 정책 설정
-- =====================================================
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE annual_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_collaboration ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 초기 데이터 삽입 (샘플)
-- =====================================================

-- 브랜드 가이드라인 초기 데이터
INSERT INTO brand_guidelines (category, guideline_type, do_guidelines, dont_guidelines, power_words, forbidden_words)
VALUES 
  ('general', 'tone', 
   ARRAY['전문적이고 신뢰감 있는 톤 유지', '시니어 골퍼에 대한 존중 표현', '쉽고 명확한 설명'],
   ARRAY['나이를 강조하는 표현', '부정적인 신체 능력 언급', '복잡한 전문 용어 남발'],
   ARRAY['프리미엄', '혁신', '비거리', '파워', '장인정신', '일본산', '특허', '검증된'],
   ARRAY['노인', '늙은', '쇠퇴', '한계', '싸구려', '저렴한', '복제품']);

-- 채널 설정 초기 데이터
INSERT INTO channel_settings (channel_name, channel_type, character_limit, is_active)
VALUES 
  ('blog', 'owned', NULL, true),
  ('instagram', 'social', 2200, true),
  ('facebook', 'social', 63206, true),
  ('youtube', 'video', NULL, true),
  ('naver_blog', 'owned', NULL, true),
  ('email', 'direct', NULL, true);

-- =====================================================
-- 유용한 뷰(View) 생성
-- =====================================================

-- 이번 달 콘텐츠 캘린더 뷰
CREATE VIEW v_current_month_calendar AS
SELECT 
  cc.*,
  ac.campaign_name,
  COALESCE(cp.total_views, 0) as total_views,
  COALESCE(cp.avg_engagement_rate, 0) as avg_engagement_rate
FROM content_calendar cc
LEFT JOIN annual_campaigns ac ON cc.campaign_id = ac.campaign_id
LEFT JOIN (
  SELECT 
    content_id,
    SUM(views) as total_views,
    AVG(engagement_rate) as avg_engagement_rate
  FROM content_performance
  GROUP BY content_id
) cp ON cc.id = cp.content_id
WHERE 
  EXTRACT(YEAR FROM cc.content_date) = EXTRACT(YEAR FROM CURRENT_DATE)
  AND EXTRACT(MONTH FROM cc.content_date) = EXTRACT(MONTH FROM CURRENT_DATE);

-- 콘텐츠 성과 요약 뷰
CREATE VIEW v_content_performance_summary AS
SELECT 
  cc.id,
  cc.title,
  cc.content_type,
  cc.status,
  cc.content_date,
  COUNT(DISTINCT cp.channel) as channels_published,
  SUM(cp.views) as total_views,
  AVG(cp.engagement_rate) as avg_engagement_rate,
  SUM(cp.conversions) as total_conversions,
  SUM(cp.revenue_impact) as total_revenue
FROM content_calendar cc
LEFT JOIN content_performance cp ON cc.id = cp.content_id
GROUP BY cc.id, cc.title, cc.content_type, cc.status, cc.content_date;

COMMENT ON SCHEMA public IS 'MASSGOO Content Calendar System - Database Schema v1.0';
