# 고객 스토리 관리 서류 분류 및 고객 이미지 관리 탭 개선 계획

## 문제 분석

### 문제 1: 고객 스토리 관리 - 우측 이미지 탭에 서류가 분류되지 않음

**현상**:
- "이미지" 필터가 활성화되어 있을 때 서류처럼 보이는 항목들이 표시되지만 "서류" 배지가 없음
- "서류" 필터를 클릭하면 미할당 박스가 사라지고 서류가 표시되지 않음
- 서류가 제대로 분류되지 않아서 이미지 필터에서도 나타나고, 서류 필터에서는 나타나지 않음

**원인 분석**:
1. **서류 분류 로직 문제**
   - `isDocument` 변수가 `media.is_scanned_document`만 체크하고 있음
   - `document_type` 필드가 있는 경우를 고려하지 않음
   - 서류 배지 표시 조건이 `isDocument && !isVideoFile`인데, `isDocument`가 제대로 계산되지 않음

2. **필터링 로직 문제**
   - 이미지 필터에서 서류를 제외하는 로직이 제대로 작동하지 않음
   - 서류 필터에서 서류를 찾는 로직이 제대로 작동하지 않음

3. **미할당 미디어 박스 조건부 렌더링**
   - `filteredUnassignedMedia.length > 0` 조건으로 인해 필터링 결과가 0이면 섹션이 숨겨짐
   - 서류가 제대로 필터링되지 않아서 결과가 0개로 계산됨

### 문제 2: 고객 이미지 관리 - 탭 형태로 변경 요청

**현상**:
- 현재: "업로드된 미디어(12개)" / "업로드된 이미지 (9개)" / "업로드된 동영상(1개)" / "업로드된 서류(2개)"를 섹션으로 표시
- 요청: 탭 형태로 변경하고 "업로드된"이라는 단어 삭제

**요구사항**:
- "미디어(12개)", "이미지(9개)", "동영상(1개)", "서류(2개)" 탭으로 변경
- 각 탭을 클릭하면 해당 타입의 미디어만 표시
- 탭 형태로 UI 개선

## 구현 계획

### Phase 1: 고객 스토리 관리 서류 분류 수정

**파일**: `components/admin/customers/SceneDetailView.tsx`

**수정 내용**:

1. **서류 판단 로직 개선** (미할당 미디어 섹션)
   ```typescript
   // 현재 코드 (문제)
   const isDocument = media.is_scanned_document;
   
   // 수정 후
   const isDocument = media.is_scanned_document === true || 
                      (media.document_type !== null && 
                       media.document_type !== undefined && 
                       media.document_type !== '');
   ```

2. **서류 배지 표시 조건 수정**
   ```typescript
   // 현재 코드
   {isDocument && !isVideoFile && (
     <span className="absolute top-2 right-2 z-10 px-2 py-1 text-[10px] font-semibold rounded-md bg-purple-500 text-white shadow-lg">
       서류
     </span>
   )}
   
   // 수정 후 (isDocument 계산 로직 개선 후 동일하게 유지)
   {isDocument && !isVideoFile && (
     <span className="absolute top-2 right-2 z-10 px-2 py-1 text-[10px] font-semibold rounded-md bg-purple-500 text-white shadow-lg">
       서류
     </span>
   )}
   ```

3. **이미지 필터에서 서류 제외 로직 확인**
   ```typescript
   // filteredUnassignedMedia에서 이미지 필터 로직 확인
   else if (mediaTypeFilter === 'image') {
     filtered = unassignedMedia.filter(img => {
       const isVideoFile = isVideo(img.image_url);
       const isDoc = img.is_scanned_document === true || 
                     (img.document_type !== null && 
                      img.document_type !== undefined && 
                      img.document_type !== '');
       return !isVideoFile && !isDoc;
     });
   }
   ```

