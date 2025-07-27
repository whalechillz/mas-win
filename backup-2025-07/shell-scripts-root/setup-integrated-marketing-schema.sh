#!/bin/bash

# 통합 마케팅 시스템 데이터베이스 설정 스크립트

echo "🚀 통합 마케팅 시스템 데이터베이스 설정 시작..."

# .env.local 파일 읽기
if [ -f ".env.local" ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Supabase URL과 Service Role Key 확인
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ 오류: NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다."
    echo "💡 .env.local 파일을 확인해주세요."
    exit 1
fi

# 데이터베이스 URL 구성
DB_HOST=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's/https:\/\///' | sed 's/.supabase.co//')
DB_URL="postgresql://postgres.${DB_HOST}:6543/postgres"

echo "📋 데이터베이스 연결 정보:"
echo "  - Host: $DB_HOST"
echo "  - Database: postgres"

# 스키마 파일 실행
echo ""
echo "📊 통합 마케팅 스키마 생성 중..."

# psql 명령어로 스키마 실행
PGPASSWORD=$POSTGRES_PASSWORD psql "postgresql://$POSTGRES_USER@$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DATABASE" -f database/integrated-marketing-schema.sql

if [ $? -eq 0 ]; then
    echo "✅ 통합 마케팅 스키마가 성공적으로 생성되었습니다!"
else
    echo "❌ 스키마 생성 중 오류가 발생했습니다."
    exit 1
fi

echo ""
echo "🎉 데이터베이스 설정이 완료되었습니다!"
echo ""
echo "📋 생성된 테이블:"
echo "  - monthly_funnel_plans (월별 퍼널 계획)"
echo "  - funnel_pages (퍼널 페이지)"
echo "  - generated_contents (생성된 콘텐츠)"
echo "  - monthly_kpis (월별 KPI)"
echo "  - integrated_marketing_dashboard (통합 대시보드 뷰)"
echo ""
echo "🚀 다음 단계:"
echo "  1. KPIManager 컴포넌트 구현 (대화창 2)"
echo "  2. MCP 연동 기능 구현 (대화창 3)"
echo "  3. 기존 컴포넌트 개선 (대화창 4)"
echo "  4. 최종 검증 및 배포 (대화창 5)"
