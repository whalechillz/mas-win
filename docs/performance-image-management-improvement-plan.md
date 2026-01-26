# 성능 데이터 이미지 관리 개선 계획서

## 📋 개요

성능 데이터 이미지 관리에 제품 이미지 관리와 동일한 "제외" 및 "삭제" 기능을 추가하는 계획서입니다.

---

## 🎯 개선 목표

1. **"삭제" → "제외" 및 "삭제" 분리**: 제품 이미지 관리와 동일하게 제외와 삭제 기능 분리
2. **갤러리 선택 모달에 삭제 기능 추가**: 성능 데이터 이미지 선택 모달에서도 삭제 가능
3. **일관된 UX**: 제품 이미지 관리와 동일한 사용자 경험 제공

---

## 📝 현재 상태 분석

### 성능 데이터 이미지 관리 (현재)

#### 현재 기능
- 갤러리에서 선택
- 위로 이동 (↑) 버튼
- 아래로 이동 (↓) 버튼
- 이미지 삭제 ("삭제" 버튼) - **Storage에서 완전 삭제**

#### 문제점
- "삭제" 버튼만 있어서 실수로 완전 삭제할 위험
- 제외 기능 없음 (제품 이미지 관리와 다름)
- 갤러리 선택 모달에 삭제 기능 없음

---

### 제품 이미지 관리 (참고)

#### 현재 기능
- 순번 표시 (1, 2, 3...)
- 위로 이동 (↑) 버튼
- 아래로 이동 (↓) 버튼
- 대표 이미지 설정 ("대표로" 버튼)
- **"제외" 버튼** (Storage 유지, 배열에서만 제거)
- 갤러리 선택 모달에 삭제 기능

#### 특징
- 제외와 삭제가 분리되어 있음
- 제외된 이미지는 나중에 다시 추가 가능
- 완전 삭제는 갤러리 모달에서만 가능

---

## 🔧 개선 계획

### Phase 1: "삭제" → "제외" 및 "삭제" 분리

#### 1.1 제외 기능 구현

**개념:**
- 이미지를 완전 삭제하지 않고, 성능 데이터 이미지 목록에서만 제외
- 제외된 이미지는 `performance_images` 배열에서만 제거
- Storage에는 그대로 유지
- 필요시 다시 추가 가능

**구현:**
```tsx
// 성능 데이터 이미지 제외 (Storage에는 유지, 배열에서만 제거)
const handleExcludePerformanceImage = (imageUrl: string) => {
  if (!confirm('이 이미지를 성능 데이터에서 제외하시겠습니까?\n\n(이미지는 Storage에 그대로 유지되며, 나중에 다시 추가할 수 있습니다.)')) {
    return;
  }
  
  setPerformanceImages(performanceImages.filter(img => img !== imageUrl));
};
```

#### 1.2 삭제 기능 유지 (갤러리 모달용)

**개념:**
- 완전 삭제는 갤러리 선택 모달에서만 가능
- Storage에서 영구적으로 삭제
- 제품 이미지 관리와 동일한 패턴

**구현:**
```tsx
// 성능 데이터 이미지 삭제 (Storage에서도 삭제) - 갤러리 선택 모달에서 사용
const handleDeletePerformanceImage = async (imageUrl: string) => {
  if (!confirm('정말로 이 이미지를 삭제하시겠습니까?\n\n⚠️ Supabase Storage에서도 영구적으로 삭제됩니다.')) {
    return;
  }

  try {
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

    // 성능 데이터 이미지 목록에서도 제거
    setPerformanceImages(performanceImages.filter(img => img !== imageUrl));
    
    alert('이미지가 삭제되었습니다.');
  } catch (error: any) {
    console.error('이미지 삭제 오류:', error);
    alert(`이미지 삭제 중 오류가 발생했습니다: ${error.message}`);
  }
};
```

#### 1.3 UI 변경

