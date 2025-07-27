#!/bin/bash

# 루트에 있는 sh 파일들을 백업 폴더로 이동

BACKUP_DIR="/Users/m2/MASLABS/win.masgolf.co.kr/backup-2025-07/shell-scripts-root"

# 배포 관련 파일들
mv deploy-*.sh $BACKUP_DIR/ 2>/dev/null
mv fix-*.sh $BACKUP_DIR/ 2>/dev/null
mv setup-*.sh $BACKUP_DIR/ 2>/dev/null
mv emergency-*.sh $BACKUP_DIR/ 2>/dev/null
mv complete-*.sh $BACKUP_DIR/ 2>/dev/null
mv restore-*.sh $BACKUP_DIR/ 2>/dev/null
mv quick-*.sh $BACKUP_DIR/ 2>/dev/null
mv test-*.sh $BACKUP_DIR/ 2>/dev/null

# 기타 스크립트들
mv backup-marketing.sh $BACKUP_DIR/ 2>/dev/null
mv current-status-check.sh $BACKUP_DIR/ 2>/dev/null
mv diagnose-multichannel.sh $BACKUP_DIR/ 2>/dev/null
mv env-checklist.sh $BACKUP_DIR/ 2>/dev/null
mv ga4-*.sh $BACKUP_DIR/ 2>/dev/null
mv get-service-role-key.sh $BACKUP_DIR/ 2>/dev/null
mv insert-monthly-themes-*.sh $BACKUP_DIR/ 2>/dev/null
mv make-*.sh $BACKUP_DIR/ 2>/dev/null
mv next-steps-*.sh $BACKUP_DIR/ 2>/dev/null
mv parse-service-account.sh $BACKUP_DIR/ 2>/dev/null
mv security-alert.sh $BACKUP_DIR/ 2>/dev/null
mv service-account-creation-guide.sh $BACKUP_DIR/ 2>/dev/null
mv update-july-*.sh $BACKUP_DIR/ 2>/dev/null

echo "✅ 루트 디렉토리 정리 완료!"
echo "📁 백업 위치: $BACKUP_DIR"
