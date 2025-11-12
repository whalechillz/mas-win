# 배포 상태 확인 및 정리

## 현재 상태 (2025-01-XX)

### Git 브랜치 상태
- ✅ **main**: 최신 변경사항 포함 (f29441d)
- ⚠️ **feature/gallery-advanced**: main보다 8개 커밋 뒤처짐
  - feature/gallery-advanced의 마지막 커밋: 7a68da6
  - main의 최신 커밋: f29441d

### 로컬 → 원격 동기화
- ✅ **main**: 푸시 완료 (f29441d)
- ⚠️ **feature/gallery-advanced**: 동기화 필요

## Vercel 배포 정리 방법

### ✅ Vercel 대시보드에서 쉽게 삭제 가능

1. **접속**: https://vercel.com/taksoo-kims-projects/mas-win/deployments

2. **브랜치 필터 선택**
   - "All Branches..." 드롭다운 클릭
   - 삭제할 브랜치 선택 (예: `fix/tiptap-keyboard-input-and-...`)

3. **배포 삭제**
   - 각 배포 항목의 `...` 메뉴 클릭
   - "Delete" 선택
   - 확인

4. **모든 배포 삭제 후**
   - 브랜치 필터 목록에서 해당 브랜치가 사라집니다

### 삭제해도 안전한 배포
- ✅ Preview 배포 (모두 안전)
- ✅ 삭제된 브랜치의 배포 (fix/tiptap 등)
- ✅ 오래된 Production 배포 (최신 것만 유지)

## feature/gallery-advanced 브랜치 배포 옵션

### 옵션 1: feature/gallery-advanced를 main과 동기화 후 배포
```bash
git checkout feature/gallery-advanced
git merge main  # 또는 git rebase main
git push origin feature/gallery-advanced
```

### 옵션 2: feature/gallery-advanced에 현재 main 변경사항만 적용
```bash
git checkout feature/gallery-advanced
git cherry-pick f29441d  # 최신 커밋만 적용
git push origin feature/gallery-advanced
```

### 옵션 3: feature/gallery-advanced를 main으로 완전히 동기화
```bash
git checkout feature/gallery-advanced
git reset --hard main
git push origin feature/gallery-advanced --force
```

## 추천 작업 순서

1. ✅ **main 푸시 완료** (f29441d)
2. 🔄 **Vercel 대시보드에서 불필요한 배포 삭제**
3. 🔄 **feature/gallery-advanced 브랜치 동기화 결정**
4. 🔄 **필요시 feature/gallery-advanced에 배포**

