# 고객 이미지 관리 탭 최종 수정 계획

## 문제 분석

### 문제 1: 서류가 이미지 탭에 여전히 표시됨

**현상**:
- "이미지" 탭을 클릭해도 서류가 여전히 표시됨
- 서류 2장이 이미지 탭에 포함되어 있음
- 서류 탭으로 마이그레이션이 제대로 되지 않음

**원인 분석**:
1. **필터링 로직 문제**
   - `filteredMediaByTab`에서 이미지 탭일 때 서류를 제외하는 로직이 제대로 작동하지 않음
   - `images` 계산 시 서류 분류 로직이 `document_type`을 고려하지 않았을 가능성

2. **데이터 분류 문제**
   - `images`, `videos`, `documents` 분류 시 `document_type`이 있는 경우를 놓쳤을 가능성
   - 서류가 `is_scanned_document: false`이지만 `document_type`이 있는 경우

### 문제 2: "날짜별", "타입별", "전체" 필터 버튼이 불필요함

**현상**:
- 이미지 탭에서 "날짜별", "타입별", "전체" 버튼이 여전히 표시됨
- 탭 구조로 변경했으므로 이 필터들은 불필요함
- 사용자 혼란을 야기할 수 있음

**원인 분석**:
- 이미지 탭에서만 보이도록 조건부 렌더링했지만, 사용자는 완전히 제거를 원함
- 탭 구조로 변경했으므로 날짜별/타입별 보기는 불필요

## 요구사항

### 1. 서류 마이그레이션 완료
- 이미지 탭에서 서류가 완전히 제외되어야 함
- 서류는 서류 탭에만 표시되어야 함
- 서류 분류 로직이 `is_scanned_document`와 `document_type` 모두를 고려해야 함

### 2. 불필요한 필터 버튼 제거
- "날짜별", "타입별", "전체" 버튼 완전 제거
- 탭 구조로 변경했으므로 이 필터들은 더 이상 필요 없음

## 구현 계획

### Phase 1: 서류 분류 로직 수정 및 마이그레이션

**파일**: `pages/admin/customers/index.tsx`

**수정 내용**:

