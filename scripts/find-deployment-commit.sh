#!/bin/bash

# Vercel 배포 목록에서 Git 커밋 해시 찾기

echo "🔍 Vercel 배포 목록 확인 중..."

# 배포 목록 가져오기 (최대 100개)
vercel list --json > /tmp/vercel-deployments.json 2>&1

if [ $? -eq 0 ]; then
    echo "✅ 배포 목록 저장 완료"
    echo ""
    echo "📋 배포 목록 (최대 20개):"
    cat /tmp/vercel-deployments.json | jq -r '.[] | "\(.url) - \(.created) - \(.state)"' 2>/dev/null | head -20
    
    echo ""
    echo "🔍 mas-lva3ulwew 배포 찾기..."
    cat /tmp/vercel-deployments.json | jq -r '.[] | select(.url | contains("mas-lva3ulwew")) | "\(.url) - \(.created) - \(.state) - \(.meta.gitCommitSha // "N/A")"' 2>/dev/null
    
    echo ""
    echo "📊 전체 배포 수:"
    cat /tmp/vercel-deployments.json | jq '. | length' 2>/dev/null
else
    echo "❌ 배포 목록 가져오기 실패"
    echo "Vercel CLI 인증이 필요할 수 있습니다."
fi

