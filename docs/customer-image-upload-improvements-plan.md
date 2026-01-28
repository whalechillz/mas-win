# 고객 이미지 업로드 개선 계획

## 요구사항

### 1. 중복 이미지 처리 개선
- **현재**: 중복 이미지가 있으면 타임스탬프를 추가하거나 사용자에게 확인 요청
- **요구사항**: 중복 이미지라고 하더라도 맨 뒤에 `01`, `02`, `03` 형식으로 자동 업로드
- **목적**: 같은 파일을 여러 번 업로드할 수 있도록 허용

### 2. 스캔 문서 파일명 변경
- **현재**: `ahnhuija_s1_seukaen-20260126-2_01.webp`
- **변경**: `ahnhuija_s0_docs-20260126-2_01.webp`
- **규칙**: `s1_seukaen` → `s0_docs`로 변경
- **목적**: 스캔 문서를 더 명확하게 구분

## 구현 계획

### Phase 1: 중복 이미지 처리 개선

**파일**: `lib/image-upload-utils.ts`

**수정 내용**:

1. **`generateUniqueFileName` 함수 수정**
   - 중복 파일명 감지 시 자동으로 `01`, `02`, `03` 형식으로 번호 추가
   - 사용자 확인 없이 자동 처리
   - 타임스탬프 추가 옵션 제거 (번호 추가만 사용)

2. **`uploadLargeFileDirectlyToSupabase` 함수 수정**
   - "already exists" 오류 발생 시 자동으로 `01`, `02`, `03` 형식으로 번호 추가
   - 사용자 확인 없이 자동 처리
   - 최대 99까지 번호 추가 가능

**구현 예시**:
```typescript
// 중복 파일명 감지 시
const ext = fileName.match(/\.[^/.]+$/)?.[0] || '';
const baseName = fileName.replace(/\.[^/.]+$/, '').replace(/_\d{2}$/, ''); // 기존 번호 제거
let counter = 1;
let newFileName = `${baseName}_${String(counter).padStart(2, '0')}${ext}`;

// 파일이 존재하는지 확인하고, 존재하면 번호 증가
while (counter < 100) {
  // 파일 존재 확인
  if (!fileExists(newFileName)) {
    break; // 사용 가능한 파일명 찾음
  }
  counter++;
  newFileName = `${baseName}_${String(counter).padStart(2, '0')}${ext}`;
}
```

### Phase 2: 스캔 문서 파일명 변경

**파일**: `lib/customer-image-filename-generator.ts`

**수정 내용**:

1. **파일명 패턴 변경**
   - 기존: `{고객명}_s{장면번호}_seukaen-{날짜}-{번호}_{순번}.webp`
   - 변경: `{고객명}_s0_docs-{날짜}-{번호}_{순번}.webp`
   - `s1_seukaen` → `s0_docs`로 변경
   - 장면 번호는 항상 `0` (문서는 장면에 할당되지 않음)

2. **문서 감지 로직 수정**
   - `detectScannedDocument` 함수에서 `seukaen` 키워드 감지
   - 파일명 생성 시 `s0_docs` 형식 사용

3. **기존 파일명 처리**
   - 기존 `s1_seukaen` 패턴도 인식하여 `s0_docs`로 변환
   - 하위 호환성 유지

**구현 예시**:
```typescript
// 스캔 문서 파일명 생성
if (isScannedDocument) {
  // s0_docs 형식 사용
  const docFileName = `${customerNameEn}_s0_docs-${dateStr}-${number}_${sequence}.webp`;
  return {
    fileName: docFileName,
    scene: 0, // 문서는 장면 0
    type: 'scanned-document'
  };
}
```

### Phase 3: 기존 스캔 문서 파일명 마이그레이션 (선택적)

**파일**: `scripts/migrate-scanned-document-filenames.js` (신규)

**기능**:
- 기존 `s1_seukaen` 패턴의 파일명을 `s0_docs`로 변경
- Supabase Storage에서 파일명 변경
- `image_assets` 테이블의 `file_path` 및 `cdn_url` 업데이트

