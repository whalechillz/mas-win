# 고객 이미지 업로드 실패 원인 분석

## 에러 현상

**콘솔 에러:**
- `POST https://masgolf.co.kr/customer-thumbnail/upload 500 (Internal Server Error)`
- `POST https://masgolf.co.kr/customer-thumbnail/update 500 (Internal Server Error)`
- `POST https://masgolf.co.kr/customer/update/customer-thumbnail-to-representative/37 500 (Internal Server Error)`

**업로드 시도:**
- 파일: `IMG_3388.jpg (291KB)`
- 고객: 최태설
- 방문일자: 2026.11.23
- 메타데이터 생성 방식: 폴더 생성

## 문제 분석

### 1. 엔드포인트 불일치

**에러 메시지의 엔드포인트:**
- `customer-thumbnail/upload` ❌ (현재 코드베이스에 없음)
- `customer-thumbnail/update` ❌ (현재 코드베이스에 없음)
- `customer/update/customer-thumbnail-to-representative/37` ❌ (현재 코드베이스에 없음)

**실제 호출되어야 하는 엔드포인트:**
- `/api/admin/create-customer-image-metadata` ✅
- `/api/admin/move-customer-image-file` ✅

### 2. 가능한 원인

#### 원인 1: 레거시 코드 또는 다른 컴포넌트
- 다른 페이지나 컴포넌트에서 레거시 API를 호출하고 있을 수 있음
- `customer-thumbnail` 관련 코드가 어딘가에 남아있을 수 있음

#### 원인 2: 실제 API 호출 실패
`/api/admin/create-customer-image-metadata`에서 500 에러 발생 가능:

1. **FormData 파싱 실패**
   - `formidable` 라이브러리 오류
   - 파일 크기 초과 (50MB 제한)

2. **Supabase Storage 업로드 실패**
   - 임시 파일 업로드 실패
   - 권한 문제
   - Storage 버킷 문제

3. **이미지 타입 감지 실패**
   - `detectCustomerImageType` 함수 오류
   - 외부 API 호출 실패

4. **메타데이터 생성 API 실패**
   - `/api/analyze-image-prompt` 또는 `/api/analyze-image-general` 호출 실패
   - OpenAI API 오류 (크레딧 부족, 네트워크 오류 등)
   - `baseUrl` 설정 오류 (프로덕션에서 `localhost:3000` 사용)

5. **DB 저장 실패**
   - `image_assets` 테이블 insert 실패
   - 제약 조건 위반 (unique constraint 등)
   - RLS 정책 문제

## 해결 방안

### 즉시 확인 사항

1. **서버 로그 확인**
   - `create-customer-image-metadata` API 로그 확인
   - 실제 에러 메시지 확인

2. **환경 변수 확인**
   - `NEXT_PUBLIC_BASE_URL` 또는 `NEXT_PUBLIC_SITE_URL` 설정 확인
   - 프로덕션에서 `localhost:3000`을 사용하지 않는지 확인

3. **레거시 코드 확인**
   - `customer-thumbnail` 관련 코드 검색
   - 다른 컴포넌트에서 호출하는지 확인

### 개선 사항

1. **에러 처리 개선**
   - 더 상세한 에러 메시지
   - 각 단계별 에러 로깅

2. **환경 변수 검증**
   - `baseUrl` 자동 감지 개선
   - 프로덕션 환경 확인

3. **레거시 코드 제거**
   - `customer-thumbnail` 관련 코드 찾아서 제거 또는 수정

## 다음 단계

1. 서버 로그 확인하여 실제 에러 원인 파악
2. `customer-thumbnail` 관련 코드 검색 및 제거
3. 에러 처리 개선 및 로깅 강화
