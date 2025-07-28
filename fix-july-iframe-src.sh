#!/bin/bash

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 7월 퍼널 iframe src 수정 도구${NC}"
echo "========================================"

# 현재 상황 확인
echo -e "\n${YELLOW}1. 현재 파일 확인${NC}"

# TSX 파일 확인
if [ -f "pages/funnel-2025-07.tsx" ]; then
    echo -e "${GREEN}✅ pages/funnel-2025-07.tsx 파일 발견${NC}"
    
    # 현재 iframe src 확인
    current_src=$(grep -o 'funnel-2025-07-[^"]*\.html' pages/funnel-2025-07.tsx | head -1)
    echo -e "현재 iframe src: ${YELLOW}$current_src${NC}"
else
    echo -e "${RED}❌ pages/funnel-2025-07.tsx 파일을 찾을 수 없습니다${NC}"
    exit 1
fi

# HTML 파일 확인
echo -e "\n${YELLOW}2. 사용 가능한 HTML 파일${NC}"
ls -la public/versions/funnel-2025-07*.html 2>/dev/null | grep -v backup | awk '{print $9}'

# 백업 생성
echo -e "\n${YELLOW}3. 백업 생성${NC}"
timestamp=$(date +%Y%m%d_%H%M%S)
backup_file="pages/funnel-2025-07.tsx.backup-$timestamp"
cp pages/funnel-2025-07.tsx "$backup_file"
echo -e "${GREEN}✅ 백업 생성: $backup_file${NC}"

# src 수정
echo -e "\n${YELLOW}4. iframe src 수정${NC}"
echo -e "변경 전: funnel-2025-07-complete.html"
echo -e "변경 후: funnel-2025-07-supabase.html"

read -p "계속하시겠습니까? (y/n): " confirm

if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
    # sed를 사용하여 파일 수정
    sed -i.tmp 's/funnel-2025-07-complete\.html/funnel-2025-07-supabase.html/g' pages/funnel-2025-07.tsx
    rm pages/funnel-2025-07.tsx.tmp
    
    echo -e "${GREEN}✅ iframe src가 수정되었습니다${NC}"
    
    # 변경 사항 확인
    echo -e "\n${YELLOW}5. 변경 사항 확인${NC}"
    grep -n "funnel-2025-07-" pages/funnel-2025-07.tsx | head -5
    
    echo -e "\n${GREEN}✨ 수정 완료!${NC}"
    echo -e "${YELLOW}다음 단계:${NC}"
    echo "1. npm run dev로 로컬 테스트"
    echo "2. 브라우저에서 정상 작동 확인"
    echo "3. git commit & push로 배포"
    
    echo -e "\n${BLUE}롤백이 필요한 경우:${NC}"
    echo "cp $backup_file pages/funnel-2025-07.tsx"
else
    echo -e "${YELLOW}작업이 취소되었습니다${NC}"
fi