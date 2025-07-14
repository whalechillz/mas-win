-- 🧹 중복/불필요 테이블 정리 스크립트

-- 1. 현재 마케팅 관련 테이블 확인
SELECT 
    table_name,
    pg_size_pretty(pg_total_relation_size(table_name::regclass)) as size
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
    table_name LIKE '%marketing%' 
    OR table_name LIKE '%campaign%' 
    OR table_name LIKE '%blog%'
    OR table_name LIKE '%content%'
    OR table_name LIKE '%theme%'
    OR table_name LIKE '%annual%'
)
ORDER BY table_name;

-- 2. 백업 테이블 생성 (혹시 모르니)
CREATE TABLE IF NOT EXISTS backup_deleted_tables_20250714 AS
SELECT 
    'annual_marketing_plans' as table_name,
    now() as backed_up_at,
    row_to_json(t.*) as data
FROM annual_marketing_plans t
UNION ALL
SELECT 
    'blog_platforms' as table_name,
    now() as backed_up_at,
    row_to_json(t.*) as data
FROM blog_platforms t
UNION ALL
SELECT 
    'content_categories' as table_name,
    now() as backed_up_at,
    row_to_json(t.*) as data
FROM content_categories t;

-- 3. 뷰 정리 (사용하지 않는 뷰들)
DROP VIEW IF EXISTS marketing_campaign_summary CASCADE;
DROP VIEW IF EXISTS blog_content_calendar CASCADE;
DROP VIEW IF EXISTS marketing_funnel_overview CASCADE;
DROP VIEW IF EXISTS campaign_performance_view CASCADE;
DROP VIEW IF EXISTS monthly_theme_calendar CASCADE;
DROP VIEW IF EXISTS annual_theme_plan CASCADE;

-- 4. 중복/불필요 테이블 삭제
-- annual_marketing_plans는 monthly_themes와 중복
DROP TABLE IF EXISTS annual_marketing_plans CASCADE;

-- blog 관련 구버전 테이블들 (content_ideas로 통합됨)
DROP TABLE IF EXISTS blog_contents CASCADE;
DROP TABLE IF EXISTS blog_platforms CASCADE;
DROP TABLE IF EXISTS content_categories CASCADE;
DROP TABLE IF EXISTS marketing_funnel_stages CASCADE;

-- 구버전 캠페인 테이블 (marketing_campaigns로 통합됨)
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS campaign_channels CASCADE;

-- 5. 현재 사용 중인 핵심 테이블 확인
SELECT '✅ 유지할 핵심 테이블들:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'monthly_themes',           -- 월별 마케팅 테마
    'marketing_campaigns',      -- 마케팅 캠페인
    'content_ideas',           -- 멀티채널 콘텐츠
    'simple_blog_posts',       -- 간단 블로그 관리
    'contacts',                -- 고객 정보
    'page_views',              -- 페이지 뷰
    'conversions',             -- 전환
    'user_auth',               -- 사용자 인증
    'team_members'             -- 팀 멤버
);

-- 6. marketing_campaigns에 monthly_theme_id 컬럼 추가 (없으면)
ALTER TABLE marketing_campaigns 
ADD COLUMN IF NOT EXISTS monthly_theme_id INTEGER REFERENCES monthly_themes(id);

-- 7. 기존 캠페인과 월별 테마 연결
UPDATE marketing_campaigns mc
SET monthly_theme_id = mt.id
FROM monthly_themes mt
WHERE mc.year = mt.year 
AND mc.month = mt.month;

-- 8. 정리 후 테이블 목록 재확인
SELECT '🔍 정리 후 남은 테이블:' as status;
SELECT 
    table_name,
    pg_size_pretty(pg_total_relation_size(table_name::regclass)) as size
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
AND table_name NOT LIKE 'backup_%'
ORDER BY table_name;