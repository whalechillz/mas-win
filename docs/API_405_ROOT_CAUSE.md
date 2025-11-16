# API 405 에러 근본 원인 분석

## 🔍 진단 결과

### 실제 응답 헤더
```
x-matched-path: /ko/500
x-vercel-id: icn1::bzrft-1763268802260-f923a0ca1038
x-vercel-cache: BYPASS
```

### 문제 확인
1. **모든 API 경로가 `/ko/500` 또는 `/ja/500`으로 매칭됨**
   - `/api/generate-paragraph-images-with-prompts` → `/ko/500`
   - `/ko/api/generate-paragraph-images-with-prompts` → `/ko/500`
   - `/ja/api/generate-paragraph-images-with-prompts` → `/ja/500`

2. **POST 요청도 HTTP 405 에러 발생**
   - 실제 API 호출 시 405 에러

3. **beforeFiles rewrites가 작동하지 않음**
   - `next.config.js`의 `beforeFiles` rewrites가 적용되지 않음

## 🔎 근본 원인

**Next.js i18n이 프로덕션 빌드에서 API 경로를 페이지 경로로 해석하고 있습니다.**

### 왜 rewrites가 작동하지 않는가?

1. **빌드 타임 vs 런타임**
   - Next.js i18n은 **빌드 타임**에 라우트를 결정합니다
   - `beforeFiles` rewrites는 **런타임**에 작동합니다
   - i18n이 먼저 라우트를 결정하면 rewrites가 무시됩니다

2. **Next.js 14의 i18n 동작**
   - i18n이 활성화되면 모든 경로에 로케일 프리픽스를 추가하려고 시도
   - API 경로도 예외 없이 `/ko/api/...` 또는 `/ja/api/...`로 해석
   - 해당 경로가 존재하지 않으면 500 페이지로 폴백

## 💡 해결 방안

### 방안 1: middleware에서 API 경로 강제 처리 (시도 중)
- middleware matcher에 `/ko/api/:path*`, `/ja/api/:path*` 추가
- API 경로를 가장 먼저 처리하도록 순서 조정

### 방안 2: i18n을 조건부로 비활성화
- API 경로에 대해서만 i18n을 완전히 우회
- middleware에서 API 경로를 감지하면 i18n 처리 건너뛰기

### 방안 3: API 경로를 다른 도메인으로 분리
- `api.masgolf.co.kr` 같은 별도 도메인 사용
- i18n 영향 완전 차단

### 방안 4: Next.js 13 App Router로 마이그레이션
- App Router는 i18n과 API 라우트를 더 명확하게 분리

### 방안 5: 커스텀 서버 사용
- Express.js 등으로 API 라우트를 완전히 분리

## 📋 현재 적용 중인 수정

1. ✅ middleware matcher에 로케일 프리픽스 API 경로 추가
2. ✅ middleware에서 API 경로를 가장 먼저 처리
3. ⏳ 배포 후 테스트 필요

## 🧪 테스트 방법

```bash
# 진단 스크립트 실행
node scripts/diagnose-api-405.js
```

또는 curl로 직접 테스트:
```bash
curl -X POST https://www.masgolf.co.kr/api/generate-paragraph-images-with-prompts \
  -H "Content-Type: application/json" \
  -v
```

응답 헤더에서 `x-matched-path` 확인:
- 정상: `x-matched-path`가 없거나 `/api/...`로 시작
- 문제: `x-matched-path: /ko/500` 또는 `/ja/500`

