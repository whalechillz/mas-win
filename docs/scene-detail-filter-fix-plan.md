# 장면별 상세 필터 기능 수정 계획

## 문제 분석

### 현재 문제점

1. **필터 기능이 작동하지 않음**
   - "전체" 클릭 시 전체 미디어가 표시되지 않음
   - "동영상" 클릭 시 동영상만 표시되지 않음
   - **"서류" 클릭 시 미할당 미디어 박스에 서류가 표시되지 않음** ⚠️ 주요 문제
     - 미할당 서류가 있어도 박스가 나타나지 않거나, 박스는 나타나지만 서류가 표시되지 않음
     - 원인 1: `{filteredUnassignedMedia.length > 0 && (...)}` 조건부 렌더링으로 인해 필터링 결과가 0이면 섹션 자체가 숨겨짐
     - 원인 2: 서류 필터링 로직이 `is_scanned_document === true`만 체크하여 `document_type`이 있는 경우를 놓침
     - 원인 3: 필터링된 결과가 실제로는 0개로 계산되어 섹션이 렌더링되지 않음

2. **필터 적용 범위 문제**
   - 필터가 미할당 미디어 섹션에만 적용되고 목록보기 탭에는 제대로 적용되지 않음
   - 또는 필터가 목록보기 탭에만 적용되고 미할당 미디어 섹션에는 적용되지 않음

3. **미할당/할당 구분 부족**
   - 미할당 미디어인지 장면에 배치된 미디어인지 시각적으로 구분하기 어려움
   - 목록보기에서도 할당 상태를 명확히 표시하지 않음

4. **UI 일관성 문제**
   - "서류" 탭 클릭 시 목록보기가 표시되는 이유가 불명확
   - 필터와 탭의 역할이 혼재되어 있음

## 요구사항

### 1. 필터 기능 정상 작동
- **전체**: 모든 미디어 타입 표시 (이미지, 동영상, 서류 모두)
- **이미지**: 이미지만 표시 (동영상, 서류 제외)
- **동영상**: 동영상만 표시
- **서류**: 서류만 표시 (미할당 미디어 박스에 서류가 정상적으로 표시되어야 함)

### 2. 필터 적용 범위
- 필터는 **미할당 미디어 섹션**과 **목록보기 탭** 모두에 적용되어야 함
- 필터는 **모든 미디어**에 적용 (할당/미할당 구분 없이)

### 3. 미할당/할당 구분 시각화
- 미할당 미디어: 명확한 배지 또는 배경색으로 표시
- 장면에 할당된 미디어: 할당된 장면 번호 표시
- 목록보기에서도 할당 상태를 명확히 표시

### 4. UI 구조 개선
- 필터는 상단에 유지 (현재 구조 유지)
- 목록보기 탭은 필터와 독립적으로 작동
- 필터와 탭의 역할 명확히 구분

## 서류 필터 문제 원인 분석 (미할당 미디어 박스에 서류가 표시되지 않는 문제)

### 가능한 원인

1. **필터링 로직 문제**
   - `img.is_scanned_document === true`로만 체크하여 `document_type`이 있는 경우를 놓침
   - 실제 데이터가 `is_scanned_document: false` 또는 `undefined`이지만 `document_type`은 있을 수 있음

2. **조건부 렌더링 문제**
   - `{filteredUnassignedMedia.length > 0 && (...)}`로 인해 필터링 결과가 0이면 섹션 자체가 숨겨짐
   - 서류 필터링 로직이 잘못되어 결과가 0개로 계산되면 박스가 나타나지 않음

3. **데이터 문제**
   - `image_assets` 테이블에 `is_scanned_document` 필드가 `true`로 설정된 레코드가 없을 수 있음
   - API에서 `is_scanned_document: img.is_scanned_document || false`로 처리하여 `undefined`가 `false`로 변환됨

### 해결 방안

1. **필터링 로직 개선**
   - `is_scanned_document === true` 체크
   - `document_type`이 있는 경우도 서류로 판단 (대안 로직)
   - 디버깅 로그 추가로 각 이미지의 상태 확인

2. **조건부 렌더링 수정**
   - 필터링된 결과가 있거나, 'all' 필터일 때 전체 미할당 미디어가 있으면 섹션 표시
   - 필터별로 올바른 개수 표시

## 구현 계획

### Phase 1: 서류 필터 및 미할당 미디어 박스 표시 문제 해결

**파일**: `components/admin/customers/SceneDetailView.tsx`

