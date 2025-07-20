#!/bin/bash

# 통합 마케팅 시스템 빠른 배포 스크립트
# 에러 수정 후 배포

echo "🚀 통합 마케팅 시스템 배포 시작..."

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. 환경 변수 확인
echo "1. 환경 변수 확인..."
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠ .env.local 파일이 없습니다. 샘플 파일을 복사하세요:${NC}"
    echo "cp .env.example .env.local"
    echo "그리고 환경 변수를 설정하세요."
    exit 1
fi
echo -e "${GREEN}✓ 환경 변수 확인 완료${NC}"

# 2. 의존성 설치
echo -e "\n2. 의존성 설치..."
npm install --legacy-peer-deps
echo -e "${GREEN}✓ 의존성 설치 완료${NC}"

# 3. 빌드
echo -e "\n3. 프로덕션 빌드..."
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 빌드 성공!${NC}"
else
    echo -e "${RED}✗ 빌드 실패${NC}"
    echo -e "${YELLOW}다음을 확인하세요:${NC}"
    echo "1. 환경 변수가 올바르게 설정되었는지"
    echo "2. 에러 메시지를 확인하고 수정"
    exit 1
fi

# 4. Vercel 배포
echo -e "\n4. Vercel 배포 옵션 선택..."
echo "1) 프리뷰 배포 (테스트용)"
echo "2) 프로덕션 배포 (실제 서비스)"
read -p "선택하세요 (1 or 2): " choice

case $choice in
    1)
        echo -e "\n프리뷰 배포 중..."
        vercel
        ;;
    2)
        echo -e "\n프로덕션 배포 중..."
        vercel --prod
        ;;
    *)
        echo -e "${RED}잘못된 선택입니다.${NC}"
        exit 1
        ;;
esac

echo -e "\n${GREEN}🎉 배포 프로세스가 완료되었습니다!${NC}"
echo -e "\n다음 단계:"
echo "1. 배포된 URL에서 통합 마케팅 관리 탭 확인"
echo "2. 각 기능 테스트"
echo "3. 성능 모니터링 확인"