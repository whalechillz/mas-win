# 이미지 삭제 - DB 삭제 및 성공 메시지 수정 계획

## 문제 분석

### 현재 상황
1. **DB에서 실제로 삭제가 안됨**: Storage는 삭제되지만 DB 메타데이터가 삭제되지 않음
2. **삭제 성공 메시지가 안나옴**: 사용자에게 피드백이 없음

### 원인 분석

**API 로직 확인**:
- POST 메서드는 `imageNames` 배열 또는 단일 `imageName`을 받음
- Storage에서 파일 삭제는 성공
- DB 메타데이터 삭제는 `cdn_url`로 매칭하여 삭제 시도
- **문제**: `getPublicUrl`로 생성한 URL이 실제 `cdn_url`과 일치하지 않을 수 있음

**응답 처리 확인**:
- API는 `{ success: true, deletedImages: [...], metadataDeletedCount: ... }` 형식으로 응답
- 현재 코드는 `response.ok`만 확인하고 `result.success`를 확인하지 않음
- 성공 메시지가 없음

## 해결 방안

### 1. API 응답 처리 개선
- `result.success` 확인 추가
- 성공 메시지 표시 추가
- 삭제된 파일 수 및 DB 메타데이터 삭제 수 표시

### 2. DB 삭제 로직 확인
- `cdn_url` 매칭 로직 확인
- `file_path` 기반 삭제도 시도
- 삭제 실패 시 로그 확인

## 구현 계획

### Phase 1: 응답 처리 및 성공 메시지 추가

**파일**: `pages/admin/customers/index.tsx`, `pages/admin/products.tsx`

**수정 내용**:
1. API 응답에서 `result.success` 확인
2. 성공 메시지 표시 (갤러리 관리와 동일)
3. 삭제된 파일 수 및 DB 메타데이터 삭제 수 표시

### Phase 2: DB 삭제 로직 개선 (필요시)

**파일**: `pages/api/admin/delete-image.js`

**확인 사항**:
1. `cdn_url` 매칭이 정확한지 확인
2. `file_path` 기반 삭제도 시도
3. 삭제 실패 시 상세 로그 추가

## 파일 구조

### 수정할 파일

1. **`pages/admin/customers/index.tsx`**
   - `onDelete` 핸들러에서 응답 처리 개선
   - 성공 메시지 추가

2. **`pages/admin/products.tsx`**
   - `onDelete` 핸들러에서 응답 처리 개선
   - `handleDeletePerformanceImage` 함수 수정
   - 성공 메시지 추가

3. **`pages/api/admin/delete-image.js`** (확인 필요)
   - DB 삭제 로직 확인
   - `file_path` 기반 삭제 추가 고려

## 예상 작업 시간

- Phase 1 (응답 처리 및 성공 메시지): 30분
- Phase 2 (DB 삭제 로직 개선): 1-2시간 (필요시)
- 테스트 및 검증: 30분
- **총 예상 시간: 1.5-3시간**

## 우선순위

**높음**: 사용자가 직접 보고한 버그로 즉시 수정 필요

## 테스트 계획

1. **삭제 성공 메시지 테스트**
   - 이미지 삭제 후 성공 메시지 표시 확인
   - 삭제된 파일 수 표시 확인

2. **DB 삭제 테스트**
   - Storage에서 파일 삭제 확인
   - DB에서 메타데이터 삭제 확인
   - `image_assets` 테이블에서 레코드 삭제 확인

3. **오류 처리 테스트**
   - 삭제 실패 시 오류 메시지 표시 확인
   - 네트워크 오류 처리 확인
