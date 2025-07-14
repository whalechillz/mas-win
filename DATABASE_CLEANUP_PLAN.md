# 📊 데이터베이스 정리 계획

## 현재 상황 분석

### 🔴 즉시 삭제 가능 (데이터 없음)
```sql
-- 백업 테이블
DROP TABLE blog_contents_backup_20250114;
DROP TABLE blog_platforms_backup_20250114;

-- 비어있는 중복 테이블
DROP TABLE ai_content_suggestions;  -- ai_content_history로 대체
DROP TABLE annual_marketing_plans;  -- monthly_themes로 대체
DROP TABLE marketing_workflows;     -- 사용 안함
DROP TABLE notification_settings;   -- 아직 구현 안함
DROP TABLE blog_view_history;       -- content_analytics로 대체
DROP TABLE bookings;               -- bookings_with_quiz 뷰 사용
```

### 🟡 통합 필요 (데이터 있음 - 마이그레이션 필요)
1. **블로그 관련 3개 → 1개로**
   - `blog_contents` (3 rows)
   - `naver_blog_posts` (0 rows) 
   - `simple_blog_posts` (6 rows)
   → **`simple_blog_posts`로 통합** (가장 최신 구조)

2. **발행 관련 2개 → 1개로**
   - `naver_publishing` (3 rows)
   - `website_publishing` (0 rows)
   → **`content_distribution`으로 통합** (새로 생성)

### 🟢 유지해야 할 핵심 테이블
```
✅ campaigns - 캠페인 데이터
✅ contacts - 고객 정보
✅ simple_blog_posts - 블로그 관리 (통합)
✅ content_ideas - 콘텐츠 아이디어
✅ content_categories - 카테고리 마스터
✅ blog_platforms - 플랫폼 마스터
✅ team_members - 팀원 정보
✅ quiz_results - 퀴즈 결과
✅ marketing_funnel_stages - 퍼널 단계
✅ customer_segments - 고객 세그먼트
```

## 실행 순서

### Step 1: 데이터 백업 (안전)
```sql
-- 중요 데이터 백업
CREATE TABLE blog_contents_backup_temp AS SELECT * FROM blog_contents;
CREATE TABLE simple_blog_posts_backup_temp AS SELECT * FROM simple_blog_posts;
CREATE TABLE naver_publishing_backup_temp AS SELECT * FROM naver_publishing;
```

### Step 2: 데이터 마이그레이션
```sql
-- blog_contents → simple_blog_posts로 이전
INSERT INTO simple_blog_posts (
  topic, publish_date, status, assignee, account, 
  title_review, title_tip, title_comparison
)
SELECT 
  title as topic,
  scheduled_date as publish_date,
  CASE 
    WHEN status = 'published' THEN 'published'
    ELSE 'draft'
  END as status,
  assigned_to as assignee,
  'mas9golf' as account,  -- 기본값
  title as title_review,
  title as title_tip,
  title as title_comparison
FROM blog_contents
WHERE NOT EXISTS (
  SELECT 1 FROM simple_blog_posts sp 
  WHERE sp.topic = blog_contents.title
);
```

### Step 3: 안전하게 삭제
```sql
-- 백업 확인 후 삭제
DROP TABLE blog_contents_backup_20250114;
DROP TABLE blog_platforms_backup_20250114;
DROP TABLE ai_content_suggestions;
DROP TABLE annual_marketing_plans;
DROP TABLE marketing_workflows;
DROP TABLE notification_settings;
DROP TABLE blog_view_history;
DROP TABLE bookings;  -- bookings_with_quiz 뷰 사용
DROP TABLE naver_blog_posts;
DROP TABLE website_publishing;

-- 마이그레이션 확인 후 삭제
-- DROP TABLE blog_contents;
-- DROP TABLE naver_publishing;
```

### Step 4: 새로운 통합 테이블 생성
```sql
-- enhanced-campaign-schema.sql 실행
-- 이미 만들어둔 통합 스키마 사용
```

## 뷰(View) 사용 이유

### 왜 뷰를 만드나요?
1. **복잡한 JOIN 단순화**: 여러 테이블 조인을 미리 정의
2. **보안**: 특정 컬럼만 노출
3. **성능**: 자주 사용하는 쿼리 최적화

### 현재 뷰 평가
- `bookings_with_quiz` ✅ - 예약+퀴즈 정보 통합
- `campaign_summary` ✅ - 캠페인 요약 대시보드
- `content_publishing_status` ❌ - 중복 (삭제)
- `customer_quick_view` ✅ - 고객 정보 빠른 조회

## 최종 권장사항

### 🎯 목표: 30개 → 15개 테이블로 축소

**Before**: 30개 테이블 (중복 많음)
**After**: 15개 핵심 테이블 + 3개 유용한 뷰

### 💡 장점
- 관리 부담 50% 감소
- 쿼리 성능 향상
- 데이터 일관성 개선
- 개발 속도 향상

### ⚠️ 주의사항
- 데이터가 있는 테이블은 반드시 백업
- 마이그레이션 후 검증
- 단계별로 진행 (한번에 다 삭제 X)