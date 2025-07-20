#!/bin/bash

# 통합 마케팅 시스템 최종 배포 스크립트
# 실행: ./deploy-integrated-marketing.sh

echo "🚀 통합 마케팅 시스템 배포 시작..."

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 함수: 성공 메시지
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# 함수: 에러 메시지
error() {
    echo -e "${RED}✗ $1${NC}"
    exit 1
}

# 함수: 경고 메시지
warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# 1. 환경 변수 확인
echo "1. 환경 변수 확인..."
if [ ! -f .env.local ]; then
    error ".env.local 파일이 없습니다."
fi

# 필수 환경 변수 체크
required_vars=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "OPENAI_API_KEY"
    "ANTHROPIC_API_KEY"
)

for var in "${required_vars[@]}"; do
    if ! grep -q "^$var=" .env.local; then
        error "$var 환경 변수가 설정되지 않았습니다."
    fi
done
success "환경 변수 확인 완료"

# 2. 의존성 설치
echo -e "\n2. 의존성 설치..."
npm install --legacy-peer-deps || error "의존성 설치 실패"
success "의존성 설치 완료"

# 3. TypeScript 컴파일 체크
echo -e "\n3. TypeScript 컴파일 체크..."
npx tsc --noEmit || warning "TypeScript 경고가 있습니다."
success "TypeScript 체크 완료"

# 4. 린트 체크
echo -e "\n4. ESLint 체크..."
npm run lint || warning "ESLint 경고가 있습니다."
success "린트 체크 완료"

# 5. 테스트 실행
echo -e "\n5. 통합 테스트 실행..."
if [ -f "tests/integrated-marketing/integration-test.js" ]; then
    node tests/integrated-marketing/integration-test.js || warning "일부 테스트가 실패했습니다."
else
    warning "통합 테스트 파일이 없습니다."
fi

# 6. 빌드
echo -e "\n6. 프로덕션 빌드..."
npm run build || error "빌드 실패"
success "빌드 완료"

# 7. 데이터베이스 마이그레이션
echo -e "\n7. 데이터베이스 마이그레이션..."
if [ -f "database/integrated-marketing-schema.sql" ]; then
    echo "데이터베이스 스키마를 적용하시겠습니까? (y/n)"
    read -r response
    if [ "$response" = "y" ]; then
        # Supabase CLI를 사용한 마이그레이션
        npx supabase db push || error "데이터베이스 마이그레이션 실패"
        success "데이터베이스 마이그레이션 완료"
    else
        warning "데이터베이스 마이그레이션 건너뜀"
    fi
fi

# 8. 정적 파일 확인
echo -e "\n8. 정적 파일 확인..."
directories=(
    "public/campaigns"
    "public/funnel-pages"
)

for dir in "${directories[@]}"; do
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        warning "$dir 디렉토리 생성됨"
    fi
done
success "정적 파일 구조 확인 완료"

# 9. Vercel 환경 변수 설정
echo -e "\n9. Vercel 환경 변수 설정..."
echo "Vercel에 환경 변수를 설정하시겠습니까? (y/n)"
read -r response
if [ "$response" = "y" ]; then
    # .env.local 파일에서 환경 변수 읽어서 Vercel에 설정
    while IFS='=' read -r key value; do
        if [[ ! -z "$key" && "$key" != \#* ]]; then
            vercel env add "$key" production < <(echo "$value") 2>/dev/null
        fi
    done < .env.local
    success "Vercel 환경 변수 설정 완료"
fi

# 10. 배포
echo -e "\n10. Vercel 배포..."
echo "프로덕션 환경에 배포하시겠습니까? (y/n)"
read -r response
if [ "$response" = "y" ]; then
    vercel --prod || error "배포 실패"
    success "배포 완료!"
    
    # 배포 URL 출력
    echo -e "\n${GREEN}🎉 통합 마케팅 시스템이 성공적으로 배포되었습니다!${NC}"
    echo -e "URL: https://win.masgolf.co.kr"
else
    # 프리뷰 배포
    vercel || error "프리뷰 배포 실패"
    success "프리뷰 배포 완료"
fi

# 11. 배포 후 체크
echo -e "\n11. 배포 후 체크리스트:"
echo "- [ ] 통합 마케팅 관리 탭 접근 확인"
echo "- [ ] 퍼널 계획 CRUD 작동 확인"
echo "- [ ] 콘텐츠 생성 기능 확인"
echo "- [ ] KPI 대시보드 표시 확인"
echo "- [ ] 모바일 반응형 확인"
echo "- [ ] 성능 모니터링 설정"

echo -e "\n${GREEN}배포가 완료되었습니다!${NC}"