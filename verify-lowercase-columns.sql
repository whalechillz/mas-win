-- 현재 소문자 컬럼들 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'blog_posts' 
AND column_name IN ('customerpersona', 'conversiongoal', 'summary')
ORDER BY column_name;
