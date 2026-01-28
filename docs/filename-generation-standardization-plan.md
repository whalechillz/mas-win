# 파일명 생성 규칙 표준화 계획서

## 📋 개요

현재 시스템의 모든 이미지 파일명 생성 방식을 확인하고, 새로운 표준화된 파일명 구조로 통일하는 계획서입니다.

---

## 🔍 현재 파일명 생성 방식 분석

### 1. 제품 합성 이미지 (`compose-product-image.js`)

**현재 형식:**
- `composed-1-{UUID}-{timestamp}.webp`
- `{원본파일명}-composed-{제품slug}.{확장자}`
- 예: `product-1769392209500-ums18w-composed-secret-force-gold-2-muziik.png`

**생성 위치:**
- 카카오 콘텐츠: `originals/daily-branding/kakao/{날짜}/{account}/{type}/`
- 제품 갤러리: `originals/products/{제품slug}/gallery/` 또는 `originals/goods/{제품slug}/gallery/`

**문제점:**
- 파일명이 너무 복잡함
- `-composed-` 패턴이 중복될 수 있음 (재합성 시)
- 합성 프로그램 정보 없음
- 합성 기능 정보 없음
- 생성일이 타임스탬프로만 표시됨

---

### 2. Nanobanana 변형 이미지 (`vary-nanobanana.js`)

**현재 형식:**
- `nanobanana-variation-{timestamp}-{randomString}.{확장자}`
- 예: `nanobanana-variation-1768840431601-5l9vdx.webp`

**생성 위치:**
- 원본 이미지와 동일한 폴더
- 고객 폴더인 경우: `originals/customers/{고객명}/`

**문제점:**
- 합성 기능 정보 없음 (tone/background/object 구분 없음)
- 생성일이 타임스탬프로만 표시됨
- 위치 정보 없음

---

### 3. FAL AI 변형 이미지 (`vary-existing-image.js`)

**현재 형식:**
- `existing-variation-{timestamp}.png`
- 예: `existing-variation-1768840431601.png`

**생성 위치:**
- `uploaded/{YYYY-MM}/{YYYY-MM-DD}/`
- 고객 폴더인 경우: 원본과 동일한 폴더

**문제점:**
- 합성 프로그램 정보 없음
- 합성 기능 정보 없음
- 생성일이 타임스탬프로만 표시됨
- 위치 정보 없음

---

### 4. Replicate 변형 이미지 (`generate-blog-image-replicate-flux`)

**현재 형식:**
- `replicate-variation-{timestamp}-{index}.png`
- 예: `replicate-variation-1769420993515-1.png`

**생성 위치:**
- 원본 이미지와 동일한 폴더 또는 `uploaded/` 폴더

**문제점:**
- 합성 기능 정보 없음
- 생성일이 타임스탬프로만 표시됨
- 위치 정보 없음

---

### 5. 카카오 콘텐츠 생성 이미지 (`kakao-content/generate-images.js`)

**현재 형식:**
- `kakao-{account}-{type}-{timestamp}-{i}-{imgIdx}.jpg`
- 예: `kakao-account1-profile-1768230321468-1-1.jpg`

**생성 위치:**
- `originals/daily-branding/kakao/{YYYY-MM-DD}/{account}/{type}/`

**문제점:**
- 합성 프로그램 정보 없음
- 합성 기능 정보 없음
- 생성일이 타임스탬프로만 표시됨
- 제품 정보 없음 (제품 합성 시)

---

### 6. 고객 이미지 (`upload-customer-image.js`, `customer-image-filename-generator.ts`)

**현재 형식:**
- `{영문이름}_s{장면코드}_{타입}_{번호}.webp`
- 예: `joseotdae_s6_signature_01.webp`

**생성 위치:**
- `originals/customers/{영문이름}-{전화번호마지막4자리}/{방문일자}/`

**특징:**
- 이미 표준화된 형식 사용 중
- 변경 불필요 (고객 이미지는 별도 규칙 유지)

---

### 7. 일반 이미지 업로드 (`upload-image-supabase.js`)

**현재 형식:**
- `{원본파일명}` (preserve-filename 모드)
- `{SEO파일명}` (optimize-filename 모드)
- `image-{timestamp}.{확장자}` (기본)

**생성 위치:**
- 지정된 폴더 또는 `uploaded/` 폴더

---

## 🎯 새로운 파일명 구조

### 표준 파일명 형식

**파일명 (하이픈으로 연결):**
```
{위치}-{제품명}-{합성프로그램}-{합성기능}-{생성일}-{고유번호}.{확장자}
```

**저장 경로 (슬래시로 구분):**
```
originals/{위치}/{제품명}/{합성프로그램}/{합성기능}/{생성일}/{파일명}
```

또는 제품 갤러리의 경우:
```
originals/{위치}/{제품명}/gallery/{합성프로그램}/{합성기능}/{생성일}/{파일명}
```

### 구성 요소 상세

#### 1. 위치 (Location)
- `daily-kakao`: 카카오 콘텐츠
- `goods`: 굿즈 제품
- `products`: 제품
- `customers`: 고객 (기존 규칙 유지)
- `blog`: 블로그
- `uploaded`: 일반 업로드

**예시:**
- `daily-kakao`
- `goods`
- `products`

---

#### 2. 제품명 (Product Name)
- 제품 slug 사용
- 하이픈으로 구분
- 소문자

**예시:**
- `massgoo-white-cap-2`
- `secret-force-gold-2-muziik`
- `secret-weapon-black-muziik`

