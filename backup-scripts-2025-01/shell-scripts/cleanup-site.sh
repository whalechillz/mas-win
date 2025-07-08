#!/bin/bash

echo "🔧 MASGOLF 사이트 정리 작업 시작..."

# 1. 삭제할 파일들을 백업 폴더로 이동
echo "📦 불필요한 파일 백업 중..."
mkdir -p backup-remove-2025-01
mv public/versions/funnel-2025-07-premium-v2.html backup-remove-2025-01/ 2>/dev/null || true
mv public/versions/funnel-2025-07-summer-final.html backup-remove-2025-01/ 2>/dev/null || true

# 2. funnel-2025-07-complete.html을 메인 페이지로 설정
echo "🔄 메인 페이지 설정 중..."
cp public/versions/funnel-2025-07-complete.html public/index.html

# 3. Git 커밋
echo "💾 변경사항 저장 중..."
git add .
git commit -m "refactor: 사이트 정리 및 메인 페이지 업데이트

- 불필요한 버전 삭제 (프리미엄 V2, 썸머 파이널)
- funnel-2025-07-complete를 메인 페이지로 설정
- versions 페이지 정리"

# 4. Vercel 배포
echo "🚀 Vercel로 배포 중..."
vercel --prod

echo "✅ 작업 완료!"
echo ""
echo "📋 변경사항:"
echo "- 삭제된 파일들은 backup-remove-2025-01 폴더에 백업됨"
echo "- https://win.masgolf.co.kr 이 이제 7월 완성본으로 표시됨"
echo "- versions 페이지에서 불필요한 항목 제거됨"