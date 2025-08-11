# 🧹 프로젝트 정리 현황

## 완료된 작업 ✅

### 1. 디렉토리 구조 생성
- ✅ `/docs/setup/` - 설정 가이드
- ✅ `/docs/troubleshooting/` - 문제 해결
- ✅ `/tests/` - 테스트 파일
- ✅ `/backup-scripts-2025-01/` - 백업 스크립트

### 2. 문서 이동 완료
- ✅ `GOOGLE_ADS_CONVERSION_SETUP.md` → `/docs/setup/`
- ✅ `test-booking.html` → `/tests/`
- ✅ 사이트 구조 문서 작성 → `/docs/SITE_STRUCTURE.md`

### 3. 문서 업데이트
- ✅ `MAIN_GUIDE.md` - 새 구조 반영
- ✅ `PROJECT_CLEANUP_PLAN_V2.md` - 정리 계획 작성

## 남은 작업 📋

### 1. Setup 문서 이동 (4개)
```bash
mv SLACK_SETUP_GUIDE.md docs/setup/
mv SLACK_SIMPLE_DESIGN.md docs/setup/
mv SUPABASE_SETUP_GUIDE.md docs/setup/
mv VERCEL_ENV_SETUP.md docs/setup/
```

### 2. Troubleshooting 문서 이동 (5개)
```bash
mv IFRAME_TEL_FIX_GUIDE.md docs/troubleshooting/
mv KOREAN_DATA_FIX.md docs/troubleshooting/
mv SLACK_TROUBLESHOOTING.md docs/troubleshooting/
mv STATIC_FILE_CACHE_FIX.md docs/troubleshooting/
mv TROUBLESHOOTING.md docs/troubleshooting/
```

### 3. 임시 파일 백업 (5개)
```bash
mv CLEANUP_GUIDE.md backup-scripts-2025-01/
mv CLEANUP_PLAN.md backup-scripts-2025-01/
mv cleanup-scripts.sh backup-scripts-2025-01/
mv quick-cleanup.sh backup-scripts-2025-01/
mv iframe-parent-handler.tsx backup-scripts-2025-01/
```

## 자동 정리 실행

모든 파일을 한 번에 정리하려면:
```bash
bash organize-project.sh
```

## 정리 후 예상 구조

### 루트 디렉토리 (깔끔!) 
- **설정 파일**: 9개 (.json, .js, .ts, .env)
- **중요 문서**: 4개 (README, MAIN_GUIDE, CHANGE_LOG, DEPLOY_CHECKLIST)
- **핵심 스크립트**: 3개 (deploy, setup, test)
- **디렉토리**: 10개 (pages, public, components 등)

### 전체 파일 수 변화
- **정리 전**: 루트에 36개 파일
- **정리 후**: 루트에 16개 파일 (56% 감소!)

## 다음 단계

1. `organize-project.sh` 실행
2. 정리 확인
3. Git commit
4. 백업 폴더 검토 후 삭제

진행하시겠습니까? 🚀
