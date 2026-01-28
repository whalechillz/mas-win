# 미할당 이미지 드래그 앤 드롭 실패 수정 계획

## 문제 분석

### 증상
- 미할당 이미지를 "사진(0)" 영역(장면에 할당된 미디어 영역)으로 드래그 앤 드롭했지만 이미지가 추가되지 않음
- 드래그 시작 이벤트는 정상 작동 (콘솔 로그 확인)
- 드롭 후 이미지가 장면에 할당되지 않음

### 원인 분석

#### 1. 데이터 전달 방식 불일치
- **SceneDetailView의 handleDragStart**: 
  ```typescript
  e.dataTransfer.setData('text/plain', JSON.stringify({ imageId, imageUrl }))
  ```
  - JSON 문자열로 `text/plain`에 저장

- **CustomerStoryModal의 handleDrop**:
  ```typescript
  const imageIdStr = e.dataTransfer.getData('imageId');
  const imageUrl = e.dataTransfer.getData('imageUrl');
  ```
  - 개별 키(`imageId`, `imageUrl`)로 데이터를 읽으려고 시도
  - **문제**: `setData`로 저장한 키와 `getData`로 읽는 키가 일치하지 않음

#### 2. SceneDetailView의 handleDrop 로직 문제
- `externalDrop`이 있으면 그것을 호출하지만, `CustomerStoryModal`의 `handleDrop`은 데이터를 올바르게 읽지 못함
- `SceneDetailView`의 자체 `handleDrop`은 `text/plain`에서 JSON을 파싱하지만, `CustomerStoryModal`의 `handleDragStart`는 개별 키로 저장함

#### 3. 드롭 대상 영역 확인 필요
- "사진(0)" 탭의 드롭 대상 영역이 제대로 설정되어 있는지 확인 필요
- `onDragOver`, `onDrop` 이벤트 핸들러가 올바르게 연결되어 있는지 확인

## 해결 방안

### Phase 1: 데이터 전달 방식 통일

**문제**: `SceneDetailView`와 `CustomerStoryModal`의 드래그 앤 드롭 데이터 전달 방식이 일치하지 않음

**해결책**: 
1. `CustomerStoryModal`의 `handleDragStart`를 확인하고, `SceneDetailView`와 동일한 방식으로 데이터 저장
2. 또는 `SceneDetailView`의 `handleDragStart`를 `CustomerStoryModal`과 동일한 방식으로 수정
3. `handleDrop`에서도 동일한 방식으로 데이터 읽기

**권장 방법**: `CustomerStoryModal`의 방식을 표준으로 사용 (개별 키 사용)

### Phase 2: SceneDetailView의 handleDrop 수정

**현재 문제**:
- `externalDrop`이 있으면 호출하지만, 데이터 형식이 맞지 않음
- 자체 `handleDrop`은 `text/plain`에서 JSON 파싱 시도

**수정 내용**:
1. `handleDrop`에서 먼저 개별 키로 데이터 읽기 시도
2. 실패하면 `text/plain`에서 JSON 파싱 시도
3. 두 방식 모두 지원하도록 수정

### Phase 3: 드롭 대상 영역 이벤트 핸들러 확인

**확인 사항**:
1. "사진" 탭의 드롭 대상 영역에 `onDragOver`, `onDrop` 핸들러가 올바르게 설정되어 있는지
2. `e.preventDefault()`가 호출되는지
3. `targetScene`이 올바르게 전달되는지

## 구현 계획

### 1단계: CustomerStoryModal의 handleDragStart 확인 및 수정

**파일**: `components/admin/CustomerStoryModal.tsx`

**현재 상태 확인**:
- `handleDragStart`가 어떻게 데이터를 저장하는지 확인
- `SceneDetailView`에서 호출되는 `externalDragStart`가 올바른 형식으로 데이터를 저장하는지 확인

**수정 내용**:
```typescript
const handleDragStart = (e: React.DragEvent, imageId: number | null, imageUrl?: string) => {
  // 개별 키로 데이터 저장 (기존 방식 유지)
  if (imageId !== null) {
    e.dataTransfer.setData('imageId', imageId.toString());
  }
  if (imageUrl) {
    e.dataTransfer.setData('imageUrl', imageUrl);
  }
  // 추가: text/plain에도 JSON으로 저장 (하위 호환성)
  e.dataTransfer.setData('text/plain', JSON.stringify({ imageId, imageUrl }));
  
  // ... 기타 로직
};
```

### 2단계: SceneDetailView의 handleDrop 수정

**파일**: `components/admin/customers/SceneDetailView.tsx`

