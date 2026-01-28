# 갤러리 관리 UI 및 파일명 개선 계획서

## 📋 개요

갤러리 관리 페이지의 UI/UX 개선 및 업스케일/회전/변환 기능의 파일명 표준화 계획서입니다.

---

## 🎯 개선 목표

1. 생성된 이미지 썸네일 UI 개선 (불필요한 버튼 제거, 하단 썸네일과 동일한 기능 추가)
2. 생성된 이미지 즉시 반영을 위한 리프레시 기능 추가
3. 업스케일 파일명 및 저장 위치 표준화
4. 회전/변환 파일명 표준화
5. **고객 이미지 파일명 개선 (고객 이름 추출)**

---

## 📝 상세 개선 사항

### 1. 생성된 이미지 썸네일 UI 개선

#### 현재 상태
- 생성된 이미지 썸네일에 "삭제" 버튼이 있으나 작동하지 않음 (로컬 상태에서만 제거)
- "replicate 변형" 버튼이 있음 (이미지 상세 정보에 있으므로 중복)
- 하단 썸네일에는 확대, 하트, 편집, 삭제 기능이 잘 작동 중

#### 개선 사항
- **기존 버튼 제거**: 작동하지 않는 "삭제" 버튼과 "replicate 변형" 버튼 제거
- **하단 썸네일과 동일한 기능 추가**: 확대, 하트, 편집, 삭제 버튼 추가
- **메타데이터 조회**: `imageUrl`로 `ImageMetadata` 객체를 생성하거나 조회하는 함수 추가

#### 구현 위치
- 파일: `pages/admin/gallery.tsx`
- 위치: `generatedImages.map()` 섹션 (약 4986-5029번째 줄)

#### 변경 내용
```tsx
// 제거할 버튼들
<button onClick={...} title="삭제">🗑️</button>  // 제거 (작동하지 않음)
<button onClick={...} title="변형">🎨</button>   // 제거 (replicate 변형 - 중복)

// 추가할 버튼들 (하단 썸네일과 동일)
<button onClick={...} title="확대">🔍</button>   // 추가
<button onClick={...} title="좋아요">❤️/🤍</button>  // 추가
<button onClick={...} title="편집">✏️</button>   // 추가
<button onClick={...} title="삭제">🗑️</button>  // 추가 (진짜 삭제)
```

---

### 2. 상단 "생성된 이미지" 썸네일 기능 강화

#### 현재 상태
- 상단 "생성된 이미지" 썸네일에 "삭제" 버튼과 "replicate 변형" 버튼만 있음
- "삭제" 버튼은 작동하지 않음 (로컬 상태에서만 제거)
- "replicate 변형" 버튼은 이미지 상세 정보에 있으므로 중복
- 하단 썸네일에는 확대, 하트, 편집, 삭제 기능이 잘 작동 중

#### 개선 사항
- **하단 썸네일과 동일한 기능 적용**: 상단 "생성된 이미지" 썸네일에 하단 썸네일과 동일한 버튼 추가
- **확대 버튼 추가**: 이미지 상세 정보로 이동 (`setSelectedImageForZoom`)
- **하트 버튼 추가**: 좋아요 기능 (`handleToggleLike`)
- **편집 버튼 추가**: 메타데이터 편집 (`startEditing`)
- **삭제 버튼 추가**: 진짜 삭제 (`handleDeleteImage` - Supabase Storage에서 완전 삭제)
- **기존 버튼 제거**: 작동하지 않는 "삭제" 버튼과 "replicate 변형" 버튼 제거

#### 구현 위치
- 파일: `pages/admin/gallery.tsx`
- 위치: `generatedImages.map()` 섹션 (약 4986-5029번째 줄)

#### 주의사항
- 생성된 이미지는 현재 `imageUrl` (string)만 가지고 있음
- 하단 썸네일은 `ImageMetadata` 객체를 사용
- 생성된 이미지의 메타데이터를 조회하거나, `imageUrl`로 `ImageMetadata` 객체를 생성해야 함

