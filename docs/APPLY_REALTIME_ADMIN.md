# 🚀 MASGOLF Admin 실시간 데이터 연동 적용 가이드

## 📋 현재 상태

✅ **완료된 작업**
- Supabase에 캠페인 테이블 생성 완료
- 실시간 데이터 연동 admin 페이지 (`admin-realtime.tsx`) 작성 완료
- 캠페인 생성/수정 모달 컴포넌트 완성
- 캠페인 성과 대시보드 컴포넌트 완성
- API 엔드포인트 구현 완료

## 🛠️ 적용 방법

### 방법 1: 자동 스크립트 사용 (추천)

```bash
# 1. 프로젝트 디렉토리로 이동
cd /Users/m2/MASLABS/win.masgolf.co.kr

# 2. 스크립트 실행 권한 부여
chmod +x scripts/apply-realtime-admin.sh

# 3. 스크립트 실행
./scripts/apply-realtime-admin.sh

# 4. 로컬 테스트
npm run dev
```

### 방법 2: 수동 적용

```bash
# 1. 기존 파일 백업
cp pages/admin.tsx pages/admin-backup-$(date +%Y%m%d).tsx

# 2. 새 버전 적용
cp pages/admin-realtime.tsx pages/admin.tsx

# 3. 의존성 확인
npm install

# 4. 로컬 테스트
npm run dev
```

## 🧪 테스트 체크리스트

### 1. 로컬에서 확인할 내용
- [ ] 관리자 로그인 정상 작동
- [ ] 캠페인 데이터가 Supabase에서 로드됨
- [ ] 실시간 메트릭이 정확히 표시됨
- [ ] 캠페인 생성 모달이 열림
- [ ] 예약/문의 데이터가 실시간으로 업데이트됨

### 2. 새로운 기능들
- [ ] **실시간 대시보드**: 메트릭이 5초마다 업데이트
- [ ] **전환 깔때기**: 실제 데이터 기반으로 표시
- [ ] **캠페인 관리**: DB에서 직접 캠페인 생성/수정
- [ ] **성과 분석**: ROI, CPA 자동 계산
- [ ] **AI 인사이트**: 캠페인 성과 기반 추천

## 📤 배포

### Vercel 배포

```bash
# 1. 변경사항 커밋
git add .
git commit -m "feat: 실시간 캠페인 데이터 연동 구현"

# 2. 배포
git push

# 3. Vercel에서 자동 배포 확인
# https://vercel.com/dashboard
```

## 🔧 환경변수 확인

`.env.local` 파일에 다음 변수들이 있는지 확인:

```env
NEXT_PUBLIC_SUPABASE_URL=https://yyytjudftvpmcnppaymw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
ADMIN_USERNAME=masgolf
ADMIN_PASSWORD=masgolf2024!
```

## 📊 실시간 데이터 확인

### Supabase Table Editor
1. https://supabase.com/dashboard 접속
2. 프로젝트 선택
3. Table Editor에서 다음 테이블 확인:
   - `campaigns`: 캠페인 정보
   - `campaign_metrics`: 일별 성과 (추후 연동)
   - `campaign_summary`: 전체 요약 뷰

### 실시간 업데이트 테스트
1. Supabase Table Editor에서 캠페인 데이터 수정
2. Admin 페이지에서 자동으로 업데이트되는지 확인

## 🎯 다음 단계

### 1. 추가 기능 구현
- [ ] Google Analytics 연동
- [ ] 일별 성과 자동 수집
- [ ] 이메일 리포트 자동화
- [ ] 예측 분석 고도화

### 2. 성능 최적화
- [ ] 데이터 캐싱 구현
- [ ] 대시보드 로딩 속도 개선
- [ ] 모바일 반응형 최적화

### 3. 보안 강화
- [ ] 관리자 권한 세분화
- [ ] 활동 로그 기록
- [ ] 2단계 인증 추가

## ❓ 문제 해결

### 캠페인 데이터가 안 보일 때
1. Supabase에 캠페인 테이블이 있는지 확인
2. 브라우저 콘솔에서 에러 확인
3. 네트워크 탭에서 API 요청 확인

### 실시간 업데이트가 안 될 때
1. Supabase Realtime이 활성화되어 있는지 확인
2. 브라우저 WebSocket 연결 확인

## 🎉 완료!

이제 MASGOLF Admin은 완전한 실시간 데이터 연동을 지원합니다!
모든 캠페인 데이터가 Supabase와 실시간으로 동기화됩니다.

---

문의사항: dev@masgolf.co.kr
