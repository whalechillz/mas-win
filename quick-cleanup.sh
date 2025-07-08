#!/bin/bash

# 프로젝트 정리 스크립트
# 실행: bash quick-cleanup.sh

echo "🧹 WIN.MASGOLF.CO.KR 프로젝트 정리 시작..."

# 백업 디렉토리 생성
BACKUP_DIR="backup-scripts-2025-01"

# Shell 스크립트 백업
echo "📦 Shell 스크립트 백업 중..."
find . -maxdepth 1 -name "*.sh" -type f \
  ! -name "deploy-commands.sh" \
  ! -name "setup-vercel.sh" \
  ! -name "test-local.sh" \
  ! -name "cleanup-scripts.sh" \
  ! -name "quick-cleanup.sh" \
  -exec mv {} "$BACKUP_DIR/shell-scripts/" \; 2>/dev/null

# SQL 스크립트 백업 (database 폴더 제외)
echo "📦 SQL 스크립트 백업 중..."
find . -maxdepth 1 -name "*.sql" -type f \
  -exec mv {} "$BACKUP_DIR/sql-scripts/" \; 2>/dev/null

# Python 스크립트 백업
echo "📦 Python 스크립트 백업 중..."
find . -maxdepth 1 -name "*.py" -type f \
  -exec mv {} "$BACKUP_DIR/python-scripts/" \; 2>/dev/null

# 기타 임시 파일 백업
echo "📦 기타 파일 백업 중..."
[ -f "emergency-fix.js" ] && mv "emergency-fix.js" "$BACKUP_DIR/"
[ -f "admin-table-update-guide.txt" ] && mv "admin-table-update-guide.txt" "$BACKUP_DIR/"
[ -f "safe-admin-fix.txt" ] && mv "safe-admin-fix.txt" "$BACKUP_DIR/"
[ -f "middleware.ts.backup" ] && mv "middleware.ts.backup" "$BACKUP_DIR/"
[ -f "vercel.json.backup" ] && mv "vercel.json.backup" "$BACKUP_DIR/"

# 백업 파일 삭제
rm -f *.backup
rm -f *.backup-*

echo ""
echo "✅ 정리 완료!"
echo ""
echo "📊 남은 파일:"
ls -la | grep -E "\.sh$|\.sql$|\.py$" | wc -l
echo ""
echo "💾 백업 위치: ./$BACKUP_DIR/"
echo ""
echo "📌 유지된 중요 파일:"
echo "  - deploy-commands.sh"
echo "  - setup-vercel.sh"
echo "  - test-local.sh"
echo "  - /database/*.sql (DB 스키마)"
echo "  - /scripts/* (유틸리티)"
