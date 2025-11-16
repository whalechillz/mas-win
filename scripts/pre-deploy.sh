#!/bin/bash

# 배포 전 빌드 캐시 정리 및 빌드 테스트 스크립트
# 사용법: ./scripts/pre-deploy.sh

echo "🧹 배포 전 빌드 캐시 정리 중..."

# 1. .next 폴더 삭제
echo "🗑️  .next 폴더 삭제 중..."
rm -rf .next

# 2. node_modules 캐시 정리 (선택사항)
# echo "🗑️  node_modules 캐시 정리 중..."
# rm -rf node_modules/.cache

# 3. 빌드 실행
echo "🔨 빌드 실행 중..."
npm run build

# 4. 빌드 검증
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 빌드 성공! 배포 가능합니다."
    echo ""
    echo "📝 다음 단계:"
    echo "   1. git add ."
    echo "   2. git commit -m 'your message'"
    echo "   3. git push origin main"
    echo ""
    echo "💡 Vercel에서 자동 배포가 시작됩니다."
else
    echo ""
    echo "❌ 빌드 실패! 배포를 중단합니다."
    echo "   에러를 확인하고 수정한 후 다시 시도하세요."
    exit 1
fi

