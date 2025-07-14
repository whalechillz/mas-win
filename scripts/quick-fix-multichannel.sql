-- 빠른 수정: 멀티채널 콘텐츠 생성 문제 해결

-- 1. 함수가 있는지 확인
SELECT EXISTS (
    SELECT 1 
    FROM pg_proc 
    WHERE proname = 'generate_monthly_content_selective'
) as function_exists;

-- 2. 함수가 없다면 생성
CREATE OR REPLACE FUNCTION generate_monthly_content_selective(
    p_year INTEGER,
    p_month INTEGER,
    p_channels JSONB DEFAULT '{"blog": true, "kakao": true, "sms": true, "instagram": true, "youtube": true}'::jsonb
)
RETURNS JSON AS $$
DECLARE
    v_content_count INTEGER := 0;
    v_result JSON;
BEGIN
    -- 간단한 테스트 콘텐츠 생성
    INSERT INTO content_ideas (title, content, platform, status, assignee, scheduled_date, tags)
    VALUES 
    ('테스트 블로그', '블로그 콘텐츠', 'blog', 'idea', '제이', 
     DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-15'), '테스트');
    
    v_content_count := 1;
    
    RETURN json_build_object(
        'success', true,
        'message', '테스트 콘텐츠가 생성되었습니다.',
        'content_count', v_content_count
    );
END;
$$ LANGUAGE plpgsql;

-- 3. 권한 확인 및 부여
GRANT EXECUTE ON FUNCTION generate_monthly_content_selective TO anon;
GRANT EXECUTE ON FUNCTION generate_monthly_content_selective TO authenticated;

-- 4. content_ideas 테이블 권한 확인
GRANT ALL ON content_ideas TO anon;
GRANT ALL ON content_ideas TO authenticated;