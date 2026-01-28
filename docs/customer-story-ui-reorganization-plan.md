# 고객 스토리 관리 UI 재구성 계획 (최종)

## 개요

고객 스토리 관리 인터페이스를 재구성하여 모든 기능을 "장면별 상세" 메뉴로 통합합니다. 이미지, 동영상, 스캔 서류를 모두 동일한 방식으로 처리하며, 별도의 메뉴 구성 없이 타입별 배지로 구분합니다.

## 요구사항 분석

### 1. 장면별 상세에 미할당 이미지 추가 및 이동 기능
- **현재**: 장면별 상세에는 할당된 이미지만 표시
- **요구**: 미할당 이미지 섹션 추가, 드래그 앤 드롭으로 장면 이동 가능
- **포함 미디어**: 이미지, 동영상, 스캔 서류 모두 포함

### 2. 장면별 상세에 "장면설정" 기능 통합 및 "후기" 탭 삭제
- **현재**: 장면별 상세에 "사진", "장면 설명", "후기" 탭 존재
- **요구**: 
  - 스토리보드의 "장면설정" 기능을 장면별 상세의 "장면 설명" 탭에 통합
  - "후기" 탭 삭제

### 3. 스토리보드 "목록보기"를 장면별 상세로 이동
- **현재**: 스토리보드 탭 내부에 "스토리보드" / "목록보기" 서브 메뉴 존재
- **요구**: "목록보기" 기능을 장면별 상세로 이동

### 4. 스토리보드 메뉴 삭제 및 통합
- **현재**: 
  - 상위 탭: "스토리보드", "장면별 상세", "글 목록"
  - 스토리보드 내부: "스토리보드", "목록보기" 서브 메뉴
  - 스토리보드 뷰에 "장면 설명을 추가하세요..." 플레이스홀더
- **요구**: 
  - 스토리보드 탭 삭제
  - 스토리보드 내부 서브 메뉴 삭제
  - 모든 기능을 "장면별 상세"로 통합

### 5. 동영상 및 서류 처리 (추가 요구사항)
- **현재**: 
  - 동영상은 이미지와 함께 표시됨 (MediaRenderer로 자동 감지)
  - 스캔 서류는 `is_scanned_document` 필드로 구분됨
  - 동영상과 서류도 이미지와 동일하게 장면에 할당 가능
- **결정**: 
  - **별도 메뉴 구성 불필요** - 이미지, 동영상, 서류가 모두 동일한 방식으로 처리됨
  - 타입별 배지 표시로 구분 (동영상: 파란색 배지, 서류: 보라색 배지)
  - 필터링 옵션 추가 (선택적): "전체", "이미지", "동영상", "서류"

## 현재 구조 분석

### CustomerStoryModal.tsx
- **상위 탭**: `activeTab` ('storyboard' | 'scene-detail' | 'reviews')
- **스토리보드 서브 메뉴**: `viewMode` ('storyboard' | 'list')
- **주요 컴포넌트**:
  - `StoryboardView`: 미할당 이미지 + 장면 1-7 (드래그 앤 드롭 지원)
  - `ListView`: 이미지 목록 뷰
  - `SceneDetailView`: 장면별 상세 뷰 (왼쪽: 장면 목록, 오른쪽: 선택된 장면 상세)

### SceneDetailView.tsx
- **구조**: 
  - 왼쪽: 장면 목록 (1-7)
  - 오른쪽: 선택된 장면 상세
    - 탭: "사진", "장면 설명", "후기"
- **기능**:
  - 장면별 이미지 표시
  - 장면 설명 편집
  - 후기 표시

## 재구성 계획

### Phase 1: 장면별 상세에 미할당 이미지 및 드래그 앤 드롭 기능 추가

**파일**: `components/admin/customers/SceneDetailView.tsx`

