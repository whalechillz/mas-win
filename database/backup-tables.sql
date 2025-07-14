-- Supabase SQL Editor에서 실행 가능한 백업 스크립트

-- 1. blog_contents 백업 테이블 생성
CREATE TABLE blog_contents_backup_20250114 AS 
SELECT * FROM blog_contents;

-- 2. blog_platforms 백업 테이블 생성
CREATE TABLE blog_platforms_backup_20250114 AS 
SELECT * FROM blog_platforms;

-- 3. 백업 확인
SELECT 'blog_contents' as table_name, COUNT(*) as row_count FROM blog_contents
UNION ALL
SELECT 'blog_contents_backup' as table_name, COUNT(*) as row_count FROM blog_contents_backup_20250114
UNION ALL
SELECT 'blog_platforms' as table_name, COUNT(*) as row_count FROM blog_platforms
UNION ALL
SELECT 'blog_platforms_backup' as table_name, COUNT(*) as row_count FROM blog_platforms_backup_20250114;

-- 백업 완료 후 새 스키마 적용 가능
