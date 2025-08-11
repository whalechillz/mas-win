#!/bin/bash

echo "🚀 마케팅 대시보드 즉시 실행"
echo "========================"

# 실행 권한 부여
chmod +x test-marketing.sh deploy-patch.sh

# 선택 메뉴
echo ""
echo "선택하세요:"
echo "1) 로컬 테스트 (빠름)"
echo "2) 배포하기 (Vercel)"
echo "3) 둘 다 실행"
echo ""
read -p "선택 (1-3): " choice

case $choice in
  1)
    echo ""
    echo "🔄 로컬 테스트 시작..."
    ./test-marketing.sh
    ;;
  2)
    echo ""
    echo "📤 배포 시작..."
    ./deploy-patch.sh
    ;;
  3)
    echo ""
    echo "🔄 로컬 테스트 및 배포..."
    ./deploy-patch.sh
    echo ""
    echo "이제 로컬 테스트를 시작합니다..."
    ./test-marketing.sh
    ;;
  *)
    echo "잘못된 선택입니다."
    ;;
esac
