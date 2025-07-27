#!/bin/bash
# chmod +x update-july-2026.sh

# 2026년 7월 데이터 업데이트 스크립트

echo "🔄 2026년 7월 월별 테마 데이터 업데이트 시작..."

# 환경 변수에서 데이터베이스 정보 읽기
source .env.local

# SQL 실행
psql $DATABASE_URL -f database/update-2026-july.sql

echo "✅ 2026년 7월 데이터 업데이트 완료!"

# 전체 2026년 데이터 확인
echo "📊 2026년 전체 데이터 확인:"
psql $DATABASE_URL -c "SELECT year, month, theme FROM monthly_themes WHERE year = 2026 ORDER BY month;"
