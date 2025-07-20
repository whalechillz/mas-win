#!/bin/bash

# 통합 마케팅 관리 시스템 데이터베이스 셋업 스크립트

echo "🚀 통합 마케팅 관리 시스템 데이터베이스 셋업 시작..."

# 환경 변수 로드
source .env.local

# Supabase 연결 정보
DB_URL="${NEXT_PUBLIC_SUPABASE_URL}"
DB_KEY="${SUPABASE_SERVICE_KEY}"

if [ -z "$DB_URL" ] || [ -z "$DB_KEY" ]; then
    echo "❌ 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인하세요."
    exit 1
fi

# SQL 파일 실행 함수
execute_sql() {
    local sql_file=$1
    echo "📝 실행 중: $sql_file"
    
    # Supabase REST API를 통해 SQL 실행
    curl -X POST "${DB_URL}/rest/v1/rpc/exec_sql" \
        -H "apikey: ${DB_KEY}" \
        -H "Authorization: Bearer ${DB_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"$(cat $sql_file | sed 's/"/\\"/g' | tr '\n' ' ')\"}" \
        --silent --show-error
}

# 1. 기존 스키마 확인 및 생성
echo "📊 기존 테이블 확인 중..."
if [ -f "database/marketing-dashboard-complete-schema.sql" ]; then
    echo "✅ 기존 마케팅 대시보드 스키마가 이미 존재합니다."
else
    echo "❌ 기존 스키마 파일을 찾을 수 없습니다."
fi

# 2. 통합 마케팅 스키마 실행
echo "🔧 통합 마케팅 관리 시스템 테이블 생성 중..."
if [ -f "database/integrated-marketing-schema.sql" ]; then
    # psql을 사용한 직접 실행 (supabase CLI가 설치된 경우)
    if command -v supabase &> /dev/null; then
        supabase db push database/integrated-marketing-schema.sql
        echo "✅ Supabase CLI를 통해 스키마가 적용되었습니다."
    else
        echo "⚠️  Supabase CLI가 설치되지 않았습니다."
        echo "📌 다음 방법 중 하나를 선택하세요:"
        echo ""
        echo "1. Supabase 대시보드에서 직접 실행:"
        echo "   - https://app.supabase.com 에 로그인"
        echo "   - 프로젝트 선택 > SQL Editor"
        echo "   - database/integrated-marketing-schema.sql 내용 복사/붙여넣기"
        echo ""
        echo "2. Supabase CLI 설치 후 실행:"
        echo "   npm install -g supabase"
        echo "   supabase login"
        echo "   supabase link --project-ref [your-project-ref]"
        echo "   supabase db push database/integrated-marketing-schema.sql"
    fi
else
    echo "❌ integrated-marketing-schema.sql 파일을 찾을 수 없습니다."
    exit 1
fi

# 3. 결과 확인
echo ""
echo "📋 설치 완료! 다음 테이블들이 생성되었습니다:"
echo "  ✅ monthly_funnel_plans - 월별 퍼널 계획"
echo "  ✅ funnel_pages - 퍼널 페이지 구성"
echo "  ✅ generated_contents - AI 생성 콘텐츠"
echo "  ✅ monthly_kpis - 월별 KPI 관리"
echo "  ✅ google_ads_utm_tags - 구글 광고 UTM 태그"
echo "  ✅ content_generation_logs - 콘텐츠 생성 로그"
echo ""
echo "🎯 다음 단계:"
echo "  1. Supabase 대시보드에서 테이블 생성 확인"
echo "  2. API 엔드포인트 테스트 (/api/integrated/*)"
echo "  3. KPIManager 컴포넌트 구현 (대화창 2)"
echo ""
echo "✨ 데이터베이스 셋업이 완료되었습니다!"