4. **장면 이미지 탭에서도 서류 분류 로직 적용**
   ```typescript
   // 장면 이미지 탭에서도 동일한 로직 적용
   const isDocument = img.is_scanned_document === true || 
                      (img.document_type !== null && 
                       img.document_type !== undefined && 
                       img.document_type !== '');
   ```

### Phase 2: 고객 이미지 관리 탭 형태로 변경

**파일**: 고객 이미지 관리 컴포넌트 (파일명 확인 필요)

**수정 내용**:

1. **섹션을 탭으로 변경**
   ```typescript
   // 현재 구조 (섹션)
   <div>
     <h3>업로드된 미디어 (12개)</h3>
     {/* 미디어 그리드 */}
   </div>
   <div>
     <h3>업로드된 이미지 (9개)</h3>
     {/* 이미지 그리드 */}
   </div>
   <div>
     <h3>업로드된 동영상 (1개)</h3>
     {/* 동영상 그리드 */}
   </div>
   <div>
     <h3>업로드된 서류 (2개)</h3>
     {/* 서류 그리드 */}
   </div>
   
   // 수정 후 (탭)
   <div>
     <div className="border-b border-gray-200 mb-4">
       <nav className="flex space-x-4">
         <button
           onClick={() => setActiveMediaTab('all')}
           className={`py-2 px-1 border-b-2 font-medium text-sm ${
             activeMediaTab === 'all'
               ? 'border-blue-500 text-blue-600'
               : 'border-transparent text-gray-500 hover:text-gray-700'
           }`}
         >
           미디어 ({totalMediaCount}개)
         </button>
         <button
           onClick={() => setActiveMediaTab('image')}
           className={`py-2 px-1 border-b-2 font-medium text-sm ${
             activeMediaTab === 'image'
               ? 'border-blue-500 text-blue-600'
               : 'border-transparent text-gray-500 hover:text-gray-700'
           }`}
         >
           이미지 ({imageCount}개)
         </button>
         <button
           onClick={() => setActiveMediaTab('video')}
           className={`py-2 px-1 border-b-2 font-medium text-sm ${
             activeMediaTab === 'video'
               ? 'border-blue-500 text-blue-600'
               : 'border-transparent text-gray-500 hover:text-gray-700'
           }`}
         >
           동영상 ({videoCount}개)
         </button>
         <button
           onClick={() => setActiveMediaTab('document')}
           className={`py-2 px-1 border-b-2 font-medium text-sm ${
             activeMediaTab === 'document'
               ? 'border-blue-500 text-blue-600'
               : 'border-transparent text-gray-500 hover:text-gray-700'
           }`}
         >
           서류 ({documentCount}개)
         </button>
       </nav>
     </div>
     
     {/* 탭별 콘텐츠 */}
     {activeMediaTab === 'all' && (
       <div className="grid grid-cols-4 gap-4">
         {/* 전체 미디어 표시 */}
       </div>
     )}
     {activeMediaTab === 'image' && (
       <div className="grid grid-cols-4 gap-4">
         {/* 이미지만 표시 */}
       </div>
     )}
     {activeMediaTab === 'video' && (
       <div className="grid grid-cols-4 gap-4">
         {/* 동영상만 표시 */}
       </div>
     )}
     {activeMediaTab === 'document' && (
       <div className="grid grid-cols-4 gap-4">
         {/* 서류만 표시 */}
       </div>
     )}
   </div>
   ```

2. **상태 관리 추가**
   ```typescript
   const [activeMediaTab, setActiveMediaTab] = useState<'all' | 'image' | 'video' | 'document'>('all');
   ```