**버튼 변경:**
- 기존 "삭제" 버튼 → "제외" 버튼으로 변경
- 버튼 색상: 빨간색 → 주황색 (bg-orange-500)
- 완전 삭제는 갤러리 모달에서만 가능

**코드 예시:**
```tsx
{/* 버튼 그룹 */}
<div className="mt-2 flex gap-1">
  {index > 0 && (
    <button
      type="button"
      onClick={() => {
        const newImages = [...performanceImages];
        [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
        setPerformanceImages(newImages);
      }}
      className="flex-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
      title="위로 이동"
    >
      ↑
    </button>
  )}
  {index < performanceImages.length - 1 && (
    <button
      type="button"
      onClick={() => {
        const newImages = [...performanceImages];
        [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
        setPerformanceImages(newImages);
      }}
      className="flex-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
      title="아래로 이동"
    >
      ↓
    </button>
  )}
  {/* 제외 버튼 (삭제 대신) */}
  <button
    type="button"
    onClick={() => handleExcludePerformanceImage(img)}
    className="px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
    title="노출에서 제외"
  >
    제외
  </button>
</div>
```

---

### Phase 2: 갤러리 선택 모달에 삭제 기능 추가

#### 2.1 FolderImagePicker 설정

**현재 상태:**
- 성능 데이터 이미지 선택 모달: `enableDelete` 미사용
- 제품 이미지 관리 모달: `enableDelete={true}` 사용 중

**변경 사항:**
- 성능 데이터 이미지 선택 모달에도 `enableDelete={true}` 추가
- `onDelete` 콜백 구현

#### 2.2 구현

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
  // ✅ 삭제 기능 활성화 (성능 데이터 이미지 모달에도 적용)
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

    // ✅ 성능 데이터 이미지 모달인 경우
    if (galleryPickerMode === 'performance') {
      // 성능 데이터 이미지 목록에서도 자동 제거
      if (performanceImages.includes(imageUrl)) {
        setPerformanceImages(performanceImages.filter(img => img !== imageUrl));
      }
    } else {
      // ✅ 제품 이미지 관리 모달인 경우 (기존 로직)
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
    }
  }}
