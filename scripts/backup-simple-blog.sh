#!/bin/bash
# 간편 블로그 관리 시스템 백업 스크립트
# 실행: ./scripts/backup-simple-blog.sh

# 백업 디렉토리 생성
BACKUP_DIR="backup-simple-blog-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR

# 파일 백업
echo "📦 파일 백업 중..."
cp components/admin/marketing/SimpleBlogManager.tsx $BACKUP_DIR/
cp components/admin/marketing/MarketingDashboard.tsx $BACKUP_DIR/
cp database/simple-blog-schema.sql $BACKUP_DIR/
cp docs/EMPLOYEE_BLOG_GUIDE.md $BACKUP_DIR/
cp docs/SIMPLE_BLOG_SETUP.md $BACKUP_DIR/

# 백업 정보 생성
cat > $BACKUP_DIR/backup-info.txt << EOF
🗂️ 간편 블로그 관리 시스템 백업
📅 백업 일시: $(date)
📦 백업 파일:
- SimpleBlogManager.tsx
- MarketingDashboard.tsx
- simple-blog-schema.sql
- EMPLOYEE_BLOG_GUIDE.md
- SIMPLE_BLOG_SETUP.md

💾 복원 방법:
1. 백업된 파일을 원래 위치로 복사
2. Supabase에서 simple_blog_posts 테이블 재생성
3. 브라우저 새로고침

🔍 변경 내역:
- 간편 블로그 관리 시스템 추가
- 1개 주제 → 3개 다른 앵글 자동 생성
- 네이버 SEO 정책 준수
EOF

echo "✅ 백업 완료: $BACKUP_DIR"