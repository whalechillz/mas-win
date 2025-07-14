-- 🚀 다음 단계: 나머지 월 데이터 추가 및 멀티채널 콘텐츠 생성

-- =====================================
-- STEP 1: 나머지 11개월 데이터 추가 (2025.8 ~ 2026.6)
-- =====================================

-- 8월 ~ 12월 (2025년)
INSERT INTO monthly_themes (year, month, theme, objective, promotion_detail, target_audience) VALUES
(2025, 8, '여름 휴가 시즌', 
 '휴가철, 골프 휴양지 필수품', 
 '00만원 이상 구매 시 골프 여행 상품권 00만원 증정 + 방수파우치 증정',
 '휴가철 골프 여행객'),

(2025, 9, '가을 시즌 준비', 
 '가을 라운드, 스타일리시하게 / 골프 성수기 전 점검 OR 교체', 
 '00만원 이상 구매 시 골프 의류 상품권 00만원 증정 + 마쓰구 로고 볼캡 증정',
 '가을 골프 시즌 고객'),

(2025, 10, '가을 골프 성수기', 
 '가을 골프, 마쓰구로 완성', 
 '적정 할인 00% 제공 + 골프 장갑 증정',
 '고소득층'),

(2025, 11, '블랙 프라이데이 세일', 
 '블랙 프라이데이, 마쓰골프 특별 세일', 
 '연중 최대 할인 00% 제공',
 '전체 고객'),

(2025, 12, '연말 고객 감사', 
 '연말, 마쓰구와 함께한 골프의 추억', 
 '00만원 이상 구매 시 마쓰구 굿즈(악세서리) 증정',
 '충성 고객'),

-- 1월 ~ 6월 (2026년)
(2026, 1, '새해 다짐과 골프 시작', 
 '2025년, 새해 첫 스윙을 마쓰구와', 
 '00만원 이상 구매 시 골프공, 볼마커, 비거리 측정기 증정 + 신년 럭키 드로우 추첨 이벤트(1등: 골프백, 2등: ooo)',
 '신규 고객'),

(2026, 2, '설날 선물 캠페인', 
 '설날, 골프 선물로 마음을 전하세요', 
 '설 선물 패키지 00% 할인 + 명절 전용 선물 포장',
 '설 선물 구매 고객'),

(2026, 3, '봄 맞이 준비', 
 '봄 골프 시즌, 마쓰구로 준비 완료', 
 '적정 할인 00% 제공 + 골프 장갑 증정',
 '시즌 준비 고객'),

(2026, 4, '골프 시즌 본격 개막', 
 '본격 골프 시즌, 마쓰구와 함께', 
 '00만원 이상 구매 시 골프 의류 상품권 00만원 증정 + 마쓰구 로고 볼캡 증정',
 '신규 및 기존 고객'),

(2026, 5, '가정의 달 선물 캠페인', 
 '가족과 함께하는 골프 선물', 
 '00만원 이상 구매 시 골프 XXXX 증정 + 고급 골프 우산 증정',
 '가족 단위 고객'),

(2026, 6, '초여름 준비', 
 '여름 골프를 위한 필수 준비', 
 '00만원 이상 구매 시 고급 스포츠 선글라스 증정',
 '여름 준비 고객')
ON CONFLICT (year, month) DO UPDATE SET
  theme = EXCLUDED.theme,
  objective = EXCLUDED.objective,
  promotion_detail = EXCLUDED.promotion_detail,
  target_audience = EXCLUDED.target_audience;

-- =====================================
-- STEP 2: 각 월별 캠페인 자동 생성
-- =====================================

DO $$
DECLARE
    v_theme RECORD;
    v_date DATE;
