#!/bin/bash

echo "=== 슬랙 알림 디자인 적용 ==="
echo ""

cd /Users/m2/MASLABS/win.masgolf.co.kr

# 1. 현재 notify.js 백업
echo "1. 기존 파일 백업..."
cp pages/api/slack/notify.js pages/api/slack/notify.js.backup-simple-$(date +%Y%m%d-%H%M%S)

# 2. 개선된 디자인 적용
echo "2. 개선된 디자인 적용..."
cp pages/api/slack/notify-beautiful.js pages/api/slack/notify.js

echo ""
echo "✅ 슬랙 알림 디자인 적용 완료!"
echo ""
echo "이제 슬랙 알림이 다음과 같이 개선됩니다:"
echo ""
echo "🎯 새로운 시타 예약이 접수되었습니다!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 고객 정보"
echo "이름: 북경    연락처: 01066699002"
echo ""
echo "📅 예약 정보"
echo "날짜: 2025-07-07    시간: 10:00"
echo "관심 클럽: 시크리트포스 PRO 3"
echo ""
echo "🏌️ 골프 스타일 분석"
echo "스윙 스타일: 안정형    중요 요소: 안정형"
echo ""
echo "📊 비거리 분석"
echo "현재 비거리: 180m"
echo "예상 비거리: 205m (+25m) 🚀"
echo ""
echo "🎯 추천 플렉스: R1 [✨ 최적화]"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⏰ 접수 시간: 2025. 7. 7. 오후 4:59:48"
echo ""
echo "[📞 전화하기] [💼 관리자 페이지]"
echo ""
echo "다음 명령어로 배포하세요:"
echo "vercel --prod"
