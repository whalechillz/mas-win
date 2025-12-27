# 배포 가이드 (GitHub & Vercel)

## 📋 목차

1. [GitHub 저장소 설정](#1-github-저장소-설정)
2. [Vercel 배포 설정](#2-vercel-배포-설정)
3. [환경 변수 설정](#3-환경-변수-설정)
4. [도메인 연결](#4-도메인-연결)
5. [CI/CD 설정 (선택사항)](#5-cicd-설정-선택사항)

---

## 1. GitHub 저장소 설정

### 1.1 새 저장소 생성

1. GitHub에서 새 저장소 생성
2. 저장소 이름 및 설명 입력
3. Public 또는 Private 선택

### 1.2 로컬 저장소 초기화

```bash
# Git 초기화 (아직 안 했다면)
git init

# 원격 저장소 연결
git remote add origin https://github.com/YOUR_ORG/YOUR_REPO.git

# .gitignore 확인
echo ".env.local" >> .gitignore
echo "node_modules/" >> .gitignore
echo ".next/" >> .gitignore
```

### 1.3 첫 커밋 및 푸시

```bash
git add .
git commit -m "Initial commit: Add auth module"
git branch -M main
git push -u origin main
```

### 1.4 GitHub Actions 설정 (선택사항)

`.github/workflows/ci.yml` 파일 생성:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - run: npm run test  # 테스트가 있다면
```

---

## 2. Vercel 배포 설정

### 2.1 Vercel 프로젝트 생성

1. [Vercel](https://vercel.com)에 로그인
2. "Add New Project" 클릭
3. GitHub 저장소 선택
4. 프로젝트 설정:
   - **Framework Preset**: Next.js (자동 감지)
   - **Root Directory**: `./` (기본값)
   - **Build Command**: `npm run build` (자동)
   - **Output Directory**: `.next` (자동)

### 2.2 환경 변수 설정

Vercel 대시보드 → Project Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**중요**: 
- Production, Preview, Development 환경별로 설정 가능
- `NEXT_PUBLIC_` 접두사 필수

### 2.3 배포

1. "Deploy" 버튼 클릭
2. 빌드 로그 확인
3. 배포 완료 후 URL 확인

---

## 3. 환경 변수 설정

### 3.1 Vercel 대시보드에서 설정

1. 프로젝트 → Settings → Environment Variables
2. 각 환경별로 변수 추가:
   - **Production**: 프로덕션 환경
   - **Preview**: PR/브랜치별 미리보기
   - **Development**: 로컬 개발 환경

### 3.2 환경 변수 확인

배포 후 환경 변수가 올바르게 로드되었는지 확인:

```typescript
// 개발 중 확인
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL);
```

**주의**: `NEXT_PUBLIC_` 접두사가 없는 변수는 클라이언트에서 접근 불가

---

## 4. 도메인 연결

### 4.1 Vercel 도메인 설정

1. 프로젝트 → Settings → Domains
2. 원하는 도메인 입력
3. DNS 설정 안내에 따라 레코드 추가

### 4.2 커스텀 도메인 예시

```
# A 레코드
@  A  76.76.21.21

# CNAME 레코드
www  CNAME  cname.vercel-dns.com
```

### 4.3 SSL 인증서

Vercel이 자동으로 SSL 인증서를 발급하고 관리합니다.

---

## 5. CI/CD 설정 (선택사항)

### 5.1 vercel.json 설정

프로젝트 루트에 `vercel.json` 파일 생성:

```json
{
  "crons": [
    {
      "path": "/api/daily-summary",
      "schedule": "0 9 * * 1-5"
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

### 5.2 자동 배포 설정

Vercel은 기본적으로:
- `main` 브랜치 푸시 시 Production 배포
- 다른 브랜치 푸시 시 Preview 배포
- PR 생성 시 Preview 배포

### 5.3 배포 알림 설정

1. Settings → Notifications
2. Slack, Discord, Email 등 알림 설정

---

## 6. 트러블슈팅

### 문제: 환경 변수가 인식되지 않음

**해결**:
1. Vercel 대시보드에서 환경 변수 재설정
2. `NEXT_PUBLIC_` 접두사 확인
3. 빌드 후 재배포

### 문제: 빌드 실패

**해결**:
1. 빌드 로그 확인
2. 의존성 설치 확인 (`package.json`)
3. TypeScript 오류 확인

### 문제: 로그인 후 리다이렉트 안 됨

**해결**:
1. `router.push()` 경로 확인
2. 미들웨어에서 인증 체크 확인
3. 브라우저 콘솔에서 에러 확인

---

## 7. 체크리스트

배포 전 확인:

- [ ] GitHub 저장소 생성 및 연결
- [ ] `.env.local` 파일이 `.gitignore`에 포함
- [ ] Vercel 프로젝트 생성
- [ ] 환경 변수 설정 (Vercel)
- [ ] 데이터베이스 스키마 생성 (Supabase)
- [ ] 첫 배포 성공 확인
- [ ] 로그인/로그아웃 기능 테스트
- [ ] 도메인 연결 (선택사항)

---

## 8. 추가 리소스

- [Vercel 공식 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Supabase 문서](https://supabase.com/docs)

