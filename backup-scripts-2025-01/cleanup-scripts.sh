#!/bin/bash

# 백업 스크립트
# 날짜: 2025년 1월

echo "🔄 스크립트 백업 시작..."

# 백업 디렉토리
BACKUP_DIR="/Users/m2/MASLABS/win.masgolf.co.kr/backup-scripts-2025-01"

# 1. Shell 스크립트 백업
echo "📁 Shell 스크립트 백업 중..."
SHELL_SCRIPTS=(
    "add-priority-to-admin.sh"
    "add-quiz-display.sh"
    "apply-admin-fix.sh"
    "apply-beautiful-slack.sh"
    "apply-duplicate-fix.sh"
    "apply-july-funnel-changes-v2.sh"
    "apply-july-funnel-changes.sh"
    "apply-july-funnel-final.sh"
    "apply-phone-fix.sh"
    "apply-q2-fix.sh"
    "apply-simple-slack.sh"
    "apply-slack-design-now.sh"
    "apply-slack-fix-now.sh"
    "banner-update-complete.sh"
    "cleanup-and-deploy.sh"
    "cleanup-site.sh"
    "complete-fix-quiz.sh"
    "complete-quiz-update.sh"
    "deploy-admin-fix.sh"
    "deploy-admin.sh"
    "deploy-detail-view.sh"
    "deploy-july-funnel-final.sh"
    "deploy-july-funnel-updates.sh"
    "deploy-july-funnel-v2.sh"
    "deploy-july-specs-fix.sh"
    "deploy-professional-admin.sh"
    "deploy-slack-notification.sh"
    "deploy-supabase-config.sh"
    "emergency-fix.sh"
    "execute-db-restructure.sh"
    "final-admin-update.sh"
    "final-fix.sh"
    "fix-admin-priority-data.sh"
    "fix-admin-style.sh"
    "fix-all-q2-issues.sh"
    "fix-build-error.sh"
    "fix-column-name.sh"
    "fix-config-location.sh"
    "fix-duplicate-slack.sh"
    "fix-iphone-tel-complete.sh"
    "fix-iphone-tel-links.sh"
    "fix-iphone-tel.sh"
    "fix-july-specs.sh"
    "fix-main-page.sh"
    "fix-q2-issues.sh"
    "fix-quiz-data-error.sh"
    "fix-quiz-display.sh"
    "fix-redirect.sh"
    "fix-slack-complete.sh"
    "fix-time-format.sh"
    "fix-url.sh"
    "force-cache-refresh.sh"
    "make-executable.sh"
    "modify-july-funnel.sh"
    "quick-fix-admin.sh"
    "restore-july-funnel.sh"
    "restore-original-july-funnel.sh"
    "run-final-fix.sh"
    "safe-fix-admin.sh"
    "step6_update_code.sh"
    "test-slack-notification.sh"
    "ui-update-complete.sh"
)

for script in "${SHELL_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        mv "$script" "$BACKUP_DIR/shell-scripts/"
        echo "  ✓ $script"
    fi
done

# 2. SQL 스크립트 백업
echo "📁 SQL 스크립트 백업 중..."
SQL_SCRIPTS=(
    "add-quiz-columns.sql"
    "check-q2-priority.sql"
    "convert-to-korean.sql"
    "database-restructure-plan.sql"
    "fix-database.sql"
    "fix-quiz-data-error.sql"
    "fix-rls-policies.sql"
    "fix-table-structure.sql"
    "personalization_examples.sql"
    "quick-fix-personalization.sql"
    "step1_backup.sql"
    "step2_compatibility.sql"
    "step3_customer_master.sql"
    "step4_migration.sql"
    "step5_views.sql"
    "test_quiz_display.sql"
)

for script in "${SQL_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        mv "$script" "$BACKUP_DIR/sql-scripts/"
        echo "  ✓ $script"
    fi
done

# 3. Python 스크립트 백업
echo "📁 Python 스크립트 백업 중..."
PYTHON_SCRIPTS=(
    "final-complete-fix.py"
    "fix-admin-complete.py"
    "fix-admin-page.py"
    "fix-admin-priority-column.py"
    "fix-iphone-tel-direct.py"
    "fix-q2-korean.py"
    "fix-slack-notify.py"
    "fix-slack-priority.py"
    "fix_iphone_tel.py"
    "update_admin_page.py"
)

for script in "${PYTHON_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        mv "$script" "$BACKUP_DIR/python-scripts/"
        echo "  ✓ $script"
    fi
done

# 4. 임시 파일 정리
echo "📁 기타 임시 파일 정리 중..."
if [ -f "emergency-fix.js" ]; then
    mv "emergency-fix.js" "$BACKUP_DIR/"
    echo "  ✓ emergency-fix.js"
fi

if [ -f "admin-table-update-guide.txt" ]; then
    mv "admin-table-update-guide.txt" "$BACKUP_DIR/"
    echo "  ✓ admin-table-update-guide.txt"
fi

if [ -f "safe-admin-fix.txt" ]; then
    mv "safe-admin-fix.txt" "$BACKUP_DIR/"
    echo "  ✓ safe-admin-fix.txt"
fi

echo ""
echo "✅ 백업 완료!"
echo "📍 백업 위치: $BACKUP_DIR"
echo ""
echo "📊 정리 결과:"
echo "  - Shell 스크립트: ${#SHELL_SCRIPTS[@]}개"
echo "  - SQL 스크립트: ${#SQL_SCRIPTS[@]}개"
echo "  - Python 스크립트: ${#PYTHON_SCRIPTS[@]}개"
echo ""
echo "💡 유지된 파일:"
echo "  - deploy-commands.sh (배포 명령어)"
echo "  - setup-vercel.sh (Vercel 설정)"
echo "  - test-local.sh (로컬 테스트)"
echo "  - /database/*.sql (DB 스키마)"
echo "  - /scripts/* (유틸리티 스크립트)"
