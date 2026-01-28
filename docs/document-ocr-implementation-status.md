# 문서 OCR 구현 현황

## 📋 현재 상태

### ✅ 완료된 작업

1. **Google Vision API 설정**
   - ✅ Google Cloud Platform 계정 생성
   - ✅ Cloud Vision API 활성화
   - ✅ API 키 생성 및 환경 변수 설정
   - ✅ 로컬: `.env.local`에 `GOOGLE_VISION_API_KEY` 추가
   - ✅ Vercel: 환경 변수 추가 (재배포 필요)

2. **문서 이미지 업로드**
   - ✅ 문서 이미지 업로드 가능
   - ✅ 메타데이터 생성 (골프 AI / 일반 메타)
   - ✅ 문서 자동 감지 로직 (파일명/내용 기반)

### ⏳ 아직 구현되지 않은 작업

1. **OCR 기능**
   - ❌ OCR API 엔드포인트 미구현
   - ❌ UI에 "OCR (구글 비전)" 라디오 버튼 미추가
   - ❌ OCR 결과를 메타데이터에 저장하는 로직 미구현

2. **UI 개선**
   - ❌ 문서 감지 시 OCR 옵션 자동 표시
   - ❌ OCR 결과 미리보기 기능

## 🚀 구현 필요 작업

### Phase 1: OCR API 엔드포인트 생성

**파일**: `pages/api/admin/extract-document-text.ts` (신규 생성)

**기능:**
- Google Vision API DOCUMENT_TEXT_DETECTION 호출
- 추출된 텍스트 반환
- 에러 처리 및 로깅

### Phase 2: UI 개선 (라디오 버튼 추가)

**파일**: `components/admin/CustomerImageUploadModal.tsx`

**변경 사항:**
1. `metadataType` 타입 확장: `'golf-ai' | 'general' | 'ocr'`
2. 문서 감지 시 OCR 옵션 표시
3. OCR 선택 시 안내 메시지

### Phase 3: 메타데이터 생성 API 수정

**파일**: `pages/api/admin/create-customer-image-metadata.ts`

**변경 사항:**
1. `metadataType === 'ocr'`인 경우 OCR API 호출
2. OCR 결과를 메타데이터에 포함
3. 추출된 텍스트를 `description` 또는 별도 필드에 저장

### Phase 4: 데이터베이스 스키마 확장 (선택사항)

**테이블**: `image_assets`

**추가 필드:**
- `ocr_text` (TEXT): 추출된 텍스트 전체
- `ocr_extracted` (BOOLEAN): OCR 사용 여부
- `ocr_confidence` (FLOAT): OCR 신뢰도

## 📝 현재 동작 방식

### 문서 업로드 시 현재 동작

1. **이미지 업로드**: ✅ 가능
2. **문서 감지**: ✅ 자동 감지 (파일명/내용 기반)
3. **메타데이터 생성**: 
   - "골프 AI 생성": OpenAI Vision API 사용 (이미지 내용 분석)
   - "일반 메타 생성": OpenAI Vision API 사용 (범용 분석)
4. **OCR 텍스트 추출**: ❌ 아직 구현되지 않음

### OCR 기능이 필요한 경우

현재는 문서 이미지를 업로드해도:
- ✅ 이미지로 저장됨
- ✅ 메타데이터 생성됨 (이미지 내용 기반)
- ❌ **문서 내 텍스트는 추출되지 않음**

OCR 기능을 사용하려면:
- ⏳ Phase 1-3 구현 필요
- ⏳ UI에 OCR 옵션 추가 필요

## 🎯 다음 단계

1. **OCR API 엔드포인트 구현** (우선순위: 높음)
2. **UI에 OCR 옵션 추가** (우선순위: 높음)
3. **메타데이터 생성 API 수정** (우선순위: 높음)
4. **데이터베이스 스키마 확장** (우선순위: 중간)

## 💡 임시 해결책

현재 문서 업로드는 가능하지만, OCR 기능 없이:
- 이미지로 저장
- OpenAI Vision API로 이미지 내용 분석
- 텍스트 추출은 불가능

OCR이 필요한 경우, 구현 완료 후 다시 업로드하거나 OCR API를 별도로 호출해야 합니다.
