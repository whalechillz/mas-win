# 🧹 프로젝트 정리 안내

## 현재 상황
- **총 91개**의 임시 스크립트 파일 발견
- 7월 퍼널 개발 과정에서 생성된 수정/패치 파일들
- 프로젝트 루트가 복잡해져 관리 어려움

## 정리 방법

### 옵션 1: 자동 정리 (권장)
```bash
bash quick-cleanup.sh
```

### 옵션 2: 수동 정리
백업 디렉토리가 이미 생성되었습니다:
- `/backup-scripts-2025-01/shell-scripts/`
- `/backup-scripts-2025-01/sql-scripts/`
- `/backup-scripts-2025-01/python-scripts/`

### 옵션 3: 선택적 정리
중요도가 낮은 파일부터 단계적으로 정리

## 정리 후 구조
```
win.masgolf.co.kr/
├── 📁 핵심 디렉토리
│   ├── pages/          # Next.js 페이지
│   ├── public/         # 정적 파일
│   ├── components/     # React 컴포넌트
│   ├── database/       # DB 스키마
│   ├── docs/           # 문서
│   └── scripts/        # 유틸리티
│
├── 📄 핵심 파일
│   ├── package.json
│   ├── README.md
│   ├── MAIN_GUIDE.md    # ⭐ 중요
│   ├── CHANGE_LOG.md
│   └── .env.local
│
├── 🔧 유지할 스크립트
│   ├── deploy-commands.sh
│   ├── setup-vercel.sh
│   └── test-local.sh
│
└── 📦 백업 (삭제 예정)
    └── backup-scripts-2025-01/
```

## 정리 효과
1. **가독성**: 중요 파일 쉽게 찾기
2. **유지보수**: 명확한 구조
3. **성능**: Git 성능 개선
4. **협업**: 팀원 이해도 향상

## ⚠️ 주의사항
- 백업 폴더는 확인 후 삭제 가능
- 필요한 스크립트는 `/scripts/` 폴더로 이동
- 정리 전 `git commit` 권장

진행하시겠습니까?
