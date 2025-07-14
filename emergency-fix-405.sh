#!/bin/bash

echo "🔧 Vercel 405 에러 긴급 수정..."

# TypeScript 파일 임시 비활성화
mv pages/api/generate-multichannel-content.ts pages/api/generate-multichannel-content.ts.disabled

# Git 커밋 및 푸시
git add .
git commit -m "fix: use JavaScript API to avoid TypeScript compilation issues"
git push

echo ""
echo "✅ 완료! Vercel이 자동으로 재배포됩니다."
echo ""
echo "2-3분 후에 다시 테스트해보세요."