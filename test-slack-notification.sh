#!/bin/bash
echo "=== 슬랙 알림 테스트 ==="
echo ""

cd /Users/m2/MASLABS/win.masgolf.co.kr

# 로컬 서버 시작 알림
echo "로컬 서버를 시작합니다..."
echo "npm run dev"
echo ""
echo "서버가 시작되면 다른 터미널에서 테스트하세요:"
echo ""
echo "1. 시타 예약 테스트:"
echo 'curl -X POST http://localhost:3000/api/slack/notify \
  -H "Content-Type: application/json" \
  -d '{
    "type": "booking",
    "data": {
      "name": "테스트 고객",
      "phone": "010-1234-5678",
      "date": "2025-07-10",
      "time": "14:00",
      "club": "시크리트포스 PRO 3",
      "swing_style": "안정형",
      "priority": "비거리",
      "current_distance": 180,
      "recommended_flex": "R2"
    }
  }''
echo ""
echo "2. 상담 문의 테스트:"
echo 'curl -X POST http://localhost:3000/api/slack/notify \
  -H "Content-Type: application/json" \
  -d '{
    "type": "contact",
    "data": {
      "name": "상담 고객",
      "phone": "010-5678-1234",
      "call_times": "오후 2시, 오후 3시",
      "swing_style": "파워형",
      "priority": "방향성",
      "current_distance": 200,
      "recommended_flex": "R1"
    }
  }''
echo ""
echo "3. Vercel 로그 확인:"
echo "vercel logs --follow"
