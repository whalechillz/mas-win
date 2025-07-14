-- 단순하고 명확한 블로그 관리 스키마

-- 1. 핵심 테이블만 유지
-- blog_contents: 모든 콘텐츠
-- naver_blog_posts: 네이버 발행 정보
-- blog_view_history: 조회수 기록

-- 2. 불필요한 복잡성 제거
-- 너무 많은 필드 제거
-- 실제 사용하지 않는 기능 제거

-- 3. blog_contents 테이블 간소화
ALTER TABLE blog_contents 
DROP COLUMN IF EXISTS ai_suggestions,
DROP COLUMN IF EXISTS meta_title,
DROP COLUMN IF EXISTS meta_description,
DROP COLUMN IF EXISTS og_image_url,
DROP COLUMN IF EXISTS reviewer_id,
DROP COLUMN IF EXISTS clicks,
DROP COLUMN IF EXISTS shares,
DROP COLUMN IF EXISTS conversions;

-- 4. 작성자 정보 추가 (중요!)
ALTER TABLE blog_contents 
ADD COLUMN IF NOT EXISTS author_name VARCHAR(50);

-- 5. 네이버 블로그 URL을 blog_contents에 직접 추가 (단순화)
ALTER TABLE blog_contents 
ADD COLUMN IF NOT EXISTS naver_url TEXT,
ADD COLUMN IF NOT EXISTS last_view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_view_check TIMESTAMP;

-- 6. 기존 데이터 마이그레이션을 위한 뷰
CREATE OR REPLACE VIEW blog_posts_simple AS
SELECT 
    bc.id,
    bc.title,
    bc.scheduled_date as published_date,
    bc.content as topic,
    bc.author_name,
    bp.name as platform_name,
    bc.naver_url,
    bc.last_view_count as view_count,
    bc.last_view_check,
    bc.created_at
FROM blog_contents bc
LEFT JOIN blog_platforms bp ON bc.platform_id = bp.id
WHERE bc.content_type = 'blog'
ORDER BY bc.scheduled_date DESC;

-- 7. 조회수 업데이트를 위한 간단한 함수
CREATE OR REPLACE FUNCTION update_blog_view_count(
    p_content_id UUID,
    p_view_count INTEGER
) RETURNS void AS $$
BEGIN
    -- blog_contents 업데이트
    UPDATE blog_contents 
    SET 
        last_view_count = p_view_count,
        last_view_check = NOW()
    WHERE id = p_content_id;
    
    -- 히스토리 기록
    INSERT INTO blog_view_history (
        naver_blog_post_id,
        recorded_date,
        view_count
    ) VALUES (
        p_content_id,
        CURRENT_DATE,
        p_view_count
    );
END;
$$ LANGUAGE plpgsql;
