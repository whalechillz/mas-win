#!/bin/bash

echo "🧪 로컬 API 테스트 (포트 3001)..."

# 1. Slack 테스트
echo -e "\n1️⃣ Slack 테스트..."
curl -s http://localhost:3001/api/slack-test | jq .

# 2. 예약 테스트
echo -e "\n2️⃣ 예약 테스트..."
curl -s -X POST http://localhost:3001/api/booking \
  -H "Content-Type: application/json" \
  -d '{
    "name": "로컬 테스트",
    "phone": "010-1234-5678",
    "date": "2025-07-05",
    "time": "14:00",
    "club": "드라이버"
  }' | jq .

echo -e "\n✅ 테스트 완료!"