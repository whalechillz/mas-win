# 제품 이미지 업로드 파일명 표준화 계획서

## 📋 개요

제품 관리 페이지에서 제품 이미지를 업로드할 때 파일명을 표준화하고, 갤러리 관리의 일반 업로드 방식도 표준 파일명 형식으로 통일하는 계획서입니다.

---

## 🎯 개선 목표

1. **제품 이미지 업로드 파일명 표준화**: `massgoo-{풀제품명}-{날짜}-{순번}.webp` 형식
2. **갤러리 일반 업로드 표준화**: 표준 파일명 형식 적용 (위치 기반)
3. **기존 방식 유지**: 동영상 등 특수 케이스는 기존 방식 유지

---

## 📝 현재 상태 분석

### 1. 제품 이미지 업로드 (`pages/api/admin/upload-product-image.js`)

#### 현재 파일명 생성 방식
```javascript
// 1. 커스텀 파일명 (shaft, badge 등)
if (customFileName) {
  webpFileName = `${customFileName}.webp`;
}
// 2. 원본 파일명 유지 (확장자만 .webp로 변경)
else if (preserveFilename) {
  const baseName = path.parse(originalName).name;
  webpFileName = `${baseName}.webp`;
}
// 3. 기본: 폴더명 + 타임스탬프 + 랜덤 문자열
else {
  const folderPrefix = extractFolderPrefix(category); // 'cap', 'driver' 등
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  webpFileName = `${folderPrefix}-${timestamp}-${randomString}.webp`;
}
```

#### 저장 경로
- 제품: `originals/products/{productSlug}/detail/` 또는 `originals/products/{productSlug}/gallery/`
- 굿즈: `originals/goods/{productSlug}/detail/` 또는 `originals/goods/{productSlug}/gallery/`

#### 문제점
- 표준 파일명 형식이 적용되지 않음
- 타임스탬프와 랜덤 문자열 사용으로 파일명이 길고 의미 없음
- 제품명이 파일명에 포함되지 않음

---

### 2. 갤러리 일반 업로드 (`pages/api/upload-image-supabase.js`)

#### 현재 업로드 방식 (2가지)

**방식 1: 파일명 최적화 (optimize-filename)**
- 파일명을 완전히 새로 생성
- 타임스탬프, 랜덤 문자열 사용
- 한글 파일명 자동 변환

**방식 2: 파일명 유지 (preserve-filename)** ✅ 현재 동영상도 문제 없음
- 한글만 영문으로 변환
- 확장자 그대로 유지
- 원본 파일명 구조 유지

#### 문제점
- 표준 파일명 형식 (`{위치}-{제품명}-{프로그램}-{기능}-{날짜}-{번호}.{확장자}`)이 적용되지 않음
- 위치 기반 파일명 생성이 없음

---

### 3. 고객 이미지 업로드 (참고)

#### 현재 파일명 형식
```
{영문이름}_s{장면코드}_{타입}_{번호}.webp
```
예: `ahnhuija_s1_img_3385_08.webp`

#### 저장 경로
```
originals/customers/{영문이름}-{전화번호마지막4자리}/{방문일자}/{파일명}
```

#### 특징
- 고객 이름 기반 파일명
- 날짜와 순번 포함
- ✅ 잘 작동 중 (변경 불필요)

---

## 🔧 개선 계획

### Phase 1: 제품 이미지 업로드 파일명 표준화

#### 1.1 파일명 형식 정의

**제품 이미지 파일명 형식:**
```
massgoo-{풀제품명}-{날짜}-{순번}.webp
```

**예시:**
- `massgoo-secret-force-gold-2-muziik-20260126-01.webp`
- `massgoo-secret-weapon-black-muziik-20260126-01.webp`
- `massgoo-massgoo-pro3-beryl-240-20260126-01.webp`

**규칙:**
- `massgoo`: 고정 prefix
- `{풀제품명}`: productSlug 사용 (하이픈으로 연결)
- `{날짜}`: YYYYMMDD 형식
- `{순번}`: 2자리 숫자 (01, 02, 03...)
- 확장자: `.webp` (항상 WebP로 변환)

#### 1.2 구현 위치

**파일:** `pages/api/admin/upload-product-image.js`

**변경 사항:**
1. `generateProductImageFileName` 함수 추가 또는 `lib/filename-generator.ts`에 추가
2. 파일명 생성 로직 수정
3. 순번 자동 증가 로직 추가

