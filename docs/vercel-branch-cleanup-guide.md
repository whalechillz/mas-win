# Vercel 브랜치 정리 가이드

## 문제 상황
GitHub에서 브랜치를 삭제했지만 Vercel 대시보드의 브랜치 필터에 여전히 표시되는 경우

## 해결 방법

### 1. 로컬 브랜치 삭제 (완료 ✅)
```bash
git branch -D fix/tiptap-keyboard-input-and-published-date
git remote prune origin
```

### 2. Vercel 대시보드에서 배포 삭제

#### 방법 A: 개별 배포 삭제
1. Vercel 대시보드 접속: https://vercel.com/taksoo-kims-projects/mas-win/deployments
2. 브랜치 필터에서 `fix/tiptap-keyboard-input-and-published-date` 선택
3. 각 배포 항목의 `...` 메뉴 클릭
4. "Delete" 선택
5. 확인

#### 방법 B: 일괄 삭제 (Vercel CLI 사용)
```bash
# 1. Vercel CLI 로그인
vercel login

# 2. 배포 목록 확인
vercel list --json | jq '.[] | select(.meta.gitBranch | contains("tiptap"))'

# 3. 스크립트 실행
./scripts/remove-vercel-branch-deployments.sh fix/tiptap-keyboard-input-and-published-date
```

### 3. 새로운 배포 방지 (완료 ✅)
`vercel.json`에 다음 설정이 추가되었습니다:
```json
{
  "git": {
    "deploymentEnabled": {
      "fix/tiptap-keyboard-input-and-published-date": false
    }
  }
}
```

이 설정으로 해당 브랜치의 새로운 배포가 자동으로 생성되지 않습니다.

### 4. 브랜치 필터에서 사라지게 하기
- 해당 브랜치의 **모든 배포를 삭제**하면 브랜치 필터 목록에서 자동으로 제거됩니다
- Vercel은 과거 배포 기록이 있는 브랜치만 필터 목록에 표시합니다

## 참고사항
- 배포 삭제는 되돌릴 수 없습니다
- Production 배포는 삭제 전에 주의하세요
- Preview 배포는 안전하게 삭제할 수 있습니다

