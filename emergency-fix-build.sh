#!/bin/bash
# 긴급 빌드 에러 수정 배포

echo "🚨 긴급 빌드 에러 수정 중..."

# Git 상태 확인
echo "📊 변경 사항:"
git status --short

# 커밋 및 푸시
echo ""
echo "🔧 빌드 에러 수정 사항:"
echo "  1. lib/supabase.ts, lib/supabase.js 파일 생성"
echo "  2. Node.js 버전 18.x → 20.x 업데이트"
echo ""
echo "🚀 즉시 배포하시겠습니까? (y/n)"
read -r response

if [[ "$response" == "y" || "$response" == "Y" ]]; then
    git add lib/supabase.ts lib/supabase.js package.json
    git commit -m "🚨 Fix: 빌드 에러 긴급 수정 - supabase 모듈 추가 및 Node.js 버전 업데이트"
    git push
    echo "✅ 긴급 수정 배포 완료!"
    echo "📌 Vercel에서 다시 빌드가 시작됩니다."
else
    echo "❌ 배포 취소됨"
fi