**문제점**:
- **서류 필터 클릭 시 미할당 미디어 박스에 서류가 표시되지 않음**
- `filteredMedia`는 `images` 전체를 필터링하지만, 미할당 미디어 섹션에는 `filteredUnassignedMedia`를 사용
- **서류 필터링 로직**: `is_scanned_document === true`로만 체크하여 `document_type`이 있는 경우를 놓침
- **조건부 렌더링**: `{filteredUnassignedMedia.length > 0 && (...)}`로 인해 필터링 결과가 0이면 섹션 자체가 숨겨짐

**수정 내용**:

1. **서류 필터링 로직 개선** (미할당 미디어 박스에 서류가 표시되도록)
   - `is_scanned_document === true` 체크
   - `document_type`이 있는 경우도 서류로 판단 (대안 로직)
   
2. **조건부 렌더링 수정** (미할당 미디어 박스가 필터에 따라 올바르게 표시되도록)
   - 필터링된 결과가 0개여도 'all' 필터일 때는 섹션 표시
   - 필터별로 올바른 개수 표시

3. **필터링 로직 개선**
   ```typescript
   // 필터링된 미디어 (목록보기 탭용) - 모든 미디어 (할당/미할당 구분 없이)
   const filteredMedia = useMemo(() => {
     let filtered = images;
     
     // 타입별 필터링
     if (mediaTypeFilter === 'video') {
       filtered = images.filter(img => isVideo(img.image_url));
     } else if (mediaTypeFilter === 'document') {
       filtered = images.filter(img => img.is_scanned_document === true);
     } else if (mediaTypeFilter === 'image') {
       filtered = images.filter(img => !isVideo(img.image_url) && !img.is_scanned_document);
     }
     // 'all'인 경우는 필터링하지 않음 (전체 표시)
     
     return filtered.sort((a, b) => {
       // 날짜별 정렬 (최신순)
       const dateA = a.date_folder || '';
       const dateB = b.date_folder || '';
       return dateB.localeCompare(dateA);
     });
   }, [images, mediaTypeFilter]);

   // 필터링된 미할당 미디어 (미할당 미디어 섹션용)
   const filteredUnassignedMedia = useMemo(() => {
     let filtered = unassignedMedia;
     
     // 타입별 필터링
     if (mediaTypeFilter === 'video') {
       filtered = unassignedMedia.filter(img => isVideo(img.image_url));
     } else if (mediaTypeFilter === 'document') {
       filtered = unassignedMedia.filter(img => img.is_scanned_document === true);
     } else if (mediaTypeFilter === 'image') {
       filtered = unassignedMedia.filter(img => !isVideo(img.image_url) && !img.is_scanned_document);
     }
     // 'all'인 경우는 필터링하지 않음 (전체 표시)
     
     return filtered;
   }, [unassignedMedia, mediaTypeFilter]);
   ```

2. **필터 상태 초기화 확인**
   - 필터가 제대로 초기화되는지 확인
   - 필터 변경 시 상태 업데이트 확인

### Phase 2: 미할당/할당 구분 시각화

**파일**: `components/admin/customers/SceneDetailView.tsx`

**수정 내용**:

1. **미할당 미디어 섹션에 배지 추가**
   ```typescript
   {filteredUnassignedMedia.map((media) => {
     return (
       <div className="relative">
         {/* 미할당 배지 */}
         <span className="absolute top-2 left-2 z-10 px-2 py-1 text-[10px] font-semibold rounded-md bg-yellow-500 text-white shadow-lg">
           미할당
         </span>
         {/* 기존 동영상/서류 배지 */}
       </div>
     );
   })}
   ```

2. **목록보기에서 할당 상태 표시**
   ```typescript
   {filteredMedia.map((image) => {
     const isAssigned = image.story_scene !== null && image.story_scene >= 1 && image.story_scene <= 7;
     
     return (
       <div className="relative">
         {/* 할당 상태 배지 */}
         {isAssigned ? (
           <span className="absolute top-2 left-2 z-10 px-2 py-1 text-[10px] font-semibold rounded-md bg-green-500 text-white shadow-lg">
             장면 {image.story_scene}
           </span>
         ) : (
           <span className="absolute top-2 left-2 z-10 px-2 py-1 text-[10px] font-semibold rounded-md bg-yellow-500 text-white shadow-lg">
             미할당
           </span>
         )}
         {/* 기존 동영상/서류 배지 */}
       </div>
     );
   })}
   ```

3. **장면 이미지에도 할당 상태 표시**
   - 장면에 할당된 이미지는 이미 장면 번호를 알고 있으므로 추가 배지 불필요
   - 하지만 필요시 "장면 X" 배지 추가 가능

### Phase 3: UI 구조 개선