**제품이 없는 경우:**
- `general` 또는 생략

---

#### 3. 합성 프로그램 (Composition Program)
- `nanobanana`: Nanobanana AI
- `fal`: FAL AI
- `replicate`: Replicate Flux
- `none`: 합성 없음 (원본)

**예시:**
- `nanobanana`
- `fal`
- `replicate`

---

#### 4. 합성 기능 (Composition Function)
- `tone`: 톤 변경
- `background`: 배경 변경
- `object`: 오브젝트 변경
- `composed`: 제품 합성
- `variation`: 일반 변형
- `none`: 기능 없음

**예시:**
- `tone`
- `background`
- `object`
- `composed`

---

#### 5. 생성일 (Creation Date)
- 형식: `YYYYMMDD`
- 예: `20260122`

---

#### 6. 고유번호 (Unique Number)
- 2자리 숫자 (01, 02, 03, ...)
- 같은 날짜, 같은 조건에서 생성된 이미지 구분용
- 자동 증가

---

#### 7. 확장자 (Extension)
- 원본 이미지와 동일한 확장자 사용
- `.webp`, `.jpg`, `.png` 등

---

## 📝 새로운 파일명 및 저장 경로 예시

### 예시 1: 카카오 콘텐츠 + 제품 합성

**파일명:**
```
daily-kakao-secret-force-gold-2-muziik-nanobanana-composed-20260122-01.webp
```

**저장 경로:**
```
originals/daily-branding/kakao/2026-01-22/account1/feed/daily-kakao-secret-force-gold-2-muziik-nanobanana-composed-20260122-01.webp
```

**구성:**
- 위치: `daily-kakao` (카카오 콘텐츠)
- 제품명: `secret-force-gold-2-muziik`
- 합성 프로그램: `nanobanana`
- 합성 기능: `composed`
- 생성일: `20260122`
- 고유번호: `01`
- 확장자: `.webp`

---

### 예시 2: 제품 갤러리 + Nanobanana 톤 변경

**파일명:**
```
products-secret-force-gold-2-muziik-nanobanana-tone-20260122-01.webp
```

**저장 경로:**
```
originals/products/secret-force-gold-2-muziik/gallery/products-secret-force-gold-2-muziik-nanobanana-tone-20260122-01.webp
```

**구성:**
- 위치: `products` (제품)
- 제품명: `secret-force-gold-2-muziik`
- 합성 프로그램: `nanobanana`
- 합성 기능: `tone`
- 생성일: `20260122`
- 고유번호: `01`
- 확장자: `.webp`

---

### 예시 3: 굿즈 갤러리 + FAL 배경 변경

**파일명:**
```
goods-massgoo-white-cap-2-fal-background-20260122-01.webp
```

**저장 경로:**
```
originals/goods/massgoo-white-cap-2/gallery/goods-massgoo-white-cap-2-fal-background-20260122-01.webp
```

**구성:**
- 위치: `goods` (굿즈)
- 제품명: `massgoo-white-cap-2`
- 합성 프로그램: `fal`
- 합성 기능: `background`
- 생성일: `20260122`
- 고유번호: `01`
- 확장자: `.webp`

---

### 예시 4: Replicate 일반 변형

**파일명:**
```
products-secret-weapon-black-muziik-replicate-variation-20260122-01.png
```

**저장 경로:**
```
originals/products/secret-weapon-black-muziik/gallery/products-secret-weapon-black-muziik-replicate-variation-20260122-01.png
```

**구성:**
- 위치: `products` (제품)
- 제품명: `secret-weapon-black-muziik`
- 합성 프로그램: `replicate`
- 합성 기능: `variation`
- 생성일: `20260122`
- 고유번호: `01`
- 확장자: `.png`

---

### 예시 5: 블로그 이미지 업로드

**파일명:**
```
blog-{blogId}-{YYYYMMDD}-{원본파일명영문추출}-{고유번호2자리}.{확장자}
```

**저장 경로:**
```
originals/blog/{YYYY-MM}/{blogId}/{파일명}
```

**구성:**
- 위치: `blog` (블로그)
- 블로그 ID: 블로그 포스트 ID
- 생성일: 업로드 날짜 (`YYYYMMDD` 형식)
- 원본 파일명 영문 추출: 사용자가 업로드한 파일명에서 한글 제거, 영문으로 변환, 특수문자 변환
- 고유번호: 같은 블로그, 같은 날짜에서 생성된 이미지 순서 (01, 02, 03...)
- 확장자: 원본 확장자 또는 최적화된 확장자

**예시:**
- 파일명: `blog-309-20260122-driver-image-01.webp`
- 저장 경로: `originals/blog/2026-01/309/blog-309-20260122-driver-image-01.webp`

**특징:**
- 블로그별로 폴더 분리 (`originals/blog/{YYYY-MM}/{blogId}/`)
- 파일명에 블로그 ID, 생성일, 고유번호 포함하여 블로그별 이미지 식별 가능
- 날짜별 폴더 구조로 관리 용이
- 복수 파일 업로드 시 각각 고유번호 자동 할당

---

### 예시 6: 고객 이미지 업로드

**파일명:**
```
{영문이름}_s{장면코드}_{타입}_{번호}.webp
```

**저장 경로:**
```
originals/customers/{영문이름}-{전화번호마지막4자리}/{방문일자}/{파일명}
```