BEGIN
    -- 나머지 월들에 대해 캠페인 생성
    FOR v_theme IN 
        SELECT * FROM monthly_themes 
        WHERE ((year = 2025 AND month >= 8) OR (year = 2026 AND month <= 6))
        ORDER BY year, month
    LOOP
        v_date := DATE(v_theme.year || '-' || LPAD(v_theme.month::TEXT, 2, '0') || '-01');
        
        -- 카카오톡 캠페인 (1일, 15일)
        INSERT INTO marketing_campaigns (date, month, year, channel, topic, content, target_count, assignee, status)
        VALUES 
        (v_date, v_theme.month, v_theme.year, 'kakao', v_theme.theme, 
         v_theme.objective || ' - 카카오톡 캠페인', 1200, '제이', 'planned'),
        (v_date + 14, v_theme.month, v_theme.year, 'kakao', v_theme.theme, 
         '월중 특별 혜택! ' || LEFT(v_theme.promotion_detail, 30) || '...', 1200, '제이', 'planned')
        ON CONFLICT DO NOTHING;
        
        -- 문자 캠페인 (2일, 16일)
        INSERT INTO marketing_campaigns (date, month, year, channel, topic, content, target_count, assignee, status)
        VALUES 
        (v_date + 1, v_theme.month, v_theme.year, 'sms', v_theme.theme, 
         '고객님! ' || v_theme.month || '월 특별 혜택 안내', 1200, '제이', 'planned'),
        (v_date + 15, v_theme.month, v_theme.year, 'sms', v_theme.theme, 
         LEFT(v_theme.promotion_detail, 40) || '...', 1200, '제이', 'planned')
        ON CONFLICT DO NOTHING;
        
        -- 블로그 대표 (7일)
        INSERT INTO marketing_campaigns (date, month, year, channel, topic, content, target_count, assignee, status)
        VALUES 
        (v_date + 6, v_theme.month, v_theme.year, 'blog', v_theme.theme, 
         '블로그: ' || v_theme.objective, 0, '스테피', 'planned')
        ON CONFLICT DO NOTHING;
        
    END LOOP;
END $$;

-- =====================================
-- STEP 3: 7월 멀티채널 콘텐츠 생성 (함수가 있다면)
-- =====================================

-- generate_monthly_content 함수가 있는지 확인
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'generate_monthly_content'
    ) THEN
        -- 7월 콘텐츠 생성
        PERFORM generate_monthly_content(2025, 7);
        RAISE NOTICE '7월 멀티채널 콘텐츠가 생성되었습니다.';
    ELSE
        RAISE NOTICE 'generate_monthly_content 함수가 없습니다. 멀티채널 콘텐츠는 수동으로 생성해야 합니다.';
    END IF;
END $$;

-- =====================================
-- STEP 4: 전체 결과 확인
-- =====================================

-- 월별 캠페인 현황
SELECT 
    mt.year,
    mt.month,
    mt.theme,
    COUNT(mc.id) as campaign_count,
    COUNT(DISTINCT CASE WHEN mc.channel = 'kakao' THEN mc.id END) as kakao,
    COUNT(DISTINCT CASE WHEN mc.channel = 'sms' THEN mc.id END) as sms,
    COUNT(DISTINCT CASE WHEN mc.channel = 'blog' THEN mc.id END) as blog
FROM monthly_themes mt
LEFT JOIN marketing_campaigns mc ON mc.year = mt.year AND mc.month = mt.month
WHERE (mt.year = 2025 AND mt.month >= 7) OR (mt.year = 2026 AND mt.month <= 6)
GROUP BY mt.year, mt.month, mt.theme
ORDER BY mt.year, mt.month;

-- 총 캠페인 수 확인
SELECT 
    '총 월별 테마' as type, COUNT(*) as count FROM monthly_themes
    WHERE (year = 2025 AND month >= 7) OR (year = 2026 AND month <= 6)
UNION ALL
SELECT 
    '총 캠페인 수', COUNT(*) FROM marketing_campaigns
    WHERE (year = 2025 AND month >= 7) OR (year = 2026 AND month <= 6)
UNION ALL
SELECT 
    '카카오톡 캠페인', COUNT(*) FROM marketing_campaigns
    WHERE channel = 'kakao' AND ((year = 2025 AND month >= 7) OR (year = 2026 AND month <= 6))
UNION ALL
SELECT 
    '문자 캠페인', COUNT(*) FROM marketing_campaigns
    WHERE channel = 'sms' AND ((year = 2025 AND month >= 7) OR (year = 2026 AND month <= 6))
UNION ALL
SELECT 
    '블로그 캠페인', COUNT(*) FROM marketing_campaigns
    WHERE channel = 'blog' AND ((year = 2025 AND month >= 7) OR (year = 2026 AND month <= 6));