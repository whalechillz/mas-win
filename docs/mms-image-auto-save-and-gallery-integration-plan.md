# MMS 이미지 자동 저장 및 갤러리 연동 개발 계획

## 📋 목차

1. [개요](#개요)
2. [현재 상황 분석](#현재-상황-분석)
3. [개발 목표](#개발-목표)
4. [기술 설계](#기술-설계)
5. [구현 단계](#구현-단계)
6. [API 설계](#api-설계)
7. [데이터베이스 구조](#데이터베이스-구조)
8. [프론트엔드 수정](#프론트엔드-수정)
9. [참고 사례](#참고-사례)

---

## 개요

SMS/MMS 편집 페이지에서 이미지를 업로드할 때:
1. **Solapi에 업로드** (MMS 발송용 - 기존 기능 유지)
2. **Supabase Storage에 자동 저장** (갤러리 관리용 - 신규)
   - 폴더 구조: `originals/mms/YYYY-MM-DD/메시지ID/`
3. **image_metadata 테이블에 메타데이터 저장** (검색/관리용)
4. **갤러리에서 MMS 이미지 불러오기** (재사용 가능)

---

## 현재 상황 분석

### ✅ 기존 기능

1. **Solapi 이미지 업로드** (`pages/api/solapi/upload-image.js`)
   - MMS 발송용 이미지를 Solapi Storage에 업로드
   - 현재는 Solapi에만 업로드하고 Supabase Storage에는 저장하지 않음

2. **갤러리 이미지 관리** (`pages/admin/gallery.tsx`)
   - `originals/daily-branding/kakao/YYYY-MM-DD/account1|account2/background|profile|feed/` 형식으로 저장
   - 카카오 이미지는 날짜별 폴더 구조로 잘 관리되고 있음

3. **AIImagePicker 컴포넌트** (`components/shared/AIImagePicker.tsx`)
   - SMS 편집 페이지에서 이미지 선택 시 사용
   - 현재는 Solapi 업로드만 지원

### ❌ 부족한 기능

1. MMS 이미지가 Supabase Storage에 저장되지 않음
2. MMS 이미지가 image_metadata 테이블에 등록되지 않음
3. 갤러리에서 MMS 이미지를 불러올 수 없음
4. 메시지별로 이미지가 체계적으로 관리되지 않음

---

## 개발 목표

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
            ├── mms-{메시지ID}-{timestamp}-1.jpg
            ├── mms-{메시지ID}-{timestamp}-2.jpg
            └── ...
```

**예시**:
```
originals/mms/2025-11-19/88/mms-88-1734567890123-1.jpg
originals/mms/2025-11-19/88/mms-88-1734567890456-2.jpg
originals/mms/2025-11-20/89/mms-89-1734654321000-1.jpg
```

### 2. 저장 프로세스

```
1. 사용자가 SMS 편집 페이지에서 이미지 업로드
   ↓
2. Solapi 업로드 API 호출 (/api/solapi/upload-image)
   ↓
3. Solapi 업로드 성공 후
   ↓
4. Supabase Storage에 저장 (originals/mms/YYYY-MM-DD/메시지ID/)
   ↓
5. image_metadata 테이블에 메타데이터 저장
   ↓
6. Solapi imageId와 Supabase URL 모두 반환
```

### 3. 데이터 흐름

```
[SMS 편집 페이지]
    ↓ (이미지 업로드)
[Solapi 업로드 API]
    ↓ (Solapi 업로드 성공)
[Supabase Storage 저장]
    ↓ (저장 성공)
[image_metadata 저장]
    ↓ (메타데이터 저장 성공)
[응답 반환]
    - Solapi imageId (MMS 발송용)
    - Supabase URL (갤러리/표시용)
```

---

## 구현 단계

### 1단계: Solapi 업로드 API 수정

**파일**: `pages/api/solapi/upload-image.js`

**수정 내용**:
1. Solapi 업로드 성공 후 Supabase Storage에도 저장
2. 폴더 구조 생성: `originals/mms/YYYY-MM-DD/메시지ID/`
3. image_metadata 테이블에 메타데이터 저장
4. Solapi imageId와 Supabase URL 모두 반환

**요청 파라미터 추가**:
- `messageId`: 메시지 ID (선택적, 없으면 새로 생성)

**응답 형식**:
```json
{
  "success": true,
  "imageId": "solapi-file-id",  // Solapi imageId (MMS 발송용)
  "supabaseUrl": "https://...",  // Supabase Storage URL (갤러리용)
  "storagePath": "originals/mms/2025-11-19/88/mms-88-1734567890123-1.jpg",
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
- 이미지 업로드 시 `messageId` 전달
- Supabase URL도 저장 (Solapi imageId와 함께)
- 갤러리에서 MMS 이미지 선택 기능

---

## API 설계

### 1. Solapi 이미지 업로드 API 수정

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
  "imageId": "solapi-file-id-12345",  // Solapi imageId (MMS 발송용)
  "supabaseUrl": "https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/originals/mms/2025-11-19/88/mms-88-1734567890123-1.jpg",
  "storagePath": "originals/mms/2025-11-19/88/mms-88-1734567890123-1.jpg",
  "fileName": "mms-88-1734567890123-1.jpg",
  "fileSize": 123456,
  "fileType": "image/jpeg",
  "message": "이미지가 성공적으로 업로드되었습니다."
}
```

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
  file_size: 123456,
  width: 800,
  height: 600,
  tags: ["mms", "message-88", "2025-11-19"],
  created_at: "2025-11-19T10:00:00.000Z"
}
```

### channel_sms 테이블

**추가 필드** (선택적):
- `image_storage_path`: Supabase Storage 경로
- `image_supabase_url`: Supabase Storage 공개 URL

**또는 기존 `image_url` 필드 활용**:
- Solapi imageId와 Supabase URL을 구분하여 저장
- 또는 Supabase URL만 저장하고 Solapi imageId는 별도 관리

---

## 프론트엔드 수정

### 1. SMS 편집 페이지 (`pages/admin/sms.tsx`)

**수정 내용**:
1. 이미지 업로드 시 `messageId` 전달
2. Supabase URL도 `formData.imageUrl`에 저장
3. 갤러리에서 MMS 이미지 선택 기능 추가

**코드 예시**:
```typescript
// 이미지 업로드 핸들러
const handleImageUpload = async (file: File) => {
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
  }
};
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

### 카카오 이미지 조회 API

**파일**: `pages/api/kakao-content/fetch-gallery-images-by-date.js`

**기능**:
- 특정 날짜/계정/타입의 이미지 조회
- 폴더 경로 기반 조회

**MMS 이미지 조회 API도 동일한 패턴으로 구현**

---

## 구현 우선순위

### Phase 1: 기본 기능 (필수)

1. ✅ Solapi 업로드 API 수정
   - Supabase Storage 저장 추가
   - image_metadata 저장 추가
   - 폴더 구조 생성

2. ✅ MMS 이미지 조회 API 생성
   - 메시지별 이미지 조회
   - 날짜별 이미지 조회

### Phase 2: 갤러리 연동 (중요)

3. ✅ 갤러리 폴더 목록에 MMS 폴더 추가
4. ✅ 갤러리 이미지 조회에 MMS 이미지 포함
5. ✅ AIImagePicker에 MMS 이미지 탭 추가

### Phase 3: 고급 기능 (선택)

6. ✅ 메시지별 이미지 관리 페이지
7. ✅ 이미지 재사용 기능
8. ✅ 이미지 검색 기능

---

## 예상 파일 구조

```
pages/
├── api/
│   ├── solapi/
│   │   └── upload-image.js          # 수정: Supabase 저장 추가
│   └── admin/
│       └── mms-images.js            # 신규: MMS 이미지 조회 API
│
components/
└── shared/
    └── AIImagePicker.tsx             # 수정: MMS 이미지 탭 추가

docs/
└── mms-image-auto-save-and-gallery-integration-plan.md  # 이 문서
```

---

## 테스트 계획

### 1. 단위 테스트

- Solapi 업로드 후 Supabase Storage 저장 확인
- image_metadata 저장 확인
- 폴더 구조 생성 확인

### 2. 통합 테스트

- SMS 편집 페이지에서 이미지 업로드 → 저장 확인
- 갤러리에서 MMS 이미지 조회 확인
- 이미지 선택 → SMS 편집 페이지 적용 확인

### 3. E2E 테스트

- 전체 플로우: 업로드 → 저장 → 조회 → 선택 → 발송

---

## 주의사항

### 1. 메시지 ID 처리

- **신규 메시지**: 메시지 ID가 없을 수 있음
  - 해결: 임시 ID 생성 또는 메시지 생성 후 이미지 업로드
- **기존 메시지**: 메시지 ID가 있음
  - 해결: 쿼리 파라미터로 전달

### 2. 이미지 URL 관리

- **Solapi imageId**: MMS 발송용 (Solapi Storage)
- **Supabase URL**: 갤러리/표시용 (Supabase Storage)
- 두 URL을 모두 저장하거나, Supabase URL만 저장

### 3. 폴더 구조 일관성

- 날짜 형식: `YYYY-MM-DD` (ISO 8601)
- 메시지 ID: 숫자 또는 UUID
- 파일명: `mms-{메시지ID}-{timestamp}-{순번}.jpg`

---

## 다음 단계

1. **API 수정**: `pages/api/solapi/upload-image.js` 수정
2. **API 생성**: `pages/api/admin/mms-images.js` 생성
3. **컴포넌트 수정**: `AIImagePicker` 수정
4. **페이지 수정**: `pages/admin/sms.tsx` 수정
5. **테스트**: 전체 플로우 테스트

---

## 참고 자료

- 카카오 이미지 저장: `pages/api/kakao-content/generate-images.js`
- 카카오 이미지 조회: `pages/api/kakao-content/fetch-gallery-images-by-date.js`
- 갤러리 관리: `pages/admin/gallery.tsx`
- 이미지 메타데이터: `pages/api/admin/upsert-image-metadata.js`

