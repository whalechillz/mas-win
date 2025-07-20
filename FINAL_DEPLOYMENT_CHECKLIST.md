# 🚀 통합 마케팅 시스템 최종 배포 체크리스트

## 📝 Pre-Deployment Checklist

### 1. 코드 검증
- [ ] TypeScript 컴파일 에러 없음
- [ ] ESLint 경고 해결
- [ ] 콘솔 로그 제거
- [ ] 개발용 코드 제거
- [ ] API 키 하드코딩 없음

### 2. 환경 변수
- [ ] `.env.local` 파일 완성
- [ ] Vercel 환경 변수 설정
  ```
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  OPENAI_API_KEY
  ANTHROPIC_API_KEY
  ```

### 3. 데이터베이스
- [ ] 모든 테이블 생성 확인
- [ ] 인덱스 생성 확인
- [ ] 초기 데이터 입력 (2년치 테마)
- [ ] 권한 설정 확인

### 4. 파일 구조
- [ ] `/public/campaigns/` 디렉토리 생성
- [ ] `/public/funnel-pages/` 디렉토리 생성
- [ ] 필요한 이미지 파일 업로드

### 5. 테스트
- [ ] 통합 테스트 통과
- [ ] 브라우저 호환성 테스트
- [ ] 모바일 반응형 테스트
- [ ] 성능 테스트 (Lighthouse > 90)

## 🔄 Git 커밋 순서

```bash
# 1. 상태 확인
git status

# 2. 새 파일 추가
git add components/admin/marketing/integrated/
git add pages/api/integrated/
git add database/integrated-marketing-schema.sql
git add tests/integrated-marketing/
git add INTEGRATED_MARKETING_FINAL_REPORT.md
git add PERFORMANCE_OPTIMIZATION_GUIDE.md
git add deploy-integrated-marketing.sh

# 3. 커밋
git commit -m "feat: 통합 마케팅 관리 시스템 구현

- 월별 퍼널 계획 관리 기능
- 퍼널 페이지 빌더 (MCP 연동)
- 구글 애드 UTM 관리
- AI 멀티채널 콘텐츠 생성
- 콘텐츠 검증 시스템
- KPI 대시보드 및 직원 관리
- 전체 워크플로우 통합"

# 4. 푸시
git push origin main
```

## 🚀 Vercel 배포 절차

### 1. 빌드 확인
```bash
npm run build
```

### 2. 로컬 테스트
```bash
npm run start
# http://localhost:3000 에서 확인
```

### 3. Vercel CLI 배포
```bash
# 프리뷰 배포
vercel

# 프로덕션 배포
vercel --prod
```

### 4. 배포 후 확인사항
- [ ] https://win.masgolf.co.kr 접속 확인
- [ ] 어드민 로그인 (/admin)
- [ ] 통합 마케팅 관리 탭 확인
- [ ] 각 기능 작동 테스트
  - [ ] 퍼널 계획 생성
  - [ ] 콘텐츠 생성
  - [ ] KPI 조회

## 📊 모니터링 설정

### 1. Vercel Analytics
- [ ] Analytics 활성화
- [ ] Web Vitals 모니터링

### 2. 에러 추적
- [ ] Sentry 설정 (선택사항)
- [ ] 에러 알림 설정

### 3. 성능 모니터링
- [ ] 일일 Lighthouse 리포트
- [ ] API 응답 시간 모니터링

## 🔧 Post-Deployment

### 1. 백업
```bash
# 데이터베이스 백업
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# 코드 백업
git tag -a v1.0.0 -m "통합 마케팅 시스템 v1.0.0"
git push origin v1.0.0
```

### 2. 문서 업데이트
- [ ] README.md 업데이트
- [ ] API 문서 공유
- [ ] 사용자 가이드 작성

### 3. 팀 공유
- [ ] 배포 완료 공지
- [ ] 접속 정보 공유
- [ ] 피드백 채널 안내

## ⚠️ 롤백 계획

문제 발생 시:
```bash
# 이전 버전으로 롤백
vercel rollback

# 또는 Git 리버트
git revert HEAD
git push origin main
```

## 📞 긴급 연락처
- 개발팀: dev@masgolf.co.kr
- 인프라팀: infra@masgolf.co.kr
- Vercel 지원: support@vercel.com

---

✅ **모든 항목 확인 후 배포 진행**

배포 담당자: ________________  
배포 일시: 2025년 7월 20일  
서명: ________________