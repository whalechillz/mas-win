-- 누락된 camelCase 컬럼들 추가
ALTER TABLE blog_posts ADD COLUMN customerPersona varchar;
ALTER TABLE blog_posts ADD COLUMN conversionGoal varchar;

-- 기존 데이터에 기본값 설정
UPDATE blog_posts SET customerPersona = '' WHERE customerPersona IS NULL;
UPDATE blog_posts SET conversionGoal = 'awareness' WHERE conversionGoal IS NULL;

-- 컬럼 코멘트 추가
COMMENT ON COLUMN blog_posts.customerPersona IS '고객 페르소나 정보 (camelCase)';
COMMENT ON COLUMN blog_posts.conversionGoal IS '기존 conversionGoal 필드 (camelCase legacy)';

-- 인덱스 추가
CREATE INDEX idx_blog_posts_customerPersona ON blog_posts(customerPersona);
CREATE INDEX idx_blog_posts_conversionGoal ON blog_posts(conversionGoal);

-- 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'blog_posts' 
AND column_name IN ('customerPersona', 'conversionGoal', 'customerpersona', 'conversiongoal')
ORDER BY column_name;
