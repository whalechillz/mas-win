# 로컬 개발 환경 테스트 가이드

## 📋 목적

로컬 개발 환경에서 **블로그 이미지와 갤러리 이미지를 정리**하는 기능을 테스트할 수 있도록 설정합니다.

## ⚠️ 중요 사항

- 이 설정은 **로컬 개발 환경(localhost)에서만** 작동합니다
- 프로덕션 배포 시 자동으로 무시됩니다 (안전 보호)
- 이유: `NODE_ENV === 'development'` 및 `hostname.includes('localhost')` 체크

## 🚀 설정 방법

### 1. 환경 변수 설정

`.env.local` 파일에 다음 추가:

```bash
ALLOW_LOCAL_API_TEST=true
```

### 2. 서버 재시작

```bash
npm run dev
```

### 3. 테스트 실행

```bash
# 로컬 서버 자동 시작 + 테스트
bash test-local-playwright.sh

# 또는 직접 테스트
node playwright-blog-image-check-local.js
```

## 🔒 안전 보장

### 프로덕션에서 작동하지 않는 이유

1. **환경 변수 체크**: `NODE_ENV === 'development'`
2. **호스트 체크**: `hostname.includes('localhost')`
3. **명시적 허용**: `ALLOW_LOCAL_API_TEST === 'true'`

세 가지 조건을 **모두 만족**해야만 작동합니다.

### 미들웨어 코드 (참고)

```typescript
// middleware.ts
const isLocal = hostname.includes('localhost') || hostname.includes('127.0.0.1');
const isDev = process.env.NODE_ENV === 'development';
const allowLocalTest = process.env.ALLOW_LOCAL_API_TEST === 'true';

// 로컬 테스트는 세 조건 모두 만족 시에만 허용
if (pathname.startsWith('/api') && isLocal && isDev && allowLocalTest) {
  // 로컬 개발 환경에서 API 테스트 허용
}
```

## 📝 테스트 항목

### 블로그 이미지 정리

1. **이미지 정렬**: 블로그 글별로 이미지를 `originals/blog/YYYY-MM/` 폴더로 정렬
2. **메타 동기화**: 블로그 이미지의 메타데이터를 자동 생성/동기화
3. **중복 제거**: 중복 이미지 감지 및 제거

### 갤러리 이미지 정리

1. **전체 이미지 조회**: Storage의 모든 이미지 조회
2. **메타데이터 검증**: 메타데이터 품질 점수 확인
3. **누락 메타데이터**: AI로 자동 생성

## 🧪 테스트 스크립트

### 자동 시작 스크립트

```bash
bash test-local-playwright.sh
```

이 스크립트는:
1. 로컬 서버가 실행 중인지 확인
2. 실행 중이 아니면 자동 시작
3. Playwright 테스트 실행
4. 테스트 완료 후 서버 종료 여부 확인

### 직접 테스트

```bash
# 로컬 서버 수동 시작
npm run dev

# 다른 터미널에서 테스트 실행
node playwright-blog-image-check-local.js
```

## 🔄 롤백 방법

문제가 발생하면 백업 파일로 복원:

```bash
# 백업 파일 확인
ls -la middleware.ts.backup-*

# 복원
cp middleware.ts.backup-YYYYMMDD_HHMMSS middleware.ts
```

## 📚 관련 문서

- [이미지 갤러리 관리 가이드](./image-gallery-management.md)
- [블로그 이미지 정리 가이드](./blog-image-organization.md)
- [메타데이터 동기화 가이드](./metadata-sync.md)

## ⚠️ 주의사항

1. **프로덕션 배포 전 확인**: `.env.local`은 Git에 커밋되지 않지만, 실수로 `.env`에 추가하지 않도록 주의
2. **환경 변수 명확히**: `ALLOW_LOCAL_API_TEST`는 로컬 전용임을 명확히 인지
3. **테스트 후 정리**: 테스트 완료 후 필요시 환경 변수 제거 가능

---

**최종 업데이트**: 2025-01-XX  
**버전**: 1.0

