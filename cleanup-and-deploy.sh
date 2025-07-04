#!/bin/bash

echo "🔧 MASGOLF 사이트 정리 및 업데이트 시작..."

# 1. 백업 폴더 생성 및 파일 백업
echo "📦 불필요한 파일 백업 중..."
mkdir -p backup-remove-2025-01

# 파일이 존재하면 백업
if [ -f "public/versions/funnel-2025-07-premium-v2.html" ]; then
    mv public/versions/funnel-2025-07-premium-v2.html backup-remove-2025-01/
    echo "✓ funnel-2025-07-premium-v2.html 백업 완료"
fi

if [ -f "public/versions/funnel-2025-07-summer-final.html" ]; then
    mv public/versions/funnel-2025-07-summer-final.html backup-remove-2025-01/
    echo "✓ funnel-2025-07-summer-final.html 백업 완료"
fi

# 2. Git 커밋
echo "💾 변경사항 저장 중..."
git add .
git commit -m "refactor: 사이트 구조 정리 및 메인 페이지 업데이트

- versions 페이지에서 불필요한 항목 제거 (프리미엄 V2, 썸머 파이널)
- 메인 페이지(/)가 funnel-2025-07-complete를 표시하도록 변경
- 불필요한 파일들 백업 폴더로 이동"

# 3. Vercel 배포
echo "🚀 Vercel로 배포 중..."
vercel --prod

echo ""
echo "✅ 작업 완료!"
echo ""
echo "📋 변경사항 요약:"
echo "1. versions 페이지에서 2개 항목 제거"
echo "   - 2025년 7월 프리미엄 V2"
echo "   - 2025년 7월 썸머 파이널"
echo ""
echo "2. 메인 페이지 변경"
echo "   - https://win.masgolf.co.kr 이 funnel-2025-07-complete 내용을 표시"
echo ""
echo "3. 백업된 파일들"
echo "   - backup-remove-2025-01/ 폴더에 저장됨"
echo ""
echo "🌐 확인할 URL:"
echo "- 메인: https://win.masgolf.co.kr"
echo "- 버전 목록: https://win.masgolf.co.kr/versions"
echo "- 관리자: https://win.masgolf.co.kr/admin"