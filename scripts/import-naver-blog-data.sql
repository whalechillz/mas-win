-- 기존 네이버 블로그 데이터 임포트 스크립트
-- 먼저 blog_platforms에서 네이버 플랫폼 ID 확인
DO $$
DECLARE
    naver_platform_id UUID;
    blog_content_id UUID;
    naver_post_id UUID;
BEGIN
    -- 네이버 플랫폼 ID 조회
    SELECT id INTO naver_platform_id FROM blog_platforms WHERE type = 'naver' LIMIT 1;
    
    -- 각 블로그 포스트에 대해 처리
    -- 예시 데이터 (실제로는 CSV 파일에서 읽어와야 함)
    
    -- 1. blog_contents에 데이터 삽입
    INSERT INTO blog_contents (title, content_type, platform_id, scheduled_date, status, content)
    VALUES 
    ('[사용자 리뷰] "드라이버는 진화한다" – 평택 중급 골퍼의 MASGOLF 골드2 시타 체험기', 'blog', naver_platform_id, '2025-05-30', 'published', '박영구 후기')
    RETURNING id INTO blog_content_id;
    
    -- 2. naver_blog_posts에 데이터 삽입
    INSERT INTO naver_blog_posts (blog_content_id, naver_blog_url, view_count, published_at, last_view_check)
    VALUES (blog_content_id, 'https://blog.naver.com/mas9golf/223883189153', 9, '2025-05-30', NOW());
    
    -- 3. 조회수 히스토리 기록
    INSERT INTO blog_view_history (naver_blog_post_id, recorded_date, view_count)
    SELECT id, '2025-07-10', 9 FROM naver_blog_posts WHERE blog_content_id = blog_content_id;
    
    -- 나머지 데이터도 동일한 방식으로 처리...
END $$;