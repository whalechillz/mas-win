# 스크립트 정리 보고서

## 정리 일자: 2025년 1월

### 정리 이유
7월 퍼널이 완성되어 개발 과정에서 생성된 임시 스크립트들을 백업 및 정리

### 백업된 파일 분류

## 1. Shell 스크립트 (.sh)

### 1.1 배포 관련 (유지 필요)
- `deploy-commands.sh` - 배포 명령어
- `setup-vercel.sh` - Vercel 설정
- `test-local.sh` - 로컬 테스트

### 1.2 수정/패치 스크립트 (백업 후 삭제)
- `add-detail-view.sh`
- `add-priority-to-admin.sh`
- `add-quiz-display.sh`
- `apply-*.sh` 시리즈 (july-funnel, admin-fix, slack 등)
- `fix-*.sh` 시리즈 (iphone-tel, quiz, admin 등)
- `complete-*.sh` 시리즈
- `deploy-*.sh` 시리즈 (개별 기능별 배포)
- `emergency-fix.sh`
- `final-*.sh` 시리즈
- `modify-july-funnel.sh`
- `quick-fix-admin.sh`
- `restore-*.sh` 시리즈
- `safe-fix-admin.sh`
- `ui-update-complete.sh`

### 1.3 데이터베이스 관련 (백업 후 삭제)
- `execute-db-restructure.sh`
- `step6_update_code.sh`

### 1.4 유틸리티 (백업 후 삭제)
- `banner-update-complete.sh`
- `cleanup-*.sh` 시리즈
- `force-cache-refresh.sh`
- `make-executable.sh`
- `run-final-fix.sh`
- `test-slack-notification.sh`

## 2. SQL 스크립트 (.sql)

### 2.1 데이터베이스 스키마 (유지 필요)
- `/database/create-tables.sql`
- `/database/op_manuals_schema.sql`

### 2.2 마이그레이션/수정 스크립트 (백업 후 삭제)
- `add-quiz-columns.sql`
- `check-q2-priority.sql`
- `convert-to-korean.sql`
- `database-restructure-plan.sql`
- `fix-*.sql` 시리즈
- `personalization_examples.sql`
- `quick-fix-personalization.sql`
- `step1_backup.sql` ~ `step5_views.sql`
- `test_quiz_display.sql`

## 3. Python 스크립트 (.py)

### 3.1 수정 스크립트 (백업 후 삭제)
- `final-complete-fix.py`
- `fix-*.py` 시리즈 (admin, iphone-tel, slack 등)
- `update_admin_page.py`

## 권장사항

### 유지해야 할 파일
1. `/MAIN_GUIDE.md` - 메인 가이드
2. `/docs/` 폴더의 모든 문서
3. `/database/` 폴더의 스키마 파일
4. 기본 배포/테스트 스크립트 3개

### 삭제할 파일
- 모든 fix-*, apply-*, complete-* 스크립트
- 모든 마이그레이션 SQL 파일
- 모든 Python 수정 스크립트
- 임시/긴급 수정 스크립트

### 백업 위치
`/backup-scripts-2025-01/` 폴더에 카테고리별로 분류하여 보관
