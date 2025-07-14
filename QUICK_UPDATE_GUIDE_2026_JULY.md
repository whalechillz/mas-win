# 2026년 7월 데이터 업데이트 가이드

## 빠른 업데이트 방법

### 방법 1: 자동 스크립트 실행
```bash
# 스크립트 실행 권한 부여
chmod +x update-july-2026.sh

# 스크립트 실행
./update-july-2026.sh
```

### 방법 2: SQL 직접 실행
```bash
# 준비된 SQL 파일 실행
psql $DATABASE_URL -f database/update-2026-july.sql
```

### 방법 3: 수동으로 데이터 입력
```sql
-- PostgreSQL 또는 Supabase SQL Editor에서 실행
INSERT INTO monthly_themes (
    year, month, theme, 
    focus_keywords, 
    promotion_details, 
    target_audience, 
    objective, 
    description
) VALUES (
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
```

## 추가 가능한 2026년 하반기 데이터

### 8월: 골프 피트니스 월
- 키워드: 골프 체력, 코어 운동, 유연성, 부상 예방
- 목표: 골프 실력 향상을 위한 체력 관리

### 9월: 스마트 골프 테크
- 키워드: 골프 앱, GPS 거리측정기, 스윙 분석기, AI 코칭
- 목표: 최신 기술 활용한 실력 향상

### 10월: 골프 멘탈 강화
- 키워드: 집중력, 압박 극복, 루틴, 심리 훈련
- 목표: 멘탈 트레이닝으로 스코어 개선

### 11월: 윈터 골프 준비
- 키워드: 겨울 골프, 보온 장비, 스윙 조정, 실내 연습
- 목표: 겨울철 골프 준비

### 12월: 연말 골프 어워드
- 키워드: 베스트 장비, 올해의 골퍼, 골프장 추천, 연말 이벤트
- 목표: 한 해 마무리 특별 이벤트

## 데이터 확인
```sql
-- 2026년 전체 데이터 확인
SELECT year, month, theme, objective 
FROM monthly_themes 
WHERE year = 2026 
ORDER BY month;
```

## 주의사항
- 기존 데이터가 있는 경우 `ON CONFLICT` 구문으로 자동 업데이트됩니다.
- `promotion_details`의 XXX 부분은 실제 금액으로 변경하세요.
- 관리자 페이지에서도 직접 수정 가능합니다.
