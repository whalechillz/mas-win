-- 누락된 컬럼 추가 (customerPersona, conversionGoal, summary)
ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS customerPersona varchar,
ADD COLUMN IF NOT EXISTS conversionGoal varchar,
ADD COLUMN IF NOT EXISTS summary varchar;

-- 기존 데이터에 기본값 설정
UPDATE blog_posts 
SET 
  customerPersona = COALESCE(customerPersona, ''),
  conversionGoal = COALESCE(conversionGoal, 'awareness'),
  summary = COALESCE(summary, '')
WHERE customerPersona IS NULL OR conversionGoal IS NULL OR summary IS NULL;

-- 컬럼 코멘트 추가
COMMENT ON COLUMN blog_posts.customerPersona IS '고객 페르소나 정보';
COMMENT ON COLUMN blog_posts.conversionGoal IS '기존 conversionGoal 필드 (legacy)';
COMMENT ON COLUMN blog_posts.summary IS '게시물 요약';

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_blog_posts_customerPersona ON blog_posts(customerPersona);
CREATE INDEX IF NOT EXISTS idx_blog_posts_conversionGoal ON blog_posts(conversionGoal);
CREATE INDEX IF NOT EXISTS idx_blog_posts_summary ON blog_posts(summary);

-- 추가 후 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'blog_posts' 
AND column_name IN ('customerPersona', 'conversionGoal', 'summary')
ORDER BY column_name;
