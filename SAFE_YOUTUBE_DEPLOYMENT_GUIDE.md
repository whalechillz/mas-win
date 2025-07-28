# 🛡️ 7월 퍼널 유튜브 팝업 - 안전한 배포 가이드

## 🚨 현재 상황

1. **운영 중인 시스템**: 5월, 6월, 7월 퍼널 모두 정상 작동 중
2. **현재 날짜**: 7월 28일 - 7월 캠페인 진행 중
3. **목표**: 기존 시스템에 영향 없이 유튜브 팝업 추가

## 🔍 발견된 이슈

- TSX 파일은 `funnel-2025-07-complete.html`을 찾고 있음
- 실제로는 `funnel-2025-07-supabase.html`만 존재

## ✅ 안전한 접근 방법

### 옵션 1: TSX 레벨에서 추가 (권장) 🌟

**장점**:
- HTML 파일을 수정하지 않아 가장 안전
- React 상태 관리로 깔끔한 구현
- 롤백이 쉬움

**구현 방법**:
1. 새 파일 생성: `funnel-2025-07-youtube.tsx`
2. 기존 파일 백업
3. 점진적 배포

### 옵션 2: 심볼릭 링크로 파일 연결

```bash
# funnel-2025-07-complete.html이 없는 문제 해결
cd public/versions
ln -s funnel-2025-07-supabase.html funnel-2025-07-complete.html
```

## 📋 단계별 배포 가이드

### 1단계: 백업
```bash
# 현재 상태 백업
cp pages/funnel-2025-07.tsx pages/funnel-2025-07.tsx.backup-20250728
cp public/versions/funnel-2025-07-supabase.html public/versions/backup/funnel-2025-07-supabase-20250728.html
```

### 2단계: 테스트 파일 생성
```bash
# 새 TSX 파일 생성 (funnel-2025-07-youtube.tsx)
cp funnel-2025-07-youtube.tsx pages/funnel-2025-07-test.tsx
```

### 3단계: 로컬 테스트
```bash
# 개발 서버에서 테스트
npm run dev

# 브라우저에서 확인
# http://localhost:3000/funnel-2025-07-test
```

### 4단계: 안전한 배포
```bash
# 1. 먼저 테스트 URL로 배포
git add pages/funnel-2025-07-test.tsx
git commit -m "Add YouTube popup test page"
git push

# 2. Vercel에서 테스트 URL 확인
# https://win.masgolf.co.kr/funnel-2025-07-test

# 3. 문제 없으면 실제 파일 교체
mv pages/funnel-2025-07.tsx pages/funnel-2025-07-old.tsx
mv pages/funnel-2025-07-test.tsx pages/funnel-2025-07.tsx

# 4. 최종 배포
git add .
git commit -m "Deploy YouTube popup to July funnel"
git push
```

## 🔄 롤백 계획

문제 발생시:
```bash
# 즉시 롤백
mv pages/funnel-2025-07-old.tsx pages/funnel-2025-07.tsx
git add .
git commit -m "Rollback YouTube popup"
git push
```

## ⚡ 빠른 수정사항

### iframe src 수정 필요
```typescript
// 현재 (작동 안 함)
src={`/versions/funnel-2025-07-complete.html?v=${timestamp}&ui=updated`}

// 수정 후 (작동함)
src={`/versions/funnel-2025-07-supabase.html?v=${timestamp}&ui=updated`}
```

## 🎯 체크리스트

배포 전 확인:
- [ ] 비디오 ID 설정 확인
- [ ] 백업 파일 생성 완료
- [ ] 로컬 테스트 완료
- [ ] 모바일 반응형 테스트
- [ ] ESC 키 닫기 기능 확인
- [ ] 외부 클릭 닫기 기능 확인

## 📱 모니터링

배포 후:
1. 실시간 트래픽 모니터링
2. 에러 로그 확인
3. 사용자 피드백 수집
4. 30분간 집중 모니터링

## 💡 추가 팁

- **A/B 테스트**: 일부 사용자에게만 먼저 노출
- **시간대 고려**: 트래픽이 적은 시간에 배포
- **캐시 무효화**: Vercel 대시보드에서 캐시 클리어

---

안전이 최우선! 단계별로 신중하게 진행하세요. 🛡️