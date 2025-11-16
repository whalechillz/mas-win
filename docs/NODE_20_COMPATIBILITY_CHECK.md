# Node.js 20.x 호환성 체크리스트

## ✅ 완료된 작업

### 1. vercel.json에 Node.js 버전 명시
- `functions` 섹션에 `"runtime": "nodejs20.x"` 추가
- Vercel이 자동으로 Node.js 20.x를 사용하도록 설정됨

### 2. package.json 확인
- `"engines": { "node": "20.x" }` ✅
- `@types/node": "^20"` ✅

---

## ⚠️ 확인된 사항 (문제 없음)

### 1. node-fetch 사용
**파일 목록:**
- `pages/api/admin/generate-metadata-for-folder.js`
- `pages/api/naver-blog-scraper.js`
- `pages/api/save-images-to-storage.js`
- `pages/api/image-proxy.js`
- `pages/api/admin/scrape-webpage-images.js`
- `pages/api/admin/batch-download-images.js`

**상태:** ✅ 정상 작동
- Node.js 20.x에서도 `node-fetch` v3는 정상 작동
- 향후 마이그레이션 권장: 내장 `fetch` 사용 (Node.js 18+)

**마이그레이션 예시:**
```javascript
// 현재 (정상 작동)
import fetch from 'node-fetch';

// 권장 (향후 마이그레이션)
// Node.js 20.x에서는 내장 fetch 사용 가능
// import 제거하고 직접 fetch 사용
```

---

### 2. Buffer 사용
**파일 목록:** 23개 파일에서 사용 중

**상태:** ✅ 정상 작동
- `Buffer.from()`, `Buffer.alloc()` 사용 중 (권장 방식)
- `new Buffer()` 사용 없음 (deprecated)

---

### 3. process.version 체크
**파일 목록:**
- `pages/api/debug-supabase.js`
- `pages/api/simple-debug.js`
- `pages/api/check-env.js`

**상태:** ✅ 정상 작동
- 디버그 파일에만 사용
- 문제 없음

---

## 📋 호환성 확인 항목

### ✅ ES6 모듈 사용
- 대부분의 API 파일이 `import/export` 사용
- CommonJS (`module.exports`) 사용 최소화

### ✅ Next.js 14.0.3
- Node.js 20.x와 완전 호환

### ✅ 주요 의존성
- `@supabase/supabase-js`: ✅ 호환
- `openai`: ✅ 호환
- `sharp`: ✅ 호환
- `puppeteer`: ✅ 호환
- `formidable`: ✅ 호환

---

## 🔧 Vercel 설정 확인

### vercel.json
```json
{
  "functions": {
    "pages/api/**/*.js": {
      "runtime": "nodejs20.x",  // ✅ 명시됨
      "maxDuration": 50
    }
  }
}
```

### Vercel 대시보드 설정
1. **Settings → Build and Deployment → Node.js Version**
   - Project Settings: **20.x** ✅
   - Production Overrides: **20.x** ✅

---

## 🚀 배포 전 최종 체크리스트

- [x] vercel.json에 `runtime: "nodejs20.x"` 명시
- [x] package.json에 `engines.node: "20.x"` 확인
- [x] Vercel 대시보드에서 Node.js 버전 20.x 확인
- [x] node-fetch 사용 파일 확인 (정상 작동)
- [x] Buffer 사용 확인 (권장 방식 사용)
- [x] ES6 모듈 사용 확인

---

## 💡 향후 개선 사항 (선택사항)

### 1. node-fetch → 내장 fetch 마이그레이션
Node.js 20.x에서는 내장 `fetch`를 사용할 수 있습니다.

**장점:**
- 외부 의존성 제거
- 번들 크기 감소
- 표준 API 사용

**마이그레이션 예시:**
```javascript
// Before
import fetch from 'node-fetch';
const response = await fetch(url);
const buffer = await response.buffer();

// After (Node.js 20.x)
const response = await fetch(url);
const buffer = Buffer.from(await response.arrayBuffer());
```

**주의사항:**
- `response.buffer()` → `response.arrayBuffer()`로 변경 필요
- 일부 API에서 차이가 있을 수 있으므로 테스트 필요

---

## ✅ 결론

**현재 상태:** 모든 항목이 Node.js 20.x와 호환됩니다.

**즉시 조치 필요:** 없음

**향후 개선:** node-fetch → 내장 fetch 마이그레이션 (선택사항)

