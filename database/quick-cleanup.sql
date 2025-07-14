-- 🧹 즉시 실행 가능한 정리 스크립트
-- 안전하게 데이터 없는 테이블만 삭제

-- 1. 백업 테이블 삭제 (안전)
DROP TABLE IF EXISTS blog_contents_backup_20250114 CASCADE;
DROP TABLE IF EXISTS blog_platforms_backup_20250114 CASCADE;

-- 2. 비어있는 테이블 삭제 (안전)
DROP TABLE IF EXISTS ai_content_suggestions CASCADE;    -- 0 rows
DROP TABLE IF EXISTS annual_marketing_plans CASCADE;    -- 0 rows
DROP TABLE IF EXISTS marketing_workflows CASCADE;       -- 0 rows
DROP TABLE IF EXISTS notification_settings CASCADE;     -- 0 rows
DROP TABLE IF EXISTS blog_view_history CASCADE;        -- 0 rows
DROP TABLE IF EXISTS bookings CASCADE;                 -- 0 rows (뷰 사용)
DROP TABLE IF EXISTS naver_blog_posts CASCADE;         -- 0 rows
DROP TABLE IF EXISTS website_publishing CASCADE;        -- 0 rows
DROP TABLE IF EXISTS content_analytics CASCADE;        -- 0 rows
DROP TABLE IF EXISTS customer_segments CASCADE;        -- 0 rows
DROP TABLE IF EXISTS campaign_metrics CASCADE;         -- 0 rows

-- 3. 중복 뷰 삭제
DROP VIEW IF EXISTS content_publishing_status CASCADE;

-- 4. 결과 확인
SELECT 
    'Tables: ' || COUNT(*) as count
FROM pg_tables 
WHERE schemaname = 'public'
UNION ALL
SELECT 
    'Views: ' || COUNT(*) 
FROM pg_views 
WHERE schemaname = 'public';

-- 5. 남은 테이블 목록
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size('public.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;