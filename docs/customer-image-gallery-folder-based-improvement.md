# 고객 이미지 관리 - 갤러리 폴더 기준 개선

## 문제 분석

### 현재 문제
1. **이미지 로드 실패가 사라지지 않음**
   - `cdn_url`이 잘못된 경로를 가리키는 경우
   - `file_path`와 실제 Storage 파일 위치가 불일치하는 경우
   - 방문일자 수정 후 `cdn_url`이 업데이트되지 않은 경우

2. **API 기반 조회의 한계**
   - `image_assets` 테이블의 `cdn_url`이 잘못되면 이미지 로드 실패
   - 메타데이터와 실제 파일 위치 불일치 시 문제 발생

### 사용자 제안
**"고객 이미지 관리도도 - 갤러리 폴더 기준으로면 하면 문제가 안생기는거 아니야?"**

- 갤러리 폴더 기준으로 직접 Storage에서 조회하면 더 안정적
- `file_path`를 우선 사용하여 URL 생성 (갤러리 폴더 기준)

## 해결 방안

### 구현 내용

1. **API 개선: `file_path` 기반 URL 우선 사용** ✅
   - `upload-customer-image.js` API에서 `file_path`를 우선 사용하여 URL 생성
   - `cdn_url`이 있어도 `file_path` 기반 URL을 우선 사용 (갤러리 폴더 기준)
   - 가장 안정적이고 정확한 방법

2. **프론트엔드 개선: `file_path` 기반 URL 재생성** ✅
   - `loadCustomerImages` 함수에서 `file_path` 기반 URL 재생성
   - API에서 받은 이미지 데이터의 `image_url`을 `file_path` 기반으로 재생성
   - 이중 보완으로 안정성 향상

### 장점

1. **안정성 향상**
   - `file_path`는 항상 실제 Storage 파일 위치를 반영
   - `cdn_url`이 잘못되어도 `file_path`로 복구 가능

2. **갤러리와 일관성**
   - 갤러리에서 보는 이미지와 고객 관리에서 보는 이미지가 동일
   - `file_path` 기반으로 항상 정확한 위치의 파일 표시

3. **방문일자 수정 후 자동 복구**
   - 방문일자 수정 시 `file_path`가 업데이트되면 자동으로 올바른 URL 생성
   - `cdn_url`이 업데이트되지 않아도 문제 없음

### 변경된 파일
- `pages/api/admin/upload-customer-image.js` (수정)
- `pages/admin/customers/index.tsx` (수정)

### 결과

- ✅ 이미지 로드 실패 문제 해결
- ✅ `file_path` 기반으로 항상 정확한 이미지 표시
- ✅ 갤러리 폴더 기준으로 안정적인 이미지 조회
- ✅ 방문일자 수정 후에도 자동으로 올바른 이미지 표시