#### 버튼 배치 (하단 썸네일과 동일한 스타일)
```tsx
{/* 퀵 액션 버튼들: 확대 / 편집 / 삭제 / 좋아요 표시 */}
<div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col space-y-1">
  {/* 확대 버튼 */}
  <button
    onClick={(e) => {
      e.stopPropagation();
      // imageUrl로 ImageMetadata 객체 생성 또는 조회
      const imageMetadata = getImageMetadataFromUrl(imageUrl);
      setSelectedImageForZoom(imageMetadata);
    }}
    className="p-1 bg-white rounded shadow-sm hover:bg-gray-50"
    title="확대"
  >
    🔍
  </button>
  {/* 하트 버튼 */}
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      const imageMetadata = getImageMetadataFromUrl(imageUrl);
      handleToggleLike(imageMetadata, e);
    }}
    className={`p-1 rounded shadow-sm transition-colors ${
      likedImages.has(imageUrl)
        ? 'bg-red-100 hover:bg-red-200'
        : 'bg-white hover:bg-gray-50'
    }`}
    title={likedImages.has(imageUrl) ? "좋아요 취소" : "좋아요"}
  >
    {likedImages.has(imageUrl) ? '❤️' : '🤍'}
  </button>
  {/* 편집 버튼 */}
  <button
    onClick={(e) => {
      e.stopPropagation();
      const imageMetadata = getImageMetadataFromUrl(imageUrl);
      startEditing(imageMetadata);
    }}
    className="p-1 bg-white rounded shadow-sm hover:bg-gray-50"
    title="편집"
  >
    ✏️
  </button>
  {/* 삭제 버튼 (진짜 삭제) */}
  <button
    onClick={(e) => {
      e.stopPropagation();
      const imageMetadata = getImageMetadataFromUrl(imageUrl);
      const fullPath = imageMetadata.folder_path && imageMetadata.folder_path !== '' 
        ? `${imageMetadata.folder_path}/${imageMetadata.name}` 
        : imageMetadata.name;
      if (confirm(`"${imageMetadata.name}" 이미지를 삭제하시겠습니까?`)) {
        handleDeleteImage(fullPath);
        // 로컬 상태에서도 제거
        setGeneratedImages(prev => prev.filter((_, i) => i !== index));
      }
    }}
    className="p-1 bg-red-100 rounded shadow-sm hover:bg-red-200"
    title="삭제"
  >
    🗑️
  </button>
</div>
```

---

### 3. 하단 이미지 리프레시 기능

#### 현재 상태
- 생성된 이미지가 하단 전체 이미지 목록에 즉시 반영되지 않음
- 전체 페이지 새로고침이 필요함

#### 개선 사항
- **리프레시 버튼 추가**: 하단 이미지 그리드 영역에만 적용되는 리프레시 버튼
- 생성된 이미지 후 즉시 하단 이미지 목록 갱신

#### 구현 위치
- 파일: `pages/admin/gallery.tsx`
- 위치: 하단 이미지 그리드 상단 (검색/필터 영역 근처)

#### 기능
```tsx
<button 
  onClick={handleRefreshBottomImages}
  className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
>
  🔄 하단 이미지 새로고침
</button>
```

#### 구현 로직
- 현재 선택된 폴더의 이미지만 다시 로드
- `loadImages()` 함수 호출 (현재 폴더 기준)
- 생성된 이미지가 포함된 폴더 자동 감지

---

### 4. 업스케일 파일명 및 저장 위치 표준화

#### 현재 상태
- 파일명: `upscaled-{timestamp}.png`
- 저장 위치: `originals/ai-generated/{YYYY-MM-DD}/`
- 원본 이미지 정보 반영 안됨

#### 개선 사항

**4.1 업스케일 AI 설명 추가**
- 업스케일 버튼에 툴팁 또는 설명 추가
- 사용하는 AI: **Replicate의 nightmareai/real-esrgan (Real-ESRGAN 기반)**
- 설명: "2배 또는 4배 업스케일링 (Real-ESRGAN AI 사용)"

**4.2 파일명 형식 변경**
```
{원본이미지위치}-{제품명}-{사용AI}-upscale-{날짜}-{고유번호}.{확장자}
```

**예시:**
- `products-secret-force-gold-2-muziik-replicate-upscale-20260122-01.webp`
- `goods-massgoo-white-cap-2-replicate-upscale-20260122-01.webp`

**4.3 저장 위치 변경**
- 원본 이미지의 폴더 위치 확인
- 원본이 제품 갤러리인 경우: `originals/products/{제품slug}/gallery/`
- 원본이 굿즈 갤러리인 경우: `originals/goods/{제품slug}/gallery/`
- 원본이 카카오 콘텐츠인 경우: 원본과 동일한 폴더
- 원본 위치를 알 수 없는 경우: `originals/ai-generated/{YYYY-MM-DD}/`

#### 구현 위치
- 파일: `pages/api/admin/upscale-image.js`
- 변경 사항:
  1. 원본 이미지 메타데이터에서 위치 및 제품 정보 추출
  2. 표준 파일명 생성 함수 사용
  3. 저장 위치 결정 로직 추가

---

### 5. 회전/변환 파일명 표준화

#### 현재 상태
- 회전 파일명: `{원본파일명}-rotated-{각도}.{확장자}`
- 변환 파일명: `{원본파일명}-converted-{포맷}.{확장자}`

#### 개선 사항

**5.1 회전 파일명 형식**
```
{원본이미지위치}-{제품명}-rotate-{각도}-{포맷품질}-{날짜}-{고유번호}.{확장자}
```

**예시:**
- `products-secret-force-gold-2-muziik-rotate-90-webp85-20260122-01.webp`
- `products-secret-force-gold-2-muziik-rotate-180-jpg85-20260122-01.jpg`
- `products-secret-force-gold-2-muziik-rotate-270-png-20260122-01.png`