**구성:**
- 영문 이름: 고객의 한글 이름을 영문으로 변환 (하이픈, 공백 제거, 소문자)
- 장면 코드: 스토리보드 장면 번호 (s1~s7)
- 타입: 이미지 종류 (signature, swing-scene, swing-consultation 등)
- 번호: 같은 장면, 같은 타입의 순서 (01, 02, 03...)
- 확장자: `.webp` (이미지), 원본 형식 (동영상)

**예시:**
- 파일명: `joseotdae_s6_signature_01.webp`
- 저장 경로: `originals/customers/joseotdae-7010/2026-01-22/joseotdae_s6_signature_01.webp`

**특징:**
- 고객별 폴더 분리 (`originals/customers/{영문이름}-{전화번호마지막4자리}/`)
- 방문일자별 폴더 분리 (`/{방문일자}/`)
- 파일명만으로 고객, 장면, 타입 식별 가능
- 기존 규칙 유지 (변경 불필요)

---

## 🔧 구현 계획

### Phase 1: 파일명 생성 유틸리티 함수 생성

**파일:** `lib/filename-generator.ts`

**함수:**
```typescript
interface FilenameOptions {
  location: 'daily-kakao' | 'goods' | 'products' | 'blog' | 'uploaded';
  productName?: string; // 제품 slug
  compositionProgram: 'nanobanana' | 'fal' | 'replicate' | 'none';
  compositionFunction: 'tone' | 'background' | 'object' | 'composed' | 'variation' | 'none';
  creationDate?: Date; // 없으면 현재 날짜
  uniqueNumber?: number; // 없으면 자동 생성
  extension: string; // 'webp', 'jpg', 'png' 등
}

function generateStandardFileName(options: FilenameOptions): string {
  // 파일명 생성 로직
}
```

**기능:**
- 위치, 제품명, 합성 프로그램, 합성 기능, 생성일, 고유번호를 하이픈(`-`)으로 연결하여 파일명 생성
- 고유번호 자동 증가 (같은 날짜, 같은 조건에서)
- 파일명 길이 제한 (최대 255자)
- 저장 경로는 위치에 따라 자동 결정 (카카오 콘텐츠, 제품 갤러리, 굿즈 갤러리 등)

---

### Phase 2: 각 API 파일 수정

#### 2.1 제품 합성 API (`compose-product-image.js`)

**변경 사항:**
- `saveImageToSupabase` 함수에서 새로운 파일명 생성 함수 사용
- 위치 자동 감지: `daily-kakao`, `goods`, `products`
- 합성 프로그램: `nanobanana` (기본값)
- 합성 기능: `composed`
- 생성일: 현재 날짜 (`YYYYMMDD`)
- 고유번호: 자동 생성 (같은 날짜, 같은 제품, 같은 위치에서)

**파일명 예시:**
```
daily-kakao-secret-force-gold-2-muziik-nanobanana-composed-20260122-01.webp
```

**저장 경로 예시:**
```
originals/daily-branding/kakao/2026-01-22/account1/feed/daily-kakao-secret-force-gold-2-muziik-nanobanana-composed-20260122-01.webp
```
또는 제품 갤러리인 경우:
```
originals/products/secret-force-gold-2-muziik/gallery/daily-kakao-secret-force-gold-2-muziik-nanobanana-composed-20260122-01.webp
```

---

#### 2.2 Nanobanana 변형 API (`vary-nanobanana.js`)

**변경 사항:**
- 위치 자동 감지 (원본 이미지 경로에서)
- 제품명 추출 (원본 이미지 메타데이터에서)
- 합성 프로그램: `nanobanana`
- 합성 기능: `variationMode`에 따라 `tone`, `background`, `object`, `variation`
- 생성일: 현재 날짜
- 고유번호: 자동 생성
- **복수 파일 생성 시 각각 고유번호 자동 할당** (01, 02, 03...)

**파일명 예시:**
```
products-secret-force-gold-2-muziik-nanobanana-tone-20260122-01.webp
products-secret-force-gold-2-muziik-nanobanana-tone-20260122-02.webp
products-secret-force-gold-2-muziik-nanobanana-tone-20260122-03.webp
```

**저장 경로 예시:**
```
originals/products/secret-force-gold-2-muziik/gallery/products-secret-force-gold-2-muziik-nanobanana-tone-20260122-01.webp
originals/products/secret-force-gold-2-muziik/gallery/products-secret-force-gold-2-muziik-nanobanana-tone-20260122-02.webp
originals/products/secret-force-gold-2-muziik/gallery/products-secret-force-gold-2-muziik-nanobanana-tone-20260122-03.webp
```

---

#### 2.3 FAL AI 변형 API (`vary-existing-image.js`)

**변경 사항:**
- 위치 자동 감지 (원본 이미지 경로에서)
- 제품명 추출 (원본 이미지 메타데이터에서)
- 합성 프로그램: `fal`
- 합성 기능: `variation` (기본값, 향후 확장 가능)
- 생성일: 현재 날짜
- 고유번호: 자동 생성
- **복수 파일 생성 시 각각 고유번호 자동 할당** (01, 02, 03...)

**저장 위치 결정 로직:**
1. 원본 이미지의 현재 폴더 위치 확인
2. 현재 폴더 위치가 있으면 → 원본과 동일한 폴더에 저장
3. 현재 폴더 위치가 없으면 → `originals/ai-generated/{YYYY-MM-DD}/` 폴더에 저장

