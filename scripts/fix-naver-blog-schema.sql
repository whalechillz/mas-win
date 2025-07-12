-- 네이버 블로그 관련 테이블 생성 스크립트

-- 1. 네이버 블로그 포스트 테이블
CREATE TABLE IF NOT EXISTS naver_blog_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  blog_content_id UUID REFERENCES blog_contents(id) ON DELETE CASCADE,
  naver_blog_url TEXT NOT NULL,
  view_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0, 
  like_count INTEGER DEFAULT 0,
  last_view_check TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  published_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. 조회수 히스토리 테이블
CREATE TABLE IF NOT EXISTS blog_view_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  naver_blog_post_id UUID REFERENCES naver_blog_posts(id) ON DELETE CASCADE,
  recorded_date DATE NOT NULL,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(naver_blog_post_id, recorded_date)
);

-- 3. 인덱스 생성
CREATE INDEX idx_naver_blog_posts_content_id ON naver_blog_posts(blog_content_id);
CREATE INDEX idx_naver_blog_posts_url ON naver_blog_posts(naver_blog_url);
CREATE INDEX idx_blog_view_history_date ON blog_view_history(recorded_date);

-- 4. RLS 정책 (필요한 경우)
ALTER TABLE naver_blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_view_history ENABLE ROW LEVEL SECURITY;

-- 5. 업데이트 트리거 (선택사항)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_naver_blog_posts_updated_at 
  BEFORE UPDATE ON naver_blog_posts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