**변경 사항**:
1. 미할당 이미지 섹션 추가
2. 드래그 앤 드롭 핸들러 추가
3. 장면 간 이미지 이동 기능
4. 미할당 영역으로 이미지 이동 기능

**구현 내용**:
```typescript
// 미할당 이미지 계산
const unassignedImages = useMemo(() => {
  return images.filter(img => !img.story_scene || img.story_scene < 1 || img.story_scene > 7);
}, [images]);

// 드래그 앤 드롭 핸들러 추가
const handleDragStart = (e: React.DragEvent, imageId: number | null, imageUrl?: string) => { /* ... */ };
const handleDrop = async (e: React.DragEvent, targetScene: number | null) => { /* ... */ };
const handleRemoveFromScene = async (imageId: number) => { /* ... */ };
```

### Phase 2: 장면별 상세에 "장면설정" 기능 통합 및 "후기" 탭 삭제

**파일**: `components/admin/customers/SceneDetailView.tsx`

**변경 사항**:
1. "후기" 탭 삭제
2. "장면 설명" 탭에 스토리보드의 "장면설정" 기능 통합
   - 장면 설명 편집 (기존)
   - 장면 설명 저장 (기존)
   - 스토리보드의 장면 설명 편집 UI 스타일 적용

**구현 내용**:
```typescript
// 탭 메뉴 수정
const [activeTab, setActiveTab] = useState<'images' | 'description' | 'list'>('images');
// 'reviews' 탭 제거, 'list' 탭 추가

// 장면 설명 탭에 스토리보드 스타일 적용
{activeTab === 'description' && (
  <div className="space-y-4">
    <textarea
      value={editingDescription}
      onChange={(e) => setEditingDescription(e.target.value)}
      placeholder="장면 설명을 입력하세요 (최대 500자)"
      className="w-full px-3 py-2 border border-gray-300 rounded-md"
      rows={6}
      maxLength={500}
    />
    <div className="flex justify-end gap-2">
      <button onClick={handleCancelDescription} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
        취소
      </button>
      <button onClick={handleSaveDescription} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        저장
      </button>
    </div>
  </div>
)}
```

### Phase 3: 스토리보드 "목록보기"를 장면별 상세로 이동

**파일**: 
- `components/admin/CustomerStoryModal.tsx`
- `components/admin/customers/SceneDetailView.tsx`

**변경 사항**:
1. `ListView` 컴포넌트를 `SceneDetailView`로 이동
2. 장면별 상세에 "목록보기" 탭 추가
3. 스토리보드에서 "목록보기" 제거

**구현 내용**:
```typescript
// SceneDetailView.tsx에 ListView 탭 추가
const [activeTab, setActiveTab] = useState<'images' | 'description' | 'list'>('images');

// ListView 컴포넌트를 SceneDetailView 내부로 이동하거나 props로 전달
{activeTab === 'list' && (
  <ListView 
    images={images}
    unassignedImages={unassignedImages}
    onDragStart={handleDragStart}
    onDrop={handleDrop}
    // ... 기타 props
  />
)}
```

### Phase 4: 스토리보드 메뉴 삭제 및 통합

**파일**: `components/admin/CustomerStoryModal.tsx`

**변경 사항**:
1. 상위 탭에서 "스토리보드" 탭 삭제
2. `viewMode` 상태 제거
3. `StoryboardView` 컴포넌트 제거 또는 통합
4. 스토리보드의 "장면 설명을 추가하세요..." 플레이스홀더 제거
5. 모든 기능을 "장면별 상세"로 통합

**구현 내용**:
```typescript
// 상위 탭 수정
const [activeTab, setActiveTab] = useState<'scene-detail' | 'reviews'>('scene-detail');
// 'storyboard' 탭 제거

// viewMode 상태 제거
// const [viewMode, setViewMode] = useState<'storyboard' | 'list'>('storyboard'); // 삭제

// 컨텐츠 렌더링 수정
{activeTab === 'scene-detail' ? (
  <SceneDetailView 
    customerId={customer.id}
    images={images}
    sceneDescriptions={sceneDescriptions}
    // ... 기타 props
  />
) : activeTab === 'reviews' ? (
  <ReviewTabView customerId={customer.id} />
) : null}
```

