# 이미지 메타데이터 및 파일명 저장 가이드

## ⚠️ 중요: 파일명과 제목 구분 필수

### 문제점
- **파일명이 제목에 들어가는 문제**: 저장 후 다시 읽을 때 제목 필드에 파일명이 표시됨
- **파일명 확장자 중복**: `.png.png` 같이 확장자가 중복되어 생성됨

### 해결 방법

#### 1. 파일명 생성 시 확장자 중복 방지

```typescript
// ❌ 잘못된 방법 (확장자 중복 발생)
const finalFileName = generateBasicFileName(title, keywords); // "golf-driver.png" 반환 가능
const finalFileNameWithExtension = finalFileName + extension; // "golf-driver.png.png"

// ✅ 올바른 방법 (확장자 제거 후 추가)
let finalFileName = generateBasicFileName(title, keywords);
finalFileName = finalFileName.replace(/\.(jpg|jpeg|png|gif|webp)$/i, ''); // 확장자 제거
const finalFileNameWithExtension = finalFileName + extension; // "golf-driver.png"
```

**위치**: `components/ImageMetadataModal/index.tsx` - `handleGenerateSEOFileName` 함수 (139-143줄)

#### 2. 저장 시 제목과 파일명 분리

```typescript
// 저장 전 검증: 제목이 파일명과 같으면 빈 문자열로 처리
let titleValue = editForm.title || '';
const filenameWithoutExt = updatedImageName?.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
const titleWithoutExt = titleValue.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');

if (titleValue === updatedImageName || titleValue === image.name || 
    titleWithoutExt === filenameWithoutExt) {
  console.warn('⚠️ 제목이 파일명과 동일하여 빈 문자열로 처리:', titleValue);
  titleValue = '';
}
```

**위치**: 
- `pages/admin/gallery.tsx` - `saveEdit` 함수 (853-862줄)
- `pages/admin/gallery.tsx` - `onSave` 콜백 (1828-1837줄)

#### 3. 로드 시 제목과 파일명 분리

```typescript
// 로드 시 검증: 제목이 파일명과 같으면 빈 문자열로 처리
let titleValue = image.title || '';
if (titleValue === image.name || 
    titleValue.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '') === 
    image.name?.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '')) {
  console.warn('⚠️ 제목이 파일명과 동일하여 빈 문자열로 처리:', titleValue);
  titleValue = '';
}
```

**위치**: `components/ImageMetadataModal/index.tsx` - `useEffect` 이미지 초기화 (331-336줄)

## 📋 데이터 구조

### 이미지 메타데이터 저장 구조

```typescript
interface MetadataForm {
  alt_text: string;      // ALT 텍스트
  keywords: string;      // 키워드 (쉼표로 구분)
  title: string;        // 제목 (파일명과 별개)
  description: string;   // 설명
  category: string;     // 카테고리 (하위 호환성, 문자열)
  categories: string[];  // 카테고리 (다중 선택, 배열)
  filename: string;      // 파일명 (제목과 별개)
}
```

### 저장 시 전송 데이터

```typescript
const requestData = {
  imageName: metadata.filename || image.name,  // 파일명
  imageUrl: image.url,                          // 이미지 URL
  alt_text: metadata.alt_text,                   // ALT 텍스트
  keywords: keywords,                           // 키워드 (배열)
  title: titleValue,                            // 제목 (파일명과 다름)
  description: metadata.description,             // 설명
  category: categoryString,                     // 카테고리 (문자열)
  categories: categoriesArray                   // 카테고리 (배열)
};
```

### 데이터베이스 저장 (`image_metadata` 테이블)

