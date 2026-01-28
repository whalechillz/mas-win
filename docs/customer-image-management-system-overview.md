# 고객 이미지 관리 시스템 개요

## 현재 사용 기술 스택

### 프론트엔드
- **Next.js** (React 기반)
- **컴포넌트 위치**: `pages/admin/customers/index.tsx`
  - `CustomerImageModal`: 고객 이미지 업로드 및 관리 UI
  - `CustomerImageUploadModal`: 업로드 전 설정 모달

### 백엔드 API
1. **`/api/admin/create-customer-image-metadata`**
   - 고객 이미지 업로드 시 메타데이터 생성
   - 임시 파일을 Supabase Storage에 업로드
   - 이미지 타입 자동 감지 (`detectCustomerImageType`)
   - OpenAI Vision API를 통한 이미지 분석

2. **`/api/admin/move-customer-image-file`**
   - 임시 파일을 최종 경로로 이동
   - `image_assets` 테이블 메타데이터 업데이트

3. **`/api/analyze-image-prompt`** (골프 특화)
   - OpenAI Vision API (gpt-4o-mini) 사용
   - 골프 관련 이미지 메타데이터 생성

4. **`/api/analyze-image-general`** (일반)
   - OpenAI Vision API (gpt-4o-mini) 사용
   - 일반 이미지 메타데이터 생성

### 데이터베이스 및 스토리지
- **Supabase PostgreSQL**
  - `image_assets` 테이블: 이미지 메타데이터 저장
  - `customers` 테이블: 고객 정보
- **Supabase Storage**
  - 버킷: `blog-images`
  - 경로 구조: `customers/{customerId}/{YYYY-MM-DD}/{filename}`

### AI 이미지 분석
- **OpenAI Vision API** (gpt-4o-mini)
  - 이미지 내용 분석
  - 메타데이터 생성 (ALT 텍스트, 제목, 설명, 키워드)
  - 이미지 타입 자동 감지

### 이미지 타입 감지 로직
**파일 위치**: `lib/customer-image-type-detector.ts`

**감지 단계**:
1. **파일명 기반 감지** (신뢰도 >= 0.9이면 즉시 반환)
2. **AI 이미지 내용 분석** (OpenAI Vision API)
3. **스토리 기반 장면 감지** (`detectStorySceneFromImage`)
   - 문서 감지 최우선 처리
   - 시각적 특징 감지 (흰색 배경 + 텍스트)
   - 문서 구조 키워드 감지
4. **기존 AI 분석 결과** (신뢰도 >= 0.8)
5. **파일명 기반 감지** (신뢰도 >= 0.7, S3 제외)

**문서 감지 키워드**:
- 문서 키워드: "문서", "주문서", "설문", "동의서", "양식", "표", "서류", "scan", "document", "form", "사양서", "specification", "피팅", "fitting", "vip", "클럽", "분석", "고객기본정보", "고객신체정보", "정적", "점검" 등
- 시각적 특징: "흰색 배경", "white background", "텍스트", "text", "글자", "양식", "표", "체크박스", "입력란", "라인", "구분선" 등
- 문서 구조: "제목", "항목", "섹션", "날짜", "이름", "주소", "정보", "기본정보", "체크", "선택" 등

### 파일 업로드 처리
- **`formidable`**: `multipart/form-data` 파싱
- **`lib/filename-sanitizer.ts`**: 한글 파일명 sanitization (Supabase Storage 호환)

## 이미지 업로드 플로우

1. **프론트엔드** (`CustomerImageModal`)
   - 사용자가 파일 선택
   - `CustomerImageUploadModal`에서 메타데이터 타입 선택 (golf-ai / general)
   - `handleUploadWithMetadata` 호출

2. **메타데이터 생성 API** (`/api/admin/create-customer-image-metadata`)
   - 임시 파일을 Supabase Storage에 업로드 (`temp/customers/{customerId}/`)
   - OpenAI Vision API로 빠른 분석 (ALT 텍스트, 설명 추출)
   - `detectCustomerImageType` 호출하여 이미지 타입 감지
   - OpenAI Vision API로 전체 메타데이터 생성
   - `image_assets` 테이블에 메타데이터 저장 (임시 경로)

3. **파일 이동 API** (`/api/admin/move-customer-image-file`)
   - 최종 파일명 생성 (중복 확인 및 순번 조정)
   - 임시 파일을 최종 경로로 이동 (`customers/{customerId}/{YYYY-MM-DD}/`)
   - `image_assets` 테이블 메타데이터 업데이트 (경로, 파일명, cdn_url)

## 문서 분류 문제 및 개선 사항

### 문제점
- 문서 이미지가 골프 사진으로 잘못 분류되는 경우 발생
- 예: "고객 기본정보", "피팅 데이터", "Check-point"가 포함된 문서가 `type:happy`, `scene:1`로 분류됨

### 개선 사항 (2026-01-28)
1. **문서 감지 로직 강화**
   - 시각적 특징만 있어도 문서로 감지 (흰색 배경 + 텍스트)
   - "고객", "정보", "데이터", "check", "point" 키워드 추가 감지
   - 신뢰도 조정 (시각적 특징만 있어도 0.90)

2. **OpenAI Vision API 프롬프트 개선**
   - 문서 감지 우선순위 명시
   - "고객 기본정보", "피팅 데이터", "Check-point" 같은 패턴 인식 지시
   - 문서 이미지인 경우 골프 키워드 사용 금지

## 관련 파일

- `pages/admin/customers/index.tsx`: 고객 이미지 관리 UI
- `components/admin/CustomerImageUploadModal.tsx`: 업로드 전 설정 모달
- `pages/api/admin/create-customer-image-metadata.ts`: 메타데이터 생성 API
- `pages/api/admin/move-customer-image-file.ts`: 파일 이동 API
- `lib/customer-image-type-detector.ts`: 이미지 타입 감지 로직
- `lib/filename-sanitizer.ts`: 파일명 sanitization
- `pages/api/analyze-image-prompt.js`: 골프 특화 이미지 분석 API
- `pages/api/analyze-image-general.js`: 일반 이미지 분석 API