## 상세 구현 계획

### 1단계: SceneDetailView 확장

**파일**: `components/admin/customers/SceneDetailView.tsx`

**추가 기능**:
1. **미할당 미디어 섹션** (이미지, 동영상, 서류 포함)
   - 장면 목록 위 또는 아래에 표시
   - 드래그 앤 드롭 지원
   - 미할당 미디어 개수 표시
   - 타입별 배지 표시:
     - 동영상: 파란색 "동영상" 배지
     - 스캔 서류: 보라색 "서류" 배지
     - 일반 이미지: 배지 없음

2. **드래그 앤 드롭 기능**
   - 이미지/동영상/서류를 장면으로 드래그
   - 장면에서 미할당으로 드래그
   - 장면 간 이동
   - 동영상과 서류도 동일하게 처리

3. **목록보기 탭**
   - ListView 컴포넌트 통합
   - 모든 미디어 목록 표시 (이미지, 동영상, 서류)
   - 장면별 필터링
   - 타입별 필터링 (선택적)

4. **장면 설명 탭 개선**
   - 스토리보드 스타일 적용
   - 저장/취소 버튼
   - 최대 500자 제한

5. **타입별 표시 및 필터링** (선택적)
   - 사진 탭에 필터 옵션 추가: "전체", "이미지", "동영상", "서류"
   - 각 미디어 타입별 배지 표시
   - 동영상과 서류도 장면 할당 가능

### 2단계: CustomerStoryModal 정리

**파일**: `components/admin/CustomerStoryModal.tsx`

**변경 사항**:
1. **상위 탭 정리**
   - "스토리보드" 탭 제거
   - "장면별 상세", "글 목록"만 유지

2. **상태 정리**
   - `viewMode` 제거
   - `activeTab` 타입 수정

3. **컴포넌트 정리**
   - `StoryboardView` 제거 또는 SceneDetailView로 통합
   - `ListView`를 SceneDetailView로 이동

### 3단계: 데이터 공유 및 상태 관리

**고려 사항**:
- `CustomerStoryModal`에서 이미지 데이터를 로드하고 `SceneDetailView`에 전달
- 드래그 앤 드롭 핸들러를 `CustomerStoryModal`에서 정의하고 props로 전달
- 장면 설명 저장 기능은 `SceneDetailView` 내부에서 처리

## 파일 구조

### 수정할 파일
1. `components/admin/CustomerStoryModal.tsx`
   - 상위 탭 정리
   - viewMode 제거
   - StoryboardView 제거
   - SceneDetailView에 필요한 props 전달

2. `components/admin/customers/SceneDetailView.tsx`
   - 미할당 이미지 섹션 추가
   - 드래그 앤 드롭 기능 추가
   - 목록보기 탭 추가
   - 후기 탭 제거
   - 장면 설명 탭 개선

### 삭제할 컴포넌트 (선택)
- `StoryboardView` 함수 컴포넌트 (SceneDetailView로 통합)
- `UnassignedImagesSection` (SceneDetailView로 이동)

### 유지할 컴포넌트
- `ListView` (SceneDetailView로 이동)

## UI 구조 변경

### 변경 전
```
고객 스토리 관리
├── 스토리보드
│   ├── 스토리보드 (서브 메뉴)
│   │   ├── 미할당 이미지
│   │   └── 장면 1-7 (드래그 앤 드롭)
│   └── 목록보기 (서브 메뉴)
│       └── 이미지 목록
├── 장면별 상세
│   ├── 왼쪽: 장면 목록
│   └── 오른쪽: 선택된 장면
│       ├── 사진 탭
│       ├── 장면 설명 탭
│       └── 후기 탭
└── 글 목록
```

