# 갤러리에서 고객 이미지 이동 시 메타데이터 손실 문제 수정 계획

## 문제 분석

### 현재 상황
1. **갤러리에서 파일 이동**: `ahnhuija-S1-20260128-01.webp`, `ahnhuija-S1-20260128-02.webp`를 `2026-01-28` → `2026-01-26`으로 이동
2. **이동 후 문제**:
   - 이미지 메타데이터가 모두 없어짐
   - 고객 관리에서 "이미지 로드 실패" 2개 표시
   - 1월 28일 필터가 지워지지 않고 회색으로 "이미지 로드 실패" 표시
   - "대표" 배지도 그대로 유지

### 원인 분석

**현재 `move-image-to-folder.js` API 로직**:
```javascript
// 204-219줄: 메타데이터 업데이트
const { error: updateError } = await supabase
  .from('image_assets')
  .update({
    image_url: newUrlData.publicUrl,
    original_path: targetPath,
    updated_at: new Date().toISOString()
  })
  .eq('id', metadata.id);
```

**문제점**:
1. `file_path` 업데이트 안 함
   - `original_path`만 업데이트하고 `file_path`는 업데이트하지 않음
   - 고객 이미지 조회 시 `file_path`를 사용하므로 이미지를 찾을 수 없음

2. `cdn_url` 업데이트 안 함
   - `image_url`만 업데이트하고 `cdn_url`은 업데이트하지 않음
   - 프론트엔드가 `cdn_url`을 사용하므로 이미지 로드 실패

3. `ai_tags`의 `visit-{date}` 태그 업데이트 안 함
   - 날짜 폴더가 변경되었지만 `visit-{date}` 태그가 업데이트되지 않음
   - 고객 관리에서 날짜 필터가 작동하지 않음

4. `ai_tags`의 `customer-{id}` 태그 확인 안 함
   - 고객 이미지인지 확인하지 않고 일반 이미지처럼 처리

## 해결 방안

### 옵션 1: `move-image-to-folder.js` API 개선 (권장) ⭐

**수정 내용**:
1. `file_path` 업데이트 추가
2. `cdn_url` 업데이트 추가
3. 고객 이미지인 경우 `ai_tags`의 `visit-{date}` 태그 업데이트
4. `file_path`에서 날짜 추출하여 `visit-{date}` 태그 생성

**장점**:
- 기존 API 재사용
- 갤러리에서 바로 사용 가능
- 일관성 유지

### 옵션 2: 고객 이미지 전용 이동 API 사용

**수정 내용**:
- 갤러리에서 고객 이미지를 이동할 때 `move-customer-image-file.ts` API 사용
- 또는 `move-image-to-folder.js`에서 고객 이미지 감지 시 별도 로직 실행

**장점**:
- 고객 이미지 특화 로직
- 더 정확한 처리

**단점**:
- 갤러리 코드 수정 필요
- 두 가지 API 관리 필요

## 권장 방안: 옵션 1 (move-image-to-folder.js API 개선)

### 구현 계획

#### Phase 1: 메타데이터 업데이트 개선
**파일**: `pages/api/admin/move-image-to-folder.js`

**수정 내용**:
1. `file_path` 업데이트 추가
2. `cdn_url` 업데이트 추가
3. 고객 이미지 감지 (`file_path`에 `customers/` 포함 여부 확인)
4. `ai_tags`의 `visit-{oldDate}` 태그 제거 및 `visit-{newDate}` 태그 추가
5. `file_path`에서 날짜 추출하여 태그 생성

#### Phase 2: 에러 처리 개선
**파일**: `pages/api/admin/move-image-to-folder.js`

**수정 내용**:
1. 메타데이터 조회 실패 시 상세한 에러 메시지
2. 업데이트 실패 시 롤백 로직 (선택사항)

### 수정 코드 예시

```javascript
// move-image-to-folder.js 수정
if (metadata && !metadataError) {
  // file_path에서 날짜 추출
  const oldDateMatch = currentPath.match(/(\d{4}-\d{2}-\d{2})/);
  const newDateMatch = targetPath.match(/(\d{4}-\d{2}-\d{2})/);
  const oldDate = oldDateMatch ? oldDateMatch[1] : null;
  const newDate = newDateMatch ? newDateMatch[1] : null;
  
  // 고객 이미지인지 확인
  const isCustomerImage = currentPath.includes('/customers/') || targetPath.includes('/customers/');
  
  // ai_tags 업데이트 (고객 이미지인 경우)
  let updatedTags = metadata.ai_tags || [];
  if (isCustomerImage && oldDate && newDate && oldDate !== newDate) {
    // visit-{oldDate} 태그 제거
    updatedTags = updatedTags.filter(tag => tag !== `visit-${oldDate}`);
    // visit-{newDate} 태그 추가 (없으면)
    if (!updatedTags.includes(`visit-${newDate}`)) {
      updatedTags.push(`visit-${newDate}`);
    }
  }
  
  // 메타데이터 업데이트
  const updateData = {
    file_path: targetPath, // ⚠️ 추가: file_path 업데이트
    cdn_url: newUrlData.publicUrl, // ⚠️ 추가: cdn_url 업데이트
    image_url: newUrlData.publicUrl, // 기존
    original_path: targetPath, // 기존
    ai_tags: updatedTags, // ⚠️ 추가: ai_tags 업데이트
    updated_at: new Date().toISOString()
  };
  
  const { error: updateError } = await supabase
    .from('image_assets')
    .update(updateData)
    .eq('id', metadata.id);
  
  if (updateError) {
    console.warn('⚠️ 메타데이터 업데이트 실패:', updateError);
  } else {
    console.log('✅ 메타데이터 업데이트 완료:', {
      imageId: metadata.id,
      oldDate,
      newDate,
      tagsUpdated: isCustomerImage && oldDate && newDate
    });
  }
}
```

## 예상 작업 시간

- 코드 수정: 1시간
- 테스트: 1시간
- **총 예상 시간: 2시간**

## 테스트 계획

1. **파일 이동 테스트**:
   - 갤러리에서 고객 이미지를 날짜 폴더 간 이동
   - 메타데이터가 정상적으로 업데이트되는지 확인
   - `file_path`, `cdn_url`, `ai_tags` 모두 확인

2. **고객 관리 표시 테스트**:
   - 이동 후 고객 관리에서 이미지가 정상 표시되는지 확인
   - 날짜 필터가 올바르게 작동하는지 확인
   - "이미지 로드 실패"가 나타나지 않는지 확인

3. **에러 처리 테스트**:
   - 메타데이터가 없는 파일 이동
   - 잘못된 경로로 이동
   - 네트워크 오류 시나리오