#### 1.3 구현 코드

```javascript
// lib/filename-generator.ts에 추가
export async function generateProductImageFileName(
  productSlug: string,
  creationDate?: Date,
  uniqueNumber?: number
): Promise<string> {
  const date = creationDate || new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  
  // 고유번호 자동 생성 (없는 경우)
  let finalUniqueNumber = uniqueNumber;
  if (!finalUniqueNumber) {
    finalUniqueNumber = await getNextProductImageUniqueNumber(productSlug, dateStr);
  }
  
  // 고유번호 2자리 포맷팅
  const uniqueNumberStr = String(finalUniqueNumber).padStart(2, '0');
  
  // 파일명 조합
  const fileName = `massgoo-${productSlug}-${dateStr}-${uniqueNumberStr}.webp`;
  
  return fileName;
}

// 제품 이미지 고유번호 생성
async function getNextProductImageUniqueNumber(
  productSlug: string,
  creationDate: string
): Promise<number> {
  if (!supabase) return 1;
  
  try {
    // 해당 제품의 해당 날짜 이미지 개수 조회
    const dateStr = `${creationDate.slice(0, 4)}-${creationDate.slice(4, 6)}-${creationDate.slice(6, 8)}`;
    const folderPath = `originals/products/${productSlug}/detail`;
    const goodsFolderPath = `originals/goods/${productSlug}/detail`;
    
    // products와 goods 폴더 모두 확인
    const [productsFiles, goodsFiles] = await Promise.all([
      supabase.storage.from('blog-images').list(folderPath, { limit: 1000 }),
      supabase.storage.from('blog-images').list(goodsFolderPath, { limit: 1000 })
    ]);
    
    const allFiles = [
      ...(productsFiles.data || []),
      ...(goodsFiles.data || [])
    ];
    
    // 해당 날짜의 파일만 필터링
    const datePattern = new RegExp(`massgoo-${productSlug}-${creationDate}-(\\d{2})\\.webp`);
    const matchingFiles = allFiles.filter(file => datePattern.test(file.name));
    
    if (matchingFiles.length === 0) {
      return 1;
    }
    
    // 최대 번호 찾기
    const maxNumber = matchingFiles.reduce((max, file) => {
      const match = file.name.match(datePattern);
      if (match) {
        const num = parseInt(match[1], 10);
        return Math.max(max, num);
      }
      return max;
    }, 0);
    
    return maxNumber + 1;
  } catch (error) {
    console.warn('⚠️ 고유번호 생성 실패, 기본값 사용:', error);
    return 1;
  }
}
```

```javascript
// pages/api/admin/upload-product-image.js 수정
import { generateProductImageFileName } from '../../../lib/filename-generator';

// 파일명 생성 부분 수정
let webpFileName;
if (customFileName) {
  // 커스텀 파일명 사용 (shaft, badge 등) - 기존 방식 유지
  webpFileName = `${customFileName}.webp`;
} else if (preserveFilename) {
  // 원본 파일명 유지 모드 - 기존 방식 유지
  const baseName = path.parse(originalName).name;
  webpFileName = `${baseName}.webp`;
} else {
  // ✅ 새로운 표준 파일명 형식 사용
  webpFileName = await generateProductImageFileName(
    productSlug,
    new Date()
  );
}
```

---

### Phase 2: 갤러리 일반 업로드 표준화

#### 2.1 업로드 방식 분석

**현재 방식 2가지:**

1. **방식 1 (optimize-filename)**: 파일명 완전 재생성
   - 타임스탬프, 랜덤 문자열 사용
   - 표준 파일명 형식 미적용

2. **방식 2 (preserve-filename)**: 한글만 영문 변환 ✅
   - 한글 파일명만 영문으로 변환
   - 확장자 그대로 유지
   - 동영상도 문제 없음
   - **이 방식은 유지** (특수 케이스용)

#### 2.2 개선 방안

**방식 1을 표준 파일명 형식으로 변경:**

```
{위치}-{제품명}-upload-{날짜}-{고유번호}.{확장자}
```

**위치 감지:**
- `targetFolder` 파라미터에서 위치 추출
- 예: `originals/products/secret-force-gold-2-muziik/gallery` → `products`
- 예: `originals/goods/secret-cap/gallery` → `goods`
- 예: `originals/customers/ahnhuija-4404/2026-01-26` → `customers`
- 예: `originals/blog/2026-01/309` → `blog`
- 예: 없음 → `uploaded`