### 변경 후
```
고객 스토리 관리
├── 장면별 상세
│   ├── 왼쪽: 장면 목록
│   └── 오른쪽: 선택된 장면
│       ├── 미할당 미디어 섹션 (상단)
│       │   ├── 이미지, 동영상, 서류 모두 포함
│       │   └── 타입별 배지 표시 (동영상, 서류)
│       └── 탭
│           ├── 사진 탭 (이미지, 동영상, 서류 모두 표시)
│           │   └── 필터 옵션: 전체 / 이미지 / 동영상 / 서류 (선택적)
│           ├── 장면 설명 탭 (스토리보드 스타일)
│           └── 목록보기 탭 (모든 미디어 목록)
└── 글 목록
```

## 구현 세부사항

### 1. 미할당 이미지 섹션 추가

**위치**: SceneDetailView 오른쪽 패널 상단

**기능**:
- 미할당 이미지 그리드 표시
- 드래그 앤 드롭으로 장면에 할당
- 이미지 개수 표시

**코드 구조**:
```typescript
// 미할당 미디어 계산 (이미지, 동영상, 서류 모두 포함)
const unassignedMedia = useMemo(() => {
  return images.filter(img => !img.story_scene || img.story_scene < 1 || img.story_scene > 7);
}, [images]);

// 타입별 분류
const unassignedImages = unassignedMedia.filter(img => !img.is_scanned_document && !isVideo(img.image_url));
const unassignedVideos = unassignedMedia.filter(img => isVideo(img.image_url));
const unassignedDocuments = unassignedMedia.filter(img => img.is_scanned_document);

{/* 미할당 미디어 섹션 */}
{unassignedMedia.length > 0 && (
  <div className="mb-6 border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50">
    <h4 className="text-sm font-semibold text-blue-700 mb-3">
      📦 미할당 미디어 ({unassignedMedia.length}개)
      <span className="text-xs text-gray-600 ml-2">
        이미지: {unassignedImages.length} | 동영상: {unassignedVideos.length} | 서류: {unassignedDocuments.length}
      </span>
    </h4>
    <div className="grid grid-cols-4 gap-2">
      {unassignedMedia.map(media => {
        const isVideoFile = isVideo(media.image_url);
        const isDocument = media.is_scanned_document;
        return (
          <div
            key={media.id}
            draggable
            onDragStart={(e) => handleDragStart(e, media.id, media.image_url)}
            // ... 드래그 핸들러
            className="relative"
          >
            <MediaRenderer url={media.image_url} />
            {/* 동영상 배지 */}
            {isVideoFile && (
              <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                동영상
              </span>
            )}
            {/* 서류 배지 */}
            {isDocument && (
              <span className="absolute top-2 right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded">
                서류
              </span>
            )}
          </div>
        );
      })}
    </div>
  </div>
)}
```

### 2. 드래그 앤 드롭 기능

**필요한 핸들러**:
- `handleDragStart`: 드래그 시작 (이미지, 동영상, 서류 모두 지원)
- `handleDragOver`: 드래그 오버
- `handleDrop`: 드롭 처리 (이미지, 동영상, 서류 모두 지원)
- `handleRemoveFromScene`: 장면에서 제거

**API 호출**:
- `/api/admin/update-image-scene` (PATCH)
  - 이미지, 동영상, 서류 모두 동일한 API 사용
  - `story_scene` 필드 업데이트
- 이미지 재로드

**참고**: 
- 동영상과 서류도 `image_assets` 테이블에 저장되어 있으므로 동일한 방식으로 처리 가능
- `is_scanned_document` 필드로 서류 구분
- 파일 확장자로 동영상 구분 (`.mp4`, `.mov`, `.avi`, `.webm`, `.mkv`)

### 3. 목록보기 탭 추가

