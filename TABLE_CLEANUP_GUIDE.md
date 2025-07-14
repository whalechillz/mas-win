# 🧹 테이블 중복 정리 및 재구성 가이드

## 📋 현재 문제점
1. **5개의 유사한 테이블이 중복됨**
   - annual_marketing_calendar (뷰)
   - annual_theme_plan (뷰)
   - monthly_marketing_plan (뷰)
   - monthly_theme_calendar (뷰)
   - monthly_themes (실제 테이블)

2. **campaign_count가 0으로 표시**
   - 실제 캠페인 데이터가 없음
   - 테마만 있고 실행 계획이 없음

## ✅ 해결 방안

### 핵심 테이블 구조
```
monthly_themes (마스터 테이블)
    ↓
marketing_campaigns (캠페인 실행)
    ↓
content_ideas (멀티채널 콘텐츠)
```

### 실행 순서

#### 1️⃣ **중복 정리 SQL 실행**
```sql
/database/cleanup-and-reorganize.sql
```

이 SQL은:
- 백업 생성 (안전)
- 중복 뷰 삭제
- 엑셀 데이터 정확히 입력
- 캠페인 자동 생성

#### 2️⃣ **결과 확인**
```sql
-- 월별 테마 확인
SELECT year, month, theme, objective, target_audience 
FROM monthly_themes 
ORDER BY year, month;

-- 캠페인 현황 확인
SELECT * FROM monthly_campaign_overview 
WHERE year = 2025;
```

## 📊 정리된 구조

### 실제 테이블 (3개만 유지)
1. **monthly_themes**: 월별 마케팅 테마/목표/프로모션
2. **marketing_campaigns**: 실제 캠페인 (카카오톡, 문자, 블로그)
3. **content_ideas**: 멀티채널 콘텐츠

### 뷰 (2개만 유지)
1. **monthly_campaign_overview**: 월별 통합 현황
2. **annual_plan_view**: 연간 계획 요약

## 🎯 엑셀 데이터 반영 내용

### 2025년 7월 ~ 2026년 6월 (12개월)
| 월 | 테마 | 타겟 | 프로모션 |
|----|------|------|----------|
| 7월 | 여름 성수기 쿨링 캠페인 | 고소득층 및 4060세대 | 쿨링 패키지 + 위스키 |
| 8월 | 여름 휴가 시즌 | 휴가철 골프 여행객 | 여행 상품권 + 방수파우치 |
| 9월 | 가을 시즌 준비 | 가을 골프 시즌 고객 | 의류 상품권 + 볼캡 |
| 10월 | 가을 골프 성수기 | 고소득층 | 할인 + 골프 장갑 |
| 11월 | 블랙 프라이데이 세일 | 전체 고객 | 연중 최대 할인 |
| 12월 | 연말 고객 감사 | 충성 고객 | 마쓰구 굿즈 |
| 1월 | 새해 다짐과 골프 시작 | 신규 고객 | 골프공/볼마커/럭키드로우 |
| 2월 | 설날 선물 캠페인 | 설 선물 구매 고객 | 선물 패키지 할인 |
| 3월 | 봄 맞이 준비 | 시즌 준비 고객 | 할인 + 골프 장갑 |
| 4월 | 골프 시즌 본격 개막 | 신규 및 기존 고객 | 의류 상품권 + 볼캡 |
| 5월 | 가정의 달 선물 캠페인 | 가족 단위 고객 | 골프 우산 |
| 6월 | 초여름 준비 | 여름 준비 고객 | 스포츠 선글라스 |

## 🚀 캠페인 자동 생성 규칙

### 월별 기본 구성
- **카카오톡**: 월 2회 (1일, 15일)
- **문자**: 월 2회 (2일, 16일)
- **블로그**: 대표 1건 (실제로는 주 3회 x 3계정)
- **멀티채널**: 약 60개 콘텐츠 자동 생성

### 담당자 배정
- 카카오톡/문자: 제이
- 블로그: 스테피, 허상원, 나과장
- 인스타/유튜브: 스테피

## 📝 사용법

### 특정 월 캠페인 생성
```sql
-- 8월 캠페인 생성
SELECT create_monthly_campaigns(2025, 8);
SELECT generate_monthly_content(2025, 8);
```

### 전체 년도 캠페인 일괄 생성
```sql
-- 2025년 7-12월 일괄 생성
DO $$
BEGIN
  FOR i IN 7..12 LOOP
    PERFORM create_monthly_campaigns(2025, i);
    PERFORM generate_monthly_content(2025, i);
  END LOOP;
END $$;
```

## ✨ 개선 효과
- **중복 제거**: 5개 → 3개 테이블
- **데이터 일관성**: 엑셀과 동일한 구조
- **자동화**: 캠페인/콘텐츠 자동 생성
- **가시성**: campaign_count 정상 표시

이제 깔끔하게 정리된 구조로 운영할 수 있습니다! 🎉