**파일명 예시:**
```
products-secret-force-gold-2-muziik-fal-variation-20260122-01.png
products-secret-force-gold-2-muziik-fal-variation-20260122-02.png
products-secret-force-gold-2-muziik-fal-variation-20260122-03.png
```

**저장 경로 예시 (현재 폴더 위치 있음):**
```
originals/products/secret-force-gold-2-muziik/gallery/products-secret-force-gold-2-muziik-fal-variation-20260122-01.png
originals/products/secret-force-gold-2-muziik/gallery/products-secret-force-gold-2-muziik-fal-variation-20260122-02.png
```

**저장 경로 예시 (현재 폴더 위치 없음):**
```
originals/ai-generated/2026-01-22/products-secret-force-gold-2-muziik-fal-variation-20260122-01.png
originals/ai-generated/2026-01-22/products-secret-force-gold-2-muziik-fal-variation-20260122-02.png
```

---

#### 2.4 Replicate 변형 API (`generate-blog-image-replicate-flux`)

**변경 사항:**
- 위치 자동 감지 (원본 이미지 경로에서)
- 제품명 추출 (원본 이미지 메타데이터에서)
- 합성 프로그램: `replicate`
- 합성 기능: `variation`
- 생성일: 현재 날짜
- 고유번호: 자동 생성
- **복수 파일 생성 시 각각 고유번호 자동 할당** (01, 02, 03...)

**저장 위치 결정 로직:**
1. 원본 이미지의 현재 폴더 위치 확인
2. 현재 폴더 위치가 있으면 → 원본과 동일한 폴더에 저장
3. 현재 폴더 위치가 없으면 → `originals/ai-generated/{YYYY-MM-DD}/` 폴더에 저장

**파일명 예시:**
```
products-secret-weapon-black-muziik-replicate-variation-20260122-01.png
products-secret-weapon-black-muziik-replicate-variation-20260122-02.png
products-secret-weapon-black-muziik-replicate-variation-20260122-03.png
```

**저장 경로 예시 (현재 폴더 위치 있음):**
```
originals/products/secret-weapon-black-muziik/gallery/products-secret-weapon-black-muziik-replicate-variation-20260122-01.png
originals/products/secret-weapon-black-muziik/gallery/products-secret-weapon-black-muziik-replicate-variation-20260122-02.png
```

**저장 경로 예시 (현재 폴더 위치 없음):**
```
originals/ai-generated/2026-01-22/products-secret-weapon-black-muziik-replicate-variation-20260122-01.png
originals/ai-generated/2026-01-22/products-secret-weapon-black-muziik-replicate-variation-20260122-02.png
```

---

#### 2.5 카카오 콘텐츠 생성 API (`kakao-content/generate-images.js`)

**변경 사항:**
- 위치: `daily-kakao` (고정)
- 제품명: 제품 합성 시 제품 slug 사용, 없으면 `none`
- 합성 프로그램: 제품 합성 시 `nanobanana`, 없으면 `none`
- 합성 기능: 제품 합성 시 `composed`, 없으면 `none`
- 생성일: 선택된 날짜 (`YYYYMMDD`)
- 고유번호: 자동 생성

**파일명 예시 (제품 합성 없음):**
```
daily-kakao-none-none-20260122-01.jpg
```

**저장 경로 예시 (제품 합성 없음):**
```
originals/daily-branding/kakao/2026-01-22/account1/feed/daily-kakao-none-none-20260122-01.jpg
```

**파일명 예시 (제품 합성 있음):**
```
daily-kakao-secret-force-gold-2-muziik-nanobanana-composed-20260122-01.webp
```

**저장 경로 예시 (제품 합성 있음):**
```
originals/daily-branding/kakao/2026-01-22/account1/feed/daily-kakao-secret-force-gold-2-muziik-nanobanana-composed-20260122-01.webp
```

---

#### 2.6 블로그 이미지 업로드 API (`upload-image-supabase.js`, `copy-draft-to-blog.ts`)

**변경 사항:**
- 위치: `blog` (고정)
- 블로그 ID: 블로그 포스트 ID
- 생성일: 업로드 날짜 (`YYYYMMDD` 형식)
- 원본 파일명 영문 추출: 사용자가 업로드한 파일명에서 한글 제거, 영문으로 변환, 특수문자 변환
- 고유번호: 같은 블로그, 같은 날짜에서 생성된 이미지 순서 (01, 02, 03...)
- 확장자: 원본 확장자 또는 최적화된 확장자

**파일명 형식:**
```
blog-{blogId}-{YYYYMMDD}-{원본파일명영문추출}-{고유번호2자리}.{확장자}
```

**저장 경로:**
```
originals/blog/{YYYY-MM}/{blogId}/{파일명}
```

**예시:**
- 파일명: `blog-309-20260122-driver-image-01.webp`
- 저장 경로: `originals/blog/2026-01/309/blog-309-20260122-driver-image-01.webp`

**특징:**
- 블로그별로 폴더 분리
- 날짜별 폴더 구조 (`YYYY-MM`)
- 파일명에 블로그 ID, 생성일, 고유번호 포함
- **복수 파일 업로드 시 각각 고유번호 자동 할당** (01, 02, 03...)

---

#### 2.7 고객 이미지 업로드 API (`upload-customer-image.js`)