**수정 내용**:
```typescript
const handleDrop = async (e: React.DragEvent, targetScene: number | null) => {
  e.preventDefault();
  e.stopPropagation(); // 이벤트 버블링 방지
  
  if (externalDrop) {
    // externalDrop이 있으면 먼저 시도
    externalDrop(e, targetScene);
    return;
  }
  
  try {
    // 방법 1: 개별 키로 읽기 시도 (CustomerStoryModal 방식)
    let imageId: number | null = null;
    let imageUrl: string | undefined = undefined;
    
    const imageIdStr = e.dataTransfer.getData('imageId');
    const imageUrlData = e.dataTransfer.getData('imageUrl');
    
    if (imageIdStr) {
      imageId = parseInt(imageIdStr);
    }
    if (imageUrlData) {
      imageUrl = imageUrlData;
    }
    
    // 방법 2: text/plain에서 JSON 파싱 시도 (하위 호환성)
    if (!imageId && !imageUrl) {
      try {
        const data = e.dataTransfer.getData('text/plain');
        if (data) {
          const parsed = JSON.parse(data);
          imageId = parsed.imageId || null;
          imageUrl = parsed.imageUrl || undefined;
        }
      } catch (parseError) {
        console.warn('JSON 파싱 실패, text/plain 데이터:', data);
      }
    }
    
    if (!imageId && !imageUrl) {
      console.error('드롭 데이터를 찾을 수 없습니다');
      alert('이미지 정보를 찾을 수 없습니다.');
      return;
    }
    
    console.log('🔍 [SceneDetailView 드롭] 데이터:', { imageId, imageUrl, targetScene });
    
    const response = await fetch('/api/admin/update-image-scene', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageId,
        imageUrl,
        storyScene: targetScene
      })
    });

    const result = await response.json();
    console.log('📥 [SceneDetailView 드롭] API 응답:', result);
    
    if (result.success) {
      // 이미지 재로드
      if (useExternalImages && onImagesChange) {
        onImagesChange();
      } else {
        await loadData();
      }
      console.log('✅ [SceneDetailView 드롭] 성공');
    } else {
      console.error('❌ [SceneDetailView 드롭] API 실패:', result);
      alert(`이미지 이동에 실패했습니다: ${result.error || '알 수 없는 오류'}`);
    }
  } catch (error) {
    console.error('❌ [SceneDetailView 드롭] 오류:', error);
    alert(`이미지 이동에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  } finally {
    setDragOverScene(null);
    setDragOverUnassigned(false);
    setDraggedImage(null);
  }
};
```

### 3단계: SceneDetailView의 handleDragStart 수정

**파일**: `components/admin/customers/SceneDetailView.tsx`

**수정 내용**:
```typescript
const handleDragStart = (e: React.DragEvent, imageId: number | null, imageUrl?: string) => {
  if (externalDragStart) {
    externalDragStart(e, imageId, imageUrl);
  } else {
    // 개별 키로 데이터 저장 (CustomerStoryModal 방식과 일치)
    if (imageId !== null) {
      e.dataTransfer.setData('imageId', imageId.toString());
    }
    if (imageUrl) {
      e.dataTransfer.setData('imageUrl', imageUrl);
    }
    // 추가: text/plain에도 JSON으로 저장 (하위 호환성)
    e.dataTransfer.setData('text/plain', JSON.stringify({ imageId, imageUrl }));
    
    const identifier = imageId !== null ? imageId : (imageUrl || 'unknown');
    setDraggedImage(identifier);
    e.dataTransfer.effectAllowed = 'move';
  }
};
```

### 4단계: 드롭 대상 영역 확인 및 수정

**파일**: `components/admin/customers/SceneDetailView.tsx`

**확인 사항**:
- "사진" 탭의 드롭 대상 영역에 `onDragOver`, `onDrop` 핸들러가 올바르게 설정되어 있는지
- `activeScene`이 올바르게 전달되는지

**현재 코드 확인** (라인 500-550 부근):
```typescript
{activeTab === 'images' && (
  <div>
    {sceneImages.length > 0 ? (
      <div
        onDragOver={(e) => handleDragOver(e, activeScene)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, activeScene)}
        // ...
      >
```

**수정 필요 사항**:
- `onDragOver`에서 `e.preventDefault()` 호출 확인
- `onDrop`에서 `e.preventDefault()`, `e.stopPropagation()` 호출 확인
- 드롭 대상 영역이 충분히 큰지 확인 (빈 영역도 드롭 가능하도록)

## 테스트 계획

1. **드래그 시작 테스트**
   - 미할당 이미지를 드래그 시작
   - 콘솔에서 `imageId`, `imageUrl` 데이터 확인
   - `dataTransfer`에 올바른 형식으로 저장되었는지 확인

2. **드롭 테스트**
   - 미할당 이미지를 "사진(0)" 영역으로 드롭
   - 콘솔에서 드롭 이벤트 로그 확인
   - API 호출 확인
   - 이미지 재로드 확인
   - UI 업데이트 확인

3. **에러 처리 테스트**
   - 네트워크 오류 시나리오
   - API 오류 응답 처리
   - 사용자에게 적절한 에러 메시지 표시

## 예상 작업 시간

- Phase 1: 데이터 전달 방식 통일 - 30분
- Phase 2: SceneDetailView의 handleDrop 수정 - 1시간
- Phase 3: SceneDetailView의 handleDragStart 수정 - 30분
- Phase 4: 드롭 대상 영역 확인 및 수정 - 30분
- 테스트 및 디버깅 - 1시간
- **총 예상 시간: 3-4시간**

## 우선순위

**높음**: 사용자가 직접 보고한 기능 오류로 즉시 수정 필요

## 파일 목록

### 수정할 파일
1. `components/admin/customers/SceneDetailView.tsx`
   - `handleDragStart` 수정
   - `handleDrop` 수정
   - 드롭 대상 영역 이벤트 핸들러 확인

2. `components/admin/CustomerStoryModal.tsx` (필요시)
   - `handleDragStart` 확인 및 수정 (일관성 유지)

### 참고 파일
1. `pages/api/admin/update-image-scene.ts` - API 엔드포인트
2. `components/admin/CustomerStoryModal.tsx` - 드래그 앤 드롭 로직 참고
