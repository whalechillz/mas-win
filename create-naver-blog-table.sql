-- 네이버 블로그 고급 에디터를 위한 테이블 생성
-- 네이버 블로그 특화 기능과 SEO 최적화를 위한 테이블

-- 1. 기존 channel_naver_blog 테이블 삭제 (데이터 백업 필요시 별도 처리)
DROP TABLE IF EXISTS channel_naver_blog CASCADE;

-- 2. 새로운 네이버 블로그 포스트 테이블 생성
CREATE TABLE IF NOT EXISTS naver_blog_posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  category VARCHAR(50) DEFAULT '골프',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  featured_image VARCHAR(500),
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords TEXT,
  
  -- 네이버 블로그 특화 필드
  naver_blog_id VARCHAR(100),
  naver_post_url VARCHAR(500),
  naver_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  naver_category VARCHAR(50) DEFAULT '골프',
  naver_visibility VARCHAR(20) DEFAULT 'public' CHECK (naver_visibility IN ('public', 'private', 'friends')),
  naver_allow_comments BOOLEAN DEFAULT true,
  naver_allow_trackbacks BOOLEAN DEFAULT true,
  
  -- SEO 분석 결과
  seo_score INTEGER DEFAULT 0,
  seo_analysis JSONB,
  keyword_density DECIMAL(5,2) DEFAULT 0,
  readability_score INTEGER DEFAULT 0,
  engagement_score INTEGER DEFAULT 0,
  
  -- 허브 연동
  calendar_id UUID,
  
  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_naver_blog_posts_status ON naver_blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_naver_blog_posts_category ON naver_blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_naver_blog_posts_created_at ON naver_blog_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_naver_blog_posts_calendar_id ON naver_blog_posts(calendar_id);
CREATE INDEX IF NOT EXISTS idx_naver_blog_posts_naver_blog_id ON naver_blog_posts(naver_blog_id);
CREATE INDEX IF NOT EXISTS idx_naver_blog_posts_seo_score ON naver_blog_posts(seo_score);

-- 3. GIN 인덱스 (배열 필드용)
CREATE INDEX IF NOT EXISTS idx_naver_blog_posts_tags ON naver_blog_posts USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_naver_blog_posts_naver_tags ON naver_blog_posts USING gin(naver_tags);

-- 4. 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_naver_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. 업데이트 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_naver_blog_posts_updated_at ON naver_blog_posts;
CREATE TRIGGER trigger_update_naver_blog_posts_updated_at
  BEFORE UPDATE ON naver_blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_naver_blog_posts_updated_at();

-- 6. 네이버 트렌드 분석 테이블
CREATE TABLE IF NOT EXISTS naver_trends (
  id SERIAL PRIMARY KEY,
  keyword VARCHAR(100) NOT NULL,
  volume INTEGER NOT NULL,
  trend VARCHAR(20) DEFAULT 'stable' CHECK (trend IN ('up', 'down', 'stable')),
  category VARCHAR(50) DEFAULT '골프',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 네이버 경쟁사 분석 테이블
CREATE TABLE IF NOT EXISTS naver_competitors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  posts_count INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  last_analyzed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 네이버 SEO 분석 히스토리 테이블
CREATE TABLE IF NOT EXISTS naver_seo_history (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES naver_blog_posts(id) ON DELETE CASCADE,
  seo_score INTEGER NOT NULL,
  analysis_data JSONB,
  recommendations TEXT[],
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_naver_trends_keyword ON naver_trends(keyword);
CREATE INDEX IF NOT EXISTS idx_naver_trends_volume ON naver_trends(volume);
CREATE INDEX IF NOT EXISTS idx_naver_competitors_name ON naver_competitors(name);
CREATE INDEX IF NOT EXISTS idx_naver_seo_history_post_id ON naver_seo_history(post_id);
CREATE INDEX IF NOT EXISTS idx_naver_seo_history_analyzed_at ON naver_seo_history(analyzed_at);

-- 10. 샘플 데이터 삽입
INSERT INTO naver_trends (keyword, volume, trend, category) VALUES
('골프 드라이버', 8500, 'up', '골프'),
('비거리 향상', 6200, 'up', '골프'),
('고반발 드라이버', 4800, 'up', '골프'),
('골프 스윙', 12000, 'stable', '골프'),
('골프 클럽', 9500, 'down', '골프'),
('골프 레슨', 7800, 'up', '골프'),
('골프 연습', 5600, 'stable', '골프'),
('골프 용품', 4200, 'up', '골프'),
('골프장', 15000, 'stable', '골프'),
('골프 동호회', 3200, 'up', '골프')
ON CONFLICT DO NOTHING;

INSERT INTO naver_competitors (name, posts_count, engagement_rate, keywords) VALUES
('골프존', 1250, 85.5, ARRAY['골프', '드라이버', '비거리']),
('골프샵', 980, 78.2, ARRAY['골프', '클럽', '스윙']),
('골프매니아', 750, 82.1, ARRAY['골프', '연습', '레슨'])
ON CONFLICT DO NOTHING;

-- 11. 테이블 구조 확인
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name IN ('naver_blog_posts', 'naver_trends', 'naver_competitors', 'naver_seo_history')
ORDER BY table_name, ordinal_position;