**변경 사항:**
- 기존 규칙 유지 (변경 불필요)
- 위치: `customers` (고정)
- 영문 이름: 고객의 한글 이름을 영문으로 변환
- 장면 코드: 스토리보드 장면 번호 (s1~s7)
- 타입: 이미지 종류 (signature, swing-scene 등)
- 번호: 같은 장면, 같은 타입의 순서 (01, 02, 03...)

**파일명 형식:**
```
{영문이름}_s{장면코드}_{타입}_{번호}.webp
```

**저장 경로:**
```
originals/customers/{영문이름}-{전화번호마지막4자리}/{방문일자}/{파일명}
```

**예시:**
- 파일명: `joseotdae_s6_signature_01.webp`
- 저장 경로: `originals/customers/joseotdae-7010/2026-01-22/joseotdae_s6_signature_01.webp`

**특징:**
- 고객별 폴더 분리
- 방문일자별 폴더 분리
- 파일명만으로 고객, 장면, 타입 식별 가능
- 기존 규칙 유지 (변경 불필요)

---

### Phase 3: 고유번호 자동 생성 로직

**구현 방법:**
1. 같은 날짜, 같은 위치, 같은 제품, 같은 합성 프로그램, 같은 합성 기능에서 생성된 파일 목록 조회
2. 파일명에서 고유번호 추출
3. 최대값 + 1을 새로운 고유번호로 사용
4. 최대값이 없으면 `01`부터 시작

**함수:**
```typescript
async function getNextUniqueNumber(
  location: string,
  productName: string,
  compositionProgram: string,
  compositionFunction: string,
  creationDate: string
): Promise<number> {
  // Supabase Storage에서 해당 조건의 파일 목록 조회
  // 파일명에서 고유번호 추출
  // 최대값 + 1 반환
}
```

---

### Phase 4: 위치 자동 감지 로직

**구현 방법:**
1. 원본 이미지 경로(`originalFolderPath` 또는 `baseImageUrl`)에서 위치 추출
2. 패턴 매칭:
   - `originals/daily-branding/kakao/` → `daily-kakao`
   - `originals/goods/` → `goods`
   - `originals/products/` → `products`
   - `originals/blog/` → `blog`
   - 기타 → `uploaded`

**함수:**
```typescript
function detectLocation(folderPath: string): string {
  if (folderPath.includes('daily-branding/kakao/')) return 'daily-kakao';
  if (folderPath.includes('originals/goods/')) return 'goods';
  if (folderPath.includes('originals/products/')) return 'products';
  if (folderPath.includes('originals/blog/')) return 'blog';
  if (folderPath.includes('originals/customers/')) return 'customers'; // 고객은 별도 규칙
  return 'uploaded';
}
```

---

### Phase 5: 제품명 추출 로직

**구현 방법:**
1. 제품 합성 API: `productSlug` 직접 사용
2. 변형 API: 원본 이미지 메타데이터에서 제품 정보 추출
3. 카카오 콘텐츠: 제품 합성 활성화 시 `productSlug` 사용

**함수:**
```typescript
async function extractProductName(
  imageUrl: string,
  productId?: string
): Promise<string | undefined> {
  // productId가 있으면 product_composition 테이블에서 slug 조회
  // 없으면 원본 이미지 메타데이터에서 제품 정보 추출
  // 없으면 undefined 반환
}
```

---

### Phase 6: 저장 경로 구조 변경

**새로운 경로 구조:**

1. **카카오 콘텐츠:**
   ```
   originals/daily-branding/kakao/{YYYY-MM-DD}/{account}/{type}/{파일명}
   ```

2. **제품 갤러리:**
   ```
   originals/products/{제품slug}/gallery/{파일명}
   ```

3. **굿즈 갤러리:**
   ```
   originals/goods/{제품slug}/gallery/{파일명}
   ```

4. **블로그 이미지:**
   ```
   originals/blog/{YYYY-MM}/{blogId}/{파일명}
   ```

5. **고객 이미지:**
   ```
   originals/customers/{영문이름}-{전화번호마지막4자리}/{방문일자}/{파일명}
   ```

6. **AI 생성 이미지 (현재 폴더 위치 없을 때):**
   ```
   originals/ai-generated/{YYYY-MM-DD}/{파일명}
   ```

7. **일반 업로드:**
   ```
   originals/uploaded/{YYYY-MM}/{YYYY-MM-DD}/{파일명}
   ```

**예시:**
```
originals/daily-branding/kakao/2026-01-22/account1/feed/daily-kakao-secret-force-gold-2-muziik-nanobanana-composed-20260122-01.webp
originals/products/secret-force-gold-2-muziik/gallery/products-secret-force-gold-2-muziik-nanobanana-tone-20260122-01.webp
originals/goods/massgoo-white-cap-2/gallery/goods-massgoo-white-cap-2-fal-background-20260122-01.webp
originals/blog/2026-01/309/blog-309-20260122-driver-image-01.webp
originals/customers/joseotdae-7010/2026-01-22/joseotdae_s6_signature_01.webp
originals/ai-generated/2026-01-22/products-secret-force-gold-2-muziik-fal-variation-20260122-01.png
```

**기존 경로와의 호환성:**
- 기존 이미지는 그대로 유지
- 새로 생성되는 이미지만 새로운 구조 사용

---

## 📊 변경 영향도 분석

### 영향받는 파일 목록

1. **제품 합성 관련:**
   - `pages/api/compose-product-image.js` ⭐ (최우선)
   - `pages/admin/gallery.tsx` (제품 합성 함수)

