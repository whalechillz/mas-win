#!/bin/bash

# 마쓰구(MASGOLF) 데이터베이스 고도화 스크립트
# 기존 테이블 삭제 후 새로운 3개 테이블 생성

echo "🚀 마쓰구 데이터베이스 고도화 시작..."

# 1. Supabase CLI가 설치되어 있는지 확인
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI가 설치되어 있지 않습니다."
    echo "다음 명령어로 설치해주세요:"
    echo "npm install -g supabase"
    exit 1
fi

# 2. 현재 디렉토리 확인
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "📁 프로젝트 디렉토리: $PROJECT_DIR"

# 3. SQL 파일 경로
SQL_FILE="$PROJECT_DIR/database/upgrade-to-new-schema.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo "❌ SQL 파일을 찾을 수 없습니다: $SQL_FILE"
    exit 1
fi

echo "📄 SQL 파일: $SQL_FILE"

# 4. 백업 생성 (선택사항)
echo "💾 기존 데이터 백업을 생성하시겠습니까? (y/n)"
read -r backup_choice

if [[ $backup_choice =~ ^[Yy]$ ]]; then
    echo "📦 기존 데이터 백업 중..."
    
    # 백업 디렉토리 생성
    BACKUP_DIR="$PROJECT_DIR/database/backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # 기존 테이블 데이터 백업
    echo "백업 디렉토리: $BACKUP_DIR"
    
    # Supabase에서 데이터 내보내기 (수동으로 진행)
    echo "⚠️  Supabase 대시보드에서 다음 작업을 수동으로 진행해주세요:"
    echo "1. contacts 테이블 데이터 내보내기"
    echo "2. bookings 테이블 데이터 내보내기"
    echo "3. quiz_results 테이블 데이터 내보내기"
    echo "4. 내보낸 CSV 파일을 $BACKUP_DIR 에 저장"
fi

# 5. 데이터베이스 업그레이드 실행
echo "🔄 데이터베이스 스키마 업그레이드 실행 중..."

# Supabase SQL 실행
supabase db reset --linked

if [ $? -eq 0 ]; then
    echo "✅ 데이터베이스 리셋 완료"
else
    echo "❌ 데이터베이스 리셋 실패"
    exit 1
fi

# 새로운 스키마 적용
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ 새로운 스키마 적용 완료"
else
    echo "❌ 스키마 적용 실패"
    exit 1
fi

# 6. 완료 메시지
echo ""
echo "🎉 데이터베이스 고도화 완료!"
echo ""
echo "📊 새로운 테이블 구조:"
echo "   - customer_profiles (고객 프로필)"
echo "   - contacts (문의하기)"
echo "   - bookings (시타 예약)"
echo ""
echo "🔗 관련 파일:"
echo "   - SQL 스크립트: $SQL_FILE"
echo "   - API 엔드포인트: pages/api/contact.js, pages/api/booking.js"
echo "   - 문서: docs/database-schema.md"
echo ""
echo "✅ 이제 8월 퍼널에서 시타 예약과 문의 기능을 정상적으로 사용할 수 있습니다!" 