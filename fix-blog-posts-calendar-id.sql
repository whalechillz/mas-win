-- blog_posts 테이블에 calendar_id 필드 추가
-- 허브 시스템과의 연동을 위한 필수 필드

-- 1. calendar_id 필드 추가
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS calendar_id UUID;

-- 2. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_blog_posts_calendar_id ON blog_posts(calendar_id);

-- 3. 기존 데이터 확인
SELECT 
  COUNT(*) as total_posts,
  COUNT(calendar_id) as posts_with_calendar_id
FROM blog_posts;

-- 4. 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'blog_posts' 
ORDER BY ordinal_position;
