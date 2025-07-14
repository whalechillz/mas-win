-- 데이터베이스 정리 및 최적화 스크립트

-- 1. 백업 테이블 삭제
DROP TABLE IF EXISTS blog_contents_backup_20250114 CASCADE;
DROP TABLE IF EXISTS blog_platforms_backup_20250114 CASCADE;

-- 2. 중복 뷰 삭제
DROP VIEW IF EXISTS content_publishing_status CASCADE;

-- 3. 사용하지 않는 테이블 정리
-- ai_content_suggestions가 비어있고 enhanced-campaign-schema.sql의 ai_content_history와 중복
DROP TABLE IF EXISTS ai_content_suggestions CASCADE;

-- 4. 통합 계획 (주의: 데이터가 있으면 마이그레이션 필요)
-- blog_contents와 naver_blog_posts 통합 고려
-- naver_publishing과 website_publishing을 content_distribution으로 통합

-- 5. 인덱스 최적화 (자주 쿼리하는 컬럼)
CREATE INDEX IF NOT EXISTS idx_simple_blog_posts_status ON simple_blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_simple_blog_posts_publish_date ON simple_blog_posts(publish_date);
CREATE INDEX IF NOT EXISTS idx_content_ideas_priority ON content_ideas(priority DESC);
CREATE INDEX IF NOT EXISTS idx_blog_contents_scheduled ON blog_contents(scheduled_date);

-- 6. 정리된 테이블 구조 확인
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 7. 권장 테이블 구조
/*
핵심 테이블만 유지:
1. campaigns - 캠페인 관리
2. simple_blog_posts - 네이버 블로그 (통합)
3. content_ideas - 콘텐츠 아이디어
4. marketing_campaigns - 통합 마케팅 (새로 만들 예정)
5. blog_schedule - 발행 스케줄 (새로 만들 예정)
6. monthly_themes - 월별 테마 (새로 만들 예정)
7. content_distribution - 멀티채널 배포 (새로 만들 예정)
8. marketing_statistics - 통계 (새로 만들 예정)

기존 유지:
- bookings, contacts - 고객 관리
- team_members - 팀 관리
- blog_platforms, content_categories - 마스터 데이터
- quiz_results - 퀴즈 데이터
*/