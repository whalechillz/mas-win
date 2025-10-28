#!/bin/bash

# 문서 자동 업데이트 스크립트
# 사용법: ./scripts/update-docs.sh [문제명] [상태]

PROBLEM_NAME=$1
STATUS=$2
DATE=$(date +%Y-%m-%d)

if [ "$STATUS" = "resolved" ]; then
    echo "🔄 문제 해결됨: $PROBLEM_NAME"
    
    # 1. active에서 resolved로 이동
    if [ -f "docs/active/$PROBLEM_NAME.md" ]; then
        mv "docs/active/$PROBLEM_NAME.md" "docs/resolved/$DATE-$PROBLEM_NAME.md"
        echo "✅ 파일 이동 완료: docs/resolved/$DATE-$PROBLEM_NAME.md"
    fi
    
    # 2. common-issues.md에 해결 방법 추가
    echo "" >> docs/common-issues.md
    echo "## ✅ 해결된 문제: $PROBLEM_NAME ($DATE)" >> docs/common-issues.md
    echo "- 해결일: $DATE" >> docs/common-issues.md
    echo "- 관련 문서: [docs/resolved/$DATE-$PROBLEM_NAME.md](resolved/$DATE-$PROBLEM_NAME.md)" >> docs/common-issues.md
    echo "" >> docs/common-issues.md
    
    # 3. README.md 업데이트
    echo "📊 문서 상태 업데이트 완료"
    
elif [ "$STATUS" = "new" ]; then
    echo "🆕 새로운 문제 추가: $PROBLEM_NAME"
    
    # 템플릿을 복사하여 새 문제 문서 생성
    cp docs/templates/problem-template.md "docs/active/$PROBLEM_NAME.md"
    
    # 파일명을 문제명으로 변경
    sed -i "s/\[문제명\]/$PROBLEM_NAME/g" "docs/active/$PROBLEM_NAME.md"
    sed -i "s/YYYY-MM-DD/$DATE/g" "docs/active/$PROBLEM_NAME.md"
    
    echo "✅ 새 문제 문서 생성: docs/active/$PROBLEM_NAME.md"
    
else
    echo "❌ 사용법: ./scripts/update-docs.sh [문제명] [resolved/new]"
    echo "예시:"
    echo "  ./scripts/update-docs.sh sms-troubleshooting resolved"
    echo "  ./scripts/update-docs.sh new-problem new"
fi
