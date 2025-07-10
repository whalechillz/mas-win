-- 블로그 플랫폼 정보
CREATE TABLE IF NOT EXISTS blog_platforms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'website', 'naver', 'google_ads', 'naver_ads', 'instagram', 'facebook', 'youtube', 'shorts'
  url TEXT,
  api_key TEXT,
  api_secret TEXT,
  access_token TEXT,
  refresh_token TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 콘텐츠 카테고리
CREATE TABLE IF NOT EXISTS content_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#8B5CF6', -- HEX color
  parent_id UUID REFERENCES content_categories(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 블로그 콘텐츠 계획
CREATE TABLE IF NOT EXISTS blog_contents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content_type VARCHAR(50) NOT NULL, -- 'blog', 'ad', 'social'
  category_id UUID REFERENCES content_categories(id),
  platform_id UUID REFERENCES blog_platforms(id),
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'scheduled', 'published', 'archived'
  
  -- 콘텐츠 내용
  topic TEXT NOT NULL, -- 주제/글감
  keywords TEXT[], -- 키워드/태그
  outline TEXT, -- 개요
  content TEXT, -- 실제 내용
  ai_suggestions JSONB, -- AI 제안 내용
  
  -- 일정 관련
  scheduled_date DATE,
  published_date TIMESTAMP WITH TIME ZONE,
  author_id VARCHAR(100), -- 작성자
  reviewer_id VARCHAR(100), -- 검토자
  
  -- 성과 추적
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  
  -- 메타 정보
  meta_title VARCHAR(255),
  meta_description TEXT,
  og_image_url TEXT,
  published_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 마케팅 퍼널 단계
CREATE TABLE IF NOT EXISTS marketing_funnel_stages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  stage_order INTEGER NOT NULL,
  description TEXT,
  target_conversion_rate DECIMAL(5,2),
  color VARCHAR(7) DEFAULT '#8B5CF6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 연간 마케팅 계획
CREATE TABLE IF NOT EXISTS annual_marketing_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  funnel_stage_id UUID REFERENCES marketing_funnel_stages(id),
  
  -- 계획
  planned_contents INTEGER DEFAULT 0,
  planned_budget DECIMAL(12,2) DEFAULT 0,
  target_reach INTEGER DEFAULT 0,
  target_conversions INTEGER DEFAULT 0,
  
  -- 실적
  actual_contents INTEGER DEFAULT 0,
  actual_budget DECIMAL(12,2) DEFAULT 0,
  actual_reach INTEGER DEFAULT 0,
  actual_conversions INTEGER DEFAULT 0,
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(year, month, funnel_stage_id)
);

-- 콘텐츠 성과 추적
CREATE TABLE IF NOT EXISTS content_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content_id UUID REFERENCES blog_contents(id),
  date DATE NOT NULL,
  platform_id UUID REFERENCES blog_platforms(id),
  
  -- 성과 지표
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr DECIMAL(5,2) DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0,
  avg_time_on_page INTEGER DEFAULT 0, -- seconds
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(content_id, date, platform_id)
);

-- AI 글감 제안
CREATE TABLE IF NOT EXISTS ai_content_suggestions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category_id UUID REFERENCES content_categories(id),
  suggestion_type VARCHAR(50), -- 'topic', 'title', 'keyword', 'outline'
  suggestion TEXT NOT NULL,
  score DECIMAL(3,2) DEFAULT 0, -- 0-1 relevance score
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 팀 멤버 (간단한 버전, 추후 확장 가능)
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50), -- 'writer', 'editor', 'manager'
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX idx_blog_contents_scheduled_date ON blog_contents(scheduled_date);
CREATE INDEX idx_blog_contents_status ON blog_contents(status);
CREATE INDEX idx_blog_contents_platform ON blog_contents(platform_id);
CREATE INDEX idx_content_analytics_date ON content_analytics(date);
CREATE INDEX idx_annual_marketing_plans_year_month ON annual_marketing_plans(year, month);

-- 기본 데이터 삽입
INSERT INTO blog_platforms (name, type, url) VALUES
  ('마스골프 웹사이트', 'website', 'https://masgolf.co.kr/blog'),
  ('네이버 블로그 - 메인', 'naver', 'https://blog.naver.com/massgoogolf'),
  ('네이버 블로그 - 서브', 'naver', 'https://blog.naver.com/mas9golf'),
  ('네이버 블로그 - 코리아', 'naver', 'https://blog.naver.com/massgoogolfkorea'),
  ('구글 광고', 'google_ads', ''),
  ('네이버 광고', 'naver_ads', '');

INSERT INTO content_categories (name, description, color) VALUES
  ('골프 팁', '골프 기술 및 팁 관련 콘텐츠', '#10B981'),
  ('제품 리뷰', '골프 장비 및 제품 리뷰', '#F59E0B'),
  ('이벤트/프로모션', '할인 및 이벤트 정보', '#EF4444'),
  ('골프장 정보', '골프장 소개 및 리뷰', '#3B82F6'),
  ('골프 뉴스', '골프계 최신 뉴스', '#8B5CF6');

INSERT INTO marketing_funnel_stages (name, stage_order, description, target_conversion_rate, color) VALUES
  ('인지 (Awareness)', 1, '브랜드 인지도 향상', 100.00, '#E5E7EB'),
  ('관심 (Interest)', 2, '제품/서비스에 대한 관심 유발', 50.00, '#9CA3AF'),
  ('고려 (Consideration)', 3, '구매 고려 단계', 20.00, '#6B7280'),
  ('구매 (Purchase)', 4, '실제 구매 전환', 5.00, '#4B5563'),
  ('충성 (Loyalty)', 5, '재구매 및 추천', 2.00, '#1F2937');