**제품명 추출:**
- 폴더 경로에서 제품 slug 추출
- 예: `originals/products/secret-force-gold-2-muziik/gallery` → `secret-force-gold-2-muziik`
- 예: `originals/goods/secret-cap/gallery` → `secret-cap`
- 없으면 `none`

#### 2.3 구현 위치

**파일:** `pages/api/upload-image-supabase.js`

**변경 사항:**
1. `uploadMode === 'optimize-filename'`일 때 표준 파일명 형식 사용
2. `targetFolder`에서 위치 및 제품명 추출
3. `generateStandardFileName` 함수 사용

#### 2.4 구현 코드

```javascript
// pages/api/upload-image-supabase.js 수정
import { generateStandardFileName, detectLocation, extractProductName, extractCustomerName } from '../../lib/filename-generator';

// 파일명 생성 부분 수정
let finalFileName;

if (customFileName) {
  // 커스텀 파일명 사용 (고객 이미지 등)
  finalFileName = customFileName;
} else if (effectiveUploadMode === 'preserve-filename') {
  // ✅ 방식 2: 한글만 영문 변환, 확장자 유지 (기존 방식 유지)
  if (hasKoreanInFileName) {
    const { translateKoreanToEnglish } = require('../../lib/korean-to-english-translator');
    const baseName = originalFilename.replace(/\.[^/.]+$/, '');
    const ext = originalFilename.match(/\.[^/.]+$/)?.[0] || '';
    const translatedBase = translateKoreanToEnglish(baseName);
    finalFileName = `${translatedBase}${ext}`;
  } else {
    finalFileName = originalFilename;
  }
} else if (effectiveUploadMode === 'optimize-filename') {
  // ✅ 방식 1: 표준 파일명 형식 사용
  let location = 'uploaded';
  let productName = 'none';
  
  // targetFolder에서 위치 및 제품명 추출
  if (targetFolder) {
    location = detectLocation(targetFolder);
    
    // 고객 이미지인 경우
    if (location === 'customers') {
      const customerName = extractCustomerName(targetFolder);
      if (customerName) {
        productName = customerName;
      }
    } else {
      // 제품명 추출
      const extractedProductName = await extractProductName(null, targetFolder);
      if (extractedProductName) {
        productName = extractedProductName;
      }
    }
  }
  
  // 확장자 추출
  const fileExtension = originalFilename.split('.').pop()?.toLowerCase() || 'webp';
  
  // 표준 파일명 생성
  finalFileName = await generateStandardFileName({
    location: location,
    productName: productName,
    compositionProgram: 'none',
    compositionFunction: 'upload',
    creationDate: new Date(),
    extension: fileExtension
  });
} else {
  // 기존 로직 (하위 호환성)
  // ...
}
```

---

### Phase 3: 회전/변환 등 기존 표준 파일명 형식과의 통합

#### 3.1 기존 표준 파일명 형식

**회전:**
```
{위치}-{제품명}-rotate-{각도}-{포맷품질}-{날짜}-{고유번호}.{확장자}
```

**변환:**
```
{위치}-{제품명}-convert-{툴명}-{포맷품질}-{날짜}-{고유번호}.{확장자}
```

**업로드 (새로 추가):**
```
{위치}-{제품명}-upload-{날짜}-{고유번호}.{확장자}
```

#### 3.2 통합 확인

- ✅ 모든 파일명이 동일한 패턴 사용
- ✅ 위치 기반 저장 경로 결정
- ✅ 제품명/고객명 포함
- ✅ 날짜 및 고유번호 포함

---

## 📊 비교표

### 제품 이미지 업로드

| 항목 | 현재 | 개선 후 |
|------|------|---------|
| **파일명 형식** | `{folderPrefix}-{timestamp}-{random}.webp` | `massgoo-{제품명}-{날짜}-{순번}.webp` |
| **예시** | `cap-1769438032663-a3f2b1.webp` | `massgoo-secret-force-gold-2-muziik-20260126-01.webp` |
| **제품명 포함** | ❌ | ✅ |
| **의미 있는 파일명** | ❌ | ✅ |
| **순번 자동 증가** | ❌ | ✅ |

### 갤러리 일반 업로드

