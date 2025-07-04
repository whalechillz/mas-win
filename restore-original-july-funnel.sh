#!/bin/bash

echo "🔄 7월 퍼널 페이지를 원래 디자인으로 복구 중..."

# 가장 처음 백업 파일로 복원 (수정 전 원본)
if [ -f "public/versions/funnel-2025-07-complete.html.backup-20250704-163705" ]; then
    cp public/versions/funnel-2025-07-complete.html.backup-20250704-163705 public/versions/funnel-2025-07-complete.html
    echo "✅ 원본 파일로 복구 완료!"
else
    echo "❌ 백업 파일을 찾을 수 없습니다."
    echo "수동으로 파일을 복구해야 합니다."
fi

# Git 커밋
echo ""
echo "💾 변경사항 저장 중..."
git add public/versions/funnel-2025-07-complete.html
git commit -m "revert: 7월 퍼널 페이지를 원본 디자인으로 복구

- 뜨거운 여름, 완벽한 스윙 디자인으로 복원
- 모든 수정사항 되돌리기"

# Vercel 배포
echo ""
echo "🚀 Vercel로 배포 중..."
vercel --prod

echo ""
echo "✅ 복구 완료!"
echo ""
echo "🌐 확인 URL:"
echo "- https://win.masgolf.co.kr/funnel-2025-07"
echo "- https://win.masgolf.co.kr/campaign/2025-07"
echo "- https://win.masgolf.co.kr (메인)"