#!/bin/bash

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Git Quick Commit ===${NC}"
echo ""

# 인자가 있으면 바로 커밋
if [ $# -gt 0 ]; then
    MESSAGE="$*"
    git add .
    git commit -m "🔧 update: $MESSAGE"
    echo -e "${GREEN}✅ 커밋 완료: $MESSAGE${NC}"
    
    read -p "Push 하시겠습니까? (y/n): " PUSH
    if [ "$PUSH" = "y" ]; then
        git push
        echo -e "${GREEN}🚀 Push 완료!${NC}"
    fi
    exit 0
fi

# 인자가 없으면 대화형 모드
echo -e "${YELLOW}사용법:${NC}"
echo "  빠른 커밋: ./quick-commit.sh 커밋 메시지"
echo "  예시: ./quick-commit.sh 비디오 플레이어 추가"
echo ""

git status --short
echo ""
read -p "커밋 메시지: " MESSAGE

if [ -z "$MESSAGE" ]; then
    echo "메시지를 입력해주세요."
    exit 1
fi

git add .
git commit -m "🔧 update: $MESSAGE"
echo -e "${GREEN}✅ 커밋 완료!${NC}"

read -p "Push? (y/n): " PUSH
if [ "$PUSH" = "y" ]; then
    git push
    echo -e "${GREEN}🚀 Push 완료!${NC}"
fi
