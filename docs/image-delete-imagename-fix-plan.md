# 이미지 삭제 imageName 파라미터 오류 통합 수정 계획

## 문제 분석

### 배경
- `image_metadata` → `image_assets` DB 마이그레이션 이후 삭제 기능에서 오류 발생
- 여러 곳에서 "imageName 파라미터가 필요합니다" 오류 발생

### 원인
1. **API 변경**: `/api/admin/delete-image.js`는 `imageName` 파라미터를 요구 (293줄)
2. **클라이언트 불일치**: 여러 곳에서 `imageUrl`을 전달하여 오류 발생
3. **마이그레이션 영향**: `image_metadata` → `image_assets` 변경으로 API 요구사항 변경

### 영향받는 파일

#### ❌ 문제 있는 파일 (imageUrl 전달)
1. **`pages/admin/customers/index.tsx`** (3528줄)
   - `onDelete` 핸들러에서 `{ imageUrl }` 전달
   
2. **`pages/admin/products.tsx`** (749줄, 2241줄)
   - 갤러리 이미지 삭제 시 `{ imageUrl }` 전달 (2곳)

#### ✅ 정상 작동하는 파일 (imageName 사용)
1. **`pages/admin/blog.tsx`** - `imageName` 사용
2. **`pages/admin/gallery.tsx`** - `imageName` 사용
3. **`components/admin/GalleryPicker.tsx`** - `imageNames` 배열 사용

## 해결 방안

### 방안 1: 공통 유틸리티 함수 생성 + 각 파일 수정 (권장)

**장점**:
- 코드 재사용성 높음
- 유지보수 용이
- 일관된 변환 로직

**구현 방법**:
1. `lib/image-url-to-name-converter.ts` 유틸리티 함수 생성
2. 각 파일의 `onDelete` 핸들러에서 변환 함수 사용
3. 변환 실패 시 명확한 오류 메시지 제공

### 방안 2: API 수정하여 imageUrl도 지원 (대안)

**장점**:
- 클라이언트 코드 변경 최소화

**단점**:
- API 변경 필요
- 기존 코드와의 일관성 문제

## 구현 계획

### Phase 1: 공통 유틸리티 함수 생성

**파일**: `lib/image-url-to-name-converter.ts` (신규)

**기능**:
- Supabase Storage URL에서 파일 경로 추출
- 다양한 URL 형식 지원
- Fallback 로직 포함

**구현 예시**:
```typescript
/**
 * Supabase Storage URL에서 파일 경로(imageName) 추출
 * @param imageUrl - Supabase Storage URL 또는 파일 경로
 * @returns 파일 경로 (예: originals/customers/ahnhuija/2026-01-26/file.webp)
 */
export function extractImageNameFromUrl(imageUrl: string): string {
  if (!imageUrl) {
    throw new Error('imageUrl이 제공되지 않았습니다.');
  }

  // 이미 파일 경로인 경우 (URL이 아닌 경우)
  if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // Supabase Storage URL 패턴 1: /storage/v1/object/public/{bucket}/{path}
  const pattern1 = imageUrl.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
  if (pattern1) {
    return decodeURIComponent(pattern1[1]);
  }

  // Supabase Storage URL 패턴 2: /storage/v1/object/sign/{bucket}/{path}
  const pattern2 = imageUrl.match(/\/storage\/v1\/object\/sign\/[^/]+\/(.+?)(?:\?|$)/);
  if (pattern2) {
    return decodeURIComponent(pattern2[1]);
  }

  // 일반 URL에서 경로 추출 시도
  try {
    const url = new URL(imageUrl);
    const pathname = url.pathname;
    
    // originals 또는 blog-images로 시작하는 경로 찾기
    const pathMatch = pathname.match(/(?:originals|blog-images)\/.+$/);
    if (pathMatch) {
      return decodeURIComponent(pathMatch[0]);
    }
    
    // 마지막 경로 세그먼트가 파일명인 경우
    const fileNameMatch = pathname.match(/\/([^/]+\.(webp|jpg|jpeg|png|gif|mp4|mov|avi|webm|mkv))$/i);
    if (fileNameMatch) {
      return decodeURIComponent(fileNameMatch[1]);
    }
  } catch (error) {
    // URL 파싱 실패
  }

  // 모든 패턴 실패 시 원본 반환 (에러 발생)
  throw new Error(`이미지 URL에서 파일 경로를 추출할 수 없습니다: ${imageUrl.substring(0, 100)}`);
}
```

### Phase 2: 고객 이미지 관리 수정

**파일**: `pages/admin/customers/index.tsx`

**수정 위치**: 3528-3550줄

**수정 내용**:
```typescript
import { extractImageNameFromUrl } from '../../../lib/image-url-to-name-converter';

// ...

onDelete={async (imageUrl: string) => {
  try {
    // imageUrl을 imageName으로 변환
    const imageName = extractImageNameFromUrl(imageUrl);
    
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
  } catch (error: any) {
    console.error('이미지 삭제 오류:', error);
    throw error; // FolderImagePicker에서 처리
  }
}}
```