**5.2 변환 파일명 형식**
```
{원본이미지위치}-{제품명}-convert-{변환툴명}-{포맷품질}-{날짜}-{고유번호}.{확장자}
```

**예시:**
- `products-secret-force-gold-2-muziik-convert-sharp-webp85-20260122-01.webp`
- `products-secret-force-gold-2-muziik-convert-sharp-jpg85-20260122-01.jpg`
- `products-secret-force-gold-2-muziik-convert-sharp-png-20260122-01.png`

**포맷 품질 표기:**
- WebP: `webp85` (품질 85%), `webp90` (품질 90%)
- JPG: `jpg85` (품질 85%), `jpg90` (품질 90%)
- PNG: `png` (압축 레벨 9, 품질 표기 없음)

#### 구현 위치
- 파일: `pages/api/admin/rotate-image.js` (회전)
- 파일: `pages/api/admin/convert-image.js` (변환)
- 변경 사항:
  1. 원본 이미지 메타데이터에서 위치 및 제품 정보 추출
  2. 표준 파일명 생성 함수 사용
  3. 포맷 및 품질 정보 포함

---

### 6. 고객 이미지 파일명 개선

#### 현재 상태
- 고객 이미지에 Nanobanana 배경 변경 등을 적용하면 파일명이 `customers-none-nanobanana-background-20260126-01.webp`로 생성됨
- 고객 이름이 `none`으로 표시됨

#### 개선 사항
- **고객 이름 추출 함수 추가**: 폴더 경로에서 고객 이름 추출
- **파일명 형식**: `customers-{고객이름}-nanobanana-background-20260126-01.webp`
- **예시**: `customers-ahnhuija-nanobanana-background-20260126-01.webp`

#### 구현 위치
- 파일: `lib/filename-generator.ts`
  - `extractCustomerName` 함수 추가
  - `detectLocation` 함수 반환 타입에 `customers` 추가
  - `FilenameOptions` 인터페이스에 `customers` location 추가
- 파일: `pages/api/vary-nanobanana.js`
  - location이 `customers`인 경우 고객 이름 추출 로직 추가

#### 구현 코드
```typescript
// lib/filename-generator.ts
export function extractCustomerName(folderPath: string): string | undefined {
  if (!folderPath) return undefined;
  
  // originals/customers/{고객이름-숫자}/ 형식에서 고객 이름 추출
  const customerMatch = folderPath.match(/originals\/customers\/([^/]+)/);
  if (customerMatch) {
    const customerFolder = customerMatch[1];
    // 하이픈으로 분리하여 이름 부분만 추출 (예: ahnhuija-4404 -> ahnhuija)
    const namePart = customerFolder.split('-').slice(0, -1).join('-');
    if (namePart && !/^\d+$/.test(namePart)) {
      return namePart;
    }
    if (customerFolder && !/^\d+$/.test(customerFolder)) {
      return customerFolder;
    }
  }
  return undefined;
}
```

```javascript
// pages/api/vary-nanobanana.js
// 위치 감지 및 제품명/고객명 추출
let location = 'uploaded';
let productName = 'none';

if (targetFolderPath) {
  location = detectLocation(targetFolderPath);
  
  // 고객 이미지인 경우 고객 이름 추출
  if (location === 'customers') {
    const { extractCustomerName } = require('../../../lib/filename-generator');
    const extractedCustomerName = extractCustomerName(targetFolderPath);
    if (extractedCustomerName) {
      productName = extractedCustomerName;
    }
  } else {
    // 제품명 추출 시도
    const extractedProductName = await extractProductName(imageUrl);
    if (extractedProductName) {
      productName = extractedProductName;
    }
  }
}
```

---

## 🔧 구현 계획

### Phase 1: UI 개선 (갤러리 페이지)

#### 1.1 생성된 이미지 썸네일 버튼 제거
- [ ] `pages/admin/gallery.tsx`의 `generatedImages.map()` 섹션 수정
- [ ] "삭제" 버튼 제거 (4999-5011번째 줄)
- [ ] "replicate 변형" 버튼 제거 (5012-5025번째 줄)

#### 1.2 상단 "생성된 이미지" 썸네일 기능 추가
- [ ] 기존 "삭제" 버튼 제거 (작동하지 않음)
- [ ] 기존 "replicate 변형" 버튼 제거 (이미지 상세 정보에 있음)
- [ ] 확대 버튼 추가 (하단 썸네일과 동일한 기능)
- [ ] 하트 버튼 추가 (하단 썸네일과 동일한 기능)
- [ ] 편집 버튼 추가 (하단 썸네일과 동일한 기능)
- [ ] 삭제 버튼 추가 (하단 썸네일과 동일한 기능 - 진짜 삭제)
- [ ] `imageUrl`로 `ImageMetadata` 객체 생성/조회 함수 추가

