-- 초간단 블로그 관리 테이블
-- 하나의 주제를 3개 다른 앵글로 관리

CREATE TABLE IF NOT EXISTS simple_blog_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- 기본 정보
  topic TEXT NOT NULL,              -- 주제 (예: "시니어 골퍼를 위한 MASGOLF 드라이버")
  angle TEXT NOT NULL,              -- 앵글: review, tip, comparison
  title TEXT NOT NULL,              -- 실제 제목 (앵글 반영)
  
  -- 발행 정보
  account TEXT NOT NULL,            -- mas9golf, massgoogolf, massgoogolfkorea
  assignee TEXT NOT NULL,           -- J, S, 미, 조
  publish_time TEXT,                -- 예정 시간 (09:00, 14:00, 19:00)
  
  -- 상태 관리
  status TEXT DEFAULT 'idea',       -- idea, writing, ready, published
  naver_url TEXT,                   -- 네이버 URL
  published_at TIMESTAMPTZ,         -- 실제 발행 시간
  view_count INTEGER DEFAULT 0,     -- 조회수
  
  -- 메타 정보
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_simple_blog_topic ON simple_blog_posts(topic);
CREATE INDEX idx_simple_blog_status ON simple_blog_posts(status);
CREATE INDEX idx_simple_blog_account ON simple_blog_posts(account);

-- 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_simple_blog_posts_updated_at 
BEFORE UPDATE ON simple_blog_posts 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();