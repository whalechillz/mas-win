#!/bin/bash

# Vercel에서 특정 브랜치의 모든 배포를 삭제하는 스크립트
# 사용법: ./scripts/remove-vercel-branch-deployments.sh <branch-name>

BRANCH_NAME="${1:-fix/tiptap-keyboard-input-and-published-date}"

echo "🔍 Vercel에서 '$BRANCH_NAME' 브랜치의 배포를 찾는 중..."

# Vercel 배포 목록 가져오기
DEPLOYMENTS=$(vercel list --json 2>/dev/null)

if [ $? -ne 0 ]; then
    echo "❌ Vercel CLI 인증이 필요합니다. 'vercel login'을 실행하세요."
    exit 1
fi

# 해당 브랜치의 배포 찾기
BRANCH_DEPLOYMENTS=$(echo "$DEPLOYMENTS" | jq -r ".[] | select(.meta?.gitBranch == \"$BRANCH_NAME\" or .meta?.gitBranch | contains(\"$BRANCH_NAME\")) | .uid")

if [ -z "$BRANCH_DEPLOYMENTS" ]; then
    echo "✅ '$BRANCH_NAME' 브랜치의 배포를 찾을 수 없습니다."
    echo "   (이미 삭제되었거나 존재하지 않습니다)"
    exit 0
fi

echo ""
echo "📋 발견된 배포 목록:"
echo "$BRANCH_DEPLOYMENTS" | while read uid; do
    if [ ! -z "$uid" ]; then
        DEPLOYMENT_INFO=$(echo "$DEPLOYMENTS" | jq -r ".[] | select(.uid == \"$uid\") | \"\(.url) - \(.state) - \(.created)\"")
        echo "  - $uid: $DEPLOYMENT_INFO"
    fi
done

echo ""
read -p "이 배포들을 삭제하시겠습니까? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 취소되었습니다."
    exit 0
fi

echo ""
echo "🗑️  배포 삭제 중..."

DELETED_COUNT=0
FAILED_COUNT=0

echo "$BRANCH_DEPLOYMENTS" | while read uid; do
    if [ ! -z "$uid" ]; then
        echo "  삭제 중: $uid"
        vercel remove "$uid" --yes 2>&1 | grep -q "Removed" && {
            echo "    ✅ 삭제 완료: $uid"
            DELETED_COUNT=$((DELETED_COUNT + 1))
        } || {
            echo "    ❌ 삭제 실패: $uid"
            FAILED_COUNT=$((FAILED_COUNT + 1))
        }
    fi
done

echo ""
echo "✅ 완료!"
echo "   삭제된 배포: $DELETED_COUNT"
echo "   실패한 배포: $FAILED_COUNT"
echo ""
echo "💡 참고: Vercel 대시보드에서 브랜치 필터를 새로고침하면"
echo "   해당 브랜치가 목록에서 사라진 것을 확인할 수 있습니다."

