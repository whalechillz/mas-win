# 이미지 파일명 변경 API 오류 해결 가이드

## 🚨 문제 설명

### 발생 시점
- 2025-11-01

### 오류 내용
- `파일명 변경 실패 - 500 오류`
- `column "file_name" does not exist`
- `이미지를 찾을 수 없습니다`

### 영향 범위
- 이미지 갤러리 관리 페이지 (`/admin/gallery`)
- 이미지 파일명 변경 기능
- 메타데이터 업데이트 기능

## 🔍 원인 분석

### 1. 존재하지 않는 컬럼 사용
**문제**: `pages/api/admin/rename-image.js`에서 `image_metadata` 테이블에 존재하지 않는 `file_name` 컬럼을 사용

**실제 테이블 스키마** (`supabase-setup.sql`):
```sql
CREATE TABLE image_metadata (
  id SERIAL PRIMARY KEY,
  image_url TEXT NOT NULL UNIQUE,  -- ← UNIQUE 컬럼 (file_name 없음)
  alt_text TEXT,
  title TEXT,
  description TEXT,
  category_id INTEGER REFERENCES image_categories(id),
  tags TEXT[],
  ...
);
```

**잘못된 코드 위치**:
- 라인 57: `.eq('file_name', currentFileName)` - 조회 시도
- 라인 87: `currentImage.file_name` - 접근 시도
- 라인 92: `const currentPath = currentImage.file_name;` - 경로 추출 시도
- 라인 161, 172: `file_name: newFilePath` - 업데이트 시도
- 라인 176: `.eq('file_name', currentPath)` - 조건 사용 시도

## 🔧 해결 과정

### 수정 내용

#### 1. 이미지 메타데이터 조회 로직 수정
**이전** (잘못된 방법):
```javascript
// file_name 컬럼 사용 시도
.eq('file_name', currentFileName)
```

**수정 후** (올바른 방법):
```javascript
// image_url로 조회 (테이블에 실제 존재하는 컬럼)
.eq('image_url', imageUrl)

// currentFileName이 제공된 경우 Storage URL로 변환하여 조회
const storageBaseUrl = `${supabaseUrl}/storage/v1/object/public/blog-images/`;
const constructedUrl = `${storageBaseUrl}${currentFileName}`;
.eq('image_url', constructedUrl)
```

#### 2. Storage 경로 추출 로직 수정
**이전** (잘못된 방법):
```javascript
const currentPath = currentImage.file_name;  // file_name 컬럼 없음
```

**수정 후** (올바른 방법):
```javascript
// image_url에서 Storage 경로 추출
const storageBaseUrl = `${supabaseUrl}/storage/v1/object/public/blog-images/`;
let currentPath;

if (currentImage.image_url && currentImage.image_url.includes(storageBaseUrl)) {
  currentPath = currentImage.image_url.replace(storageBaseUrl, '');
} else if (currentFileName) {
  currentPath = currentFileName;
} else {
  const urlMatch = currentImage.image_url?.match(/blog-images\/(.+)$/);
  currentPath = urlMatch ? urlMatch[1] : null;
}
```

#### 3. 메타데이터 업데이트 로직 수정
**이전** (잘못된 방법):
```javascript
.update({
  file_name: newFilePath,  // file_name 컬럼 없음
  image_url: urlData.publicUrl,
  title: newFileName
})
.eq('file_name', currentPath);  // file_name 컬럼 없음
```

**수정 후** (올바른 방법):
```javascript
// file_name 컬럼 제거, image_url만 업데이트
.update({
  image_url: urlData.publicUrl,
  title: newFileName
})
.eq('id', currentImage.id);  // 또는 .eq('image_url', currentImage.image_url)
```

## 📝 해결된 코드

### pages/api/admin/rename-image.js (주요 수정 부분)

