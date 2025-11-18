# Supabase 오류 해결 체크리스트

## 1. 즉시 확인사항
- [ ] Supabase 대시보드 접속 가능한가?
- [ ] 프로젝트가 일시 중단되지 않았는가?
- [ ] 무료 플랜 한도를 초과하지 않았는가?

## 2. RLS 정책 확인
- [ ] bookings 테이블의 RLS가 활성화되어 있는가?
- [ ] contacts 테이블의 RLS가 활성화되어 있는가?
- [ ] INSERT 정책이 설정되어 있는가?

## 3. 테이블 구조 확인
- [ ] 퀴즈 관련 컬럼들이 추가되어 있는가?
  - swing_style
  - priority
  - current_distance
  - recommended_flex
  - expected_distance

## 4. 해결 방법
1. **긴급 패치 적용** (이미 완료)
   - emergency-fix.js가 로드되어 로컬 스토리지 사용

2. **RLS 정책 수정**
   - fix-database.sql 파일의 쿼리 실행

3. **디버그 페이지 확인**
   - https://win.masgolf.co.kr/debug-test.html

## 5. 복구 후 할 일
- [ ] emergency-fix.js 스크립트 제거
- [ ] 로컬 스토리지의 데이터를 Supabase로 마이그레이션
- [ ] 정상 작동 테스트

---

# 이미지 갤러리 삭제 문제 해결

## 문제: 비교 모달에서 삭제한 이미지가 갤러리에서 사라지지 않음

### 증상
- 이미지 갤러리 관리 페이지의 "상세보기(비교)" 모달에서 이미지를 삭제했을 때
- 모달에서는 삭제된 것으로 보이지만
- 실제 갤러리 목록에서는 이미지가 여전히 표시됨

### 원인 분석
1. **데이터베이스 구조 차이:**
   - 갤러리 목록은 `image_metadata` 테이블을 기반으로 표시됨 (`/api/admin/all-images.js`)
   - 비교 모달 삭제 API (`/api/admin/image-asset-manager`)는 `image_assets` 테이블만 삭제
   - `image_metadata` 테이블은 삭제하지 않아 갤러리에서 계속 표시됨

2. **일괄 삭제와의 차이:**
   - 일괄 삭제 (`/api/admin/delete-image`)는 `image_metadata` 테이블도 함께 삭제하여 정상 작동
   - 비교 모달 삭제는 `image_assets`만 삭제하여 문제 발생

### 해결 방법 (2025-11-17 해결됨)

#### 1. API 수정 (`pages/api/admin/image-asset-manager.js`)
- `image_assets` 삭제 후 `image_metadata` 테이블도 함께 삭제하도록 수정
- 여러 방법으로 매칭 시도:
  - `cdn_url`로 `image_url` 매칭
  - `file_path`에서 추출한 `file_name`으로 정확 매칭
  - `file_name` LIKE 연산자로 부분 매칭
  - `image_url`로 직접 매칭

```javascript
// ✅ image_metadata 테이블에서도 삭제 (갤러리 표시 제거)
let metadataDeleted = false;
if (deleteData && deleteData.length > 0) {
  const deletedAsset = deleteData[0];
  
  // cdn_url로 image_metadata 찾아서 삭제
  if (deletedAsset.cdn_url) {
    const { error: metadataError, count: metadataCount } = await supabase
      .from('image_metadata')
      .delete()
      .eq('image_url', deletedAsset.cdn_url);
    // ...
  }
  // ... 추가 매칭 로직
}
```

#### 2. UI 개선 (`pages/admin/gallery.tsx`)
- 비교 모달의 삭제 버튼 클릭 시 일괄 삭제와 동일한 스타일의 확인 모달 표시
- `showCompareDeleteConfirm` 상태 추가
- 삭제 확인 모달 컴포넌트 추가

### 관련 파일
- `pages/api/admin/image-asset-manager.js` - 삭제 API 수정
- `pages/api/admin/delete-image.js` - 일괄 삭제 API (참고용)
- `pages/api/admin/all-images.js` - 갤러리 목록 조회 API
- `pages/admin/gallery.tsx` - 갤러리 관리 페이지

### 검증 방법
1. 갤러리에서 이미지 선택 → "상세보기(비교)" 클릭
2. 비교 모달에서 "이미지 삭제" 버튼 클릭
3. 삭제 확인 모달에서 "삭제" 확인
4. 갤러리 목록에서 해당 이미지가 사라졌는지 확인

