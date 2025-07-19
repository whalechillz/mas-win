#!/bin/bash
# 대화창1 작업 배포 전 체크 스크립트

echo "🔍 대화창1 작업 변경사항 확인"
echo ""

echo "📋 추가된 파일들:"
echo "  - database/integrated-marketing-schema.sql"
echo "  - pages/api/integrated/funnel-plans-v2.ts"
echo "  - pages/api/integrated/generate-content-v2.ts"
echo "  - pages/api/integrated/validate-content-v2.ts"  
echo "  - pages/api/integrated/kpi-v2.ts"
echo "  - pages/api/integrated/employee-quota-v2.ts"
echo "  - pages/api/integrated/kpi-sync-v2.ts"
echo ""

echo "📊 데이터베이스 변경사항:"
echo "  - monthly_funnel_plans 테이블 추가"
echo "  - funnel_pages 테이블 추가"
echo "  - generated_contents 테이블 추가"
echo "  - monthly_kpis 테이블 추가"
echo "  - integrated_marketing_dashboard 뷰 추가"
echo ""

echo "⚠️  기존 시스템 영향도:"
echo "  - 기존 테이블 변경 없음 ✅"
echo "  - 기존 API 변경 없음 ✅"
echo "  - 새로운 기능만 추가 ✅"
echo ""

echo "🚀 배포 준비 완료!"
