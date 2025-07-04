#!/bin/bash

echo "🔧 빌드 오류 수정 시작..."

# 1. 중복된 admin 파일들 정리
echo "📁 중복 파일 정리 중..."
mkdir -p backup-remove-2025-01

# admin-new.tsx 삭제 (AdminDashboard 컴포넌트가 없음)
if [ -f "pages/admin-new.tsx" ]; then
    mv pages/admin-new.tsx backup-remove-2025-01/
    echo "✓ admin-new.tsx 백업 완료"
fi

# admin.js 삭제 (admin.tsx와 중복)
if [ -f "pages/admin.js" ]; then
    mv pages/admin.js backup-remove-2025-01/
    echo "✓ admin.js 백업 완료"
fi

# 2. Git 커밋
echo "💾 변경사항 저장 중..."
git add .
git commit -m "fix: 빌드 오류 수정

- 중복된 admin 페이지 제거 (admin.js, admin-new.tsx)
- admin.tsx만 유지
- AdminDashboard 컴포넌트 누락 오류 해결"

# 3. Vercel 배포
echo "🚀 Vercel로 배포 중..."
vercel --prod

echo ""
echo "✅ 빌드 오류 수정 완료!"
echo ""
echo "📋 수정사항:"
echo "- admin.tsx만 남기고 중복 파일 제거"
echo "- AdminDashboard 컴포넌트 참조 오류 해결"
echo ""
echo "백업된 파일들은 backup-remove-2025-01/ 폴더에 있습니다."