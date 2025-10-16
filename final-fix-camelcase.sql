-- 소문자 컬럼을 camelCase로 정확히 변경
ALTER TABLE blog_posts RENAME COLUMN customerpersona TO "customerPersona";
ALTER TABLE blog_posts RENAME COLUMN conversiongoal TO "conversionGoal";
ALTER TABLE blog_posts RENAME COLUMN summary TO "summary";

-- 기존 데이터에 기본값 설정
UPDATE blog_posts SET "customerPersona" = COALESCE("customerPersona", '') WHERE "customerPersona" IS NULL;
UPDATE blog_posts SET "conversionGoal" = COALESCE("conversionGoal", 'awareness') WHERE "conversionGoal" IS NULL;
UPDATE blog_posts SET "summary" = COALESCE("summary", '') WHERE "summary" IS NULL;

-- 컬럼 코멘트 업데이트
COMMENT ON COLUMN blog_posts."customerPersona" IS '고객 페르소나 정보 (camelCase)';
COMMENT ON COLUMN blog_posts."conversionGoal" IS '기존 conversionGoal 필드 (camelCase legacy)';
COMMENT ON COLUMN blog_posts."summary" IS '게시물 요약 (camelCase)';

-- 인덱스 생성 (IF NOT EXISTS 사용)
CREATE INDEX IF NOT EXISTS idx_blog_posts_customerPersona ON blog_posts("customerPersona");
CREATE INDEX IF NOT EXISTS idx_blog_posts_conversionGoal ON blog_posts("conversionGoal");
CREATE INDEX IF NOT EXISTS idx_blog_posts_summary ON blog_posts("summary");

-- 최종 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'blog_posts' 
AND column_name IN ('customerPersona', 'conversionGoal', 'summary')
ORDER BY column_name;
