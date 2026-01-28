# 고객 이미지 file_path 기반 필터링 개선 계획

## 문제 분석

### 현재 상황
- **갤러리**: `customers/이름/` 경로의 모든 이미지 표시 ✅
- **고객 관리**: `customer-{id}` 태그가 있는 이미지만 표시 ❌
- **문제**: `file_path`가 고객 폴더에 있어도 태그가 없으면 표시되지 않음

### 현재 필터링 로직

```javascript
// upload-customer-image.js (312-356줄)
let filteredMetadataImages = (metadataImages || []).filter(img => {
  const tags = Array.isArray(img.ai_tags) ? img.ai_tags : [];
  const hasCustomerTag = tags.includes(customerTag);
  
  // ai_tags에 customer-{id} 태그가 있으면 포함
  if (hasCustomerTag) {
    return true;
  }
  
  // ai_tags가 완전히 없는 경우에만 file_path로 확인
  const hasAnyTags = tags && tags.length > 0;
  if (!hasAnyTags && exactFolderPath && img.file_path) {
    // file_path로 확인 (하위 호환성)
    return true;
  }
  
  // ai_tags가 있지만 customer-{id} 태그가 없으면 제외
  return false;
});
```

**문제점**:
- `ai_tags`에 다른 태그(`visit-2026-01-28`, `scene-1` 등)가 있지만 `customer-{id}` 태그가 없는 경우
- `file_path`가 고객 폴더에 있어도 제외됨
- 예: `ahnhuija-S1-20260128-02.webp` (태그: `["visit-2026-01-28","scene-1",...]`)

### 목록 제거 기능과의 충돌

**목록 제거 기능**:
- `remove-customer-image.ts`에서 `ai_tags`에서 `customer-{id}` 태그만 제거
- `file_path`는 그대로 유지
- 목적: Storage 파일은 유지하고 고객 목록에서만 제거

**충돌 가능성**:
- `file_path` 기반 필터링을 사용하면 제거한 이미지가 다시 표시될 수 있음
- 하지만 제거된 이미지는 `ai_tags`에 다른 태그가 있어도 `customer-{id}` 태그가 없음

## 해결 방안

### 옵션 1: file_path 우선, 명시적 제거 추적 (권장) ⭐

**로직**:
1. `file_path`가 고객 폴더에 있으면 포함
2. 단, `ai_tags`에 `removed-from-customer-{id}` 같은 명시적 제거 태그가 있으면 제외
3. 또는 별도 플래그로 제거 상태 추적

**장점**:
- 갤러리와 고객 관리의 일관성
- 태그 없이도 이미지 표시 가능
- 목록 제거 기능과 충돌 없음

**단점**:
- 제거 상태 추적 로직 필요
- DB 스키마 변경 가능성

### 옵션 2: file_path 우선, 제거된 이미지 구분 (간단)

**로직**:
1. `file_path`가 고객 폴더에 있으면 포함
2. `ai_tags`에 `customer-{id}` 태그가 없고 다른 태그가 있으면 제외 (제거된 이미지로 간주)
3. `ai_tags`가 완전히 없으면 포함 (새 이미지로 간주)

**장점**:
- 간단한 구현
- 기존 로직과 유사
- DB 스키마 변경 불필요

**단점**:
- 제거된 이미지와 새 이미지 구분이 모호할 수 있음
- `ai_tags`에 다른 태그만 있는 새 이미지가 제외될 수 있음

### 옵션 3: file_path 우선, 제거 API 호출 이력 확인

**로직**:
1. `file_path`가 고객 폴더에 있으면 포함
2. 제거 API 호출 이력을 별도 테이블에 저장
3. 제거 이력이 있으면 제외

**장점**:
- 정확한 제거 상태 추적
- 명확한 구분

**단점**:
- 복잡한 구현
- DB 스키마 변경 필요
- 성능 오버헤드

## 권장 방안: 옵션 2 (file_path 우선, 제거된 이미지 구분)

### 구현 계획

**로직 변경**:
```javascript
let filteredMetadataImages = (metadataImages || []).filter(img => {
  const tags = Array.isArray(img.ai_tags) ? img.ai_tags : [];
  const hasCustomerTag = tags.includes(customerTag);
  
  // 1. ai_tags에 customer-{id} 태그가 있으면 포함
  if (hasCustomerTag) {
    return true;
  }
  
  // 2. file_path가 고객 폴더에 있으면 포함
  if (exactFolderPath && img.file_path) {
    const isInCustomerFolder = img.file_path.startsWith(exactFolderPath);
    if (isInCustomerFolder) {
      // 3. ai_tags가 완전히 없으면 포함 (새 이미지)
      const hasAnyTags = tags && tags.length > 0;
      if (!hasAnyTags) {
        return true;
      }
      
      // 4. ai_tags가 있지만 customer-{id} 태그가 없는 경우
      // 제거된 이미지일 가능성이 높지만, 다른 태그가 있으면 포함
      // (제거 API는 customer 태그만 제거하고 다른 태그는 유지)
      // 따라서 다른 태그가 있으면 새 이미지로 간주하고 포함
      return true;
    }
  }
  
  return false;
});
```

**주의사항**:
- 목록 제거 기능과의 충돌 방지
- 제거된 이미지는 `customer-{id}` 태그만 제거되고 다른 태그는 유지
- 따라서 `file_path`가 고객 폴더에 있으면 포함하는 것이 안전

### 수정 코드

```javascript
// upload-customer-image.js 수정
let filteredMetadataImages = (metadataImages || []).filter(img => {
  const tags = Array.isArray(img.ai_tags) ? img.ai_tags : [];
  const hasCustomerTag = tags.includes(customerTag);
  
  // ai_tags에 customer-{id} 태그가 있으면 포함
  if (hasCustomerTag) {
    return true;
  }
  
  // file_path가 고객 폴더에 있으면 포함
  // (태그 없이도 갤러리와 동일하게 표시)
  if (exactFolderPath && img.file_path) {
    const isInCustomerFolder = img.file_path.startsWith(exactFolderPath);
    if (isInCustomerFolder) {
      console.log('🔍 [고객 이미지 필터링] file_path로 포함:', {
        imageId: img.id,
        filePath: img.file_path?.substring(0, 100),
        tags,
        customerTag,
        customerId
      });
      return true;
    }
  }
  
  // 둘 다 해당 안되면 제외
  console.log('🔍 [고객 이미지 필터링] ai_tags와 file_path 모두 불일치 - 제외:', {
    imageId: img.id,
    filePath: img.file_path?.substring(0, 100),
    tags,
    customerTag,
    customerId
  });
  
  return false;
});
```

## 예상 작업 시간

- 코드 수정: 30분
- 테스트: 30분
- **총 예상 시간: 1시간**

## 테스트 계획

1. **태그 없는 이미지 테스트**:
   - `file_path`가 고객 폴더에 있지만 `customer-{id}` 태그가 없는 이미지
   - 이미지가 표시되는지 확인

2. **목록 제거 테스트**:
   - 이미지를 목록에서 제거
   - 제거 후 이미지가 표시되지 않는지 확인
   - (제거 API가 `customer-{id}` 태그를 제거하므로 `file_path`가 있어도 표시되지 않아야 함)

3. **갤러리와 일관성 테스트**:
   - 갤러리에서 보이는 이미지가 고객 관리에서도 표시되는지 확인