### Phase 3: 제품 이미지 관리 수정

**파일**: `pages/admin/products.tsx`

**수정 위치 1**: 740-760줄 (갤러리 이미지 삭제)

**수정 내용**:
```typescript
import { extractImageNameFromUrl } from '../../lib/image-url-to-name-converter';

// ...

const handleDeleteImage = async (imageUrl: string) => {
  if (!confirm('정말로 이 이미지를 삭제하시겠습니까?')) {
    return;
  }

  try {
    // imageUrl을 imageName으로 변환
    const imageName = extractImageNameFromUrl(imageUrl);
    
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

    // 로컬 상태에서 제거
    // ... 기존 로직 ...
  } catch (error: any) {
    console.error('이미지 삭제 오류:', error);
    alert(error.message || '이미지 삭제 중 오류가 발생했습니다.');
  }
};
```

**수정 위치 2**: 2241-2255줄 (FolderImagePicker onDelete)

**수정 내용**:
```typescript
onDelete={async (imageUrl: string) => {
  try {
    // imageUrl을 imageName으로 변환
    const imageName = extractImageNameFromUrl(imageUrl);
    
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
    // ... 기존 로직 ...
  } catch (error: any) {
    console.error('이미지 삭제 오류:', error);
    throw error; // FolderImagePicker에서 처리
  }
}}
```

### Phase 4: 제품 합성 이미지 관리 확인

**파일**: `pages/admin/product-composition.tsx`

**확인 필요**: 1665줄에서 `/api/admin/delete-product-image` 사용
- 다른 API를 사용하므로 별도 확인 필요
- `/api/admin/delete-product-image.js` API가 `imageUrl`을 받는지 `imageName`을 받는지 확인
- 동일한 문제가 있다면 수정

## 파일 구조

### 신규 파일

1. **`lib/image-url-to-name-converter.ts`**
   - `extractImageNameFromUrl` 함수
   - 다양한 URL 형식 지원
   - 에러 처리 포함

### 수정할 파일

1. **`pages/admin/customers/index.tsx`**
   - `onDelete` 핸들러 수정 (3528줄)
   - 유틸리티 함수 import 및 사용

2. **`pages/admin/products.tsx`**
   - `handleDeleteImage` 함수 수정 (740줄)
   - `FolderImagePicker`의 `onDelete` 핸들러 수정 (2241줄)
   - 유틸리티 함수 import 및 사용

3. **`pages/admin/product-composition.tsx`** (확인 필요)
   - `/api/admin/delete-product-image` API 확인
   - 동일한 문제가 있다면 수정

## 예상 작업 시간

- Phase 1 (유틸리티 함수 생성): 30분
- Phase 2 (고객 이미지 관리 수정): 20분
- Phase 3 (제품 이미지 관리 수정): 30분
- Phase 4 (제품 합성 확인): 10분
- 테스트 및 검증: 30분
- **총 예상 시간: 2시간**

## 우선순위

**높음**: DB 마이그레이션 이후 발생한 버그로 즉시 수정 필요

## 테스트 계획

### Phase 1 테스트

1. **유틸리티 함수 테스트**
   - 다양한 URL 형식 테스트
   - 파일 경로 직접 전달 테스트
   - 오류 케이스 테스트

### Phase 2-3 테스트

1. **고객 이미지 삭제 테스트**
   - 일반 이미지 삭제
   - 스캔 문서 삭제
   - 동영상 삭제
   - 다양한 경로 형식 테스트

2. **제품 이미지 삭제 테스트**
   - 갤러리에서 이미지 삭제
   - 제품 이미지 선택 모달에서 삭제
   - 다양한 경로 형식 테스트

3. **오류 처리 테스트**
   - 잘못된 URL 형식
   - 경로 추출 실패
   - 네트워크 오류

## 주의사항

1. **URL 형식 다양성**
   - Supabase Storage URL 형식이 다를 수 있음
   - 여러 패턴을 시도하는 fallback 로직 필요

2. **에러 처리**
   - 경로 추출 실패 시 명확한 오류 메시지
   - 사용자에게 친화적인 메시지 표시

3. **하위 호환성**
   - 이미 `imageName`을 사용하는 곳은 수정 불필요
   - 기존 코드와의 일관성 유지

4. **다른 API 확인**
   - `/api/admin/delete-product-image` 등 다른 삭제 API도 확인 필요
   - 동일한 문제가 있다면 함께 수정

## 추가 확인 사항

1. **다른 삭제 API 확인**
   - `/api/admin/delete-product-image`
   - `/api/admin/delete-customer-images`
   - 기타 삭제 관련 API

2. **마이그레이션 영향 범위**
   - 다른 기능에서도 유사한 문제 발생 가능
   - 전체적인 영향도 확인 필요