**기능**:
- 모든 미디어 목록 표시 (이미지, 동영상, 서류)
- 장면별 필터링
- 타입별 필터링 (선택적): "전체", "이미지", "동영상", "서류"
- 드래그 앤 드롭 지원
- 날짜별 정렬
- 타입별 배지 표시

**코드 구조**:
```typescript
// 타입 필터 상태
const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'image' | 'video' | 'document'>('all');

// 필터링된 미디어
const filteredMedia = useMemo(() => {
  if (mediaTypeFilter === 'all') return images;
  if (mediaTypeFilter === 'video') return images.filter(img => isVideo(img.image_url));
  if (mediaTypeFilter === 'document') return images.filter(img => img.is_scanned_document);
  return images.filter(img => !isVideo(img.image_url) && !img.is_scanned_document);
}, [images, mediaTypeFilter]);

{activeTab === 'list' && (
  <div>
    {/* 타입 필터 (선택적) */}
    <div className="mb-4 flex gap-2">
      <button onClick={() => setMediaTypeFilter('all')}>전체</button>
      <button onClick={() => setMediaTypeFilter('image')}>이미지</button>
      <button onClick={() => setMediaTypeFilter('video')}>동영상</button>
      <button onClick={() => setMediaTypeFilter('document')}>서류</button>
    </div>
    
    <ListView 
      images={filteredMedia}
      unassignedImages={unassignedImages}
      onDragStart={handleDragStart}
      onDrop={handleDrop}
      onRemoveFromScene={handleRemoveFromScene}
    />
  </div>
)}
```

### 4. 장면 설명 탭 개선

**변경 사항**:
- 스토리보드의 장면 설명 편집 UI 스타일 적용
- 저장/취소 버튼 추가
- 최대 500자 제한

### 5. 후기 탭 제거

**변경 사항**:
- `activeTab` 타입에서 'reviews' 제거
- 후기 탭 버튼 제거
- 후기 관련 코드 제거

### 6. 동영상 및 서류 처리 (추가)

**결정 사항**:
- **별도 메뉴 구성 불필요**: 이미지, 동영상, 서류가 모두 동일한 방식으로 처리됨
- 모든 미디어 타입이 `image_assets` 테이블에 저장되어 있음
- 동영상과 서류도 이미지와 동일하게 장면에 할당 가능

**구현 내용**:
1. **타입 감지 함수**:
   ```typescript
   const isVideo = (url: string | null): boolean => {
     if (!url) return false;
     const ext = url.toLowerCase().split('.').pop()?.split('?')[0] || '';
     return ['.mp4', '.mov', '.avi', '.webm', '.mkv'].includes(ext);
   };
   
   const isDocument = (media: ImageMetadata): boolean => {
     return media.is_scanned_document === true;
   };
   ```

2. **배지 표시**:
   - 동영상: 파란색 "동영상" 배지
   - 서류: 보라색 "서류" 배지 (document_type 표시)
   - 일반 이미지: 배지 없음

3. **필터링 옵션** (선택적):
   - 사진 탭과 목록보기 탭에 타입 필터 추가
   - "전체", "이미지", "동영상", "서류" 옵션

4. **드래그 앤 드롭**:
   - 동영상과 서류도 이미지와 동일하게 드래그 앤 드롭 가능
   - API는 동일하게 `/api/admin/update-image-scene` 사용

## 예상 작업 시간

- Phase 1 (미할당 미디어 및 드래그 앤 드롭): 3-4시간
  - 동영상 및 서류 타입 감지 및 배지 표시 포함
- Phase 2 (장면설정 통합 및 후기 탭 삭제): 1-2시간
- Phase 3 (목록보기 이동): 2-3시간
  - 타입별 필터링 옵션 포함 (선택적)
- Phase 4 (스토리보드 메뉴 삭제 및 통합): 2-3시간
- **총 예상 시간: 8-12시간**

