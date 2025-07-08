#!/bin/bash

echo "=== 슬랙 알림 디자인 개선 ==="
echo ""

cd /Users/m2/MASLABS/win.masgolf.co.kr

# 1. 기존 파일 백업
echo "1. 기존 파일 백업..."
cp pages/api/slack/notify.js pages/api/slack/notify.js.backup-$(date +%Y%m%d-%H%M%S)

# 2. 새로운 디자인으로 교체
echo "2. 새로운 디자인 적용..."
cp pages/api/slack/notify-beautiful.js pages/api/slack/notify.js

echo ""
echo "✅ 슬랙 알림 디자인 개선 완료!"
echo ""
echo "개선된 내용:"
echo "📋 구조화된 섹션 디자인"
echo "🎨 이모지를 활용한 시각적 개선"
echo "📊 정보별 그룹화 (고객정보, 예약정보, 골프스타일)"
echo "🚀 비거리 증가량 강조 표시"
echo "📱 전화하기 버튼 추가"
echo "✅ 연락완료 버튼 추가 (문의 알림)"
echo ""
echo "다음 단계:"
echo "vercel --prod"
