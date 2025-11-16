# API HTTP 405 에러 해결 가이드

## 🔍 문제 상황

배포 후 `generate-paragraph-images-with-prompts` API가 HTTP 405 (Method Not Allowed) 에러를 반환:
- 배경 이미지: HTTP 405
- 프로필 이미지: HTTP 405  
- 피드 이미지: HTTP 405

## 🔎 원인 분석

### 1. Next.js i18n 라우팅 문제
- `x-matched-path: /ko/500` 응답 헤더 확인
- Next.js i18n이 API 경로를 `/ko/api/...`로 매칭하려고 시도
- API 경로가 페이지 경로로 잘못 해석됨
- **로컬에서는 middleware가 먼저 실행되어 정상 작동하지만, 프로덕션에서는 Next.js i18n이 먼저 실행됨**

### 2. vercel.json runtime 설정 오류
- `"runtime": "nodejs20.x"` 형식이 잘못됨
- Vercel 에러: "Function Runtimes must have a valid version"

### 3. 다국어 지원 이슈와의 연관성
- `docs/muziik-link-issue-analysis.md`에서 확인된 동일한 문제
- Next.js i18n이 프로덕션에서 모든 경로에 로케일 프리픽스를 추가하려고 시도
- API 경로도 예외 없이 `/ko/api/...` 또는 `/ja/api/...`로 해석됨

## ✅ 적용된 수정 사항 (최종 해결책)

### 1. next.config.js에 rewrites 추가 (가장 중요)
`beforeFiles`를 사용하여 i18n 라우팅보다 먼저 API 경로를 처리:

```javascript
async rewrites() {
  return {
    beforeFiles: [
      // API 경로는 로케일 프리픽스 없이 직접 접근
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
      // 로케일 프리픽스가 있는 API 경로도 정리
      {
        source: '/:locale(ko|ja)/api/:path*',
        destination: '/api/:path*',
      },
    ],
  };
}
```

**왜 효과적인가:**
- `beforeFiles`는 Next.js i18n 라우팅보다 먼저 실행됨
- API 경로를 명시적으로 보호하여 페이지 경로로 해석되지 않음

### 2. vercel.json에 rewrites 추가
Vercel 레벨에서도 API 경로를 명시적으로 처리:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    },
    {
      "source": "/:locale(ko|ja)/api/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

### 3. middleware.ts 개선
API 경로를 가장 먼저 처리하도록 수정:

```typescript
// 1) API 경로는 가장 먼저 처리 (i18n 라우팅보다 우선)
if (pathname.startsWith('/api') || pathname.startsWith('/ko/api') || pathname.startsWith('/ja/api')) {
  // 로케일 프리픽스가 있으면 제거
  if (pathname.startsWith('/ko/api') || pathname.startsWith('/ja/api')) {
    const cleanPath = pathname.replace(/^\/(ko|ja)\/api/, '/api');
    const url = request.nextUrl.clone();
    url.pathname = cleanPath;
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}
```

### 4. generate-paragraph-images-with-prompts API 수정
- CORS 헤더 추가
- OPTIONS 핸들러 추가 (CORS preflight)

```javascript
export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  // ... 나머지 코드
}
```

## 🧪 테스트 방법

### 1. 로컬 빌드 테스트
```bash
npm run build
```

### 2. 원격 API 테스트
```bash
curl -X POST https://www.masgolf.co.kr/api/generate-paragraph-images-with-prompts \
  -H "Content-Type: application/json" \
  -d '{"prompts":[{"prompt":"test","paragraphIndex":0}]}'
```

### 3. Playwright 원격 점검
```bash
node playwright-remote-kakao-content-test.js
```

## 📋 배포 체크리스트

- [x] vercel.json에서 runtime 필드 제거
- [x] middleware.ts에서 API 경로 로케일 프리픽스 제거 처리
- [x] generate-paragraph-images-with-prompts API에 CORS 헤더 추가
- [x] 로컬 빌드 테스트 성공
- [x] 변경사항 커밋 및 푸시
- [ ] 배포 완료 후 원격 테스트
- [ ] 19일 콘텐츠 생성 테스트

## 🔧 추가 확인 사항

### Vercel 배포 후 확인

1. **배포 로그 확인**
   - Vercel 대시보드 → Deployments → 최신 배포 → Build Logs
   - `generate-paragraph-images-with-prompts.js` 파일이 빌드되었는지 확인

2. **함수 로그 확인**
   - Vercel 대시보드 → Functions
   - `/api/generate-paragraph-images-with-prompts` 함수가 등록되었는지 확인

3. **환경 변수 확인**
   - `FAL_API_KEY`가 설정되어 있는지 확인
   - `NEXT_PUBLIC_SUPABASE_URL` 확인
   - `SUPABASE_SERVICE_ROLE_KEY` 확인

## 💡 참고

- Next.js i18n은 기본적으로 API 경로를 제외해야 하지만, middleware에서 명시적으로 처리하는 것이 안전합니다.
- Vercel의 함수 runtime 설정은 Next.js 프로젝트에서 `package.json`의 `engines.node`를 사용합니다.

