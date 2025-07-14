-- 🎯 즉시 실행 가능한 간단 버전

-- 1. 중복 뷰만 삭제 (데이터는 보존)
DROP VIEW IF EXISTS annual_marketing_calendar CASCADE;
DROP VIEW IF EXISTS annual_theme_plan CASCADE;
DROP VIEW IF EXISTS monthly_marketing_plan CASCADE;
DROP VIEW IF EXISTS monthly_theme_calendar CASCADE;

-- 2. monthly_themes 테이블 구조 확인 및 수정
ALTER TABLE monthly_themes 
ADD COLUMN IF NOT EXISTS objective TEXT,
ADD COLUMN IF NOT EXISTS promotion_detail TEXT,
ADD COLUMN IF NOT EXISTS target_audience VARCHAR(200);

-- 3. 엑셀 기반 2025년 7월 데이터만 먼저 입력
INSERT INTO monthly_themes (year, month, theme, objective, promotion_detail, target_audience) VALUES
(2025, 7, '여름 성수기 쿨링 캠페인', 
 '뜨거운 여름, 완벽한 스윙을 위한 준비', 
 '상담/방문 고객 전체 쿨링 패키지(스포츠 타월, 팔토시) 증정 + 구매 고객 고급 위스키 증정',
 '고소득층 및 4060세대')
ON CONFLICT (year, month) DO UPDATE SET
  theme = EXCLUDED.theme,
  objective = EXCLUDED.objective,
  promotion_detail = EXCLUDED.promotion_detail,
  target_audience = EXCLUDED.target_audience;

-- 4. 7월 캠페인 생성
INSERT INTO marketing_campaigns (date, month, year, channel, topic, content, target_count, assignee, status) VALUES
-- 카카오톡
('2025-07-01', 7, 2025, 'kakao', '여름 성수기 쿨링 캠페인', '뜨거운 여름, 완벽한 스윙을 위한 준비! 쿨링 패키지 증정', 1200, '제이', 'planned'),
('2025-07-15', 7, 2025, 'kakao', '여름 성수기 쿨링 캠페인', '무더운 여름, 시원한 혜택! 고급 위스키 증정', 1200, '제이', 'planned'),
-- 문자
('2025-07-02', 7, 2025, 'sms', '여름 성수기 쿨링 캠페인', '고객님을 위한 7월 특별 혜택! 쿨링 패키지 증정', 1200, '제이', 'planned'),
('2025-07-16', 7, 2025, 'sms', '여름 성수기 쿨링 캠페인', '여름 골프 필수품! 구매시 고급 위스키 증정', 1200, '제이', 'planned'),
-- 블로그 대표
('2025-07-07', 7, 2025, 'blog', '여름 성수기 쿨링 캠페인', '블로그: 여름 골프 완벽 가이드', 0, '스테피', 'planned')
ON CONFLICT DO NOTHING;

-- 5. 멀티채널 콘텐츠 생성
SELECT generate_monthly_content(2025, 7);

-- 6. 간단한 현황 뷰 생성
CREATE OR REPLACE VIEW campaign_status AS
SELECT 
    mt.year,
    mt.month,
    mt.theme,
    COUNT(DISTINCT mc.id) as campaigns,
    COUNT(DISTINCT ci.id) as contents
FROM monthly_themes mt
LEFT JOIN marketing_campaigns mc ON mc.year = mt.year AND mc.month = mt.month
LEFT JOIN content_ideas ci ON DATE_PART('year', ci.scheduled_date) = mt.year 
    AND DATE_PART('month', ci.scheduled_date) = mt.month
GROUP BY mt.year, mt.month, mt.theme
ORDER BY mt.year, mt.month;

-- 7. 결과 확인
SELECT * FROM campaign_status WHERE year = 2025 AND month = 7;