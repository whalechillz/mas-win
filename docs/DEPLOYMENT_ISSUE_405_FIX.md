# HTTP 405 에러 해결 가이드

## 🔍 문제 상황

배포 후 2025-11-19 날짜 콘텐츠 생성 시 HTTP 405 (Method Not Allowed) 에러 발생:
- 배경 이미지: HTTP 405
- 프로필 이미지: HTTP 405  
- 피드 이미지: HTTP 405

## ✅ 적용된 수정 사항

### 1. vercel.json에 Node.js 20.x 명시
```json
{
  "functions": {
    "pages/api/**/*.js": {
      "runtime": "nodejs20.x",
      "maxDuration": 50
    }
  }
}
```

### 2. generate-paragraph-images-with-prompts API 수정
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

## 🧪 원격 점검 결과

Playwright 테스트 결과:
- ✅ `generate-prompt` API: HTTP 200 (정상)
- ❌ `generate-paragraph-images-with-prompts` API: HTTP 405 (문제)
- ✅ `auto-create-account1` API: HTTP 200 (정상)
- ✅ `auto-create-account2` API: HTTP 200 (정상)

## 🔧 추가 확인 사항

### Vercel 배포 후 확인

1. **빌드 로그 확인**
   - Vercel 대시보드 → Deployments → 최신 배포 → Build Logs
   - `generate-paragraph-images-with-prompts.js` 파일이 빌드되었는지 확인

2. **함수 로그 확인**
   - Vercel 대시보드 → Functions
   - `/api/generate-paragraph-images-with-prompts` 함수가 등록되었는지 확인

3. **환경 변수 확인**
   - `FAL_API_KEY`가 설정되어 있는지 확인
   - `NEXT_PUBLIC_SUPABASE_URL` 확인
   - `SUPABASE_SERVICE_ROLE_KEY` 확인

### 가능한 원인

1. **파일 이름 길이 문제**
   - 파일 이름이 너무 길어서 Vercel에서 인식하지 못할 수 있음
   - 현재: `generate-paragraph-images-with-prompts.js` (44자)

2. **빌드 캐시 문제**
   - Vercel 빌드 캐시가 오래된 버전을 사용할 수 있음
   - 해결: Vercel 대시보드에서 "Clear Build Cache" 후 재배포

3. **라우팅 문제**
   - Next.js 라우팅이 파일을 제대로 인식하지 못할 수 있음
   - 해결: 파일 이름 변경 또는 라우팅 설정 확인

## 🚀 다음 단계

1. **배포 완료 대기**
   - 현재 커밋이 Vercel에 배포될 때까지 대기 (약 2-3분)

2. **재점검 실행**
   ```bash
   node playwright-remote-kakao-content-test.js
   ```

3. **문제 지속 시**
   - Vercel 대시보드에서 빌드 캐시 클리어
   - 수동 재배포 실행
   - 파일 이름을 짧게 변경 고려 (`generate-images.js`)

## 📝 참고

- Playwright 테스트 스크립트: `playwright-remote-kakao-content-test.js`
- Node.js 호환성 문서: `docs/NODE_20_COMPATIBILITY_CHECK.md`

