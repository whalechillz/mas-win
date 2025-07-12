#!/bin/bash
# 백업 생성 스크립트

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/Users/m2/MASLABS/win.masgolf.co.kr/backup-2025-07"

echo "🔐 관리자 페이지 백업 시작..."

# 백업 디렉토리 생성
mkdir -p "$BACKUP_DIR/admin-backup-$TIMESTAMP"

# admin.tsx 백업
cp /Users/m2/MASLABS/win.masgolf.co.kr/pages/admin.tsx "$BACKUP_DIR/admin-backup-$TIMESTAMP/admin.tsx"

# components/admin 백업
cp -r /Users/m2/MASLABS/win.masgolf.co.kr/components/admin "$BACKUP_DIR/admin-backup-$TIMESTAMP/components-admin"

echo "✅ 백업 완료: $BACKUP_DIR/admin-backup-$TIMESTAMP"
echo "📁 백업된 파일:"
echo "  - admin.tsx"
echo "  - components/admin/"