/>
```

---

## 📊 비교표

### 성능 데이터 이미지 관리

| 항목 | 현재 | 개선 후 |
|------|------|---------|
| **순서 변경** | ✅ (위/아래 이동) | ✅ (유지) |
| **삭제 버튼** | ✅ (완전 삭제) | ❌ |
| **제외 버튼** | ❌ | ✅ (노출만 제외) |
| **갤러리에서 삭제** | ❌ | ✅ |

### 제품 이미지 관리 (참고)

| 항목 | 현재 | 변경 |
|------|------|------|
| **순번 표시** | ✅ | 유지 |
| **순서 변경** | ✅ | 유지 |
| **제외 버튼** | ✅ | 유지 |
| **갤러리에서 삭제** | ✅ | 유지 |

---

## 🔧 구현 계획

### Phase 1: "삭제" → "제외" 및 "삭제" 분리

#### 1.1 함수 추가
- [ ] `handleExcludePerformanceImage` 함수 구현
- [ ] `handleDeletePerformanceImage` 함수 구현 (갤러리 모달용)

#### 1.2 UI 수정
- [ ] "삭제" 버튼 → "제외" 버튼으로 변경
- [ ] 버튼 색상 변경 (빨간색 → 주황색)
- [ ] 확인 메시지 수정

#### 1.3 테스트
- [ ] 제외 기능 테스트
- [ ] 제외된 이미지가 Storage에 유지되는지 확인
- [ ] 제외된 이미지를 다시 추가할 수 있는지 확인

---

### Phase 2: 갤러리 선택 모달에 삭제 기능 추가

#### 2.1 FolderImagePicker 설정
- [ ] `enableDelete={true}` 확인 (이미 제품 이미지 관리에 적용됨)
- [ ] `onDelete` 콜백에 성능 데이터 이미지 처리 로직 추가
- [ ] 성능 데이터 이미지 목록 자동 업데이트 로직 추가

#### 2.2 테스트
- [ ] 성능 데이터 이미지 선택 모달에서 삭제 기능 확인
- [ ] 삭제 후 성능 데이터 이미지 목록 자동 업데이트 확인
- [ ] 제품 이미지 관리 모달 삭제 기능 영향 없음 확인

---

## ⚠️ 주의사항

### 1. 데이터 일관성
- 제외된 이미지는 Storage에 유지되므로, 나중에 다시 추가 가능
- 완전 삭제가 필요한 경우는 갤러리 선택 모달에서 삭제 사용

### 2. 모달 모드 구분
- `galleryPickerMode`가 `'performance'`인지 `'detail'`인지 확인
- 각 모달 모드에 맞는 이미지 목록 업데이트

### 3. 하위 호환성
- 기존 성능 데이터 이미지 관리 기능은 유지
- 제품 이미지 관리 기능에 영향 없음

---

## 📝 파일 변경 목록

### 수정 파일
- `pages/admin/products.tsx`: 
  - `handleExcludePerformanceImage` 함수 추가
  - `handleDeletePerformanceImage` 함수 추가 (갤러리 모달용)
  - 성능 데이터 이미지 관리 UI에서 "삭제" → "제외" 변경
  - `FolderImagePicker`의 `onDelete` 콜백에 성능 데이터 이미지 처리 로직 추가

### 참고 파일
- `components/admin/FolderImagePicker.tsx`: 삭제 기능 지원 확인
- `pages/admin/products.tsx`: 제품 이미지 관리 (참고용)

---

## 🚀 실행 순서

1. **Phase 1 실행**
   - `handleExcludePerformanceImage` 함수 구현
   - `handleDeletePerformanceImage` 함수 구현
   - UI 버튼 변경
   - 테스트

2. **Phase 2 실행**
   - `FolderImagePicker`의 `onDelete` 콜백에 성능 데이터 이미지 처리 로직 추가
   - 테스트

---

## 📊 예상 결과

### 성능 데이터 이미지 관리 UI

**이전:**
```
[이미지 썸네일]
[↑] [↓] [삭제]
```

**이후:**
```
[이미지 썸네일]
[↑] [↓] [제외]
```

### 갤러리 선택 모달

**이전:**
- 이미지 선택만 가능
- 삭제 기능 없음

**이후:**
- 이미지 선택 가능
- 삭제 기능 추가 (각 썸네일에 삭제 버튼)
- 삭제 후 성능 데이터 이미지 목록 자동 업데이트

---

## 💡 추가 고려사항

### 1. 제외된 이미지 복구 기능
- 제외된 이미지를 다시 추가하는 기능 (선택사항)
- 제외된 이미지 목록 표시 (선택사항)

### 2. 일관된 UX
- 제품 이미지 관리와 성능 데이터 이미지 관리의 UX 일관성 유지
- 동일한 버튼 색상 및 스타일 사용

### 3. 성능 데이터 이미지 특성
- 성능 데이터 이미지는 드라이버 제품만 지원
- 제품 이미지 관리와는 다른 용도이지만, 관리 방식은 동일하게

---

## 🔄 제품 이미지 관리와의 일관성

### 공통 기능
- ✅ 순서 변경 (위/아래 이동)
- ✅ 제외 기능 (Storage 유지, 배열에서만 제거)
- ✅ 갤러리 선택 모달에서 삭제 기능

### 차이점
- 제품 이미지 관리: 순번 표시, 대표 이미지 설정
- 성능 데이터 이미지 관리: 순번 표시 없음, 대표 이미지 설정 없음

### 일관성 유지
- 버튼 색상: 제외 버튼 주황색, 이동 버튼 파란색
- 확인 메시지: 동일한 형식
- 삭제 기능: 갤러리 모달에서만 가능
