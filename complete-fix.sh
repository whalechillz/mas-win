#!/bin/bash

echo "🔧 에러 완전 해결 스크립트"
echo "========================"

# 1. 실행 권한 부여
chmod +x deploy-fix.sh

# 2. framer-motion 다운그레이드 (안정 버전)
echo "📦 framer-motion 안정화..."
npm uninstall framer-motion
npm install framer-motion@10.18.0

# 3. 캐시 정리
echo "🧹 캐시 정리..."
rm -rf .next
rm -rf node_modules/.cache

# 4. Git 커밋 및 푸시
echo "📤 변경사항 배포..."
git add .
git commit -m "fix: bookings_with_quiz 뷰 에러 해결 및 framer-motion 안정화"
git push origin main

# 5. 로컬 테스트
echo ""
echo "🚀 로컬 서버 시작..."
npm run dev