**파일**: `components/admin/customers/SceneDetailView.tsx`

**수정 내용**:

1. **필터와 탭의 역할 명확화**
   - 필터: 미디어 타입 필터링 (전체, 이미지, 동영상, 서류)
   - 탭: 뷰 모드 선택 (사진, 장면 설명, 목록보기)
   - 필터는 미할당 미디어 섹션과 목록보기 탭 모두에 적용

2. **목록보기 탭 설명 개선**
   - 목록보기는 모든 미디어를 목록 형태로 보는 뷰
   - 필터와 독립적으로 작동하지만, 필터가 적용되면 필터링된 결과를 표시

## 상세 구현 내용

### 1. 필터 로직 디버깅 및 수정

**현재 코드 확인**:
```typescript
const filteredMedia = useMemo(() => {
  let filtered = images;
  if (mediaTypeFilter === 'video') {
    filtered = images.filter(img => isVideo(img.image_url));
  } else if (mediaTypeFilter === 'document') {
    filtered = images.filter(img => img.is_scanned_document);
  } else if (mediaTypeFilter === 'image') {
    filtered = images.filter(img => !isVideo(img.image_url) && !img.is_scanned_document);
  }
  return filtered.sort(...);
}, [images, mediaTypeFilter]);
```

**문제점**:
- `is_scanned_document`가 `undefined`일 수 있음 → `false`로 처리됨
- `isVideo` 함수가 제대로 작동하는지 확인 필요
- 필터가 'all'일 때도 필터링이 적용되는지 확인

**수정 방안**:
```typescript
const filteredMedia = useMemo(() => {
  console.log('🔍 [필터] 필터링 시작:', { 
    mediaTypeFilter, 
    totalImages: images.length,
    videoCount: images.filter(img => isVideo(img.image_url)).length,
    documentCount: images.filter(img => img.is_scanned_document === true).length,
    imageCount: images.filter(img => !isVideo(img.image_url) && !img.is_scanned_document).length
  });
  
  let filtered = images;
  
  // 타입별 필터링
  if (mediaTypeFilter === 'video') {
    filtered = images.filter(img => {
      const isVideoFile = isVideo(img.image_url);
      console.log('🔍 [필터] 동영상 체크:', { 
        url: img.image_url, 
        isVideo: isVideoFile,
        filename: img.english_filename 
      });
      return isVideoFile;
    });
  } else if (mediaTypeFilter === 'document') {
    filtered = images.filter(img => {
      const isDoc = img.is_scanned_document === true;
      console.log('🔍 [필터] 서류 체크:', { 
        url: img.image_url, 
        is_scanned_document: img.is_scanned_document,
        isDoc,
        filename: img.english_filename 
      });
      return isDoc;
    });
  } else if (mediaTypeFilter === 'image') {
    filtered = images.filter(img => {
      const isVideoFile = isVideo(img.image_url);
      const isDoc = img.is_scanned_document === true;
      const isImage = !isVideoFile && !isDoc;
      return isImage;
    });
  }
  // 'all'인 경우는 필터링하지 않음
  
  console.log('✅ [필터] 필터링 결과:', { 
    mediaTypeFilter,
    filteredCount: filtered.length,
    originalCount: images.length
  });
  
  return filtered.sort((a, b) => {
    const dateA = a.date_folder || '';
    const dateB = b.date_folder || '';
    return dateB.localeCompare(dateA);
  });
}, [images, mediaTypeFilter]);
```

### 2. 미할당/할당 구분 시각화

**미할당 미디어 섹션**:
```typescript
{filteredUnassignedMedia.map((media) => {
  return (
    <div className="relative">
      {/* 미할당 배지 - 항상 표시 */}
      <span className="absolute top-2 left-2 z-10 px-2 py-1 text-[10px] font-semibold rounded-md bg-yellow-500 text-white shadow-lg">
        미할당
      </span>
      
      {/* 동영상 배지 - 오른쪽 상단 */}
      {isVideoFile && (
        <span className="absolute top-2 right-2 z-10 px-2 py-1 text-[10px] font-semibold rounded-md bg-blue-500 text-white shadow-lg">
          동영상
        </span>
      )}
      
      {/* 서류 배지 - 오른쪽 상단 (동영상이 아닐 때) */}
      {isDocument && !isVideoFile && (
        <span className="absolute top-2 right-2 z-10 px-2 py-1 text-[10px] font-semibold rounded-md bg-purple-500 text-white shadow-lg">
          서류
        </span>
      )}
    </div>
  );
})}
```

