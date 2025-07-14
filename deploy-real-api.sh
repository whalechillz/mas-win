#!/bin/bash

echo "🔧 실제 콘텐츠 생성 API로 업데이트..."

# Git 커밋 및 푸시
git add pages/api/generate-multichannel-content.js
git commit -m "fix: implement actual content generation logic"
git push

echo ""
echo "✅ 완료! Vercel이 재배포 중입니다."
echo ""
echo "⏰ 2-3분 후에 다시 테스트해보세요."
echo ""
echo "📌 확인 방법:"
echo "1. 멀티채널 생성 버튼 클릭"
echo "2. '10개의 콘텐츠가 생성되었습니다' 메시지 확인"
echo "3. 페이지 새로고침"
echo "4. 콘텐츠 목록에 새로운 항목들이 표시되는지 확인"