-- 📅 2026년 상반기 월별 테마 추가

INSERT INTO monthly_themes (year, month, theme, objective, promotion_details, focus_keywords) VALUES
    -- 2026년 상반기
    (2026, 1, '신년 골프 스타트', '새해 골프 목표 설정 및 동기부여', '신년 특별 할인 + 목표 달성 프로그램', ARRAY['새해 목표', '골프 입문', '실력 향상', '신년 계획']),
    (2026, 2, '윈터 골프 마스터', '겨울 골프 극복 전략', '방한 용품 증정 + 실내 연습장 이용권', ARRAY['겨울 골프', '실내 연습', '방한 용품', '스윙 교정']),
    (2026, 3, '봄맞이 시즌 오픈', '새 시즌 준비 및 장비 점검', '봄 시즌 오픈 특가 + 무료 피팅 서비스', ARRAY['시즌 오픈', '장비 점검', '봄 골프', '신제품']),
    (2026, 4, '벚꽃 골프 여행', '봄 골프 여행 및 라운딩', '벚꽃 명소 골프장 패키지 + 숙박 할인', ARRAY['골프 여행', '벚꽃 라운딩', '봄 여행', '패키지']),
    (2026, 5, '가정의 달 골프', '가족과 함께하는 골프', '가족 동반 할인 + 주니어 무료 레슨', ARRAY['가족 골프', '주니어 골프', '가정의 달', '함께하는 골프']),
    (2026, 6, '상반기 결산 세일', '상반기 베스트 상품 특가', '상반기 인기 상품 최대 50% 할인', ARRAY['상반기 세일', '베스트 상품', '특가', '한정 수량'])
ON CONFLICT (year, month) DO UPDATE SET
    theme = EXCLUDED.theme,
    objective = EXCLUDED.objective,
    promotion_details = EXCLUDED.promotion_details,
    focus_keywords = EXCLUDED.focus_keywords;

-- 확인
SELECT year, month, theme, objective 
FROM monthly_themes 
WHERE year = 2026 
ORDER BY month;