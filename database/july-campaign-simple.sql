-- 📅 2025년 7월 캠페인 데이터 추가 (STEP 7 이후 실행)

-- 1. 7월 캠페인 추가
INSERT INTO marketing_campaigns (date, month, year, channel, topic, content, target_count, assignee, status) VALUES
('2025-07-08', 7, 2025, 'kakao', '여름 성수기 쿨링 캠페인', '뜨거운 여름, 완벽한 스윙을 위한 준비!', 1148, '제이', 'planned'),
('2025-07-22', 7, 2025, 'kakao', '여름 성수기 쿨링 캠페인', '무더운 여름, 시원한 혜택과 함께!', 1148, '제이', 'planned'),
('2025-07-09', 7, 2025, 'sms', '여름 휴가 시즌', '고객님을 위한 무더운 여름 시원한 혜택!', 1193, '제이', 'planned'),
('2025-07-23', 7, 2025, 'sms', '여름 휴가 시즌', '여름 휴가철 골프 여행 필수품!', 1193, '제이', 'planned')
ON CONFLICT DO NOTHING;

-- 2. 7월 콘텐츠 자동 생성
SELECT generate_monthly_content(2025, 7);

-- 3. 생성 결과 확인
SELECT 
    '=== 7월 콘텐츠 생성 결과 ===' as title
UNION ALL
SELECT 
    platform || ': ' || COUNT(*)::TEXT || '개'
FROM content_ideas
WHERE EXTRACT(YEAR FROM scheduled_date) = 2025 
  AND EXTRACT(MONTH FROM scheduled_date) = 7
GROUP BY platform
ORDER BY 1;

-- 4. 통합 대시보드 확인
SELECT * FROM integrated_campaign_dashboard
WHERE year = 2025 AND month = 7;