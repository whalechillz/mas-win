# Vercel 배포 가이드

## 🚀 배포 후 "Cannot find module" 에러 해결

### 문제 원인
배포 후 `Cannot find module './6859.js'` 같은 에러가 발생하는 이유:
- 빌드 캐시 불일치
- Webpack 청크 파일 손상
- 동적 임포트 문제

---

## ✅ 해결 방법

### 방법 1: Vercel 대시보드에서 빌드 캐시 클리어 (가장 빠름)

1. **Vercel 대시보드 접속**
   - https://vercel.com 접속
   - 프로젝트 선택: `mas-win`

2. **Settings → Build and Deployment 이동**
   - 왼쪽 메뉴에서 "Settings" 클릭
   - "Build and Deployment" 클릭

3. **빌드 캐시 클리어**
   - 페이지 하단 또는 상단에 "Clear Build Cache" 버튼 찾기
   - 클릭하여 캐시 삭제

4. **재배포**
   - "Deployments" 탭으로 이동
   - 최신 배포 옆 "..." 메뉴 클릭
   - "Redeploy" 선택

### 방법 2: Vercel CLI 사용

```bash
# Vercel CLI 설치 (없는 경우)
npm i -g vercel

# 빌드 캐시 클리어 및 재배포
vercel --force
```

### 방법 3: Git 커밋으로 자동 재배포

```bash
# 빈 커밋으로 재배포 트리거
git commit --allow-empty -m "trigger rebuild"
git push origin main
```

---

## ⚙️ Vercel 설정 위치

### 1. Build and Deployment Settings

**위치:** Vercel 대시보드 → 프로젝트 → Settings → Build and Deployment

**주요 설정:**
- **Framework Preset**: Next.js (자동 감지)
- **Build Command**: `npm run build` (기본값)
- **Output Directory**: Next.js default (기본값)
- **Install Command**: `npm install` (기본값)
- **Development Command**: `next dev` (기본값)

**설정 방법:**
1. 각 항목의 "Override" 토글을 켜면 수동 설정 가능
2. 필요시 커스텀 명령어 입력
3. "Save" 버튼 클릭

### 2. Environment Variables

**위치:** Vercel 대시보드 → 프로젝트 → Settings → Environment Variables

**필수 환경 변수 확인:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

### 3. Node.js Version

**위치:** Vercel 대시보드 → 프로젝트 → Settings → Build and Deployment → Node.js Version

**현재 설정:** 확인 필요
**권장:** Node.js 20.x (package.json의 engines와 일치)

---

## 🔧 자동화된 해결 방법

### 배포 전 자동 빌드 테스트

```bash
# 배포 전 스크립트 실행
npm run predeploy

# 또는 직접 실행
./scripts/pre-deploy.sh
```

이 스크립트는:
1. `.next` 폴더 삭제
2. 깨끗한 빌드 실행
3. 빌드 성공 여부 확인
4. 실패 시 배포 중단

---

## 📋 배포 체크리스트

### 배포 전
- [ ] `npm run build` 성공 확인
- [ ] 로컬에서 정상 작동 확인
- [ ] 환경 변수 확인 (Vercel Settings)
- [ ] Node.js 버전 확인 (package.json과 일치)

### 배포 후
- [ ] Vercel 배포 로그 확인
- [ ] 프로덕션 사이트 접속 테스트
- [ ] 에러 발생 시 빌드 캐시 클리어
- [ ] 필요시 재배포

---

## 🐛 문제 발생 시

### "Cannot find module" 에러

1. **즉시 해결:**
   ```bash
   # Vercel 대시보드에서
   Settings → Build and Deployment → Clear Build Cache → Redeploy
   ```

2. **근본 해결:**
   - `next.config.js`의 webpack 설정 확인 (이미 적용됨)
   - 동적 임포트 사용 시 `ssr: false` 확인
   - 빌드 로그에서 누락된 모듈 확인

### 빌드 실패

1. **로컬에서 재현:**
   ```bash
   rm -rf .next
   npm run build
   ```

2. **에러 로그 확인:**
   - Vercel → Deployments → 실패한 배포 → Build Logs

3. **환경 변수 확인:**
   - Vercel → Settings → Environment Variables

---

## 💡 권장 워크플로우

### 일상적인 배포
```bash
# 1. 코드 수정
# 2. 로컬 빌드 테스트
npm run build

# 3. 커밋 및 푸시
git add .
git commit -m "your message"
git push origin main

# 4. Vercel 자동 배포 대기
```

### 문제 발생 시
```bash
# 1. 배포 전 스크립트 실행
npm run predeploy

# 2. 성공하면 배포 진행
git push origin main

# 3. Vercel에서 빌드 캐시 클리어 후 재배포
```

---

## 📞 추가 도움

- **Vercel 문서**: https://vercel.com/docs
- **Next.js 배포**: https://nextjs.org/docs/deployment
- **빌드 에러 해결**: Vercel → Deployments → Build Logs 확인