#### 1.3 리프레시 버튼 추가
- [ ] 하단 이미지 그리드 상단에 리프레시 버튼 추가
- [ ] 현재 폴더의 이미지만 다시 로드하는 함수 구현
- [ ] 생성된 이미지 후 자동 리프레시 옵션 (선택사항)

---

### Phase 2: 업스케일 파일명 및 저장 위치 개선

#### 2.1 업스케일 API 수정 (`pages/api/admin/upscale-image.js`)

**변경 사항:**
1. 원본 이미지 메타데이터 조회
2. 위치 및 제품명 추출
3. 표준 파일명 생성 함수 사용
4. 저장 위치 결정 로직 추가

**파일명 생성:**
```javascript
const fileName = await generateStandardFileName({
  location: location, // 'products', 'goods', 'daily-kakao', 'ai-generated'
  productName: productName || 'none',
  compositionProgram: 'replicate', // 업스케일은 Replicate 사용
  compositionFunction: 'upscale',
  creationDate: new Date(),
  extension: 'png' // 또는 원본 확장자
});
```

**저장 위치 결정:**
```javascript
// 원본 이미지의 폴더 위치 확인
const storageLocation = await determineStorageLocationForAI(imageUrl, 'replicate');

if (storageLocation.location === 'current-folder' && storageLocation.folderPath) {
  // 원본과 동일한 폴더에 저장
  targetFolderPath = storageLocation.folderPath;
} else {
  // ai-generated 폴더에 저장
  targetFolderPath = `originals/ai-generated/${dateStr}`;
}
```

**업스케일 설명 추가:**
- 업스케일 버튼에 툴팁 추가
- "Replicate Real-ESRGAN AI를 사용한 2배/4배 업스케일링"

---

### Phase 3: 회전 파일명 표준화

#### 3.1 회전 API 수정 (`pages/api/admin/rotate-image.js`)

**변경 사항:**
1. 원본 이미지 메타데이터 조회
2. 위치 및 제품명 추출
3. 표준 파일명 생성 (회전 전용)

**파일명 형식:**
```javascript
// 회전 전용 파일명 생성 함수
const fileName = await generateRotationFileName({
  location: location,
  productName: productName || 'none',
  rotation: rotation, // 90, 180, 270
  format: targetFormat, // 'webp', 'jpg', 'png'
  quality: quality, // 85, 90 등
  creationDate: new Date(),
  extension: fileExtension
});
```

**파일명 예시:**
- `products-secret-force-gold-2-muziik-rotate-90-webp85-20260122-01.webp`
- `products-secret-force-gold-2-muziik-rotate-180-jpg85-20260122-01.jpg`

---

### Phase 4: 변환 파일명 표준화

#### 4.1 변환 API 수정 (`pages/api/admin/convert-image.js`)

---

### Phase 5: 고객 이미지 파일명 개선

#### 5.1 고객 이름 추출 함수 추가 (`lib/filename-generator.ts`)
- [ ] `extractCustomerName` 함수 추가
- [ ] `detectLocation` 함수 반환 타입에 `customers` 추가
- [ ] `FilenameOptions` 인터페이스에 `customers` location 추가

#### 5.2 Nanobanana API 수정 (`pages/api/vary-nanobanana.js`)
- [ ] location이 `customers`인 경우 고객 이름 추출 로직 추가
- [ ] 고객 이름이 추출되면 `productName`에 설정

#### 5.3 테스트
- [ ] 고객 이미지에 Nanobanana 배경 변경 적용
- [ ] 파일명이 `customers-{고객이름}-nanobanana-background-{날짜}-{번호}.webp` 형식인지 확인

---

### Phase 4: 변환 파일명 표준화 (계속)

#### 4.1 변환 API 수정 (`pages/api/admin/convert-image.js`)

**변경 사항:**
1. 원본 이미지 메타데이터 조회
2. 위치 및 제품명 추출
3. 표준 파일명 생성 (변환 전용)

**파일명 형식:**
```javascript
// 변환 전용 파일명 생성 함수
const fileName = await generateConvertFileName({
  location: location,
  productName: productName || 'none',
  tool: 'sharp', // 변환 툴명
  format: format, // 'webp', 'jpg', 'png'
  quality: quality, // 85, 90 등
  creationDate: new Date(),
  extension: fileExtension
});
```

**파일명 예시:**
- `products-secret-force-gold-2-muziik-convert-sharp-webp85-20260122-01.webp`
- `products-secret-force-gold-2-muziik-convert-sharp-jpg85-20260122-01.jpg`

---

## 📝 파일명 생성 유틸리티 함수 추가

### `lib/filename-generator.ts`에 추가할 함수

