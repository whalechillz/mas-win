#!/bin/bash

echo "🔔 슬랙 알림 기능 추가 중..."

# Git 커밋
echo "💾 변경사항 저장 중..."
git add .
git commit -m "feat: 슬랙 알림 기능 추가

- 새로운 예약/문의 시 슬랙으로 실시간 알림
- /api/slack/notify 엔드포인트 추가
- booking/contact API에 슬랙 알림 연동
- 상세한 설정 가이드 포함"

# Vercel 배포
echo "🚀 Vercel로 배포 중..."
vercel --prod

echo ""
echo "✅ 슬랙 알림 기능 추가 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. SLACK_SETUP_GUIDE.md 파일을 읽고 슬랙 웹훅 설정"
echo "2. Vercel 대시보드에서 SLACK_WEBHOOK_URL 환경변수 추가"
echo "3. 테스트 예약/문의를 통해 알림 확인"
echo ""
echo "🔔 알림 내용:"
echo "- 시타 예약: 고객명, 연락처, 희망날짜/시간, 관심클럽"
echo "- 상담 문의: 고객명, 연락처, 통화가능시간"
echo "- 관리자 페이지 바로가기 버튼 포함"
echo ""
echo "📚 자세한 설정 방법은 SLACK_SETUP_GUIDE.md 참조"