# 이미지 삭제 - 갤러리 관리 패턴 적용 수정

## 문제 분석

### 원인
1. **"파일을 찾을 수 없습니다" 오류**: `imageName=undefined` 또는 잘못된 경로 전달
2. **갤러리 관리 일괄 삭제는 정상 작동**: `folder_path`와 `name`을 조합하여 `fullPath` 생성

### 차이점 분석

#### 갤러리 관리 일괄 삭제 (성공)
- `folder_path`와 `name`을 조합: `${folder_path}/${name}` 또는 `name`
- `method: 'POST'` 사용
- `imageName: actualPath` 전달

#### 기존 삭제 코드 (실패)
- `imageUrl`만 전달
- `extractImageNameFromUrl`로 URL에서 경로 추출 시도
- URL 파싱 실패 시 `undefined` 발생

## 해결 방안

갤러리 관리의 일괄 삭제 패턴을 적용하여 `folderPath`와 `name`을 직접 조합하여 사용

## 구현 완료

### 1. FolderImagePicker 컴포넌트 수정
- `onDelete` 콜백에 `imageInfo` (name, folderPath) 추가 전달
- `currentFolderPath`와 `img.name`을 조합하여 전달

### 2. 고객 이미지 관리 수정
- `folderPath`와 `name`을 조합하여 `imageName` 생성
- 갤러리 관리와 동일하게 `POST` 메서드 사용

### 3. 제품 이미지 관리 수정
- `FolderImagePicker`의 `onDelete` 핸들러 수정
- `handleDeletePerformanceImage` 함수 수정

## 변경된 파일

1. **`components/admin/FolderImagePicker.tsx`**
   - `onDelete` 타입에 `imageInfo` 파라미터 추가
   - 삭제 버튼 클릭 시 `folderPath`와 `name` 정보 전달

2. **`pages/admin/customers/index.tsx`**
   - `onDelete` 핸들러에서 `folderPath`와 `name` 조합 사용
   - `POST` 메서드로 변경

3. **`pages/admin/products.tsx`**
   - `FolderImagePicker`의 `onDelete` 핸들러 수정
   - `handleDeletePerformanceImage` 함수 수정
   - `POST` 메서드로 변경

## 주요 변경 사항

### FolderImagePicker.tsx
```typescript
// 기존
onDelete?: (imageUrl: string) => Promise<void>;

// 수정 후
onDelete?: (imageUrl: string, imageInfo?: { name: string; folderPath?: string }) => Promise<void>;

// 호출 시
await onDelete(img.url, { 
  name: img.name, 
  folderPath: currentFolderPath 
});
```

### customers/index.tsx & products.tsx
```typescript
// 기존
const imageName = extractImageNameFromUrl(imageUrl);
const response = await fetch('/api/admin/delete-image', {
  method: 'DELETE',
  body: JSON.stringify({ imageName }),
});

// 수정 후 (갤러리 관리 패턴)
if (imageInfo && imageInfo.name) {
  const folderPath = imageInfo.folderPath || getCustomerFolderPath();
  imageName = folderPath && folderPath !== '' 
    ? `${folderPath}/${imageInfo.name}` 
    : imageInfo.name;
}
const response = await fetch('/api/admin/delete-image', {
  method: 'POST',
  body: JSON.stringify({ imageName }),
});
```

## 테스트 권장 사항

1. **고객 이미지 삭제 테스트**
   - 갤러리에서 이미지 선택 모달
   - 이미지 삭제 버튼 클릭
   - 삭제 성공 확인

2. **제품 이미지 삭제 테스트**
   - 제품 이미지 관리 모달
   - 성능 데이터 이미지 삭제
   - 삭제 성공 확인

3. **다양한 경로 형식 테스트**
   - 루트 폴더의 이미지
   - 하위 폴더의 이미지
   - 중첩된 폴더의 이미지

## 예상 결과

- ✅ `folderPath`와 `name`을 조합하여 정확한 경로 생성
- ✅ `POST` 메서드로 일관된 API 호출
- ✅ "파일을 찾을 수 없습니다" 오류 해결
- ✅ 갤러리 관리와 동일한 삭제 패턴 적용
