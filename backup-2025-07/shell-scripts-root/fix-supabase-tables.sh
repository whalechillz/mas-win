#!/bin/bash

echo "🔍 Supabase 문제 해결 가이드"
echo "============================"
echo ""
echo "⚠️  현재 오류 원인:"
echo "- page_views 테이블이 없음"
echo "- campaign_metrics 테이블이 없음"
echo "- RLS 정책이 설정되지 않음"
echo ""
echo "📌 해결 방법:"
echo ""
echo "1. Supabase 대시보드 접속"
echo "   https://supabase.com/dashboard/project/yyytjudftvpmcnppaymw"
echo ""
echo "2. SQL Editor 클릭"
echo ""
echo "3. 새 쿼리 만들기 버튼 클릭"
echo ""
echo "4. 아래 SQL을 복사해서 붙여넣고 RUN 버튼 클릭:"
echo ""
echo "========== SQL 시작 =========="
cat << 'EOF'
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

-- 4. 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Enable insert for all users" ON page_views;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON page_views;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON campaign_metrics;
DROP POLICY IF EXISTS "Enable read for all users" ON page_views;
DROP POLICY IF EXISTS "Enable read for all users" ON campaign_metrics;

-- 5. 새로운 RLS 정책 생성
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

-- 6. 테스트 데이터 추가
INSERT INTO campaign_metrics (campaign_id, views, phone_clicks, form_submissions, quiz_completions, conversion_rate)
VALUES 
  ('2025-07', 1234, 45, 23, 67, 3.7),
  ('2025-06', 2456, 89, 45, 123, 4.2),
  ('2025-08', 0, 0, 0, 0, 0)
ON CONFLICT (campaign_id) 
DO UPDATE SET
  views = EXCLUDED.views,
  phone_clicks = EXCLUDED.phone_clicks,
  form_submissions = EXCLUDED.form_submissions,
  quiz_completions = EXCLUDED.quiz_completions,
  conversion_rate = EXCLUDED.conversion_rate;

-- 7. 테스트 page_view 추가
INSERT INTO page_views (campaign_id, page_url)
VALUES ('2025-07', '/test-page');

-- 8. 확인
SELECT 'Tables created successfully!' as status;
SELECT COUNT(*) as page_views_count FROM page_views;
SELECT COUNT(*) as campaign_metrics_count FROM campaign_metrics;
EOF
echo "========== SQL 끝 =========="
echo ""
echo "5. RUN 버튼을 클릭하고 성공 메시지 확인"
echo ""
echo "6. 브라우저에서 페이지 새로고침:"
echo "   - 관리자 페이지: http://localhost:3000/admin"
echo "   - 디버그 페이지: http://localhost:3000/debug-tracking"
echo ""
echo "⚡ 빠른 테스트:"
echo "디버그 페이지에서 '테스트 조회수 추가' 버튼을 클릭해보세요!"