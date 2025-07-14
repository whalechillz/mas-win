# 🚨 SQL 에러 해결 가이드

## 에러 원인
`ERROR: 42P01: relation "marketing_campaigns" does not exist`
- `marketing_campaigns` 테이블이 없는 상태에서 백업을 시도해서 발생

## ✅ 해결 방법 (3가지 중 선택)

### 방법 1: **가장 간단한 시작** (추천 ⭐)
```sql
/database/simple-start.sql
```
- 5단계로 나누어서 안전하게 실행
- 7월 데이터만 먼저 테스트
- 에러 없이 바로 실행 가능

### 방법 2: **안전한 전체 재구성**
```sql
/database/safe-cleanup-reorganize.sql
```
- 테이블 존재 여부 체크 후 실행
- 조건부 백업 처리
- 전체 12개월 데이터 포함

### 방법 3: **단계별 수동 실행**

#### Step 1: marketing_campaigns 테이블 생성
```sql
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  channel TEXT NOT NULL,
  topic TEXT NOT NULL,
  content TEXT,
  target_count INTEGER DEFAULT 0,
  assignee TEXT,
  status TEXT DEFAULT 'planned',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Step 2: monthly_themes 수정
```sql
ALTER TABLE monthly_themes 
ADD COLUMN IF NOT EXISTS objective TEXT,
ADD COLUMN IF NOT EXISTS promotion_detail TEXT,
ADD COLUMN IF NOT EXISTS target_audience VARCHAR(200);
```

#### Step 3: 중복 뷰 삭제
```sql
DROP VIEW IF EXISTS annual_marketing_calendar CASCADE;
DROP VIEW IF EXISTS annual_theme_plan CASCADE;
DROP VIEW IF EXISTS monthly_marketing_plan CASCADE;
DROP VIEW IF EXISTS monthly_theme_calendar CASCADE;
```

#### Step 4: 7월 테마 입력
```sql
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
```

#### Step 5: 결과 확인
```sql
SELECT * FROM monthly_themes WHERE year = 2025 AND month = 7;
```

## 📌 추천 실행 순서

1. **먼저 `/database/simple-start.sql` 실행** (가장 안전)
2. 성공하면 나머지 월 데이터 추가
3. 필요시 전체 재구성 진행

## 🎯 예상 결과
- 7월: 캠페인 5개 생성
- campaign_count가 5로 표시됨
- 멀티채널 콘텐츠는 generate_monthly_content 함수 실행 후 생성

## 💡 팁
- 각 단계를 개별적으로 실행하면 어디서 문제가 발생하는지 확인 가능
- 성공 메시지가 나올 때까지 다음 단계로 진행하지 마세요
- 에러가 계속되면 테이블 목록을 먼저 확인:
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name LIKE '%campaign%' OR table_name LIKE '%theme%';
  ```

**가장 안전한 방법은 `/database/simple-start.sql`을 먼저 실행하는 것입니다!** 🚀