3. **미디어 분류 로직 수정** (현재 `images`와 `documents` 분리 로직 개선)
   ```typescript
   // 현재 코드 (2427-2430줄)
   const { images, documents } = useMemo(() => {
     const imgs = uploadedImages.filter(img => !img.is_scanned_document);
     const docs = uploadedImages.filter(img => img.is_scanned_document === true);
     return { images: imgs, documents: docs };
   }, [uploadedImages]);
   
   // 수정 후 (동영상 분리 추가)
   const { images, videos, documents, allMedia } = useMemo(() => {
     const all = uploadedImages;
     const imgs = all.filter(img => {
       const isVideoFile = isVideo(img.image_url);
       const isDoc = img.is_scanned_document === true || 
                     (img.document_type !== null && 
                      img.document_type !== undefined && 
                      img.document_type !== '');
       return !isVideoFile && !isDoc;
     });
     const vids = all.filter(img => isVideo(img.image_url));
     const docs = all.filter(img => {
       const isDoc = img.is_scanned_document === true;
       const hasDocumentType = img.document_type !== null && 
                               img.document_type !== undefined && 
                               img.document_type !== '';
       return isDoc || hasDocumentType;
     });
     return { images: imgs, videos: vids, documents: docs, allMedia: all };
   }, [uploadedImages]);
   ```

4. **탭별 필터링 로직**
   ```typescript
   const filteredMediaByTab = useMemo(() => {
     if (activeMediaTab === 'all') {
       return allMedia;
     } else if (activeMediaTab === 'image') {
       return images;
     } else if (activeMediaTab === 'video') {
       return videos;
     } else if (activeMediaTab === 'document') {
       return documents;
     }
     return allMedia;
   }, [allMedia, images, videos, documents, activeMediaTab]);
   ```

5. **개수 계산**
   ```typescript
   const totalMediaCount = allMedia.length;
   const imageCount = images.length;
   const videoCount = videos.length;
   const documentCount = documents.length;
   ```

## 파일 구조

### 수정할 파일

1. **`components/admin/customers/SceneDetailView.tsx`**
   - 서류 분류 로직 개선 (미할당 미디어 섹션)
   - 서류 분류 로직 개선 (장면 이미지 탭)
   - 서류 배지 표시 조건 수정

2. **`pages/admin/customers/index.tsx`** - `CustomerImageModal` 컴포넌트
   - 섹션을 탭으로 변경
   - "업로드된" 단어 삭제
   - 탭별 필터링 로직 추가
   - 동영상 섹션 추가 (현재는 이미지 섹션에 포함되어 있음)

### 참고 파일

1. `components/admin/MediaRenderer.tsx` - 미디어 타입 감지 로직
2. `pages/api/admin/upload-customer-image.js` - 이미지 데이터 구조

## 예상 작업 시간

- Phase 1 (서류 분류 수정): 1-2시간
- Phase 2 (탭 형태로 변경): 2-3시간
- 테스트 및 디버깅: 1-2시간
- **총 예상 시간: 4-7시간**

## 우선순위

**높음**: 사용자가 직접 보고한 문제로 즉시 수정 필요

## 테스트 계획

### Phase 1 테스트

1. **서류 분류 테스트**
   - "이미지" 필터 활성화 시 서류가 표시되지 않는지 확인
   - "서류" 필터 활성화 시 서류가 정상적으로 표시되는지 확인
   - 서류 배지가 올바르게 표시되는지 확인

2. **미할당 미디어 박스 테스트**
   - "서류" 필터 클릭 시 미할당 박스가 정상적으로 표시되는지 확인
   - 서류가 있을 때 박스가 사라지지 않는지 확인

### Phase 2 테스트

1. **탭 기능 테스트**
   - 각 탭 클릭 시 해당 타입의 미디어만 표시되는지 확인
   - 탭별 개수가 올바르게 표시되는지 확인
   - "업로드된" 단어가 제거되었는지 확인

2. **필터링 테스트**
   - 각 탭에서 올바른 미디어 타입만 표시되는지 확인
   - 서류 탭에서 서류가 정상적으로 표시되는지 확인

## 디버깅 로그 추가

서류 분류 문제 디버깅을 위해 상세한 로그 추가:
- 각 미디어 항목의 `is_scanned_document` 및 `document_type` 값 확인
- 서류 판단 로직 결과 확인
- 필터링 결과 상세 정보
