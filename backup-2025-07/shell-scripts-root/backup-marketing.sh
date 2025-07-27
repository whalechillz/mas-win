#!/bin/bash
# 백업 스크립트 - 2025-01-14

# 백업 디렉토리 생성
BACKUP_DIR="/Users/m2/MASLABS/win.masgolf.co.kr/backup-2025-01-14"
mkdir -p $BACKUP_DIR

# 마케팅 관련 컴포넌트 백업
echo "마케팅 컴포넌트 백업 중..."
cp -r components/admin/marketing $BACKUP_DIR/marketing-components

# admin.tsx 백업
cp pages/admin.tsx $BACKUP_DIR/admin.tsx.backup

# 데이터베이스 스키마 백업
cp -r database/*.sql $BACKUP_DIR/

echo "백업 완료: $BACKUP_DIR"
