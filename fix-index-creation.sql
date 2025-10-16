-- 인덱스 생성 (IF NOT EXISTS 사용)
CREATE INDEX IF NOT EXISTS idx_blog_posts_customerPersona ON blog_posts("customerPersona");
CREATE INDEX IF NOT EXISTS idx_blog_posts_conversionGoal ON blog_posts("conversionGoal");

-- 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'blog_posts' 
AND column_name IN ('customerPersona', 'conversionGoal')
ORDER BY column_name;
