# 8월 퍼널 페이지 준비 상태 최종 보고

## 🚨 주의사항 및 문제 예방

### 1. **현재 7월 퍼널 상태** ✅
- `/pages/funnel-2025-07.tsx` 정상 작동 중
- 이미지 경로: `/assets/campaigns/2025-07/`
- HTML 파일: `/public/versions/funnel-2025-07-complete.html`

### 2. **8월 퍼널 준비 상태** ✅
- **페이지 파일**: `/pages/funnel-2025-08.tsx`
- **HTML 파일**: `/public/versions/funnel-2025-08-vacation.html`
- **이미지 경로**: `/assets/campaigns/2025-08/` (통일된 구조)
  - `chanel-perfume.jpg`
  - `waterproof-pouch.jpg`

### 3. **이미지 에셋 구조 표준화** ✅
기존 퍼널들의 이미지 구조:
```
/public/assets/campaigns/
├── 2025-05/  (5월 퍼널)
├── 2025-06/  (6월 퍼널)
├── 2025-07/  (7월 퍼널 - 현재 운영중)
└── 2025-08/  (8월 퍼널 - 새로 생성)
```

### 4. **불필요한 sh 파일 정리 필요** 🧹
루트에 있는 sh 파일들:
- deploy-*.sh (약 20개)
- fix-*.sh (약 15개)
- setup-*.sh (약 10개)
- 기타 스크립트들

**정리 방법**:
```bash
chmod +x cleanup-root-scripts.sh
./cleanup-root-scripts.sh
```

### 5. **배포 방법** 🚀
```bash
# 별도 배포 스크립트 불필요!
git add .
git commit -m "feat: 8월 휴가철 퍼널 페이지 추가"
git push

# Vercel이 자동으로 배포합니다
```

### 6. **발생 가능한 문제 및 해결책** ⚠️

#### 문제 1: 이미지가 안 보임
- **원인**: 잘못된 경로 또는 파일명
- **해결**: `/assets/campaigns/2025-08/` 경로 확인

#### 문제 2: 7월 퍼널이 갑자기 안 됨
- **원인**: 파일 이동 중 실수
- **해결**: 7월 관련 파일은 절대 건드리지 않음

#### 문제 3: 빌드 에러
- **원인**: TypeScript 타입 에러
- **해결**: `npm run build`로 사전 확인

### 7. **최종 체크리스트** ✔️
- [x] 8월 퍼널 페이지 파일 생성
- [x] 이미지 경로 표준화 (campaigns 구조)
- [x] HTML 파일 이미지 경로 수정
- [ ] 루트 sh 파일 정리
- [ ] Git 커밋 및 푸시
- [ ] Vercel 배포 확인
- [ ] 모바일 테스트

### 8. **다음 작업**
1. 정리 스크립트 실행: `./cleanup-root-scripts.sh`
2. Git 커밋: `git add . && git commit -m "feat: 8월 퍼널 추가 및 프로젝트 정리" && git push`
3. 배포 확인: https://win.masgolf.co.kr/funnel-2025-08

---
작성일: 2025년 7월 27일
