-- 1단계: 현재 컬럼 상태 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'blog_posts' 
AND (column_name LIKE '%customer%' OR column_name LIKE '%conversion%')
ORDER BY column_name;

-- 2단계: 소문자 컬럼이 있다면 camelCase로 변경
-- (실행 전에 위 쿼리 결과를 확인하고 필요시에만 실행)
-- ALTER TABLE blog_posts RENAME COLUMN customerpersona TO "customerPersona";
-- ALTER TABLE blog_posts RENAME COLUMN conversiongoal TO "conversionGoal";

-- 3단계: 변경 후 확인
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'blog_posts' 
-- AND column_name IN ('customerPersona', 'conversionGoal')
-- ORDER BY column_name;
