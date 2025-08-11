#!/bin/bash

echo "📊 캠페인별 KPI 대시보드 설정"
echo "============================"
echo ""
echo "1️⃣ Supabase에서 campaigns 테이블 생성:"
echo "   database/campaigns-table.sql 내용을 SQL Editor에서 실행"
echo ""
echo "2️⃣ 관리자 페이지에 컴포넌트 추가:"
echo "   admin.tsx에서 CampaignKPIDashboard import"
echo ""
echo "3️⃣ 테스트 데이터 추가:"
cat << 'TEST_DATA'
-- 테스트용 추가 데이터
UPDATE campaign_metrics 
SET 
  views = 1234,
  phone_clicks = 45,
  form_submissions = 23,
  quiz_completions = 67,
  conversion_rate = 1.87
WHERE campaign_id = '2025-07';

-- 6월 데이터 추가
INSERT INTO campaign_metrics (campaign_id, views, phone_clicks, form_submissions, quiz_completions, conversion_rate)
VALUES ('2025-06', 2456, 89, 45, 123, 1.83)
ON CONFLICT (campaign_id) DO UPDATE SET
  views = EXCLUDED.views,
  phone_clicks = EXCLUDED.phone_clicks,
  form_submissions = EXCLUDED.form_submissions;
TEST_DATA
echo ""
echo "4️⃣ 주요 기능:"
echo "   • 캠페인별 독립적인 KPI 추적"
echo "   • 전체 캠페인 통합 보기"
echo "   • 실시간 데이터 업데이트"
echo "   • 캠페인 상태 자동 관리 (예정/진행중/종료)"
echo "   • 목표 대비 달성률 표시"
echo ""
echo "✅ 완료!"