2. **변형 관련:**
   - `pages/api/vary-nanobanana.js` ⭐
   - `pages/api/vary-existing-image.js` ⭐
   - `pages/api/generate-blog-image-replicate-flux.js` (확인 필요)

3. **카카오 콘텐츠 관련:**
   - `pages/api/kakao-content/generate-images.js` ⭐

4. **블로그 이미지 관련:**
   - `pages/api/upload-image-supabase.js` ⭐
   - `pages/api/admin/copy-draft-to-blog.ts` ⭐
   - `pages/api/save-generated-image.js`

5. **고객 이미지 관련:**
   - `pages/api/admin/upload-customer-image.js` (기존 규칙 유지, 변경 불필요)
   - `lib/customer-image-filename-generator.ts` (기존 규칙 유지, 변경 불필요)

6. **유틸리티:**
   - `lib/filename-generator.ts` (신규 생성) ⭐

---

## 📋 파일명 및 폴더 규칙 요약

### 1. 제품 합성/변형 이미지

**파일명 형식:**
```
{위치}-{제품명}-{합성프로그램}-{합성기능}-{생성일}-{고유번호}.{확장자}
```

**저장 경로:**
- 제품: `originals/products/{제품slug}/gallery/{파일명}`
- 굿즈: `originals/goods/{제품slug}/gallery/{파일명}`

**예시:**
- 파일명: `products-secret-force-gold-2-muziik-nanobanana-tone-20260122-01.webp`
- 저장 경로: `originals/products/secret-force-gold-2-muziik/gallery/products-secret-force-gold-2-muziik-nanobanana-tone-20260122-01.webp`

---

### 2. 카카오 콘텐츠 이미지

**파일명 형식:**
```
daily-kakao-{제품명}-{합성프로그램}-{합성기능}-{생성일}-{고유번호}.{확장자}
```

**저장 경로:**
```
originals/daily-branding/kakao/{YYYY-MM-DD}/{account}/{type}/{파일명}
```

**예시:**
- 파일명: `daily-kakao-secret-force-gold-2-muziik-nanobanana-composed-20260122-01.webp`
- 저장 경로: `originals/daily-branding/kakao/2026-01-22/account1/feed/daily-kakao-secret-force-gold-2-muziik-nanobanana-composed-20260122-01.webp`

---

### 3. 블로그 이미지

**파일명 형식:**
```
blog-{blogId}-{YYYYMMDD}-{원본파일명영문추출}-{고유번호2자리}.{확장자}
```

**저장 경로:**
```
originals/blog/{YYYY-MM}/{blogId}/{파일명}
```

**예시:**
- 파일명: `blog-309-20260122-driver-image-01.webp`
- 저장 경로: `originals/blog/2026-01/309/blog-309-20260122-driver-image-01.webp`

**복수 파일 업로드:**
- 파일명: `blog-309-20260122-driver-image-01.webp`, `blog-309-20260122-driver-image-02.webp`, `blog-309-20260122-driver-image-03.webp`
- 각각 고유번호 자동 할당

---

### 4. 고객 이미지

**파일명 형식:**
```
{영문이름}_s{장면코드}_{타입}_{번호}.webp
```

**저장 경로:**
```
originals/customers/{영문이름}-{전화번호마지막4자리}/{방문일자}/{파일명}
```

**예시:**
- 파일명: `joseotdae_s6_signature_01.webp`
- 저장 경로: `originals/customers/joseotdae-7010/2026-01-22/joseotdae_s6_signature_01.webp`

**특징:**
- 기존 규칙 유지 (변경 불필요)
- 파일명만으로 고객, 장면, 타입 식별 가능

---

---

## ⚠️ 주의사항

### 1. 기존 이미지 호환성
- 기존 이미지는 그대로 유지
- 새로 생성되는 이미지만 새로운 구조 사용
- 기존 파일명 파싱 로직은 유지 (하위 호환성)

### 2. 파일명 길이 제한
- 파일 시스템 제한: 255자
- 경로 포함 전체 길이 확인 필요
- 긴 제품명은 축약 고려

### 3. 고유번호 충돌 방지
- 같은 날짜, 같은 조건에서 동시 생성 시 충돌 가능
- 트랜잭션 또는 락 메커니즘 필요
- 재시도 로직 구현

### 4. 복수 파일 생성 시 최적화
- 같은 이미지에서 여러 변형 생성 시 각각 고유번호 자동 할당
- 각 파일명이 독립적으로 최적화됨
- 예: `products-secret-force-gold-2-muziik-nanobanana-tone-20260122-01.webp`, `products-secret-force-gold-2-muziik-nanobanana-tone-20260122-02.webp`

### 5. FAL/Replicate 저장 위치 결정
- 원본 이미지의 현재 폴더 위치 확인
- 현재 폴더 위치가 있으면 → 원본과 동일한 폴더에 저장 (Nanobanana와 동일한 로직)
- 현재 폴더 위치가 없으면 → `originals/ai-generated/{YYYY-MM-DD}/` 폴더에 저장
- 파일명 규칙은 동일하게 유지

### 6. 고객 이미지
- 고객 이미지는 기존 규칙 유지 (`{영문이름}_s{장면코드}_{타입}_{번호}.webp`)
- 별도 규칙으로 관리

---

## 🗓️ 구현 일정

### Week 1: 기반 구축
- [ ] `lib/filename-generator.ts` 생성
- [ ] 위치 자동 감지 함수 구현
- [ ] 제품명 추출 함수 구현
- [ ] 고유번호 자동 생성 함수 구현