### 참고사항
- `uploaded` 또는 `originals` 폴더에 대한 삭제 제한은 없음 (코드상 제한 없음)
- 일괄 삭제는 경고만 표시하고 실제 삭제는 가능
- 삭제 후 `image_assets`와 `image_metadata` 모두에서 제거되어야 갤러리에서 사라짐

---

# NextAuth 로그인 리다이렉트 루프 문제 해결

## 문제: ERR_TOO_MANY_REDIRECTS 오류 발생

### 증상
- 로그인 페이지 접속 시 `ERR_TOO_MANY_REDIRECTS` 오류 발생
- `/api/auth/session` 요청이 실패
- NextAuth `CLIENT_FETCH_ERROR` 발생
- 로그인 페이지가 계속 리다이렉트됨

### 원인 분석
1. **NextAuth error 페이지 설정 문제:**
   - `/api/auth/error` 페이지가 리다이렉트를 반복하여 루프 발생
   - NextAuth의 error 페이지는 실제 페이지 컴포넌트여야 함 (API 라우트 아님)

2. **Middleware 리다이렉트 루프:**
   - `/api/auth/session` 요청이 middleware에서 잘못 처리될 수 있음
   - NextAuth API 경로가 인증 체크 대상에 포함될 수 있음

3. **Supabase 클라이언트 초기화 실패:**
   - 환경 변수가 설정되지 않아 `supabaseAdmin`이 null
   - `authorize` 함수에서 throw로 인한 오류 처리 문제

### 해결 방법 (2025-11-17 해결됨)

#### 1. NextAuth 설정 수정 (`pages/api/auth/[...nextauth].ts`)
- error 페이지 참조 제거 (리다이렉트 루프 방지)
- `supabaseAdmin` null 체크 개선 (throw 대신 null 반환)

```typescript
// Supabase 클라이언트 확인
if (!supabaseAdmin) {
  console.error('❌ Supabase 클라이언트가 초기화되지 않았습니다.')
  console.error('   환경 변수 확인: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  return null // throw 대신 null 반환하여 NextAuth가 적절히 처리하도록
}
```

```typescript
pages: {
  signIn: '/admin/login'
  // error 페이지는 로그인 페이지에서 직접 처리
}
```

#### 2. Middleware 개선 (`middleware.ts`)
- `/api/auth/*` 모든 경로가 인증 체크 없이 통과하도록 명확히 처리
- NextAuth API는 리다이렉트 없이 바로 통과

```typescript
// NextAuth API 경로는 무조건 통과 (리다이렉트 루프 방지)
// /api/auth/* 모든 경로 포함 (session, signin, callback, error 등)
if (pathname.startsWith('/api/auth') || pathname.startsWith('/ko/api/auth') || pathname.startsWith('/ja/api/auth')) {
  // NextAuth API는 인증 체크 없이 바로 통과
  return NextResponse.next();
}
```

#### 3. 로그인 페이지 개선 (`pages/admin/login.tsx`)
- NextAuth 오류 코드별 메시지 처리
- URL 파라미터 오류 메시지 표시

```typescript
if (result?.error) {
  // NextAuth 오류 코드에 따른 메시지
  const errorMessages: { [key: string]: string } = {
    Configuration: '서버 설정 오류가 발생했습니다. 관리자에게 문의하세요.',
    AccessDenied: '접근이 거부되었습니다.',
    Verification: '인증 오류가 발생했습니다.',
    CredentialsSignin: '아이디와 비밀번호를 확인해주세요.',
  };
  setError(errorMessages[result.error] || '로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.');
}
```

### 관련 파일
- `pages/api/auth/[...nextauth].ts` - NextAuth 설정
- `pages/admin/login.tsx` - 로그인 페이지
- `middleware.ts` - 미들웨어 (리다이렉트 처리)
- `lib/supabase-admin.ts` - Supabase 클라이언트 초기화

### 검증 방법
1. Playwright 테스트 실행:
   ```bash
   node playwright-test-login.js
   ```

2. 브라우저에서 확인:
   - `http://localhost:3000/admin/login` 접속
   - 콘솔에서 `ERR_TOO_MANY_REDIRECTS` 오류 없음 확인
   - 로그인 폼이 정상적으로 표시됨

3. 실제 로그인 시도:
   - 아이디/비밀번호 입력 후 로그인 버튼 클릭
   - 리다이렉트 루프 없이 정상 로그인 완료

### 참고사항
- NextAuth의 error 페이지는 `/pages` 디렉토리에 페이지 컴포넌트로 만들어야 함 (API 라우트 아님)
- 환경 변수 `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 확인 필수
- Middleware에서 `/api/auth/*` 경로는 반드시 인증 체크 없이 통과해야 함