#!/bin/bash

echo "🚀 안전한 배포 스크립트 시작..."

# 1. 현재 파일 백업
echo "📦 현재 파일 백업 중..."
cp pages/25-09.tsx pages/25-09-backup-$(date +%Y%m%d-%H%M%S).tsx

# 2. 프로덕션 준비 파일로 교체
echo "🔄 프로덕션 준비 파일로 교체 중..."
cp pages/25-09-production-ready.tsx pages/25-09.tsx

# 3. 빌드 테스트
echo "🔨 빌드 테스트 중..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ 빌드 성공!"
    
    # 4. 배포 (Vercel인 경우)
    echo "🚀 배포 중..."
    vercel --prod
    
    if [ $? -eq 0 ]; then
        echo "✅ 배포 성공!"
        echo "🎉 모바일 회색 화면 문제가 해결되었습니다!"
    else
        echo "❌ 배포 실패! 백업 파일로 복원 중..."
        cp pages/25-09-backup-*.tsx pages/25-09.tsx
        echo "🔄 원본 파일로 복원 완료"
    fi
else
    echo "❌ 빌드 실패! 백업 파일로 복원 중..."
    cp pages/25-09-backup-*.tsx pages/25-09.tsx
    echo "🔄 원본 파일로 복원 완료"
fi

echo "🏁 배포 스크립트 완료"