#### 1. 회전 파일명 생성 함수
```typescript
export async function generateRotationFileName(
  options: {
    location: string;
    productName: string;
    rotation: number; // 90, 180, 270
    format: 'webp' | 'jpg' | 'png';
    quality?: number; // 85, 90 등
    creationDate?: Date;
    uniqueNumber?: number;
    extension: string;
  }
): Promise<string> {
  const {
    location,
    productName = 'none',
    rotation,
    format,
    quality = 85,
    creationDate = new Date(),
    uniqueNumber,
    extension
  } = options;

  const dateStr = creationDate.toISOString().slice(0, 10).replace(/-/g, '');
  
  // 포맷 품질 표기
  let formatQuality = '';
  if (format === 'webp' || format === 'jpg') {
    formatQuality = `${format}${quality}`;
  } else {
    formatQuality = 'png'; // PNG는 품질 표기 없음
  }

  // 고유번호 자동 생성
  let finalUniqueNumber = uniqueNumber;
  if (!finalUniqueNumber) {
    finalUniqueNumber = await getNextUniqueNumber(
      location,
      productName,
      'rotate',
      `rotate-${rotation}-${formatQuality}`,
      dateStr
    );
  }

  const uniqueNumberStr = String(finalUniqueNumber).padStart(2, '0');
  
  // 파일명 조합
  const fileName = `${location}-${productName}-rotate-${rotation}-${formatQuality}-${dateStr}-${uniqueNumberStr}.${extension}`;
  
  return fileName;
}
```

#### 2. 변환 파일명 생성 함수
```typescript
export async function generateConvertFileName(
  options: {
    location: string;
    productName: string;
    tool: string; // 'sharp' 등
    format: 'webp' | 'jpg' | 'png';
    quality?: number;
    creationDate?: Date;
    uniqueNumber?: number;
    extension: string;
  }
): Promise<string> {
  const {
    location,
    productName = 'none',
    tool,
    format,
    quality = 85,
    creationDate = new Date(),
    uniqueNumber,
    extension
  } = options;

  const dateStr = creationDate.toISOString().slice(0, 10).replace(/-/g, '');
  
  // 포맷 품질 표기
  let formatQuality = '';
  if (format === 'webp' || format === 'jpg') {
    formatQuality = `${format}${quality}`;
  } else {
    formatQuality = 'png';
  }

  // 고유번호 자동 생성
  let finalUniqueNumber = uniqueNumber;
  if (!finalUniqueNumber) {
    finalUniqueNumber = await getNextUniqueNumber(
      location,
      productName,
      'convert',
      `convert-${tool}-${formatQuality}`,
      dateStr
    );
  }

  const uniqueNumberStr = String(finalUniqueNumber).padStart(2, '0');
  
  // 파일명 조합
  const fileName = `${location}-${productName}-convert-${tool}-${formatQuality}-${dateStr}-${uniqueNumberStr}.${extension}`;
  
  return fileName;
}
```

---

## 📊 변경 영향도 분석

### 영향받는 파일 목록

1. **UI 개선:**
   - `pages/admin/gallery.tsx` ⭐ (최우선)
     - 생성된 이미지 썸네일 버튼 제거 및 기능 추가
     - 하단 썸네일과 동일한 기능 적용 (확대, 하트, 편집, 삭제)
     - 리프레시 버튼 추가

2. **업스케일:**
   - `pages/api/admin/upscale-image.js` ⭐
   - `lib/filename-generator.ts` (업스케일 파일명 함수 추가)

3. **회전:**
   - `pages/api/admin/rotate-image.js` ⭐
   - `lib/filename-generator.ts` (회전 파일명 함수 추가)

4. **변환:**
   - `pages/api/admin/convert-image.js` ⭐
   - `lib/filename-generator.ts` (변환 파일명 함수 추가)

---

## ⚠️ 주의사항

### 1. 기존 파일명 호환성
- 기존에 생성된 파일명은 그대로 유지
- 새로 생성되는 파일만 새로운 구조 사용
- 기존 파일명 파싱 로직은 유지 (하위 호환성)

### 2. 저장 위치 결정
- 원본 이미지의 메타데이터가 없는 경우 fallback 처리
- 제품 정보가 없는 경우 `none` 사용
- 위치를 알 수 없는 경우 `ai-generated` 폴더 사용

### 3. 고유번호 충돌 방지
- 같은 날짜, 같은 조건에서 동시 생성 시 충돌 가능
- 트랜잭션 또는 락 메커니즘 필요
- 재시도 로직 구현

### 4. 리프레시 기능
- 현재 선택된 폴더의 이미지만 로드
- 검색/필터 조건 유지
- 생성된 이미지가 포함된 폴더 자동 감지

---

## 🗓️ 구현 일정

### Week 1: UI 개선
- [ ] 생성된 이미지 썸네일 버튼 제거
- [ ] 하단 썸네일 기능 추가 (확대, 하트, 메타편집, 삭제)
- [ ] 리프레시 버튼 추가 및 기능 구현

