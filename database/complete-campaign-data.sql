-- 완전한 캠페인 데이터 생성
-- Supabase SQL Editor에서 실행하세요!

-- 1. 기존 데이터 정리
DELETE FROM campaign_metrics;

-- 2. 모든 월별 캠페인 데이터 추가
INSERT INTO campaign_metrics (campaign_id, views, unique_visitors, phone_clicks, form_submissions, quiz_completions, conversion_rate, created_at, updated_at)
VALUES 
  ('2025-05', 2897, 2156, 156, 89, 234, 5.4, '2025-05-01', NOW()),
  ('2025-06', 2341, 1823, 134, 67, 189, 5.7, '2025-06-01', NOW()),
  ('2025-07', 1523, 892, 87, 45, 123, 5.7, '2025-07-01', NOW()),
  ('2025-08', 0, 0, 0, 0, 0, 0.0, '2025-08-01', NOW());

-- 3. 페이지뷰 데이터 추가
INSERT INTO page_views (campaign_id, page_url, ip_address, created_at)
VALUES 
  ('2025-05', '/funnel-2025-05', '192.168.1.1', '2025-05-15'),
  ('2025-05', '/funnel-2025-05', '192.168.1.2', '2025-05-16'),
  ('2025-06', '/funnel-2025-06', '192.168.1.3', '2025-06-10'),
  ('2025-06', '/funnel-2025-06', '192.168.1.4', '2025-06-12'),
  ('2025-07', '/funnel-2025-07', '192.168.1.5', '2025-07-01'),
  ('2025-07', '/funnel-2025-07', '192.168.1.6', '2025-07-02');

-- 4. 확인
SELECT '캠페인 데이터 완성!' as status;
SELECT campaign_id, views, unique_visitors, phone_clicks, form_submissions, conversion_rate 
FROM campaign_metrics 
ORDER BY campaign_id;
