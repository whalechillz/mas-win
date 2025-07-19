#!/bin/bash

echo "🔧 페이지 로딩 문제 해결 스크립트"
echo "================================"

# 1. framer-motion 안정 버전으로 다운그레이드
echo "📦 framer-motion 다운그레이드 중..."
npm uninstall framer-motion
npm install framer-motion@10.18.0

# 2. node_modules 정리
echo "🧹 node_modules 정리 중..."
rm -rf node_modules/.cache
rm -rf .next

# 3. 의존성 재설치
echo "📦 의존성 재설치 중..."
npm install

# 4. 개발 서버 재시작
echo "🚀 개발 서버 시작..."
npm run dev
