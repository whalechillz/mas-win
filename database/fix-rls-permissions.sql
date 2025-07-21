-- RLS 정책 수정: anon 사용자도 읽기 가능하게
-- Supabase SQL Editor에서 실행하세요

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Enable read for authenticated users" ON page_views;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON campaign_metrics;

-- 새로운 정책 생성 (anon도 읽기 가능)
CREATE POLICY "Enable read for all users" ON page_views
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Enable read for all users" ON campaign_metrics
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Enable insert/update for authenticated users" ON campaign_metrics
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON campaign_metrics
  FOR UPDATE TO authenticated
  USING (true);

-- 테스트 데이터 추가 (선택사항)
INSERT INTO campaign_metrics (campaign_id, views, phone_clicks, form_submissions)
VALUES ('2025-07', 0, 0, 0)
ON CONFLICT (campaign_id) DO NOTHING;

-- 권한 확인
SELECT * FROM campaign_metrics WHERE campaign_id = '2025-07';
SELECT COUNT(*) FROM page_views WHERE campaign_id = '2025-07';
