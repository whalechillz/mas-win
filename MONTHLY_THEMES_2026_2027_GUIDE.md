# 2026년 7월 ~ 2027년 6월 월별 테마 데이터 가이드

## 📅 데이터 구성

### 2026년 하반기 (7-12월)
| 월 | 테마 | 슬로건 | 주요 타겟 |
|---|------|--------|----------|
| 7월 | 쿨 썸머 골프 | 뜨거운 여름, 시원한 라운딩 | 여름 골퍼 |
| 8월 | 바캉스 골프 여행 | 골프와 함께하는 완벽한 여름휴가 | 휴가철 골퍼 |
| 9월 | 가을 골프 시즌 | 선선한 가을, 베스트 스코어 도전 | 시즌 골퍼 |
| 10월 | 챔피언십 시즌 | 당신도 챔피언이 될 수 있다 | 골프 대회 참가자 |
| 11월 | 이어엔드 골프 | 한 해를 마무리하는 특별한 라운딩 | 연말 구매자 |
| 12월 | 홀리데이 골프 기프트 | 특별한 사람에게 특별한 선물을 | 선물 구매자 |

### 2027년 상반기 (1-6월)
| 월 | 테마 | 슬로건 | 주요 타겟 |
|---|------|--------|----------|
| 1월 | 뉴이어 골프 스타트 | 2027년, 새로운 골프 인생의 시작 | 신규/복귀 골퍼 |
| 2월 | 얼리버드 시즌 준비 | 남들보다 빠른 시즌 준비 | 계획적 구매자 |
| 3월 | 스프링 오프닝 | 드디어 시작된 2027 골프 시즌 | 전체 골퍼 |
| 4월 | 블로썸 골프 페스타 | 벚꽃과 함께하는 낭만 라운딩 | 커플/가족 골퍼 |
| 5월 | 패밀리 골프 먼스 | 온 가족이 함께하는 행복한 골프 | 가족 골퍼 |
| 6월 | 미드이어 그랜드 세일 | 2027 상반기 결산 초특가 | 가격 민감 고객 |

## 🚀 빠른 실행 방법

### 방법 1: 자동 스크립트 실행
```bash
# 실행 권한 부여
chmod +x insert-monthly-themes-2026-2027.sh

# 스크립트 실행
./insert-monthly-themes-2026-2027.sh
```

### 방법 2: SQL 직접 실행
```bash
# SQL 파일 직접 실행
psql $DATABASE_URL -f database/monthly-themes-2026-07-to-2027-06.sql
```

### 방법 3: Supabase SQL Editor 사용
1. Supabase 대시보드 접속
2. SQL Editor 열기
3. `database/monthly-themes-2026-07-to-2027-06.sql` 내용 복사
4. 실행

## ✅ 데이터 확인 쿼리
```sql
-- 입력된 데이터 확인
SELECT year, month, theme, description, objective, target_audience
FROM monthly_themes 
WHERE (year = 2026 AND month >= 7) 
   OR (year = 2027 AND month <= 6)
ORDER BY year, month;

-- 월별 키워드 확인
SELECT year, month, theme, focus_keywords
FROM monthly_themes 
WHERE (year = 2026 AND month >= 7) 
   OR (year = 2027 AND month <= 6)
ORDER BY year, month;
```

## 📝 주요 특징
1. **계절별 테마**: 각 계절에 맞는 골프 테마 구성
2. **명확한 타겟**: 월별로 구체적인 타겟 고객층 설정
3. **차별화된 프로모션**: 각 월별 특색있는 프로모션 전략
4. **연속성**: 연간 스토리가 이어지는 테마 구성

## 🔧 수정이 필요한 경우
- 관리자 페이지에서 직접 수정 가능
- 또는 SQL UPDATE 문 사용:
```sql
UPDATE monthly_themes 
SET promotion_details = '새로운 프로모션 내용'
WHERE year = 2026 AND month = 7;
```
