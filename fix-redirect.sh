#!/bin/bash

echo "🔧 메인 페이지 리다이렉트 수정 중..."

# Git 커밋
echo "💾 변경사항 저장 중..."
git add .
git commit -m "fix: 메인 페이지 리다이렉트 제거

- next.config.js에서 6월 페이지로의 리다이렉트 제거
- 메인 페이지가 index.js의 7월 퍼널을 직접 표시하도록 수정"

# Vercel 배포
echo "🚀 Vercel로 배포 중..."
vercel --prod

echo ""
echo "✅ 리다이렉트 수정 완료!"
echo ""
echo "📋 변경사항:"
echo "- 메인 페이지(/) 접속 시 더 이상 6월 페이지로 이동하지 않음"
echo "- 7월 퍼널이 메인 페이지에 바로 표시됨"
echo ""
echo "🌐 확인 URL:"
echo "- 메인 사이트: https://win.masgolf.co.kr (7월 퍼널)"
echo "- 6월 캠페인: https://win.masgolf.co.kr/funnel-2025-06"
echo "- 관리자: https://win.masgolf.co.kr/admin"