#!/bin/bash

echo "🚀 관리자 페이지 재배포..."

# 기존 HTML 파일 커밋
git add public/admin-panel.html

# Next.js 페이지 추가
git add pages/admin.tsx

# vercel.json 추가
git add vercel.json

git commit -m "fix: 관리자 페이지를 Next.js 페이지로 변경

- HTML 파일을 admin-panel.html로 이름 변경
- Next.js 페이지 /admin 생성
- 두 가지 접근 방법 제공"

git push origin main

echo "✅ 배포 완료!"
echo ""
echo "📊 관리자 페이지 접속 방법:"
echo "1. Next.js 페이지: https://win.masgolf.co.kr/admin"
echo "2. 정적 HTML: https://win.masgolf.co.kr/admin-panel.html"