**목록보기 탭**:
```typescript
{filteredMedia.map((image) => {
  const isAssigned = image.story_scene !== null && image.story_scene >= 1 && image.story_scene <= 7;
  
  return (
    <div className="relative">
      {/* 할당 상태 배지 - 왼쪽 상단 */}
      {isAssigned ? (
        <span className="absolute top-2 left-2 z-10 px-2 py-1 text-[10px] font-semibold rounded-md bg-green-500 text-white shadow-lg">
          장면 {image.story_scene}
        </span>
      ) : (
        <span className="absolute top-2 left-2 z-10 px-2 py-1 text-[10px] font-semibold rounded-md bg-yellow-500 text-white shadow-lg">
          미할당
        </span>
      )}
      
      {/* 동영상 배지 - 오른쪽 상단 */}
      {isVideoFile && (
        <span className="absolute top-2 right-2 z-10 px-2 py-1 text-[10px] font-semibold rounded-md bg-blue-500 text-white shadow-lg">
          동영상
        </span>
      )}
      
      {/* 서류 배지 - 오른쪽 상단 (동영상이 아닐 때) */}
      {image.is_scanned_document && !isVideoFile && (
        <span className="absolute top-2 right-2 z-10 px-2 py-1 text-[10px] font-semibold rounded-md bg-purple-500 text-white shadow-lg">
          서류
        </span>
      )}
    </div>
  );
})}
```

### 3. 필터 적용 범위 확대

**현재 문제**:
- 필터가 미할당 미디어 섹션에만 적용되거나 목록보기 탭에만 적용됨
- 두 곳 모두에 일관되게 적용되어야 함

**수정 방안**:
- `filteredMedia`와 `filteredUnassignedMedia` 모두 동일한 필터 로직 사용
- 필터 변경 시 두 곳 모두 업데이트되도록 보장

## 파일 구조

### 수정할 파일
1. `components/admin/customers/SceneDetailView.tsx`
   - 필터 로직 수정 및 디버깅
   - 미할당/할당 구분 시각화 추가
   - 필터 적용 범위 확대

### 참고 파일
1. `components/admin/MediaRenderer.tsx` - 미디어 타입 감지 로직
2. `pages/api/admin/upload-customer-image.js` - 이미지 데이터 구조

## 예상 작업 시간

- Phase 1 (필터 로직 수정 및 디버깅): 2-3시간
- Phase 2 (미할당/할당 구분 시각화): 1-2시간
- Phase 3 (UI 구조 개선): 1시간
- 테스트 및 디버깅: 1-2시간
- **총 예상 시간: 5-8시간**

## 우선순위

**높음**: 사용자가 직접 보고한 필터 기능 오류로 즉시 수정 필요

## 테스트 계획

1. **필터 기능 테스트**
   - "전체" 클릭 → 모든 미디어 타입이 표시되는지 확인
   - "이미지" 클릭 → 이미지만 표시되는지 확인 (동영상, 서류 제외)
   - "동영상" 클릭 → 동영상만 표시되는지 확인
   - "서류" 클릭 → 서류만 표시되는지 확인

2. **필터 적용 범위 테스트**
   - 필터 변경 시 미할당 미디어 섹션이 업데이트되는지 확인
   - 필터 변경 시 목록보기 탭이 업데이트되는지 확인
   - 두 곳 모두 동일한 필터 결과가 표시되는지 확인

3. **미할당/할당 구분 테스트**
   - 미할당 미디어에 "미할당" 배지가 표시되는지 확인
   - 목록보기에서 할당된 미디어에 "장면 X" 배지가 표시되는지 확인
   - 목록보기에서 미할당 미디어에 "미할당" 배지가 표시되는지 확인

4. **UI 일관성 테스트**
   - 필터와 탭이 독립적으로 작동하는지 확인
   - 필터가 목록보기 탭에도 적용되는지 확인
   - 배지가 겹치지 않고 올바르게 표시되는지 확인

## 배지 색상 및 위치

### 배지 위치
- **왼쪽 상단**: 할당 상태 (미할당: 노란색, 장면 할당: 초록색)
- **오른쪽 상단**: 미디어 타입 (동영상: 파란색, 서류: 보라색)

### 배지 색상
- **미할당**: `bg-yellow-500` (노란색)
- **장면 할당**: `bg-green-500` (초록색)
- **동영상**: `bg-blue-500` (파란색)
- **서류**: `bg-purple-500` (보라색)

## 디버깅 로그 추가

필터 기능 디버깅을 위해 상세한 로그 추가:
- 필터 변경 시 현재 필터 값
- 필터링 전/후 이미지 개수
- 각 이미지의 타입 판별 결과
- 필터링된 결과 상세 정보