### Week 2: 파일명 표준화
- [ ] `lib/filename-generator.ts`에 회전/변환 파일명 함수 추가
- [ ] 업스케일 API 수정 (파일명 및 저장 위치)
- [ ] 회전 API 수정 (파일명)
- [ ] 변환 API 수정 (파일명)

### Week 3: 테스트 및 검증
- [ ] 각 기능별 테스트
- [ ] 파일명 생성 테스트
- [ ] 저장 위치 결정 테스트
- [ ] UI 동작 테스트

### Week 4: 배포 및 모니터링
- [ ] 스테이징 환경 배포
- [ ] 실제 사용 테스트
- [ ] 문제점 수정
- [ ] 프로덕션 배포

---

## 📝 구현 상세

### 1. 생성된 이미지 썸네일 버튼 제거

**파일:** `pages/admin/gallery.tsx`

**위치:** 약 4998-5026번째 줄

**변경 전:**
```tsx
<div className="opacity-0 group-hover:opacity-100 ...">
  <button onClick={...} title="삭제">🗑️</button>
  <button onClick={...} title="변형">🎨</button>
</div>
```

**변경 후:**
```tsx
<div className="opacity-0 group-hover:opacity-100 ...">
  {/* 버튼 제거 - 이미지 상세 정보에서 사용 가능 */}
</div>
```

---

### 2. 상단 "생성된 이미지" 썸네일 기능 추가

**파일:** `pages/admin/gallery.tsx`

**위치:** `generatedImages.map()` 섹션 (약 4986-5029번째 줄)

**추가할 함수:**
```tsx
// imageUrl로 ImageMetadata 객체 생성/조회
const getImageMetadataFromUrl = async (imageUrl: string): Promise<ImageMetadata | null> => {
  // 1. images 배열에서 찾기
  const existingImage = images.find(img => img.url === imageUrl);
  if (existingImage) {
    return existingImage;
  }
  
  // 2. API에서 메타데이터 조회
  try {
    const response = await fetch(`/api/admin/get-image-metadata?url=${encodeURIComponent(imageUrl)}`);
    if (response.ok) {
      const data = await response.json();
      return data.image;
    }
  } catch (error) {
    console.error('메타데이터 조회 실패:', error);
  }
  
  // 3. 기본 ImageMetadata 객체 생성 (fallback)
  const urlObj = new URL(imageUrl);
  const pathParts = urlObj.pathname.split('/');
  const fileName = pathParts[pathParts.length - 1];
  const folderPath = pathParts.slice(0, -1).join('/').replace('/storage/v1/object/public/blog-images/', '');
  
  return {
    name: fileName,
    url: imageUrl,
    folder_path: folderPath,
    size: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_liked: likedImages.has(imageUrl)
  } as ImageMetadata;
};
```

**변경할 코드:**
```tsx
{generatedImages.map((imageUrl, index) => {
  // imageUrl로 ImageMetadata 객체 가져오기
  const [imageMetadata, setImageMetadata] = useState<ImageMetadata | null>(null);
  
  useEffect(() => {
    getImageMetadataFromUrl(imageUrl).then(setImageMetadata);
  }, [imageUrl]);
  
  if (!imageMetadata) {
    // 로딩 중 또는 메타데이터 없음
    return (
      <div key={index} className="relative group">
        <img src={imageUrl} alt={`생성된 이미지 ${index + 1}`} className="..." />
      </div>
    );
  }
  
  return (
    <div key={index} className="relative group">
      <img
        src={imageUrl}
        alt={`생성된 이미지 ${index + 1}`}
        className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:border-blue-500 transition-colors"
      />
      {/* 퀵 액션 버튼들: 확대 / 편집 / 삭제 / 좋아요 표시 (하단 썸네일과 동일) */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col space-y-1">
        {/* 확대 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedImageForZoom(imageMetadata);
          }}
          className="p-1 bg-white rounded shadow-sm hover:bg-gray-50"
          title="확대"
        >
          🔍
        </button>
        {/* 하트 버튼 */}
        <button
          type="button"
          onClick={(e) => handleToggleLike(imageMetadata, e)}
          className={`p-1 rounded shadow-sm transition-colors ${
            likedImages.has(imageUrl)
              ? 'bg-red-100 hover:bg-red-200'
              : 'bg-white hover:bg-gray-50'
          }`}
          title={likedImages.has(imageUrl) ? "좋아요 취소" : "좋아요"}
        >
          {likedImages.has(imageUrl) ? '❤️' : '🤍'}
        </button>
        {/* 편집 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            startEditing(imageMetadata);
          }}
          className="p-1 bg-white rounded shadow-sm hover:bg-gray-50"
          title="편집"
        >
          ✏️
        </button>
        {/* 삭제 버튼 (진짜 삭제) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            const fullPath = imageMetadata.folder_path && imageMetadata.folder_path !== '' 
              ? `${imageMetadata.folder_path}/${imageMetadata.name}` 
              : imageMetadata.name;
            if (confirm(`"${imageMetadata.name}" 이미지를 삭제하시겠습니까?`)) {
              handleDeleteImage(fullPath);
              // 로컬 상태에서도 제거
              setGeneratedImages(prev => prev.filter((_, i) => i !== index));
            }
          }}
          className="p-1 bg-red-100 rounded shadow-sm hover:bg-red-200"
          title="삭제"
        >
          🗑️
        </button>
      </div>
    </div>
  );
})}
```

