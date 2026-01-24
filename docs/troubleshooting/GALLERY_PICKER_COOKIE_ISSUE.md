# 갤러리 선택 모달 쿠키 전달 문제 해결 보고서

## 📋 문제 요약

**증상**: 배포 환경에서 "갤러리에서 선택" 버튼 클릭 시 이미지가 로드되지 않고 401 (Unauthorized) 에러 발생

**발생 환경**: 프로덕션 (https://www.masgolf.co.kr)

**해결 일자**: 2026-01-24

---

## 🔍 원인 분석

### 핵심 원인: 미들웨어에서 프로덕션 환경의 쿠키 이름 불일치

**문제점**:
- 미들웨어가 프로덕션 환경에서 `__Secure-next-auth.session-token` 쿠키를 찾고 있었음
- 실제로 NextAuth가 설정한 쿠키 이름은 `next-auth.session-token`
- `useSecureCookies: true`여도 NextAuth는 쿠키 이름에 `__Secure-` 접두사를 자동으로 추가하지 않음
- 결과적으로 미들웨어에서 세션 쿠키를 찾지 못해 401 에러 발생

**증거**:
```javascript
// middleware.ts (수정 전)
cookieName: process.env.NODE_ENV === 'production' 
  ? '__Secure-next-auth.session-token'  // ❌ 잘못된 이름
  : 'next-auth.session-token'

// pages/api/auth/[...nextauth].ts
cookies: {
  sessionToken: {
    name: `next-auth.session-token`,  // ✅ 실제 쿠키 이름
    options: {
      secure: process.env.NODE_ENV === 'production',
      // ...
    }
  }
}
```

### 보조 원인들

1. **NextAuth 쿠키 도메인 설정**
   - 초기 설정: `domain: '.masgolf.co.kr'` (서브도메인 공유용)
   - 실제 사이트: `www.masgolf.co.kr`
   - 해결: `domain: undefined`로 변경하여 현재 도메인에서만 작동하도록 설정

2. **Playwright request 이벤트의 쿠키 캡처 한계**
   - Playwright의 `request` 이벤트에서 쿠키가 "N/A"로 표시됨
   - 실제로는 브라우저에 쿠키가 있지만, Playwright가 HTTP 헤더를 완전히 캡처하지 못함
   - 이것은 디버깅 도구의 한계일 뿐, 실제 문제는 아님

---

## ✅ 해결 방법

### 1. 미들웨어 쿠키 이름 수정

**변경 전**:
```typescript
// middleware.ts
const token = await getToken({ 
  req: request, 
  secret: process.env.NEXTAUTH_SECRET,
  cookieName: process.env.NODE_ENV === 'production' 
    ? '__Secure-next-auth.session-token'  // ❌
    : 'next-auth.session-token',
});
```

**변경 후**:
```typescript
// middleware.ts
const token = await getToken({ 
  req: request, 
  secret: process.env.NEXTAUTH_SECRET,
  cookieName: 'next-auth.session-token', // ✅ 프로덕션/개발 모두 동일
});
```

**효과**:
- 프로덕션 환경에서도 올바른 쿠키 이름으로 세션 확인
- 401 에러 해결

### 2. NextAuth 쿠키 도메인 설정 수정

**변경 전**:
```typescript
// pages/api/auth/[...nextauth].ts
domain: process.env.NODE_ENV === 'production' 
  ? (process.env.NEXTAUTH_COOKIE_DOMAIN || 'www.masgolf.co.kr')
  : undefined
```

**변경 후**:
```typescript
// pages/api/auth/[...nextauth].ts
domain: process.env.NODE_ENV === 'production' 
  ? (process.env.NEXTAUTH_COOKIE_DOMAIN || undefined)
  : undefined
```

**효과**:
- 도메인을 명시하지 않으면 현재 도메인(`www.masgolf.co.kr`)에서만 작동
- 브라우저가 쿠키를 더 안정적으로 전달

### 3. 디버그 로그 추가

**추가된 디버그 코드**:
- `components/admin/GalleryPicker.tsx`: API 요청/응답 상세 로그
- `pages/api/admin/all-images.js`: 쿠키 상태 확인 로그
- `lib/api-auth.ts`: 세션 확인 전후 디버그 로그

**효과**:
- 문제 발생 시 원인 파악이 쉬워짐
- Vercel 로그에서 쿠키 전달 여부 확인 가능

---

## 🛡️ 재발 방지 대책

### 1. 쿠키 이름 통일 규칙

**규칙**:
- ✅ **프로덕션/개발 환경 모두 동일한 쿠키 이름 사용**
- ✅ **`next-auth.session-token`으로 통일**
- ❌ **`__Secure-` 접두사 사용하지 않음** (NextAuth가 자동 추가하지 않음)

**코드 위치**: 
- `middleware.ts` (라인 110-116)
- `pages/api/auth/[...nextauth].ts` (라인 220-234)

### 2. 쿠키 도메인 설정 규칙

**규칙**:
- ✅ **서브도메인 공유가 필요 없으면 `domain: undefined` 사용**
- ✅ **현재 도메인에서만 작동하도록 설정**
- ❌ **불필요한 도메인 명시 지양**

**코드 위치**: `pages/api/auth/[...nextauth].ts` (라인 230-232, 246-248)

### 3. 디버그 로그 유지

**규칙**:
- ✅ **배포 환경에서 쿠키/세션 상태 확인 로그 유지**
- ✅ **문제 발생 시 Vercel 로그에서 `[DEPLOY DEBUG]` 메시지 확인**

---

## 📝 테스트 방법

### Playwright 테스트 실행

```bash
node e2e-test/playwright-gallery-picker-debug.js
```

**확인 사항**:
1. 로그인 성공 후 쿠키가 브라우저에 저장되는지
2. API 요청 시 401 에러가 발생하지 않는지
3. 갤러리 모달이 정상적으로 열리고 이미지가 로드되는지

### 수동 테스트

1. 배포 환경에서 로그인
2. 카카오톡 콘텐츠 페이지로 이동
3. "갤러리에서 선택" 버튼 클릭
4. 이미지가 정상적으로 로드되는지 확인

---

## 🔧 추가 참고사항

### NextAuth 쿠키 동작 방식

1. **쿠키 이름**: 설정한 이름 그대로 사용 (`next-auth.session-token`)
2. **Secure 쿠키**: `useSecureCookies: true`일 때 `Secure` 플래그만 추가
3. **도메인**: 명시하지 않으면 현재 도메인에서만 작동
4. **SameSite**: `lax`로 설정 (Chrome 호환성)

### 미들웨어 쿠키 확인 순서

```typescript
const sessionCookieNames = [
  'next-auth.session-token',        // ✅ 실제 사용되는 쿠키
  '__Secure-next-auth.session-token', // 호환성을 위해 유지
  '__Host-next-auth.session-token'    // 호환성을 위해 유지
];
```

### Vercel 로그 확인

문제 발생 시 Vercel 대시보드에서 다음 로그 확인:
- `[DEPLOY DEBUG] requireAuth 쿠키 확인`
- `[DEPLOY DEBUG] requireAuth 세션 확인`
- `[Middleware] 세션 쿠키 존재`

---

## ✅ 검증 완료

- [x] 프로덕션 테스트 통과
- [x] 갤러리 모달 정상 작동 확인
- [x] 이미지 로드 정상 확인
- [x] 401 에러 해결 확인

**최종 테스트 결과**: ✅ 성공 (2026-01-24)

---

## 🚨 문제 재발 시 대응

1. **즉시 확인**:
   ```bash
   node e2e-test/playwright-gallery-picker-debug.js
   ```

2. **로그 확인**:
   - Vercel 대시보드 → Functions → Serverless Functions
   - `[DEPLOY DEBUG]` 로그 확인
   - `[Middleware]` 로그 확인

3. **쿠키 이름 확인**:
   - `middleware.ts`에서 `cookieName` 확인
   - `pages/api/auth/[...nextauth].ts`에서 실제 쿠키 이름 확인
   - 두 값이 일치하는지 확인

4. **롤백**:
   - 이전 커밋으로 롤백
   - `git revert <commit-hash>`

---

**작성일**: 2026-01-24  
**작성자**: AI Assistant  
**검토 상태**: ✅ 완료
