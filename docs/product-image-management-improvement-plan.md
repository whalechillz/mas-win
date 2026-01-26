# 제품 이미지 관리 개선 계획서

## 📋 개요

제품 관리 페이지의 제품 이미지 관리 기능을 개선하여 성능 데이터 이미지 관리와 유사한 기능을 제공하고, 사용성을 향상시키는 계획서입니다.

---

## 🎯 개선 목표

1. **순번 표시 및 순서 변경 기능 추가**: 성능 데이터 이미지 관리처럼 위/아래 이동 버튼 추가
2. **"삭제" → "제외" 변경**: 이미지를 완전 삭제하지 않고 노출에서만 제외
3. **갤러리 선택 모달에 삭제 기능 추가**: 갤러리에서 이미지 선택 시 삭제 가능

---

## 📝 현재 상태 분석

### 1. 제품 이미지 관리 (현재)

#### 현재 기능
- 이미지 업로드
- 갤러리에서 선택
- 대표 이미지 설정 ("대표로" 버튼)
- 이미지 삭제 ("삭제" 버튼)

#### 문제점
- 순번 표시 없음
- 순서 변경 기능 없음 (성능 데이터 이미지 관리와 다름)
- "삭제" 버튼으로 완전 삭제 (되돌릴 수 없음)
- 갤러리 선택 모달에 삭제 기능 없음

---

### 2. 성능 데이터 이미지 관리 (참고)

#### 현재 기능
- 갤러리에서 선택
- **위로 이동 (↑)** 버튼
- **아래로 이동 (↓)** 버튼
- 이미지 삭제 ("삭제" 버튼)

#### 특징
- 배열 인덱스로 순서 관리
- 위/아래 이동으로 순서 변경 가능
- 순번이 명시적으로 표시되지는 않지만, 배열 순서로 관리됨

---

### 3. 다른 곳에서 사용하는 "제외" 관련 용어

#### 확인된 용어
- **"활성" (is_active)**: 제품 활성화/비활성화 체크박스
- **"판매 가능" (is_sellable)**: 판매 가능 여부 체크박스
- **"제외" (exclude)**: 카카오 수신자 선택 등에서 사용

#### 제안 용어
- **"노출 안 함"**: 이미지를 제품 페이지에서 숨김
- **"제외"**: 간단하고 명확한 용어
- **"비활성"**: "활성"과 대응되는 용어

---

## 🔧 개선 계획

### Phase 1: 순번 표시 및 순서 변경 기능 추가

#### 1.1 순번 표시

**UI 변경:**
- 각 이미지 썸네일에 순번 표시 (1, 2, 3...)
- 성능 데이터 이미지 관리처럼 위/아래 이동 버튼 추가

**구현 위치:**
- 파일: `pages/admin/products.tsx`
- 위치: 제품 이미지 관리 그리드 섹션 (약 1914-1974번째 줄)

**코드 예시:**
```tsx
{getAllImages().map((img, index) => {
  const isMain = mainImageUrl === img;
  const fileName = getFileNameFromUrl(img);
  return (
    <div key={index} className="relative group">
      {/* 순번 표시 */}
      <div className="absolute top-1 right-1 bg-gray-800 text-white text-xs px-2 py-1 rounded z-10">
        {index + 1}
      </div>
      
      {/* 이미지 썸네일 */}
      <div className={`relative w-full h-32 bg-gray-100 rounded overflow-hidden border-2 ${
        isMain ? 'border-blue-500' : 'border-gray-300'
      }`}>
        {/* ... */}
      </div>
      
      {/* 버튼 그룹 */}
      <div className="mt-2 flex gap-1">
        {/* 위로 이동 버튼 */}
        {index > 0 && (
          <button
            type="button"
            onClick={() => handleMoveDetailImage(index, 'up')}
            className="flex-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            title="위로 이동"
          >
            ↑
          </button>
        )}
        {/* 아래로 이동 버튼 */}
        {index < getAllImages().length - 1 && (
          <button
            type="button"
            onClick={() => handleMoveDetailImage(index, 'down')}
            className="flex-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            title="아래로 이동"
          >
            ↓
          </button>
        )}
        {/* 대표로 버튼 */}
        {!isMain && (
          <button
            type="button"
            onClick={() => handleSetMainImage(img)}
            className="flex-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            title="대표 이미지로 설정"
          >
            대표로
          </button>
        )}
        {/* 제외 버튼 (삭제 대신) */}
        <button
          type="button"
          onClick={() => handleExcludeImage(img)}
          className="px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
          title="노출에서 제외"
        >
          제외
        </button>
      </div>
    </div>
  );
})}
```