### Week 2: API 수정
- [ ] `compose-product-image.js` 수정
- [ ] `vary-nanobanana.js` 수정
- [ ] `vary-existing-image.js` 수정 (FAL - 저장 위치 결정 로직 추가)
- [ ] `generate-blog-image-replicate-flux.js` 수정 (Replicate - 저장 위치 결정 로직 추가)
- [ ] `kakao-content/generate-images.js` 수정
- [ ] `upload-image-supabase.js` 수정 (블로그 파일명 형식 변경)
- [ ] `copy-draft-to-blog.ts` 수정 (블로그 파일명 형식 변경)

### Week 3: 테스트 및 검증
- [ ] 각 API별 파일명 생성 테스트
- [ ] 블로그 파일명 형식 테스트 (YYYYMMDD, 영문 추출, 고유번호)
- [ ] 복수 파일 업로드 시 고유번호 자동 할당 테스트
- [ ] FAL/Replicate 저장 위치 결정 로직 테스트 (현재 폴더 있음/없음)
- [ ] 고유번호 충돌 테스트
- [ ] 파일명 길이 제한 테스트
- [ ] 기존 이미지 호환성 테스트

### Week 4: 배포 및 모니터링
- [ ] 스테이징 환경 배포
- [ ] 실제 사용 테스트
- [ ] 문제점 수정
- [ ] 프로덕션 배포

---

## 📝 파일명 생성 예시 코드

```typescript
// lib/filename-generator.ts

interface FilenameOptions {
  location: 'daily-kakao' | 'goods' | 'products' | 'blog' | 'uploaded';
  productName?: string;
  compositionProgram: 'nanobanana' | 'fal' | 'replicate' | 'none';
  compositionFunction: 'tone' | 'background' | 'object' | 'composed' | 'variation' | 'none';
  creationDate?: Date;
  uniqueNumber?: number;
  extension: string;
}

interface StoragePathOptions extends FilenameOptions {
  // 카카오 콘텐츠의 경우
  kakaoDate?: string; // YYYY-MM-DD
  kakaoAccount?: 'account1' | 'account2';
  kakaoType?: 'feed' | 'profile' | 'background';
  // 제품/굿즈 갤러리의 경우
  productSlug?: string;
  // 블로그 이미지의 경우
  blogId?: number;
  // 고객 이미지의 경우
  customerNameEn?: string; // 영문이름-전화번호마지막4자리
  visitDate?: string; // YYYY-MM-DD
}

/**
 * 표준 파일명 생성 (하이픈으로 연결)
 */
export async function generateStandardFileName(
  options: FilenameOptions
): Promise<string> {
  const {
    location,
    productName = 'none',
    compositionProgram,
    compositionFunction,
    creationDate = new Date(),
    uniqueNumber,
    extension
  } = options;

  // 생성일 포맷팅 (YYYYMMDD)
  const dateStr = creationDate.toISOString().slice(0, 10).replace(/-/g, '');

  // 고유번호 자동 생성 (없는 경우)
  let finalUniqueNumber = uniqueNumber;
  if (!finalUniqueNumber) {
    finalUniqueNumber = await getNextUniqueNumber(
      location,
      productName,
      compositionProgram,
      compositionFunction,
      dateStr
    );
  }

  // 고유번호 2자리 포맷팅
  const uniqueNumberStr = String(finalUniqueNumber).padStart(2, '0');

  // 파일명 조합 (하이픈으로 연결)
  const fileName = `${location}-${productName}-${compositionProgram}-${compositionFunction}-${dateStr}-${uniqueNumberStr}.${extension}`;

  return fileName;
}

/**
 * 저장 경로 생성
 */
export async function generateStoragePath(
  options: StoragePathOptions
): Promise<string> {
  const fileName = await generateStandardFileName(options);
  
  const {
    location,
    productName = 'none',
    compositionProgram,
    compositionFunction,
    creationDate = new Date(),
    kakaoDate,
    kakaoAccount,
    kakaoType,
    productSlug
  } = options;

  // 생성일 포맷팅
  const dateStr = creationDate.toISOString().slice(0, 10).replace(/-/g, '');
  const dateStrWithDash = creationDate.toISOString().slice(0, 10); // YYYY-MM-DD

  let storagePath = '';

  // 1. 카카오 콘텐츠
  if (location === 'daily-kakao' && kakaoDate && kakaoAccount && kakaoType) {
    storagePath = `originals/daily-branding/kakao/${kakaoDate}/${kakaoAccount}/${kakaoType}/${fileName}`;
  }
  // 2. 제품 갤러리
  else if (location === 'products' && productSlug) {
    storagePath = `originals/products/${productSlug}/gallery/${fileName}`;
  }
  // 3. 굿즈 갤러리
  else if (location === 'goods' && productSlug) {
    storagePath = `originals/goods/${productSlug}/gallery/${fileName}`;
  }
  // 4. 블로그 이미지
  else if (location === 'blog' && options.blogId) {
    const yearMonth = dateStrWithDash.slice(0, 7); // YYYY-MM
    storagePath = `originals/blog/${yearMonth}/${options.blogId}/${fileName}`;
  }
  // 5. 고객 이미지 (기존 규칙 유지)
  else if (location === 'customers' && options.customerNameEn && options.visitDate) {
    storagePath = `originals/customers/${options.customerNameEn}/${options.visitDate}/${fileName}`;
  }
  // 6. AI 생성 이미지 (현재 폴더 위치 없을 때 - FAL, Replicate)
  else if (location === 'ai-generated') {
    storagePath = `originals/ai-generated/${dateStrWithDash}/${fileName}`;
  }
  // 7. 일반 업로드
  else {
    const yearMonth = dateStrWithDash.slice(0, 7); // YYYY-MM
    storagePath = `originals/uploaded/${yearMonth}/${dateStrWithDash}/${fileName}`;
  }

  return storagePath;
}

/**
 * 블로그 이미지 파일명 생성
 */
export async function generateBlogFileName(
  blogId: number,
  originalFileName: string,
  creationDate?: Date,
  uniqueNumber?: number
): Promise<string> {
  const date = creationDate || new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  
  // 원본 파일명 영문 추출
  const nameWithoutExt = originalFileName.replace(/\.[^/.]+$/, '');
  const extension = originalFileName.split('.').pop() || 'webp';
  
  // 한글 제거 및 영문 변환
  const { translateKoreanToEnglish } = require('./korean-to-english-translator');
  const englishName = translateKoreanToEnglish(nameWithoutExt)
    .toLowerCase()
    .replace(/[가-힣\s]/g, '') // 한글과 공백 제거
    .replace(/[^a-z0-9]/g, '-') // 특수문자를 하이픈으로
    .replace(/-+/g, '-') // 연속된 하이픈을 하나로
    .replace(/^-|-$/g, '') // 앞뒤 하이픈 제거
    || 'image';
  
  // 고유번호 자동 생성 (없는 경우)
  let finalUniqueNumber = uniqueNumber;
  if (!finalUniqueNumber) {
    finalUniqueNumber = await getNextBlogUniqueNumber(blogId, dateStr);
  }
  
  // 고유번호 2자리 포맷팅
  const uniqueNumberStr = String(finalUniqueNumber).padStart(2, '0');
  
  // 파일명 조합
  const fileName = `blog-${blogId}-${dateStr}-${englishName}-${uniqueNumberStr}.${extension}`;
  
  return fileName;
}

/**
 * FAL/Replicate 저장 위치 결정
 */
export async function determineStorageLocationForAI(
  originalImageUrl: string,
  compositionProgram: 'fal' | 'replicate'
): Promise<{ location: string; folderPath: string | null }> {
  // 원본 이미지의 메타데이터 조회
  const { data: metadata } = await supabase
    .from('image_assets')
    .select('file_path')
    .eq('cdn_url', originalImageUrl)
    .maybeSingle();
  
  if (metadata && metadata.file_path) {
    // 현재 폴더 위치가 있으면 원본과 동일한 폴더 사용
    const folderPath = metadata.file_path.substring(0, metadata.file_path.lastIndexOf('/'));
    return {
      location: 'current-folder',
      folderPath: folderPath
    };
  } else {
    // 현재 폴더 위치가 없으면 ai-generated 폴더 사용
    const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return {
      location: 'ai-generated',
      folderPath: `originals/ai-generated/${dateStr}`
    };
  }
}

async function getNextBlogUniqueNumber(
  blogId: number,
  creationDate: string
): Promise<number> {
  // Supabase Storage에서 해당 블로그, 해당 날짜의 파일 목록 조회
  // 파일명 패턴: blog-{blogId}-{creationDate}-{영문파일명}-{NN}.{ext}
  // 최대값 + 1 반환
  // 없으면 1 반환
}

async function getNextUniqueNumber(
  location: string,
  productName: string,
  compositionProgram: string,
  compositionFunction: string,
  creationDate: string
): Promise<number> {
  // Supabase Storage에서 해당 조건의 파일 목록 조회
  // 파일명 패턴: {location}-{productName}-{compositionProgram}-{compositionFunction}-{creationDate}-{NN}.{ext}
  // 최대값 + 1 반환
  // 없으면 1 반환
}
```

