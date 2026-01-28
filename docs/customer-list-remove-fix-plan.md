# 고객 목록에서 제거 기능 수정 계획

## 문제 분석

### 현재 상황
- **API 호출**: 성공 (HTTP 200)
- **API 응답**: `{success: true, message: '이미 고객 목록에서 제거된 이미지입니다.'}`
- **문제**: 이미지가 UI에서 제거되지 않음

### 원인 분석

**1. API 로직 (`remove-customer-image.ts`)**:
- `ai_tags`에서 `customer-{customerId}` 태그를 제거함 ✅
- 태그가 이미 없으면 "이미 고객 목록에서 제거된 이미지입니다." 메시지 반환 ✅

**2. 이미지 로드 로직 (`upload-customer-image.js`)**:
```javascript
// 312-346줄: 이미지 필터링 로직
let filteredMetadataImages = (metadataImages || []).filter(img => {
  const tags = Array.isArray(img.ai_tags) ? img.ai_tags : [];
  const hasCustomerTag = tags.includes(customerTag);
  
  // ai_tags에 태그가 있으면 포함
  if (hasCustomerTag) {
    return true;
  }
  
  // ⚠️ 문제: ai_tags가 없어도 file_path로 확인 (하위 호환성)
  if (exactFolderPath && img.file_path) {
    const isInCustomerFolder = img.file_path.startsWith(exactFolderPath);
    if (isInCustomerFolder) {
      // file_path가 고객 폴더에 있으면 포함
      return true;
    }
  }
  
  return false;
});
```

**문제점**:
- `ai_tags`에서 `customer-{id}` 태그를 제거해도
- `file_path`가 고객 폴더(`originals/customers/{folderName}/...`)에 있으면
- 여전히 이미지가 필터링되어 표시됨

### 해결 방안

#### 옵션 1: `file_path` 기반 필터링 제거 (권장) ⭐

**이유**:
- `ai_tags` 기반 필터링만 사용하면 명확함
- 목록에서 제거한 이미지는 `ai_tags`에 `customer-{id}` 태그가 없으므로 자동으로 제외됨
- 하위 호환성 문제: 기존 이미지 중 `ai_tags`가 없는 경우 처리 필요

**수정 내용**:
1. `upload-customer-image.js`의 필터링 로직 수정
2. `ai_tags`에 `customer-{id}` 태그가 있는 경우만 포함
3. `file_path` 기반 필터링 제거 또는 조건부로 변경

**장점**:
- 명확한 로직
- 목록 제거 기능이 정확히 작동
- 태그 기반 관리로 일관성 유지

**단점**:
- 기존 이미지 중 `ai_tags`가 없는 경우 표시되지 않을 수 있음
- 마이그레이션 필요 (기존 이미지에 태그 추가)

#### 옵션 2: 제거된 이미지 추적 (별도 플래그)

**수정 내용**:
- `image_assets` 테이블에 `removed_from_customers` JSONB 컬럼 추가
- 제거된 고객 ID 목록 저장
- 필터링 시 `removed_from_customers`에 고객 ID가 없을 때만 포함

**장점**:
- `file_path` 기반 필터링 유지 가능
- 하위 호환성 유지

**단점**:
- DB 스키마 변경 필요
- 복잡한 로직

#### 옵션 3: `file_path` 기반 필터링 조건부 적용

**수정 내용**:
- `ai_tags`가 비어있거나 없는 경우에만 `file_path` 기반 필터링 적용
- `ai_tags`가 있으면 태그 기반 필터링만 사용

**장점**:
- 하위 호환성 유지
- 기존 이미지도 표시됨

**단점**:
- 로직이 복잡해짐
- 일관성 문제 가능

## 권장 방안: 옵션 1 (태그 기반 필터링만 사용)

### 구현 계획

#### Phase 1: 필터링 로직 수정
**파일**: `pages/api/admin/upload-customer-image.js`

**수정 내용**:
1. `file_path` 기반 필터링 제거 또는 조건부로 변경
2. `ai_tags`에 `customer-{id}` 태그가 있는 경우만 포함
3. 기존 이미지 처리: `ai_tags`가 없는 경우는 제외 (또는 마이그레이션 스크립트로 태그 추가)

**수정 위치**: 312-346줄

#### Phase 2: 기존 이미지 마이그레이션 (선택사항)
**파일**: `scripts/migrate-customer-tags.js` (신규)

**목적**:
- `ai_tags`가 없지만 `file_path`가 고객 폴더에 있는 이미지에 태그 추가
- 하위 호환성 유지

**작업 내용**:
1. `file_path`가 `originals/customers/{folderName}/...`인 이미지 조회
2. `ai_tags`에 `customer-{id}` 태그 추가
3. 고객 폴더명으로 고객 ID 찾기

### 수정 코드 예시

```javascript
// upload-customer-image.js 수정
let filteredMetadataImages = (metadataImages || []).filter(img => {
  const tags = Array.isArray(img.ai_tags) ? img.ai_tags : [];
  const hasCustomerTag = tags.includes(customerTag);
  
  // ai_tags에 customer-{id} 태그가 있는 경우만 포함
  if (hasCustomerTag) {
    return true;
  }
  
  // ⚠️ file_path 기반 필터링 제거 또는 주석 처리
  // 목록에서 제거한 이미지는 ai_tags에서 태그가 제거되므로
  // file_path가 있어도 표시되지 않아야 함
  
  return false;
});
```

### 예상 작업 시간

- 코드 수정: 30분
- 테스트: 30분
- 마이그레이션 스크립트 (선택): 1시간
- **총 예상 시간: 1-2시간**

### 테스트 계획

1. **목록 제거 테스트**:
   - 이미지 목록에서 제거 버튼 클릭
   - 확인 대화상자에서 "제거" 선택
   - 이미지가 목록에서 사라지는지 확인

2. **재추가 테스트**:
   - 제거된 이미지를 다시 고객에 추가
   - 이미지가 목록에 다시 표시되는지 확인

3. **기존 이미지 테스트**:
   - `ai_tags`가 없는 기존 이미지가 어떻게 표시되는지 확인
   - 필요시 마이그레이션 스크립트 실행