#### 1.2 순서 변경 함수 확인

**현재 상태:**
- `handleMoveDetailImage` 함수가 이미 존재함 (953-966번째 줄)
- 하지만 UI에서 사용되지 않음

**수정 사항:**
- 기존 함수 활용
- UI에 위/아래 이동 버튼 추가

---

### Phase 2: "삭제" → "제외" 변경

#### 2.1 제외 기능 구현

**개념:**
- 이미지를 완전 삭제하지 않고, 제품에서만 제외
- 제외된 이미지는 `excluded_images` 배열에 저장
- 필요시 다시 포함 가능

**데이터 구조:**
```typescript
// products 테이블에 추가할 컬럼 (선택사항)
excluded_images?: string[] | null; // 제외된 이미지 URL 배열
```

**또는 간단한 방법:**
- `detail_images` 배열에서만 제거
- Storage에는 그대로 유지
- 필요시 다시 추가 가능

#### 2.2 UI 변경

**버튼 텍스트:**
- "삭제" → "제외"
- 색상: 빨간색 → 주황색 (경고 느낌, 완전 삭제보다 덜 위험)

**기능:**
- 이미지를 `detail_images` 배열에서 제거
- Storage에는 그대로 유지
- 갤러리에서 다시 선택 가능

**코드 예시:**
```tsx
const handleExcludeImage = (imageUrl: string) => {
  if (!confirm('이 이미지를 제품에서 제외하시겠습니까?\n\n(이미지는 Storage에 그대로 유지되며, 나중에 다시 추가할 수 있습니다.)')) {
    return;
  }
  
  // mainImageUrl인 경우
  if (mainImageUrl === imageUrl) {
    const remainingImages = detailImages;
    if (remainingImages.length > 0) {
      setMainImageUrl(remainingImages[0]);
      setDetailImages(remainingImages.slice(1));
    } else {
      setMainImageUrl('');
    }
  } else {
    // detailImages에서 제거
    setDetailImages(detailImages.filter(img => img !== imageUrl));
  }
};
```

---

### Phase 3: 갤러리 선택 모달에 삭제 기능 추가

#### 3.1 FolderImagePicker 컴포넌트 확인

**현재 상태:**
- `FolderImagePicker` 컴포넌트에 `enableDelete` prop이 있음
- `onDelete` 콜백 지원

**현재 사용:**
- 제품 합성 관리: `enableDelete={true}` 사용
- 고객 이미지 관리: `enableDelete={true}` 사용
- **제품 이미지 관리: `enableDelete` 미사용**

#### 3.2 구현

**파일:** `pages/admin/products.tsx`

**변경 사항:**
```tsx
<FolderImagePicker
  isOpen={showGalleryPicker}
  onClose={() => {
    setShowGalleryPicker(false);
    setGalleryPickerMode(null);
  }}
  onSelect={handleGalleryImageSelect}
  folderPath={
    galleryPickerMode === 'performance' 
      ? (getPerformanceFolderPath() || '')
      : (getDetailFolderPath() || '')
  }
  title={
    galleryPickerMode === 'performance'
      ? '성능 데이터 이미지 선택'
      : '갤러리에서 이미지 선택'
  }
  // ✅ 삭제 기능 활성화
  enableDelete={true}
  onDelete={async (imageUrl: string) => {
    // Storage에서 삭제
    const response = await fetch('/api/admin/delete-image', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '이미지 삭제에 실패했습니다.');
    }

    // ✅ 현재 제품의 이미지 목록에서도 자동 제거
    const allImages = getAllImages();
    if (allImages.includes(imageUrl)) {
      if (mainImageUrl === imageUrl) {
        const remainingImages = detailImages;
        if (remainingImages.length > 0) {
          setMainImageUrl(remainingImages[0]);
          setDetailImages(remainingImages.slice(1));
        } else {
          setMainImageUrl('');
        }
      } else {
        setDetailImages(detailImages.filter(img => img !== imageUrl));
      }
    }
  }}
/>
```

---

## 📊 비교표

### 제품 이미지 관리

| 항목 | 현재 | 개선 후 |
|------|------|---------|
| **순번 표시** | ❌ | ✅ (1, 2, 3...) |
| **순서 변경** | ❌ | ✅ (위/아래 이동) |
| **삭제 버튼** | ✅ (완전 삭제) | ❌ |
| **제외 버튼** | ❌ | ✅ (노출만 제외) |
| **갤러리에서 삭제** | ❌ | ✅ |

### 성능 데이터 이미지 관리

