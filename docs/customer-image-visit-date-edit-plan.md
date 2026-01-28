# 고객 이미지 방문일자 수정 기능 개발 계획

## 현재 상황

### 이미지 표시 위치
1. **고객 이미지 관리 모달** (`CustomerImageModal`):
   - 이미지 클릭 시 확대 모달 표시
   - `selectedImageUrl`, `selectedImageMetadata` 상태로 관리
   - `ImageMetadataOverlay` 컴포넌트로 메타데이터 표시 (읽기 전용)

2. **이미지 확대 모달**:
   - 위치: `pages/admin/customers/index.tsx` (3718-3756줄)
   - 현재: 이미지와 메타데이터 오버레이만 표시
   - 수정 기능 없음

### 방문일자 저장 방식
- `ai_tags`에 `visit-YYYY-MM-DD` 형식으로 저장
- `file_path`에 날짜 폴더 포함: `originals/customers/{folderName}/{YYYY-MM-DD}/{filename}`
- 두 곳 모두 업데이트 필요

## 개발 위치 및 계획

### 옵션 1: 이미지 확대 모달에 수정 기능 추가 (권장) ⭐

**위치**: `pages/admin/customers/index.tsx` (3718-3756줄)

**장점**:
- 이미지 클릭 시 바로 수정 가능
- 직관적인 UX
- 기존 모달 구조 활용

**구현 내용**:
1. 이미지 확대 모달에 "방문일자 수정" 버튼 추가
2. 날짜 선택 모달/인풋 추가
3. 수정 API 호출
4. `file_path`와 `ai_tags` 모두 업데이트

### 옵션 2: ImageMetadataOverlay에 수정 기능 추가

**위치**: `components/admin/ImageMetadataOverlay.tsx`

**장점**:
- 메타데이터 표시와 수정이 한 곳에
- 재사용 가능

**단점**:
- 오버레이에 수정 기능 추가 시 복잡도 증가
- 클릭 이벤트 처리 복잡

### 옵션 3: 별도 이미지 편집 모달 생성

**위치**: `components/admin/CustomerImageEditModal.tsx` (신규)

**장점**:
- 기능 분리
- 확장 가능 (다른 메타데이터도 수정 가능)

**단점**:
- 추가 컴포넌트 필요
- 모달 중첩 가능성

## 권장 방안: 옵션 1 (이미지 확대 모달에 수정 기능 추가)

### 구현 계획

#### Phase 1: UI 추가
**파일**: `pages/admin/customers/index.tsx`

**위치**: 이미지 확대 모달 (3718-3756줄)

**추가 내용**:
1. 방문일자 표시 및 수정 버튼
2. 날짜 선택 인풋 (기존 방문일자 인풋과 동일한 스타일)
3. 저장/취소 버튼

#### Phase 2: API 개발
**파일**: `pages/api/admin/update-customer-image-visit-date.ts` (신규)

**기능**:
1. 이미지 ID로 이미지 조회
2. `ai_tags`에서 `visit-{oldDate}` 태그 제거
3. `ai_tags`에 `visit-{newDate}` 태그 추가
4. `file_path` 업데이트 (Storage 파일 이동 또는 `file_path`만 업데이트)
5. `updated_at` 업데이트

**주의사항**:
- Storage 파일 이동은 복잡하므로 `file_path`만 업데이트하는 것이 간단
- 또는 Storage 파일도 실제로 이동 (더 정확하지만 복잡)

#### Phase 3: 프론트엔드 연동
**파일**: `pages/admin/customers/index.tsx`

**추가 내용**:
1. 방문일자 수정 핸들러
2. API 호출
3. 성공 시 이미지 목록 새로고침
4. 날짜 필터 업데이트

### 수정 코드 예시

#### UI 추가 (이미지 확대 모달)
```tsx
{selectedImageUrl && (
  <div className="fixed inset-0 bg-black bg-opacity-90 z-[100] flex items-center justify-center p-4">
    {/* 닫기 버튼 */}
    <button onClick={...}>×</button>
    
    {/* 이미지 */}
    <img src={selectedImageUrl} ... />
    
    {/* 메타데이터 오버레이 */}
    {selectedImageMetadata && (
      <ImageMetadataOverlay metadata={selectedImageMetadata} />
    )}
    
    {/* 방문일자 수정 섹션 (신규) */}
    <div className="absolute bottom-20 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        방문일자
      </label>
      <div className="flex gap-2">
        <input
          type="date"
          value={editingVisitDate || selectedImageMetadata?.visit_date || ''}
          onChange={(e) => setEditingVisitDate(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-md"
        />
        <button
          onClick={handleUpdateVisitDate}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          저장
        </button>
        <button
          onClick={() => setEditingVisitDate(null)}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
        >
          취소
        </button>
      </div>
    </div>
  </div>
)}
```

#### API 개발
```typescript
// pages/api/admin/update-customer-image-visit-date.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const { imageId, newVisitDate, customerId } = req.body;

  // 1. 이미지 조회
  const { data: image } = await supabase
    .from('image_assets')
    .select('*')
    .eq('id', imageId)
    .single();

  // 2. ai_tags에서 visit-{oldDate} 태그 제거 및 visit-{newDate} 추가
  const currentTags = image.ai_tags || [];
  const updatedTags = currentTags
    .filter(tag => !tag.startsWith('visit-'))
    .concat([`visit-${newVisitDate}`]);

  // 3. file_path 업데이트 (날짜 폴더 변경)
  const oldFilePath = image.file_path;
  const newFilePath = oldFilePath.replace(
    /\/(\d{4}-\d{2}-\d{2})\//,
    `/${newVisitDate}/`
  );

  // 4. DB 업데이트
  const { data: updatedImage } = await supabase
    .from('image_assets')
    .update({
      ai_tags: updatedTags,
      file_path: newFilePath,
      updated_at: new Date().toISOString()
    })
    .eq('id', imageId)
    .select()
    .single();

  return res.status(200).json({ success: true, image: updatedImage });
}
```

## 예상 작업 시간

- UI 추가: 1시간
- API 개발: 1시간
- 프론트엔드 연동: 1시간
- 테스트: 30분
- **총 예상 시간: 3.5시간**

## 테스트 계획

1. **방문일자 수정 테스트**:
   - 이미지 클릭 → 확대 모달 열기
   - 방문일자 수정 버튼 클릭
   - 새 날짜 선택 및 저장
   - 이미지 목록 새로고침 확인
   - 날짜 필터에 새 날짜가 나타나는지 확인

2. **데이터 일관성 테스트**:
   - `ai_tags`에 `visit-{newDate}` 태그가 추가되었는지 확인
   - `file_path`가 새 날짜 폴더로 업데이트되었는지 확인
   - 기존 `visit-{oldDate}` 태그가 제거되었는지 확인

3. **에러 처리 테스트**:
   - 잘못된 날짜 형식 입력
   - 네트워크 오류 시나리오
   - 이미지가 없는 경우
