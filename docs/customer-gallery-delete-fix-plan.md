# 고객 이미지 관리 - 갤러리에서 이미지 삭제 오류 수정 계획

## 문제 분석

### 현재 상황
1. **사용자 보고**: "갤러리에서 이미지 선택" 모달에서 이미지 삭제 시 삭제가 안 됨
2. **오류 메시지**: 
   - "imageName 필요합니다."
   - 콘솔 오류: `GET https://localhost:3000/api/admin/delete-image?imageName= net::ERR_EMPTY_RESPONSE`
   - "더 작업할 수 없습니다."

### 원인 분석

**데이터 흐름**:
1. `FolderImagePicker` 컴포넌트가 삭제 버튼 클릭 시 `img.url` (이미지 URL)을 `onDelete` 콜백에 전달
2. `pages/admin/customers/index.tsx`의 `onDelete` 핸들러가 `imageUrl`을 받아서 API에 `{ imageUrl }`로 전달
3. `/api/admin/delete-image.js` API는 DELETE 메서드일 때 `imageName`을 요구 (293줄)
4. **문제**: API는 `imageName`을 요구하는데, 클라이언트는 `imageUrl`을 전달하여 오류 발생

**코드 위치**:
- `components/admin/FolderImagePicker.tsx` (406줄): `await onDelete(img.url);`
- `pages/admin/customers/index.tsx` (3528-3550줄): `onDelete` 핸들러
- `pages/api/admin/delete-image.js` (292-299줄): `imageName` 검증

## 해결 방안

### 방안 1: 클라이언트에서 imageUrl을 imageName으로 변환 (권장)

**장점**:
- API 변경 불필요
- 다른 곳에서도 동일한 패턴 사용 가능
- 간단하고 빠른 수정

**구현 방법**:
1. `imageUrl`에서 파일 경로 추출
2. Supabase Storage URL에서 실제 파일 경로 파싱
3. `imageName`으로 변환하여 API에 전달

**코드 수정**:
```typescript
onDelete={async (imageUrl: string) => {
  // imageUrl에서 파일 경로 추출
  // 예: https://xxx.supabase.co/storage/v1/object/public/blog-images/originals/customers/ahnhuija/2026-01-26/ahnhuija_s1_seukaen-20260126-2_01.webp
  // -> originals/customers/ahnhuija/2026-01-26/ahnhuija_s1_seukaen-20260126-2_01.webp
  
  let imageName = '';
  
  // Supabase Storage URL에서 파일 경로 추출
  const urlMatch = imageUrl.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
  if (urlMatch) {
    imageName = urlMatch[1];
  } else {
    // URL 형식이 다른 경우 직접 파싱 시도
    const pathMatch = imageUrl.match(/(?:originals|blog-images)\/.+$/);
    if (pathMatch) {
      imageName = pathMatch[0];
    } else {
      // 마지막 시도: URL에서 파일명만 추출
      const fileNameMatch = imageUrl.match(/\/([^/]+\.(webp|jpg|jpeg|png|gif|mp4|mov|avi))$/i);
      if (fileNameMatch) {
        imageName = fileNameMatch[1];
      }
    }
  }
  
  if (!imageName) {
    throw new Error('이미지 경로를 추출할 수 없습니다.');
  }
  
  // Storage에서 삭제
  const response = await fetch('/api/admin/delete-image', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageName }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '이미지 삭제에 실패했습니다.');
  }

  // 이미지 목록 새로고침
  await loadCustomerImages(selectedDateFilter);
  
  // 고객 리스트 썸네일 새로고침을 위한 이벤트 발생
  window.dispatchEvent(new CustomEvent('customerImagesUpdated', { 
    detail: { customerId: customer.id } 
  }));
}}
```

### 방안 2: API를 수정하여 imageUrl도 받을 수 있도록 (대안)

**장점**:
- 클라이언트 코드 변경 최소화
- URL과 파일명 모두 지원

**단점**:
- API 변경 필요
- 다른 곳에서도 영향 가능

**구현 방법**:
`/api/admin/delete-image.js`에서 `imageUrl`도 처리하도록 수정

```javascript
} else if (req.method === 'DELETE' || req.method === 'POST') {
  const { imageName, imageUrl } = req.body;

  // imageUrl이 제공된 경우 파일 경로 추출
  let targetImageName = imageName;
  if (!targetImageName && imageUrl) {
    const urlMatch = imageUrl.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
    if (urlMatch) {
      targetImageName = urlMatch[1];
    } else {
      return res.status(400).json({ 
        error: 'imageUrl에서 파일 경로를 추출할 수 없습니다.' 
      });
    }
  }

  if (!targetImageName) {
    return res.status(400).json({ 
      error: 'imageName 또는 imageUrl 파라미터가 필요합니다.' 
    });
  }

  // 기존 로직에서 imageName 대신 targetImageName 사용
  // ...
}
```

## 권장 사항

**방안 1 (클라이언트 수정)을 권장**합니다:
- API 변경 없이 빠르게 수정 가능
- 다른 컴포넌트에 영향 없음
- URL 파싱 로직을 한 곳에 집중

## 구현 계획

### Phase 1: imageUrl을 imageName으로 변환 로직 추가

**파일**: `pages/admin/customers/index.tsx`

**수정 내용**:
1. `onDelete` 핸들러에서 `imageUrl`을 `imageName`으로 변환
2. Supabase Storage URL에서 파일 경로 추출
3. 변환된 `imageName`을 API에 전달

**예상 작업 시간**: 30분-1시간

### Phase 2: 테스트 및 검증

**테스트 항목**:
1. 일반 이미지 삭제 테스트
2. 스캔 문서 삭제 테스트
3. 동영상 삭제 테스트
4. 다양한 경로 형식 테스트
5. 오류 처리 테스트 (경로 추출 실패 시)

**예상 작업 시간**: 30분

## 파일 구조

### 수정할 파일

1. **`pages/admin/customers/index.tsx`**
   - `onDelete` 핸들러 수정 (3528-3550줄)
   - `imageUrl`을 `imageName`으로 변환하는 로직 추가

### 참고 파일

1. **`components/admin/FolderImagePicker.tsx`**
   - 삭제 버튼 클릭 시 `img.url` 전달 (406줄)
   - 수정 불필요 (이미 올바르게 구현됨)

2. **`pages/api/admin/delete-image.js`**
   - `imageName` 파라미터 요구 (293줄)
   - 수정 불필요 (현재 구현 유지)

## 예상 작업 시간

- Phase 1 (코드 수정): 30분-1시간
- Phase 2 (테스트): 30분
- **총 예상 시간: 1-1.5시간**

## 우선순위

**높음**: 사용자가 직접 보고한 버그로 즉시 수정 필요

## 주의사항

1. **URL 형식 다양성**
   - Supabase Storage URL 형식이 다를 수 있음
   - 여러 패턴을 시도하는 fallback 로직 필요

2. **에러 처리**
   - 경로 추출 실패 시 명확한 오류 메시지 제공
   - 사용자에게 친화적인 메시지 표시

3. **다른 컴포넌트 확인**
   - 다른 곳에서도 동일한 패턴 사용하는지 확인
   - 필요시 공통 유틸리티 함수로 추출