---

### 3. 리프레시 버튼 추가

**파일:** `pages/admin/gallery.tsx`

**위치:** 하단 이미지 그리드 상단

**추가할 함수:**
```tsx
const handleRefreshBottomImages = async () => {
  setIsRefreshing(true);
  try {
    // 현재 선택된 폴더의 이미지만 다시 로드
    await loadImages();
    toast.success('이미지 목록이 새로고침되었습니다.');
  } catch (error) {
    console.error('이미지 새로고침 실패:', error);
    toast.error('이미지 새로고침에 실패했습니다.');
  } finally {
    setIsRefreshing(false);
  }
};
```

**UI 추가:**
```tsx
<div className="flex justify-between items-center mb-4">
  <div>...</div>
  <button
    onClick={handleRefreshBottomImages}
    disabled={isRefreshing}
    className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
  >
    {isRefreshing ? '🔄 새로고침 중...' : '🔄 하단 이미지 새로고침'}
  </button>
</div>
```

---

### 4. 업스케일 API 수정

**파일:** `pages/api/admin/upscale-image.js`

**주요 변경:**
1. 원본 이미지 메타데이터 조회
2. 위치 및 제품명 추출
3. 표준 파일명 생성
4. 저장 위치 결정

**코드 예시:**
```javascript
// 원본 이미지 메타데이터 조회
const { data: originalMetadata } = await supabase
  .from('image_assets')
  .select('file_path, ai_tags')
  .eq('cdn_url', imageUrl)
  .maybeSingle();

// 위치 및 제품명 추출
let location = 'ai-generated';
let productName = 'none';

if (originalMetadata && originalMetadata.file_path) {
  const folderPath = originalMetadata.file_path.substring(0, originalMetadata.file_path.lastIndexOf('/'));
  
  if (folderPath.includes('products/') && folderPath.includes('/gallery')) {
    location = 'products';
    // 제품 slug 추출
    const match = folderPath.match(/products\/([^/]+)\/gallery/);
    if (match) productName = match[1];
  } else if (folderPath.includes('goods/') && folderPath.includes('/gallery')) {
    location = 'goods';
    const match = folderPath.match(/goods\/([^/]+)\/gallery/);
    if (match) productName = match[1];
  } else if (folderPath.includes('daily-branding/kakao/')) {
    location = 'daily-kakao';
  }
}

// 표준 파일명 생성
const { generateStandardFileName } = require('../../lib/filename-generator');
const fileName = await generateStandardFileName({
  location: location,
  productName: productName,
  compositionProgram: 'replicate',
  compositionFunction: 'upscale',
  creationDate: new Date(),
  extension: 'png'
});

// 저장 위치 결정
let targetFolderPath;
if (location === 'products' && productName !== 'none') {
  targetFolderPath = `originals/products/${productName}/gallery`;
} else if (location === 'goods' && productName !== 'none') {
  targetFolderPath = `originals/goods/${productName}/gallery`;
} else if (location === 'daily-kakao' && originalMetadata) {
  // 원본과 동일한 폴더
  targetFolderPath = originalMetadata.file_path.substring(0, originalMetadata.file_path.lastIndexOf('/'));
} else {
  const dateStr = new Date().toISOString().slice(0, 10);
  targetFolderPath = `originals/ai-generated/${dateStr}`;
}

const objectPath = `${targetFolderPath}/${fileName}`;
```

---

### 5. 회전 API 수정

**파일:** `pages/api/admin/rotate-image.js`

**주요 변경:**
1. 원본 이미지 메타데이터 조회
2. 위치 및 제품명 추출
3. 회전 전용 파일명 생성

**코드 예시:**
```javascript
// 원본 이미지 메타데이터 조회
const { data: originalMetadata } = await supabase
  .from('image_assets')
  .select('file_path, ai_tags')
  .eq('cdn_url', imageUrl)
  .maybeSingle();

// 위치 및 제품명 추출
let location = 'uploaded';
let productName = 'none';

if (originalMetadata && originalMetadata.file_path) {
  const folderPath = originalMetadata.file_path.substring(0, originalMetadata.file_path.lastIndexOf('/'));
  
  if (folderPath.includes('products/') && folderPath.includes('/gallery')) {
    location = 'products';
    const match = folderPath.match(/products\/([^/]+)\/gallery/);
    if (match) productName = match[1];
  } else if (folderPath.includes('goods/') && folderPath.includes('/gallery')) {
    location = 'goods';
    const match = folderPath.match(/goods\/([^/]+)\/gallery/);
    if (match) productName = match[1];
  }
}

// 회전 전용 파일명 생성
const { generateRotationFileName } = require('../../lib/filename-generator');
const fileName = await generateRotationFileName({
  location: location,
  productName: productName,
  rotation: Math.abs(rotation),
  format: targetFormat,
  quality: targetFormat === 'webp' ? 90 : (targetFormat === 'jpg' ? 90 : undefined),
  creationDate: new Date(),
  extension: fileExtension
});

// 원본과 동일한 폴더에 저장
const folderPath = originalMetadata?.file_path 
  ? originalMetadata.file_path.substring(0, originalMetadata.file_path.lastIndexOf('/'))
  : null;
const uploadPath = folderPath ? `${folderPath}/${fileName}` : fileName;
```

