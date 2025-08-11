#!/bin/bash

echo "🎨 관리자 페이지 스타일 수정 중..."

# Git 커밋
echo "💾 변경사항 저장 중..."
git add .
git commit -m "fix: 관리자 페이지 스타일 적용

- _app.js에서 globals.css import 활성화
- Tailwind CSS 스타일 적용"

# Vercel 배포
echo "🚀 Vercel로 배포 중..."
vercel --prod

echo ""
echo "✅ 스타일 수정 완료!"
echo ""
echo "📋 수정사항:"
echo "- 전역 스타일(globals.css) 적용"
echo "- Tailwind CSS 클래스 활성화"
echo ""
echo "🌐 확인 URL:"
echo "- 관리자 페이지: https://win.masgolf.co.kr/admin"
echo ""
echo "이제 관리자 페이지가 현대적이고 전문적인 디자인으로 표시됩니다!"