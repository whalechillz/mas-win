-- 테이블 정리 결과 확인 스크립트

-- 1. 현재 테이블 개수 확인
SELECT 
    'Before cleanup:' as status,
    COUNT(*) as table_count
FROM pg_tables 
WHERE schemaname = 'public';

-- 2. 정리 스크립트 실행 (안전한 것만)
-- 백업 테이블 삭제
DROP TABLE IF EXISTS blog_contents_backup_20250114 CASCADE;
DROP TABLE IF EXISTS blog_platforms_backup_20250114 CASCADE;
DROP TABLE IF EXISTS blog_contents_backup_temp CASCADE;
DROP TABLE IF EXISTS simple_blog_posts_backup_temp CASCADE;
DROP TABLE IF EXISTS naver_publishing_backup_temp CASCADE;

-- 빈 테이블 삭제 (데이터가 있는지 먼저 확인)
DO $$
DECLARE
    table_rec RECORD;
    row_count INTEGER;
BEGIN
    FOR table_rec IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'ai_content_suggestions',
            'annual_marketing_plans',
            'marketing_workflows',
            'notification_settings',
            'blog_view_history',
            'bookings',
            'naver_blog_posts',
            'website_publishing',
            'content_analytics',
            'customer_segments',
            'campaign_metrics'
        )
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I', table_rec.tablename) INTO row_count;
        
        IF row_count = 0 THEN
            EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', table_rec.tablename);
            RAISE NOTICE 'Dropped empty table: %', table_rec.tablename;
        ELSE
            RAISE NOTICE 'Table % has % rows, not dropping', table_rec.tablename, row_count;
        END IF;
    END LOOP;
END $$;

-- 중복 뷰 삭제
DROP VIEW IF EXISTS content_publishing_status CASCADE;

-- 3. 정리 후 테이블 개수 확인
SELECT 
    'After cleanup:' as status,
    COUNT(*) as table_count
FROM pg_tables 
WHERE schemaname = 'public';

-- 4. 남은 테이블 목록 및 크기
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size('public.'||tablename)) as size,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_schema = 'public' AND table_name = tablename) as column_count
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size('public.'||tablename) DESC;

-- 5. 뷰 목록
SELECT 
    viewname,
    definition
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;