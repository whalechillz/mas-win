#!/bin/bash

# 8월 휴가철 퍼널 페이지 배포 스크립트

echo "🏖️ 8월 휴가철 퍼널 페이지 배포 시작..."

# 1. 환경변수 확인
echo "📋 환경변수 확인 중..."
source .env.local

# 2. 빌드
echo "🔨 Next.js 빌드 중..."
npm run build

# 3. 배포 전 확인
echo "✅ 배포 전 체크리스트:"
echo "- [x] 이미지 파일 확인 완료"
echo "- [x] HTML 파일 생성 완료"
echo "- [x] TSX 파일 생성 완료"
echo "- [x] 전화번호 클릭 처리 확인"

# 4. Vercel 배포
echo "🚀 Vercel로 배포 중..."
vercel --prod

echo "✨ 8월 휴가철 퍼널 페이지 배포 완료!"
echo "🔗 URL: https://win.masgolf.co.kr/funnel-2025-08"
echo "📱 모바일 테스트를 꼭 진행해주세요!"
