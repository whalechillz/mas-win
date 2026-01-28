# 한글 파일명 업로드 실패 문제 수정 계획

## 문제 분석

### 1. 한글 파일명 문제 ✅ 확인됨

**에러 메시지:**
```
임시 파일 업로드 실패: Invalid key: temp/customers/2109/temp_1769596874480_스크린샷 2026-01-28 오후 7.40.23.png
```

**원인:**
- Supabase Storage의 `key`는 URL-safe하지 않은 문자를 포함할 수 없음
- 한글 문자, 공백, 특수문자(`.`, `:`)가 포함된 파일명이 그대로 사용됨
- `tempFileName = temp_${Date.now()}_${file.originalFilename}`에서 원본 파일명이 그대로 포함됨

**영향:**
- 한글이 포함된 파일명으로 업로드 시도 시 "Invalid key" 에러 발생
- 업로드 프로세스가 1단계(임시 저장)에서 실패하여 2단계(최종 경로 이동)로 진행되지 않음

### 2. temp 폴더 경로 문제 ✅ 확인됨

**현재 프로세스:**
1. **1단계 (임시 저장)**: `temp/customers/{customerId}/temp_{timestamp}_{원본파일명}`에 저장
2. **2단계 (최종 이동)**: `move-customer-image-file.ts`에서 최종 경로(`originals/customers/{고객명}/{날짜}/`)로 이동

**문제:**
- 1단계에서 실패하면 2단계로 진행되지 않음
- 사용자는 "temp 폴더에 저장되는 이유"를 물어봄
- 실제로는 임시 저장 단계에서 실패하여 최종 경로로 이동하지 못함

## 수정 계획

### 1. 파일명 Sanitization 함수 추가

**위치:** `lib/filename-sanitizer.ts` (새 파일 생성)

**기능:**
- 한글 문자를 영문으로 변환 또는 제거
- 공백, 특수문자를 하이픈(`-`)으로 변환
- URL-safe한 파일명 생성
- 파일 확장자 보존

**구현 예시:**
```typescript
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return `image-${Date.now()}`;
  
  // 확장자 분리
  const lastDotIndex = fileName.lastIndexOf('.');
  const extension = lastDotIndex > -1 ? fileName.substring(lastDotIndex) : '';
  const nameWithoutExt = lastDotIndex > -1 ? fileName.substring(0, lastDotIndex) : fileName;
  
  // 한글 제거 또는 영문 변환
  let sanitizedName = nameWithoutExt
    .replace(/[가-힣]/g, '') // 한글 제거
    .replace(/[^a-zA-Z0-9-_]/g, '-') // 특수문자를 하이픈으로
    .replace(/-+/g, '-') // 연속된 하이픈을 하나로
    .replace(/^-|-$/g, '') // 앞뒤 하이픈 제거
    .toLowerCase();
  
  // 빈 문자열이면 타임스탬프 사용
  if (!sanitizedName) {
    sanitizedName = `image-${Date.now()}`;
  }
  
  return `${sanitizedName}${extension}`;
}
```

### 2. 임시 파일명 생성 시 Sanitization 적용

**수정 파일:** `pages/api/admin/create-customer-image-metadata.ts`

**수정 위치:** 82줄

**수정 전:**
```typescript
const tempFileName = `temp_${Date.now()}_${file.originalFilename || file.newFilename}`;
```

**수정 후:**
```typescript
import { sanitizeFileName } from '../../../lib/filename-sanitizer';

// 원본 파일명 sanitization
const originalFileName = file.originalFilename || file.newFilename;
const sanitizedOriginalName = sanitizeFileName(originalFileName);
const tempFileName = `temp_${Date.now()}_${sanitizedOriginalName}`;
```

### 3. 최종 파일명 생성 시에도 Sanitization 적용

**수정 파일:** `pages/api/admin/move-customer-image-file.ts`

**확인 사항:**
- 최종 파일명 생성 시 한글 제거 확인
- `generateFinalCustomerImageFileName` 함수가 이미 sanitization을 수행하는지 확인

### 4. 에러 메시지 개선

**수정 파일:** `pages/api/admin/create-customer-image-metadata.ts`

**수정 내용:**
- 한글 파일명 감지 시 사용자에게 친화적인 에러 메시지 제공
- 자동으로 sanitization 적용 후 재시도 로직 추가

## 구현 단계

1. ✅ 파일명 Sanitization 함수 생성
2. ✅ 임시 파일명 생성 시 sanitization 적용
3. ✅ 최종 파일명 생성 로직 확인 및 개선
4. ✅ 에러 처리 개선
5. ✅ 테스트 및 배포

## 예상 결과

**수정 전:**
- 파일명: `스크린샷 2026-01-28 오후 7.40.23.png`
- temp 파일명: `temp_1769596874480_스크린샷 2026-01-28 오후 7.40.23.png`
- 결과: ❌ "Invalid key" 에러

**수정 후:**
- 파일명: `스크린샷 2026-01-28 오후 7.40.23.png`
- temp 파일명: `temp_1769596874480_screenshot-2026-01-28-pm-7-40-23.png`
- 결과: ✅ 정상 업로드 → 최종 경로로 이동

## 추가 고려사항

1. **기존 파일명 보존 옵션**: 사용자가 원본 파일명을 보존하고 싶은 경우를 위한 옵션 (현재는 자동 변환)
2. **한글-영문 매핑**: 자주 사용되는 한글 단어를 영문으로 매핑 (예: "스크린샷" → "screenshot")
3. **파일명 길이 제한**: Supabase Storage key 길이 제한 확인 및 처리