| 항목 | 현재 | 변경 |
|------|------|------|
| **순서 변경** | ✅ | 유지 |
| **삭제 버튼** | ✅ | 유지 (성능 데이터는 삭제 유지) |

---

## 🔧 구현 계획

### Phase 1: 순번 표시 및 순서 변경 기능 추가

#### 1.1 UI 수정
- [ ] 제품 이미지 관리 그리드에 순번 표시 추가
- [ ] 위로 이동 (↑) 버튼 추가
- [ ] 아래로 이동 (↓) 버튼 추가
- [ ] `handleMoveDetailImage` 함수 확인 및 수정 (필요시)

#### 1.2 테스트
- [ ] 순번 표시 확인
- [ ] 위/아래 이동 기능 테스트
- [ ] 대표 이미지 설정 확인

---

### Phase 2: "삭제" → "제외" 변경

#### 2.1 함수 수정
- [ ] `handleDeleteImage` 함수를 `handleExcludeImage`로 변경
- [ ] Storage 삭제 로직 제거
- [ ] 배열에서만 제거하는 로직으로 변경

#### 2.2 UI 수정
- [ ] "삭제" 버튼 → "제외" 버튼으로 변경
- [ ] 버튼 색상 변경 (빨간색 → 주황색)
- [ ] 확인 메시지 수정

#### 2.3 테스트
- [ ] 제외 기능 테스트
- [ ] 제외된 이미지가 Storage에 유지되는지 확인
- [ ] 제외된 이미지를 다시 추가할 수 있는지 확인

---

### Phase 3: 갤러리 선택 모달에 삭제 기능 추가

#### 3.1 FolderImagePicker 설정
- [ ] `enableDelete={true}` 추가
- [ ] `onDelete` 콜백 구현
- [ ] 제품 이미지 목록에서 자동 제거 로직 추가

#### 3.2 테스트
- [ ] 갤러리 선택 모달에서 삭제 기능 확인
- [ ] 삭제 후 제품 이미지 목록 자동 업데이트 확인

---

## ⚠️ 주의사항

### 1. 데이터 일관성
- 제외된 이미지는 Storage에 유지되므로, 나중에 다시 추가 가능
- 완전 삭제가 필요한 경우는 갤러리 선택 모달에서 삭제 사용

### 2. 성능 데이터 이미지 관리
- 성능 데이터 이미지 관리는 기존 "삭제" 기능 유지
- 제품 이미지 관리만 "제외"로 변경

### 3. 하위 호환성
- 기존 `handleDeleteImage` 함수는 제거하지 않고 `handleExcludeImage`로 변경
- 필요시 완전 삭제 기능은 갤러리 선택 모달에서 사용

---

## 📝 파일 변경 목록

### 수정 파일
- `pages/admin/products.tsx`: 
  - 순번 표시 및 순서 변경 UI 추가
  - `handleDeleteImage` → `handleExcludeImage` 변경
  - `FolderImagePicker`에 `enableDelete` 및 `onDelete` 추가

### 참고 파일
- `components/admin/FolderImagePicker.tsx`: 삭제 기능 지원 확인
- `pages/admin/products.tsx`: 성능 데이터 이미지 관리 (참고용)

---

## 🚀 실행 순서

1. **Phase 1 실행**
   - 순번 표시 UI 추가
   - 위/아래 이동 버튼 추가
   - 테스트

2. **Phase 2 실행**
   - `handleExcludeImage` 함수 구현
   - UI 버튼 변경
   - 테스트

3. **Phase 3 실행**
   - `FolderImagePicker`에 삭제 기능 추가
   - 테스트

---

## 📊 예상 결과

### 제품 이미지 관리 UI

**이전:**
```
[이미지 썸네일]
[대표로] [삭제]
```

**이후:**
```
[1] [이미지 썸네일]
[↑] [↓] [대표로] [제외]
```

### 갤러리 선택 모달

**이전:**
- 이미지 선택만 가능
- 삭제 기능 없음

**이후:**
- 이미지 선택 가능
- 삭제 기능 추가 (각 썸네일에 삭제 버튼)

---

## 💡 추가 고려사항

### 1. 제외된 이미지 복구 기능
- 제외된 이미지를 다시 추가하는 기능 (선택사항)
- 제외된 이미지 목록 표시 (선택사항)

### 2. 순번 표시 스타일
- 성능 데이터 이미지 관리와 동일한 스타일
- 또는 더 명확한 순번 배지

### 3. 드래그 앤 드롭
- 향후 드래그 앤 드롭으로 순서 변경 (선택사항)