```javascript
// 1. 이미지 메타데이터 조회
// ID로 조회 실패하거나 ID가 없는 경우 image_url로 조회
// 주의: image_metadata 테이블에는 file_name 컬럼이 없고 image_url만 있음
if (!currentImage) {
  if (imageUrl) {
    const { data, error } = await supabase
      .from('image_metadata')
      .select('*')
      .eq('image_url', imageUrl)
      .single();
    currentImage = data;
    fetchError = error;
  } else if (currentFileName) {
    // currentFileName이 제공된 경우, Storage URL로 변환하여 조회
    const storageBaseUrl = `${supabaseUrl}/storage/v1/object/public/blog-images/`;
    const constructedUrl = `${storageBaseUrl}${currentFileName}`;
    
    const { data, error } = await supabase
      .from('image_metadata')
      .select('*')
      .eq('image_url', constructedUrl)
      .single();
    currentImage = data;
    fetchError = error;
  }
}

// 2. image_url에서 Storage 경로 추출
const storageBaseUrl = `${supabaseUrl}/storage/v1/object/public/blog-images/`;
let currentPath;

if (currentImage.image_url && currentImage.image_url.includes(storageBaseUrl)) {
  currentPath = currentImage.image_url.replace(storageBaseUrl, '');
} else if (currentFileName) {
  currentPath = currentFileName;
} else {
  const urlMatch = currentImage.image_url?.match(/blog-images\/(.+)$/);
  currentPath = urlMatch ? urlMatch[1] : null;
}

// 7. 메타데이터 업데이트
// image_metadata 테이블에는 file_name 컬럼이 없고 image_url만 있음
if (currentImage.id && !isNaN(currentImage.id)) {
  const { error } = await supabase
    .from('image_metadata')
    .update({
      image_url: urlData.publicUrl,
      title: newFileName
    })
    .eq('id', currentImage.id);
  updateError = error;
} else {
  const { error } = await supabase
    .from('image_metadata')
    .update({
      image_url: urlData.publicUrl,
      title: newFileName
    })
    .eq('image_url', currentImage.image_url);
  updateError = error;
}
```

## 🧪 테스트 방법

### 1. 로컬 테스트
1. `/admin/gallery` 접속
2. 이미지 편집 모달 열기
3. 파일명 변경
4. 저장 버튼 클릭
5. 성공 메시지 확인

### 2. API 직접 테스트
```bash
curl -X POST http://localhost:3000/api/admin/rename-image \
  -H "Content-Type: application/json" \
  -d '{
    "imageId": "123",
    "newFileName": "new-test-image",
    "imageUrl": "https://...supabase.co/storage/v1/object/public/blog-images/old-test-image.jpg"
  }'
```

## 📋 체크리스트

### 이미지 파일명 변경 기능 개발 시:
- [ ] `image_metadata` 테이블 스키마 확인 (`file_name` 컬럼 없음)
- [ ] `image_url` 컬럼만 사용하여 조회/업데이트
- [ ] `image_url`에서 Storage 경로 추출 로직 구현
- [ ] Storage URL 형식 확인 (`/storage/v1/object/public/blog-images/...`)

### 오류 발생 시:
- [ ] Vercel 로그에서 상세 에러 메시지 확인
- [ ] `column "file_name" does not exist` 오류 확인
- [ ] `image_url` 값이 올바른 형식인지 확인
- [ ] Storage 경로 추출이 정상 작동하는지 확인

## 🚀 성공 확인 방법

### 1. API 응답 확인
```json
{
  "success": true,
  "message": "파일명이 성공적으로 변경되었습니다.",
  "data": {
    "oldFileName": "old-path/file.jpg",
    "newFileName": "new-path/new-file.jpg",
    "newUrl": "https://...supabase.co/storage/v1/object/public/blog-images/new-path/new-file.jpg"
  }
}
```

### 2. 데이터베이스 확인
- `image_metadata` 테이블의 `image_url`이 새 URL로 업데이트되었는지 확인
- `title`이 새 파일명으로 업데이트되었는지 확인

### 3. Storage 확인
- Supabase Storage에서 기존 파일이 삭제되었는지 확인
- 새 파일명으로 파일이 업로드되었는지 확인

## 📚 관련 문서
- `docs/resolved/2025-11-01-image-metadata-save-fix.md` - 이미지 메타데이터 저장 문제 해결
- `supabase-setup.sql` - 데이터베이스 스키마 정의
- `pages/api/admin/image-metadata.js` - 메타데이터 관리 API

## 📞 지원 정보
- 개발자: AI Assistant
- 최종 업데이트: 2025-11-01
- 버전: 1.0