1. **이미지/서류 분류 로직 개선**
   ```typescript
   // 현재 코드 확인 및 수정
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

2. **디버깅 로그 추가**
   ```typescript
   console.log('🔍 [미디어 분류] 결과:', {
     total: allMedia.length,
     images: imgs.length,
     videos: vids.length,
     documents: docs.length,
     misclassified: all.filter(img => {
       const isVideoFile = isVideo(img.image_url);
       const isDoc = img.is_scanned_document === true || 
                     (img.document_type !== null && 
                      img.document_type !== undefined && 
                      img.document_type !== '');
       const shouldBeImage = !isVideoFile && !isDoc;
       const shouldBeDoc = isDoc;
       // 이미지로 분류되었지만 실제로는 서류인 경우
       return imgs.includes(img) && shouldBeDoc;
     }).length
   });
   ```

3. **필터링된 미디어 확인**
   ```typescript
   const filteredMediaByTab = useMemo(() => {
     console.log('🔍 [탭 필터] 필터링 시작:', {
       activeMediaTab,
       totalImages: images.length,
       totalVideos: videos.length,
       totalDocuments: documents.length
     });
     
     if (activeMediaTab === 'all') {
       return allMedia;
     } else if (activeMediaTab === 'image') {
       const filtered = images;
       console.log('✅ [탭 필터] 이미지 탭 결과:', {
         count: filtered.length,
         hasDocuments: filtered.some(img => {
           const isDoc = img.is_scanned_document === true || 
                         (img.document_type !== null && 
                          img.document_type !== undefined && 
                          img.document_type !== '');
           return isDoc;
         })
       });
       return filtered;
     } else if (activeMediaTab === 'video') {
       return videos;
     } else if (activeMediaTab === 'document') {
       return documents;
     }
     return allMedia;
   }, [allMedia, images, videos, documents, activeMediaTab]);
   ```

### Phase 2: 불필요한 필터 버튼 제거

**파일**: `pages/admin/customers/index.tsx`

**수정 내용**:

1. **"날짜별", "타입별", "전체" 버튼 완전 제거**
   ```typescript
   // 현재 코드 (3009-3062줄 근처)
   {/* 보기 모드 선택 (이미지 탭일 때만) */}
   {activeMediaTab === 'image' && filteredMediaByTabWithDate.length > 0 && (
     <div className="flex gap-2 flex-wrap">
       <button onClick={() => setViewMode('date')}>날짜별</button>
       <button onClick={() => setViewMode('type')}>타입별</button>
       <button onClick={() => setViewMode('all')}>전체</button>
     </div>
   )}
   
   // 수정 후: 완전히 제거
   // 이 섹션 전체를 삭제
   ```

2. **날짜별/타입별 보기 로직 제거**
   ```typescript
   // 현재 코드 (3074-3326줄 근처)
   {/* 날짜별 보기 (이미지 탭일 때만) */}
   {activeMediaTab === 'image' && viewMode === 'date' && (
     // 날짜별 그룹화 로직
   )}
   
   {/* 타입별 보기 (이미지 탭일 때만) */}
   {activeMediaTab === 'image' && viewMode === 'type' && (
     // 타입별 그룹화 로직
   )}
   
   // 수정 후: 모두 제거하고 전체 보기만 유지
   ```

3. **전체 보기만 유지**
   ```typescript
   // 수정 후: 모든 탭에서 동일한 그리드 레이아웃 사용
   <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
     {filteredMediaByTabWithDate.map((img: any, index: number) => {
       // 미디어 렌더링 로직
     })}
   </div>
   ```

4. **viewMode 상태 제거 (더 이상 필요 없음)**
   ```typescript
   // 제거할 상태
   const [viewMode, setViewMode] = useState<'all' | 'date' | 'type'>('date');
   ```

### Phase 3: 날짜 필터 유지 (선택적)

**고려사항**:
- 날짜 필터는 유지할 수 있음 (탭과 독립적으로 작동)
- 또는 완전히 제거할 수도 있음
- 사용자 요구사항에 따라 결정

**현재 구조**:
- 날짜 필터는 탭 위에 별도로 표시됨
- 탭별 필터링 후 날짜 필터가 적용됨

## 파일 구조

### 수정할 파일

1. **`pages/admin/customers/index.tsx`**
   - 서류 분류 로직 개선
   - 이미지/서류 분류 로직 디버깅
   - "날짜별", "타입별", "전체" 버튼 제거
   - 날짜별/타입별 보기 로직 제거
   - viewMode 상태 제거

### 참고 파일

1. `components/admin/customers/SceneDetailView.tsx` - 서류 분류 로직 참고
2. `pages/api/admin/upload-customer-image.js` - 이미지 데이터 구조

## 예상 작업 시간

- Phase 1 (서류 분류 로직 수정): 1-2시간
- Phase 2 (필터 버튼 제거): 1시간
- 테스트 및 디버깅: 1시간
- **총 예상 시간: 3-4시간**

## 우선순위

**높음**: 사용자가 직접 보고한 문제로 즉시 수정 필요

## 테스트 계획

### Phase 1 테스트

1. **서류 분류 테스트**
   - 이미지 탭 클릭 시 서류가 표시되지 않는지 확인
   - 서류 탭 클릭 시 서류만 표시되는지 확인
   - 콘솔 로그로 분류 결과 확인

2. **마이그레이션 테스트**
   - 기존에 이미지 탭에 있던 서류가 서류 탭으로 이동했는지 확인
   - 서류 개수가 올바르게 계산되는지 확인

### Phase 2 테스트

1. **필터 버튼 제거 테스트**
   - "날짜별", "타입별", "전체" 버튼이 더 이상 표시되지 않는지 확인
   - 모든 탭에서 일관된 그리드 레이아웃이 표시되는지 확인

2. **날짜 필터 테스트**
   - 날짜 필터가 탭과 독립적으로 작동하는지 확인
   - 각 탭에서 날짜 필터가 올바르게 적용되는지 확인

## 디버깅 로그 추가

서류 분류 문제 디버깅을 위해 상세한 로그 추가:
- 미디어 분류 결과 (이미지/동영상/서류 개수)
- 탭별 필터링 결과
- 잘못 분류된 항목 확인
- 각 미디어 항목의 `is_scanned_document` 및 `document_type` 값
