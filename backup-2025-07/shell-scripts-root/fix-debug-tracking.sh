#!/bin/bash

echo "🔧 디버그 페이지 수정 시작..."
echo "=============================="
echo ""

# 서버 재시작 안내
echo "📌 다음 단계를 따라주세요:"
echo ""
echo "1. Supabase 대시보드 (https://supabase.com/dashboard) 접속"
echo "2. SQL Editor로 이동"
echo "3. 다음 SQL 실행:"
echo ""
echo "-- 1단계: 테이블 생성 (이미 있다면 무시됨)"
cat database/campaign-tracking-schema.sql
echo ""
echo "-- 2단계: RLS 정책 수정"
cat database/fix-rls-permissions.sql
echo ""
echo "4. 개발 서버 재시작:"
echo "   npm run dev"
echo ""
echo "5. http://localhost:3000/debug-tracking 접속해서 확인"
echo ""
echo "✅ 환경변수는 이미 제대로 설정되어 있습니다!"