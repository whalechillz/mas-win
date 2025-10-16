-- 기존 소문자 컬럼을 camelCase로 이름 변경
ALTER TABLE blog_posts RENAME COLUMN customerpersona TO "customerPersona";
ALTER TABLE blog_posts RENAME COLUMN conversiongoal TO "conversionGoal";

-- 기존 데이터에 기본값 설정 (필요한 경우)
UPDATE blog_posts SET "customerPersona" = COALESCE("customerPersona", '') WHERE "customerPersona" IS NULL;
UPDATE blog_posts SET "conversionGoal" = COALESCE("conversionGoal", 'awareness') WHERE "conversionGoal" IS NULL;

-- 컬럼 코멘트 추가
COMMENT ON COLUMN blog_posts."customerPersona" IS '고객 페르소나 정보 (camelCase)';
COMMENT ON COLUMN blog_posts."conversionGoal" IS '기존 conversionGoal 필드 (camelCase legacy)';

-- 인덱스 추가
CREATE INDEX idx_blog_posts_customerPersona ON blog_posts("customerPersona");
CREATE INDEX idx_blog_posts_conversionGoal ON blog_posts("conversionGoal");

-- 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'blog_posts' 
AND column_name IN ('customerPersona', 'conversionGoal')
ORDER BY column_name;
