-- integrated_campaign_dashboard 뷰 생성
-- 이 뷰가 없어서 404 에러가 발생합니다

CREATE OR REPLACE VIEW integrated_campaign_dashboard AS
SELECT 
    year,
    month,
    COUNT(DISTINCT CASE WHEN platform = 'blog' THEN id END) as blog_count,
    COUNT(DISTINCT CASE WHEN platform = 'kakao' THEN id END) as kakao_count,
    COUNT(DISTINCT CASE WHEN platform = 'sms' THEN id END) as sms_count,
    COUNT(DISTINCT CASE WHEN platform = 'instagram' THEN id END) as instagram_count,
    COUNT(DISTINCT CASE WHEN platform = 'youtube' THEN id END) as youtube_count,
    COUNT(*) as total_contents,
    COUNT(DISTINCT CASE WHEN status = 'published' THEN id END) as published_count,
    COUNT(DISTINCT CASE WHEN status = 'idea' THEN id END) as idea_count,
    COUNT(DISTINCT CASE WHEN status = 'writing' THEN id END) as writing_count,
    COUNT(DISTINCT CASE WHEN status = 'ready' THEN id END) as ready_count
FROM (
    SELECT 
        id,
        platform,
        status,
        EXTRACT(YEAR FROM scheduled_date)::INTEGER as year,
        EXTRACT(MONTH FROM scheduled_date)::INTEGER as month
    FROM content_ideas
    WHERE status != 'deleted'
) as monthly_contents
GROUP BY year, month;

-- 권한 부여
GRANT SELECT ON integrated_campaign_dashboard TO anon;
GRANT SELECT ON integrated_campaign_dashboard TO authenticated;

-- 확인
SELECT * FROM integrated_campaign_dashboard 
WHERE year = 2025 AND month = 7;