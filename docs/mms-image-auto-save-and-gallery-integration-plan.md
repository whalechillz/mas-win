# MMS 이미지 자동 저장 및 갤러리 연동 개발 계획 (이미지 압축 포함)

## 📋 목차

1. [개요](#개요)
2. [현재 상황 분석](#현재-상황-분석)
3. [개발 목표](#개발-목표)
4. [기술 설계](#기술-설계)
5. [이미지 압축 전략](#이미지-압축-전략) ⭐ **신규**
6. [구현 단계](#구현-단계)
7. [API 설계](#api-설계)
8. [데이터베이스 구조](#데이터베이스-구조)
9. [프론트엔드 수정](#프론트엔드-수정)
10. [참고 사례](#참고-사례)

---

## 개요

SMS/MMS 편집 페이지에서 이미지를 업로드할 때:
1. **이미지 압축** (솔라피 200KB 제한 대응) ⭐ **신규**
2. **Solapi에 업로드** (MMS 발송용 - 기존 기능 유지)
3. **Supabase Storage에 자동 저장** (갤러리 관리용 - 신규)
   - 폴더 구조: `originals/mms/YYYY-MM-DD/메시지ID/`
4. **image_metadata 테이블에 메타데이터 저장** (검색/관리용)
5. **갤러리에서 MMS 이미지 불러오기** (재사용 가능)

---

## 현재 상황 분석

### ✅ 기존 기능

1. **Solapi 이미지 업로드** (`pages/api/solapi/upload-image.js`)
   - MMS 발송용 이미지를 Solapi Storage에 업로드
   - 현재는 Solapi에만 업로드하고 Supabase Storage에는 저장하지 않음
   - **문제**: 솔라피 200KB 제한이 있지만 UI에서는 5MB까지 허용 표시

2. **갤러리 이미지 관리** (`pages/admin/gallery.tsx`)
   - `originals/daily-branding/kakao/YYYY-MM-DD/account1|account2/background|profile|feed/` 형식으로 저장
   - 카카오 이미지는 날짜별 폴더 구조로 잘 관리되고 있음

3. **AIImagePicker 컴포넌트** (`components/shared/AIImagePicker.tsx`)
   - SMS 편집 페이지에서 이미지 선택 시 사용
   - 현재는 Solapi 업로드만 지원

4. **이미지 압축 라이브러리** (`pages/api/upload-image-supabase.js`)
   - Sharp를 사용한 이미지 최적화 예시 존재
   - resize, quality 조정 등 구현되어 있음

### ❌ 부족한 기능

1. **이미지 압축 기능 없음** ⭐ **신규**
   - 솔라피 200KB 제한 대응 불가
   - 5MB 이미지 업로드 시 에러 발생
2. MMS 이미지가 Supabase Storage에 저장되지 않음
3. MMS 이미지가 image_metadata 테이블에 등록되지 않음
4. 갤러리에서 MMS 이미지를 불러올 수 없음
5. 메시지별로 이미지가 체계적으로 관리되지 않음

---

## 문서 검토 및 제약 요약 (2025-11-20 업데이트)

최근 `docs/` 내 이미지 관련 트러블슈팅 및 Resolved 문서를 재검토하여, 이번 개발에서 반드시 지켜야 할 제약을 아래와 같이 정리했습니다.

1. **MMS 업로드 안정화 이력**  
   - [`docs/resolved/2025-10-31-mms-upload-fix.md`](./resolved/2025-10-31-mms-upload-fix.md)에 이미 Formidable Promise 래퍼, JPG 전용 검증, 임시 파일 정리 로직이 정리되어 있습니다.  
   - ➜ **추가 개발 시** 기존 안정화 코드를 유지한 상태에서 압축/저장 로직을 삽입하고, 에러 포맷도 동일하게 유지합니다.

2. **`image_metadata` 스키마 준수**  
   - [`docs/resolved/2025-11-01-image-metadata-save-fix.md`](./resolved/2025-11-01-image-metadata-save-fix.md) 및 [`docs/resolved/2025-11-01-rename-image-fix.md`](./resolved/2025-11-01-rename-image-fix.md)은 `file_name` 컬럼이 없고 `image_url`이 UNIQUE 키라는 점을 강조합니다.  
   - ➜ **추가 필드**를 저장할 경우 실제 스키마와 동기화(예: `compressed_size`, `storage_path`)가 필요하며, upsert 기준은 `image_url` 또는 `id`로 제한합니다.

3. **갤러리 자동 등록/비교 기능 의존성**  
   - [`docs/image-comparison-troubleshooting.md`](./image-comparison-troubleshooting.md)에 따르면 갤러리에서 폴더를 열 때 자동 등록이 이뤄집니다.  
   - ➜ 업로드/재압축 후에도 즉시 `image_metadata` upsert를 수행하지 않으면 이미지 비교, 갤러리 검색이 깨지므로 반드시 동기화합니다.

4. **갤러리 선택 시 재압축 요구사항 (신규)**  
   - 사용자가 갤러리 이미지도 200KB로 맞추어 재사용하길 원하므로, Supabase 원본을 다시 읽어와 Solapi에 재업로드해야 합니다.  
   - ➜ 별도의 재압축 API 또는 기존 업로드 API 확장을 통해 “갤러리 → 재압축 → Solapi 업로드” 경로를 추가합니다.

위 제약을 바탕으로 이후 구현, DB 마이그레이션, 테스트 계획을 모두 업데이트했습니다.

---

## 개발 목표

### 0. 이미지 압축 기능 ⭐ **신규**

- **목표**: 솔라피 200KB 제한에 맞춰 이미지 자동 압축
- **전략**: 
  - Sharp를 사용한 이미지 리사이즈 및 품질 조정
  - 반복적 품질 조정으로 200KB 이하 달성
  - 원본은 Supabase Storage에 저장 (고품질 보존)
  - 압축본은 Solapi에 업로드 (발송용)

### 1. 자동 저장 기능

- **목표**: SMS/MMS 편집 페이지에서 이미지 업로드 시 자동으로 Supabase Storage에 저장
- **폴더 구조**: `originals/mms/YYYY-MM-DD/메시지ID/`
- **파일명 형식**: `mms-{메시지ID}-{timestamp}-{순번}.jpg`

### 2. 메타데이터 저장

- **목표**: image_metadata 테이블에 MMS 이미지 정보 저장
- **저장 정보**:
  - `folder_path`: `originals/mms/YYYY-MM-DD/메시지ID`
  - `date_folder`: `YYYY-MM-DD`
  - `source`: `mms`
  - `channel`: `sms`
  - `file_name`: 실제 파일명
  - `image_url`: Supabase Storage 공개 URL
  - `original_size`: 원본 파일 크기
  - `compressed_size`: 압축된 파일 크기 (Solapi용)

### 3. 갤러리 연동

- **목표**: 갤러리에서 MMS 폴더의 이미지를 불러올 수 있도록
- **기능**:
  - `originals/mms/` 폴더 구조 표시
  - 날짜별/메시지별 필터링
  - 이미지 선택 시 SMS 편집 페이지에 적용

### 4. 이미지 로딩 보장

- **목표**: 나중에도 이미지가 정확히 로딩되도록
- **방법**:
  - Supabase Storage 공개 URL 사용
  - image_metadata 테이블에 URL 저장
  - 메시지와 이미지 연결 정보 저장

---

## 기술 설계

### 1. 폴더 구조

```
originals/
└── mms/
    └── YYYY-MM-DD/
        └── {메시지ID}/
            ├── mms-{메시지ID}-{timestamp}-1.jpg  (원본 - Supabase)
            ├── mms-{메시지ID}-{timestamp}-2.jpg
            └── ...
```

**예시**:
```
originals/mms/2025-11-19/88/mms-88-1734567890123-1.jpg  (원본)
→ Solapi에 압축본 업로드 (200KB 이하)
```

### 2. 저장 프로세스 (이미지 압축 포함)

```
1. 사용자가 SMS 편집 페이지에서 이미지 업로드
   ↓
2. 파일 크기 검증 (200KB 초과 시 압축 필요)
   ↓
3. 이미지 압축 (Sharp 사용)
   - 리사이즈: 최대 1200x800 (비율 유지)
   - 품질 조정: 85% → 70% → 60% (200KB 이하까지)
   ↓
4. Solapi 업로드 API 호출 (/api/solapi/upload-image)
   - 압축된 이미지 업로드 (200KB 이하)
   ↓
5. Supabase Storage에 원본 저장 (originals/mms/YYYY-MM-DD/메시지ID/)
   ↓
6. image_metadata 테이블에 메타데이터 저장
   - 원본 크기, 압축 크기 모두 저장
   ↓
7. Solapi imageId와 Supabase URL 모두 반환
   ↓
8. (갤러리 재사용 경로) Supabase에 이미 존재하는 이미지를 선택한 경우에도 동일 파이프라인 실행
   - Supabase 원본 다운로드 → 압축 → Solapi 재업로드 → image_metadata 갱신 → 신규 imageId 반환
```

### 3. 데이터 흐름 (이미지 압축 포함)

```
[SMS 편집 페이지]
    ↓ (이미지 업로드)
[이미지 압축 처리] ⭐ 신규
    ↓ (200KB 이하 압축본 생성)
[Solapi 업로드 API]
    ↓ (압축본 업로드 성공)
[Supabase Storage 저장] (원본 저장)
    ↓ (저장 성공)
[image_metadata 저장]
    ↓ (메타데이터 저장 성공)
[응답 반환]
    - Solapi imageId (MMS 발송용 - 압축본)
    - Supabase URL (갤러리/표시용 - 원본)
    - 원본 크기, 압축 크기 정보
```

---

## 이미지 압축 전략 ⭐ **신규**

### 1. 압축 목표

- **최대 파일 크기**: 200KB (204,800 bytes)
- **최대 해상도**: 1200x800 (비율 유지)
- **품질 범위**: 60% ~ 85%
- **포맷**: JPEG (JPG)

### 2. 압축 알고리즘

```javascript
// 반복적 품질 조정으로 200KB 이하 달성
async function compressImageForSolapi(imageBuffer, maxSize = 200 * 1024) {
  const sharp = (await import('sharp')).default;
  
  // 1단계: 메타데이터 추출
  const metadata = await sharp(imageBuffer).metadata();
  const { width, height } = metadata;
  
  // 2단계: 리사이즈 (최대 1200x800, 비율 유지)
  let targetWidth = Math.min(width, 1200);
  let targetHeight = Math.min(height, 800);
  
  // 비율 유지
  if (width / height > targetWidth / targetHeight) {
    targetHeight = Math.round((targetWidth * height) / width);
  } else {
    targetWidth = Math.round((targetHeight * width) / height);
  }
  
  // 3단계: 품질 조정 (85% → 70% → 60%)
  const qualityLevels = [85, 70, 60];
  
  for (const quality of qualityLevels) {
    const compressed = await sharp(imageBuffer)
      .resize(targetWidth, targetHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .rotate() // EXIF 회전 정보 자동 적용
      .jpeg({
        quality: quality,
        progressive: true,
        mozjpeg: true // 더 나은 JPEG 압축
      })
      .toBuffer();
    
    if (compressed.length <= maxSize) {
      console.log(`✅ 압축 성공: ${(imageBuffer.length / 1024).toFixed(2)}KB → ${(compressed.length / 1024).toFixed(2)}KB (품질: ${quality}%)`);
      return {
        buffer: compressed,
        quality: quality,
        width: targetWidth,
        height: targetHeight,
        originalSize: imageBuffer.length,
        compressedSize: compressed.length
      };
    }
  }
  
  // 4단계: 모든 품질 레벨에서 실패 시 최소 품질(60%) 사용
  const finalCompressed = await sharp(imageBuffer)
    .resize(targetWidth, targetHeight, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .rotate()
    .jpeg({
      quality: 60,
      progressive: true,
      mozjpeg: true
    })
    .toBuffer();
  
  console.warn(`⚠️ 압축 후에도 ${(finalCompressed.length / 1024).toFixed(2)}KB (목표: ${(maxSize / 1024).toFixed(2)}KB)`);
  
  return {
    buffer: finalCompressed,
    quality: 60,
    width: targetWidth,
    height: targetHeight,
    originalSize: imageBuffer.length,
    compressedSize: finalCompressed.length,
    warning: finalCompressed.length > maxSize ? '압축 후에도 크기 제한을 초과합니다.' : null
  };
}
```

### 3. 압축 전략 상세

1. **1차 압축**: 리사이즈 + 품질 85%
   - 대부분의 이미지가 200KB 이하로 압축됨
2. **2차 압축**: 품질 70%로 재시도
   - 1차에서 실패한 경우
3. **3차 압축**: 품질 60%로 재시도
   - 최종 시도
4. **경고 처리**: 60%에서도 200KB 초과 시
   - 경고 메시지 표시
   - 가능한 한 작은 크기로 업로드 시도

### 4. 원본 보존 전략

- **Supabase Storage**: 원본 이미지 저장 (고품질 보존)
- **Solapi**: 압축본만 업로드 (발송용)
- **메타데이터**: 원본 크기와 압축 크기 모두 기록

---

## 구현 단계

### 0단계: 이미지 압축 기능 추가 ⭐ **신규**

**파일**: `pages/api/solapi/upload-image.js`

**수정 내용**:
1. Sharp 라이브러리 동적 import
2. 이미지 압축 함수 구현 (`compressImageForSolapi`)
3. 파일 크기 검증 (200KB 제한)
4. 압축 전/후 크기 로깅
5. UI 메시지 수정 (5MB → 200KB)

**코드 예시**:
```javascript
// 파일 크기 검증 (솔라피 제한 확인)
const SOLAPI_MAX_FILE_SIZE = 200 * 1024; // 200KB

// 원본 파일 읽기
let originalBuffer = fs.readFileSync(file.filepath);
console.log(`📊 원본 파일 크기: ${(originalBuffer.length / 1024).toFixed(2)}KB`);

// 압축 필요 여부 확인
let uploadBuffer = originalBuffer;
let compressionInfo = null;

if (originalBuffer.length > SOLAPI_MAX_FILE_SIZE) {
  console.log('🔄 이미지 압축 시작...');
  compressionInfo = await compressImageForSolapi(originalBuffer, SOLAPI_MAX_FILE_SIZE);
  uploadBuffer = compressionInfo.buffer;
  console.log(`✅ 압축 완료: ${(compressionInfo.originalSize / 1024).toFixed(2)}KB → ${(compressionInfo.compressedSize / 1024).toFixed(2)}KB`);
} else {
  console.log('✅ 파일 크기가 200KB 이하입니다. 압축 불필요.');
}

// Solapi에 압축본 업로드
const base64Data = uploadBuffer.toString('base64');
```

### 1단계: Solapi 업로드 API 수정

**파일**: `pages/api/solapi/upload-image.js`

**수정 내용**:
1. ✅ 이미지 압축 기능 추가 (0단계)
2. Solapi 업로드 성공 후 Supabase Storage에도 저장
3. 폴더 구조 생성: `originals/mms/YYYY-MM-DD/메시지ID/`
4. image_metadata 테이블에 메타데이터 저장
5. Solapi imageId와 Supabase URL 모두 반환

**요청 파라미터 추가**:
- `messageId`: 메시지 ID (선택적, 없으면 새로 생성)

**응답 형식**:
```json
{
  "success": true,
  "imageId": "solapi-file-id",  // Solapi imageId (MMS 발송용 - 압축본)
  "supabaseUrl": "https://...",  // Supabase Storage URL (갤러리용 - 원본)
  "storagePath": "originals/mms/2025-11-19/88/mms-88-1734567890123-1.jpg",
  "compressionInfo": {  // ⭐ 신규
    "originalSize": 1024000,
    "compressedSize": 195000,
    "quality": 70,
    "width": 1200,
    "height": 800,
    "warning": null
  },
  "message": "이미지가 성공적으로 업로드되었습니다."
}
```

### 2단계: MMS 이미지 조회 API 생성

**파일**: `pages/api/admin/mms-images.js` (신규)

**기능**:
- 특정 메시지의 이미지 목록 조회
- 날짜별 MMS 이미지 조회
- 폴더별 이미지 조회

**엔드포인트**:
- `GET /api/admin/mms-images?messageId=88` - 특정 메시지의 이미지
- `GET /api/admin/mms-images?date=2025-11-19` - 특정 날짜의 모든 MMS 이미지
- `GET /api/admin/mms-images?folder=originals/mms/2025-11-19/88` - 특정 폴더의 이미지

### 3단계: 갤러리 폴더 목록 API 수정

**파일**: `pages/api/admin/folders-list.js`

**수정 내용**:
- `originals/mms/` 폴더도 폴더 목록에 포함
- 날짜별/메시지별 폴더 구조 표시

### 4단계: 갤러리 이미지 조회 API 수정

**파일**: `pages/api/admin/all-images.js`

**수정 내용**:
- `originals/mms/` 폴더의 이미지도 조회 가능하도록
- 필터링 옵션 추가: `source=mms`, `channel=sms`

### 5단계: AIImagePicker 컴포넌트 수정

**파일**: `components/shared/AIImagePicker.tsx`

**수정 내용**:
- MMS 이미지 폴더 표시
- 메시지별 이미지 필터링
- 갤러리에서 MMS 이미지 선택 기능

### 6단계: SMS 편집 페이지 수정

**파일**: `pages/admin/sms.tsx`

**수정 내용**:
1. ✅ UI 메시지 수정: "JPG, PNG, GIF (최대 5MB)" → "JPG 형식만 가능 (최대 200KB 권장)"
2. 이미지 업로드 시 `messageId` 전달
3. Supabase URL도 저장 (Solapi imageId와 함께)
4. 갤러리에서 MMS 이미지 선택 기능
5. 압축 정보 표시 (선택적)

---

## API 설계

### 1. Solapi 이미지 업로드 API 수정 (이미지 압축 포함)

**엔드포인트**: `POST /api/solapi/upload-image`

**요청**:
```javascript
// FormData
{
  file: File,
  messageId: 88  // 선택적 (쿼리 파라미터 또는 FormData)
}
```

**응답**:
```json
{
  "success": true,
  "imageId": "solapi-file-id-12345",  // Solapi imageId (MMS 발송용 - 압축본)
  "supabaseUrl": "https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/originals/mms/2025-11-19/88/mms-88-1734567890123-1.jpg",
  "storagePath": "originals/mms/2025-11-19/88/mms-88-1734567890123-1.jpg",
  "fileName": "mms-88-1734567890123-1.jpg",
  "fileSize": 123456,  // 원본 크기
  "compressedSize": 195000,  // 압축 크기 (Solapi 업로드용)
  "fileType": "image/jpeg",
  "compressionInfo": {  // ⭐ 신규
    "originalSize": 1024000,
    "compressedSize": 195000,
    "quality": 70,
    "width": 1200,
    "height": 800,
    "warning": null
  },
  "message": "이미지가 성공적으로 업로드되었습니다. (원본: 1000KB → 압축: 195KB)"
}
```

**에러 응답**:
```json
{
  "success": false,
  "message": "파일 크기가 너무 큽니다. 솔라피 MMS는 최대 200KB까지만 지원합니다. (현재: 500KB)",
  "error": "FileSizeTooLarge",
  "originalSize": 512000,
  "maxSize": 204800
}
```

### 1-1. 갤러리 이미지 재압축 API (신규)

**엔드포인트**: `POST /api/solapi/reupload-image` (가칭)

**요청**

```json
{
  "imageUrl": "https://...supabase.co/storage/v1/object/public/blog-images/originals/mms/2025-11-19/88/mms-88-....jpg",
  "messageId": 113,
  "source": "gallery"   // 추적용 (선택)
}
```

또는 Supabase Storage 경로 기반 요청:

```json
{
  "storagePath": "originals/mms/2025-11-19/88/mms-88-....jpg",
  "messageId": 113
}
```

**동작**

1. Supabase Storage에서 원본 이미지를 다운로드
2. `compressImageForSolapi` 재사용 (200KB 이하 확보)
3. Solapi Storage에 새 imageId로 업로드
4. (선택) 압축본을 별도 경로(`.../compressed/`)에 저장하거나 메타데이터에 `compressed_size`, `last_compressed_at` 기록
5. `image_metadata`를 최신 상태로 upsert (source=`mms`, channel=`sms`, 압축 이력 포함)

**응답**

```json
{
  "success": true,
  "imageId": "solapi-file-id-RECOMPRESSED",
  "supabaseUrl": "https://.../originals/mms/2025-11-19/88/mms-88-...jpg",
  "compressionInfo": {
    "originalSize": 512000,
    "compressedSize": 198000,
    "quality": 70,
    "width": 1080,
    "height": 720,
    "warning": null
  },
  "message": "갤러리 이미지가 200KB 이하로 재압축되어 Solapi에 업로드되었습니다."
}
```

**오류 케이스**
- Supabase에서 이미지를 찾을 수 없는 경우 `404`
- 압축 실패 시 `warning` 포함 및 사용자 안내
- Solapi 업로드 실패 시 기존 업로드 API와 동일한 에러 포맷 유지

### 2. MMS 이미지 조회 API (신규)

**엔드포인트**: `GET /api/admin/mms-images`

**쿼리 파라미터**:
- `messageId`: 특정 메시지의 이미지 조회
- `date`: 특정 날짜의 모든 MMS 이미지 조회 (YYYY-MM-DD)
- `folder`: 특정 폴더의 이미지 조회

**응답**:
```json
{
  "success": true,
  "images": [
    {
      "id": 123,
      "url": "https://...",
      "storagePath": "originals/mms/2025-11-19/88/mms-88-1734567890123-1.jpg",
      "fileName": "mms-88-1734567890123-1.jpg",
      "messageId": 88,
      "date": "2025-11-19",
      "originalSize": 1024000,
      "compressedSize": 195000,
      "createdAt": "2025-11-19T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

### 3. 갤러리 폴더 목록 API 수정

**엔드포인트**: `GET /api/admin/folders-list`

**수정 내용**:
- `originals/mms/` 폴더도 포함
- 날짜별 폴더 구조 표시

**응답 예시**:
```json
{
  "folders": [
    "originals/mms/2025-11-19/88",
    "originals/mms/2025-11-19/89",
    "originals/mms/2025-11-20/90",
    ...
  ],
  "count": 10
}
```

---

## 데이터베이스 구조

### image_metadata 테이블

**저장 필드**:
```sql
{
  file_name: "mms-88-1734567890123-1.jpg",
  image_url: "https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/originals/mms/2025-11-19/88/mms-88-1734567890123-1.jpg",
  folder_path: "originals/mms/2025-11-19/88",
  date_folder: "2025-11-19",
  source: "mms",
  channel: "sms",
  title: "MMS 이미지 (메시지 #88)",
  alt_text: "MMS 이미지",
  file_size: 1024000,  // 원본 크기
  compressed_size: 195000,  // ⭐ 신규: 압축 크기
  width: 1200,
  height: 800,
  tags: ["mms", "message-88", "2025-11-19"],
  created_at: "2025-11-19T10:00:00.000Z"
}
```

### channel_sms 테이블

**추가 필드** (선택적):
- `image_storage_path`: Supabase Storage 경로
- `image_supabase_url`: Supabase Storage 공개 URL
- `image_compressed_size`: 압축된 이미지 크기 (선택적)

**또는 기존 `image_url` 필드 활용**:
- Solapi imageId와 Supabase URL을 구분하여 저장
- 또는 Supabase URL만 저장하고 Solapi imageId는 별도 관리

---

## 프론트엔드 수정

### 1. SMS 편집 페이지 (`pages/admin/sms.tsx`)

**수정 내용**:
1. ✅ UI 메시지 수정: "JPG, PNG, GIF (최대 5MB)" → "JPG 형식만 가능 (최대 200KB 권장)"
2. 이미지 업로드 시 `messageId` 전달
3. Supabase URL도 `formData.imageUrl`에 저장
4. 갤러리에서 MMS 이미지 선택 기능 추가
5. 압축 정보 표시 (선택적)

**코드 예시**:
```typescript
// 이미지 업로드 핸들러
const handleImageUpload = async (file: File) => {
  // 파일 크기 사전 검증 (선택적)
  if (file.size > 5 * 1024 * 1024) {
    alert('파일 크기가 너무 큽니다. 5MB 이하의 이미지를 업로드해주세요.\n자동으로 압축되지만, 원본이 너무 크면 품질이 저하될 수 있습니다.');
  }
  
  const formData = new FormData();
  formData.append('file', file);
  
  // 메시지 ID가 있으면 전달
  if (id) {
    formData.append('messageId', id.toString());
  }
  
  const response = await fetch('/api/solapi/upload-image', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  
  if (result.success) {
    // Supabase URL을 imageUrl에 저장 (갤러리/표시용)
    updateFormData({ 
      imageUrl: result.supabaseUrl,
      // Solapi imageId는 별도로 저장 (필요시)
      solapiImageId: result.imageId
    });
    
    // 압축 정보 표시 (선택적)
    if (result.compressionInfo) {
      const { originalSize, compressedSize } = result.compressionInfo;
      console.log(`이미지 압축: ${(originalSize / 1024).toFixed(2)}KB → ${(compressedSize / 1024).toFixed(2)}KB`);
    }
  }
};
```

**UI 메시지 수정**:
```typescript
// 기존
<p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF (최대 5MB)</p>

// 수정 후
<p className="text-xs text-gray-500 mt-1">JPG 형식만 가능 (최대 200KB 권장)</p>
<p className="text-xs text-gray-400 mt-1">자동으로 압축되어 업로드됩니다.</p>
```

### 2. AIImagePicker 컴포넌트 (`components/shared/AIImagePicker.tsx`)

**수정 내용**:
1. MMS 이미지 폴더 표시
2. 메시지별 이미지 필터링
3. 갤러리에서 MMS 이미지 선택 기능

**기능**:
- 탭 추가: "갤러리에서 선택" / "MMS 이미지" / "업로드"
- MMS 이미지 탭: `originals/mms/` 폴더의 이미지 표시
- 날짜별/메시지별 필터링

---

## 참고 사례

### 카카오 이미지 저장 방식

**파일**: `pages/api/kakao-content/generate-images.js`

**폴더 구조**:
```
originals/daily-branding/kakao/YYYY-MM-DD/account1|account2/background|profile|feed/
```

**저장 로직**:
```javascript
// 날짜 추출
let dateStr = metadata.date;
if (dateStr.includes('T')) {
  dateStr = dateStr.split('T')[0]; // ISO 형식: 2025-11-12T09:00:00.000Z -> 2025-11-12
}

// 폴더 경로 구성
const accountFolder = metadata.account === 'account1' ? 'account1' : 'account2';
const typeFolder = metadata.type; // background, profile, feed
const finalFilePath = `originals/daily-branding/kakao/${dateStr}/${accountFolder}/${typeFolder}/${finalFileName}`;

// Supabase Storage에 업로드
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('blog-images')
  .upload(finalFilePath, finalBuffer, {
    contentType: contentType,
    upsert: false
  });
```

### 이미지 압축 예시 (기존 코드)

**파일**: `pages/api/upload-image-supabase.js`

**압축 로직**:
```javascript
const sharp = (await import('sharp')).default;
const optimizedImage = sharp(imageBuffer)
  .rotate() // EXIF 회전 정보 자동 적용
  .resize(1200, 800, { // 최대 크기 제한
    fit: 'inside',
    withoutEnlargement: true
  })
  .jpeg({ 
    quality: 85, // 품질 85%
    progressive: true,
    mozjpeg: true // 더 나은 JPEG 압축
  });

processedBuffer = await optimizedImage.toBuffer();
```

**MMS 이미지 압축도 동일한 패턴으로 구현하되, 200KB 제한을 맞추기 위해 품질을 반복적으로 조정**

---

## 구현 우선순위

### Phase 0: 이미지 압축 기능 (필수) ⭐ **신규**

1. ✅ 이미지 압축 함수 구현
   - Sharp를 사용한 리사이즈 및 품질 조정
   - 반복적 품질 조정으로 200KB 이하 달성
2. ✅ 파일 크기 검증 추가
   - 200KB 제한 확인
   - 에러 메시지 개선
3. ✅ UI 메시지 수정
   - 5MB → 200KB 권장으로 변경

### Phase 1: 기본 기능 (필수)

1. ✅ Solapi 업로드 API 수정
   - 이미지 압축 기능 추가
   - Supabase Storage 저장 추가
   - image_metadata 저장 추가
   - 폴더 구조 생성

2. ✅ MMS 이미지 조회 API 생성
   - 메시지별 이미지 조회
   - 날짜별 이미지 조회

### Phase 1.5: 갤러리 선택 재압축 (필수)

3. ✅ Supabase 원본 기반 재압축/재업로드 API 추가
   - 입력: `supabasePath` 또는 `imageUrl`, `messageId`
   - 출력: 기존 업로드 API와 동일 (`imageId`, `supabaseUrl`, `compressionInfo`)
4. ✅ 갤러리/AIImagePicker에서 이미지 선택 시 위 API 호출하여 항상 200KB 이하 Solapi imageId 발급

### Phase 2: 갤러리 연동 (중요)

5. ✅ 갤러리 폴더 목록에 MMS 폴더 추가
6. ✅ 갤러리 이미지 조회에 MMS 이미지 포함
7. ✅ AIImagePicker에 MMS 이미지 탭 + 재압축 상태 표시 추가

### Phase 3: 고급 기능 (선택)

8. ✅ 메시지별 이미지 관리 페이지
9. ✅ 이미지 재사용 기능 (압축 이력 확인 포함)
10. ✅ 이미지 검색 기능

---

## 예상 파일 구조

```
pages/
├── api/
│   ├── solapi/
│   │   └── upload-image.js          # 수정: 이미지 압축 + Supabase 저장 추가
│   └── admin/
│       └── mms-images.js            # 신규: MMS 이미지 조회 API
│
components/
└── shared/
    └── AIImagePicker.tsx             # 수정: MMS 이미지 탭 추가

docs/
└── mms-image-auto-save-and-gallery-integration-plan.md  # 이 문서 (업데이트됨)
```

---

## 테스트 계획

### 1. 단위 테스트

- ✅ 이미지 압축 함수 테스트
  - 다양한 크기의 이미지로 테스트
  - 200KB 이하 달성 확인
  - 품질 조정 로직 확인
- Solapi 업로드 후 Supabase Storage 저장 확인
- image_metadata 저장 확인
- 폴더 구조 생성 확인
- 갤러리 재압축 API (`/api/solapi/reupload-image`) 단위 테스트
  - Supabase 원본 다운로드 실패/성공 케이스
  - 압축 결과가 200KB 이하인지 검증

### 2. 통합 테스트

- SMS 편집 페이지에서 이미지 업로드 → 압축 → 저장 확인
- 갤러리에서 MMS 이미지 조회 확인
- 이미지 선택 → SMS 편집 페이지 적용 확인
- 갤러리 이미지 선택 → 재압축 API 호출 → 새 Solapi imageId가 에디터에 반영되는지 확인

### 3. E2E 테스트

- 전체 플로우: 업로드 → 압축 → 저장 → 조회 → 선택 → 발송
- 갤러리 선택 플로우: Supabase 원본 → 재압축 → Solapi 업로드 → 발송
- 대용량 이미지 (5MB+) 업로드 테스트
- 압축 실패 케이스 테스트

---

## 주의사항

### 1. 이미지 압축 관련 ⭐ **신규**

- **압축 실패 시**: 60% 품질에서도 200KB 초과 시 경고 표시
- **원본 보존**: Supabase Storage에 원본 저장 (고품질 보존)
- **압축본 관리**: Solapi에만 압축본 업로드 (발송용)
- **메타데이터**: 원본 크기와 압축 크기 모두 기록

### 2. 메시지 ID 처리

- **신규 메시지**: 메시지 ID가 없을 수 있음
  - 해결: 임시 ID 생성 또는 메시지 생성 후 이미지 업로드
- **기존 메시지**: 메시지 ID가 있음
  - 해결: 쿼리 파라미터로 전달

### 3. 이미지 URL 관리

- **Solapi imageId**: MMS 발송용 (Solapi Storage - 압축본)
- **Supabase URL**: 갤러리/표시용 (Supabase Storage - 원본)
- 두 URL을 모두 저장하거나, Supabase URL만 저장

### 4. 폴더 구조 일관성

- 날짜 형식: `YYYY-MM-DD` (ISO 8601)
- 메시지 ID: 숫자 또는 UUID
- 파일명: `mms-{메시지ID}-{timestamp}-{순번}.jpg`

### 5. image_metadata 스키마 준수

- `file_name` 컬럼은 존재하지 않으므로, **조회/업데이트 기준은 `image_url` 또는 `id`** 여야 합니다.
- 추가 필드(`compressed_size`, `storage_path`, `last_compressed_at` 등)는 DB 마이그레이션 후 사용합니다.
- [`docs/resolved/2025-11-01-image-metadata-save-fix.md`](./resolved/2025-11-01-image-metadata-save-fix.md) 참고: 외래키(`category_id`)는 NULL 허용, 배열 컬럼(`tags`)은 항상 배열 형태로 저장.
- [`docs/resolved/2025-11-01-rename-image-fix.md`](./resolved/2025-11-01-rename-image-fix.md) 참고: Storage 경로가 필요하면 `image_url`에서 직접 추출합니다.

---

## 다음 단계

1. **이미지 압축 함수 구현**: `compressImageForSolapi` 함수 작성
2. **API 수정**: `pages/api/solapi/upload-image.js` 수정 (압축 + 저장)
3. **UI 메시지 수정**: `pages/admin/sms.tsx` 수정 (5MB → 200KB)
4. **API 생성**: `pages/api/admin/mms-images.js` 생성
5. **컴포넌트 수정**: `AIImagePicker` 수정
6. **페이지 수정**: `pages/admin/sms.tsx` 수정
7. **테스트**: 전체 플로우 테스트 (압축 포함)

---

## 참고 자료

- 카카오 이미지 저장: `pages/api/kakao-content/generate-images.js`
- 카카오 이미지 조회: `pages/api/kakao-content/fetch-gallery-images-by-date.js`
- 이미지 압축 예시: `pages/api/upload-image-supabase.js`
- 갤러리 관리: `pages/admin/gallery.tsx`
- 이미지 메타데이터: `pages/api/admin/upsert-image-metadata.js`
- Sharp 라이브러리: https://sharp.pixelplumbing.com/
