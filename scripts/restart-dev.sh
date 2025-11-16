#!/bin/bash

# 개발 서버 재시작 스크립트
# 사용법: ./scripts/restart-dev.sh

echo "🔄 개발 서버 재시작 중..."

# 1. 기존 서버 프로세스 종료
echo "📴 기존 서버 종료 중..."
pkill -f "next dev" || true
sleep 1

# 2. .next 폴더 삭제 (선택사항 - 필요시 주석 해제)
# echo "🗑️  .next 폴더 삭제 중..."
# rm -rf .next

# 3. 빌드 실행
echo "🔨 빌드 실행 중..."
npm run build

# 4. 서버 시작
echo "🚀 서버 시작 중..."
npm run dev > /dev/null 2>&1 &

# 5. 서버 시작 대기
echo "⏳ 서버 시작 대기 중 (3초)..."
sleep 3

# 6. 서버 상태 확인
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|307\|301\|302"; then
    echo "✅ 서버가 정상적으로 시작되었습니다!"
    echo "🌐 http://localhost:3000 에서 확인하세요."
else
    echo "⚠️  서버 시작 확인 중 문제가 발생했습니다."
    echo "수동으로 확인해주세요: http://localhost:3000"
fi


