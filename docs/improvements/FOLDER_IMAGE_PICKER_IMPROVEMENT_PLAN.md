# FolderImagePicker 개선 계획

## 📋 현재 상황

### 문제점
1. **단일 폴더만 표시**: `FolderImagePicker`는 `folderPath` prop으로 지정된 하나의 폴더만 표시
2. **폴더 전환 불가**: `secret-force-pro-3/composition`과 `secret-force-common/composition` 사이를 쉽게 전환할 수 없음
3. **slug 변경 시 수동 업데이트 필요**: slug를 변경해도 모달이 열려있으면 폴더 경로가 자동으로 업데이트되지 않음

### 사용 시나리오
- `secret-force-pro-3` 제품 수정 시:
  - 제품 전용 이미지: `originals/products/secret-force-pro-3/composition`
  - 공통 참조 이미지: `originals/products/secret-force-common/composition`
  - 두 폴더에서 이미지를 쉽게 선택해야 함

## 🎯 개선 목표

1. **폴더 전환 기능**: 탭 또는 버튼으로 제품 폴더와 공통 폴더를 쉽게 전환
2. **브레드크럼 네비게이션**: 상위 폴더로 이동 가능
3. **자동 폴더 경로 업데이트**: slug 변경 시 모달 내 폴더 경로 자동 업데이트
4. **빠른 접근**: `secret-force-common` 폴더를 항상 쉽게 접근 가능

## 📝 개선 계획

### 1. FolderImagePicker 컴포넌트 개선

#### 1.1 폴더 전환 탭 추가
```typescript
// Props에 추가
type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  folderPath: string; // 기본 폴더 경로
  title?: string;
  // ✅ 추가
  alternativeFolders?: Array<{
    label: string;
    path: string;
    icon?: string;
  }>; // 대체 폴더 목록 (예: secret-force-common)
  onFolderChange?: (path: string) => void; // 폴더 변경 콜백
};
```

#### 1.2 브레드크럼 네비게이션 추가
- 현재 폴더 경로를 브레드크럼으로 표시
- 각 경로 세그먼트 클릭 시 해당 폴더로 이동
- 예: `originals / products / secret-force-pro-3 / composition`

#### 1.3 내부 상태로 현재 폴더 관리
```typescript
const [currentFolderPath, setCurrentFolderPath] = useState(folderPath);

// folderPath prop이 변경되면 내부 상태도 업데이트
useEffect(() => {
  setCurrentFolderPath(folderPath);
}, [folderPath]);
```

### 2. 제품 합성 관리 페이지 개선

#### 2.1 getCompositionFolderPath 개선
```typescript
const getCompositionFolderPath = (): string | undefined => {
  if (!formData.slug || !formData.category) return undefined;
  
  // 드라이버 제품의 경우
  if (formData.category === 'driver') {
    const folderSlug = slugMapping[formData.slug] || formData.slug;
    return `originals/products/${folderSlug}/composition`;
  }
  // ...
};

// ✅ 추가: 공통 폴더 경로 반환
const getCommonFolderPath = (): string => {
  return 'originals/products/secret-force-common/composition';
};
```

#### 2.2 FolderImagePicker에 alternativeFolders 전달
```typescript
<FolderImagePicker
  isOpen={showGalleryPicker}
  onClose={() => {
    setShowGalleryPicker(false);
    setGalleryPickerMode(null);
  }}
  onSelect={handleGalleryImageSelect}
  folderPath={getCompositionFolderPath() || ''}
  title="갤러리에서 이미지 선택"
  // ✅ 추가
  alternativeFolders={[
    {
      label: '공통 이미지',
      path: getCommonFolderPath(),
      icon: '📁',
    },
  ]}
  onFolderChange={(newPath) => {
    // 폴더 변경 시 로그 (필요시)
    console.log('폴더 변경:', newPath);
  }}
/>
```

### 3. UI/UX 개선

#### 3.1 탭 디자인
```
┌─────────────────────────────────────────┐
│ 갤러리에서 이미지 선택              [×] │
├─────────────────────────────────────────┤
│ [제품 이미지] [공통 이미지]             │ ← 탭
├─────────────────────────────────────────┤
│ originals / products / secret-force... │ ← 브레드크럼
├─────────────────────────────────────────┤
│ [이미지 그리드]                         │
└─────────────────────────────────────────┘
```

#### 3.2 브레드크럼 디자인
- 각 경로 세그먼트는 클릭 가능한 버튼
- 현재 위치는 강조 표시
- 상위 폴더로 이동 가능

### 4. slug 변경 시 자동 업데이트

#### 4.1 폴더 경로 자동 업데이트
```typescript
// FolderImagePicker 내부
useEffect(() => {
  if (isOpen && folderPath) {
    setCurrentFolderPath(folderPath);
    fetchFolderImages();
  }
}, [isOpen, folderPath]); // folderPath 변경 시 자동 업데이트
```

#### 4.2 제품 합성 관리에서 slug 변경 감지
```typescript
// slug 변경 시 모달이 열려있으면 폴더 경로 업데이트
useEffect(() => {
  if (showGalleryPicker && formData.slug) {
    // 모달이 열려있고 slug가 변경되면
    // FolderImagePicker의 folderPath prop이 자동으로 업데이트됨
    // (React의 prop 업데이트로 자동 처리)
  }
}, [formData.slug, showGalleryPicker]);
```

## 🔧 구현 단계

### Phase 1: 기본 폴더 전환 기능
1. `FolderImagePicker`에 `alternativeFolders` prop 추가
2. 탭 UI 추가 (제품 폴더 / 공통 폴더)
3. 탭 클릭 시 폴더 전환 기능

### Phase 2: 브레드크럼 네비게이션
1. 현재 폴더 경로를 브레드크럼으로 표시
2. 각 세그먼트 클릭 시 해당 폴더로 이동
3. 상위 폴더로 이동 기능

### Phase 3: 자동 업데이트 및 최적화
1. slug 변경 시 폴더 경로 자동 업데이트
2. 폴더 전환 시 이미지 캐싱
3. 로딩 상태 개선

## 📊 예상 효과

1. **사용성 향상**: 제품 폴더와 공통 폴더를 쉽게 전환 가능
2. **작업 효율성**: 여러 폴더에서 이미지를 빠르게 선택 가능
3. **직관적인 UI**: 브레드크럼으로 현재 위치와 이동 경로 명확
4. **자동화**: slug 변경 시 폴더 경로 자동 업데이트

## 🎨 UI 예시

### 탭 전환
```
[제품 이미지] [공통 이미지]
     ↑ 활성      ↑ 클릭 시 전환
```

### 브레드크럼
```
originals / products / secret-force-pro-3 / composition
   ↑ 클릭      ↑ 클릭        ↑ 클릭              ↑ 현재
```

## ✅ 체크리스트

- [ ] `FolderImagePicker`에 `alternativeFolders` prop 추가
- [ ] 탭 UI 구현
- [ ] 폴더 전환 로직 구현
- [ ] 브레드크럼 네비게이션 구현
- [ ] slug 변경 시 자동 업데이트 확인
- [ ] 제품 합성 관리에서 `alternativeFolders` 전달
- [ ] 테스트 및 버그 수정