| 항목 | 방식 1 (현재) | 방식 1 (개선 후) | 방식 2 |
|------|--------------|-----------------|--------|
| **파일명 형식** | `{timestamp}-{random}.{ext}` | `{위치}-{제품명}-upload-{날짜}-{번호}.{ext}` | 한글→영문, 확장자 유지 |
| **위치 기반** | ❌ | ✅ | ❌ |
| **제품명 포함** | ❌ | ✅ | ❌ |
| **동영상 호환** | ✅ | ✅ | ✅ (현재 문제 없음) |
| **용도** | 일반 업로드 | 일반 업로드 (표준화) | 특수 케이스 (유지) |

---

## 🔧 구현 계획

### Phase 1: 제품 이미지 업로드 파일명 표준화

#### 1.1 유틸리티 함수 추가
- [ ] `lib/filename-generator.ts`에 `generateProductImageFileName` 함수 추가
- [ ] `getNextProductImageUniqueNumber` 함수 추가

#### 1.2 API 수정
- [ ] `pages/api/admin/upload-product-image.js` 수정
- [ ] 표준 파일명 형식 적용
- [ ] 커스텀 파일명 및 preserveFilename 옵션은 기존 방식 유지

#### 1.3 테스트
- [ ] 제품 이미지 업로드 테스트
- [ ] 파일명 형식 확인
- [ ] 순번 자동 증가 확인

---

### Phase 2: 갤러리 일반 업로드 표준화

#### 2.1 유틸리티 함수 수정
- [ ] `lib/filename-generator.ts`의 `extractProductName` 함수 수정 (targetFolder 지원)
- [ ] `extractCustomerName` 함수 확인

#### 2.2 API 수정
- [ ] `pages/api/upload-image-supabase.js` 수정
- [ ] `uploadMode === 'optimize-filename'`일 때 표준 파일명 형식 사용
- [ ] `uploadMode === 'preserve-filename'`은 기존 방식 유지

#### 2.3 테스트
- [ ] 갤러리 일반 업로드 테스트 (방식 1)
- [ ] 동영상 업로드 테스트 (방식 2)
- [ ] 파일명 형식 확인

---

## ⚠️ 주의사항

### 1. 하위 호환성
- 커스텀 파일명 옵션은 기존 방식 유지
- `preserveFilename` 옵션은 기존 방식 유지
- `preserve-filename` 업로드 모드는 기존 방식 유지 (동영상 등)

### 2. 기존 파일
- 기존에 업로드된 파일은 변경하지 않음
- 새로운 업로드부터 표준 파일명 적용

### 3. 동영상 처리
- 동영상은 `preserve-filename` 모드 사용 (기존 방식 유지)
- 표준 파일명 형식은 이미지에만 적용

---

## 📝 파일 변경 목록

### 생성/수정 파일
- `lib/filename-generator.ts`: `generateProductImageFileName`, `getNextProductImageUniqueNumber` 함수 추가
- `pages/api/admin/upload-product-image.js`: 표준 파일명 형식 적용
- `pages/api/upload-image-supabase.js`: 표준 파일명 형식 적용 (방식 1)

### 참고 파일
- `pages/api/admin/upload-customer-image.js`: 고객 이미지 파일명 규칙 (변경 불필요)
- `lib/filename-generator.ts`: 기존 표준 파일명 함수들

---

## 🚀 실행 순서

1. **Phase 1 실행**
   - 유틸리티 함수 추가
   - 제품 이미지 업로드 API 수정
   - 테스트

2. **Phase 2 실행**
   - 유틸리티 함수 수정
   - 갤러리 업로드 API 수정
   - 테스트

3. **통합 테스트**
   - 모든 업로드 방식 테스트
   - 파일명 형식 확인
   - 기존 기능 동작 확인

---

## 📊 예상 결과

### 제품 이미지 업로드
- **이전**: `cap-1769438032663-a3f2b1.webp`
- **이후**: `massgoo-secret-force-gold-2-muziik-20260126-01.webp`

### 갤러리 일반 업로드 (방식 1)
- **이전**: `1769438032663-a3f2b1.jpg`
- **이후**: `products-secret-force-gold-2-muziik-upload-20260126-01.jpg`

### 갤러리 일반 업로드 (방식 2) - 유지
- **이전**: `한글파일명.jpg` → `hangeul-pailmyeong.jpg`
- **이후**: `한글파일명.jpg` → `hangeul-pailmyeong.jpg` (변경 없음)
