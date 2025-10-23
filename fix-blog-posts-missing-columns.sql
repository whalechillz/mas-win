-- blog_posts 테이블에 누락된 컬럼들 추가
-- API에서 사용하는 모든 필드가 테이블에 존재하도록 보장

-- 1. seo_keywords 컬럼 추가 (TEXT[] 타입)
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS seo_keywords TEXT[] DEFAULT ARRAY[]::TEXT[];

-- 2. meta_keywords 컬럼 추가 (TEXT 타입)
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS meta_keywords TEXT;

-- 3. meta_title 컬럼 추가 (VARCHAR 타입)
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255);

-- 4. meta_description 컬럼 추가 (TEXT 타입)
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- 5. author 컬럼 추가 (VARCHAR 타입)
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS author VARCHAR(100) DEFAULT '마쓰구골프';

-- 6. tags 컬럼 추가 (TEXT[] 타입)
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

-- 7. featured_image 컬럼 추가 (VARCHAR 타입)
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS featured_image VARCHAR(500);

-- 8. excerpt 컬럼 추가 (TEXT 타입)
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS excerpt TEXT;

-- 9. slug 컬럼 추가 (VARCHAR 타입)
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- 10. status 컬럼 추가 (VARCHAR 타입)
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft';

-- 11. category 컬럼 추가 (VARCHAR 타입)
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT '기타';

-- 12. published_at 컬럼 추가 (TIMESTAMP 타입)
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP;

-- 13. created_at 컬럼 추가 (TIMESTAMP 타입)
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- 14. updated_at 컬럼 추가 (TIMESTAMP 타입)
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- 15. calendar_id 컬럼 추가 (UUID 타입)
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS calendar_id UUID;

-- 16. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_blog_posts_seo_keywords ON blog_posts USING gin(seo_keywords);
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags ON blog_posts USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_calendar_id ON blog_posts(calendar_id);

-- 17. 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'blog_posts' 
ORDER BY ordinal_position;
