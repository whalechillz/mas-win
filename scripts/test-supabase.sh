#!/bin/bash
# Supabase 테스트 스크립트

echo "🔍 Supabase 연결 테스트 시작..."
echo ""

# 로컬 테스트
echo "1. 로컬 환경 테스트 (http://localhost:3000/api/test-db)"
curl -s http://localhost:3000/api/test-db | jq .

echo ""
echo "---"
echo ""

# 프로덕션 테스트
echo "2. 프로덕션 환경 테스트 (https://win.masgolf.co.kr/api/test-db)"
curl -s https://win.masgolf.co.kr/api/test-db | jq .

echo ""
echo "---"
echo ""

# booking API 테스트
echo "3. Booking API 테스트"
curl -X POST https://win.masgolf.co.kr/api/booking \
  -H "Content-Type: application/json" \
  -d '{
    "name": "테스트",
    "phone": "010-1234-5678",
    "date": "2025-01-15",
    "time": "14:00",
    "club": "아이언"
  }' | jq .

echo ""
echo "✅ 테스트 완료"
