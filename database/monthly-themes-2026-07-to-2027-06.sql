-- 2026년 7월 ~ 2027년 6월 월별 테마 데이터
-- 기존 데이터 삭제 후 정확한 내용으로 재입력

-- 먼저 해당 기간 데이터 삭제 (필요시)
DELETE FROM monthly_themes 
WHERE (year = 2026 AND month >= 7) 
   OR (year = 2027 AND month <= 6);

-- 2026년 하반기 (7월~12월)
INSERT INTO monthly_themes (year, month, theme, description, objective, promotion_details, target_audience, focus_keywords) VALUES

-- 7월: 여름 시즌
(2026, 7, '쿨 썸머 골프', '뜨거운 여름, 시원한 라운딩', '여름철 골프 용품 판매 증대', '여름 골프웨어 30% 할인 + 쿨토시 증정', '여름 골퍼', ARRAY['여름 골프', '쿨링 제품', '자외선 차단', 'UV 보호']),

-- 8월: 휴가철
(2026, 8, '바캉스 골프 여행', '골프와 함께하는 완벽한 여름휴가', '골프 여행 패키지 판매 활성화', '제주/해외 골프 패키지 특가 + 골프백 커버 증정', '휴가철 골퍼', ARRAY['골프 여행', '리조트 골프', '패키지 투어', '여행 용품']),

-- 9월: 가을 시즌 시작
(2026, 9, '가을 골프 시즌', '선선한 가을, 베스트 스코어 도전', '가을 시즌 용품 교체 수요 대응', '가을 신상품 20% 할인 + 무료 피팅 서비스', '시즌 골퍼', ARRAY['가을 골프', '시즌 준비', '신상품', '클럽 피팅']),

-- 10월: 골프 대회 시즌
(2026, 10, '챔피언십 시즌', '당신도 챔피언이 될 수 있다', '대회 참가자 및 동호회 타겟 마케팅', '대회 참가자 특별 할인 + 트로피 각인 서비스', '골프 대회 참가자', ARRAY['골프 대회', '동호회', '트로피', '시상품']),

-- 11월: 연말 준비
(2026, 11, '이어엔드 골프', '한 해를 마무리하는 특별한 라운딩', '연말 선물 및 보상 구매 촉진', '연말 특가 세일 + VIP 고객 사은품', '연말 구매자', ARRAY['연말 세일', '선물 세트', 'VIP 혜택', '리워드']),

-- 12월: 크리스마스 & 연말
(2026, 12, '홀리데이 골프 기프트', '특별한 사람에게 특별한 선물을', '선물용 골프 용품 판매 극대화', '크리스마스 기프트 세트 + 럭셔리 포장 서비스', '선물 구매자', ARRAY['크리스마스', '선물 세트', '기프트 박스', '프리미엄']);

-- 2027년 상반기 (1월~6월)  
INSERT INTO monthly_themes (year, month, theme, description, objective, promotion_details, target_audience, focus_keywords) VALUES

-- 1월: 새해 시작
(2027, 1, '뉴이어 골프 스타트', '2027년, 새로운 골프 인생의 시작', '신년 목표 설정 고객 유치', '신년 회원권 특가 + 목표 달성 프로그램', '신규/복귀 골퍼', ARRAY['새해 목표', '입문 패키지', '레슨 프로그램', '신년 계획']),

-- 2월: 봄 준비
(2027, 2, '얼리버드 시즌 준비', '남들보다 빠른 시즌 준비', '조기 구매 고객 확보', '봄 시즌 사전예약 20% 할인 + 사은품', '계획적 구매자', ARRAY['시즌 준비', '사전 예약', '얼리버드', '봄 대비']),

-- 3월: 시즌 오픈
(2027, 3, '스프링 오프닝', '드디어 시작된 2027 골프 시즌', '시즌 오픈 대규모 프로모션', '시즌 오픈 기념 최대 40% 할인', '전체 골퍼', ARRAY['시즌 오픈', '봄 골프', '대박 세일', '신제품 출시']),

-- 4월: 벚꽃 시즌
(2027, 4, '블로썸 골프 페스타', '벚꽃과 함께하는 낭만 라운딩', '봄 성수기 매출 극대화', '벚꽃 라운딩 이벤트 + SNS 인증샷 경품', '커플/가족 골퍼', ARRAY['벚꽃 골프', '봄 나들이', 'SNS 이벤트', '포토존']),

-- 5월: 가정의 달
(2027, 5, '패밀리 골프 먼스', '온 가족이 함께하는 행복한 골프', '가족 단위 고객 유치', '가족 동반 특별 할인 + 주니어 무료 레슨', '가족 골퍼', ARRAY['가족 골프', '어린이날', '부모님 선물', '주니어 골프']),

-- 6월: 상반기 마무리
(2027, 6, '미드이어 그랜드 세일', '2027 상반기 결산 초특가', '재고 정리 및 신규 고객 유치', '상반기 결산 최대 50% 세일 + 1+1 이벤트', '가격 민감 고객', ARRAY['결산 세일', '반값 특가', '재고 정리', '한정 수량']);

-- 데이터 확인
SELECT year, month, theme, description, objective 
FROM monthly_themes 
WHERE (year = 2026 AND month >= 7) 
   OR (year = 2027 AND month <= 6)
ORDER BY year, month;
