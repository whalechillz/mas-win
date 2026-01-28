# 서버 사이드 로그 확인 방법

## 📋 개요

Next.js API 라우트(`pages/api/**/*.js`)에서 `console.log`, `console.error`로 출력한 로그는 **서버 터미널**에 표시됩니다.

## 🔍 로컬 개발 환경 (localhost:3000)

### 방법 1: 개발 서버 터미널 확인

1. **Next.js 개발 서버가 실행 중인 터미널 창 확인**
   ```bash
   # 서버를 실행한 터미널에서 로그 확인
   npm run dev
   ```

2. **로그 출력 위치**
   - API 요청이 들어올 때마다 서버 터미널에 로그가 출력됩니다
   - 예: `🔍 [검색 디버깅] 서버 사이드 검색 시작: 김진권`

### 방법 2: 별도 터미널에서 로그 모니터링

```bash
# 프로세스 확인
ps aux | grep "next dev"

# 로그 파일로 리다이렉트 (선택사항)
npm run dev > server.log 2>&1

# 실시간 로그 확인
tail -f server.log
```

## 🌐 프로덕션 환경 (Vercel)

### Vercel 대시보드에서 확인

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard
   - 프로젝트 선택

2. **Functions 탭**
   - 프로젝트 → Functions 탭
   - `/api/admin/all-images` 함수 선택
   - 로그 확인

3. **실시간 로그 스트리밍**
   ```bash
   # Vercel CLI 사용
   vercel logs --follow
   ```

### Vercel CLI로 로그 확인

```bash
# 최근 로그 확인
vercel logs

# 실시간 로그 스트리밍
vercel logs --follow

# 특정 함수 로그만 확인
vercel logs --function=api/admin/all-images
```

## 🔍 검색 디버깅 로그 확인

### 현재 추가된 디버깅 로그

`pages/api/admin/all-images.js`에 다음 로그가 추가되어 있습니다:

1. **검색 시작 로그**
   ```javascript
   console.log('🔍 [검색 디버깅] 서버 사이드 검색 시작:', searchTerm);
   ```

2. **RPC 함수 결과**
   ```javascript
   console.log('🔍 [검색 디버깅] RPC 함수 결과:', {...});
   ```

3. **TSVECTOR 검색 결과**
   ```javascript
   console.log('🔍 [검색 디버깅] TSVECTOR 검색 결과:', {...});
   ```

4. **ILIKE 검색 결과**
   ```javascript
   console.log('🔍 [검색 디버깅] ILIKE 검색 결과:', {...});
   ```

### 로그 확인 예시

검색 시 서버 터미널에 다음과 같은 로그가 출력됩니다:

```
🔍 [검색 디버깅] 서버 사이드 검색 시작: 김진권
🔍 [검색 디버깅] RPC 함수 결과: { hasData: false, dataCount: 0, error: 'function not found' }
⚠️ [검색 디버깅] RPC 함수 사용 불가, 직접 쿼리로 폴백: function not found
🔍 [검색 디버깅] TSVECTOR 검색 패턴: search_vector @@ plainto_tsquery('simple', '김진권')...
🔍 [검색 디버깅] TSVECTOR 검색 결과: { hasData: false, dataCount: 0, error: null }
🔍 [검색 디버깅] ILIKE 검색 패턴: alt_text.ilike.%김진권%...
🔍 [검색 디버깅] ILIKE 검색 결과: { hasData: true, dataCount: 1, ... }
```

## ⚠️ 504 Gateway Timeout 에러 대응

이미지에서 `504 Gateway Timeout` 에러가 발생하는 경우:

### 원인
- API 요청 처리 시간이 너무 오래 걸림 (60초 초과)
- `vercel.json`에서 설정한 `maxDuration` 초과

### 해결 방법

1. **타임아웃 설정 확인**
   ```json
   // vercel.json
   {
     "functions": {
       "pages/api/admin/all-images.js": {
         "maxDuration": 60  // 초 단위
       }
     }
   }
   ```

2. **서버 로그에서 병목 지점 확인**
   - 각 단계별 소요 시간 로그 추가
   - 느린 쿼리 확인

3. **성능 최적화**
   - 검색 결과 제한 (이미 적용됨: 200개)
   - 타임아웃 추가 (이미 적용됨: 10초)
   - 캐싱 활용

## 📝 로그 필터링

### 특정 검색어만 확인

```bash
# 터미널에서 실시간 필터링
npm run dev | grep "검색 디버깅"
```

### 로그 파일로 저장

```bash
# 로그를 파일로 저장
npm run dev 2>&1 | tee server-logs-$(date +%Y%m%d-%H%M%S).log
```

## 🎯 빠른 확인 방법

1. **개발 서버 터미널 열기**
   - `npm run dev` 실행한 터미널 확인

2. **브라우저에서 검색 실행**
   - "김진권" 검색

3. **서버 터미널에서 로그 확인**
   - `🔍 [검색 디버깅]`으로 시작하는 로그 확인

## 💡 팁

- 서버 로그는 **실시간**으로 출력됩니다
- 브라우저 콘솔과 달리 **서버 터미널**에만 표시됩니다
- 프로덕션에서는 Vercel 대시보드에서 확인해야 합니다
