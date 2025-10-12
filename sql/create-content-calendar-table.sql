-- 콘텐츠 캘린더 테이블 생성
-- cc_content_calendar 테이블이 없어서 발생한 에러를 해결하기 위해 테이블을 먼저 생성

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
  campaign_id UUID,
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('blog', 'social', 'email', 'funnel', 'video')),
  
  -- 콘텐츠 내용
  title VARCHAR(500) NOT NULL,
  subtitle VARCHAR(500),
  description TEXT,
  
  -- 타겟 정보
  target_audience JSONB DEFAULT '{"persona": "시니어 골퍼", "stage": "awareness"}',
  
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
  assigned_to UUID,
  reviewed_by UUID,
  approved_by UUID,
  
  -- 발행 정보
  published_at TIMESTAMPTZ,
  published_channels JSONB DEFAULT '["blog", "naver_blog"]',
  
  -- 성과 메트릭
  performance_metrics JSONB DEFAULT '{}',
  
  -- SEO 메타
  seo_meta JSONB DEFAULT '{"description": "", "keywords": ""}',
  
  -- 전환 추적 정보
  conversion_tracking JSONB DEFAULT '{"goal": "홈페이지 방문", "landingPage": "https://win.masgolf.co.kr", "utmParams": {"source": "blog", "medium": "organic"}}',
  
  -- 기존 블로그 시스템 연동
  blog_post_id UUID,
  naver_scraper_id UUID,
  source VARCHAR(50), -- 'manual', 'ai_generated', 'naver_scraper', 'imported'
  
  -- 시스템 필드
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ, -- Soft delete
  
  -- 인덱스를 위한 필드
  search_vector tsvector,
  
  UNIQUE(year, month, content_date, title)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_cc_content_calendar_date ON cc_content_calendar(content_date);
CREATE INDEX IF NOT EXISTS idx_cc_content_calendar_status ON cc_content_calendar(status);
CREATE INDEX IF NOT EXISTS idx_cc_content_calendar_type ON cc_content_calendar(content_type);
CREATE INDEX IF NOT EXISTS idx_cc_content_calendar_assigned ON cc_content_calendar(assigned_to);
CREATE INDEX IF NOT EXISTS idx_cc_content_calendar_search ON cc_content_calendar USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_cc_content_calendar_blog_post ON cc_content_calendar(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_cc_content_calendar_naver_scraper ON cc_content_calendar(naver_scraper_id);
CREATE INDEX IF NOT EXISTS idx_cc_content_calendar_target_audience ON cc_content_calendar USING gin(target_audience);
CREATE INDEX IF NOT EXISTS idx_cc_content_calendar_conversion_tracking ON cc_content_calendar USING gin(conversion_tracking);
CREATE INDEX IF NOT EXISTS idx_cc_content_calendar_published_channels ON cc_content_calendar USING gin(published_channels);

-- RLS (Row Level Security) 설정
ALTER TABLE cc_content_calendar ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있도록 정책 설정
CREATE POLICY "Enable read access for all users" ON cc_content_calendar
FOR SELECT USING (TRUE);

-- 인증된 사용자가 삽입, 업데이트, 삭제할 수 있도록 정책 설정
CREATE POLICY "Enable insert for authenticated users" ON cc_content_calendar
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON cc_content_calendar
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON cc_content_calendar
FOR DELETE USING (auth.role() = 'authenticated');
