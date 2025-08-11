#!/bin/bash

# 백업 폴더 통합 스크립트
# 날짜: 2025년 7월 8일

echo "🔄 백업 폴더 통합 시작..."

# 새 백업 폴더
NEW_BACKUP="backup-2025-07"

# 하위 폴더 생성
mkdir -p "$NEW_BACKUP/scripts"
mkdir -p "$NEW_BACKUP/admin"
mkdir -p "$NEW_BACKUP/old-backups"
mkdir -p "$NEW_BACKUP/development-scripts"

# 1. backup-scripts-2025-01 내용 이동
echo "📦 개발 스크립트 백업 이동 중..."
if [ -d "backup-scripts-2025-01" ]; then
    mv backup-scripts-2025-01/* "$NEW_BACKUP/development-scripts/" 2>/dev/null
    rmdir backup-scripts-2025-01
fi

# 2. backup-admin 내용 이동
echo "📦 admin 백업 이동 중..."
if [ -d "backup-admin" ]; then
    mv backup-admin/* "$NEW_BACKUP/admin/" 2>/dev/null
    rmdir backup-admin
fi

# 3. 이전 백업들 통합
echo "📦 이전 백업 통합 중..."
if [ -d "backup-2025-01" ]; then
    mv backup-2025-01 "$NEW_BACKUP/old-backups/backup-2025-01-moved"
fi

if [ -d "backup-remove-2025-01" ]; then
    mv backup-remove-2025-01 "$NEW_BACKUP/old-backups/backup-remove-2025-01-moved"
fi

echo ""
echo "✅ 백업 통합 완료!"
echo "📍 통합된 백업 위치: ./$NEW_BACKUP/"
echo ""
echo "📊 백업 구조:"
echo "  $NEW_BACKUP/"
echo "  ├── development-scripts/ (개발 중 생성된 스크립트)"
echo "  ├── admin/ (관리자 페이지 백업)"
echo "  ├── scripts/ (유틸리티 스크립트)"
echo "  └── old-backups/ (이전 백업들)"