**참고**: 동영상과 서류는 별도 메뉴가 아닌 기존 이미지 목록에 포함되므로 추가 작업 시간은 최소화됨

## 우선순위

**높음**: 사용자가 요청한 모든 기능이 상호 연관되어 있어 순차적으로 진행 필요

## 테스트 계획

1. **미할당 이미지 표시 테스트**
   - 장면별 상세에서 미할당 이미지가 표시되는지 확인
   - 이미지 개수가 정확한지 확인

2. **드래그 앤 드롭 테스트**
   - 미할당 이미지를 장면으로 드래그
   - 장면 이미지를 다른 장면으로 드래그
   - 장면 이미지를 미할당으로 드래그

3. **목록보기 테스트**
   - 목록보기 탭에서 모든 이미지가 표시되는지 확인
   - 드래그 앤 드롭이 작동하는지 확인

4. **장면 설명 테스트**
   - 장면 설명 편집 및 저장이 작동하는지 확인
   - 스토리보드 스타일이 적용되었는지 확인

5. **UI 정리 테스트**
   - 스토리보드 탭이 제거되었는지 확인
   - 후기 탭이 제거되었는지 확인
   - 모든 기능이 장면별 상세에서 작동하는지 확인

## 파일 목록

### 수정할 파일
1. `components/admin/CustomerStoryModal.tsx` - 메인 모달 컴포넌트 정리
2. `components/admin/customers/SceneDetailView.tsx` - 장면별 상세 뷰 확장

### 참고 파일
1. `components/admin/CustomerStoryModal.tsx` - StoryboardView, ListView 컴포넌트 (참고용)
2. `pages/api/admin/update-image-scene.ts` - 이미지 장면 업데이트 API

## 동영상 및 서류 처리 결정

### 질문: 동영상이나 서류도 추가로 입력 가능하게 추가로 메뉴 구성해야 하나?

### 답변: **별도 메뉴 구성 불필요**

**이유**:
1. **현재 구조**: 
   - 동영상과 서류도 `image_assets` 테이블에 저장됨
   - `MediaRenderer` 컴포넌트가 자동으로 타입 감지
   - 동영상과 서류도 이미지와 동일하게 `story_scene` 필드로 장면 할당 가능

2. **통합 처리**:
   - 이미지, 동영상, 서류가 모두 동일한 방식으로 처리됨
   - 드래그 앤 드롭으로 장면 할당 가능
   - 타입별 배지로 시각적 구분

3. **필터링 옵션** (선택적):
   - 필요시 타입별 필터 추가 가능 ("전체", "이미지", "동영상", "서류")
   - 별도 메뉴나 탭은 불필요

**구현 방안**:
- 미할당 미디어 섹션에 이미지, 동영상, 서류 모두 표시
- 타입별 배지로 구분 (동영상: 파란색, 서류: 보라색)
- 드래그 앤 드롭으로 장면 할당 (모든 타입 동일)
- 필터링 옵션 추가 (선택적, 사용자 요구에 따라)

## 결론

**권장 사항**:
1. ✅ **Phase 1부터 순차적으로 진행** (미할당 미디어 및 드래그 앤 드롭)
   - 동영상과 서류도 포함하여 처리
   - 타입별 배지 표시
2. ✅ **Phase 2 진행** (장면설정 통합 및 후기 탭 삭제)
3. ✅ **Phase 3 진행** (목록보기 이동)
   - 타입별 필터링 옵션 추가 (선택적)
4. ✅ **Phase 4 진행** (스토리보드 메뉴 삭제 및 통합)

**동영상 및 서류 처리**:
- ✅ 별도 메뉴 구성 불필요
- ✅ 기존 이미지 목록에 포함
- ✅ 타입별 배지로 구분
- ✅ 동일한 드래그 앤 드롭 기능 사용

이렇게 하면 모든 기능이 "장면별 상세" 메뉴에서 통합되어 사용자 경험이 개선됩니다.
