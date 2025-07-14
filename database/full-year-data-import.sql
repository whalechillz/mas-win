-- 📅 엑셀 기반 전체 12개월 데이터 입력 (2025.7 ~ 2026.6)

-- 월별 테마 전체 입력
INSERT INTO monthly_themes (year, month, theme, objective, promotion_detail, target_audience) VALUES
-- 2025년
(2025, 7, '여름 성수기 쿨링 캠페인', 
 '뜨거운 여름, 완벽한 스윙을 위한 준비', 
 '상담/방문 고객 전체 쿨링 패키지(스포츠 타월, 팔토시) 증정 + 구매 고객 고급 위스키 증정',
 '고소득층 및 4060세대'),

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

-- 2026년
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
 '00만원 이상 구매 시 골프 oooo 증정 + 고급 골프 우산 증정',
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

-- 각 월별 캠페인 자동 생성 (카카오톡, 문자)
DO $$
DECLARE
    v_theme RECORD;
    v_date DATE;
BEGIN
    FOR v_theme IN 
        SELECT * FROM monthly_themes 
        WHERE (year = 2025 AND month >= 7) OR (year = 2026 AND month <= 6)
        ORDER BY year, month
    LOOP
        v_date := DATE(v_theme.year || '-' || LPAD(v_theme.month::TEXT, 2, '0') || '-01');
        
        -- 카카오톡 (1일, 15일)
        INSERT INTO marketing_campaigns (date, month, year, channel, topic, content, target_count, assignee, status)
        VALUES 
        (v_date, v_theme.month, v_theme.year, 'kakao', v_theme.theme, 
         v_theme.objective || ' - 카카오톡 1차', 1200, '제이', 'planned'),
        (v_date + 14, v_theme.month, v_theme.year, 'kakao', v_theme.theme, 
         SUBSTRING(v_theme.promotion_detail, 1, 50) || '... 카카오톡 2차', 1200, '제이', 'planned')
        ON CONFLICT DO NOTHING;
        
        -- 문자 (2일, 16일)
        INSERT INTO marketing_campaigns (date, month, year, channel, topic, content, target_count, assignee, status)
        VALUES 
        (v_date + 1, v_theme.month, v_theme.year, 'sms', v_theme.theme, 
         '고객님! ' || v_theme.month || '월 특별 혜택 안내', 1200, '제이', 'planned'),
        (v_date + 15, v_theme.month, v_theme.year, 'sms', v_theme.theme, 
         SUBSTRING(v_theme.promotion_detail, 1, 40) || '...', 1200, '제이', 'planned')
        ON CONFLICT DO NOTHING;
        
        -- 블로그 대표 (7일)
        INSERT INTO marketing_campaigns (date, month, year, channel, topic, content, target_count, assignee, status)
        VALUES 
        (v_date + 6, v_theme.month, v_theme.year, 'blog', v_theme.theme, 
         '블로그: ' || v_theme.objective, 0, '스테피', 'planned')
        ON CONFLICT DO NOTHING;
        
        -- 멀티채널 콘텐츠 생성
        PERFORM generate_monthly_content(v_theme.year, v_theme.month);
    END LOOP;
END $$;

-- 결과 확인
SELECT 
    year,
    month,
    theme,
    (SELECT COUNT(*) FROM marketing_campaigns mc WHERE mc.year = mt.year AND mc.month = mt.month) as campaigns,
    (SELECT COUNT(*) FROM content_ideas ci 
     WHERE EXTRACT(YEAR FROM ci.scheduled_date) = mt.year 
     AND EXTRACT(MONTH FROM ci.scheduled_date) = mt.month) as contents
FROM monthly_themes mt
WHERE (year = 2025 AND month >= 7) OR (year = 2026 AND month <= 6)
ORDER BY year, month;