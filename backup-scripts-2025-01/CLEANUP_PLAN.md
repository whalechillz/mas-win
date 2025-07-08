# 프로젝트 정리 계획서

## 현재 상황
7월 퍼널 개발이 완료되어 개발 과정에서 생성된 많은 임시 스크립트들이 프로젝트 루트에 산재해 있습니다.

## 정리 대상 파일

### 1. 삭제 대상 (백업 후)
- **수정/패치 스크립트**: 65개의 .sh 파일
- **마이그레이션 SQL**: 16개의 .sql 파일  
- **Python 수정 스크립트**: 10개의 .py 파일

### 2. 유지할 파일
```
/
├── deploy-commands.sh      # 배포 명령어
├── setup-vercel.sh        # Vercel 설정
├── test-local.sh          # 로컬 테스트
├── package.json           # 프로젝트 설정
├── README.md              # 프로젝트 설명
├── MAIN_GUIDE.md          # 메인 가이드
├── CHANGE_LOG.md          # 변경 이력
├── DEPLOY_CHECKLIST.md    # 배포 체크리스트
│
├── /pages                 # Next.js 페이지
├── /public               # 정적 파일
├── /components           # React 컴포넌트
├── /styles              # 스타일 파일
├── /lib                 # 라이브러리
├── /database            # DB 스키마 (유지)
├── /docs                # 문서 (유지)
└── /scripts             # 유틸리티 스크립트 (유지)
```

## 백업 구조
```
/backup-scripts-2025-01/
├── CLEANUP_REPORT.md      # 정리 보고서
├── shell-scripts/         # .sh 파일들
├── sql-scripts/          # .sql 파일들
└── python-scripts/       # .py 파일들
```

## 정리 후 효과
1. **프로젝트 루트 정리**: 필수 파일만 남김
2. **가독성 향상**: 중요 파일 쉽게 찾기
3. **유지보수 용이**: 명확한 구조
4. **백업 보존**: 필요시 참조 가능

## 실행 방법
```bash
chmod +x cleanup-scripts.sh
./cleanup-scripts.sh
```

정리를 진행하시겠습니까?
