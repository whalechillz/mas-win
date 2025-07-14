# 🚨 통합 마케팅 대시보드 에러 해결 가이드

## 문제 진단

### 1. 404 에러 (테이블/뷰 없음)
- blog_contents
- integrated_campaign_dashboard
- campaign_summary
- bookings
- annual_marketing_plans
- content_categories
- 기타 여러 테이블

### 2. 405 에러 (API)
- generate-multichannel-content API가 Vercel에서 작동 안함

### 3. JSON 파싱 에러
- admin 페이지의 JavaScript 에러

## 해결 방법

### 단계 1: Supabase 테이블 생성 (가장 중요! ⭐)

1. [Supabase 대시보드](https://supabase.com) 접속
2. SQL Editor 열기
3. 다음 파일 내용 전체 실행:
   ```
   /database/fix-missing-tables.sql
   ```

### 단계 2: 로컬에서 테스트

```bash
# 서버 재시작
npm run dev
```

브라우저에서 http://localhost:3000/admin 접속하여 확인

### 단계 3: Vercel 재배포

```bash
# Git 푸시로 재배포 트리거
git add .
git commit -m "fix: add missing database tables and views"
git push
```

또는 Vercel 대시보드에서:
1. Deployments 탭
2. 최신 배포의 "..." → "Redeploy"
3. "Use existing Build Cache" 체크 해제
4. Redeploy

### 단계 4: 환경 변수 확인

Vercel Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 임시 해결책

만약 위 방법이 안 되면, admin 페이지 대신:

1. 직접 URL로 이동:
   - `/admin#마케팅` 탭 클릭
   - 또는 http://win.masgolf.co.kr/admin 새로고침

2. 캐시 삭제:
   - Chrome: Ctrl+Shift+Delete
   - "캐시된 이미지 및 파일" 선택
   - 삭제

## 핵심 포인트

**현재 문제는 데이터베이스 구조 불일치입니다.**
- 코드는 여러 테이블을 요청하는데
- Supabase에 해당 테이블이 없음
- SQL 스크립트 실행으로 해결 가능

먼저 **단계 1**을 실행하세요!