---

## ✅ 체크리스트

### 구현 전
- [ ] 현재 파일명 생성 방식 전부 확인 완료
- [ ] 새로운 파일명 구조 설계 완료
- [ ] 영향받는 파일 목록 작성 완료

### 구현 중
- [ ] 파일명 생성 유틸리티 함수 생성
- [ ] 각 API 파일 수정
- [ ] 고유번호 자동 생성 로직 구현
- [ ] 위치 자동 감지 로직 구현
- [ ] 제품명 추출 로직 구현

### 구현 후
- [ ] 각 API별 테스트 완료
- [ ] 파일명 길이 제한 확인
- [ ] 고유번호 충돌 방지 확인
- [ ] 기존 이미지 호환성 확인
- [ ] 문서화 완료

---

## 📚 참고 자료

- 현재 파일명 생성 로직 위치:
  - `pages/api/compose-product-image.js` (라인 197-212)
  - `pages/api/vary-nanobanana.js` (라인 280-284)
  - `pages/api/vary-existing-image.js` (라인 266)
  - `pages/api/kakao-content/generate-images.js` (라인 328)
  - `lib/customer-image-filename-generator.ts` (고객 이미지)

- 관련 문서:
  - `docs/customer-image-filename-format.md` (고객 이미지 파일명 규칙)

---

## 🎯 최종 목표

모든 이미지 파일명을 표준화된 구조로 통일하여:
1. 파일명만으로 이미지의 출처, 제품, 합성 정보를 파악 가능
2. 파일명 중복 방지
3. 파일 관리 및 검색 용이성 향상
4. 일관성 있는 파일명 구조 유지
