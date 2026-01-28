# 고객 이미지 날짜 필터 및 표시 문제 수정 계획

## 문제 분석

### 현재 상황
- **갤러리**: `jeonyugeun-S1-20260128-01.webp` 파일이 존재함 ✅
- **고객 관리**: "2026-01-28" 필터가 나타나지 않음 ❌
- **고객 관리**: 이미지가 표시되지 않음 ❌

### 원인 분석

**확인 결과**:
1. 이미지는 데이터베이스에 존재함
2. `file_path`: `originals/customers/jeonyugeun-9269/2026-01-28/jeonyugeun-S1-20260128-01.webp`
3. 날짜 추출 가능: `2026-01-28` (file_path, cdn_url, filename 모두에서 추출 가능)
4. **문제**: `ai_tags`에 `customer-13513` 태그가 없음 ❌
5. 고객 폴더는 맞음: `originals/customers/jeonyugeun-9269/`

**필터링 로직 문제**:
```javascript
// upload-customer-image.js (312-355줄)
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
    // file_path로 확인
    return true;
  }
  
  return false;
});
```

**문제점**:
- 이미지의 `ai_tags`가 있지만 `customer-{id}` 태그가 없는 경우
- `hasAnyTags = true`이므로 `file_path` 기반 필터링이 실행되지 않음
- 결과: 이미지가 필터링에서 제외됨

**날짜 필터 생성 문제**:
```javascript
// index.tsx (2674-2677줄)
const availableDates = useMemo(() => {
  const dates = Array.from(new Set(uploadedImages.map(img => img.date_folder).filter(Boolean))).sort().reverse();
  return dates;
}, [uploadedImages]);
```

- `date_folder`가 없으면 필터에 나타나지 않음
- `date_folder`는 `file_path`나 `folder_path`에서 추출되지만, 이미지가 필터링에서 제외되면 `uploadedImages`에 포함되지 않음

## 해결 방안

### 옵션 1: 이미지에 customer 태그 추가 (즉시 해결) ⭐

**작업 내용**:
1. `jeonyugeun-S1-20260128-01.webp` 이미지의 `ai_tags`에 `customer-13513` 태그 추가
2. 이미지가 필터링에 포함되어 표시됨
3. 날짜 필터도 자동으로 생성됨

**장점**:
- 즉시 해결 가능
- 기존 로직 유지
- 다른 이미지에도 동일하게 적용 가능

**단점**:
- 수동 작업 필요 (스크립트로 자동화 가능)

### 옵션 2: 필터링 로직 개선 (장기 해결)

**수정 내용**:
- `ai_tags`에 `customer-{id}` 태그가 없어도
- `file_path`가 고객 폴더에 있고
- `ai_tags`에 다른 태그가 있는 경우에도 포함

**장점**:
- 자동으로 해결
- 유사한 문제 방지

**단점**:
- 목록 제거 기능과 충돌 가능성
- 로직 복잡도 증가

## 권장 방안: 옵션 1 (즉시 해결) + 옵션 2 (장기 개선)

### 구현 계획

#### Phase 1: 즉시 해결 (이미지에 customer 태그 추가)
**파일**: `scripts/add-customer-tag-to-jeonyugeun-20260128.js` (신규)

**작업 내용**:
1. `jeonyugeun-S1-20260128-01.webp` 이미지 조회
2. `ai_tags`에 `customer-13513` 태그 추가
3. DB 업데이트

#### Phase 2: 필터링 로직 개선 (선택사항)
**파일**: `pages/api/admin/upload-customer-image.js`

**수정 내용**:
- `file_path` 기반 필터링 조건 개선
- `ai_tags`에 다른 태그가 있어도 `file_path`가 고객 폴더에 있으면 포함
- 단, `ai_tags`에 `customer-{id}` 태그가 명시적으로 없는 경우만 (목록 제거 기능 유지)

### 수정 코드 예시 (Phase 2)

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
  // 단, ai_tags에 customer-{id} 태그가 명시적으로 없는 경우만
  // (목록에서 제거된 이미지는 ai_tags에 다른 태그가 있어도 제외되어야 함)
  if (exactFolderPath && img.file_path) {
    const isInCustomerFolder = img.file_path.startsWith(exactFolderPath);
    if (isInCustomerFolder) {
      // ai_tags가 없거나, customer 태그가 없는 경우 포함
      // (다른 태그는 있어도 됨)
      return true;
    }
  }
  
  return false;
});
```

**주의사항**:
- 목록 제거 기능과 충돌하지 않도록 주의
- `ai_tags`에 `customer-{id}` 태그가 명시적으로 없는 경우만 `file_path`로 확인

## 예상 작업 시간

- Phase 1 (즉시 해결): 10분
- Phase 2 (장기 개선): 1시간
- **총 예상 시간: 1시간 10분**

## 테스트 계획

1. **이미지 표시 테스트**:
   - 고객 관리 모달에서 이미지가 표시되는지 확인
   - "2026-01-28" 필터가 나타나는지 확인

2. **필터 작동 테스트**:
   - "2026-01-28" 필터 클릭 시 이미지가 표시되는지 확인
   - 다른 날짜 필터도 정상 작동하는지 확인

3. **목록 제거 테스트**:
   - 이미지를 목록에서 제거
   - 제거 후 이미지가 표시되지 않는지 확인