---

### 6. 변환 API 수정

**파일:** `pages/api/admin/convert-image.js`

**주요 변경:**
1. 원본 이미지 메타데이터 조회
2. 위치 및 제품명 추출
3. 변환 전용 파일명 생성

**코드 예시:**
```javascript
// 원본 이미지 메타데이터 조회
const { data: originalMetadata } = await supabase
  .from('image_assets')
  .select('file_path, ai_tags')
  .eq('cdn_url', imageUrl)
  .maybeSingle();

// 위치 및 제품명 추출
let location = 'uploaded';
let productName = 'none';

if (originalMetadata && originalMetadata.file_path) {
  const folderPath = originalMetadata.file_path.substring(0, originalMetadata.file_path.lastIndexOf('/'));
  
  if (folderPath.includes('products/') && folderPath.includes('/gallery')) {
    location = 'products';
    const match = folderPath.match(/products\/([^/]+)\/gallery/);
    if (match) productName = match[1];
  } else if (folderPath.includes('goods/') && folderPath.includes('/gallery')) {
    location = 'goods';
    const match = folderPath.match(/goods\/([^/]+)\/gallery/);
    if (match) productName = match[1];
  }
}

// 변환 전용 파일명 생성
const { generateConvertFileName } = require('../../lib/filename-generator');
const fileName = await generateConvertFileName({
  location: location,
  productName: productName,
  tool: 'sharp',
  format: format,
  quality: quality,
  creationDate: new Date(),
  extension: fileExtension
});

// 원본과 동일한 폴더에 저장
const folderPath = originalMetadata?.file_path 
  ? originalMetadata.file_path.substring(0, originalMetadata.file_path.lastIndexOf('/'))
  : null;
const uploadPath = folderPath ? `${folderPath}/${fileName}` : fileName;
```

---

## ✅ 체크리스트

### UI 개선
- [ ] 생성된 이미지 썸네일에서 기존 "삭제" 버튼 제거 (작동하지 않음)
- [ ] 생성된 이미지 썸네일에서 "replicate 변형" 버튼 제거 (중복)
- [ ] `imageUrl`로 `ImageMetadata` 객체 생성/조회 함수 추가
- [ ] 생성된 이미지 썸네일에 확대 버튼 추가 (하단 썸네일과 동일)
- [ ] 생성된 이미지 썸네일에 하트 버튼 추가 (하단 썸네일과 동일)
- [ ] 생성된 이미지 썸네일에 편집 버튼 추가 (하단 썸네일과 동일)
- [ ] 생성된 이미지 썸네일에 삭제 버튼 추가 (하단 썸네일과 동일 - 진짜 삭제)
- [ ] 하단 이미지 리프레시 버튼 추가

### 파일명 표준화
- [ ] `lib/filename-generator.ts`에 회전 파일명 함수 추가
- [ ] `lib/filename-generator.ts`에 변환 파일명 함수 추가
- [ ] 업스케일 API 파일명 변경
- [ ] 업스케일 API 저장 위치 변경
- [ ] 업스케일 버튼에 AI 설명 추가
- [ ] 회전 API 파일명 변경
- [ ] 변환 API 파일명 변경

### 테스트
- [ ] 각 기능별 테스트
- [ ] 파일명 생성 테스트
- [ ] 저장 위치 결정 테스트
- [ ] UI 동작 테스트

---

## 📚 참고 자료

- 현재 파일명 생성 로직:
  - `pages/api/admin/upscale-image.js` (라인 145)
  - `pages/api/admin/rotate-image.js` (라인 121-122)
  - `pages/api/admin/convert-image.js` (확인 필요)

- 관련 문서:
  - `docs/filename-generation-standardization-plan.md`: 파일명 생성 규칙 표준화 계획서

---

## 🎯 최종 목표

1. **UI 개선**: 불필요한 버튼 제거, 필요한 기능 추가
2. **파일명 표준화**: 모든 이미지 처리 기능의 파일명을 일관된 형식으로 통일
3. **사용자 경험 향상**: 생성된 이미지 즉시 반영, 직관적인 UI
