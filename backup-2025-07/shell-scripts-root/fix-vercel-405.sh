#!/bin/bash

echo "🔧 Vercel 배포 문제 해결 중..."

# 1. TypeScript 컴파일 확인
echo "1. TypeScript 컴파일 테스트..."
npx tsc pages/api/generate-multichannel-content.ts --noEmit

# 2. 빌드 캐시 클리어
echo ""
echo "2. 빌드 캐시 클리어..."
rm -rf .next
rm -rf node_modules/.cache

# 3. 재빌드
echo ""
echo "3. 프로젝트 재빌드..."
npm run build

echo ""
echo "✅ 완료! 이제 다음 명령을 실행하세요:"
echo "vercel --prod"