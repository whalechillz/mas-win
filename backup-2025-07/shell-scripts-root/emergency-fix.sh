#!/bin/bash

echo "🚨 긴급 페이지 복구 스크립트"
echo "==========================="

# 프로덕션 모드로 빌드 및 실행
echo "🔨 프로덕션 빌드 시작..."
npm run build

echo ""
echo "🚀 프로덕션 서버 시작..."
npm run start

# 또는 개발 모드로 실행하려면:
# npm run dev
