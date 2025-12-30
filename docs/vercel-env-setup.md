# Vercel 환경 변수 설정 가이드

## 카카오 API 키 Vercel 설정

### 방법 1: Vercel 대시보드에서 설정 (추천)

1. **Vercel 대시보드 접속**
   - https://vercel.com 접속
   - 프로젝트 선택: `win.masgolf.co.kr` 또는 해당 프로젝트

2. **환경 변수 설정**
   - 프로젝트 페이지 → **Settings** → **Environment Variables** 클릭
   - 또는 직접 URL: `https://vercel.com/[프로젝트명]/settings/environment-variables`

3. **카카오 API 키 추가**
   - **Key**: `KAKAO_ADMIN_KEY`
   - **Value**: `63d8d613950dc25327e7005707eaae69`
   - **Environment**: `Production`, `Preview`, `Development` 모두 선택
   - **Add** 버튼 클릭

   - **Key**: `KAKAO_PLUS_FRIEND_ID`
   - **Value**: `_vSVuV`
   - **Environment**: `Production`, `Preview`, `Development` 모두 선택
   - **Add** 버튼 클릭

4. **재배포**
   - 환경 변수 추가 후 자동으로 재배포되거나
   - 수동으로 **Deployments** 탭에서 최신 배포를 **Redeploy** 클릭

---

### 방법 2: Vercel CLI로 설정

```bash
# Vercel CLI 설치 (없는 경우)
npm i -g vercel

# Vercel 로그인
vercel login

# 프로젝트 디렉토리에서
cd /Users/m2/MASLABS/win.masgolf.co.kr

# 환경 변수 추가
vercel env add KAKAO_ADMIN_KEY production
# 프롬프트에서 값 입력: 63d8d613950dc25327e7005707eaae69

vercel env add KAKAO_ADMIN_KEY preview
# 프롬프트에서 값 입력: 63d8d613950dc25327e7005707eaae69

vercel env add KAKAO_ADMIN_KEY development
# 프롬프트에서 값 입력: 63d8d613950dc25327e7005707eaae69

vercel env add KAKAO_PLUS_FRIEND_ID production
# 프롬프트에서 값 입력: _vSVuV

vercel env add KAKAO_PLUS_FRIEND_ID preview
# 프롬프트에서 값 입력: _vSVuV

vercel env add KAKAO_PLUS_FRIEND_ID development
# 프롬프트에서 값 입력: _vSVuV

# 재배포
vercel --prod
```

---

### 방법 3: vercel.json 또는 .vercelignore 사용 (비추천)

환경 변수는 보안상 Vercel 대시보드나 CLI로만 설정하는 것을 권장합니다.

---

## 확인 방법

환경 변수가 제대로 설정되었는지 확인:

1. **Vercel 대시보드에서 확인**
   - Settings → Environment Variables에서 목록 확인

2. **배포 후 로그 확인**
   - Deployments → 최신 배포 → Logs에서 환경 변수 로드 확인

3. **API 테스트**
   - `/api/kakao/sync-message` 엔드포인트 호출하여 카카오 API 연동 테스트

---

## 주의사항

- ✅ 환경 변수는 **Production**, **Preview**, **Development** 모두에 설정하는 것을 권장
- ✅ 환경 변수 추가 후 **반드시 재배포** 필요
- ✅ 환경 변수 값은 **절대 코드에 하드코딩하지 않기**
- ✅ `.env.local` 파일은 `.gitignore`에 포함되어 있어야 함

---

## 현재 설정해야 할 환경 변수

```env
KAKAO_ADMIN_KEY=63d8d613950dc25327e7005707eaae69
KAKAO_PLUS_FRIEND_ID=_vSVuV
```

