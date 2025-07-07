#!/bin/bash
echo "=== 슬랙 알림 심플 디자인 적용 ==="
echo ""

cd /Users/m2/MASLABS/win.masgolf.co.kr

# 1. 기존 파일 백업
echo "1. 기존 파일 백업..."
cp pages/api/slack/notify.js pages/api/slack/notify.js.backup-$(date +%Y%m%d-%H%M%S)

# 2. 심플 버전 적용
echo "2. 심플 디자인 적용..."
cp pages/api/slack/notify-simple.js pages/api/slack/notify.js

echo ""
echo "✅ 슬랙 알림 심플 디자인 적용 완료!"
echo ""
echo "특징:"
echo "- 깔끔한 단일 메시지 형태"
echo "- 시타 예약: 빨간색 (FF0000)"
echo "- 상담 문의: 주황색 (FFA500)"
echo "- 필수 정보만 간결하게 표시"
echo "- 구분선으로 퀴즈 데이터 분리"
echo ""
echo "테스트 방법:"
echo "1. npm run dev"
echo "2. 새로운 예약/문의 테스트"
echo "3. 슬랙 메시지 확인"
echo ""
echo "배포: vercel --prod"
