#!/bin/bash

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 이모지 정의
EMOJI_FEAT="✨"     # 새로운 기능
EMOJI_FIX="🐛"      # 버그 수정
EMOJI_DOCS="📝"     # 문서 수정
EMOJI_STYLE="💄"    # UI/스타일 파일 추가/수정
EMOJI_REFACTOR="♻️"  # 코드 리팩토링
EMOJI_PERF="⚡️"     # 성능 개선
EMOJI_TEST="✅"     # 테스트 추가/수정
EMOJI_BUILD="🔨"    # 빌드 관련 수정
EMOJI_CHORE="🔧"    # 기타 변경사항
EMOJI_REMOVE="🔥"   # 파일 삭제
EMOJI_DEPLOY="🚀"   # 배포

echo -e "${BLUE}=== Git Easy Commit ===${NC}"
echo ""

# Git 상태 확인
echo -e "${YELLOW}현재 Git 상태:${NC}"
git status --short
echo ""

# 변경사항이 있는지 확인
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${RED}커밋할 변경사항이 없습니다.${NC}"
    exit 0
fi

# 커밋 타입 선택
echo -e "${GREEN}커밋 타입을 선택하세요:${NC}"
echo "1) ${EMOJI_FEAT} feat     - 새로운 기능 추가"
echo "2) ${EMOJI_FIX} fix      - 버그 수정"
echo "3) ${EMOJI_DOCS} docs     - 문서 수정"
echo "4) ${EMOJI_STYLE} style    - UI/스타일 수정"
echo "5) ${EMOJI_REFACTOR} refactor - 코드 리팩토링"
echo "6) ${EMOJI_PERF} perf     - 성능 개선"
echo "7) ${EMOJI_TEST} test     - 테스트 추가/수정"
echo "8) ${EMOJI_BUILD} build    - 빌드 관련 수정"
echo "9) ${EMOJI_CHORE} chore    - 기타 변경사항"
echo "10) ${EMOJI_REMOVE} remove   - 파일 삭제"
echo "11) ${EMOJI_DEPLOY} deploy   - 배포"
echo ""

read -p "번호를 입력하세요 (1-11): " TYPE_NUM

case $TYPE_NUM in
    1) TYPE="feat"; EMOJI=$EMOJI_FEAT;;
    2) TYPE="fix"; EMOJI=$EMOJI_FIX;;
    3) TYPE="docs"; EMOJI=$EMOJI_DOCS;;
    4) TYPE="style"; EMOJI=$EMOJI_STYLE;;
    5) TYPE="refactor"; EMOJI=$EMOJI_REFACTOR;;
    6) TYPE="perf"; EMOJI=$EMOJI_PERF;;
    7) TYPE="test"; EMOJI=$EMOJI_TEST;;
    8) TYPE="build"; EMOJI=$EMOJI_BUILD;;
    9) TYPE="chore"; EMOJI=$EMOJI_CHORE;;
    10) TYPE="remove"; EMOJI=$EMOJI_REMOVE;;
    11) TYPE="deploy"; EMOJI=$EMOJI_DEPLOY;;
    *) echo -e "${RED}잘못된 선택입니다.${NC}"; exit 1;;
esac

# 커밋 메시지 입력
echo ""
read -p "커밋 메시지를 입력하세요: " MESSAGE

if [ -z "$MESSAGE" ]; then
    echo -e "${RED}커밋 메시지를 입력해주세요.${NC}"
    exit 1
fi

# 전체 추가 여부 확인
echo ""
echo -e "${YELLOW}변경된 파일:${NC}"
git status --short
echo ""
read -p "모든 파일을 추가하시겠습니까? (y/n): " ADD_ALL

if [ "$ADD_ALL" = "y" ] || [ "$ADD_ALL" = "Y" ]; then
    git add .
    echo -e "${GREEN}모든 파일이 추가되었습니다.${NC}"
else
    echo -e "${YELLOW}수동으로 파일을 추가해주세요.${NC}"
    echo "예: git add <파일명>"
    exit 0
fi

# 커밋 메시지 구성
COMMIT_MESSAGE="${EMOJI} ${TYPE}: ${MESSAGE}"

# 커밋 실행
echo ""
echo -e "${BLUE}커밋 메시지: ${COMMIT_MESSAGE}${NC}"
read -p "이대로 커밋하시겠습니까? (y/n): " CONFIRM

if [ "$CONFIRM" = "y" ] || [ "$CONFIRM" = "Y" ]; then
    git commit -m "$COMMIT_MESSAGE"
    echo ""
    echo -e "${GREEN}✅ 커밋이 완료되었습니다!${NC}"
    
    # Push 여부 확인
    echo ""
    read -p "원격 저장소에 Push 하시겠습니까? (y/n): " PUSH_CONFIRM
    
    if [ "$PUSH_CONFIRM" = "y" ] || [ "$PUSH_CONFIRM" = "Y" ]; then
        BRANCH=$(git branch --show-current)
        git push origin $BRANCH
        echo -e "${GREEN}🚀 Push가 완료되었습니다! (브랜치: $BRANCH)${NC}"
    fi
else
    echo -e "${YELLOW}커밋이 취소되었습니다.${NC}"
fi
