#!/bin/bash

echo "🚀 메인 페이지 7월 퍼널 설정 중..."

# Git 커밋
echo "💾 변경사항 저장 중..."
git add .
git commit -m "fix: 메인 페이지가 7월 퍼널을 직접 표시하도록 수정

- index.js에서 직접 iframe으로 funnel-2025-07-complete.html 표시
- 리다이렉트 대신 직접 렌더링
- 전체 화면 표시를 위한 스타일 추가"

# Vercel 배포
echo "🚀 Vercel로 배포 중..."
vercel --prod

echo ""
echo "✅ 메인 페이지 설정 완료!"
echo ""
echo "📋 변경사항:"
echo "- https://win.masgolf.co.kr 이 7월 퍼널을 직접 표시"
echo "- 전체 화면으로 표시되도록 스타일 적용"
echo ""
echo "🌐 확인 URL:"
echo "- 메인 사이트: https://win.masgolf.co.kr"
echo "- 관리자 페이지: https://win.masgolf.co.kr/admin"
echo "- 버전 목록: https://win.masgolf.co.kr/versions"