```sql
CREATE TABLE image_metadata (
  id UUID PRIMARY KEY,
  image_url TEXT UNIQUE NOT NULL,
  alt_text TEXT,
  title TEXT,              -- 제목 (파일명과 별개)
  description TEXT,
  tags TEXT[],             -- 키워드 (배열)
  category_id INTEGER,      -- 카테고리 ID (FK)
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**주의사항**:
- `image_metadata` 테이블에는 **파일명을 저장하는 컬럼이 없음**
- 파일명은 Supabase Storage의 실제 파일명으로 관리됨
- 제목(`title`)과 파일명은 **완전히 별개의 필드**

## 🔧 파일명 생성 로직

### 하이브리드 SEO 파일명 생성

1. **규칙 기반 생성** (`generateBasicFileName`)
   - 제목과 키워드에서 영문 단어 추출
   - 골프 전문 키워드 매핑 (골프→golf, 드라이버→driver)
   - SEO 최적화 키워드 우선순위 적용
   - 브랜드명(`massgoo`) 자동 추가

2. **AI 최적화** (선택적)
   - 조건에 따라 AI 파일명 생성 시도
   - 실패 시 규칙 기반 결과 사용

3. **확장자 처리**
   ```typescript
   // 기존 파일의 확장자 추출
   const extension = currentFilename.includes('.') 
     ? '.' + currentFilename.split('.').pop() 
     : '.jpg';
   
   // 생성된 파일명에서 확장자 제거 (중복 방지)
   finalFileName = finalFileName.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
   
   // 확장자 추가
   const finalFileNameWithExtension = finalFileName + extension;
   ```

## ⚠️ 주의사항

### 1. 파일명과 제목은 별개
- **파일명**: SEO 최적화된 영문 파일명 (예: `golf-driver-male-massgoo-191.png`)
- **제목**: 사용자에게 표시되는 한글 제목 (예: `골프 드라이버 스윙의 순간`)
- **절대 혼동 금지**: 파일명이 제목에 들어가거나, 제목이 파일명에 들어가면 안 됨

### 2. 저장/로드 시 검증 필수
- 저장 전: 제목이 파일명과 같으면 빈 문자열로 처리
- 로드 후: 제목이 파일명과 같으면 빈 문자열로 처리

### 3. 확장자 중복 방지
- 파일명 생성 함수는 확장자 없이 반환해야 함
- 확장자 추가 전에 기존 확장자 제거 필수

## 🔍 문제 해결 체크리스트

### 저장 후 제목에 파일명이 들어가는 경우

1. ✅ 저장 요청 데이터 확인 (`console.log('📤 저장 요청 데이터:', requestData)`)
   - `title`이 파일명과 다른지 확인
   - `imageName`(파일명)과 `title`(제목)이 분리되어 있는지 확인

2. ✅ 로드 후 데이터 확인 (`console.log('📋 이미지 카테고리 초기화:', ...)`)
   - `image.title`이 파일명과 같은지 확인
   - 같다면 빈 문자열로 처리됨

3. ✅ 데이터베이스 확인
   ```sql
   SELECT image_url, title, alt_text 
   FROM image_metadata 
   WHERE image_url LIKE '%파일명%';
   ```
   - `title` 컬럼에 파일명이 들어가 있는지 확인

### 파일명 확장자 중복 발생 시

1. ✅ 파일명 생성 함수 확인
   - `generateBasicFileName`이 확장자를 포함해서 반환하는지 확인
   - `generateAIFileName`이 확장자를 포함해서 반환하는지 확인

2. ✅ 확장자 제거 로직 확인
   - `handleGenerateSEOFileName`에서 확장자 제거가 실행되는지 확인
   - 정규식 `/\.(jpg|jpeg|png|gif|webp)$/i`가 올바르게 작동하는지 확인

## 📝 코드 예시

### 올바른 파일명 생성

```typescript
// 1. 제목/키워드에서 파일명 생성 (확장자 없음)
const basicFileName = generateBasicFileName(form.title, form.keywords);
// 반환: "golf-driver-male-massgoo-191"

// 2. 확장자 제거 (중복 방지)
let finalFileName = basicFileName.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
// 결과: "golf-driver-male-massgoo-191"

// 3. 기존 파일의 확장자 추출
const extension = '.png';

// 4. 확장자 추가
const finalFileNameWithExtension = finalFileName + extension;
// 결과: "golf-driver-male-massgoo-191.png"
```

### 올바른 제목 저장

```typescript
// 제목: "골프 드라이버 스윙의 순간"
// 파일명: "golf-driver-male-massgoo-191.png"

// 저장 전 검증
let titleValue = "골프 드라이버 스윙의 순간";
const filenameWithoutExt = "golf-driver-male-massgoo-191";
const titleWithoutExt = "골프 드라이버 스윙의 순간";

// 검증: 다르므로 그대로 사용
if (titleValue === filenameWithoutExt) {
  titleValue = ''; // 실행되지 않음
}

// 저장
const requestData = {
  imageName: "golf-driver-male-massgoo-191.png",  // 파일명
  title: "골프 드라이버 스윙의 순간"                // 제목 (다름)
};
```

## 🚀 향후 개선 방향

1. **파일명과 제목 자동 동기화 금지**
   - 명시적인 검증 로직 추가
   - 개발자 콘솔 경고 메시지 강화

2. **확장자 검증 강화**
   - 파일명 생성 함수에서 확장자 반환 금지 (타입 체크)
   - 확장자 추가 전 검증 로직 추가

3. **테스트 자동화**
   - 파일명 확장자 중복 방지 테스트
   - 제목과 파일명 분리 테스트
