# 📁 docs 폴더 정비 계획

## 🎯 목적
`docs/` 폴더의 중복 문서 제거 및 체계적인 구조 정리

## 📋 현재 문제점

### 1. 중복 문서
- `docs/MASGOLF-INTEGRATION-MIGRATION-PROJECT-FINAL.md` (삭제됨 ✅)
  - `docs/project_plan.md`와 중복
  - `docs/phases/` 폴더 내용과 중복

### 2. 문서 구조 혼재
- 루트에 많은 문서 파일
- `phases/` 폴더에 Phase별 문서
- `resolved/`, `troubleshooting/` 등 여러 하위 폴더

## 📁 권장 문서 구조

```
docs/
├── README.md                          # 문서 인덱스
├── project_plan.md                    # 메인 프로젝트 계획서
├── folder-pattern-guide.md            # 폴더 패턴 가이드
├── gallery-architecture-principles.md # 갤러리 아키텍처 원칙
│
├── phases/                            # Phase별 문서
│   ├── DOCUMENTATION-INDEX.md        # Phase 문서 인덱스
│   ├── detailed-plans/               # 세부 계획서
│   │   ├── README.md
│   │   ├── phase-8-detailed-plan.md
│   │   └── ...
│   └── completion-reports/            # 완성 결과서
│       ├── README.md
│       ├── phase-1-completion-report.md
│       └── ...
│
├── guides/                            # 가이드 문서
│   ├── admin/                        # 관리자 가이드
│   ├── setup/                        # 설정 가이드
│   └── troubleshooting/              # 문제 해결 가이드
│
├── resolved/                         # 해결된 이슈
│   └── ...
│
└── archive/                          # 아카이브 (오래된 문서)
    └── ...
```

## 🔧 정비 작업

### 1단계: 중복 문서 제거 ✅
- [x] `docs/MASGOLF-INTEGRATION-MIGRATION-PROJECT-FINAL.md` 삭제
  - 내용은 `docs/project_plan.md`에 통합됨

### 2단계: 문서 분류 및 이동 (예정)
- [ ] 가이드 문서 → `docs/guides/` 이동
- [ ] 설정 문서 → `docs/guides/setup/` 이동
- [ ] 관리자 매뉴얼 → `docs/guides/admin/` 이동
- [ ] 문제 해결 문서 → `docs/guides/troubleshooting/` 이동

### 3단계: 문서 인덱스 업데이트 (예정)
- [ ] `docs/README.md` 업데이트
- [ ] 각 하위 폴더 README.md 생성/업데이트

## 📝 문서 관리 원칙

### 1. 단일 소스 원칙
- 각 정보는 한 곳에만 상세히 기록
- 다른 문서에서는 참조 링크만 제공

### 2. 폴더 구조 준수
- Phase 관련: `docs/phases/`
- 가이드: `docs/guides/`
- 해결된 이슈: `docs/resolved/`

### 3. 정기적 검토
- 월 1회 문서 중복 검토
- 분기 1회 문서 구조 정리

## 🔗 관련 문서
- `docs/project_plan.md` - 메인 프로젝트 계획서
- `docs/phases/DOCUMENTATION-INDEX.md` - Phase 문서 인덱스
- `docs/folder-pattern-guide.md` - 폴더 패턴 가이드

