-- 2026년 7월 월별 테마 업데이트

-- 기존 데이터가 있는지 확인
SELECT * FROM monthly_themes WHERE year = 2026 AND month = 7;

-- 2026년 7월 데이터 추가 또는 업데이트
INSERT INTO monthly_themes (year, month, theme, focus_keywords, promotion_details, target_audience, objective, description) 
VALUES (
    2026, 
    7, 
    '프리미엄 골프 여행', 
    ARRAY['골프 투어', '해외 골프', '골프 리조트', 'VIP 골프'],
    'XXX만원 이상 구매 시 골프 여행 쿠폰 XXX만원 증정 + 해수욕장지 호텔',
    '휴가철 골프 여행객',
    '여름 휴가철 골프 여행 수요 증대',
    '럭셔리 골프 여행 패키지와 프리미엄 골프장 소개'
)
ON CONFLICT (year, month) DO UPDATE SET
    theme = EXCLUDED.theme,
    focus_keywords = EXCLUDED.focus_keywords,
    promotion_details = EXCLUDED.promotion_details,
    target_audience = EXCLUDED.target_audience,
    objective = EXCLUDED.objective,
    description = EXCLUDED.description,
    updated_at = NOW();

-- 업데이트 확인
SELECT * FROM monthly_themes WHERE year = 2026 AND month = 7;
