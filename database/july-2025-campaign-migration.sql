-- 🎯 2025년 7월 실제 캠페인 데이터 마이그레이션

-- 1. 7월 캠페인 데이터 입력 (엑셀 기반)
INSERT INTO marketing_campaigns (date, month, year, channel, topic, content, target_count, assignee, status) VALUES
-- 7월 여름 성수기 캠페인
('2025-07-08', 7, 2025, 'kakao', '여름 성수기 쿨링 캠페인', '뜨거운 여름, 완벽한 스윙을 위한 준비! 고소득층 및 4060세대 맞춤', 1148, '제이', 'planned'),
('2025-07-22', 7, 2025, 'kakao', '여름 성수기 쿨링 캠페인', '무더운 여름, 시원한 혜택과 함께! 쿨링 패키지 증정', 1148, '제이', 'planned'),
('2025-07-09', 7, 2025, 'sms', '여름 휴가 시즌', '%고객명% 고객님을 위한 무더운 여름 시원한 혜택! 방수파우치 증정', 1193, '제이', 'planned'),
('2025-07-23', 7, 2025, 'sms', '여름 휴가 시즌', '여름 휴가철 골프 여행 필수품! XX만원 이상 구매 시 특별 혜택', 1193, '제이', 'planned')
ON CONFLICT DO NOTHING;

-- 2. 7월 콘텐츠 자동 생성 실행
SELECT generate_monthly_content(2025, 7);

-- 3. 생성된 콘텐츠 확인
SELECT 
    platform,
    COUNT(*) as content_count,
    STRING_AGG(DISTINCT assignee, ', ') as assignees
FROM content_ideas
WHERE EXTRACT(YEAR FROM scheduled_date) = 2025 
  AND EXTRACT(MONTH FROM scheduled_date) = 7
GROUP BY platform
ORDER BY content_count DESC;

-- 4. 캠페인과 콘텐츠 연결 확인
SELECT 
    mc.topic as campaign_topic,
    mc.channel as campaign_channel,
    COUNT(DISTINCT ci.id) as linked_contents
FROM marketing_campaigns mc
LEFT JOIN content_ideas ci ON ci.topic = mc.topic
    AND EXTRACT(YEAR FROM ci.scheduled_date) = mc.year
    AND EXTRACT(MONTH FROM ci.scheduled_date) = mc.month
WHERE mc.year = 2025 AND mc.month = 7
GROUP BY mc.topic, mc.channel;

-- 5. 7월 일별 콘텐츠 발행 현황
SELECT 
    DATE(scheduled_date) as publish_date,
    TO_CHAR(scheduled_date, 'Day') as day_name,
    COUNT(*) as content_count,
    STRING_AGG(
        platform || '(' || COALESCE(assignee, '미정') || ')', 
        ', ' 
        ORDER BY platform
    ) as contents
FROM content_ideas
WHERE EXTRACT(YEAR FROM scheduled_date) = 2025 
  AND EXTRACT(MONTH FROM scheduled_date) = 7
GROUP BY DATE(scheduled_date)
ORDER BY publish_date;

-- 6. 플랫폼별 주간 발행 패턴 확인
WITH weekly_pattern AS (
    SELECT 
        platform,
        EXTRACT(WEEK FROM scheduled_date) - EXTRACT(WEEK FROM DATE '2025-07-01') + 1 as week_num,
        COUNT(*) as content_count
    FROM content_ideas
    WHERE EXTRACT(YEAR FROM scheduled_date) = 2025 
      AND EXTRACT(MONTH FROM scheduled_date) = 7
    GROUP BY platform, EXTRACT(WEEK FROM scheduled_date)
)
SELECT 
    platform,
    SUM(CASE WHEN week_num = 1 THEN content_count ELSE 0 END) as week1,
    SUM(CASE WHEN week_num = 2 THEN content_count ELSE 0 END) as week2,
    SUM(CASE WHEN week_num = 3 THEN content_count ELSE 0 END) as week3,
    SUM(CASE WHEN week_num = 4 THEN content_count ELSE 0 END) as week4,
    SUM(CASE WHEN week_num = 5 THEN content_count ELSE 0 END) as week5,
    SUM(content_count) as total
FROM weekly_pattern
GROUP BY platform
ORDER BY total DESC;

-- 7. 담당자별 업무량 확인
SELECT 
    assignee,
    COUNT(*) as total_contents,
    STRING_AGG(DISTINCT platform, ', ' ORDER BY platform) as platforms,
    MIN(scheduled_date) as first_content,
    MAX(scheduled_date) as last_content
FROM content_ideas
WHERE EXTRACT(YEAR FROM scheduled_date) = 2025 
  AND EXTRACT(MONTH FROM scheduled_date) = 7
GROUP BY assignee
ORDER BY total_contents DESC;

-- 8. 대시보드 통계 갱신
REFRESH MATERIALIZED VIEW IF EXISTS integrated_campaign_dashboard;