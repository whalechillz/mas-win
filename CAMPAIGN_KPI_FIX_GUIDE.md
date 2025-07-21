# 🚨 캠페인 KPI 대시보드 문제 해결 가이드

## 현재 문제점
1. **Supabase 테이블 없음** - page_views, campaign_metrics 테이블이 생성되지 않음
2. **데이터가 0으로 표시** - 테이블이 없어서 데이터를 가져올 수 없음
3. **디버그 페이지 오류** - Failed to fetch 오류 발생

## 📌 즉시 해결 방법

### Step 1: Supabase 테이블 생성 (가장 중요!)

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard/project/yyytjudftvpmcnppaymw
   - 로그인

2. **SQL Editor 열기**
   - 왼쪽 메뉴에서 "SQL Editor" 클릭
   - "New query" 버튼 클릭

3. **아래 SQL 전체를 복사해서 붙여넣기**

```sql
-- 테이블 생성 및 초기 데이터 설정
-- 이 SQL을 Supabase SQL Editor에서 실행하세요!

-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS page_views (
  id BIGSERIAL PRIMARY KEY,
  campaign_id VARCHAR(50) NOT NULL,
  page_url TEXT,
  user_agent TEXT,
  ip_address VARCHAR(45),
  referer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_metrics (
  id BIGSERIAL PRIMARY KEY,
  campaign_id VARCHAR(50) UNIQUE NOT NULL,
  views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  phone_clicks INTEGER DEFAULT 0,
  form_submissions INTEGER DEFAULT 0,
  quiz_completions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_page_views_campaign ON page_views(campaign_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_campaign ON campaign_metrics(campaign_id);

-- 3. RLS 활성화
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_metrics ENABLE ROW LEVEL SECURITY;

-- 4. 모든 기존 정책 삭제
DROP POLICY IF EXISTS "Enable insert for all users" ON page_views;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON page_views;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON campaign_metrics;
DROP POLICY IF EXISTS "Enable read for all users" ON page_views;
DROP POLICY IF EXISTS "Enable read for all users" ON campaign_metrics;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON campaign_metrics;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON campaign_metrics;

-- 5. 새로운 RLS 정책 생성 (중요!)
CREATE POLICY "Enable insert for all users" ON page_views
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Enable read for all users" ON page_views
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Enable read for all users" ON campaign_metrics
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON campaign_metrics
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON campaign_metrics
  FOR UPDATE TO authenticated
  USING (true);

-- 6. 샘플 데이터 추가
INSERT INTO campaign_metrics (campaign_id, views, unique_visitors, phone_clicks, form_submissions, quiz_completions, conversion_rate)
VALUES 
  ('2025-07', 1234, 892, 45, 23, 67, 3.7),
  ('2025-06', 2456, 1823, 89, 45, 123, 4.2),
  ('2025-08', 150, 120, 5, 2, 10, 1.3)
ON CONFLICT (campaign_id) 
DO UPDATE SET
  views = EXCLUDED.views,
  unique_visitors = EXCLUDED.unique_visitors,
  phone_clicks = EXCLUDED.phone_clicks,
  form_submissions = EXCLUDED.form_submissions,
  quiz_completions = EXCLUDED.quiz_completions,
  conversion_rate = EXCLUDED.conversion_rate,
  updated_at = NOW();

-- 7. 확인
SELECT 'SUCCESS: Tables created!' as status;
SELECT * FROM campaign_metrics;
```

4. **RUN 버튼 클릭**
   - 성공 메시지가 나타나야 함
   - 하단에 campaign_metrics 데이터가 표시되어야 함

### Step 2: 페이지 새로고침

1. **관리자 페이지** (http://localhost:3000/admin)
   - 대시보드 탭 클릭
   - 캠페인별 KPI 대시보드에 실제 데이터가 표시되어야 함

2. **디버그 페이지** (http://localhost:3000/debug-tracking)
   - Supabase 연결 상태: ✅ 성공
   - 캠페인 메트릭스에 데이터 표시

### Step 3: 추가 테스트

디버그 페이지에서:
1. "테스트 조회수 추가" 버튼 클릭
2. API 성공 메시지 확인
3. 데이터 새로고침 버튼 클릭

## 🔧 문제가 계속되면

### 1. Supabase 설정 확인
- Project Settings > API
- URL과 anon key가 .env.local과 일치하는지 확인

### 2. 브라우저 콘솔 확인
```javascript
// 개발자 도구 콘솔에서 실행
fetch('/api/track-view', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    campaign_id: '2025-07',
    page: '/test'
  })
}).then(r => r.json()).then(console.log)
```

### 3. Supabase 대시보드에서 직접 확인
- Table Editor > campaign_metrics 테이블 확인
- 데이터가 있는지 확인

## 📞 도움이 필요하면
1. Supabase 대시보드의 Logs 섹션 확인
2. 브라우저 개발자 도구 > Network 탭에서 실패한 요청 확인
3. 에러 메시지 전체를 복사해서 공유

## ✅ 예상 결과
- 관리자 대시보드: 실제 캠페인 데이터 표시 (조회수, 전환율 등)
- 디버그 페이지: 모든 상태가 정상으로 표시
- API 호출: 성공 응답