**주의사항**:
- 파일명 변경은 Storage에서 실제 파일을 이동/복사해야 함
- 기존 URL이 변경되므로 외부 참조가 있는 경우 문제 발생 가능
- 신중하게 진행 필요

## 파일 구조

### 수정할 파일

1. **`lib/image-upload-utils.ts`**
   - `generateUniqueFileName` 함수 수정
   - `uploadLargeFileDirectlyToSupabase` 함수 수정
   - 중복 파일명 처리 로직 개선

2. **`lib/customer-image-filename-generator.ts`**
   - 스캔 문서 파일명 생성 로직 수정
   - `s1_seukaen` → `s0_docs` 변경
   - 문서 감지 및 파일명 생성 로직 통합

3. **`lib/scanned-document-detector.ts`** (선택적)
   - `s0_docs` 패턴도 인식하도록 수정
   - 기존 `seukaen` 패턴과 새 `s0_docs` 패턴 모두 지원

### 신규 파일 (선택적)

1. **`scripts/migrate-scanned-document-filenames.js`**
   - 기존 스캔 문서 파일명 마이그레이션 스크립트

## 구현 완료

### Phase 1: 중복 이미지 처리 개선 ✅
- `generateUniqueFileName` 함수 수정 완료
- `uploadLargeFileDirectlyToSupabase` 함수 수정 완료
- 중복 파일명 감지 시 자동으로 `_01`, `_02`, `_03` 형식으로 번호 추가
- 사용자 확인 없이 자동 처리

### Phase 2: 스캔 문서 파일명 변경 ✅
- `generateCustomerImageFileName` 함수 수정 완료
- `detectScannedDocument` 함수 수정 완료 (`s0_docs` 패턴 인식 추가)
- 스캔 문서 감지 시 `s0_docs` 형식으로 파일명 생성
- 기존 파일명에서 날짜와 번호 추출하여 유지

## 예상 작업 시간

- Phase 1 (중복 이미지 처리 개선): ✅ 완료
- Phase 2 (스캔 문서 파일명 변경): ✅ 완료
- Phase 3 (기존 파일명 마이그레이션): 2-3시간 (선택적)
- 테스트 및 디버깅: 1-2시간
- **총 예상 시간: 3-5시간** (Phase 3 제외 시 완료)

## 우선순위

**높음**: 사용자가 직접 요청한 기능으로 즉시 구현 필요

## 테스트 계획

### Phase 1 테스트

1. **중복 이미지 업로드 테스트**
   - 같은 파일을 여러 번 업로드
   - 파일명이 `_01`, `_02`, `_03` 형식으로 자동 추가되는지 확인
   - 사용자 확인 없이 자동 처리되는지 확인

2. **다양한 파일명 형식 테스트**
   - 기존 번호가 있는 파일명 (`file_01.webp`)
   - 번호가 없는 파일명 (`file.webp`)
   - 확장자가 다른 파일명 (`file.jpg`, `file.png`)

### Phase 2 테스트

1. **스캔 문서 파일명 생성 테스트**
   - 스캔 문서 업로드 시 `s0_docs` 형식으로 생성되는지 확인
   - 기존 `seukaen` 패턴도 인식하는지 확인
   - 다른 파일명 형식과 충돌하지 않는지 확인

2. **문서 감지 테스트**
   - `s0_docs` 패턴으로 생성된 파일이 문서로 인식되는지 확인
   - 기존 `seukaen` 패턴도 계속 인식되는지 확인

## 주의사항

1. **하위 호환성**
   - 기존 `seukaen` 패턴도 계속 인식해야 함
   - 기존 파일명을 사용하는 코드가 있을 수 있음

2. **파일명 변경의 영향**
   - Storage에서 파일명 변경 시 기존 URL이 무효화됨
   - 외부 참조가 있는 경우 문제 발생 가능
   - 마이그레이션은 신중하게 진행

3. **중복 파일 처리**
   - 같은 파일을 여러 번 업로드하는 것이 의도된 동작인지 확인 필요
   - 저장 공간 사용량 증가 가능
