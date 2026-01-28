# 고객 이미지 잔상 및 로드 실패 수정 계획

## 문제 분석

### 1. 잔상 문제 (12개 vs 11개)
- **증상**: 전유근 1월 28일 필터에서 12개 이미지가 표시되지만, 갤러리에서는 11개만 존재
- **원인**:
  - 데이터베이스에 삭제된 이미지의 메타데이터가 남아있음
  - `date_folder` 추출 로직이 여러 소스에서 시도하면서 잘못된 날짜가 추출됨
  - 실제 Storage에 존재하지 않는 파일의 메타데이터가 필터링되지 않음
  - `file_path`와 실제 Storage 파일 위치가 불일치

### 2. 회색 이미지 (대표 이미지 변경 후에도)
- **증상**: 대표 이미지를 다른 것으로 바꿨는데도 리스트와 썸네일에 회색으로 표시됨
- **원인**:
  - 대표 이미지 설정 API가 `is_customer_representative`만 업데이트하고 `file_path`/`cdn_url`은 업데이트하지 않음
  - 이미지의 `file_path`가 잘못되어 있거나 실제 Storage 파일이 없음
  - `image_url`과 `cdn_url`이 서로 다른 경로를 가리킴 (예: `2026-01-21` vs `2026-01-28`)
  - 이미지 로드 실패 시 자동으로 제거되지 않음

## 수정 계획

### 1. API 개선: 실제 Storage 파일 존재 여부 확인
**파일**: `pages/api/admin/upload-customer-image.js`

**변경 사항**:
- 메타데이터 이미지와 Storage 이미지를 매칭할 때 실제 파일 존재 여부 확인
- `dateFilter` 적용 시 실제 Storage에 존재하는 파일만 반환
- `file_path`가 잘못된 경우 자동으로 수정

**구현**:
```javascript
// Storage 파일 존재 여부 확인 함수 추가
async function verifyFileExists(filePath) {
  try {
    const pathParts = filePath.split('/');
    const folderPath = pathParts.slice(0, -1).join('/');
    const fileName = pathParts[pathParts.length - 1];
    
    const { data: files, error } = await supabase.storage
      .from('blog-images')
      .list(folderPath, { search: fileName });
    
    return !error && files && files.length > 0;
  } catch (error) {
    console.error('파일 존재 확인 오류:', error);
    return false;
  }
}

// 필터링된 이미지에 대해 실제 파일 존재 여부 확인
const verifiedImages = await Promise.all(
  filteredMetadataImages.map(async (img) => {
    if (img.file_path) {
      const exists = await verifyFileExists(img.file_path);
      if (!exists) {
        console.warn('⚠️ Storage에 존재하지 않는 이미지 메타데이터:', {
          imageId: img.id,
          file_path: img.file_path
        });
        return null; // 존재하지 않으면 제외
      }
    }
    return img;
  })
);

// null 제거
const validImages = verifiedImages.filter(img => img !== null);
```

### 2. date_folder 필터링 개선
**파일**: `pages/api/admin/upload-customer-image.js`

**변경 사항**:
- `dateFilter` 적용 시 `ai_tags`의 `visit-{date}` 태그도 확인
- `file_path`에서 추출한 날짜와 `ai_tags`의 날짜가 일치하는지 확인
- 불일치하는 경우 `ai_tags`의 날짜를 우선 사용

**구현**:
```javascript
// dateFilter 적용 시
if (dateFilter) {
  filteredMetadataImages = filteredMetadataImages.filter(img => {
    // 1. ai_tags의 visit-{date} 태그 확인
    const visitTag = img.ai_tags?.find((tag: string) => tag.startsWith('visit-'));
    const visitDate = visitTag?.replace('visit-', '');
    
    // 2. date_folder 확인
    const dateFolder = img.date_folder;
    
    // 3. file_path에서 날짜 추출
    const filePathDate = img.file_path?.match(/(\d{4}-\d{2}-\d{2})/)?.[1];
    
    // visit-{date} 태그가 있으면 우선 사용
    const actualDate = visitDate || dateFolder || filePathDate;
    
    return actualDate === dateFilter;
  });
}
```

### 3. 대표 이미지 설정 시 file_path 업데이트
**파일**: `pages/api/admin/set-customer-representative-image.ts`

**변경 사항**:
- 대표 이미지 설정 시 `file_path`와 `cdn_url`도 함께 업데이트
- 실제 Storage 파일 위치 확인 후 올바른 경로로 업데이트

**구현**:
```typescript
// 대표 이미지 설정 시
const { data: setData, error: setError } = await supabase
  .from('image_assets')
  .update({ 
    is_customer_representative: true,
    // file_path와 cdn_url도 함께 업데이트
    file_path: image.file_path, // 이미 올바른 경로인지 확인
    cdn_url: image.cdn_url, // 또는 새로 생성
    updated_at: new Date().toISOString()
  })
  .eq('id', imageId)
  .select('id, is_customer_representative, file_path, cdn_url');
```

### 4. 프론트엔드: 이미지 로드 실패 시 자동 제거
**파일**: `pages/admin/customers/index.tsx`

**변경 사항**:
- 이미지 로드 실패 시 해당 이미지를 목록에서 제거
- 또는 로드 실패한 이미지를 별도로 표시하고 사용자에게 알림

**구현**:
```typescript
// 이미지 로드 실패 핸들러
const handleImageLoadError = async (imageId: string) => {
  console.warn('⚠️ 이미지 로드 실패:', { imageId });
  
  // 옵션 1: 목록에서 제거
  setUploadedImages(prev => prev.filter(img => img.id !== imageId));
  
  // 옵션 2: API에 알림 (DB에서 제거 또는 수정)
  // await fetch('/api/admin/remove-invalid-image', {
  //   method: 'POST',
  //   body: JSON.stringify({ imageId })
  // });
};

// MediaRenderer에서 사용
<MediaRenderer
  src={img.image_url}
  onError={() => handleImageLoadError(img.id)}
/>
```

### 5. DB 정리 스크립트
**파일**: `scripts/cleanup-ghost-customer-images.js` (신규 생성)

**목적**:
- 실제 Storage에 존재하지 않는 이미지 메타데이터 제거
- `file_path`와 실제 파일 위치가 불일치하는 경우 수정
- 특정 고객/날짜의 잔상 이미지 정리

**구현**:
```javascript
// 1. 특정 고객의 모든 이미지 메타데이터 조회
// 2. 각 이미지의 file_path로 실제 Storage 파일 존재 여부 확인
// 3. 존재하지 않는 이미지 메타데이터 제거 또는 수정
// 4. date_folder와 file_path가 불일치하는 경우 수정
```

## 우선순위

1. **높음**: API에서 실제 Storage 파일 존재 여부 확인 (잔상 문제 해결)
2. **높음**: date_folder 필터링 개선 (잔상 문제 해결)
3. **중간**: 대표 이미지 설정 시 file_path 업데이트 (회색 이미지 문제 해결)
4. **중간**: 프론트엔드 이미지 로드 실패 처리 (UX 개선)
5. **낮음**: DB 정리 스크립트 (일회성 정리)

## 예상 효과

- 잔상 문제 해결: 실제 존재하는 파일만 표시되어 정확한 개수 표시
- 회색 이미지 문제 해결: 올바른 `file_path`로 이미지 로드 성공
- 데이터 일관성 향상: DB 메타데이터와 실제 Storage 파일 위치 일치
- 사용자 경험 개선: 로드 실패한 이미지 자동 처리
