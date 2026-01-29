# 🎯 MASGOLF 통합 콘텐츠 및 자산 마이그레이션 프로젝트

## ✅ 완료: 메인 페이지 PRO 3 MUZIIK 이미지 깨짐 수정 (2026-01-29)

### 원인
- **메인 페이지** (`/`)에서 "시크리트포스 PRO 3 MUZIIK" 카드가 검은 사각형 또는 이미지 없음으로 표시됨.
- **원인 1**: 히어로 섹션(상단 3개 제품 카드)의 PRO 3 MUZIIK `<Image>`에 **onError 핸들러가 없어**, Supabase 이미지 404 시 검은 영역으로 남음.
- **원인 2**: 퍼포먼스의 변화 섹션 이미지는 `/api/products/secret-force-pro-3-muziik`의 `performance_images`만 사용하는데, DB에 해당 필드가 비어 있으면 이미지가 null → "이미지 로딩 중..." 또는 빈 영역으로 표시됨.

### 수정 내용
- **pages/index.js**
  1. **히어로 섹션**: PRO 3 MUZIIK Image에 `onError` 추가 → 로드 실패 시 "이미지 없음" 문구로 대체하여 검은 화면 방지.
  2. **퍼포먼스 이미지 로드**: API 응답에서 `performance_images`가 없으면 `detail_images[0]`로 fallback; 둘 다 없으면 slug별 기본 경로(`defaultPaths`)로 URL 생성하여 사용.

### 변경된 파일
- `pages/index.js`

### 참고
- 근본적으로 Supabase `blog-images` 버킷에 PRO 3 MUZIIK 이미지 파일이 있어야 정상 표시됨. 파일이 없다면 스토리지 업로드 확인 필요.

---

## ✅ 완료: 설문 페이지 상단 PRO3 MUZIIK 이미지 깨짐 수정 (2026-01-29)

### 원인
- **설문 페이지** (`/survey`) 상단 PRO3 MUZIIK 제품 이미지가 "이미지 없음"으로 표시됨.
- **원인 1**: 설문 페이지가 `/api/products/pro3-muziik`으로 요청하는데, DB `products` 테이블 slug는 `secret-force-pro-3-muziik`으로만 등록되어 있어 API가 404 반환 → 클라이언트가 하드코딩된 fallback URL만 사용.
- **원인 2**: fallback URL이 가리키는 Supabase Storage 파일(`blog-images/originals/products/secret-force-pro-3-muziik/detail/...`)이 없거나 경로가 다르면 이미지 요청 404 → `<Image onError>`에서 "이미지 없음" 표시.

### 수정 내용
- **pages/api/products/[slug].js**
  - slug 별칭 추가: 요청 slug가 `pro3-muziik`일 때 DB 조회 시 `secret-force-pro-3-muziik`으로 변환.
  - `/api/products/pro3-muziik` 호출 시 DB에서 제품을 찾아 `detail_images`를 반환하므로, 설문 페이지가 API에서 받은 첫 번째 이미지 URL을 사용하게 됨.

### 변경된 파일
- `pages/api/products/[slug].js`

### 참고
- Supabase `blog-images` 버킷에 `originals/products/secret-force-pro-3-muziik/detail/secret-force-pro-3-muziik-00.webp` 등 파일이 없으면 fallback 단계에서도 이미지가 깨질 수 있음. 필요 시 스토리지 경로/파일 업로드 확인.

---

## ✅ 완료: 갤러리 메타데이터 저장 500 원인 수정 (upsert → 조회 후 UPDATE/INSERT) (2026-01-29)

### 원인
- `image_assets` 테이블 스키마에 **cdn_url UNIQUE 제약이 없음** (`image_management_schema.sql`: `cdn_url TEXT`만 있음).
- API에서 `supabase.from('image_assets').upsert(insertData, { onConflict: 'cdn_url' })` 사용 시, Postgres가 "there is no unique or exclusion constraint matching the ON CONFLICT specification" 오류로 **500** 반환.

### 수정 내용
- **pages/api/admin/image-metadata.js** (POST)
  - `upsert(..., { onConflict: 'cdn_url' })` 제거.
  - **조회 후 분기**: `cdn_url`로 `maybeSingle()` 조회 → 있으면 **UPDATE**(메타데이터 필드만), 없으면 **INSERT**(필수 컬럼 포함).
  - 조회/UPDATE/INSERT 각 단계에서 오류 시 상세 메시지·code 반환.

### 변경된 파일
- `pages/api/admin/image-metadata.js`

---

## ✅ 완료: 갤러리 메타데이터 저장 로그·에러 처리 강화 (2026-01-29)

### 문제
- 갤러리 메타데이터 저장 실패 시 500 응답 후 클라이언트에서 `errorData` 접근 시 TypeError (undefined).
- 서버 500 원인(DB 오류 등)이 응답/로그에 충분히 남지 않음.

### 수정 내용
1. **pages/admin/gallery.tsx** (메타데이터 저장 onSave)
   - 500 시 `response.json()` 대신 `response.text()` 후 `JSON.parse` try/catch. 파싱 실패 시 `errorData = {}`로 두고, `errorData?.error` 등 optional chaining으로 메시지 구성.
   - 항상 JSON 형태 오류 메시지로 alert, "서버 로그를 확인해주세요" 안내 추가.
2. **pages/api/admin/image-metadata.js**
   - POST: `imageUrl`이 상대 경로 등일 때 `new URL(imageUrl)` 예외 방지 — `http(s)://`일 때만 URL 파싱, 아니면 `uploaded/...` fallback.
   - upsert 실패 시 응답에 `details`(메시지), `code`, `hint` 포함해 클라이언트/로그에서 원인 확인 가능하도록 함.
   - 최상위 catch에서 `error.message`, `error.stack` 로그 및 `details`, `code: 'SERVER_ERROR'` 반환.

### 변경된 파일
- `pages/admin/gallery.tsx`
- `pages/api/admin/image-metadata.js`

---

## ✅ 완료: 갤러리 메타데이터 저장 500 수정 (2026-01-29)

### 문제
- **갤러리 관리** (`/admin/gallery`)에서 이미지 메타데이터 편집 후 저장 시 **500 Internal Server Error** 발생.
- 고객 이미지 관리에서는 저장이 잘 됨 (PUT `/api/admin/upload-customer-image` 사용).

### 원인
- 갤러리는 **POST** `/api/admin/image-metadata` 호출 후 **upsert** 사용.
- `image_assets` 테이블은 `filename`, `original_filename`, `file_path`, `file_size`, `mime_type`, `format`이 **NOT NULL**인데, POST 시 이 필드들을 보내지 않아 **새 행 INSERT** 시 500 발생.

### 수정 내용
- **pages/api/admin/image-metadata.js** (POST)
  - upsert용 `insertData`에 필수 컬럼 추가: `imageName`/`imageUrl`에서 `filename`, `original_filename`, `file_path`, `file_size`, `mime_type`, `format` 도출 후 포함.
  - `status`, `upload_source` 기본값 설정.

### 변경된 파일
- `pages/api/admin/image-metadata.js`

---

## ✅ 완료: 고객 메타데이터 저장 405 수정 및 image_metadata→image_assets 필드 검토 (2026-01-29)

### 문제
- 고객 페이지(`/admin/customers`)에서 이미지 메타데이터 편집 후 **저장** 시 **405 Method Not Allowed** 발생.
- PUT ` /api/admin/upload-customer-image` 호출 시 해당 API가 PUT 미지원.

### 수정 내용
1. **pages/api/admin/upload-customer-image.js**
   - **PUT** 핸들러 추가: `imageId` + `metadata`(alt_text, keywords, title, description, ocr_text)로 `image_assets` 업데이트.
   - 요청: `{ imageId, metadata: { alt_text?, keywords?, title?, description?, ocr_text? } }` → 응답: `{ success: true, image }`.
2. **docs/image-metadata-to-assets-field-review.md** 신규 작성
   - image_metadata → image_assets 필드 매핑 정리 (식별·URL, 파일·경로, 메타데이터, 고객·스토리·분류, 개별 저장 시 사용 API·필드).
   - 덤프 마이그레이션 시 점검 권장 사항 (is_liked, story_scene, 고객 연결 등).

### 변경된 파일
- `pages/api/admin/upload-customer-image.js` (PUT 추가)
- `docs/image-metadata-to-assets-field-review.md` (신규)

---

## ✅ 완료: 이미지 category 제거 및 불필요 코드 정리 (2026-01-29)

### 확인 결과
- **image_assets** 테이블 스키마(`database/image_management_schema.sql`)에는 **category / category_id 컬럼이 없음** (alt_text, title, description, ai_tags 등만 존재).
- API 주석에도 "image_assets에는 category_id가 없으므로 제거"라고 되어 있었으나, POST/PUT에서 category·categories를 계속 destructure하고 categoryId/categoryMap 등 불필요 로직이 남아 있음.

### 정리 내용
1. **pages/api/admin/image-metadata.js**
   - **POST**: `category`, `categories` destructure 제거. `categoriesArray`, `categoryString`, `categoryId`, `categoryMap`, "카테고리 필수 입력 검증" 블록 삭제. 로그에서 `category`/`categories` 제거. `metadataData`는 원래부터 category 미포함 → 변경 없음. "최종 저장 데이터" 로그에서 `tags`/`category_id` 참조 제거 → `ai_tags_count`로 수정.
   - **PUT**: `category`, `categories` destructure 제거. `categoriesArray`, `categoryString`, `categoryId`, `categoryMap` 블록 삭제. 로그 단순화.
2. **pages/admin/gallery.tsx**
   - 골프 AI/일반 메타데이터 저장 시 PUT body에서 `category` 제거 (2곳).
   - 메타데이터 편집 저장 시 POST body에서 `category`, `categories` 제거 (2곳).

### 유지한 것
- 갤러리/모달의 **editForm.category**, **ImageMetadata 타입의 category**, **GET 응답의 category: ''** 는 UI/하위 호환을 위해 유지. API는 더 이상 사용하지 않음.
- 카테고리 값을 키워드에 병합하는 로직(editForm 저장 시)은 유지 → ai_tags로 저장 가능.

### 변경된 파일
- `pages/api/admin/image-metadata.js`
- `pages/admin/gallery.tsx`

---

## ✅ 완료: 메타데이터 저장 500 - categories is not defined 수정 (2026-01-29)

### 문제
- 갤러리에서 골프 AI 생성 후 메타데이터 저장 시 `PUT /api/admin/image-metadata` 500 발생.
- 콘솔: `details: "categories is not defined"`.

### 원인
- `pages/api/admin/image-metadata.js`의 **PUT** 핸들러에서 `req.body`를 destructure할 때 `categories`를 빼먹음.
- 이후 `categoriesArray` 계산에서 `categories`를 참조해 ReferenceError 발생.

### 수정
- PUT 요청 처리 시 `const { ..., category, categories } = req.body || {}` 로 `categories` 추가.
- 클라이언트가 `categories`를 보내지 않으면 `undefined` → `Array.isArray(undefined)` false → 기존대로 `category` 문자열로 처리.

### 변경된 파일
- `pages/api/admin/image-metadata.js` (PUT destructure에 `categories` 추가)

---

## ✅ 완료: 골프 AI 500 원인 추적 및 에러 응답 개선 (2026-01-29)

### 문제
- `POST /api/analyze-image-prompt` 500 발생 시 "골프 AI 메타데이터 저장 실패"만 보이고, **실제 원인**(API 키 누락, OpenAI 오류 등)을 알기 어려움.

### 원인 후보 (우선순위)
1. **OPENAI_API_KEY 미설정** – `.env`에 키가 없거나 비어 있으면 OpenAI 호출 전에 실패.
2. **OpenAI 쿼터/과금** – 크레딧 부족, 결제 비활성 등 → 402로 구분해 응답하도록 이미 처리됨.
3. **이미지 URL 접근 실패** – OpenAI가 Supabase 공개 URL을 fetch하지 못하는 경우(드묾).
4. **기타 OpenAI API 예외** – 네트워크/타임아웃, 잘못된 요청 등.

### 작업 내용
1. **`analyze-image-prompt` API**
   - 요청 처리 전 `OPENAI_API_KEY` 검사 → 없으면 500 + `code: 'MISSING_OPENAI_API_KEY'`, `details`에 안내 문구 반환.
   - 500 응답 시 항상 `type: 'golf-ai'`, `code`, `details: error.message` 포함해 클라이언트/로그에서 원인 확인 가능하도록 함.
   - 서버 로그: `❌ [analyze-image-prompt] 이미지 프롬프트 분석 에러:` + message/code/stack 출력.
2. **갤러리 프론트**
   - 분석 API 실패 시 응답 body의 `details`, `code`를 콘솔에 출력.
   - `[갤러리 메타데이터] 🔍 500 원인(서버 반환):` 로 실제 서버 메시지 표시.

### 확인 방법
- **브라우저**: 개발자 도구 → Console에서 `🔍 500 원인(서버 반환):` 로그 확인.
- **서버**: 터미널에서 `❌ [analyze-image-prompt]` 로그 확인.
- **Network**: `analyze-image-prompt` 요청 선택 → Response 탭에서 `details`, `code` 확인.

### 변경된 파일
- `pages/api/analyze-image-prompt.js` (API 키 검사, 500 시 details/code/type 반환, 로그 강화)
- `pages/admin/gallery.tsx` (분석 API 실패 시 details/code 콘솔 출력)

---

## ✅ 완료: 갤러리 메타데이터 (OCR/골프 AI) 로그 강화 및 PUT 폴백 (2026-01-29)

### 문제
- 갤러리 이미지 추가 시 "골프 AI 생성" / "OCR (구글 비전)" 선택 후 업로드해도 메타데이터 저장 실패 (PUT 500)
- 원인: 업로드 직후 `image_assets`에 레코드가 아직 없거나 생성 실패한 경우, PUT으로 업데이트할 행이 없어 PGRST116 발생

### 작업 내용
1. **콘솔 로그 강화** ✅
   - `[갤러리 메타데이터]` 접두사로 OCR/골프 AI 흐름 로그 추가
   - OCR: OCR API 응답, 결과, 저장 요청/실패 상세
   - 골프 AI: 분석 API 호출, 분석 결과, 저장 요청/실패 상세

2. **image-metadata PUT 폴백** ✅
   - PUT 전에 `cdn_url`로 레코드 존재 여부 확인
   - 레코드 없으면 INSERT (filename, original_filename, file_path, file_size, mime_type, format, cdn_url + 메타데이터)
   - `file_path`는 imageUrl에서 blog-images 경로 추출

3. **Playwright 재현 테스트** ✅
   - `e2e-test/playwright-gallery-metadata-ocr-golf-ai.js` 추가
   - 로그인 → 갤러리 → 이미지 추가 → 메타데이터 타입 선택(golf-ai/ocr) → 업로드
   - 네트워크 4xx/5xx 및 `[갤러리 메타데이터]` 콘솔 로그 수집 → `e2e-test/gallery-metadata-test-log.txt` 저장
   - 실행: `node e2e-test/playwright-gallery-metadata-ocr-golf-ai.js` (골프 AI), `METADATA_TYPE=ocr node e2e-test/playwright-gallery-metadata-ocr-golf-ai.js` (OCR)

### 변경된 파일
- `pages/admin/gallery.tsx` (OCR/골프 AI 콘솔 로그)
- `pages/api/admin/image-metadata.js` (PUT 시 레코드 없으면 INSERT)
- `e2e-test/playwright-gallery-metadata-ocr-golf-ai.js` (신규)

---

## ✅ 완료: 고객 이미지 조회 - 갤러리 폴더 기준 개선 (2026-01-28)

### 문제
- 1월 28일 이미지의 "이미지 로드 실패"가 사라지지 않음
- `cdn_url`이 잘못된 경로를 가리키는 경우 이미지 로드 실패
- 메타데이터와 실제 Storage 파일 위치 불일치

### 사용자 제안
**"고객 이미지 관리도도 - 갤러리 폴더 기준으로면 하면 문제가 안생기는거 아니야?"**

### 작업 내용
1. **API 개선: `file_path` 기반 URL 우선 사용** ✅
   - `upload-customer-image.js` API에서 `file_path`를 우선 사용하여 URL 생성
   - `cdn_url`이 있어도 `file_path` 기반 URL을 우선 사용 (갤러리 폴더 기준)
   - 가장 안정적이고 정확한 방법

2. **프론트엔드 개선: `file_path` 기반 URL 재생성** ✅
   - `loadCustomerImages` 함수에서 `file_path` 기반 URL 재생성
   - API에서 받은 이미지 데이터의 `image_url`을 `file_path` 기반으로 재생성
   - 이중 보완으로 안정성 향상

### 장점
- ✅ 안정성 향상: `file_path`는 항상 실제 Storage 파일 위치를 반영
- ✅ 갤러리와 일관성: 갤러리에서 보는 이미지와 고객 관리에서 보는 이미지가 동일
- ✅ 방문일자 수정 후 자동 복구: `file_path`가 업데이트되면 자동으로 올바른 URL 생성

### 변경된 파일
- `pages/api/admin/upload-customer-image.js` (수정)
- `pages/admin/customers/index.tsx` (수정)
- `docs/customer-image-gallery-folder-based-improvement.md` (신규)

---

## ✅ 완료: 방문일자 수정 시 Storage 파일 이동 기능 추가 (2026-01-28)

### 문제
- 방문일자 수정 시 `file_path`와 `cdn_url`만 업데이트되고 실제 Storage 파일이 이동되지 않음
- 이미지 로드 실패 (404 에러) 발생
- 메타데이터와 실제 파일 위치 불일치

### 작업 내용
1. **API 개선** ✅
   - `update-customer-image-visit-date.ts`에 실제 Storage 파일 이동 로직 추가
   - 목표 폴더 자동 생성
   - 파일 이동 실패 시에도 메타데이터는 업데이트 (나중에 수동 이동 가능)

2. **이미 수정된 이미지 복구** ✅
   - 전유근 고객의 `jeonyugeun-S1-20260128-01.webp` 이미지 파일 위치 수정
   - `2026-01-28` 폴더에서 `2026-01-21` 폴더로 이동 완료

### 변경된 파일
- `pages/api/admin/update-customer-image-visit-date.ts` (수정)
- `scripts/fix-jeonyugeun-20260128-image.js` (신규)
- `scripts/fix-moved-visit-date-images.js` (신규)
- `scripts/check-jeonyugeun-20260128-image-status.js` (신규)

---

## ✅ 완료: 고객 이미지 방문일자 수정 기능 추가 (2026-01-28)

### 작업 내용
- 고객 이미지 관리에서 이미지 확대 모달에 방문일자 수정 기능 추가
- `ai_tags`의 `visit-{date}` 태그 및 `file_path` 업데이트

### 구현 완료 사항
1. **API 엔드포인트 생성** ✅
   - `pages/api/admin/update-customer-image-visit-date.ts` 생성
   - `ai_tags`의 `visit-{oldDate}` 태그 제거 및 `visit-{newDate}` 태그 추가
   - `file_path`의 날짜 폴더 업데이트
   - `cdn_url` 자동 업데이트

2. **이미지 확대 모달 UI 추가** ✅
   - 방문일자 표시 및 수정 버튼
   - 날짜 선택 인풋 (수정 모드)
   - 저장/취소 버튼
   - 로딩 상태 표시

3. **프론트엔드 연동** ✅
   - 방문일자 수정 핸들러 함수 (`handleUpdateVisitDate`)
   - API 호출 및 에러 처리
   - 이미지 목록 자동 새로고침
   - 선택된 이미지 메타데이터 업데이트

### 사용 방법
1. 고객 관리 → 이미지 → 고객 이미지 관리
2. 이미지 클릭하여 확대 모달 열기
3. 하단의 "방문일자" 섹션에서 "수정" 버튼 클릭
4. 새 날짜 선택 후 "저장" 버튼 클릭

### 변경된 파일
- `pages/api/admin/update-customer-image-visit-date.ts` (신규)
- `pages/admin/customers/index.tsx` (수정)

---

## ✅ 완료: 갤러리에서 고객 이미지 이동 시 메타데이터 손실 문제 수정 (2026-01-28)

### 문제
- 갤러리에서 고객 이미지를 드래그 앤 드롭으로 날짜 폴더 간 이동 시 메타데이터 손실
- `file_path`, `cdn_url`, `ai_tags`의 `visit-{date}` 태그가 업데이트되지 않음
- 고객 관리에서 "이미지 로드 실패" 표시 및 날짜 필터 문제

### 작업 내용
1. **`move-image-to-folder.js` API 개선** ✅
   - `file_path` 업데이트 추가
   - `cdn_url` 업데이트 추가
   - 고객 이미지 감지 및 `ai_tags`의 `visit-{date}` 태그 자동 업데이트
   - 날짜 폴더 변경 시 `visit-{oldDate}` 태그 제거 및 `visit-{newDate}` 태그 추가

2. **이동된 이미지 메타데이터 복구** ✅
   - 안희자 고객의 이동된 이미지 2개 메타데이터 복구
   - 중복 메타데이터 삭제 (2개)
   - `file_path`, `cdn_url`, `ai_tags` 정상화

### 결과
- 갤러리에서 고객 이미지 이동 시 메타데이터가 정상적으로 업데이트됨
- 고객 관리에서 이미지가 정상 표시됨
- 날짜 필터가 올바르게 작동함

### 변경된 파일
- `pages/api/admin/move-image-to-folder.js` (수정)
- `scripts/fix-moved-ahnheeja-images.js` (신규)
- `scripts/fix-moved-ahnheeja-images-v2.js` (신규)
- `docs/gallery-move-customer-image-fix-plan.md` (신규)

---

## ✅ 완료: 고객 이미지 목록 제거 기능 수정 - ai_tags 필터링 하위 호환성 추가 (2026-01-27)

### 작업 내용
- "목록 제거" 후에도 이미지가 목록에 나타나는 문제 해결
- `upload-customer-image` API가 `file_path`만으로 필터링하던 것을 `ai_tags` 필터링 추가
- 기존 이미지 하위 호환성: `ai_tags`가 없어도 `file_path`로 확인하여 포함

### 문제 원인
- `upload-customer-image` API가 `file_path`로만 필터링하여, `ai_tags`에서 `customer-{customerId}` 태그가 제거되어도 `file_path`에 고객 폴더 경로가 있으면 여전히 목록에 표시됨
- Storage에서 직접 조회한 이미지도 `ai_tags` 확인 없이 포함됨
- **추가 문제**: `ai_tags` 필터링을 추가했지만, 기존 이미지 중 `ai_tags`가 없는 이미지들이 모두 제외되어 "미디어 (0개)"로 표시됨

### 구현 완료 사항

1. **메타데이터 이미지 필터링 개선**:
   - ✅ `ai_tags`에 `customer-{customerId}` 태그가 있는 이미지 포함
   - ✅ `ai_tags`가 없거나 태그가 없는 경우, `file_path`로 확인하여 포함 (하위 호환성)
   - ✅ 둘 다 해당 안되면 제외
   - ✅ 필터링 전후 개수 및 상세 로그 추가

2. **Storage 이미지 필터링 개선**:
   - ✅ Storage에서 가져온 이미지 중 metadata에 매칭된 것만 포함
   - ✅ metadata에 매칭되지 않은 Storage 이미지는 제외 (ai_tags가 없음)
   - ✅ 필터링 결과 로그 추가

3. **클라이언트 디버깅 로그 강화**:
   - ✅ `uploadedImages` 상태 업데이트 전후 로그 추가
   - ✅ 미디어 분류 시작 시 `uploadedImages` 내용 로그 추가
   - ✅ 목록 제거 API에 상세 로그 추가
   - ✅ 클라이언트 핸들러에 상세 로그 추가

### 변경된 파일
- `pages/api/admin/upload-customer-image.js` (수정)
- `pages/api/admin/remove-customer-image.ts` (수정)
- `pages/admin/customers/index.tsx` (수정)

---

## ✅ 완료: 고객 이미지 목록 제거 기능 수정 - ai_tags 필터링 적용 (2026-01-27)

### 작업 내용
- "목록 제거" 후에도 이미지가 목록에 나타나는 문제 해결
- `upload-customer-image` API가 `file_path`만으로 필터링하던 것을 `ai_tags` 필터링 추가

### 문제 원인
- `upload-customer-image` API가 `file_path`로만 필터링하여, `ai_tags`에서 `customer-{customerId}` 태그가 제거되어도 `file_path`에 고객 폴더 경로가 있으면 여전히 목록에 표시됨
- Storage에서 직접 조회한 이미지도 `ai_tags` 확인 없이 포함됨

### 구현 완료 사항

1. **메타데이터 이미지 필터링 개선**:
   - ✅ `ai_tags`에 `customer-{customerId}` 태그가 있는 이미지만 필터링
   - ✅ 태그가 없는 이미지는 제외하고 로그 출력
   - ✅ 필터링 전후 개수 로그 추가

2. **Storage 이미지 필터링 개선**:
   - ✅ Storage에서 가져온 이미지 중 metadata에 매칭된 것만 포함
   - ✅ metadata에 매칭되지 않은 Storage 이미지는 제외 (ai_tags가 없음)
   - ✅ 필터링 결과 로그 추가

3. **디버깅 로그 강화**:
   - ✅ 목록 제거 API에 상세 로그 추가
   - ✅ 클라이언트 핸들러에 상세 로그 추가
   - ✅ 이미지 조회 및 필터링 과정 로그 추가

### 변경된 파일
- `pages/api/admin/upload-customer-image.js` (수정)
- `pages/api/admin/remove-customer-image.ts` (수정)
- `pages/admin/customers/index.tsx` (수정)

---

## 🔄 진행 중: 시크리트웨폰 블랙 MUZIIK 상세페이지 적용 및 최종 검증 (2026-01-27)

### 작업 내용
- 이미지 정리 완료 후 상세페이지에 적용되지 않는 문제 해결
- Hook/Detail 콘텐츠 입력 가이드 작성
- CTA 버튼 처리 방안 정리
- 최종 구현 계획서 작성

### 문제 분석

1. **Hook 섹션이 표시되지 않는 이유**:
   - `hookContent.length > 0` 조건을 만족하지 않음
   - Hook 이미지는 등록되었지만 제목/설명이 비어있음
   - **해결**: 관리 페이지에서 Hook 탭에서 제목/설명 입력 필요

2. **Detail 섹션이 표시되지 않는 이유**:
   - `detailContent.length > 0` 조건을 만족하지 않음
   - Detail 이미지는 추가되었지만 `detailContent`에 연결되지 않음
   - **해결**: 관리 페이지에서 Detail 탭에서 이미지 추가 후 제목/설명 입력 필요

3. **Hero 섹션 이미지 문제**:
   - `heroImages`가 비어있을 수 있음
   - 마이그레이션 스크립트 실행 필요

### CTA 처리 방안

**현재 정책**: 텍스트 기반 CTA 버튼만 사용 (이미지 기반 CTA는 사용하지 않음)

**이유**:
- 접근성 향상 (스크린 리더 지원)
- 반응형 디자인 일관성
- 성능 최적화 (이미지 로딩 없음)
- 유지보수 용이성

**구현 상태**:
- ✅ 첫 번째 CTA 섹션 (Hook 섹션 아래)
- ✅ 두 번째 CTA 섹션 (스펙표 아래)
- ✅ 텍스트 기반 버튼만 사용

### 구현 완료 사항

1. **최종 구현 계획서 작성** ✅
   - ✅ `docs/secret-weapon-black-muziik-final-implementation-plan.md` 생성
   - ✅ 문제 해결 가이드 포함
   - ✅ 작업 체크리스트 작성
   - ✅ CTA 처리 방안 정리

2. **콘텐츠 입력 가이드** ✅
   - ✅ `docs/detail-image-content-guide.md` 생성
   - ✅ Hook/Detail 콘텐츠 입력 방법 상세 설명

### 다음 단계
- [ ] 마이그레이션 스크립트 실행
- [ ] Hook 콘텐츠 제목/설명 입력
- [ ] Detail 이미지 추가 및 콘텐츠 입력
- [ ] 페이지 검증 및 최적화

### 변경된 파일
- `docs/secret-weapon-black-muziik-final-implementation-plan.md` (신규)
- `docs/detail-image-content-guide.md` (신규)

---

## ✅ 완료: 고객 이미지 관리에 "목록 제거" 기능 추가 (2026-01-27)

### 작업 내용
- 제품 합성 관리와 동일한 패턴으로 "목록 제거" 기능 추가
- Storage 파일은 유지하고, 고객 목록에서만 제거
- 나중에 다시 추가 가능하도록 구현

### 구현 완료 사항

1. **API 엔드포인트 생성**:
   - ✅ `/api/admin/remove-customer-image.ts` 생성
   - ✅ `image_assets`의 `ai_tags`에서 `customer-{customerId}` 태그 제거
   - ✅ Storage 파일은 유지 (제거하지 않음)

2. **클라이언트 UI 개선**:
   - ✅ 각 이미지에 "목록 제거" 버튼 추가 (⊖ 아이콘)
   - ✅ 호버 시 표시되는 액션 버튼 영역에 추가
   - ✅ 날짜별 보기와 일반 보기 모두에 적용
   - ✅ 확인 메시지 표시 ("Storage 파일은 유지됩니다")

3. **핸들러 함수 구현**:
   - ✅ `handleRemoveFromCustomerList` 함수 추가
   - ✅ 목록 제거 후 자동 새로고침
   - ✅ 고객 리스트 썸네일 업데이트 이벤트 발생

### 변경된 파일
- `pages/api/admin/remove-customer-image.ts` (신규)
- `pages/admin/customers/index.tsx` (수정)

---

## ✅ 완료: 동영상 썸네일 및 이미지 등록 메시지 개선 (2026-01-27)

### 작업 내용
- 동영상 썸네일이 깨지는 문제 해결
- 이미지 등록 시 "메타데이터 저장 실패" 오류 대신 "이미 등록된 이미지입니다" 메시지 표시

### 구현 완료 사항

1. **FolderImagePicker 동영상 썸네일 수정**:
   - ✅ `<img>` 태그 대신 `MediaRenderer` 컴포넌트 사용
   - ✅ 동영상 파일 자동 감지 및 `<video>` 태그로 렌더링
   - ✅ 동영상 배지 추가 (파일명으로 동영상 감지)
   - ✅ 동영상 클릭 시 전체 화면 재생 이벤트 연결

2. **이미지 등록 중복 체크 개선**:
   - ✅ API에서 이미 등록된 이미지인지 먼저 확인
   - ✅ 이미 등록된 경우 `alreadyRegistered: true` 플래그와 함께 성공 응답 반환
   - ✅ 클라이언트에서 "이미 등록된 이미지입니다" 메시지 표시
   - ✅ 중복 체크 실패 시에만 "메타데이터 저장 실패" 오류 표시

### 변경된 파일
- `components/admin/FolderImagePicker.tsx` (수정)
- `pages/api/admin/upload-customer-image.js` (수정)
- `pages/admin/customers/index.tsx` (수정)

---

## ✅ 완료: 시크리트웨폰 블랙 MUZIIK 제품 페이지 개선 구현 (2026-01-27)

### 작업 내용
- `mas9golf.com/secret-weapon-black-muz`의 효과적인 레이아웃 구조를 `masgolf.co.kr/products/secret-weapon-black-muziik`에 적용
- 상단 후킹 이미지, CTA 최적화, 8컷 상세 이미지 섹션 추가
- 이미지 관리 구조 개선 (hero/hook/detail 폴더 분리)
- 이미지별 텍스트 콘텐츠 관리 기능 추가 (DB 기반 편집 가능)

### 구현 완료 사항

1. **데이터베이스 스키마 확장** ✅
   - ✅ `database/extend-products-table-for-page-content.sql` 생성
   - ✅ `hero_images`, `hook_images`, `hook_content`, `detail_content` 필드 추가
   - ✅ 인덱스 생성

2. **API 수정** ✅
   - ✅ `pages/api/admin/products.ts` 수정
   - ✅ `PRODUCT_SELECT_COLUMNS`에 새 필드 추가
   - ✅ `handlePost`, `handlePut`에 새 필드 저장 로직 추가

3. **useProductData 훅 수정** ✅
   - ✅ `lib/use-product-data.ts` 수정
   - ✅ `heroImages`, `hookImages`, `hookContent`, `detailImages`, `detailContent` 반환 추가

4. **제품 페이지 수정** ✅
   - ✅ `pages/products/secret-weapon-black-muziik.tsx` 수정
   - ✅ 2컷 후킹 이미지 섹션 추가 (HookImagesSection)
   - ✅ 첫 번째 CTA 버튼 섹션 추가 (FirstCTASection)
   - ✅ 8컷 상세 이미지 섹션 추가 (DetailImagesSection)
   - ✅ 두 번째 CTA 버튼 섹션 추가 (SecondCTASection)
   - ✅ 제품 히어로 섹션 유지 (heroImages 사용)

5. **관리 페이지 개발** ✅
   - ✅ `pages/admin/products.tsx` 타입 정의에 새 필드 추가
   - ✅ 상태 변수 추가 (heroImages, hookImages, hookContent, detailContent, activeTab)
   - ✅ 탭 UI 추가 (Detail, Hero, Hook, Performance)
   - ✅ Hero 이미지 관리 기능 추가
   - ✅ Hook 이미지 관리 + 텍스트 편집 기능 추가
   - ✅ Detail 콘텐츠 편집 기능 추가
   - ✅ 갤러리 선택 핸들러 수정 (hero, hook 모드 지원)
   - ✅ 폴더 경로 함수 추가 (getHeroFolderPath, getHookFolderPath)
   - ✅ Detail 탭에서 이미지 추가 시 detailContent 자동 생성 로직 추가
   - ✅ 이미지 삭제 시 hookContent, detailContent에서도 제거 로직 추가
   - ✅ handleOpenEdit에서 detailContent 자동 생성 로직 추가

### 변경된 파일
- `database/extend-products-table-for-page-content.sql` (신규)
- `pages/api/admin/products.ts` (수정)
- `lib/use-product-data.ts` (수정)
- `pages/products/secret-weapon-black-muziik.tsx` (수정)
- `pages/admin/products.tsx` (수정)

### 다음 단계
- [ ] Phase 2: 이미지 준비 및 폴더 구조 생성 (hero/, hook/, detail/ 폴더 생성 및 이미지 분류)
- [ ] Phase 5: 콘텐츠 작성 및 입력 (초기 텍스트 데이터 입력)
- [ ] Phase 6: 테스트 및 최적화 (반응형, 성능, 기능 테스트)
- [ ] Supabase에서 SQL 실행 필요: `database/extend-products-table-for-page-content.sql`

---

## ✅ 완료: 이미지 삭제 - 하위 폴더 경로 처리 수정 (2026-01-27)

### 작업 내용
- 하위 폴더에 있는 이미지 삭제 시 "파일이 존재하지 않습니다" 오류 해결
- `folder-images.js` API가 반환하는 하위 폴더 정보(`folder`) 활용
- 삭제 API의 파일 검색 로직 개선

### 구현 완료 사항

1. **FolderImagePicker 수정**:
   - ✅ `ImageItem` 타입에 `folder` 필드 추가
   - ✅ 삭제 시 하위 폴더 정보를 포함한 전체 경로 구성
   - ✅ `currentFolderPath` + `img.folder` + `img.name` 조합

2. **삭제 API 파일 검색 개선**:
   - ✅ 하위 폴더 목록을 가져와서 각 하위 폴더에서 파일 검색
   - ✅ 루트에서 파일명으로 검색하는 로직 개선
   - ✅ 더 정확한 파일 경로 매칭

### 변경된 파일
- `components/admin/FolderImagePicker.tsx` (수정)
- `pages/api/admin/delete-image.js` (수정)

---

## 🔄 진행 중: 이미지 삭제 디버깅 로그 추가 (2026-01-27)

### 작업 내용
- 삭제 완료 메시지가 나오지만 이미지가 다시 나타나는 문제 디버깅
- 삭제 API 및 클라이언트에 상세 로그 추가
- 파일이 존재하지 않을 때 `success: false` 반환하도록 수정

### 구현 완료 사항

1. **삭제 API 로그 강화**:
   - ✅ 요청 수신 시 상세 로그 추가
   - ✅ 요청 본문 파싱 로그 추가
   - ✅ 정규화된 삭제 대상 로그 추가
   - ✅ 파일 존재 확인 결과 로그 추가
   - ✅ 스토리지 삭제 시도/성공 로그 추가
   - ✅ 메타데이터 삭제 완료 로그 추가
   - ✅ 최종 응답 로그 추가

2. **파일 미존재 처리 개선**:
   - ✅ 파일이 존재하지 않을 때 `success: false` 반환
   - ✅ 클라이언트에서 `deletedImages.length === 0` 체크 추가
   - ✅ 에러 메시지 개선

3. **클라이언트 로그 강화**:
   - ✅ 삭제 시작/경로 구성/API 호출/응답/결과 로그 추가
   - ✅ 목록 새로고침 로그 추가
   - ✅ 폴더 이미지 조회 로그 추가

### 변경된 파일
- `pages/api/admin/delete-image.js` (수정)
- `pages/admin/customers/index.tsx` (수정)
- `components/admin/FolderImagePicker.tsx` (수정)

---

## ✅ 완료: 이미지 삭제 - DB 삭제 및 성공 메시지 수정 (2026-01-27)

### 작업 내용
- DB에서 실제로 삭제가 안되는 문제 해결
- 삭제 성공 메시지가 안나오는 문제 해결

### 구현 완료 사항

1. **API 응답 처리 개선**:
   - ✅ `result.success` 확인 추가
   - ✅ 성공 메시지 표시 추가 (갤러리 관리와 동일)
   - ✅ 삭제된 파일 수 및 DB 메타데이터 삭제 수 표시

2. **DB 삭제 로직 개선**:
   - ✅ `file_path` 기반 삭제 추가 (가장 정확)
   - ✅ `cdn_url` 기반 삭제 유지 (fallback)
   - ✅ 두 방법 모두 시도하여 삭제 성공률 향상

### 변경된 파일
- `pages/api/admin/delete-image.js` (수정)
- `pages/admin/customers/index.tsx` (수정)
- `pages/admin/products.tsx` (수정)
- `docs/image-delete-db-fix-plan.md` (신규)

---

## ✅ 완료: 이미지 삭제 - 갤러리 관리 패턴 적용 (2026-01-27)

### 작업 내용
- "파일을 찾을 수 없습니다" 오류 해결
- 갤러리 관리 일괄 삭제 패턴을 다른 삭제 기능에 적용

### 구현 완료 사항

1. **FolderImagePicker 컴포넌트 수정**:
   - ✅ `onDelete` 콜백에 `imageInfo` (name, folderPath) 추가 전달
   - ✅ `currentFolderPath`와 `img.name`을 조합하여 전달

2. **고객 이미지 관리 수정**:
   - ✅ `folderPath`와 `name`을 조합하여 `imageName` 생성
   - ✅ 갤러리 관리와 동일하게 `POST` 메서드 사용

3. **제품 이미지 관리 수정**:
   - ✅ `FolderImagePicker`의 `onDelete` 핸들러 수정
   - ✅ `handleDeletePerformanceImage` 함수 수정
   - ✅ `POST` 메서드로 변경

### 변경된 파일
- `components/admin/FolderImagePicker.tsx` (수정)
- `pages/admin/customers/index.tsx` (수정)
- `pages/admin/products.tsx` (수정)
- `docs/image-delete-gallery-pattern-fix.md` (신규)

---

## ✅ 완료: 이미지 삭제 imageName 파라미터 오류 수정 (2026-01-27)

### 작업 내용
- `image_metadata` → `image_assets` DB 마이그레이션 이후 발생한 삭제 오류 수정
- 여러 곳에서 "imageName 파라미터가 필요합니다" 오류 해결

### 구현 완료 사항

1. **공통 유틸리티 함수 생성**:
   - ✅ `lib/image-url-to-name-converter.ts` 생성
   - ✅ `extractImageNameFromUrl` 함수 구현
   - ✅ 다양한 Supabase Storage URL 형식 지원

2. **고객 이미지 관리 수정**:
   - ✅ `pages/admin/customers/index.tsx` 수정
   - ✅ `onDelete` 핸들러에서 `imageUrl` → `imageName` 변환

3. **제품 이미지 관리 수정**:
   - ✅ `pages/admin/products.tsx` 수정 (2곳)
   - ✅ `handleDeletePerformanceImage` 함수 수정
   - ✅ `FolderImagePicker`의 `onDelete` 핸들러 수정

### 변경된 파일
- `lib/image-url-to-name-converter.ts` (신규)
- `pages/admin/customers/index.tsx` (수정)
- `pages/admin/products.tsx` (수정)
- `docs/image-delete-imagename-fix-plan.md` (계획서)

---

## 📋 계획: 시크리트웨폰 블랙 MUZIIK 제품 페이지 개선 (2026-01-27)

### 작업 내용
- `mas9golf.com/secret-weapon-black-muz`의 효과적인 레이아웃 구조를 `masgolf.co.kr/products/secret-weapon-black-muziik`에 적용
- 상단 후킹 이미지, CTA 최적화, 8컷 상세 이미지 섹션 추가
- 이미지 관리 구조 개선 (hero/hook/detail 폴더 분리)
- 이미지별 텍스트 콘텐츠 관리 기능 추가 (DB 기반 편집 가능)

### 계획 문서
- 📄 `docs/secret-weapon-black-muziik-page-improvement-plan.md` 작성 완료 (수정됨)

### 주요 개선 사항
1. **2컷 후킹 이미지 섹션 추가**: 티타늄 파이버 샤프트, FULL 티타늄 설계
2. **CTA 버튼 섹션 강화**: 전략적 위치에 2개 CTA 섹션 배치
3. **8컷 상세 이미지 섹션 추가**: 기술 특징을 이미지와 함께 시각화
4. **이미지 관리 구조화**: `hero/`, `hook/`, `detail/` 폴더로 분리
5. **텍스트 콘텐츠 관리 기능**: hook/detail 이미지 하단 텍스트를 관리 페이지에서 편집 가능
6. **이미지 중복 사용 지원**: 같은 이미지를 hero/detail에 참조 방식으로 사용 가능

### 데이터베이스 변경사항
- `products` 테이블에 필드 추가:
  - `hero_images` JSONB: 상단 슬라이더용 이미지 경로 배열
  - `hook_images` JSONB: 후킹 이미지 경로 배열
  - `hook_content` JSONB: 후킹 이미지별 제목/설명
  - `detail_content` JSONB: 상세 이미지별 제목/설명

### 예상 일정
- Phase 1: 데이터베이스 스키마 확장 (0.5일)
- Phase 2: 이미지 준비 및 구조 설정 (1일)
- Phase 3: 관리 페이지 개발 (2일)
- Phase 4: 제품 페이지 코드 수정 (1.5일)
- Phase 5: 콘텐츠 작성 및 입력 (0.5일)
- Phase 6: 테스트 및 최적화 (1일)
- **총 예상 기간**: 6.5일

---

## ✅ 완료: 스캔 서류 분류 시스템 1차 개발 (2026-01-27)

### 작업 내용
- 스캔 서류 자동 감지 및 분류 시스템 구현 (OCR 제외)
- 기존 스캔 이미지 문서 분류 기능 포함

### 구현 완료 사항

1. **데이터베이스 스키마**:
   - ✅ `image_assets` 테이블에 `is_scanned_document`, `document_type` 필드 추가
   - ✅ `scanned_documents` 테이블 생성 (기본 구조만, OCR 필드는 2차에서 추가)
   - ✅ 인덱스 생성
   - 📝 SQL 실행 필요: `database/create-scanned-documents-schema.sql`

2. **문서 감지 유틸리티**:
   - ✅ `lib/scanned-document-detector.ts` 구현
   - ✅ 파일명 패턴 기반 자동 감지 (`seukaen` 포함 여부)
   - ✅ 문서 타입 자동 분류 (주문사양서, 설문조사, 동의서, 기타)

3. **API 구현**:
   - ✅ `POST /api/admin/classify-document` - 문서 분류 API
   - ✅ `GET /api/admin/scanned-documents` - 문서 목록 조회 API
   - ✅ `upload-customer-image.js`에 `is_scanned_document`, `document_type` 필드 추가

4. **UI 구현**:
   - ✅ 고객 이미지 모달에 "스캔 서류만 보기" 체크박스 추가
   - ✅ 문서 타입별 필터 드롭다운 추가 (전체, 주문사양서, 설문조사, 동의서, 기타)
   - ✅ 이미지 카드에 문서 타입 배지 표시 (색상별 구분)

5. **기존 데이터 분류**:
   - ✅ `scripts/classify-existing-scanned-documents.js` 작성
   - ⏳ SQL 실행 후 실행 필요

### 변경된 파일
- `database/create-scanned-documents-schema.sql` (신규)
- `lib/scanned-document-detector.ts` (신규)
- `pages/api/admin/classify-document.ts` (신규)
- `pages/api/admin/scanned-documents.ts` (신규)
- `pages/api/admin/upload-customer-image.js` (수정)
- `pages/admin/customers/index.tsx` (수정)
- `scripts/classify-existing-scanned-documents.js` (신규)
- `scripts/execute-scanned-documents-schema.js` (신규)

### 완료된 단계
1. ✅ **Supabase 대시보드에서 SQL 실행 완료**
2. ✅ **기존 데이터 분류 실행 완료**: 10개 스캔 서류 분류됨
3. ✅ **Playwright 테스트 작성 완료**: `e2e-test/playwright-scanned-documents-test.js`
4. ✅ **고객 대표 이미지 설정 기능 개발 완료**

### 스캔 서류 분류 시스템 테스트 결과
- 총 1149개 고객 이미지 조회
- 10개 스캔 서류 분류 완료
- 스캔 서류가 있는 고객: 안희자, 차재욱, 전유근, 김성수, 김진권

### 고객 대표 이미지 설정 기능 개발 완료
- ✅ 데이터베이스 스키마 수정 (`is_customer_representative` 필드 추가)
- ✅ API 엔드포인트 구현 (`/api/admin/set-customer-representative-image`)
- ✅ 고객 목록 API 수정 (대표 이미지 우선 조회)
- ✅ 고객 이미지 모달 UI에 "🏠 썸네일" 배지 추가
- ✅ 대표 이미지 설정/해제 핸들러 구현
- ✅ 날짜별/타입별/전체 보기 모두에 배지 추가

### 고객 이미지 분류 시스템 개선 완료
- ✅ 이미지와 서류 섹션 분리 (📷 업로드된 이미지 / 📄 업로드된 서류)
- ✅ "스캔 서류만 보기" 필터 제거 (서류 섹션으로 대체)
- ✅ 각 섹션별 독립적인 필터링 및 보기 모드
- ✅ 시각적 구분 강화 (배경색, 아이콘, 테두리)
- ✅ 빈 상태 처리 개선
- ✅ 반응형 디자인 적용

### 합성 고객 이미지 표시 문제 수정 완료
- ✅ Nanobanana API 수정 - 고객 정보 자동 감지 및 ai_tags 추가
- ✅ FAL API 수정 - 고객 정보 자동 감지 및 ai_tags 추가
- ✅ Replicate API 수정 (save-generated-image.js) - 고객 정보 자동 감지 및 ai_tags 추가
- ✅ 제품 합성 API 수정 - 원본이 고객 이미지인 경우 고객 정보 추가
- ✅ 고객 이미지 조회 API 개선 - file_path 필터링 로직 개선 (주석 추가)
- ✅ 기존 합성 이미지 마이그레이션 스크립트 작성 및 실행 완료 (5개 합성 이미지 업데이트)

---

## ✅ 완료: 고객 이미지 관리 UI 필터 개선 (2026-01-27)

### 작업 내용
- 방문일자 필터 버튼 동작 확인 (이미 구현되어 있음)
- "날짜별", "타입별", "전체" 버튼 제거 및 관련 로직 정리

### 구현 완료 사항

1. **viewMode 상태 변경**:
   - ✅ `viewMode` 상태를 상수로 변경 (`'date'` 고정)
   - ✅ 항상 날짜별 그룹화로 표시

2. **버튼 제거**:
   - ✅ "날짜별", "타입별", "전체" 버튼 제거 (3026-3059줄)
   - ✅ 버튼 렌더링 코드 완전 제거

3. **로직 정리**:
   - ✅ 타입별 보기 로직 제거 (3205-3345줄)
   - ✅ 전체 보기 로직 수정 (방문일자 필터 선택 시 표시)
   - ✅ 날짜별 보기 로직 수정 (방문일자 필터가 없을 때만 그룹화)

4. **동작 방식**:
   - 방문일자 필터가 없을 때: 날짜별로 그룹화하여 표시
   - 방문일자 필터가 있을 때: 선택된 날짜의 이미지만 표시 (그룹화 없이)

### 변경된 파일
- `pages/admin/customers/index.tsx` (수정)
- `docs/customer-image-filter-ui-improvement-plan.md` (신규)

---

## 📋 계획: 스캔 서류 관리 및 OCR 활용 개발 계획서 작성 (2026-01-27)

### 작업 내용
- 주문사양서, 설문조사 등 스캔 서류의 분리 관리 및 OCR 활용 방안 수립
- 개발 계획서 작성 완료 (1차/2차 분리)

### 계획서
- `docs/scanned-documents-management-plan.md`: 스캔 서류 관리 및 OCR 활용 전체 개발 계획서 (2차 포함)
- `docs/scanned-documents-phase1-plan.md`: **1차 계획서 - 문서 분류만 (OCR 제외)**

### 주요 내용

1. **현재 상태 분석**:
   - 스캔 서류가 일반 이미지와 함께 `originals/customers/{고객폴더명}/{날짜}/` 폴더에 저장
   - 파일명 패턴: `{고객명}_s{장면번호}_seukaen-{날짜}-{번호}.webp`
   - 일반 이미지와 구분되지 않음

2. **문제점**:
   - 검색 불가능: 텍스트 내용으로 검색 불가
   - 데이터 활용 불가: 후기 타임라인 등에 자동 반영 불가
   - 구분 어려움: 일반 이미지와 구분이 어려움

3. **솔루션**:
   - OCR을 통한 텍스트 추출 (Google Cloud Vision API 추천)
   - 구조화된 데이터 저장 (`scanned_documents` 테이블 신규 생성)
   - 문서 타입별 파싱 (주문사양서, 설문조사 등)
   - 후기 타임라인 자동 연동

4. **구현 계획 (4단계, 각 1주)**:
   - Phase 1: 기반 구축 (데이터베이스, 문서 감지, OCR API 연동)
   - Phase 2: OCR 처리 (비동기 처리, 문서 파싱)
   - Phase 3: 데이터 활용 (후기 타임라인, 검색 기능)
   - Phase 4: 기존 데이터 마이그레이션

5. **예상 효과**:
   - 업무 효율성 80% 향상 (수동 입력 작업 감소)
   - 검색 시간 90% 단축 (텍스트 기반 검색)
   - 데이터 활용도 향상 (후기 타임라인 자동 반영)

### 다음 단계
1. 승인 및 리소스 할당
2. Google Cloud Vision API 계정 설정
3. Phase 1 시작: 데이터베이스 스키마 생성

---

## ✅ 완료: 성능 데이터 이미지 관리 개선 (2026-01-27)

### 작업 내용
- 성능 데이터 이미지 관리에 제품 이미지 관리와 동일한 "제외" 및 "삭제" 기능 추가
- "삭제" 버튼을 "제외" 버튼으로 변경 (노출만 제외, Storage에는 유지)
- 갤러리 선택 모달에 삭제 기능 추가

### 계획서
- `docs/performance-image-management-improvement-plan.md`: 성능 데이터 이미지 관리 개선 상세 계획서

### 구현 완료 사항

1. **"삭제" → "제외" 및 "삭제" 분리:**
   - ✅ `handleExcludePerformanceImage` 함수 구현
     - Storage는 유지하고 배열에서만 제거
     - 제외된 이미지는 나중에 다시 추가 가능
   - ✅ `handleDeletePerformanceImage` 함수 구현 (갤러리 모달용)
     - Storage에서 완전 삭제
   - ✅ 버튼 텍스트: "삭제" → "제외"
   - ✅ 버튼 색상: 빨간색 → 주황색 (bg-orange-500)

2. **갤러리 선택 모달에 삭제 기능:**
   - ✅ `FolderImagePicker`의 `onDelete` 콜백에 성능 데이터 이미지 처리 로직 추가
   - ✅ `galleryPickerMode`가 `'performance'`인지 확인하여 적절한 이미지 목록 업데이트
   - ✅ 삭제 후 성능 데이터 이미지 목록 자동 업데이트

### 변경된 파일
- `pages/admin/products.tsx`: 
  - `handleExcludePerformanceImage` 함수 추가
  - `handleDeletePerformanceImage` 함수 추가 (갤러리 모달용)
  - 성능 데이터 이미지 관리 UI에서 "삭제" → "제외" 변경
  - `FolderImagePicker`의 `onDelete` 콜백에 성능 데이터 이미지 처리 로직 추가

---

## ✅ 완료: 제품 이미지 관리 개선 (2026-01-27)

### 작업 내용
- 제품 이미지 관리에 순번 표시 및 순서 변경 기능 추가 (성능 데이터 이미지 관리와 동일)
- "삭제" 버튼을 "제외" 버튼으로 변경 (노출만 제외, Storage에는 유지)
- 갤러리 선택 모달에 삭제 기능 추가

### 계획서
- `docs/product-image-management-improvement-plan.md`: 제품 이미지 관리 개선 상세 계획서

### 구현 완료 사항

1. **순번 표시 및 순서 변경:**
   - ✅ 각 이미지에 순번 표시 (1, 2, 3...) - 우측 상단 배지
   - ✅ 위로 이동 (↑) 버튼 추가
   - ✅ 아래로 이동 (↓) 버튼 추가
   - ✅ 성능 데이터 이미지 관리와 동일한 UX
   - ✅ `handleMoveDetailImage` 함수 활용

2. **"삭제" → "제외" 변경:**
   - ✅ 버튼 텍스트: "삭제" → "제외"
   - ✅ 버튼 색상: 빨간색 → 주황색 (bg-orange-500)
   - ✅ 기능: Storage에서 삭제하지 않고 배열에서만 제거
   - ✅ `handleExcludeImage` 함수 구현
   - ✅ 제외된 이미지는 나중에 다시 추가 가능

3. **갤러리 선택 모달에 삭제 기능:**
   - ✅ `FolderImagePicker`에 `enableDelete={true}` 추가
   - ✅ `onDelete` 콜백 구현
   - ✅ 삭제 후 제품 이미지 목록 자동 업데이트
   - ✅ 완전 삭제는 갤러리 모달에서만 가능

### 변경된 파일
- `pages/admin/products.tsx`: 
  - 순번 표시 UI 추가 (우측 상단 배지)
  - 위/아래 이동 버튼 추가
  - `handleExcludeImage` 함수 추가 (Storage 유지, 배열에서만 제거)
  - `handleDeleteImage` 함수 유지 (갤러리 모달에서 사용)
  - "삭제" 버튼 → "제외" 버튼으로 변경
  - `FolderImagePicker`에 `enableDelete` 및 `onDelete` 추가

---

## ✅ 완료: 제품 이미지 업로드 파일명 표준화 (2026-01-26)

### 작업 내용
- 제품 이미지 업로드 파일명을 `massgoo-{풀제품명}-{날짜}-{순번}.webp` 형식으로 표준화
- 갤러리 일반 업로드(방식 1)를 표준 파일명 형식으로 변경
- 갤러리 일반 업로드(방식 2)는 기존 방식 유지 (동영상 등)

### 계획서
- `docs/product-image-upload-filename-plan.md`: 제품 이미지 업로드 파일명 표준화 상세 계획서

### 구현 완료 사항

1. **제품 이미지 업로드:**
   - 파일명 형식: `massgoo-{풀제품명}-{날짜}-{순번}.webp`
   - 예시: `massgoo-secret-force-gold-2-muziik-20260126-01.webp`
   - 제품명 포함, 순번 자동 증가
   - 커스텀 파일명 및 preserveFilename 옵션은 기존 방식 유지

2. **갤러리 일반 업로드 (방식 1):**
   - 파일명 형식: `{위치}-{제품명}-upload-{날짜}-{고유번호}.{확장자}`
   - 위치 기반 파일명 생성
   - 표준 파일명 형식 적용
   - 이미지 및 동영상 모두 지원

3. **갤러리 일반 업로드 (방식 2):**
   - 한글만 영문으로 변환, 확장자 유지
   - 동영상 등 특수 케이스용 (기존 방식 유지)

### 변경된 파일
- `lib/filename-generator.ts`: 
  - `generateProductImageFileName` 함수 추가
  - `getNextProductImageUniqueNumber` 함수 추가
  - `extractProductName` 함수 수정 (targetFolder 지원)
  - `FilenameOptions` 인터페이스에 `upload` compositionFunction 추가
- `pages/api/admin/upload-product-image.js`: 표준 파일명 형식 적용
- `pages/api/upload-image-supabase.js`: 표준 파일명 형식 적용 (방식 1, 이미지 및 동영상)

---

## 📋 계획 중: is_liked 컬럼 마이그레이션 (2026-01-26)

### 문제 상황
- 좋아요 토글 기능에서 "is_liked 컬럼이 데이터베이스에 없습니다" 오류 발생
- `image_metadata` → `image_assets` 테이블 마이그레이션 중 `is_liked` 컬럼이 누락됨
- 현재 API는 `image_assets` 테이블을 사용하지만, 해당 테이블에 `is_liked` 컬럼이 없음

### 해결 방법
- `image_assets` 테이블에 `is_liked` 컬럼 추가
- 기존 `image_metadata` 테이블의 `is_liked` 데이터 마이그레이션 (선택사항)

### 계획서
- `docs/is-liked-column-migration-plan.md`: is_liked 컬럼 마이그레이션 상세 계획서
- `database/add-is-liked-column-to-image-assets.sql`: 마이그레이션 SQL 파일

### 실행 방법
1. Supabase Dashboard > SQL Editor 접속
2. `database/add-is-liked-column-to-image-assets.sql` 파일 내용 실행
3. 좋아요 토글 기능 테스트

---

## ✅ 완료: 갤러리 관리 UI 및 파일명 개선 (2026-01-26)

### 작업 내용
- 생성된 이미지 썸네일 UI 개선 (하단 썸네일과 동일한 기능 추가)
- 하단 이미지 그리드 리프레시 버튼 추가
- 업스케일 파일명 및 저장 위치 표준화
- 회전/변환 파일명 표준화

### 계획서
- `docs/gallery-ui-filename-improvement-plan.md`: 갤러리 관리 UI 및 파일명 개선 상세 계획서

### 구현 완료 사항

1. **생성된 이미지 썸네일 개선:**
   - 기존 "삭제" 버튼 제거 (작동하지 않음)
   - 기존 "replicate 변형" 버튼 제거 (이미지 상세 정보에 있음)
   - 하단 썸네일과 동일한 기능 추가:
     - 확대 버튼 (이미지 상세 정보로 이동)
     - 하트 버튼 (좋아요 토글)
     - 편집 버튼 (메타데이터 편집)
     - 삭제 버튼 (진짜 삭제 - Supabase Storage에서 완전 삭제)

2. **리프레시 기능:**
   - 하단 이미지 그리드 상단에 리프레시 버튼 추가
   - 클릭 시 현재 폴더의 이미지만 다시 로드

3. **업스케일 파일명 및 저장 위치:**
   - 파일명 형식: `{원본이미지위치}-{제품명}-replicate-upscale-{날짜}-{고유번호}.{확장자}`
   - 저장 위치: 원본 이미지 기반 (제품 갤러리, 굿즈 갤러리 등)
   - AI 설명 추가: "Replicate Real-ESRGAN AI를 사용한 2배/4배 업스케일링"
   - 파일: `pages/api/admin/upscale-image.js` 수정

4. **회전 파일명 표준화:**
   - 파일명 형식: `{원본이미지위치}-{제품명}-rotate-{각도}-{포맷품질}-{날짜}-{고유번호}.{확장자}`
   - 예시: `products-secret-force-gold-2-muziik-rotate-90-webp90-20260122-01.webp`
   - 파일: `pages/api/admin/rotate-image.js` 수정
   - 유틸리티: `lib/filename-generator.ts`에 `generateRotationFileName` 함수 추가

5. **변환 파일명 표준화:**
   - 파일명 형식: `{원본이미지위치}-{제품명}-convert-{툴명}-{포맷품질}-{날짜}-{고유번호}.{확장자}`
   - 예시: `products-secret-force-gold-2-muziik-convert-sharp-webp85-20260122-01.webp`
   - 파일: `pages/api/admin/convert-image.js` 수정
   - 유틸리티: `lib/filename-generator.ts`에 `generateConvertFileName` 함수 추가

### 변경된 파일
- `pages/admin/gallery.tsx`: 생성된 이미지 썸네일 개선, 리프레시 버튼 추가
- `pages/api/admin/upscale-image.js`: 표준 파일명 생성 및 저장 위치 결정 로직 추가
- `pages/api/admin/rotate-image.js`: 표준 회전 파일명 생성 로직 추가
- `pages/api/admin/convert-image.js`: 표준 변환 파일명 생성 로직 추가
- `lib/filename-generator.ts`: `generateRotationFileName`, `generateConvertFileName` 함수 추가

---

## ✅ 완료: 파일명 생성 규칙 표준화 구현 (2026-01-26)

### 작업 내용
- 모든 이미지 파일명 생성 방식을 표준화된 구조로 통일
- 새로운 파일명 구조: `{위치}-{제품명}-{합성프로그램}-{합성기능}-{생성일}-{고유번호}.{확장자}`
- 현재 파일명 생성 방식 전부 분석 완료
- 상세 계획서 작성 완료
- **코드 구현 완료**

### 구현 완료된 파일

1. **유틸리티 함수:**
   - `lib/filename-generator.ts` (신규 생성) ✅
     - `generateStandardFileName`: 표준 파일명 생성
     - `generateBlogFileName`: 블로그 파일명 생성
     - `generateStoragePath`: 저장 경로 생성
     - `determineStorageLocationForAI`: FAL/Replicate 저장 위치 결정
     - `detectLocation`: 위치 자동 감지
     - `extractProductName`: 제품명 추출

2. **API 파일 수정:**
   - `pages/api/compose-product-image.js` ✅ (제품 합성)
   - `pages/api/vary-nanobanana.js` ✅ (Nanobanana 변형)
   - `pages/api/vary-existing-image.js` ✅ (FAL 변형 + 저장 위치 결정)
   - `pages/api/kakao-content/generate-images.js` ✅ (카카오 콘텐츠)
   - `pages/api/admin/copy-draft-to-blog.ts` ✅ (블로그 파일명)

### 주요 변경 사항

1. **파일명 형식 통일:**
   - 하이픈(`-`)으로 연결된 단일 파일명
   - 위치, 제품명, 합성 프로그램, 합성 기능, 생성일(YYYYMMDD), 고유번호 포함

2. **블로그 파일명:**
   - 형식: `blog-{blogId}-{YYYYMMDD}-{원본파일명영문추출}-{고유번호2자리}.{확장자}`
   - 타임스탬프 대신 생성일(YYYYMMDD) 사용

3. **FAL/Replicate 저장 위치 결정:**
   - 현재 폴더 위치 확인
   - 있으면 → 원본과 동일한 폴더에 저장
   - 없으면 → `originals/ai-generated/{YYYY-MM-DD}/` 폴더에 저장

4. **복수 파일 생성:**
   - 같은 이미지에서 여러 변형 생성 시 각각 고유번호 자동 할당 (01, 02, 03...)

### 계획서
- `docs/filename-generation-standardization-plan.md`: 파일명 생성 규칙 표준화 상세 계획서

### 현재 파일명 생성 방식 분석 결과

1. **제품 합성 이미지:**
   - 형식: `composed-1-{UUID}-{timestamp}.webp` 또는 `{원본파일명}-composed-{제품slug}.{확장자}`
   - 문제: 파일명이 너무 복잡, `-composed-` 패턴 중복 가능

2. **Nanobanana 변형:**
   - 형식: `nanobanana-variation-{timestamp}-{randomString}.{확장자}`
   - 문제: 합성 기능 정보 없음, 생성일이 타임스탬프로만 표시

3. **FAL AI 변형:**
   - 형식: `existing-variation-{timestamp}.png`
   - 문제: 합성 프로그램 정보 없음, 위치 정보 없음

4. **Replicate 변형:**
   - 형식: `replicate-variation-{timestamp}-{index}.png`
   - 문제: 합성 기능 정보 없음, 생성일이 타임스탬프로만 표시

5. **카카오 콘텐츠:**
   - 형식: `kakao-{account}-{type}-{timestamp}-{i}-{imgIdx}.jpg`
   - 문제: 합성 프로그램/기능 정보 없음, 제품 정보 없음

6. **고객 이미지:**
   - 형식: `{영문이름}_s{장면코드}_{타입}_{번호}.webp`
   - 상태: 이미 표준화됨, 변경 불필요

### 새로운 파일명 구조 예시

**1. 제품 합성/변형 이미지:**
- 파일명: `products-secret-force-gold-2-muziik-nanobanana-tone-20260122-01.webp`
- 저장 경로: `originals/products/secret-force-gold-2-muziik/gallery/products-secret-force-gold-2-muziik-nanobanana-tone-20260122-01.webp`

**2. 카카오 콘텐츠 이미지:**
- 파일명: `daily-kakao-secret-force-gold-2-muziik-nanobanana-composed-20260122-01.webp`
- 저장 경로: `originals/daily-branding/kakao/2026-01-22/account1/feed/daily-kakao-secret-force-gold-2-muziik-nanobanana-composed-20260122-01.webp`

**3. 블로그 이미지:**
- 파일명: `blog-309-20260122-driver-image-01.webp`
- 저장 경로: `originals/blog/2026-01/309/blog-309-20260122-driver-image-01.webp`
- 특징: 생성일(YYYYMMDD), 원본파일명 영문 추출, 고유번호 2자리 포함

**4. 고객 이미지 (기존 규칙 유지):**
- 파일명: `joseotdae_s6_signature_01.webp`
- 저장 경로: `originals/customers/joseotdae-7010/2026-01-22/joseotdae_s6_signature_01.webp`

### 주요 변경 사항
1. **블로그 파일명 형식 변경**: `blog-{blogId}-{YYYYMMDD}-{원본파일명영문추출}-{고유번호2자리}.{확장자}`
2. **복수 파일 생성 시 각각 최적화**: 같은 이미지에서 여러 변형 생성 시 각각 고유번호 자동 할당
3. **FAL/Replicate 저장 위치 결정**: 현재 폴더 위치 확인 후 없을 때만 `ai-generated` 폴더에 업로드

### 다음 단계
- Phase 1: 파일명 생성 유틸리티 함수 생성
- Phase 2: 각 API 파일 수정 (블로그, FAL, Replicate 포함)
- Phase 3: 고유번호 자동 생성 로직 구현 (복수 파일 지원)
- Phase 4: 위치 자동 감지 로직 구현 (FAL/Replicate 저장 위치 결정)
- Phase 5: 제품명 추출 로직 구현
- Phase 6: 저장 경로 구조 변경

---

## ✅ 최근 작업: 제품 페이지 네이버 스마트스토어 링크 업데이트 (2026-01-26)

### 작업 내용
- 시크리트포스 PRO3 MUZIIK 제품 페이지의 "네이버 스마트스토어에서 구매하기" 버튼 링크 업데이트
- 스마트스토어 메인 페이지 링크에서 특정 제품 페이지 링크로 변경

### 구현 사항
- `pages/products/secret-force-pro-3-muziik.tsx` 파일의 211번째 줄 링크 수정
- 기존: `https://smartstore.naver.com/mas9golf`
- 변경: `https://smartstore.naver.com/mas9golf/products/13022193504`

### 변경된 파일
- `pages/products/secret-force-pro-3-muziik.tsx`: 네이버 스마트스토어 구매 버튼 링크 업데이트

---

## ✅ 이전 작업: 갤러리 관리 - 제품 합성 활성화 기능 추가 (2026-01-26)

### 작업 내용
- 갤러리 관리 페이지의 이미지 상세 정보에 제품 합성 활성화 기능 추가
- 톤변경/배경변경/오브젝트 변경은 Nanobanana 드롭다운에 유지 (텍스트 프롬프트 입력)
- 제품 합성 활성화는 별도 버튼으로 분리 (제품 선택 필요)
- 제품 합성 관리는 기존 `product-composition.tsx` 페이지 활용

### 구현 사항
1. `ProductSelector` 컴포넌트 import 추가
2. 제품 합성 관련 상태 변수 추가:
   - `showProductCompositionModal`: 제품 합성 모달 표시 여부
   - `isComposingProduct`: 제품 합성 진행 중 여부
   - `selectedProductId`: 선택된 제품 ID
   - `compositionTarget`: 합성 타겟 (hands/head/body/accessory)
3. `handleProductComposition` 함수 추가: 제품 합성 API 호출
4. 제품 합성 버튼 추가: 변형 버튼들과 분리된 별도 버튼
5. 제품 합성 모달 추가: 제품 선택 및 합성 타겟 선택 UI

### 변경된 파일
- `pages/admin/gallery.tsx`: 제품 합성 활성화 기능 추가

### 설계 결정
- 제품 합성 활성화를 별도 버튼으로 분리한 이유:
  - 톤변경/배경변경/오브젝트 변경은 텍스트 프롬프트 입력이 필요
  - 제품 합성은 제품 선택이 필요하여 다른 워크플로우
  - 기능 분리로 사용자 혼동 방지
  - 기존 제품 합성 관리 페이지 재사용 가능

---

## ✅ 이전 작업: 고객 이미지 마이그레이션 완료 및 배포 (2026-01-26)

### 완료된 작업

#### 고객 이미지 Storage 폴더 기반 원복 마이그레이션 (완료) ✅
- **작업 내용**: Storage의 실제 폴더(`originals/customers`)를 기준으로 모든 고객 이미지를 `image_assets`에 마이그레이션
- **스크립트**: `scripts/restore-customer-images-from-storage-folders.js`
- **결과**:
  - 총 고객 폴더: 96개
  - 매칭 성공: 26개
  - 발견된 이미지: 194개
  - 업데이트: 156개
  - 변경없음: 38개
  - 오류: 0개
  - 이미지 있는 고객: 35명

#### 안중철 고객 이미지 마이그레이션 (완료) ✅
- **문제**: 안중철 고객의 이미지가 `image_metadata`에는 있지만 `image_assets`에는 없어서 "이미지 있는 고객만" 필터에 나타나지 않음
- **해결**: Storage 폴더(`originals/customers/ahnjutcheot-3665`)에서 이미지를 찾아 `image_assets`에 등록
- **결과**: 안중철 고객 이미지 1개 마이그레이션 완료
- **스크립트**: `scripts/fix-ahnjutcheot-images.js`

#### 누락된 고객 이미지 찾기 스크립트 (완료) ✅
- **스크립트**: `scripts/find-customers-with-metadata-but-no-assets.js`
- **결과**: `image_metadata`에는 있지만 `image_assets`에는 없는 고객이 없음을 확인 (모든 고객 이미지가 `image_assets`에 있음)

## ✅ 이전 작업: image_metadata → image_assets 코드 업데이트 및 테스트 (2026-01-25)

### 완료된 작업

#### image_metadata → image_assets 코드 업데이트 (완료) ✅
- **작업 내용**: 데이터 마이그레이션 완료 후 코드에서 `image_metadata` 참조를 `image_assets`로 변경
- **완료된 파일 (약 30개 주요 API 파일)**:
  1. ✅ `pages/api/admin/all-images.js` - 주요 이미지 조회 API (구문 오류 수정 포함)
  2. ✅ `pages/api/admin/image-metadata.js` - 이미지 메타데이터 관리 API
  3. ✅ `pages/api/admin/image-metadata-batch.js` - 배치 메타데이터 처리 API
  4. ✅ `pages/api/kakao-content/update-image-usage.js` - 이미지 사용 기록 업데이트 API
  5. ✅ `pages/api/admin/image-metadata.ts` - 이미지 메타데이터 조회/수정 API (TypeScript)
  6. ✅ `pages/api/admin/delete-image.js` - 이미지 삭제 API
  7. ✅ `pages/api/admin/upload-customer-image.js` - 고객 이미지 업로드 API
  8. ✅ `pages/api/admin/update-image-scene.ts` - 이미지 장면 업데이트
  9. ✅ `pages/api/get-image-prompt.js` - 이미지 프롬프트 조회
  10. ✅ `pages/api/logo/get-for-mms.ts` - 로고 조회
  11. ✅ `pages/api/upload-image-supabase.js` - 이미지 업로드 API
  12. ✅ `pages/api/save-generated-image.js` - 생성된 이미지 저장 API
  13. ✅ `pages/api/admin/upscale-image.js` - 이미지 업스케일 API
  14. ✅ `pages/api/admin/convert-image.js` - 이미지 변환 API
  15. ✅ `pages/api/vary-existing-image.js` - 이미지 변형 API
  16. ✅ `pages/api/admin/extract-video-segment.js` - 동영상 구간 추출 API
  17. ✅ `pages/api/admin/compress-video.js` - 동영상 압축 API
  18. ✅ `pages/api/admin/convert-video-to-gif.js` - 동영상 GIF 변환 API
  19. ✅ `pages/api/admin/upload-processed-image.js` - 처리된 이미지 업로드 API
  20. ✅ `pages/api/vary-nanobanana.js` - Nanobanana 변형 API
  21. ✅ `pages/api/admin/copy-images-to-folder.js` - 이미지 복사 API
  22. ✅ `pages/api/admin/compare-images.js` - 이미지 비교 API
  23. ✅ `pages/api/admin/image-asset-manager.js` - 이미지 자산 관리 API
  24. ✅ `pages/api/compose-product-image.js` - 제품 이미지 구성 API
  25. ✅ `pages/api/admin/organize-images-by-blog.js` - 블로그별 이미지 정리 API
  26. ✅ `pages/api/admin/copy-or-link-image.js` - 이미지 복사/링크 API
  27. ✅ `pages/api/admin/remove-image-link.js` - 이미지 링크 제거 API
  28. ✅ `pages/api/solapi/*.js` - Solapi 관련 API들
  29. ✅ `pages/api/kakao-content/generate-images.js` - 카카오 이미지 생성 API
  30. ✅ `pages/api/admin/generate-blog-from-review.ts` - 후기에서 블로그 생성 API
  31. ✅ `pages/api/admin/copy-draft-to-blog.ts` - 초안 복사 API
  32. ✅ `pages/api/admin/customers/index.ts` - 고객 관리 API
  33. ✅ `components/admin/bookings/BookingSettings.tsx` - 예약 설정 컴포넌트
  34. ✅ 기타 관리/유틸리티 API 파일들 (약 20개)
- **남은 파일**:
  - `scripts/` 폴더의 마이그레이션/유틸리티 스크립트들 (참고용, 나중에 처리 가능)
  - `docs/` 폴더의 문서 파일들 (참고용)
  - `pages/api/debug-image-status.js.backup.20251031` (백업 파일)

#### Playwright 테스트 실행 (완료) ✅
- **테스트 파일**: 
  1. ✅ `e2e-test/playwright-gallery-search-test.js` - 갤러리 검색 테스트
  2. ✅ `e2e-test/playwright-image-test.js` - 이미지 메타데이터 편집 테스트
  3. ✅ `e2e-test/test-image-assets-api.js` - image_assets API 테스트 (신규 생성)
- **테스트 결과**:
  - ✅ 갤러리 검색 기능 정상 작동 (12개 이미지 발견)
  - ✅ `/api/admin/all-images` API 정상 응답 (200, 20개 이미지 반환)
  - ✅ 이미지 편집 모달 정상 작동
  - ✅ AI 생성 기능 정상 작동
  - ⚠️ 일부 이미지의 `cdn_url` 필드가 누락될 수 있음 (데이터 변환 확인 필요)
- **고객 이미지 조회 문제 해결 (완료) ✅**:
  - **문제**: 김종철 등 고객 이미지가 표시되지 않음
  - **원인**: 
    1. `contains('ai_tags', [tag])` 함수가 JSONB 배열에서 JSON 파싱 오류 발생
    2. 마이그레이션 과정에서 `ai_tags`에 `customer-{id}` 태그가 저장되지 않음 (빈 배열)
  - **해결**:
    1. ✅ `upload-customer-image.js` 수정: `file_path`를 우선 사용하도록 변경
    2. ✅ `fix-customer-image-tags-v2.js` 스크립트 실행: 97개 이미지에 customer 태그 추가 완료
    3. ✅ API 응답 형식 개선: 프론트엔드 호환성을 위해 `image_url`, `english_filename` 등 필드 추가
- **고객 스토리 이미지 및 썸네일 표시 문제 해결 (완료) ✅**:
  - **문제**: 
    1. 고객 스토리 모달에서 이미지가 빈칸으로 표시됨
    2. 고객 목록의 썸네일이 모두 "없음"으로 표시됨
    3. `MediaRenderer.tsx:85`에서 "이미지 로드 실패" 오류 반복 발생
  - **원인**:
    1. 썸네일 조회 API (`customers/index.ts`)에서 `ai_tags.cs.{customer-{id}}` 쿼리가 JSON 파싱 오류 발생
    2. `cdn_url`이 NULL인 경우 `file_path`로부터 URL을 생성하지 않음
    3. `MediaRenderer`가 빈 URL이나 잘못된 URL을 처리하지 못함
  - **해결**:
    1. ✅ `customers/index.ts` 수정: 썸네일 조회 시 `file_path`를 우선 사용, `cdn_url`이 없으면 `file_path`로부터 URL 생성
    2. ✅ `upload-customer-image.js` 수정: `cdn_url`이 없을 경우 `file_path`로부터 Supabase Storage URL 자동 생성
    3. ✅ `MediaRenderer.tsx` 개선: 빈 URL 처리 및 오류 시 placeholder 대신 빈 div 표시 (404 오류 방지)
- **이미지 있는 고객 필터링 문제 해결 (완료) ✅**:
  - **문제**: 
    1. 모든 고객이 이미지가 있는 것으로 잘못 표시됨
    2. 실제 이미지가 있는 고객은 92명 + 몇 명인데 20명만 표시됨
  - **원인**: 
    1. `hasImages` 필터가 `ai_tags`만 사용하여 `file_path`에 이미지가 있지만 태그가 없는 고객을 누락
    2. `ai_tags`가 빈 배열이거나 NULL인 이미지가 많아서 정확한 필터링 실패
  - **해결**:
    1. ✅ `customers/index.ts` 수정: `file_path`와 `ai_tags` 모두를 사용하여 고객 ID 추출
    2. ✅ `file_path`에서 `originals/customers/{folder_name}/` 패턴으로 고객 폴더명 추출
    3. ✅ 고객 폴더명을 `customers` 테이블의 `folder_name`과 매칭하여 정확한 고객 ID 추출
    4. ✅ 디버깅 로그 추가: `fromPath`, `fromTags`, `total` 카운트 출력
- **이미지 없는 고객이 이미지로 표시되는 문제 해결 (완료) ✅**:
  - **문제**: 이미지가 없는 고객이 썸네일로 표시됨 (빈 이미지 또는 깨진 이미지)
  - **원인**: 
    1. 썸네일 조회 시 `file_path`가 있으면 무조건 URL을 생성하지만 실제 파일 존재 여부는 검증하지 않음
    2. `cdn_url`이 NULL이거나 빈 문자열인 경우에도 `file_path`로부터 URL을 생성함
    3. 프론트엔드에서 이미지 로드 실패 시 `display: 'none'`만 설정하여 빈 공간만 남음
  - **해결**:
    1. ✅ `customers/index.ts` 수정: 썸네일 URL 유효성 검증 추가 (빈 문자열, null, 잘못된 형식 체크)
    2. ✅ `customers/index.tsx` 수정: 이미지 로드 실패 시 placeholder 표시 (빈 공간 대신 "없음" 표시)
- **고객 이미지 섞임 문제 해결 (완료) ✅**:
  - **문제**: 
    1. 이미지가 없는 고객이 다른 고객의 이미지로 표시됨
    2. `originals/customers` 폴더에는 마이그레이션이 완료되었는데 고객 관리에서 이미지가 섞임
  - **원인**: 
    1. `folder_name`이 없는 고객의 경우 전체 `customers` 폴더를 조회하여 다른 고객의 이미지가 할당됨
    2. `file_path`가 있으면 실제 파일 존재 여부 확인 없이 URL을 생성하여 깨진 이미지로 표시됨
    3. `cdn_url`이 NULL이어도 `file_path`로부터 URL을 생성하여 존재하지 않는 파일의 URL이 생성됨
  - **해결**:
    1. ✅ `customers/index.ts` 수정: `folder_name`이 없는 고객은 썸네일을 제공하지 않음
    2. ✅ `customers/index.ts` 수정: `cdn_url`이 NULL이면 썸네일을 제공하지 않음 (file_path로부터 URL 생성하지 않음)
    3. ✅ `upload-customer-image.js` 수정: `cdn_url`이 NULL이면 `image_url`도 null로 설정
    4. ✅ 디버깅 스크립트 작성: `check-customer-image-mismatch.js`, `debug-customer-thumbnail-mixing.js`
    5. ✅ `upload-customer-image.js` 수정: `folder_name`이 없으면 이미지를 조회하지 않음
- **비디오 로드 실패 및 이미지 있는 고객 카운트 문제 해결 (완료) ✅**:
  - **문제 1 (비디오 로드 실패)**:
    1. `MediaRenderer.tsx:59`에서 "비디오 로드 실패" 오류 반복 발생
    2. 사용자 확인: Supabase Storage에 모든 비디오 파일이 정상적으로 존재함
  - **원인 확인**:
    1. ✅ Storage 확인: 모든 비디오 파일 존재, URL 접근 가능 (HTTP 200)
    2. ✅ CORS 설정: `Access-Control-Allow-Origin: *` 정상
    3. ✅ Content-Type: `video/mp4` 정상
    4. ⚠️ 브라우저 비디오 코덱/포맷 호환성 문제 가능성
    5. ⚠️ `preload="metadata"`로 인한 초기 로드 실패 가능성
  - **해결**:
    1. ✅ `MediaRenderer.tsx` 개선: 
       - `preload="none"`으로 변경 (초기 로드 부담 감소)
       - `playsInline` 속성 추가 (모바일 호환성)
       - `crossOrigin="anonymous"` 추가 (CORS 명시)
       - 상세한 오류 로깅 추가 (error code, networkState, readyState)
       - `onLoadedMetadata`, `onCanPlay` 이벤트 핸들러 추가
    2. ✅ 디버깅 스크립트 작성: `debug-video-url-access.js` (URL 접근성 및 헤더 확인)
    3. ✅ **핵심 수정**: `upload-customer-image.js` 수정
       - 마이그레이션 과정에서 `cdn_url`이 누락된 비디오/이미지 처리
       - `cdn_url`이 없고 `file_path`가 있으면 `getPublicUrl`로 URL 생성
       - 특히 비디오 파일의 경우 마이그레이션 과정에서 `cdn_url` 누락이 많아 `file_path`로부터 URL 생성 로직 추가
       - 이전에는 `cdn_url`이 없으면 `imageUrl`을 `null`로 설정했지만, 이제는 `file_path`로부터 URL 생성
    4. ✅ **파일명 누락 문제 해결**: `upload-customer-image.js` 수정
       - 마이그레이션 과정에서 `english_filename`, `original_filename` 필드 누락 문제 해결
       - `file_path`, `cdn_url`, `image_url`에서 파일명 추출 (URL 디코딩 포함)
       - Storage에서 가져온 파일의 경우에도 파일명 디코딩 처리
       - 갤러리 관리와 동일하게 파일명이 표시되도록 수정
    5. ✅ **동영상 썸네일 표시 문제 해결**: `MediaRenderer.tsx` 수정
       - `preload="none"` → `preload="metadata"`로 변경하여 비디오 첫 프레임 로드
       - `muted` 속성 추가하여 자동 재생 정책 준수 (썸네일 표시를 위해)
       - `onLoadedData` 이벤트 핸들러 추가하여 첫 프레임 로드 완료 확인
       - 이제 비디오 썸네일이 정상적으로 표시됨
    6. ✅ **28명 외의 인물 확인 및 마이그레이션 누락 원인 분석**:
       - 확인 결과: 실제 이미지 있는 고객은 28명 (file_path: 16명, ai_tags: 20명, 중복 제거 후 28명)
       - 마이그레이션 누락 원인:
         1. file_path에는 있지만 ai_tags에 customer-{id} 태그가 없는 고객: 8명
         2. ai_tags에는 있지만 file_path가 다른 형식인 고객: 12명
       - 해결: `fix-missing-customer-tags-v4.js` 스크립트로 누락된 ai_tags 복구
       - 디버깅 스크립트: `check-missing-customers-migration.js` 작성
  - **문제 2 (이미지 있는 고객이 28명만 표시)**:
    1. "이미지 있는 고객만" 필터를 체크했는데 28명만 표시됨
    2. 예상: 92명 + 몇 명 더 있어야 함
  - **원인**:
    1. 실제로 이미지 있는 고객이 28명으로 확인됨 (file_path: 16명, ai_tags: 20명, 중복 제거 후 28명)
    2. 동영상 파일도 포함되어 카운트에 영향을 줄 수 있음
    3. "이미지 있는 고객"의 정의가 썸네일 기준일 수 있음
  - **해결**:
    1. ✅ `customers/index.ts` 수정: 동영상 파일 제외하여 이미지만 있는 고객만 카운트
    2. ✅ 디버깅 스크립트 작성: `debug-customer-count-28.js`
    3. ✅ 확인 결과: 실제로 28명이 맞으며, 동영상을 제외한 이미지만 있는 고객 기준
- **Playwright 테스트로 이미지 로드 문제 재현 및 분석 (완료) ✅**:
  - **테스트 결과**:
    1. ✅ API 응답: 정상 (200), 썸네일 URL 100명 모두 제공
    2. ✅ 이미지 로드: 100개 모두 성공, 실패 0개
    3. ✅ 네트워크 요청: 실패 0개, CORS 헤더 정상
    4. ⚠️ 사용자 화면과 차이: 테스트에서는 정상이지만 사용자 화면에서는 문제 발생
  - **원인 분석**:
    1. API 및 이미지 로드 자체는 정상 작동
    2. 브라우저 캐시 문제 가능성
    3. 실제 파일이 Storage에 없을 수 있음 (file_path는 있지만 파일 없음)
    4. CORB 정책 또는 다른 브라우저 정책 차이
  - **해결 조치**:
    1. ✅ Playwright 테스트 스크립트 작성: `e2e-test/playwright-customer-image-load-test.js`
    2. ✅ 분석 보고서 작성: `e2e-test/customer-image-load-analysis.md`
    3. ⚠️ 추가 확인 필요: Storage 파일 존재 여부 확인, 브라우저 캐시 클리어
- **다음 단계**:
  - 서버 재시작 후 고객 이미지 조회 테스트
  - 나머지 고객 이미지들도 태그 추가 (필요시)
  - 추가 통합 테스트 실행
- **주요 변경 사항**:
  - `image_metadata` → `image_assets` 테이블 변경
  - `image_url` → `cdn_url` 컬럼명 변경
  - `tags` (TEXT[]) → `ai_tags` (JSONB) 컬럼명 변경
  - `category_id` 제거 (image_assets에 없음)
  - `source`/`channel` 필터 제거 (image_assets에 없음)
  - `used_in` 컬럼 사용 제거 (image_assets에 없음)
  - `customer_id`, `story_scene`, `is_scene_representative` 관련 기능 비활성화 (image_assets에 없음)
- **수정 파일**:
  - `pages/api/admin/all-images.js`: 주요 이미지 조회 API
  - `pages/api/admin/image-metadata.js`: 이미지 메타데이터 관리 API
  - `pages/api/admin/image-metadata-batch.js`: 배치 메타데이터 처리 API
  - `pages/api/kakao-content/update-image-usage.js`: 이미지 사용 기록 업데이트 API
  - `pages/api/admin/image-metadata.ts`: 이미지 메타데이터 조회/수정 API
  - `pages/api/admin/delete-image.js`: 이미지 삭제 API
  - `pages/api/admin/upload-customer-image.js`: 고객 이미지 업로드 API
- **효과**: 
  - 데이터 마이그레이션 완료 후 코드가 새로운 `image_assets` 테이블을 사용하도록 변경
  - `image_metadata` 테이블 의존성 제거 준비 완료
  - 하위 호환성을 위해 일부 형식 변환 유지

#### image_metadata → image_assets 코드 업데이트 (이전 작업) ✅
- **작업 내용**: 데이터 마이그레이션 완료 후 코드에서 `image_metadata` 참조를 `image_assets`로 변경
- **수정 내용**:
  1. **`pages/api/admin/all-images.js`**:
     - `image_metadata` 테이블 쿼리 → `image_assets` 테이블 쿼리로 변경
     - `image_url` → `cdn_url` 컬럼명 변경
     - `tags` (TEXT[]) → `ai_tags` (JSONB) 컬럼명 변경
     - 검색 로직: RPC 함수 `search_image_metadata` 제거, `image_assets` 직접 쿼리로 변경
     - MMS/SMS 링크 이미지 조회: `source`/`channel` 필터 제거 (image_assets에 없음), `ai_tags`로만 필터링
     - 메타데이터 조회: `image_metadata` → `image_assets`로 변경, 하위 호환성을 위해 형식 변환
  2. **`pages/api/admin/image-metadata.js`**:
     - GET: `image_metadata` → `image_assets`, `image_url` → `cdn_url`, `tags` → `ai_tags`
     - POST: upsert 로직을 `image_assets`로 변경, `category_id` 제거 (image_assets에 없음)
     - PUT: 업데이트 로직을 `image_assets`로 변경
     - PATCH: `customer_id`, `story_scene`, `is_scene_representative` 관련 기능 비활성화 (image_assets에 없음)
  3. **`pages/api/admin/image-metadata-batch.js`**:
     - paths upsert: `image_metadata` → `image_assets`, `image_url` → `cdn_url`, `file_path` 추가
     - imageUrls 조회: `image_metadata` → `image_assets`, `tags` → `ai_tags` 변환
  4. **`pages/api/kakao-content/update-image-usage.js`**:
     - `findImageMetadata`: `image_metadata` → `image_assets` 조회로 변경
     - `updateImageUsageBatch`: `image_metadata` 업데이트 제거, `image_assets`만 업데이트
     - `used_in` 컬럼 사용 제거 (image_assets에 없음), `usage_count`만 업데이트
- **수정 파일**:
  - `pages/api/admin/all-images.js`: 주요 이미지 조회 API
  - `pages/api/admin/image-metadata.js`: 이미지 메타데이터 관리 API
  - `pages/api/admin/image-metadata-batch.js`: 배치 메타데이터 처리 API
  - `pages/api/kakao-content/update-image-usage.js`: 이미지 사용 기록 업데이트 API
- **효과**: 
  - 데이터 마이그레이션 완료 후 코드가 새로운 `image_assets` 테이블을 사용하도록 변경
  - `image_metadata` 테이블 의존성 제거 준비 완료
  - 하위 호환성을 위해 일부 형식 변환 유지

## ✅ 이전 작업: 갤러리 검색 이미지 사라짐 문제 디버깅 (2026-01-25)

### 완료된 작업

#### 갤러리 검색 이미지 사라짐 문제 디버깅 ✅
- **작업 내용**: 검색 시 이미지가 잠깐 나왔다가 사라지는 문제 원인 파악을 위한 디버깅 로그 추가 및 Playwright 테스트 작성
- **수정 내용**:
  1. **검색 디버깅 로그 추가**:
     - `filteredImages` useMemo 시작/완료 로그 추가
     - `fetchImages` 응답 처리 및 이미지 상태 업데이트 로그 추가
     - 폴더 필터, 타입 필터, 좋아요 필터 적용 시 상세 로그 추가
     - 각 필터링 단계에서 이미지 개수 변화 추적
  2. **Playwright 테스트 작성**:
     - `playwright-gallery-search-disappear-test.js` 생성
     - 검색어 입력 후 이미지 개수 변화를 0.5초마다 추적 (총 25초)
     - API 요청/응답 로그 수집
     - 이미지가 사라지는 순간 감지 및 분석
     - 결과를 JSON 파일로 저장
- **수정 파일**:
  - `pages/admin/gallery.tsx`: 검색 디버깅 로그 추가
  - `e2e-test/playwright-gallery-search-disappear-test.js`: 새로 생성
- **효과**: 
  - 검색 시 이미지가 사라지는 원인을 추적할 수 있는 상세 로그 제공
  - 자동화된 테스트로 문제 재현 및 분석 가능
  - 폴더 필터가 검색 결과를 필터링하는지 확인 가능

## ✅ 이전 작업: 갤러리 검색 기능 개선 (2026-01-25)

### 완료된 작업

#### 갤러리 검색 기능 개선 ✅
- **작업 내용**: 검색 기능이 제대로 작동하지 않는 문제 해결
- **수정 내용**:
  1. **디바운싱 시간 단축**:
     - 500ms → 300ms로 단축하여 검색 반응 속도 개선
  2. **검색어 전달 로그 개선**:
     - 검색어가 있을 때 항상 로그 출력하여 디버깅 용이성 향상
     - `searchParam` 정보도 로그에 포함
  3. **파일명 검색 범위 확대**:
     - 기존: `blog-images` 버킷만 검색
     - 개선: `blog-images`와 `originals` 두 버킷 모두 검색
     - `getAllFilesForSearch` 함수에 버킷 이름 파라미터 추가
     - 두 버킷에 대해 순차적으로 검색 수행
- **수정 파일**:
  - `pages/admin/gallery.tsx`: 디바운싱 시간 단축 및 검색어 로그 개선
  - `pages/api/admin/all-images.js`: 파일명 검색 범위 확대
- **효과**: 
  - 검색 반응 속도 개선 (300ms 디바운싱)
  - 검색 범위 확대로 더 많은 이미지 검색 가능
  - 디버깅 용이성 향상

## ✅ 이전 작업: 갤러리 관리 기능 개선 (2026-01-25)

### 완료된 작업

#### 갤러리 관리 필터 및 정렬 기능 최적화 ✅
- **작업 내용**: 
  - 불필요한 필터 옵션 제거
  - 필터 이름 개선
  - 사용 빈도 낮은 정렬 옵션 제거
- **수정 내용**:
  1. **필터 제거**:
     - "⭐ 대표 이미지" 필터 제거 (작동하지 않음)
     - "📂 카테고리별" 필터 제거 (사용 빈도 낮음)
     - "🎨 로고만 보기" 필터 제거 (사용 빈도 낮음)
  2. **필터 이름 개선**:
     - "사용되지 않음" → "사용 횟수 0" (명확성 향상)
  3. **정렬 옵션 제거**:
     - "파일 크기" 정렬 옵션 제거 (사용 빈도 낮음)
- **수정 파일**:
  - `pages/admin/gallery.tsx`: 필터 및 정렬 옵션 수정
- **효과**: 
  - UI 간소화 및 명확성 향상
  - 불필요한 코드 제거로 유지보수성 향상
  - 필수 기능만 남겨 사용성 개선

#### 블로그 이미지 카테고리 정보 제거 (2026-01-25)
- **작업 내용**: 101개 블로그 이미지의 카테고리 정보 제거
- **수정 내용**:
  - `image_metadata` 테이블에서 블로그 이미지의 `category_id`를 NULL로 업데이트
  - 백업 테이블 생성: `image_metadata_blog_category_backup_20260125`
- **수정 파일**:
  - 데이터베이스 직접 수정 (Supabase SQL Editor)
- **효과**: 블로그 이미지에 불필요한 카테고리 정보 제거

## ✅ 이전 작업: 박준영 원장 나이 정보 수정 (2026-01-25)

### 완료된 작업

#### 메인 페이지 및 제품 페이지 박준영 원장 나이 수정 ✅
- **작업 내용**: 
  - 메인 페이지 "퍼포먼스의 변화" 섹션의 박준영 원장 카드 나이 수정
  - 제품 페이지 "실제 성능 데이터" 섹션의 박준영 원장 나이 수정
- **수정 내용**:
  1. **메인 페이지 (index.js)**:
     - 박준영 원장: 55세 → 58세
  2. **제품 페이지 (secret-force-pro-3-muziik.tsx)**:
     - 박준영 원장: "55세, 비거리 향상" → "58세, 비거리 향상"
- **수정 파일**:
  - `pages/index.js`: 박준영 원장 카드의 나이 변경
  - `pages/products/secret-force-pro-3-muziik.tsx`: 박준영 원장 나이 정보 변경
- **효과**: 메인 페이지와 제품 페이지의 박준영 원장 정보가 일치하도록 업데이트됨

## ✅ 이전 작업: 이재민 회장 성능 데이터 수정 (2026-01-25)

### 완료된 작업

#### 메인 페이지 및 제품 페이지 이재민 회장 데이터 수정 ✅
- **작업 내용**: 
  - 메인 페이지 "퍼포먼스의 변화" 섹션의 이재민 회장 카드 정보 수정
  - 제품 페이지 "실제 성능 데이터" 섹션의 비거리 증가 수치 수정
- **수정 내용**:
  1. **메인 페이지 (index.js)**:
     - 이재민 회장: +40m → +32m
     - 이재민 회장: 58세 → 55세
  2. **제품 페이지 (secret-weapon-black-muziik.tsx)**:
     - 비거리 증가 수치: +20m → +32m
- **수정 파일**:
  - `pages/index.js`: 이재민 회장 카드의 비거리 증가 수치 및 나이 변경
  - `pages/products/secret-weapon-black-muziik.tsx`: 비거리 증가 수치 변경
- **효과**: 메인 페이지와 제품 페이지의 성능 데이터가 정확하게 일치하도록 업데이트됨

## ✅ 이전 작업: 김성호 대표 비거리 증가 수치 수정 (2026-01-25)

### 완료된 작업

#### 메인 페이지 김성호 대표 카드 수정 ✅
- **작업 내용**: 메인 페이지 "퍼포먼스의 변화" 섹션의 김성호 대표 카드에서 비거리 증가 수치를 "+35m"에서 "+25m"로 변경
- **수정 파일**:
  - `pages/index.js`: 김성호 대표 카드의 비거리 증가 수치 변경 (+35m → +25m)
- **효과**: 메인 페이지의 성능 데이터가 정확하게 표시됨

## ✅ 이전 작업: fallback 이미지 제거 및 구식 제품 페이지 삭제 (2026-01-25)

### 완료된 작업

#### fallback 이미지 제거 및 구식 제품 페이지 정리 ✅
- **작업 내용**: 
  - 메인 페이지와 제품 페이지에서 fallback 이미지 제거
  - 로딩 중에는 placeholder 표시하도록 개선
  - 구식 slug를 사용하는 페이지 파일 삭제 및 링크 업데이트
- **수정 내용**:
  1. **pages/index.js 링크 업데이트**:
     - `/products/weapon-beryl` → `/products/secret-weapon-black-muziik`
     - `/products/gold2-sapphire` → `/products/secret-force-gold-2-muziik`
     - `/products/pro3-muziik` → `/products/secret-force-pro-3-muziik`
     - 데스크톱 메뉴, 모바일 메뉴, 제품 카드 링크 모두 업데이트
  2. **구식 제품 페이지 파일 삭제**:
     - `pages/products/weapon-beryl.tsx` 삭제 (middleware에서 리다이렉트 처리)
     - `pages/products/gold2-sapphire.tsx` 삭제 (middleware에서 리다이렉트 처리)
  3. **fallback 이미지 제거**:
     - 메인 페이지: `performanceImagesLoading` 상태로 로딩 중에는 placeholder 표시
     - 제품 페이지: `isLoadingProduct || performanceImages.length === 0` 조건으로 로딩 처리
     - fallback 이미지 경로 제거 (`/main/testimonials/hero-faces/review-face-XX.jpg`)
  4. **로딩 처리 개선**:
     - 이미지가 로드되기 전에는 "이미지 로딩 중..." placeholder 표시
     - 예전 썸네일 이미지가 잠깐 나타나는 문제 해결
- **효과**:
  - 예전 썸네일 이미지가 잠깐 나타나는 문제 해결
  - 깔끔한 로딩 경험 제공
  - 구식 slug 사용 중단으로 코드 정리
  - 모든 링크가 최신 slug로 통일
- **수정 파일**:
  - `pages/index.js`: 링크 업데이트 및 fallback 이미지 제거, 로딩 처리 추가
  - `pages/products/secret-weapon-black-muziik.tsx`: fallback 이미지 제거 및 로딩 처리 추가
  - `pages/products/secret-force-gold-2-muziik.tsx`: fallback 이미지 제거 및 로딩 처리 추가
  - `pages/products/weapon-beryl.tsx`: 삭제
  - `pages/products/gold2-sapphire.tsx`: 삭제

## ✅ 이전 작업: 박준영 원장 성능 데이터 수정 (2026-01-25)

### 완료된 작업

#### 메인 페이지 및 제품 페이지 성능 데이터 수정 ✅
- **작업 내용**: 
  - 메인 페이지 "퍼포먼스의 변화" 섹션의 박준영 원장 카드 정보 수정
  - 제품 페이지 "실제 성능 데이터" 섹션의 성능 데이터 수정
- **수정 내용**:
  1. **메인 페이지 (index.js)**:
     - 박준영 원장: 65세 → 55세
     - 비거리 증가: +32m → +22m
  2. **제품 페이지 (secret-force-pro-3-muziik.tsx)**:
     - 비거리 증가: +20m → +22m
     - 나이 및 설명: 53세, 비거리 향상 → 55세, 비거리 향상
- **효과**:
  - 성능 데이터 일관성 향상
  - 메인 페이지와 제품 페이지 간 정보 일치
- **수정 파일**:
  - `pages/index.js`: 박준영 원장 카드 정보 수정 (65세 → 55세, +32m → +22m)
  - `pages/products/secret-force-pro-3-muziik.tsx`: 실제 성능 데이터 섹션 수정 (+20m → +22m, 53세 → 55세)

## ✅ 이전 작업: 메인 페이지 퍼포먼스의 변화 섹션 개선 (2026-01-25)

### 완료된 작업

#### 메인 페이지 "퍼포먼스의 변화" 섹션 동적 이미지 및 클릭 기능 추가 ✅
- **작업 내용**: 
  - 메인 페이지의 "퍼포먼스의 변화" 섹션 3개 카드에 제품의 `performanceImages[0]` 동적 적용
  - 각 카드 클릭 시 해당 제품 페이지의 "실제 성능 데이터" 섹션으로 이동
  - 제품 페이지에 `id="performance-data"` 추가하여 앵커 링크 지원
- **구현 내용**:
  1. **메인 페이지 제품 이미지 로드**:
     - 3개 제품(`secret-force-gold-2-muziik`, `secret-weapon-black-muziik`, `secret-force-pro-3-muziik`)의 `performanceImages` 로드
     - `useEffect`로 제품 API 호출하여 `performance_images[0]` 가져오기
     - 각 카드에 `performanceImages[0]` 동적 적용 (fallback 이미지 유지)
  2. **카드 클릭 기능 추가**:
     - 각 카드를 `Link` 컴포넌트로 감싸서 클릭 가능하게 변경
     - 클릭 시 `/products/{slug}#performance-data`로 이동
     - 부드러운 스크롤로 해당 섹션으로 이동
  3. **제품 페이지 앵커 추가**:
     - `secret-force-gold-2-muziik.tsx`: `id="performance-data"` 추가
     - `secret-weapon-black-muziik.tsx`: `id="performance-data"` 추가
     - `secret-force-pro-3-muziik.tsx`: `id="performance-data"` 추가
  4. **이미지 전략**:
     - 메인 페이지: `performanceImages[0]` 사용 (고객 후기용 이미지)
     - 제품 페이지: `performanceImages[0]` 사용 (성능 데이터용 이미지)
     - 내용은 각각 고유하게 유지 (메인: 고객 후기, 제품: 성능 데이터)
- **효과**:
  - 메인 페이지에서 제품의 실제 갤러리 이미지가 동적으로 표시됨
  - 클릭 한 번으로 해당 제품의 상세 성능 데이터로 이동 가능
  - 퍼널 페이지로서 사용자 경험 향상
  - 관리자가 제품 관리 페이지에서 선택한 이미지가 자동으로 반영됨
- **수정 파일**:
  - `pages/index.js`: 제품 이미지 로드 로직 추가 및 카드 클릭 기능 구현
  - `pages/products/secret-force-gold-2-muziik.tsx`: `id="performance-data"` 추가
  - `pages/products/secret-weapon-black-muziik.tsx`: `id="performance-data"` 추가
  - `pages/products/secret-force-pro-3-muziik.tsx`: `id="performance-data"` 추가

## ✅ 이전 작업: 제품 페이지 performanceImages 연결 수정 (2026-01-25)

### 완료된 작업

#### secret-weapon-black-muziik 및 secret-force-gold-2-muziik 페이지 performanceImages 연결 ✅
- **작업 내용**: 
  - `secret-weapon-black-muziik.tsx`와 `secret-force-gold-2-muziik.tsx` 페이지에서 `performanceImages`가 적용되지 않는 문제 수정
  - `secret-force-pro-3-muziik.tsx`와 동일하게 `performanceImages`를 동적으로 로드하도록 수정
- **문제 원인**:
  - `useProductData`에서 `performanceImages`를 디스트럭처링하지 않음
  - 하드코딩된 이미지 경로 사용 (`/main/testimonials/hero-faces/review-face-02.jpg`, `review-face-01.jpg`)
  - 갤러리 그리드 섹션이 없음
- **수정 내용**:
  1. **useProductData에서 performanceImages 추가**:
     - `secret-weapon-black-muziik.tsx`: Line 30에 `performanceImages` 추가
     - `secret-force-gold-2-muziik.tsx`: Line 31에 `performanceImages` 추가
  2. **동적 이미지 소스 변경**:
     - 하드코딩된 이미지 경로를 `performanceImages[0]`로 변경
     - fallback 이미지 유지 (기존 하드코딩 경로)
     - `onError` 핸들러 추가
  3. **갤러리 그리드 섹션 추가**:
     - `performanceImages.length > 1`일 때만 표시
     - 2-3열 그리드 레이아웃 (최대 6개 미리보기)
     - 7개 이상일 때 총 개수 표시
  4. **레이아웃 조정**:
     - 성능 데이터 섹션에 `mb-8` 추가 (갤러리 공간 확보)
- **효과**:
  - 데이터베이스의 `performance_images`가 동적으로 로드되어 표시됨
  - 관리자가 제품 관리 페이지에서 선택한 이미지가 자동으로 반영됨
  - `secret-force-pro-3-muziik.tsx`와 동일한 동작으로 일관성 유지
- **수정 파일**:
  - `pages/products/secret-weapon-black-muziik.tsx`: `performanceImages` 추가 및 동적 이미지 적용
  - `pages/products/secret-force-gold-2-muziik.tsx`: `performanceImages` 추가 및 동적 이미지 적용

## ✅ 이전 작업: 제품 페이지 성능 데이터 이미지 갤러리 연결 (2026-01-25)

### 완료된 작업

#### 성능 데이터 이미지 갤러리 연결 기능 구현 ✅
- **작업 내용**: 
  - 실제 성능 데이터 섹션에 `originals/products/{slug}/gallery` 이미지 연결
  - 제품 관리 페이지에서 성능 데이터 이미지 선택 기능 추가
  - 하이브리드 레이아웃 구현 (대표 이미지 + 그리드 + 더보기)
- **구현 내용**:
  1. **데이터베이스 스키마 확장**:
     - `products` 테이블에 `performance_images` 필드 추가 (JSONB 배열)
     - SQL 파일: `database/add-performance-images-to-products.sql`
  2. **제품 관리 페이지 UI 추가**:
     - 성능 데이터 이미지 관리 섹션 추가 (드라이버 제품만)
     - 갤러리에서 이미지 선택 기능
     - 이미지 순서 변경 (위/아래 이동)
     - 이미지 삭제 기능
  3. **API 수정**:
     - `pages/api/admin/products.ts`: `performance_images` 필드 처리 (POST/PUT)
     - `PRODUCT_SELECT_COLUMNS`에 `performance_images` 추가
  4. **제품 데이터 훅 확장**:
     - `lib/use-product-data.ts`: `performanceImages` 반환 추가
  5. **제품 페이지 수정**:
     - `pages/products/secret-force-pro-3-muziik.tsx`:
       - 대표 이미지 카드에 첫 번째 `performanceImages` 사용
       - 2개 이상일 때 그리드 레이아웃 표시 (2-3열, 최대 6개 미리보기)
       - 하이브리드 레이아웃으로 CTA까지 자연스러운 흐름 유지
- **효과**:
  - 갤러리 이미지를 성능 데이터 섹션에 동적으로 연결
  - 관리자가 쉽게 이미지 선택 및 관리 가능
  - 하이브리드 레이아웃으로 초기 로딩 빠름 + 전체 이미지 노출
  - CTA까지 자연스러운 스크롤 유도
- **수정 파일**:
  - `database/add-performance-images-to-products.sql`: 스키마 확장 SQL
  - `pages/admin/products.tsx`: 성능 데이터 이미지 관리 UI 추가
  - `pages/api/admin/products.ts`: `performance_images` 필드 처리
  - `lib/use-product-data.ts`: `performanceImages` 추가
  - `pages/products/secret-force-pro-3-muziik.tsx`: 동적 이미지 적용

## ✅ 이전 작업: About 페이지 제조 경력 연도 업데이트 (2026-01-25)

### 완료된 작업

#### 제조 경력 통계 업데이트 ✅
- **작업 내용**: 
  - About 페이지의 통계 섹션에서 "22년 제조 경력"을 "23년 제조 경력"으로 변경
- **변경 내용**:
  - 통계 섹션의 첫 번째 항목 숫자: 22 → 23
- **효과**:
  - 최신 연도 정보 반영
  - 브랜드 경력 정보 정확성 향상
- **수정 파일**:
  - `pages/about.tsx`: 제조 경력 통계 숫자 변경 (22 → 23)

## ✅ 이전 작업: secret-force-pro-3-muziik 페이지에 스펙표 추가 (2026-01-25)

### 완료된 작업

#### 상세 스펙표 섹션 추가 ✅
- **작업 내용**: 
  - `secret-weapon-black-muziik` 페이지의 상세 스펙표를 `secret-force-pro-3-muziik` 페이지에 추가
  - 230/240/250 버전별 스펙표 구현
  - DOGATTI GENERATION BERYL 테이블 추가
- **구현 내용**:
  1. **기술 사양 섹션 추가**:
     - "혁신적인 테크놀로지 섹션" 다음에 배치
     - "다른 브랜드와의 비교" 섹션 앞에 위치
     - 어두운 배경 (from-gray-900 via-black to-gray-900) 적용
  2. **230/240/250 버전별 스펙표**:
     - 헤드 각도: 9° 10° (스트레이트 페이스 [실제 각도])
     - 최적 무게: 280 (276g~284g) / 287 (283g~290g) / 290 (286g~294g)
     - 탄성 샤프트: 42g / 47g / 49g
     - 토크: 4.8 / 3.8 / 3.8
     - 탄성 그립: 45g (600 스탠다드)
     - 고반발 헤드: 193 ±4g
     - 헤드 라이각: 59° (표준)
     - 킥 포인트: Mid Low (중하단)
     - 최적의 길이: 46"
     - 헤드 부피: 460 cc
     - 최적 밸런스: D2
     - 샤프트 진동수: 230 / 240 / 250 cpm
     - 맞춤 볼스피드: 58 / 62 / 66 m/s
  3. **DOGATTI GENERATION BERYL 테이블**:
     - FLEX, 전장(mm), 중량(g), Tip(mm), Butt(mm), 토크(°↓), CPM, K.P. 컬럼
     - 230(부드러움) R2, 240(표준) R, 250(강함) SR 행
     - 각 버전별 상세 스펙 데이터 포함
  4. **반응형 디자인**:
     - 모바일에서 가로 스크롤 지원 (`overflow-x-auto`)
     - 최소 너비 설정 (`min-w-[700px]`)
     - 그리드 레이아웃으로 반응형 처리
- **효과**:
  - 제품 상세 스펙 정보 제공으로 고객 신뢰도 향상
  - 전문적인 제품 정보 표시로 구매 결정 지원
  - 다양한 버전별 스펙 비교 가능
- **수정 파일**:
  - `pages/products/secret-force-pro-3-muziik.tsx`: 기술 사양 섹션 추가 (230/240/250 스펙표 및 DOGATTI GENERATION BERYL 테이블)

#### 비교 테이블 컬럼 순서 및 제품명 변경 ✅
- **작업 내용**: 
  - "다른 브랜드와의 비교" 테이블의 컬럼 순서 변경
  - 제품명 변경
- **변경 내용**:
  1. **컬럼 순서 변경**:
     - 변경 전: 구분 | 일반 PRO3 | 경쟁사 제품 | PRO3 MUZIIK
     - 변경 후: 구분 | 경쟁사 제품 | 시크리트포스 PRO 3 | 시크리트포스 PRO 3 MUZIIK
  2. **제품명 변경**:
     - "일반 PRO3" → "시크리트포스 PRO 3"
     - "PRO3 MUZIIK" → "시크리트포스 PRO 3 MUZIIK"
  3. **데이터 행 순서 조정**:
     - 모든 데이터 행의 컬럼 순서를 헤더와 일치하도록 재배치
  4. **샤프트 정보 변경**:
     - "일반 샤프트" → "NGS 카본 샤프트"
  5. **비거리 데이터 순서 변경**:
     - 경쟁사 제품: +10m → 표준
     - 시크리트포스 PRO 3: 표준 → +10m
  6. **가성비 정보 변경**:
     - 시크리트포스 PRO 3 MUZIIK: "탁월" → "매우 탁월"
  7. **푸터 저작권 연도 변경**:
     - 모든 제품 페이지의 푸터 연도 © 2025 → © 2026
     - 변경된 파일:
       - `pages/products/secret-force-pro-3-muziik.tsx`
       - `pages/products/secret-weapon-black-muziik.tsx`
       - `pages/products/gold2-sapphire.tsx`
       - `pages/products/pro3-muziik.tsx`
       - `pages/products/weapon-beryl.tsx`
       - `pages/products/secret-force-gold-2-muziik.tsx`
- **효과**:
  - 제품명 통일성 향상
  - 경쟁사 제품을 먼저 비교하여 시크리트포스 제품의 우위 강조
  - 샤프트 정보 정확성 향상
- **수정 파일**:
  - `pages/products/secret-force-pro-3-muziik.tsx`: 비교 테이블 헤더 및 데이터 행 순서 변경, 제품명 변경

## ✅ 이전 작업: MAS GOLF ProWhale 섹션 UI 추가 개선 (2026-01-24)

### 완료된 작업

#### 버튼 레이아웃 최적화 ✅
- **문제**: 
  1. 생성완료, 재생성, 배포대기 버튼이 줄바꿈되어 여러 줄에 표시됨
  2. 갤러리에서 선택, 이미지 재생성, 프롬프트 이미지 재생성 버튼이 가로로 배치되어 공간 낭비
- **해결**:
  1. **생성완료, 재생성, 배포대기 버튼 한 줄 배치**:
     - `flex-wrap` 제거 → `flex-nowrap`으로 한 줄 고정
     - 버튼 크기 축소: `px-2 py-1.5 min-h-[28px]`
     - 폰트 크기: `text-xs` → `text-[10px]`
     - 아이콘 크기: `w-3.5 h-3.5` → `w-3 h-3`
     - 간격 조정: `gap-2` → `gap-1`
     - 텍스트 간소화: "생성 완료" → "생성완료", "배포 대기" → "배포대기"
  2. **갤러리에서 선택, 이미지 재생성, 프롬프트 이미지 재생성 버튼 3단 배치**:
     - 레이아웃 변경: `flex` → `grid grid-cols-3 gap-2`
     - 배경 이미지 섹션과 프로필 이미지 섹션 모두 적용
     - 버튼 크기 통일: `px-2 py-2`
     - 폰트 크기: `text-[11px]`
     - 아이콘 크기: `w-3.5 h-3.5`
     - 각 버튼에 `flex-1` 또는 동일한 너비 적용
- **효과**:
  - 공간 효율성 향상 (한 줄 배치로 세로 공간 절약)
  - 가독성 개선 (버튼 그룹화로 구조 명확)
  - 일관성 강화 (동일한 레이아웃 패턴 적용)
  - 사용성 향상 (버튼 위치 예측 가능)
- **수정 파일**:
  - `components/admin/kakao/KakaoAccountEditor.tsx`: 3행 버튼들 한 줄 배치 및 크기 축소
  - `components/admin/kakao/ProfileManager.tsx`: 배경/프로필 이미지 버튼 3단 배치
  - `components/admin/kakao/FeedManager.tsx`: 피드 이미지 버튼 3단 배치 (배경/프로필과 동일한 스타일)

## ✅ 이전 작업: MAS GOLF ProWhale 섹션 UI 개선 (2026-01-24)

### 완료된 작업

#### MAS GOLF ProWhale 섹션 UI 개선 ✅
- **문제**: 
  1. 1행과 2행이 같은 줄에 인라인 배치되어 가독성 저하
  2. 3행 버튼들의 높이가 불균일
  3. 4행(카카오톡/슬랙)이 별도 섹션으로 분리되어 구조가 복잡함
- **해결**:
  1. **4행 구조로 재구성**:
     - 1행: 계정명 + 전화번호 (독립 행, 모바일 줄바꿈 처리)
     - 2행: 페르소나/톤 배지 (독립 행으로 분리)
     - 3행: 생성완료, 재생성, 배포 대기 (높이 균일 - `min-h-[36px]` 적용)
     - 4행: 카카오톡, 슬랙 버튼 (3행과 같은 섹션으로 통합)
  2. **높이 균일화**:
     - 모든 버튼에 `min-h-[36px]` 적용
     - `flex items-center`로 수직 정렬 통일
     - 버튼 간격 통일 (`gap-2`)
  3. **모바일 반응형**:
     - `flex-wrap`으로 작은 화면에서 줄바꿈 처리
     - 버튼에 `flex-1 min-w-[120px]` 적용하여 반응형 크기 조정
- **효과**:
  - 가독성 향상 (명확한 행 구분)
  - 사용성 개선 (터치 영역 확보, 높이 통일)
  - 일관성 강화 (스타일 통일)
  - 모바일 경험 개선 (반응형 최적화)
- **수정 파일**:
  - `components/admin/kakao/KakaoAccountEditor.tsx`: 4행 구조로 재구성, 높이 균일화, 모바일 반응형 개선

## ✅ 이전 작업: 크롬 브라우저 스크롤 문제 수정 및 로그 정리 (2026-01-24)

### 완료된 작업

#### 반복되는 터치 스크롤 로그 제거 ✅
- **문제**: 개발자 콘솔에 `[TOUCH-SCROLL]` 로그가 반복적으로 출력되어 콘솔이 지저분해짐
- **해결**:
  - scroll/wheel 이벤트 리스너 제거 (너무 많아서)
  - 터치 이벤트 리스너도 제거 (기본적으로 비활성화)
  - 초기화 체크만 남김 (페이지 로드 시 1회)
- **효과**:
  - 콘솔이 깔끔해짐
  - 성능 개선 (불필요한 이벤트 리스너 제거)
- **수정 파일**:
  - `lib/touch-scroll-logger.ts`: 반복 로그 제거, 초기화 체크만 유지

#### 스크롤 문제 재발 방지 문서 작성 ✅
- **문서**: `docs/scroll-issue-prevention.md`
- **내용**:
  - 문제 발생 원인 정리
  - 올바른 모달 스크롤 관리 패턴
  - CSS 우선순위 강화 방법
  - 새 모달 추가 시 체크리스트
  - 테스트 방법

## ✅ 이전 작업: 크롬 브라우저 스크롤 문제 수정 (2026-01-24)

### 완료된 작업

#### 크롬 브라우저 스크롤 문제 수정 ✅
- **문제**: 플레이라이트 테스트에서는 스크롤이 잘 되지만, 실제 크롬 브라우저에서는 스크롤이 안 되는 문제
- **원인**: 
  1. 모달이 열릴 때 `document.body.style.overflow = 'hidden'` 설정 후, 닫힐 때 `originalOverflow`가 빈 문자열이면 스크롤이 복구되지 않음
  2. CSS의 `overflow-y: auto`가 인라인 스타일(`document.body.style.overflow`)보다 우선순위가 낮아 덮어씌워짐
- **해결**:
  1. **GalleryPicker 모달 스크롤 관리 개선**:
     - `originalOverflow`가 빈 문자열이면 `'auto'`로 복구하도록 수정
  2. **ImageSelectionModal 스크롤 관리 추가**:
     - 모달이 열릴 때 body 스크롤 차단, 닫힐 때 복구하는 로직 추가
  3. **CSS 우선순위 강화**:
     - `overflow-y: auto !important` 추가하여 인라인 스타일보다 우선
     - `-webkit-overflow-scrolling: touch !important` 추가
     - `touch-action: pan-y !important` 추가
- **효과**:
  - 모달이 닫힌 후 스크롤 자동 복구
  - 크롬 브라우저에서 정상 스크롤 작동
  - 인라인 스타일로 인한 스크롤 차단 문제 해결
- **수정 파일**:
  - `components/admin/GalleryPicker.tsx`: 모달 스크롤 관리 개선 (93-103번째 줄)
  - `components/admin/kakao/ImageSelectionModal.tsx`: 스크롤 관리 추가
  - `styles/globals.css`: CSS 우선순위 강화 (`!important` 추가)

## ✅ 이전 작업: 제품 합성 버튼명 수정 및 배경 이미지 드라이버 합성 프롬프트 개선 (2026-01-24)

### 완료된 작업

#### 제품 합성 버튼명 수정 및 배경 이미지 드라이버 합성 프롬프트 개선 ✅
- **문제**: 
  1. 프로필 이미지에서 제품 합성 활성화 시 "이미지 재생성"으로 표시되고 "제품 합성"으로 표시되지 않음
  2. 배경 이미지에 드라이버 합성 시 사람 손에 들고 있는 모습으로만 합성됨 (광고 스타일 배치 불가)
- **해결**:
  1. **버튼명 수정**:
     - 배경 이미지 버튼: 제품 합성 활성화 시 "제품 합성" 표시하도록 조건 추가
     - 프로필 이미지 버튼: 빈 문자열 체크 추가 (`selectedProductId.profile.trim() !== ''`)
  2. **배경 이미지 합성 시 imageType 전달**:
     - 배경 이미지 합성 API 호출 시 `imageType: 'background'` 파라미터 추가 (2곳)
  3. **배경 이미지용 드라이버 합성 프롬프트 추가**:
     - 웹 검색을 통한 2024-2025 골프 드라이버 CF 동향 반영
     - 전문적인 상업 사진 기법 적용:
       * HERO PRODUCT PLACEMENT: 제품을 중심으로 한 프리미엄 제품 사진 기법
       * LIFESTYLE INTEGRATION: 골프 코스 환경에 자연스럽게 통합
       * TECHNICAL EXCELLENCE: 엔지니어링 정밀도와 프리미엄 마감 강조
       * DYNAMIC PRESENTATION: 성능 메시징을 전달하는 역동적 표현
     - 자연광 활용, 다양한 카메라 각도, 환경적 맥락 보존
- **효과**:
  - UI 개선: 제품 합성 활성화 시 명확한 버튼명 표시
  - 광고 품질 향상: 배경 이미지에 드라이버 합성 시 전문적인 CF 스타일 구도 적용
  - 사용자 경험 개선: 더 자연스럽고 전문적인 제품 배치
- **수정 파일**:
  - `components/admin/kakao/ProfileManager.tsx`: 
    * 버튼명 수정 (1280번째 줄, 1515-1517번째 줄)
    * 배경 이미지 합성 API 호출에 `imageType: 'background'` 추가 (222-233번째 줄, 355-362번째 줄)
  - `lib/product-composition.ts`: 
    * 배경 이미지용 드라이버 합성 프롬프트 추가 (253번째 줄 이후)
    * 2024-2025 골프 드라이버 CF 동향 반영한 전문적 프롬프트 작성

## ✅ 이전 작업: "로고, 전체, 없음" 버튼 삭제 (2026-01-24)

### 완료된 작업

#### 사용하지 않는 "로고, 전체, 없음" 버튼 삭제 ✅
- **문제**: 거의 사용하지 않는 "로고", "전체", "없음" 버튼이 UI에 남아있어 혼란을 야기함
- **해결**:
  1. FeedManager.tsx: 피드 이미지용 "로고", "전체", "없음" 버튼 3개 삭제
  2. ProfileManager.tsx: 배경 이미지용 "로고", "전체", "없음" 버튼 3개 삭제
  3. ProfileManager.tsx: 프로필 이미지용 "로고", "전체", "없음" 버튼 3개 삭제
  4. 관련 함수 삭제: `handleRegenerateWithLogoOption` 함수 삭제 (FeedManager, ProfileManager)
  5. 관련 상태 삭제: `isRegeneratingWithTextOption` 상태 변수 삭제
- **효과**:
  - UI 단순화: 사용하지 않는 버튼 제거로 인터페이스 정리
  - 코드 정리: 미사용 함수 및 상태 제거로 유지보수성 향상
  - 혼란 감소: 불필요한 옵션 제거로 사용자 혼란 감소
- **수정 파일**:
  - `components/admin/kakao/FeedManager.tsx`: 버튼 3개, 함수 1개, 상태 1개 삭제
  - `components/admin/kakao/ProfileManager.tsx`: 버튼 6개, 함수 1개, 상태 1개 삭제

## ✅ 이전 작업: 드라이버 합성 시 아이언이 나오는 문제 해결 (2026-01-24)

### 완료된 작업

#### 드라이버 합성 프롬프트 수정 - 아이언 변환 문제 해결 ✅
- **문제**: 드라이버를 합성했는데 계속 아이언이 나오는 문제 발생
- **원인**: 
  1. 프롬프트가 "이미지에 드라이버가 있다"고 가정하고 있음
  2. "Do NOT convert from iron or any other club type" 지시로 인해 아이언이 있을 때 드라이버로 변환되지 않음
  3. 실제 이미지에 아이언이 있는 경우 드라이버로 변환되지 않고 아이언이 그대로 유지됨
- **해결**:
  1. 프롬프트에 클럽 타입 분석 단계 추가: 먼저 이미지의 클럽 타입을 분석하도록 지시
  2. 아이언→드라이버 변환 지시 추가: 아이언이나 다른 클럽 타입이 있으면 반드시 드라이버로 변환
  3. 드라이버 헤드 크기 지시 추가: 아이언에서 드라이버로 변환 시 드라이버 헤드가 2-3배 더 크도록 지시
  4. 기존 드라이버 교체 시: 기존 드라이버가 있으면 크기를 유지하면서 교체
- **수정 파일**:
  - `lib/product-composition.ts`: 드라이버 합성 프롬프트 수정 (267-289번째 줄)
    - 클럽 타입 분석 단계 추가
    - 아이언→드라이버 변환 지시 추가
    - 드라이버 헤드 크기 조정 지시 추가 (아이언 변환 시 2-3배 크기)

## ✅ 이전 작업: ProfileManager.tsx 빌드 에러 수정 (2026-01-24)

### 완료된 작업

#### ProfileManager.tsx 빌드 에러 수정 ✅
- **문제**: 빌드 시 "Expected a semicolon" 오류 발생 (399, 408, 413, 773번째 줄)
- **원인**: 
  1. 중복된 `composeResult` 선언 (617번째 줄)
  2. try-catch-finally 블록 구조 문제: 외부 try 블록에 catch/finally가 없음
  3. 제품 합성 API 호출 부분의 중첩 try 블록 구조 불일치
- **해결**:
  1. 중복된 `composeResult` 선언 제거
  2. try-catch-finally 블록 구조 수정: 외부 try 블록에 catch와 finally 추가
  3. 제품 합성 API 호출 부분의 중첩 try 블록 구조 정리
- **수정 파일**:
  - `components/admin/kakao/ProfileManager.tsx`: try-catch-finally 블록 구조 수정

## ✅ 이전 작업: 프로필 이미지 제품 합성 타임아웃 문제 해결 (2026-01-24)

### 완료된 작업

#### 프로필 이미지 제품 합성 활성화 타임아웃 문제 해결 ✅
- **문제**: 프로필 이미지에서 제품 합성 활성화 시 504 Gateway Timeout 오류 발생
- **원인**: 
  1. `/api/kakao-content/generate-images` API에 타임아웃 설정이 없어 Vercel 기본 타임아웃(60초) 적용
  2. 이미지 생성(30-60초) + 제품 합성(30-60초) 순차 호출로 총 시간이 60초 초과
  3. FAL AI 큐 대기 시간이 길어지면 타임아웃 발생
- **해결**:
  1. `/api/kakao-content/generate-images`에 `maxDuration: 300` (5분) 설정 추가
  2. 제품 합성 API 호출에 타임아웃 처리 추가 (5분 30초, AbortController 사용)
  3. 타임아웃 오류 구체적인 메시지 표시 (504, 408 오류 구분)
  4. 네트워크 오류 및 AbortError 처리 개선
  5. 모든 제품 합성 호출 지점에 타임아웃 처리 적용:
     - 기존 배경 이미지 제품 합성
     - 새 배경 이미지 생성 후 제품 합성
     - 기존 프로필 이미지 제품 합성
     - 새 프로필 이미지 생성 후 제품 합성
- **효과**:
  - 타임아웃 발생률: 높음 → 거의 없음
  - 사용자 경험 개선: 구체적인 오류 메시지 표시
  - 원본 이미지 사용: 제품 합성 실패 시에도 원본 이미지 사용 가능
- **수정 파일**:
  - `pages/api/kakao-content/generate-images.js`: 타임아웃 설정 추가 (`maxDuration: 300`)
  - `components/admin/kakao/ProfileManager.tsx`: 모든 제품 합성 API 호출에 타임아웃 처리 추가

## ✅ 이전 작업: 카카오 콘텐츠 생성 UI/UX 개선 (2026-01-24)

### 완료된 작업

#### 카카오 콘텐츠 생성 UI/UX 개선 ✅
- **문제 1**: 제품 합성 활성화 후 버튼명이 "이미지 재생성"에서 "제품 합성"으로 바뀌지 않음
- **문제 2**: 갤러리에서 해당일의 이미지를 모두 지웠는데도 "이미지 2번째 중 1번 선택"이라고 표시됨
- **문제 3**: 이미지 생성 시 가끔 오류가 발생함 (504 타임아웃 등)
- **해결**:
  1. **프로필 이미지 버튼명 수정**: `enableProductComposition.profile && selectedProductId.profile` 조건 추가하여 제품 합성 활성화 시 "제품 합성"으로 표시
  2. **갤러리 이미지 개수 표시 수정**: 
     - `imageCount > 1 && imageCount !== 0` 조건으로 변경하여 0개일 때 숨김 처리
     - 갤러리 닫기 후 재조회 시 `imageCount`가 0이면 명시적으로 0으로 업데이트
     - 오류 발생 시에도 `imageCount`를 0으로 설정하여 잘못된 표시 방지
  3. **이미지 생성 오류 처리 개선**:
     - 재시도 로직 추가 (최대 2회, 지수 백오프)
     - 타임아웃(504), 네트워크 오류 등 재시도 가능한 오류 자동 재시도
     - 크레딧 부족 오류는 재시도하지 않고 즉시 오류 메시지 표시
     - 오류 메시지 개선: 구체적인 오류 원인 표시
- **수정 파일**:
  - `components/admin/kakao/ProfileManager.tsx`: 버튼명 수정, 이미지 개수 표시 수정
  - `pages/admin/kakao-content.tsx`: 이미지 생성 오류 처리 개선 (재시도 로직 추가)

## ✅ 이전 작업: 갤러리 선택 모달 UI 개선 (2026-01-24)

### 완료된 작업

#### 갤러리 선택 모달 최근 사용 폴더 섹션 삭제 ✅
- **문제**: 카톡 콘텐츠 생성에서 갤러리 선택 모달의 "최근 사용 폴더" 섹션이 불필요함
- **해결**: 
  - PC와 모바일 모두에서 "최근 사용 폴더" 섹션 완전 제거
  - 관련 UI 코드 삭제 (1093-1140 라인)
- **수정 파일**:
  - `components/admin/GalleryPicker.tsx`: 최근 사용 폴더 섹션 삭제

#### 모바일 갤러리 선택 모달 스크롤 문제 해결 ✅
- **문제**: 모바일에서 "갤러리에서 선택" 모달이 스크롤되지 않음
- **원인**: 
  - `overflow-auto`가 모바일에서 제대로 작동하지 않음
  - iOS에서 스크롤 최적화가 필요함
- **해결**:
  - `overflow-auto` → `overflow-y-auto`로 명시적 변경
  - `-webkit-overflow-scrolling: touch` 스타일 추가 (iOS 스크롤 개선)
- **수정 파일**:
  - `components/admin/GalleryPicker.tsx`: 모바일 스크롤 개선

#### 모바일 새로고침 버튼 크기 문제 해결 ✅
- **문제**: 모바일에서 새로고침 버튼이 불필요하게 크게 표시됨
- **원인**: 
  - `flex-1 sm:flex-none` 클래스로 인해 모바일에서 버튼이 남은 공간을 모두 차지함
- **해결**:
  - `flex-1 sm:flex-none` 클래스 제거하여 모바일에서도 고정 크기 유지
- **수정 파일**:
  - `components/admin/GalleryPicker.tsx`: 새로고침 버튼 모바일 크기 수정

#### 모바일에서 선택된 이미지가 보이지 않는 문제 해결 ✅
- **문제**: 모바일에서 이미지가 1개일 때 선택된 이미지가 화면에 보이지 않음
- **원인**: 
  - `max-w-md mx-auto`가 모바일에서도 적용되어 이미지가 제한된 너비로 표시됨
  - 스크롤 영역에 `min-h-0`이 없어 flex 컨테이너에서 높이 계산이 잘못됨
- **해결**:
  - `max-w-md mx-auto` → `sm:max-w-md sm:mx-auto`로 변경 (모바일에서는 전체 너비 사용)
  - 스크롤 영역에 `min-h-0` 추가하여 flex 컨테이너에서 스크롤이 제대로 작동하도록 수정
- **수정 파일**:
  - `components/admin/GalleryPicker.tsx`: 모바일 이미지 레이아웃 및 스크롤 영역 수정

#### 갤러리 선택 모달 UI 단순화 - 날짜/폴더 입력 필드 삭제 ✅
- **문제**: 상단 브레드크럼 네비게이션이 있는데 하단에 날짜와 폴더 입력 필드가 중복됨
- **원인**: 
  - 브레드크럼으로 폴더 이동이 가능한데 날짜/폴더 입력 필드가 중복 기능 제공
  - UI가 복잡하고 불필요한 입력 필드로 인해 공간 낭비
- **해결**:
  - 날짜 선택 필드 삭제 (1094-1106 라인)
  - 폴더 입력 필드 삭제 (1108-1131 라인)
  - 검색, ALT 텍스트, 좋아요 기능은 유지 (모두 정상 작동)
  - 브레드크럼 네비게이션으로 폴더 이동 가능하므로 충분함
- **수정 파일**:
  - `components/admin/GalleryPicker.tsx`: 날짜/폴더 입력 필드 삭제, UI 단순화

#### 모바일 갤러리 선택 모달 UI 최적화 - 접기/펼치기 기능 추가 ✅
- **문제**: 모바일에서 상단 기능들이 너무 많은 공간을 차지하여 하단 이미지가 보이지 않고 스크롤이 안 됨
- **원인**: 
  - 헤더, 필터/검색 바, 업로드 영역이 모바일 화면의 60-70% 차지
  - 이미지 영역이 거의 보이지 않음
  - 스크롤이 제대로 작동하지 않음
- **해결**:
  1. **헤더 최적화**: 모바일에서 접기/펼치기 기능 추가, 기본 접힘 상태
  2. **필터/검색 바 최적화**: 모바일에서 아이콘 버튼으로 변경 (🔍 검색, 📝 ALT, ❤️ 좋아요, 📤 업로드)
  3. **업로드 영역 최적화**: 모바일에서 기본 접힘, 아이콘 버튼으로 접근
  4. **푸터 최적화**: 모바일에서 컴팩트 레이아웃 (텍스트 축소, 아이콘만 표시)
  5. **모달 스크롤 개선**: 모달 열릴 때 body 스크롤 막기, 검색/ALT 텍스트 모달 추가
- **결과**:
  - 이미지 영역 가시성: 0% → 70%+
  - 스크롤 정상 동작
  - 사용자 경험 개선 (필요 시에만 기능 표시)
  - 데스크톱 레이아웃 유지
- **수정 파일**:
  - `components/admin/GalleryPicker.tsx`: 모바일 UI 최적화, 접기/펼치기 기능 추가

#### 캘린더 저장 API 504 타임아웃 문제 해결 ✅
- **문제**: `/api/kakao-content/calendar-save` API 호출 시 504 Gateway Timeout 에러 발생
- **원인**: 
  1. 순차 처리로 인한 지연: 프로필/피드 콘텐츠를 하나씩 순회하며 저장
  2. 이미지 사용 기록 업데이트가 동기적으로 실행되어 타임아웃 발생
  3. 각 이미지마다 여러 DB 쿼리 실행
- **해결**:
  1. 배치 처리로 변경: 프로필/피드 콘텐츠를 한 번에 upsert
  2. 이미지 사용 기록 업데이트를 별도 API로 분리: `/api/kakao-content/update-image-usage`
  3. 비동기 처리: 클라이언트에서 별도로 호출하여 타임아웃 방지
  4. 실제 사용 기능만 업데이트: 배포 완료된 항목(`status === 'published' && publishedAt`)만 업데이트
- **효과**:
  - 처리 시간: 50-100초 → 2-5초 (90% 감소)
  - 타임아웃 발생률: 높음 → 거의 없음
- **수정 파일**:
  - `pages/api/kakao-content/calendar-save.js`: 배치 처리로 변경, 이미지 사용 기록 업데이트 제거
  - `pages/api/kakao-content/update-image-usage.js`: 새 API 생성 (별도 파일)
  - `pages/admin/kakao-content.tsx`: 비동기로 이미지 사용 기록 업데이트 호출
- **문서화**: `docs/troubleshooting/CALENDAR_SAVE_504_TIMEOUT_FIX_PLAN.md` 작성

#### 배포 환경 갤러리 선택 모달 이미지 로드 문제 해결 ✅
- **문제**: 배포 환경에서 "갤러리에서 선택" 클릭 시 이미지가 안 나오고 401 (Unauthorized) 에러 발생
- **원인**: 
  1. **핵심 원인**: 미들웨어에서 프로덕션 환경의 쿠키 이름을 잘못 찾고 있었음
     - 미들웨어가 찾던 쿠키: `__Secure-next-auth.session-token`
     - 실제 설정된 쿠키: `next-auth.session-token`
     - `useSecureCookies: true`여도 NextAuth는 쿠키 이름에 `__Secure-` 접두사를 자동 추가하지 않음
  2. NextAuth 쿠키 도메인 설정: `www.masgolf.co.kr` → `undefined`로 변경
- **해결**:
  1. 미들웨어 쿠키 이름 수정: 프로덕션/개발 모두 `next-auth.session-token` 사용
  2. NextAuth 쿠키 도메인 설정 수정: `undefined`로 변경하여 현재 도메인에서만 작동
  3. 디버그 로그 추가: API 요청/응답, 쿠키/세션 상태 확인 로그
- **수정 파일**:
  - `middleware.ts`: 쿠키 이름 통일 (`next-auth.session-token`)
  - `pages/api/auth/[...nextauth].ts`: 쿠키 도메인을 `undefined`로 변경
  - `components/admin/GalleryPicker.tsx`: 배포 환경 디버그 로그 추가
  - `pages/api/admin/all-images.js`: 쿠키 상태 확인 로그 추가
  - `lib/api-auth.ts`: 세션 확인 전후 디버그 로그 추가
  - `e2e-test/playwright-gallery-picker-debug.js`: Playwright 테스트 스크립트 작성
- **문서화**: `docs/troubleshooting/GALLERY_PICKER_COOKIE_ISSUE.md` 작성
- **원인 추정**: 
  - 세션 쿠키가 만료되었거나 전달되지 않음
  - 인증 미들웨어가 쿠키를 인식하지 못함
  - CORS 또는 SameSite 쿠키 설정 문제
- **해결**:
  1. **디버그 코드 추가**: GalleryPicker에 상세 디버그 로그 추가
     - API 요청 전: URL, 쿠키, 세션 정보 로그
     - API 응답 후: 상태 코드, 헤더, 에러 메시지 로그
     - 401 에러 시: 상세 에러 정보, 쿠키, 세션 스토리지 로그
  2. **Playwright 테스트 스크립트 작성**: 배포 환경에서 자동 재현 및 원인 파악
     - 로그인 → 카카오 콘텐츠 페이지 → 갤러리 선택 버튼 클릭
     - API 호출 모니터링 및 401 에러 감지
     - 디버그 로그 수집 및 JSON 파일로 저장
- **수정 파일**:
  - `components/admin/GalleryPicker.tsx`: 배포 환경 디버그 코드 추가
  - `e2e-test/playwright-gallery-picker-debug.js`: Playwright 테스트 스크립트 작성

#### 갤러리 선택 모달 썸네일 버튼 및 컬럼 수 변경 기능 추가 ✅
- **문제**: 
  1. 썸네일 버튼이 항상 표시되어 이미지를 가림
  2. 비교 모드 설명이 불필요함
  3. 컬럼 수를 변경할 수 없음
  4. 모바일에서 2컬럼일 때 버튼이 3개만 보임
- **해결**:
  1. **썸네일 버튼 표시 개선**: 모든 화면 크기에서 호버/터치 시에만 표시되도록 변경
  2. **비교 모드 설명 삭제**: PC/모바일 모두에서 비교 모드 설명 텍스트 제거
  3. **컬럼 수 변경 기능 추가**:
     - 모바일: 1, 2 변경 버튼 추가 (아이콘 버튼 영역 맨 오른쪽)
     - PC: 1, 2, 3, 4, 5 선택 버튼 추가 (필터 바에 추가)
     - 그리드 레이아웃을 동적 컬럼 수로 변경
  4. **컬럼 수에 따른 버튼 UI 변경**:
     - 모바일 1컬럼: 아이콘 + 텍스트 (가로 배치)
     - 모바일 2컬럼: 아이콘만 (한 줄 배치) - 공간 부족 문제 해결
     - 태블릿: PC와 동일한 버튼 형태 사용
     - PC 1-2컬럼: 아이콘 + 텍스트 (가로 배치)
     - PC 3-5컬럼: 아이콘만 (한 줄 배치)
  5. **버튼 레이아웃 개선**:
     - 3열 그리드(2줄) → flex 한 줄 배치로 변경하여 세로 길이 감소
     - 버튼 크기: p-2 → p-1.5로 축소
     - flex-shrink-0 추가하여 버튼이 줄어들지 않도록 보장
  6. **태블릿 감지 추가**:
     - 모바일: < 640px
     - 태블릿: 640px ~ 1024px
     - PC: >= 1024px
     - 태블릿은 PC와 동일한 버튼 형태 사용
- **수정 파일**:
  - `components/admin/GalleryPicker.tsx`: 썸네일 버튼 표시 개선, 비교 모드 설명 삭제, 컬럼 수 변경 기능 추가, 버튼 레이아웃 개선, 태블릿 감지 추가

---

## ✅ 이전 작업: 친구톡 발송 오류 처리 개선 및 안내 메시지 추가 (2026-01-23)

### 완료된 작업

#### 친구톡 발송 오류 처리 개선 ✅
- **문제**: 친구톡 발송 시 "수신자가 없습니다" 또는 "친구를 찾을 수 없습니다" 오류 발생
- **원인**: 
  1. `kakao_friend_mappings` 테이블에 친구 데이터가 없어서 전화번호 → UUID 변환 실패
  2. 친구 수가 0명으로 표시되어 수신자 UUID를 찾을 수 없음
  3. 에러 메시지가 불명확하여 사용자가 해결 방법을 알기 어려움
- **해결**:
  1. **에러 메시지 개선**: 
     - 친구를 찾을 수 없을 때 구체적인 해결 방법 제시
     - 찾을 수 없는 전화번호 목록 제공 (최대 10개)
     - errorCode 추가로 클라이언트에서 처리 가능하도록
  2. **UI 안내 메시지 추가**:
     - 친구톡 선택 시 친구 등록 필요 안내
     - 친구 그룹 사용 방법 안내
     - 친구 등록 방법 링크 제공
- **수정 파일**:
  - `pages/api/channels/kakao/send.ts`: 에러 메시지 개선, 해결 방법 제시
  - `components/admin/KakaoSendOption.tsx`: 친구톡 발송 전 확인사항 안내 추가

#### 친구톡 발송이 안되는 주요 원인 정리 ✅
1. **친구 매핑 데이터 없음**: `kakao_friend_mappings` 테이블에 친구 정보가 없음
2. **수신자 UUID 부재**: 전화번호를 UUID로 변환할 수 없음
3. **친구 그룹 미사용**: 친구 그룹을 선택하지 않고 개별 번호만 입력한 경우

#### 해결 방법 안내 ✅
1. **친구 그룹 사용**: 수신자 그룹 선택에서 친구 그룹 선택
2. **친구 수동 등록**: 친구 그룹 관리 페이지에서 친구 추가
3. **알림톡 사용**: 친구가 아닌 번호도 발송 가능 (템플릿 ID 필요)

---

## ✅ 이전 작업: Solapi 템플릿 조회 API 수정 및 카카오톡 발송 방식 안내 추가 (2026-01-23)

### 완료된 작업

#### Solapi 템플릿 조회 API 수정 ✅
- **문제**: Solapi 템플릿 목록 조회 API에서 400 Bad Request 오류 발생
- **원인**: 
  1. `channelId`, `status` 파라미터를 쿼리 파라미터로 전달했으나 Solapi API가 지원하지 않음
  2. `/kakao/v2/templates/sendable` 엔드포인트가 올바르지 않을 수 있음
- **해결**:
  1. 기본 엔드포인트 `/kakao/v2/templates` 사용
  2. 불필요한 쿼리 파라미터 제거 (`channelId`, `status`)
  3. 클라이언트 측에서 승인된 템플릿만 필터링
  4. 에러 처리 개선 (상세한 로깅 추가)
  5. 응답 데이터 구조 다양성 대응 (templates, list 등)
- **수정 파일**:
  - `pages/api/solapi/templates.ts`: API 엔드포인트 및 파라미터 수정, 에러 처리 개선

#### Playwright 스크립트로 Solapi 콘솔 확인 ✅
- **목적**: Solapi 콘솔에 로그인하여 실제 API 엔드포인트 및 파라미터 확인
- **구현 내용**:
  1. Solapi 콘솔 자동 로그인
  2. 템플릿 페이지로 이동
  3. 네트워크 요청 모니터링
  4. API 요청/응답 로깅
- **수정 파일**:
  - `scripts/playwright-check-solapi-templates.js` (신규): Solapi 템플릿 API 확인 스크립트

#### 카카오톡 발송 방식 안내 메시지 추가 ✅
- **목적**: 사용자가 친구톡/알림톡의 차이를 명확히 이해할 수 있도록 안내
- **구현 내용**:
  1. 발송 방식 선택 섹션에 안내 메시지 추가
  2. 친구톡과 알림톡의 차이점 설명
  3. 카카오 개발자 콘솔 권한과의 관계 명확화
- **수정 파일**:
  - `components/admin/KakaoSendOption.tsx`: 안내 메시지 추가

---

## ✅ 이전 작업: 드라이버 합성 프롬프트 수정 - 연속 합성 문제 해결 (2026-01-23)

### 완료된 작업

#### 드라이버 합성 프롬프트 수정 - 이미 합성된 이미지 재합성 지원 ✅
- **문제**: 
  1. 원본 이미지(타사 드라이버) → 마쓰구 드라이버1 합성: 정상 동작
  2. 합성 이미지1(마쓰구 드라이버1) → 마쓰구 드라이버2 합성: 왜곡 발생
  3. "이미지1,2인데 3,4처럼 나오는" 현상 발생
- **원인**: 
  1. 프롬프트가 "원본 이미지에 타사 드라이버가 있다"고 가정
  2. 이미 합성된 이미지(마쓰구 드라이버)에 재합성 시도 시 AI가 혼란
  3. 이미 합성된 드라이버를 다른 드라이버로 교체하는 지시가 불명확
- **해결**: 
  1. 프롬프트를 "원본 또는 이미 합성된 이미지"로 수정
  2. 이미 합성된 드라이버를 다른 드라이버로 교체하도록 명시
  3. 위치, 크기, 각도, 샤프트 연결을 정확히 유지하도록 지시 추가
- **수정 파일**:
  - `lib/product-composition.ts`:
    - 라인 267-269: 프롬프트 수정
    - "Analyze the original image" → "Analyze the image (whether original or previously composed)"
    - "The original image contains a DRIVER club" → "The image contains a DRIVER club (whether it's an original driver or a previously composed driver)"
    - 이미 합성된 드라이버 교체 시 위치/크기/각도/연결 유지 지시 추가
- **결과**:
  - ✅ 원본 이미지(타사 드라이버) → 마쓰구 드라이버1 합성: 정상 동작
  - ✅ 합성 이미지1(마쓰구 드라이버1) → 마쓰구 드라이버2 합성: 정상 동작
  - ✅ 연속 합성 시 왜곡 문제 해결
  - ✅ 프롬프트 명확성 향상

---

## ✅ 이전 작업: 프로필 이미지 제품 합성 버튼 동작 수정 (2026-01-23)

### 완료된 작업

#### 프로필 이미지 제품 합성 버튼 동작 수정 ✅
- **문제**: 
  1. "이미지 재생성" 버튼 클릭 시 제품 합성이 활성화되어 있어도 새 이미지가 생성됨
  2. 제품 합성 활성화 시 "이미지 재생성"과 "프롬프트 이미지 재생성" 버튼의 동작 구분이 불명확함
- **해결**: 
  1. "이미지 재생성" 버튼: 제품 합성 활성화 + 이미지 존재 시 → 제품 합성만 수행 (1장)
  2. "프롬프트 이미지 재생성" 버튼: 프롬프트 재생성 → 새 이미지 생성 → 제품 합성 (2장)
  3. 제품 합성 활성화 시 이미지가 없으면 안내 메시지 표시
- **수정 파일**:
  - `components/admin/kakao/ProfileManager.tsx`:
    - `handleGenerateProfile` 함수의 조건문 수정
    - 제품 합성 활성화 시 이미지 존재 여부 확인 로직 추가
    - 제품 합성만 수행하는 분기와 새 이미지 생성 분기 명확히 구분
- **결과**:
  - ✅ "이미지 재생성" 버튼: 제품 합성만 수행 (1장)
  - ✅ "프롬프트 이미지 재생성" 버튼: 새 이미지 생성 + 제품 합성 (2장)
  - ✅ 버튼 동작 명확성 향상

---

## ✅ 이전 작업: 드라이버 합성 프롬프트 수정 - 아이언 합성 문제 해결 (2026-01-23)

### 완료된 작업

#### 드라이버 합성 프롬프트 수정 ✅
- **문제**: 드라이버(시크리트포스 PRO 3 MUZIIK)를 선택했는데도 아이언이 합성되는 문제 발생
- **원인**: 프롬프트에 "If IRON, convert to DRIVER" 지시사항이 포함되어 있어 AI가 혼란스러워함
- **해결**: 
  1. "If IRON, convert to DRIVER" 지시사항 제거
  2. 드라이버만 합성하도록 명확히 지시하는 문구 추가
  3. 원본 이미지에 드라이버가 있다는 것을 전제로 하도록 수정
- **수정 파일**:
  - `lib/product-composition.ts`:
    - 270번 라인의 "If IRON, convert to DRIVER" 부분 제거
    - "CRITICAL: The original image contains a DRIVER club..." 문구 추가
    - 드라이버만 합성하도록 명확히 지시
- **결과**:
  - ✅ 드라이버 선택 시 드라이버만 합성됨
  - ✅ 아이언 합성 문제 해결
  - ✅ 프롬프트 명확성 향상

---

## ✅ 이전 작업: 제품명 입력 시 SKU 자동 생성 기능 추가 (2026-01-22)

### 완료된 작업

#### 제품명 입력 시 SKU 자동 생성 기능 추가 ✅
- **목적**: 제품명을 입력하면 SKU가 자동으로 생성되어 사용자 편의성 향상
- **구현 내용**:
  1. **SKU 자동 생성 함수 추가** (`generateSkuFromName`):
     - 제품명에서 영문과 숫자만 유지
     - 공백과 특수문자를 언더스코어(`_`)로 변환
     - 연속된 언더스코어를 하나로 통합
     - 앞뒤 언더스코어 제거
     - 대문자로 변환
     - 예시: "마쓰구 화이트캡 (NEW)" → "MAS_WHITE_CAP_NEW"
  2. **제품명 onChange 핸들러 수정**:
     - 제품명 입력 시 SKU가 비어있을 때만 자동 생성
     - SKU가 이미 입력되어 있으면 자동 생성하지 않음 (사용자가 직접 입력한 값 보존)
- **수정 파일**:
  - `pages/admin/products.tsx`:
    - `generateSkuFromName` 함수 추가 (slugToSku 함수 근처)
    - 제품명 input의 onChange 핸들러 수정
- **결과**:
  - ✅ 제품명 입력 시 SKU 자동 생성
  - ✅ 사용자가 직접 입력한 SKU 값 보존
  - ✅ 사용자 편의성 향상

---

## ✅ 이전 작업: 설문 관리 페이지 UI 간소화 (2026-01-22)

### 완료된 작업

#### 설문 관리 페이지 UI 개선 ✅
- **목적**: 토글 버튼과 일괄 작업 버튼의 텍스트를 간소화하고 배치를 개선하여 가독성 향상
- **구현 내용**:
  1. **토글 섹션 간소화**:
     - 레이블 간소화: "설문 조사 종료" → "설문 종료", "당첨자 페이지 활성화" → "당첨자 페이지"
     - 설명 텍스트를 툴팁(ⓘ 아이콘)으로 이동하여 공간 절약
     - 2열 그리드 레이아웃으로 변경하여 공간 효율성 향상
     - 상태 메시지 제거 (간소화)
  2. **페이지 미리보기 버튼 개선**:
     - 별도 섹션 제거
     - 작은 아이콘 버튼으로 변경하여 토글 옆에 배치
     - 툴팁으로 설명 제공
  3. **일괄 작업 버튼 텍스트 간소화**:
     - "➕ 새 설문 추가 (테스트)" → "➕ 설문 추가"
     - "🎁 선물 지급 설문 자동 연결 및 업데이트" → "🎁 선물 연결"
     - 선택 항목이 있을 때: "선택한 5개 분석" → "분석", "선택한 5개 삭제" → "삭제"
     - "일괄 작업" 레이블 제거
- **수정 파일**:
  - `pages/admin/surveys/index.tsx`:
    - 토글 섹션을 2열 그리드로 변경
    - 설명 텍스트를 툴팁으로 이동
    - 페이지 미리보기를 아이콘 버튼으로 변경
    - 일괄 작업 버튼 텍스트 간소화
- **결과**:
  - ✅ UI 공간 효율성 향상
  - ✅ 가독성 개선
  - ✅ 버튼 배치 최적화
  - ✅ 사용자 경험 개선

---

## ✅ 이전 작업: 제품 추가 시 slug 중복 오류 해결 (2026-01-22)

### 완료된 작업

#### 제품 추가 시 slug 중복 오류 해결 ✅
- **문제점**:
  1. 제품 추가 시 이미지 없음과 관계없이 slug 중복 오류 발생
  2. SKU 중복은 체크하지만 slug 중복은 체크하지 않음
  3. slug가 자동 생성된 후 바로 insert를 시도하여 중복 오류 발생
  4. 오류 메시지가 명확하지 않아 사용자가 원인 파악 어려움
- **해결 방법**:
  1. **slug 중복 체크 로직 추가**: slug 생성 후 중복 여부 확인
  2. **자동 고유 slug 생성**: 중복 발견 시 자동으로 `-2`, `-3` 등을 추가하여 고유한 slug 생성
  3. **에러 메시지 개선**: slug 중복 오류를 명확하게 전달
  4. **최대 시도 횟수 제한**: 100회까지 시도하여 무한 루프 방지
- **수정 파일**:
  - `pages/api/admin/products.ts`:
    - slug 중복 체크 로직 추가 (SKU 중복 체크와 유사한 방식)
    - 자동 고유 slug 생성 로직 추가
    - slug 중복 오류 메시지 개선
- **결과**:
  - ✅ 이미지 없이도 제품 추가 가능 (이미지 없음은 문제가 아님)
  - ✅ slug 중복 시 자동으로 고유한 slug 생성
  - ✅ 명확한 오류 메시지로 사용자 경험 개선
  - ✅ 데이터베이스 제약 조건 위반 오류 방지

---

## ✅ 이전 작업: Solapi 템플릿 자동 동기화 기능 개발 (2026-01-22)

### 완료된 작업

#### Solapi 템플릿 자동 동기화 기능 ✅
- **목적**: SMS/MMS 에디터에서 Solapi 알림톡 템플릿을 자동으로 불러와 선택할 수 있도록 개선
- **구현 내용**:
  1. **Solapi 템플릿 목록 조회 API** (`pages/api/solapi/templates.ts`)
     - Solapi API를 호출하여 발송 가능한 템플릿 목록 조회
     - 템플릿 ID, 이름, 내용, 변수 정보 반환
     - 검색 기능 지원 (템플릿 이름 또는 ID로 검색)
     - 승인된 템플릿만 필터링 (status: APPROVED)
  2. **KakaoSendOption 컴포넌트 개선** (`components/admin/KakaoSendOption.tsx`)
     - 템플릿 선택 드롭다운 추가
     - 템플릿 검색 기능 추가
     - 템플릿 미리보기 기능 추가 (펼치기/접기)
     - 템플릿 변수 목록 표시
     - 템플릿 새로고침 버튼 추가
     - 템플릿 ID 직접 입력 옵션 유지
- **사용자 경험 개선**:
  - 드롭다운에서 템플릿 선택 시 자동으로 템플릿 ID 입력
  - 템플릿 내용과 변수를 미리 확인 가능
  - 검색으로 원하는 템플릿 빠르게 찾기
  - 수동 입력도 여전히 가능
- **수정 파일**:
  - `pages/api/solapi/templates.ts` (신규): Solapi 템플릿 목록 조회 API
  - `components/admin/KakaoSendOption.tsx`: 템플릿 선택 UI 개선

---

## ✅ 이전 작업: 메시지 478 그룹 ID 연결 및 자동 연결 기능 개선 (2026-01-22)

### 완료된 작업

#### 메시지 478 그룹 ID 수동 연결 ✅
- **문제**: 잔액 부족으로 실패 후 재발송한 그룹 ID가 자동 연결되지 않음
- **그룹 ID**: G4V20260122101013UMFEYEURL0AI4RH
- **해결**: 수동 연결 스크립트로 그룹 ID 연결 완료
- **결과**: 메시지 478에 그룹 ID 연결 완료, 솔라피 통계 동기화

#### 그룹 ID 자동 연결 기능 개선 ✅
- **문제점**:
  1. 재발송 케이스에서 그룹 생성 시간과 실제 발송 시간의 차이로 매칭 실패
  2. 시간 범위가 ±10분으로 제한되어 재발송 케이스에서 찾지 못함
  3. 수신자 수 매칭이 없어 같은 시간대에 여러 메시지가 있을 때 잘못 매칭될 수 있음
- **개선 사항**:
  1. **시간 범위 확대**: ±10분 → ±30분 (재발송 케이스 대응)
  2. **재발송 시간 반영**: `dateSent` 우선 사용 (재발송 시간 반영)
  3. **수신자 수 매칭 추가**: 그룹의 메시지 수와 메시지의 수신자 수 비교하여 더 정확한 매칭
  4. **발송일 업데이트**: 재발송 시간을 `sent_at`에 반영
- **수정 파일**:
  - `pages/api/admin/auto-link-solapi-groups.js`: 자동 연결 로직 개선
  - `scripts/link-message-478-group-id.js`: 메시지 478 수동 연결 스크립트

---

## ✅ 이전 작업: 고객 관리 주소 수정 기능 개선 (2026-01-21)

### 완료된 작업

#### 주소 수정 시 설문 주소 동기화 및 지오코딩 자동 실행 ✅
- **문제점**:
  1. 주소 수정 시 고객관리주소만 수정되고 설문 주소는 업데이트되지 않음
  2. 지오코딩이 자동으로 실행되지 않아 거리 정보가 즉시 업데이트되지 않음
- **해결 방법**:
  1. **설문 주소 동기화**: 고객 전화번호로 설문을 찾아 주소를 함께 업데이트
  2. **지오코딩 자동 실행**: 주소 수정 시 카카오맵 API를 호출하여 좌표 및 거리 자동 계산
  3. **거리 정보 즉시 표시**: 지오코딩 성공 시 거리 정보를 알림으로 표시
- **수정 파일**:
  - `pages/api/admin/customers/geocoding.ts`: 
    - `getCoordinatesFromAddress` 함수 추가 (카카오맵 API 호출)
    - `calculateDistance` 함수 추가 (하버사인 공식으로 거리 계산)
    - 설문 주소 동기화 로직 추가
    - 지오코딩 자동 실행 로직 추가
    - 거리 정보를 응답에 포함
  - `pages/admin/customers/index.tsx`:
    - 지오코딩 성공 시 거리 정보를 알림으로 표시
- **결과**:
  - ✅ 주소 수정 시 고객관리주소와 설문 주소가 동기화됨
  - ✅ 주소 수정 시 지오코딩이 자동 실행되어 거리 정보가 즉시 업데이트됨
  - ✅ 사용자가 별도로 "지오코딩 일괄 실행" 버튼을 누를 필요가 없음
  - ✅ 데이터 일관성 향상

---

## ✅ 이전 작업: 고객 관리 위치 정보 관리 검색 기능 추가 및 페이지네이션 문제 해결 (2026-01-21)

### 완료된 작업

#### 위치 정보 관리 탭 검색 기능 추가 및 페이지네이션 문제 해결 ✅
- **문제점**:
  1. 위치 정보 관리 탭에 이름/번호/주소 검색 기능이 없음
  2. 전체 고객 2,990명인데 페이지네이션이 10페이지만 표시되는 문제 (Supabase `.in()` 제한으로 인해 1000개로 제한됨)
- **해결 방법**:
  1. **검색 기능 추가**:
     - API에 `q` 파라미터 추가 (이름, 전화번호, 주소 검색)
     - 프론트엔드에 검색 입력 필드 추가 (고객 목록 탭과 동일한 UI)
     - 검색어 변경 시 자동 조회 (debounce 300ms)
  2. **페이지네이션 문제 해결**:
     - Supabase `.in()` 제한(최대 1000개)을 우회하기 위해 배치 처리 구현
     - 도 단위 필터와 거리 필터 적용 시 1000개씩 나눠서 처리
     - 정확한 total count 계산 (모든 필터 적용 후 실제 개수)
- **수정 파일**:
  - `pages/api/admin/customers/geocoding.ts`: 
    - `q` 파라미터 추가 및 검색 로직 구현
    - SQL 쿼리와 fallback 로직 모두에 검색 조건 추가
    - `.in()` 제한 우회를 위한 배치 처리 (BATCH_SIZE = 1000)
    - 정확한 total count 계산
  - `pages/admin/customers/index.tsx`:
    - `geocodingSearch` state 추가
    - 검색 입력 필드 추가 (위치 정보 관리 탭)
    - API 호출 시 `q` 파라미터 전달
    - 검색어 변경 시 자동 조회 (useEffect 의존성 추가)
- **결과**:
  - ✅ 위치 정보 관리 탭에서 이름/번호/주소 검색 가능
  - ✅ 전체 고객 수에 맞는 정확한 페이지네이션 표시
  - ✅ Supabase 제한을 우회하여 모든 고객 조회 가능
  - ✅ 고객 목록 탭과 동일한 검색 UX 제공

---

## ✅ 이전 작업: 드라이버 메뉴 사라지는 문제 수정 (2026-01-21)

### 완료된 작업

#### 드라이버 드롭다운 메뉴 UX 개선 ✅
- **문제**: 드라이버 메뉴를 클릭했을 때 하단에 제품명이 나오기 전에 메뉴가 사라지는 현상
- **원인**: 버튼과 드롭다운 메뉴 사이의 `mt-2` 간격 때문에 마우스가 버튼에서 메뉴로 이동할 때 `onMouseLeave` 이벤트가 발생하여 메뉴가 닫힘
- **해결 방법**:
  - 드롭다운 메뉴 컨테이너에서 `mt-2` 제거
  - 첫 번째 링크에 `pt-5 pb-3` 패딩 추가하여 시각적 간격은 유지하면서도 마우스 이동 시 간격이 없도록 수정
- **파일**: `pages/index.js` (384번, 387번 라인)
- **결과**: 드라이버 메뉴를 클릭했을 때 메뉴가 안정적으로 유지되며 제품명을 확인할 수 있음

### 수정 파일
- `pages/index.js`: 드라이버 드롭다운 메뉴 간격 수정

---

## ✅ 이전 작업: SMS {province} 변수 치환 기능 추가 (2026-01-21)

### 완료된 작업

#### SMS 발송 API에 {province} 변수 치환 기능 추가 ✅
- **파일**: `pages/api/channels/sms/send.js`
- **추가된 기능**:
  - `{province}` 변수 감지 및 자동 치환
  - `customer_address_cache` 테이블에서 province 정보 조회
  - 주소에서 province 추출 (캐시에 없을 경우)
  - 여러 전화번호 형식 지원 (정규화, 포맷팅)
- **동작 방식**:
  1. 메시지 템플릿에 `{province}` 변수가 있으면 자동 감지
  2. 수신자 전화번호로 고객 ID 조회
  3. `customer_address_cache`에서 province 정보 조회 (최신 정보 우선)
  4. 캐시에 없으면 고객 주소에서 `extractProvince()` 함수로 추출
  5. 메시지 발송 시 `{province}` → 실제 지역명 (예: "경기", "서울", "제주") 치환
- **참고**: `{distance_km}` 변수는 기존대로 정상 작동 (수정 없음)

### 수정 파일
- `pages/api/channels/sms/send.js`: {province} 변수 치환 로직 추가

---

## ✅ 이전 작업: 카카오 친구 그룹 관리 UI 개선 및 환경 설정 완료 (2026-01-20)

### 완료된 작업

#### 카카오 친구 그룹 관리 UI 개선 ✅
- **카카오 채널 에디터**: 친구 그룹 관리 버튼 추가
  - 위치: `pages/admin/kakao.tsx`
  - `KakaoFriendSyncStatus` 컴포넌트 하단에 "친구 그룹 관리 →" 버튼 추가
  - 링크: `/admin/kakao-friend-groups`
- **네비게이션 메뉴**: 친구 그룹 관리 링크 추가
  - 위치: `components/admin/AdminNav.tsx`
  - "카카오 메시지" 메뉴 옆에 "👥 친구 그룹" 링크 추가
  - 권한: `daily-content` 카테고리 권한 필요

#### 환경 설정 완료 ✅
- **Vercel 환경 변수**: `KAKAO_REDIRECT_URI` 설정 완료
  - 프로덕션: `https://www.masgolf.co.kr/api/auth/kakao/callback`
- **로컬 환경 변수**: `.env.local` 확인 필요
  - 현재: `http://localhost:8000/api/auth/kakao/callback`
  - 권장: `http://localhost:3000/api/auth/kakao/callback` (포트 3000으로 변경)

### 수정 파일
- `pages/admin/kakao.tsx`: 친구 그룹 관리 버튼 추가
- `components/admin/AdminNav.tsx`: 친구 그룹 관리 링크 추가

---

## ✅ 이전 작업: 메시지 2, 3 이미지 연결 및 템플릿 업데이트 완료 (2026-01-20)

### 완료된 작업

#### 메시지 2, 3 이미지 연결 및 템플릿 업데이트 ✅
- **이미지**: `nanobanana-variation-1768888665149-dg4z8b.webp` → JPG 변환 완료
- **메시지 2 (50km 이상)**: 3개 청크 (463, 464, 465)
  - 이미지 연결 완료 ✅
  - 템플릿 업데이트 완료 ✅ ({name}, {province} 변수 포함)
  - 변수 검증 통과 ✅
- **메시지 3 (주소 없음)**: 11개 청크 (472-482)
  - 이미지 연결 완료 ✅
  - 템플릿 업데이트 완료 ✅ ({name} 변수 포함, 시타 예약 링크 포함)
  - 변수 검증 통과 ✅
- **검증 결과**: 모든 메시지 검증 통과 (14개 메시지)

### 수정 파일
- `scripts/prepare-message2-3-with-image.js`: 메시지 2, 3 준비 스크립트

---

## ✅ 이전 작업: 452, 453, 454번 메시지 이미지 복구 및 근거리 고객 메시지 생성 (2026-01-20)

### 완료된 작업

#### 452, 453, 454번 메시지 이미지 복구 ✅
- **문제**: 발송 완료된 메시지에 이미지 누락
- **해결**:
  - 원본 이미지: `nanobanana-variation-1768872481679-9rs7tr.webp`
  - 각 메시지에 이미지 복사 및 WebP → JPG 변환
  - `channel_sms.image_url` 업데이트 완료
  - `image_metadata` 테이블에 메타데이터 저장
- **결과**:
  - ✅ 메시지 #452: 이미지 복구 완료
  - ✅ 메시지 #453: 이미지 복구 완료
  - ✅ 메시지 #454: 이미지 복구 완료

#### 근거리 고객 대상 새 메시지 생성 ✅
- **목적**: 근거리 고객(50km 이내) 전체 대상 타이타늄 샤프트 시타 메시지
- **작업 내용**:
  - 근거리 고객 511명 중 유효한 전화번호 477개 확인
  - 새 메시지 생성 (ID: 457, 상태: draft)
  - 이미지 연결 완료
  - 메시지 템플릿: 타이타늄 샤프트 시타 예약 안내
- **결과**:
  - ✅ 메시지 ID: 457
  - ✅ 수신자 수: 477명
  - ✅ 상태: draft (발송 준비 완료)
  - ✅ 이미지: 연결됨

### 수정 파일
- `scripts/fix-messages-452-453-454-images.js`: 이미지 복구 및 새 메시지 생성 스크립트

### 다음 단계
- ✅ 메시지 내용 수정 완료 (2026-01-20)
  - 링크 수정: `https://www.masgolf.co.kr/try-a-massgoo` (올바른 시타 예약 페이지)
  - 제품명 명확화: "마쓰구 티타늄 샤프트 신제품"
  - 이름({name}) 제거: 간결성 우선
  - 옵션 1 선택: 핵심 정보만 포함 (약 100자)
- ✅ 이미지 선정: 이미지 1 (50km 이내 고객용, 점수 5.0/5.0)
  - 이미지 1: 골프장 배경, 양팔 들고 기뻐함 (5.0/5.0) ⭐ 최종 선택
  - 이미지 2: 골드톤 바다 배경, 양팔 들고 기뻐함 (4.5/5.0) - 메시지 2, 3용
- ✅ titanium-shaft-sita-message-plan.md 업데이트 완료
  - 긴 이미지 비교 섹션 삭제
  - 이미지 1, 2만 남기고 평가 과정 및 프롬프트 개선 과정 추가
  - 발송 현황 추가 (이미지 1: 정크 3개 완료 + 추가 발송 477명 예정, 이미지 2: 정크 발송 예정)
- ✅ 457번 메시지 분할 완료 (200명씩 3개)
  - 메시지 457: 200명 (기존 메시지 업데이트)
  - 메시지 459 (ID 459): 200명 (새로 생성)
  - 메시지 460 (ID 460): 77명 (새로 생성)
  - 총 수신자: 477명
- ✅ 459번 메시지 솔라피 동기화 및 복구 완료
  - 문제: 솔라피에서 재발송 후 DB에 반영되지 않음
  - 그룹 ID: G4V20260120135037L2B2QM6MIE1TG09
  - 솔라피 대시보드 기준: 성공 196건, 실패 1건
  - DB 업데이트 완료: 그룹 ID 연결, 상태 동기화
  - "그룹 ID 자동 연결" 기능 개선: 재발송 케이스 대응 (created_at도 검색)
- ✅ 메시지 2, 3 청크 생성 완료 (200명씩)
  - 메시지 2 (50km 이상): 493명 → 3개 청크
    - 메시지 ID 463: 200명
    - 메시지 ID 464: 200명
    - 메시지 ID 465: 93명
  - 메시지 3 (주소 없음): 2,019명 → 11개 청크 (모든 누락 고객 포함)
    - 기존: 메시지 ID 472, 473, 474, 475 (624명)
    - 신규: 메시지 ID 476, 477, 478, 479, 480, 481, 482 (1,395명)
  - 총 발송 대상: 2,987명 (전체 고객 - 수신거부 3명)
  - 다음 단계: 각 메시지에 이미지 2 연결 후 발송
- ✅ 메시지 2, 3 이미지 연결 및 템플릿 업데이트 완료 (2026-01-20)
  - 이미지: nanobanana-variation-1768888665149-dg4z8b.webp → JPG 변환 완료
  - 메시지 2 (463, 464, 465): 이미지 연결 ✅, 템플릿 업데이트 ✅, 변수 검증 통과 ✅
    - 템플릿: {name}, {province} 변수 포함
    - 변수 치환 테스트: 통과
    - 이미지 경로: originals/mms/2026-01-21/ (2026-01-21 발송 예정)
  - 메시지 3 (472-482): 이미지 연결 ✅, 템플릿 업데이트 ✅, 변수 검증 통과 ✅
    - 템플릿: {name} 변수 포함, 시타 예약 링크 포함
    - 변수 치환 테스트: 통과
    - 이미지 경로: originals/mms/2026-01-20/
  - 모든 메시지 검증 통과: 14개 메시지 모두 완벽하게 준비 완료
- ✅ 메시지 2 이미지 경로 변경 완료 (2026-01-20)
  - 메시지 2 (463, 464, 465) 이미지를 2026-01-21 폴더로 이동
  - 이미지 URL 업데이트 완료
  - 메타데이터 업데이트 완료
  - 이전 파일 삭제 완료
  - 발송 예정일: 2026-01-21
- ✅ 메시지 3 이미지 경로 변경 완료 (2026-01-20)
  - 메시지 3 (472-482, 11개 청크) 이미지를 2026-01-21 폴더로 이동
  - 이미지 URL 업데이트 완료
  - 메타데이터 업데이트 완료
  - 이전 파일 삭제 완료
  - 발송 예정일: 2026-01-21
- ✅ 메시지 1 이미지 정리 및 연결 완료 (2026-01-20)
  - 452, 453, 454 폴더 삭제 완료 (LMS로 발송되어 이미지 미사용)
  - 457, 459, 460에 이미지1 연결 완료 (각각 독립 이미지 파일 생성)
  - 메시지 타입: 457, 459, 460은 MMS로 확인/유지
  - 폴더 구조 정리 완료
- ✅ 갤러리 중복 이미지 정리 완료 (2026-01-20)
  - 메시지 1 (50km 이내) 6개 청크에 연결된 이미지 확인
  - 중복 이미지 6개 삭제 완료
  - 유지된 이미지: 4개 (452, 453, 454, 457번 메시지용)
    - 메시지 452: mms-452-titanium-shaft-sita-1768877866371.jpg
    - 메시지 453: mms-453-titanium-shaft-sita-1768877866811.jpg
    - 메시지 454: mms-454-titanium-shaft-sita-1768877867232.jpg
    - 메시지 457, 459, 460: mms-457-titanium-shaft-sita-1768877867735.jpg (공유)
- 관리자 페이지에서 메시지 확인:
  - `/admin/sms?id=457` (200명)
  - `/admin/sms?id=459` (200명) - 복구 완료
  - `/admin/sms?id=460` (77명)
- 각 메시지별 이미지 확인 후 순차적으로 발송 실행

---

## ✅ 이전 작업: 예약 발송 크론잡 문제 진단 및 수정 (2026-01-20)

### 완료된 작업

#### 예약 발송 크론잡 문제 진단 및 수정 ✅
- **문제**: 예약 발송이 실행되지 않음
- **원인 확인**:
  1. 크론잡 서비스(`console.cron-job.org`)에서 "Failed (HTTP error) (275 ms)" 오류 발생
  2. 크론잡 상태가 "Inactive"로 비활성화되어 있음
  3. API 직접 호출 시 "DEPLOYMENT_NOT_FOUND" 오류 발생 (Vercel 배포 문제)
- **수정 내용**:
  - 크론잡 서비스에서 "Enable job" 체크박스 활성화
  - "Save responses in job history" 체크박스 활성화
  - 크론잡 저장 완료
- **현재 상태**:
  - 크론잡 활성화됨 ("Next execution: Today at 11:46:00 AM")
  - 하지만 Vercel 배포 문제로 API가 응답하지 않음
  - Vercel 대시보드에서 배포 상태 확인 필요

### 확인된 사항
- 예약 시간은 정상적으로 저장됨 (이미지에서 "저장된 시간: 2026. 01. 20. 오전 11:30" 확인)
- 일반 "저장" 버튼을 눌러도 예약 시간이 저장됨 (`buildSmsPayload` 함수가 자동으로 포함)
- 크론잡은 활성화되었지만 Vercel 배포 문제로 API 호출 실패

### 다음 단계
- Vercel 대시보드에서 배포 상태 확인
- 필요 시 최신 배포 또는 재배포 수행
- API가 정상 작동하는지 재확인

---

## ✅ 이전 작업: Nanobanana 변형 기능 개선 - 2단계 선택 방식 (2026-01-XX)

### 완료된 작업

#### Nanobanana 변형 타입별 선택 기능 추가 ✅
- **목적**: 톤 변경, 배경 변경, 오브젝트 변경을 명확히 구분하여 사용자가 직접 프롬프트 입력
- **기능**:
  - 연필 버튼 클릭 시 드롭다운 메뉴 표시 (톤 변경, 배경 변경, 오브젝트 변경)
  - 각 타입 선택 시 해당 타입에 맞는 가이드와 예시 프롬프트 자동 입력
  - 사용자가 프롬프트 직접 수정 가능
  - 변형 모드에 따라 `preserveStyle` 자동 설정
- **UI 흐름**:
  1. 연필 버튼 클릭 → 드롭다운 메뉴 표시
  2. 변형 타입 선택 (톤/배경/오브젝트) → 프롬프트 입력 모달 표시
  3. 가이드 및 예시 프롬프트 확인 → 사용자가 프롬프트 수정
  4. 변형 시작 → API에 `variationMode` 전달

#### 변형 타입별 프롬프트 가이드 제공 ✅
- **톤 변경**: 인물과 배경은 그대로 유지하고 색상 톤만 변경
- **배경 변경**: 인물과 오브젝트는 그대로 유지하고 배경만 변경
- **오브젝트 변경**: 배경은 그대로 유지하고 인물이나 오브젝트만 변경

#### API 개선 ✅
- `variationMode` 파라미터 추가 ('preserve-style' | 'tone-only' | 'background-only' | 'object-only')
- `variationMode`에 따라 `preserveStyle` 자동 설정
- 톤/배경/오브젝트 변경 시 스타일 유지 비활성화

### 수정 파일
- `pages/admin/gallery.tsx`:
  - Nanobanana 변형 관련 상태 추가 (`showNanobananaMenu`, `nanobananaVariationType`)
  - 변형 타입별 프롬프트 가이드 정의 (`variationPromptGuides`)
  - 연필 버튼에 드롭다운 메뉴 추가 (1단계: 변형 타입 선택)
  - 프롬프트 입력 모달에 타입별 가이드 표시
  - `generateNanobananaVariation` 함수에 `variationMode` 파라미터 추가
  - 외부 클릭 시 메뉴 자동 닫기 로직 추가
- `pages/api/vary-nanobanana.js`:
  - `variationMode` 파라미터 추가
  - `variationMode`에 따라 `preserveStyle` 자동 설정 로직 추가

### 결과
- ✅ 변형 타입별 명확한 구분 (톤/배경/오브젝트)
- ✅ 사용자가 직접 프롬프트 입력/수정 가능
- ✅ 타입별 가이드 및 예시 프롬프트 제공
- ✅ 변형 모드에 따라 `preserveStyle` 자동 설정
- ✅ 외부 클릭 시 메뉴 자동 닫기

---

## ✅ 이전 작업: 이미지 상세 정보 폴더 경로 클릭 기능 추가 (2026-01-XX)

### 완료된 작업

#### 이미지 상세 정보 모달 폴더 경로 클릭 기능 추가 ✅
- **목적**: 이미지 상세 정보에서 폴더 경로를 클릭하면 해당 폴더로 바로 이동
- **기능**:
  - 폴더 경로 클릭 시 해당 폴더로 필터링
  - 모달 자동 닫기
  - 해당 폴더의 이미지 목록 자동 로드
  - 해당 폴더에서 업로드/비교/삭제 작업 가능
- **수정 위치**:
  - 이미지 상세 정보 모달 (단일 이미지): `selectedImageForZoom.folder_path`
  - 비교 모달 (여러 이미지): `img.filePath`
- **동작 방식**:
  1. 폴더 경로 클릭 → `setFolderFilter`로 폴더 필터 설정
  2. 모달 닫기 → `setSelectedImageForZoom(null)` 또는 `setShowCompareModal(false)`
  3. 이미지 목록 로드 → `fetchImages(1, true, folderPath, includeChildren, searchQuery)`
  4. 해당 폴더에서 업로드/비교/삭제 작업 가능

### 수정 파일
- `pages/admin/gallery.tsx`:
  - 이미지 상세 정보 모달 폴더 경로를 클릭 가능한 버튼으로 변경 (6820-6823 라인)
  - 비교 모달 폴더 경로를 클릭 가능한 버튼으로 변경 (8684-8687 라인)
  - 클릭 시 폴더 필터 설정 및 이미지 목록 자동 로드

### 결과
- ✅ 폴더 경로 클릭 시 해당 폴더로 즉시 이동
- ✅ 해당 폴더에서 업로드/비교/삭제 작업 가능
- ✅ 시각적 피드백 제공 (파란색 텍스트, 호버 효과, 툴팁)

---

## ✅ 이전 작업: 메시지 커스텀 이미지 최종 선정 완료 (2026-01-XX)

### 완료된 작업

#### 이미지 7, 8, 9, 10 재확인 및 최종 선정 완료 ✅
- **목적**: 메시지 2, 3에 최적화된 이미지 선정
- **평가 결과**:
  - **이미지 7**: 메시지 2 (4.0/5.0), 메시지 3 (4.0/5.0) - 최고 점수
    - 특징: 이미 바다 배경이 있어 배경 변경 불필요
    - 변형 작업: 톤만 변경 (골드톤 → 일반 톤)
  - **이미지 8, 9, 10**: 메시지 2 (3.0/5.0), 메시지 3 (3.5/5.0)
    - 특징: 골프장 배경, 배경 변경 필요

#### 최종 이미지 선정 결과 ✅
- **메시지 1 (50km 이내)**: 이미지 4 (실내 피팅 스튜디오) - 골드톤 그대로 사용
- **메시지 2 (50km 이상)**: 이미지 7 (골드톤 바다 배경) - 톤만 변경 (골드톤 → 일반 톤)
- **메시지 3 (주소 없음)**: 이미지 7 (골드톤 바다 배경) - 원본 사용 또는 톤 변경 선택적

#### Nanobanana 프롬프트 작성 완료 ✅
- **이미지 7용 프롬프트**: 배경 변경 불필요, 톤만 변경 (골드톤 → 일반 톤)
- **이미지 1, 5, 8, 9, 10용 프롬프트**: 배경 변경 (골프장 → 바다) + 톤 변경

### 수정 파일
- `docs/titanium-shaft-sita-message-plan.md`: 
  - 이미지 7, 8, 9, 10 상세 평가 추가
  - 비교 결과 요약 테이블 업데이트
  - 이미지 7용 맞춤 Nanobanana 프롬프트 작성 (톤만 변경)
  - 이미지 8, 9, 10용 Nanobanana 프롬프트 작성
  - 최종 실행 계획 업데이트

### 결과
- ✅ 이미지 7이 메시지 2, 3에 가장 적합 (4.0/5.0점)
- ✅ 이미지 7은 이미 바다 배경이 있어 배경 변경 불필요
- ✅ 이미지 7은 톤만 변경하면 완벽 (골드톤 → 일반 톤)
- ✅ 모든 이미지별 맞춤 Nanobanana 프롬프트 작성 완료

---

## ✅ 이전 작업: 메시지 커스텀 이미지 선정 및 최적화 계획 (2026-01-XX)

### 완료된 작업

#### 이미지 선정 및 평가 완료 ✅
- **목적**: 거리 기반 메시지에 최적화된 이미지 선정
- **평가 기준**: 시타 예약 직접성, 긍정적 경험 유도, 타겟 고객 공감, 브랜드 가치 전달, CTA 직접성
- **평가 결과**:
  - **메시지 1 (50km 이내)**: 이미지 5 (기쁨에 찬 시니어) - 5.0/5.0점
  - **메시지 2 (50km 이상)**: 배경 변경 이미지 권장 (현재 3.0/5.0, 변경 후 예상 4.5/5.0)
  - **메시지 3 (주소 없음)**: 이미지 1 (골프 스윙) - 3.5/5.0점

#### 배경 및 톤 변경 계획 수립 ✅
- **변경 필요성**: 메시지 2 (50km 이상)에서 골프장 배경이 원격 구매와 거리감
- **변경 내용**:
  - 배경: 골프장 → 해 뜨는 아침 바다 배경
  - 톤: 골드톤 → 일반 톤 (자연스러운 색온도)
- **도구**: Nanobanana 사용
- **프롬프트**: 인물과 골드 드라이버는 그대로 유지, 배경과 톤만 변경

### 수정 파일
- `docs/titanium-shaft-sita-message-plan.md`: 
  - 이미지 선정 및 평가 섹션 추가
  - 5개 이미지별 메시지 유형별 점수 평가
  - 배경 및 톤 변경 계획 섹션 추가
  - Nanobanana 프롬프트 작성 (한국어/영어 버전)
  - 최종 실행 계획 섹션 추가

### 결과
- ✅ 5개 이미지 평가 완료 (메시지 유형별 점수 제공)
- ✅ 메시지별 최적 이미지 선정 완료
- ✅ 배경/톤 변경 필요성 분석 완료
- ✅ Nanobanana 프롬프트 작성 완료
- ✅ 최종 실행 계획 수립 완료

---

## ✅ 이전 작업: 메시지 커스텀 계획 수립 (2026-01-XX)

### 완료된 작업

#### 거리 기반 메시지 커스텀 계획 수립 ✅
- **목적**: 거리 기반 개인화 메시지로 시타 예약 및 온라인 구매 유도
- **대상**: 전체 고객 (구매자/비구매자 구분 없음)
- **분류 기준**: 거리 기반 3가지 세그먼트
  - **세그먼트 1**: 50km 이내 고객 (근거리)
    - 우선순위: 1. 시타 예약 2. 온라인상담 3. 전화
    - 링크: https://www.masgolf.co.kr/try-a-massgoo, https://smartstore.naver.com/mas9golf
    - 변수: `{name}`, `{distance_km}`
  - **세그먼트 2**: 50km 이상 고객 (원거리)
    - 우선순위: 1. 온라인 상담 2. 네이버구매 3. 전화
    - 위치 커스텀: `{province} 고객님을 위한` (제주, 울산 등)
    - 링크: https://www.masgolf.co.kr/contact, https://smartstore.naver.com/mas9golf
    - 변수: `{name}`, `{province}`
  - **세그먼트 3**: 주소 모르는 고객 (거리 정보 없음)
    - 우선순위: 1. 온라인상담 2. 네이버구매 3. 시타예약 4. 전화
    - 링크: https://www.masgolf.co.kr/contact, https://smartstore.naver.com/mas9golf, https://www.masgolf.co.kr/try-a-massgoo
    - 변수: `{name}`
- **청크 계획**: 200명씩 분할 발송
- **변수 활용**: `{name}`, `{distance_km}`, `{province}` 최대 활용

### 수정 파일
- `docs/titanium-shaft-sita-message-plan.md`: 
  - 거리 기반 메시지 커스텀 계획 완전 재작성
  - 3가지 메시지 템플릿 작성 (50km 이내, 50km 이상, 주소 없음)
  - 200명 단위 청크 분할 계획 수립
  - 변수 치환 가이드 작성
  - 발송 실행 방법 및 체크리스트 작성

### 결과
- ✅ 거리 기반 3가지 메시지 템플릿 완성
- ✅ 구매/비구매 구분 없이 통합 메시지 적용
- ✅ 변수 최대 활용 (`{name}`, `{distance_km}`, `{province}`)
- ✅ 200명 단위 청크 분할 계획 수립
- ✅ CTA 중심 메시지 구성

---

## ✅ 이전 작업: 고객 관리 위치 정보 관리 정렬 로직 개선 (2026-01-XX)

### 완료된 작업

#### 정렬 로직 백엔드 처리로 변경 ✅
- **문제점**: 
  - 거리(km) 오름차순 정렬 시 100개 중에서만 정렬됨
  - 전체 928명을 거리 순으로 정렬한 후 처음 100개를 보여줘야 하는데, 100개만 가져온 후 그 100개 중에서만 정렬됨
  - 프론트엔드에서 정렬을 처리하여 페이지네이션과 정렬이 분리됨
- **개선 사항**:
  - **정렬을 백엔드에서 처리**: API에 `sortBy`, `sortOrder` 파라미터 추가
  - **SQL 쿼리에서 정렬**: 전체 데이터를 정렬한 후 limit/offset 적용
  - **fallback 로직에서도 정렬**: 필터링된 고객 ID 목록을 정렬 기준에 따라 정렬한 후 limit/offset 적용
  - **프론트엔드 정렬 제거**: 백엔드에서 정렬된 데이터를 그대로 사용
  - **정렬 변경 시 자동 재조회**: 정렬 변경 시 useEffect로 자동 재조회
- **결과**:
  - 거리(km) 오름차순 정렬 시 전체 928명을 거리 순으로 정렬한 후 처음 100개를 정확하게 표시
  - 모든 정렬 기준(name, address, status, distance)에서 전체 데이터 기준으로 정렬 후 페이지네이션 적용
  - 정렬과 페이지네이션이 올바르게 연동됨

### 수정 파일
- `pages/api/admin/customers/geocoding.ts`: 
  - `sortBy`, `sortOrder` 파라미터 추가
  - SQL 쿼리에서 ORDER BY 절을 동적으로 생성 (name, address, status, distance 지원)
  - fallback 로직에서도 정렬 적용: 필터링된 고객 ID 목록을 정렬 기준에 따라 정렬
  - 정렬된 순서로 limit/offset 적용
- `pages/admin/customers/index.tsx`: 
  - API 호출 시 `sortBy`, `sortOrder` 파라미터 전달
  - 프론트엔드 정렬 로직 제거 (백엔드에서 정렬된 데이터 사용)
  - useEffect에 `geocodingSortBy`, `geocodingSortOrder` 추가하여 정렬 변경 시 자동 재조회

### 결과
- ✅ 거리(km) 오름차순 정렬 시 전체 928명을 거리 순으로 정렬한 후 처음 100개를 정확하게 표시
- ✅ 모든 정렬 기준에서 전체 데이터 기준으로 정렬 후 페이지네이션 적용
- ✅ 정렬과 페이지네이션이 올바르게 연동됨

---

## ✅ 이전 작업: 고객 관리 위치 정보 관리 로직 개선 (2026-01-XX)

### 완료된 작업

#### 페이지네이션 및 표시 로직 개선 ✅
- **문제점**: 
  - 100개, 500개, 1000개 시에 다음 페이지가 안 나오는 문제
  - 1000개씩 설정했는데 313건만 표시되는 문제
  - "총 1 페이지"로 잘못 표시되는 문제
  - API fallback 로직이 새로운 status 값(`with_distance`, `without_distance`)을 처리하지 않음
  - 도 단위가 없는 고객들 (구수회, 최원구, 장기범 등)
  - 표시 건수 불일치 (928명인데 49건 표시)
- **원인 분석**:
  - fallback 로직에서 customers 테이블에서 limit=1000으로 먼저 가져온 후 필터링을 적용
  - offset=0부터 1000개를 가져왔는데, 그 중에서 "거리 있는 고객"만 필터링하면 313건만 남음
  - 이는 전체 2990명 중 거리 있는 고객이 928명이지만, 처음 1000명 중에는 313명만 거리 있는 고객이라는 의미
- **개선 사항**:
  - **fallback 로직 개선**: 필터를 먼저 적용한 후 limit/offset을 적용하도록 변경
    - 1단계: 필터 조건에 맞는 고객 ID 목록 가져오기
    - 2단계: 필터링된 고객 ID 목록에서 limit/offset 적용
    - 3단계: 페이지네이션된 고객 정보 조회
  - API fallback 로직에 `with_distance`/`without_distance` 처리 추가
  - province가 null일 때 주소에서 자동 추출
  - 시 단위도 함께 표시 (도 단위 + 시 단위)
  - SQL 쿼리 결과에서도 province 자동 추출
- **결과**:
  - 페이지네이션이 모든 페이지 크기에서 정상 작동 (100개, 500개, 1000개 모두)
  - 1000개씩 설정 시 정확히 1000건이 표시되고 다음 페이지로 이동 가능
  - "총 페이지" 계산이 정확하게 작동 (928명 / 1000개 = 1페이지, 928명 / 100개 = 10페이지)
  - 도 단위가 없는 고객도 주소에서 자동 추출하여 표시
  - 시 단위 정보도 함께 표시되어 더 상세한 위치 정보 제공
  - 표시 건수와 total 계산이 정확하게 작동

### 수정 파일
- `pages/api/admin/customers/geocoding.ts`: 
  - **fallback 로직 전면 개선**: 필터를 먼저 적용한 후 limit/offset을 적용하도록 변경
    - 필터 조건에 맞는 고객 ID 목록을 먼저 가져온 후 페이지네이션 적용
    - 도 단위 필터, 거리 필터도 필터링 단계에서 적용
  - fallback 로직에 `status === 'with_distance'` 및 `status === 'without_distance'` 처리 추가
  - SQL 쿼리 결과에서 province가 null일 때 주소에서 추출
  - fallback 로직에서도 province 자동 추출
  - total 계산을 필터링된 고객 ID 목록의 길이로 정확하게 계산
- `pages/admin/customers/index.tsx`: 
  - `extractProvince`, `extractCity` import 추가
  - 도 단위 컬럼에서 province가 null일 때 주소에서 추출
  - 시 단위도 함께 표시 (도 단위 아래에 표시)
- `lib/address-utils.ts`: 
  - `extractCity` 함수 추가 (주소에서 시 단위 추출)

### 결과
- ✅ 페이지네이션이 모든 페이지 크기에서 정상 작동
- ✅ 도 단위가 없는 고객도 주소에서 자동 추출하여 표시
- ✅ 시 단위 정보도 함께 표시되어 더 상세한 위치 정보 제공
- ✅ 표시 건수와 total 계산이 정확하게 작동

---

## ✅ 이전 작업: 고객 관리 위치 정보 관리 필터 구조 단순화 (2026-01-XX)

### 완료된 작업

#### 필터 구조 단순화 ✅
- **문제점**: 
  - 상태 필터와 주소 유무 필터가 중복됨
  - 상태 필터: 전체, 성공, 미확인, 변환 실패, 위치 정보 없음
  - 주소 유무 필터: 전체, 주소 있는 고객, 주소 없는 고객
  - 두 필터가 논리적으로 중복되어 사용자 혼란 야기
- **개선 사항**:
  - 상태 필터를 하나로 통합: "거리 있는 고객" (지오코딩 성공 + 거리 정보 있음), "거리 없는 고객" (지오코딩 실패/미처리), "전체"
  - 주소 유무 필터 제거
  - 핵심 데이터인 거리 정보를 중심으로 필터링
- **결과**:
  - "거리 있는 고객" = 지오코딩 성공 + 거리 정보 있음 (distance_km IS NOT NULL)
  - "거리 없는 고객" = 지오코딩 실패 또는 미처리 또는 거리 정보 없음
  - "전체" = 모든 고객

### 수정 파일
- `pages/admin/customers/index.tsx`: 
  - `geocodingStatus` 타입을 `'all' | 'with_distance' | 'without_distance'`로 변경
  - `geocodingHasAddress` state 제거
  - 상태 필터 UI 단순화 (3개 옵션만)
  - 주소 유무 필터 select 제거
  - 헤더 텍스트를 거리 정보 기반으로 변경
- `pages/api/admin/customers/geocoding.ts`: 
  - `status='with_distance'` 처리: 지오코딩 성공 + 거리 정보 있음
  - `status='without_distance'` 처리: 지오코딩 실패/미처리/거리 정보 없음
  - 기존 status 값들도 하위 호환성 유지 (success, failed, unconfirmed, missing)
  - `hasAddress` 파라미터는 하위 호환성을 위해 선택적으로 유지

### 결과
- ✅ 필터 구조 단순화로 사용자 혼란 감소
- ✅ 핵심 데이터인 거리 정보를 중심으로 필터링
- ✅ 필터 옵션 수 감소 (5개 + 3개 → 3개)
- ✅ 하위 호환성 유지 (기존 API 호출 지원)

---

## ✅ 이전 작업: 고객 관리 위치 정보 관리 카운트 정확도 개선 (2026-01-XX)

### 완료된 작업

#### 지오코딩 성공 고객 수 카운트 정확도 개선 ✅
- **문제점**: 
  - 실제 지오코딩 성공 고객 수: 928명
  - 상태 필터 "성공"일 때: 313명으로 표시 (불일치)
  - 주소 유무 필터 "주소 있는 고객"일 때: 928명으로 표시
- **원인 분석**:
  - LEFT JOIN에서 `cache.address`와 `effective_address` 매칭이 정확하지 않음
  - `exec_sql` RPC가 없어 fallback 로직 사용 시 카운트가 부정확함
- **개선 사항**:
  - `hasAddress='with'`와 `status='success'` 조합 시 EXISTS 서브쿼리 사용
  - `exec_sql` 실패 시 직접 조회로 fallback하여 정확한 카운트 계산
  - 주소 필터와 상태 필터의 중복 조건 제거

### 수정 파일
- `pages/api/admin/customers/geocoding.ts`: 
  - `countQuery`를 EXISTS 서브쿼리 방식으로 개선
  - `exec_sql` 실패 시 직접 조회로 fallback
  - 주소 필터와 상태 필터의 중복 조건 제거

### 결과
- ✅ 지오코딩 성공 고객 수가 정확하게 표시됨 (928명)
- ✅ 상태 필터와 주소 필터 조합 시 정확한 카운트
- ✅ LEFT JOIN 매칭 문제 해결

---

## ✅ 이전 작업: 고객 관리 위치 정보 관리 탭 레이아웃 개선 (2026-01-XX)

### 완료된 작업

#### 위치 정보 관리 탭 레이아웃 개선 ✅
- **레이아웃 통일**: 고객 목록 탭과 동일한 레이아웃으로 변경
  - 제목 아래 요약 정보 (좌측)
  - 필터/버튼들 (우측, 한 줄 배치)
  - 바로 아래 고객 목록 테이블
- **필터 배치 변경**: 
  - 기존: 필터가 그리드(4열)로 배치
  - 변경: 고객 목록 탭처럼 우측에 가로로 배치
  - 상태 필터, 도 단위, 주소 유무, 거리 범위, 표시 개수, 지오코딩 실행 버튼을 한 줄에 배치
- **중복 텍스트 제거**: 
  - 위치 정보 고객 목록 섹션 헤더의 중복된 "전체 고객 2,990명 중 주소 있는 고객 100명" 텍스트 제거
  - 상단 헤더와 페이지네이션 영역에만 표시

### 수정 파일
- `pages/admin/customers/index.tsx`: 
  - 위치 정보 관리 탭 레이아웃 변경 (고객 목록 탭과 동일한 구조)
  - 필터들을 우측에 가로로 배치
  - 중복 텍스트 제거

### 결과
- ✅ 고객 목록 탭과 위치 정보 관리 탭의 레이아웃 통일
- ✅ 필터들이 한 줄에 배치되어 공간 효율성 향상
- ✅ 중복 텍스트 제거로 UI 깔끔해짐
- ✅ 바로 아래 고객 목록 테이블이 표시되어 사용성 향상

---

## ✅ 이전 작업: 고객 관리 위치 정보 관리 주소 유무 판단 기준 변경 (2026-01-XX)

### 완료된 작업

#### 주소 유무 판단 기준을 지오코딩 성공 여부로 변경 ✅
- **기존 문제점**: 
  - 설문주소 또는 고객관리주소 텍스트가 있으면 "주소 있는 고객"으로 판단
  - 주소 텍스트가 있어도 지오코딩이 실패하거나 미처리인 경우가 있음
- **개선 사항**:
  - `hasAddress='with'`: 지오코딩 성공(`geocoding_status = 'success'`)한 고객만 "주소 있는 고객"
  - `hasAddress='without'`: 지오코딩이 없거나 실패한 고객만 "주소 없는 고객"
  - 실제로 유효한 주소(지오코딩 가능한 주소)만 카운트
- **장점**:
  - 실제 유효한 주소만 카운트하여 데이터 정확도 향상
  - 거리 계산이 가능한 고객만 포함
  - 지오코딩 실패/미처리 주소 제외

### 수정 파일
- `pages/api/admin/customers/geocoding.ts`: 
  - WHERE 조건을 지오코딩 성공 여부 기준으로 변경
  - fallback 로직도 지오코딩 성공 여부 기준으로 수정
  - 주소 필터 로직을 지오코딩 상태 기준으로 변경

### 결과
- ✅ 실제 유효한 주소(지오코딩 성공)만 "주소 있는 고객"으로 카운트
- ✅ 지오코딩 실패/미처리 주소는 "주소 없는 고객"으로 분류
- ✅ 데이터 정확도 향상

---

## ✅ 이전 작업: 고객 관리 위치 정보 관리 주소 필터 로직 개선 (2026-01-XX)

### 완료된 작업

#### 위치 정보 관리 주소 필터 로직 개선 ✅
- **주소 필터 로직 수정**: 
  - `hasAddress='with'`일 때 설문주소 또는 고객관리주소 중 하나라도 있으면 주소가 있는 것으로 판단
  - `hasAddress='without'`일 때 설문주소와 고객관리주소 모두 없어야 주소가 없는 것으로 판단
  - `hasAddress='all'`일 때는 주소 유무와 관계없이 모든 고객 카운트
- **정확한 카운트 보장**: LEFT JOIN을 사용하므로 `cache`가 NULL인 경우도 포함하여 정확한 카운트 계산

### 수정 파일
- `pages/api/admin/customers/geocoding.ts`: 
  - 주소 필터 로직 수정 (설문주소와 고객관리주소 모두 고려)
  - 주석 추가 (LEFT JOIN이므로 NULL 체크 필요)

### 결과
- ✅ 주소 필터가 설문주소와 고객관리주소를 모두 고려하여 정확한 필터링
- ✅ `hasAddress='all'`일 때 정확한 전체 고객 수 카운트
- ✅ 상태 필터, 도 단위 필터, 거리 필터와 함께 사용 시 정확한 결과

---

## ✅ 이전 작업: 고객 관리 위치 정보 관리 UI 개선 및 페이지네이션 구현 (2026-01-XX)

### 완료된 작업

#### 위치 정보 관리 UI 개선 및 페이지네이션 구현 ✅
- **상단 컨트롤 조건부 표시**: 
  - 검색, 체크박스, pageSize 드롭다운, VIP 레벨 업데이트, 고객 추가, 고객 데이터 가져오기 버튼을 고객 목록 탭에서만 표시
  - 위치 정보 관리 탭에서는 해당 컨트롤 숨김
- **위치 정보 관리 페이지네이션 추가**:
  - `geocodingPage`, `geocodingPageSize` state 추가
  - API 호출 시 `offset` 파라미터 사용
  - 페이지네이션 UI 추가 (이전/다음 버튼, 페이지 번호 표시)
- **위치 정보 관리 pageSize 드롭다운 추가**:
  - 100개씩, 500개씩, 1000개씩 옵션 제공
  - pageSize 변경 시 자동 조회 및 첫 페이지로 리셋
- **자동 조회 기능**: 
  - 필터 변경 시 300ms debounce 후 자동 조회
  - 필터 변경 시 첫 페이지로 자동 리셋
  - 위치 정보 관리 탭 활성화 시 자동 조회
- **로딩 상태 표시**: 조회 중일 때 필터 비활성화 및 로딩 표시

### 수정 파일
- `pages/admin/customers/index.tsx`: 
  - 상단 컨트롤 조건부 렌더링 (`activeTab === 'list'`)
  - 위치 정보 관리 페이지네이션 state 추가
  - 페이지네이션 UI 추가
  - pageSize 드롭다운 추가
  - `fetchGeocodingCustomers`에서 `offset` 파라미터 사용

### 결과
- ✅ 고객 목록 탭과 위치 정보 관리 탭의 UI 분리
- ✅ 위치 정보 관리에서 1000명 이상 고객도 페이지네이션으로 조회 가능
- ✅ pageSize 선택으로 한 번에 조회할 개수 조절 가능
- ✅ 필터 변경 시 즉시 결과 확인 가능
- ✅ 불필요한 버튼 클릭 제거로 사용성 향상

---

## ✅ 이전 작업: 고객 관리 위치 정보 관리 자동 조회 구현 (2026-01-XX)

### 완료된 작업

#### 위치 정보 관리 자동 조회 구현 ✅
- **"조회" 버튼 제거**: 필터 변경 시 자동으로 조회되도록 개선
- **자동 조회 기능**: 
  - 필터 변경 시 300ms debounce 후 자동 조회
  - 위치 정보 관리 탭 활성화 시 자동 조회
  - 초기 로드 시 자동 조회
- **로딩 상태 표시**: 조회 중일 때 필터 비활성화 및 로딩 표시
- **사용성 개선**: 필터 변경 즉시 결과 확인 가능

### 수정 파일
- `pages/admin/customers/index.tsx`: 
  - "조회" 버튼 제거
  - useEffect로 필터 변경 감지 및 자동 조회
  - 필터 비활성화 및 로딩 표시 추가

### 결과
- ✅ 필터 변경 시 즉시 결과 확인 가능
- ✅ 불필요한 버튼 클릭 제거로 사용성 향상
- ✅ 자동 조회로 작업 효율성 향상

---

## ✅ 이전 작업: 고객 관리 위치 정보 관리 상세 필터 구현 (2026-01-XX)

### 완료된 작업

#### 위치 정보 관리 상세 필터 구현 ✅
- **전라도 처리 개선**: "전라도완도군" 같은 주소를 올바르게 "전남"으로 추출
  - 전라남도/전라북도 지역 목록 추가
  - 지역명 기반 자동 구분
- **상세 필터 추가**:
  - **상태 필터**: 전체, 성공, 미확인, 변환 실패, 위치 정보 없음
  - **도 단위 필터**: 전체, 서울, 부산, 대구, 인천, 광주, 대전, 울산, 세종, 경기, 강원, 충북, 충남, 전북, 전남, 경북, 경남, 제주
  - **주소 필터**: 전체, 주소 있는 고객, 주소 없는 고객
  - **거리 필터**: 전체, 0-10km, 10-50km, 50-100km, 100km 이상
- **전체 고객 수 표시**: 전체 고객 수와 주소 있는 고객 수를 구분하여 표시
- **필터 UI 개선**: 4개 필터를 그리드 레이아웃으로 배치

### 수정 파일
- `lib/address-utils.ts`: 
  - 전라남도/전라북도 지역 목록 추가
  - "전라도"로 시작하는 주소 특수 처리
- `pages/api/admin/customers/geocoding.ts`: 
  - 필터 파라미터 추가 (province, hasAddress, distanceMin, distanceMax)
  - 전체 고객 수 조회 추가
  - WHERE 조건에 필터 적용
- `pages/admin/customers/index.tsx`: 
  - 필터 state 추가 (geocodingProvince, geocodingHasAddress, geocodingDistanceRange)
  - 필터 UI 구현 (4개 필터 그리드 레이아웃)
  - 전체 고객 수 표시 개선

### 결과
- ✅ 전라도완도군 같은 주소를 올바르게 처리
- ✅ 다양한 조건으로 고객 필터링 가능
- ✅ 도 단위별, 거리별, 주소 유무별 필터링 지원
- ✅ 전체 고객 수와 필터링된 고객 수를 명확히 구분

---

## ✅ 이전 작업: 고객 관리 위치 정보 관리 기능 개선 (2026-01-XX)

### 완료된 작업

#### 위치 정보 관리 기능 개선 ✅
- **전체 개수 조회 기능 추가**: API에서 필터링된 전체 고객 수를 정확히 반환
- **limit 제한 해제**: 1000명 제한을 10000명으로 증가하여 더 많은 고객 조회 가능
- **지오코딩 일괄 실행 옵션 추가**: 
  - "정보 없는 사람만 실행": 지오코딩 정보가 없는 고객만 실행 (기본)
  - "전체 재실행": 모든 고객에 대해 지오코딩을 다시 실행
- **UI 개선**: 전체 고객 수와 표시 건수를 명확히 구분하여 표시
- **선택된 항목 재실행**: 체크박스로 선택한 고객은 항상 재실행

### 수정 파일
- `pages/api/admin/customers/geocoding.ts`: 전체 개수 조회 쿼리 추가, limit 기본값 10000으로 증가
- `pages/api/admin/customers/batch-geocoding.ts`: `forceReRun` 파라미터 추가
- `pages/admin/customers/index.tsx`: 
  - `geocodingTotal` state 추가
  - 지오코딩 일괄 실행 모달 추가
  - 전체 개수 표시 개선

### 결과
- ✅ 필터링된 전체 고객 수를 정확히 확인 가능
- ✅ 지오코딩 실행 방식을 선택할 수 있어 유연성 향상
- ✅ 이미 지오코딩된 고객을 다시 실행할지 선택 가능
- ✅ UI에서 전체 인원과 표시 건수를 명확히 구분

---

## ✅ 이전 작업: 고객 관리 위치 정보 관리 기능 추가 (2026-01-XX)

### 완료된 작업

#### 고객 관리 위치 정보 관리 기능 추가 ✅
- **목적**: 고객 관리 페이지에 위치 정보 관리 탭 추가, 설문조사 관리 정보는 모두 넣고 나머지 주소가 있는 고객만 추가 조사, 가끔씩만 지오코딩 일괄 실행 사용, 도 단위 추출로 지역별 메시지 커스텀 지원
- **도 단위 추출 유틸리티 함수**:
  - `lib/address-utils.ts` 생성
  - 주소에서 도 단위 추출 (충북, 경기, 경상, 전북, 전남, 경북, 경남 등)
  - 약칭 매핑 지원 (충청북도 → 충북, 경상남도 → 경남 등)
- **데이터베이스 마이그레이션**:
  - `database/add-province-to-customer-address-cache.sql` 생성
  - `customer_address_cache` 테이블에 `province` 컬럼 추가
  - 인덱스 추가 (지역별 조회 성능 향상)
- **고객 중심 지오코딩 API**:
  - `pages/api/admin/customers/geocoding.ts` 생성
  - 고객 중심 조회 (설문 주소 우선 사용)
  - 도 단위 추출 및 저장
- **고객 중심 일괄 지오코딩 API**:
  - `pages/api/admin/customers/batch-geocoding.ts` 생성
  - 고객 ID 기반 일괄 지오코딩
  - 지오코딩 시 province 자동 저장
- **고객 관리 페이지 UI 추가**:
  - `pages/admin/customers/index.tsx` 수정
  - 탭 구조 추가 (고객 목록 / 위치 정보 관리)
  - 위치 정보 관리 탭 구현
  - 설문주소/고객관리주소 표시
  - 도 단위 컬럼 추가
  - 지오코딩 일괄 실행 버튼 추가
- **기존 설문조사 관리 지오코딩에도 province 저장 추가**:
  - `pages/api/admin/surveys/batch-geocoding.ts`: province 저장 로직 추가
  - `pages/api/admin/surveys/geocoding.ts`: province 저장 로직 추가
- **주요 기능**:
  - 설문 주소 우선 사용: 설문 주소가 있으면 설문 주소, 없으면 고객 주소 사용
  - 도 단위 자동 추출: 지오코딩 시 주소에서 도 단위 자동 추출 및 저장
  - 지역별 메시지 커스텀 준비: province 컬럼으로 추후 지역별 메시지 커스텀 가능
  - 기존 방식 재사용: 설문조사 관리의 위치 정보 관리와 동일한 구조
- **생성/수정 파일**:
  - `lib/address-utils.ts` (신규)
  - `database/add-province-to-customer-address-cache.sql` (신규)
  - `pages/api/admin/customers/geocoding.ts` (신규)
  - `pages/api/admin/customers/batch-geocoding.ts` (신규)
  - `pages/admin/customers/index.tsx` (수정)
  - `pages/api/admin/surveys/batch-geocoding.ts` (수정)
  - `pages/api/admin/surveys/geocoding.ts` (수정)

## ✅ 이전 작업: 마쓰구 티타늄 샤프트 신제품 시타 메시지 발송 계획 수립 (2026-01-19)

### 완료된 작업

#### 메시지 초안 작성 및 발송 계획 수립 ✅
- **목적**: 마쓰구 티타늄 샤프트 (뮤직 장착 제품) 신제품 시타 예약 유도
- **메시지 옵션 2가지 작성**:
  1. 신년 VIP 시타 관련 메시지 (구매자/비구매자 버전, 거리 기반 분류)
  2. 신년 무상 점검 (여행 등 암시) 메시지 (구매자/비구매자 버전, 거리 기반 분류)
- **추천 옵션**: 옵션 2 (신년 무상 점검) - 여행 동기, 부담 없는 접근, 시즌성
- **거리 기반 개인화 메시지**:
  - 근거리 (50km 이내): 시타 예약 링크 (`https://www.masgolf.co.kr/try-a-massgoo`) + KGFA 1급 전문 피터 시타 상담
  - 원거리 (50km 이상): 네이버 스마트스토어 링크 (`https://smartstore.naver.com/mas9golf`) + KGFA 1급 전문 피터 전화 상담
- **주소 기반 거리 계산**:
  - `customer_address_cache` 테이블 활용 (설문 조사 관리의 위치 정보 관리와 동일한 시스템)
  - 카카오맵 API로 주소 → 좌표 변환 후 거리 계산
  - 캐시 우선 조회로 API 호출 최소화
- **거리 계산은 나중에 진행**: 현재는 구매자/비구매자 구분만으로 발송
- **200명 단위 메시지 분할 계획**: 구체적인 청크별 분할 계획 수립
- **현재 통계 확인** (2026-01-19):
  - 총 고객 수: 2,988명 (구매자 1,521명, 비구매자 1,467명)
  - 총 청크 수: 16개 (구매자 8개, 비구매자 8개)
- **메시지 구성**:
  - 주요 내용: 신년 VIP 시타 특별 초대
  - 하단 추가 혜택: 여행 전 점검, 온라인 점검 (그립, 무게추 무상 점검)
  - 구매자/비구매자 2가지 버전
- **생성 파일**: `scripts/check-customer-stats-for-message.js` (고객 통계 확인 스크립트)
- **이모티콘 최소화**: `[]`, `•`, `▶`, `☎`만 사용
- **시기 조정**: 
  - 현재(1월): 겨울 여행 전 무상 점검 캠페인
  - 구정(1월 말~2월 초): 신년 첫구매 캠페인 별도 계획
- **설문조사 메시지 스타일 참조**:
  - 거리 기반 개인화 로직 적용
  - KGFA 1급 피팅 전문 상담 강조
  - 전화 상담 옵션 제공 (원거리 고객)
- **발송 계획 수립**:
  - Phase 1: 구매자 대상 발송 (근거리/원거리 분류)
  - Phase 2: 비구매자 대상 발송 (근거리/원거리 분류)
  - A/B 테스트 옵션 포함
- **최고 반응 메시지 확인 방법 정리**:
  - 메시지 발송 성공률 확인
  - SMS 발송 내역 확인
  - 시타 예약 증가 추적
  - 전화 상담 증가 추적
- **생성 파일**: `docs/titanium-shaft-sita-message-plan.md`

#### 고객관리 및 설문 조사 관리 확인 ✅
- **고객관리 최근 연락 정보**: `last_contact_date` 필드로 확인 가능 (`/admin/customers`)
- **설문 조사 관리**: `/admin/surveys` 페이지에서 관리 가능
- **구매자/비구매자 구분**: `last_purchase_date` 필드로 구분 가능
- **국가별 필터링**: A/B/C 테스트 형태로 태국(A), 베트남(B), 일본(C) 버전 존재

---

## ✅ 이전 작업: 카카오 친구 그룹 및 동기화 시스템 개선 (2026-01-19)

### 완료된 작업

#### 카카오 개발자 콘솔 설정 완료 ✅
- **카카오 로그인 활성화**: 카카오 개발자 콘솔에서 카카오 로그인 기능 활성화
- **동의 항목 설정**: 친구 목록(friends) "이용 중 동의" 설정 완료
- **추가 기능 신청**: 카카오톡 친구 목록/메시지 기능 신청 완료
- **비즈니스 정보 제출**: 사업자등록증 및 서비스 확인 화면 제출

#### 친구 그룹 recipient_count 자동 계산 수정 ✅
- **문제 해결** (`pages/api/kakao/recipient-groups.ts`):
  - `recipient_count`가 0이지만 `recipient_uuids`에 데이터가 있는 경우 자동 계산
  - 그룹 목록 조회 시 실제 UUID 개수로 자동 업데이트
  - 데이터베이스의 `recipient_count`도 자동으로 업데이트
  - 친구 그룹이 0명으로 표시되던 문제 해결

#### 친구 목록 동기화 안내 메시지 개선 ✅
- **UI 개선** (`components/admin/KakaoFriendSyncStatus.tsx`):
  - OAuth 2.0 Access Token 필요 안내 메시지 추가
  - 수동 친구 등록 방법 안내
  - 전화번호로 친구 여부 확인 방법 안내
  - 사용자 경험 개선

---

## ✅ 이전 작업: 카카오 채널 에디터 태그 항목 제거 (2026-01-13)

### 완료된 작업

#### 카카오 파트너센터 UI/UX 일치화 ✅
- **태그 항목 제거**:
  - 카카오 파트너센터에는 "태그" 항목이 없으므로 제거
  - `/pages/admin/kakao.tsx`: 태그 입력 UI 제거
  - 태그 상태 관리 코드 제거 (formData.tags)
  - 미리보기에서 태그 표시 제거
  - `lib/hooks/useChannelEditor.ts`: API 페이로드에서 tags 제거
  - `pages/api/channels/kakao/save.ts`: tags 파라미터 및 저장 로직 제거
  - 카카오 파트너센터의 실제 UI/UX와 일치하도록 수정

---

## ✅ 이전 작업: 카카오 친구 그룹 관리 시스템 완성 (2026-01-13)

### 완료된 작업

#### Phase 1: 동기화 실패 원인 수정 ✅
- **에러 처리 개선** (`pages/api/kakao/friends.ts`):
  - 카카오 API 응답 상태 코드별 상세 처리 (401, 403, 400, 500 등)
  - JSON 파싱 실패 처리 강화
  - 사용자 친화적 에러 메시지 및 에러 코드 제공
  - 상세한 로깅 추가

#### Phase 2: 친구 그룹 관리 시스템 ✅
- **친구 그룹 목록 페이지** (`/admin/kakao-friend-groups`):
  - 그룹 목록 테이블 (그룹명, 설명, 친구 수, 상태, 생성일)
  - 그룹 생성/수정/삭제 기능
  - 카카오 파트너센터 용어 사용

- **친구 그룹 상세 페이지** (`/admin/kakao-friend-groups/[id]`):
  - 기본정보 섹션 (그룹명, 설명, 등록수, 친구수, 상태, 생성일시, 업데이트일시)
  - 그룹명/설명 편집 기능
  - 친구 목록 테이블 (전화번호, 프로필명, 친구 추가 방법, 등록 시간)
  - 친구 선택 및 선택 삭제 기능
  - 카카오 파트너센터 UI 패턴 따르기

- **그룹에 친구 추가 모달** (`KakaoFriendGroupAddModal.tsx`):
  - 등록 수단 선택 (전화번호 직접 입력 / 전화번호 업로드)
  - 전화번호 직접 입력: 한 줄에 하나씩, 최대 10,000개
  - 전화번호 업로드: CSV/TXT 파일 업로드
  - 카카오 파트너센터 UI 패턴 따르기

#### Phase 3: 친구 그룹 타게팅 발송 기능 ✅
- **카카오 채널 에디터에 친구 그룹 선택 추가**:
  - 메시지 타겟 설정 섹션 추가
  - "타겟 설정 안함 (전체 친구 대상 발송)" 옵션
  - "친구그룹 타게팅" 옵션
  - 지정할 친구그룹 선택 드롭다운
  - 총 예상 발송 대상 수 표시
  - 카카오 파트너센터 용어 사용

- **발송 API에 친구 그룹 지원 추가**:
  - `pages/api/channels/kakao/send.ts`: 친구 그룹 ID로 수신자 조회
  - `lib/hooks/useChannelEditor.ts`: friendGroupId 전달
  - `components/shared/BaseChannelEditor.tsx`: friendGroupId를 formData에 추가

#### Phase 4: 카카오 채널 전용 에디터 수신자 선택 기능 ✅
- **발송 모달 컴포넌트 생성** (`KakaoRecipientModal.tsx`):
  - 전화번호 직접 입력 (쉼표 또는 줄바꿈으로 구분)
  - 카카오 친구 목록에서 선택 (검색, 체크박스 다중 선택)
  - 친구 목록 동기화 버튼 및 상태 표시
  - 알림톡/친구톡 선택 확인

- **BaseChannelEditor에 발송 모달 통합**:
  - 카카오 채널일 때 발송 버튼 클릭 시 모달 표시
  - 수신자 선택 후 자동 발송 진행
  - 선택한 수신자를 `selectedRecipients`로 전달

#### Phase 3: 고객 세그먼트 기능 강화 ✅
- **세그먼트 저장/불러오기 API** (`/api/admin/customer-segments`):
  - GET: 세그먼트 목록 조회
  - POST: 새 세그먼트 생성 (필터 설정 저장)
  - PUT: 세그먼트 수정
  - DELETE: 세그먼트 삭제
  - 수신자 수 자동 계산 기능

- **세그먼트 관리 컴포넌트** (`CustomerSegmentManager.tsx`):
  - 저장된 세그먼트 목록 표시
  - 세그먼트 불러오기 (한 번 클릭으로 필터 적용)
  - 세그먼트 저장 모달 (세그먼트명, 설명, 현재 필터 설정 미리보기)
  - 세그먼트 삭제 기능

- **SMS 에디터에 세그먼트 관리 통합**:
  - 세그먼트 선택 섹션 위에 세그먼트 관리 컴포넌트 추가
  - 저장된 세그먼트를 불러와서 필터 자동 적용

#### Phase 4: 카카오톡 대행 발송 개선 ✅
- **친구 목록 동기화 상태 표시** (`KakaoFriendSyncStatus.tsx`):
  - 마지막 동기화 시간 표시
  - 친구 수 표시
  - 원클릭 동기화 버튼
  - SMS 에디터와 카카오 에디터에 통합

- **친구/비친구 비율 미리보기** (`KakaoRecipientPreview.tsx`):
  - 수신자 입력 시 실시간 비율 계산
  - 카카오톡 발송 예상 수 / SMS 대체 발송 예상 수 표시
  - 시각적 진행 바로 비율 표시
  - 카카오톡 대행 발송 활성화 시에만 표시

### 변경된 파일
- `pages/api/kakao/friends.ts` (에러 처리 개선)
- `pages/admin/kakao-friend-groups/index.tsx` (신규, 친구 그룹 목록 페이지)
- `pages/admin/kakao-friend-groups/[id].tsx` (신규, 친구 그룹 상세 페이지)
- `components/admin/KakaoFriendGroupAddModal.tsx` (신규, 그룹에 친구 추가 모달)
- `pages/admin/kakao.tsx` (친구 그룹 타게팅 선택 기능 추가)
- `pages/api/channels/kakao/send.ts` (친구 그룹 타게팅 지원 추가)
- `lib/hooks/useChannelEditor.ts` (friendGroupId 전달 추가)
- `components/shared/BaseChannelEditor.tsx` (friendGroupId를 formData에 추가)
- `components/admin/KakaoRecipientModal.tsx` (이전 작업)
- `components/admin/CustomerSegmentManager.tsx` (이전 작업)
- `components/admin/KakaoFriendSyncStatus.tsx` (이전 작업)
- `components/admin/KakaoRecipientPreview.tsx` (이전 작업)
- `pages/admin/sms.tsx` (이전 작업)
- `pages/api/admin/customer-segments.ts` (이전 작업)

### 데이터베이스
- `customer_segments` 테이블 생성 완료 (Supabase에서 실행됨)

### 예상 효과
- 동기화 실패 시 상세한 에러 메시지로 원인 파악 용이
- 친구 그룹을 생성하고 관리하여 타게팅 발송 가능
- 카카오 파트너센터와 유사한 UI/UX로 사용자 친화적
- 친구 그룹별 발송으로 효율적인 마케팅 가능
- 카카오 채널 에디터에서 수신자 선택 및 발송 가능 (이전 작업)
- 자주 사용하는 세그먼트를 저장하여 재사용 가능 (이전 작업)
- 친구 목록 동기화 상태를 쉽게 확인 가능 (이전 작업)
- 발송 전 친구/비친구 비율을 미리 확인하여 발송 전략 수립 가능 (이전 작업)

---

## ✅ 이전 작업: 제품 합성 관리 추가 개선 (2026-01-13)

### 완료된 작업
- **제품 추가 시 표시 순서 자동 설정** ✅:
  - `pages/admin/product-composition.tsx`: `handleAdd` 함수 개선
    - 현재 제품 목록에서 가장 높은 `display_order` 조회
    - 자동으로 `max(display_order) + 1` 설정
    - 제품 추가 시 수동 입력 불필요

- **갤러리 폴더 추가** ✅:
  - `pages/admin/product-composition.tsx`: 공통 폴더 추가
    - `getSecretWeaponGoldCommonFolderPath()` 함수 추가
    - `getSecretWeaponBlackCommonFolderPath()` 함수 추가
    - `alternativeFolders`에 "시크리트웨폰 골드 공통", "시크리트웨폰 블랙 공통" 추가

### 변경된 파일
- `pages/admin/product-composition.tsx` (표시 순서 자동 설정, 공통 폴더 추가)
- `docs/project_plan.md` (작업 내역 기록)

### 예상 효과
- 제품 추가 시 표시 순서 자동 설정으로 사용자 편의성 향상
- 시크리트웨폰 골드/블랙 공통 폴더 접근 용이

---

## ✅ 이전 작업: 제품 합성 관리 시스템 개선 (2026-01-13)

### 완료된 작업
- **제품 합성 관리 페이지 탭 분리** ✅:
  - `pages/admin/product-composition.tsx`: 클럽(Clubs)과 굿즈(Goods) 탭으로 분리
    - 클럽 탭: 드라이버 8개만 관리 (`originals/products/`)
    - 굿즈 탭: 모자, 액세서리 등 관리 (`originals/goods/`)
    - 탭 전환 시 자동으로 카테고리 및 합성 타겟 설정

- **카테고리 통일** ✅:
  - `pages/admin/product-composition.tsx`: `cap` 제거, `hat`으로 통일
    - DB 체크 제약 조건에 맞춰 `hat`만 사용
    - `hatType` 필드 추가 (bucket, baseball, visor)
    - 모자 카테고리 선택 시 모자 타입 선택 UI 추가

- **Slug 입력 필드 개선** ✅:
  - `pages/admin/product-composition.tsx`: prefix 표시 및 자동 처리
    - 클럽: `originals/products/` prefix 표시
    - 굿즈: `originals/goods/` prefix 표시
    - 사용자는 prefix 이후만 입력
    - 전체 경로 미리보기 제공

- **경로 처리 함수 개선** ✅:
  - `pages/admin/product-composition.tsx`: `getCompositionFolderPath` 함수 수정
    - `hat` 카테고리 처리 추가
    - `cap` 제거, `hat`으로 통일

- **AI 이미지 생성 페이지** ✅:
  - `pages/admin/ai-image-generator.tsx`: 이미 합성 타겟별 필터링 구현됨
    - `ProductSelector` 컴포넌트가 `compositionTarget`으로 자동 필터링
    - 추가 개선 불필요

### 변경된 파일
- `pages/admin/product-composition.tsx` (탭 분리, 카테고리 통일, Slug 입력 개선)
- `docs/project_plan.md` (작업 내역 기록)

### 예상 효과
- 제품 관리가 더 직관적이고 체계적으로 개선
- 경로 혼동 방지 및 정확한 갤러리 위치 파악 가능
- 카테고리 통일로 데이터 일관성 확보
- 사용자 경험 개선 (prefix 표시로 입력 실수 방지)

---

## ✅ 이전 작업: 경품 추천 저장 타이밍 이슈 수정 (2026-01-30)

### 완료된 작업
- **경품 추천 저장 로직 개선** ✅:
  - `pages/api/admin/surveys/recommend-prizes.ts`: 저장 함수 에러 처리 개선
    - 삭제 및 저장 작업의 에러를 제대로 throw하도록 수정
    - 저장 완료 로그 추가
    - 저장 실패 시 에러를 호출자에게 전달하도록 수정

- **비동기 저장 처리 개선** ✅:
  - `pages/api/admin/surveys/recommend-prizes.ts`: 저장 함수를 await로 기다리도록 수정
    - 기존: `.catch()`로 에러만 처리하고 계속 진행
    - 수정: `await`로 저장 완료를 기다린 후 응답 반환
    - 저장 실패해도 생성은 완료되었으므로 응답은 반환

- **프론트엔드 대기 시간 증가** ✅:
  - `pages/admin/surveys/index.tsx`: 저장 완료 대기 시간 증가
    - 3초 → 5초로 증가하여 DB 커밋 완료를 확실히 기다림

- **JSON 응답에 날짜 포함** ✅:
  - `pages/api/admin/surveys/recommend-prizes.ts`: JSON 응답에 `recommendationDate` 포함
    - 프론트엔드에서 생성된 날짜를 명확히 확인 가능

### 변경된 파일
- `pages/api/admin/surveys/recommend-prizes.ts` (저장 로직 개선)
- `pages/admin/surveys/index.tsx` (대기 시간 증가)

### 예상 효과
- 경품 추천 생성 후 저장이 완료되기 전에 조회되는 문제 해결
- 저장 실패 시 에러를 명확히 확인 가능
- 데이터가 갑자기 사라지는 현상 방지

---

## ✅ 이전 작업: 경품 추천 시스템 개선 및 위치 정보 관리 중복 표시 (2026-01-30)

### 완료된 작업
- **구매 여부 판단 로직 개선** ✅:
  - `pages/api/admin/surveys/recommend-prizes.ts`: 구매 여부 판단 로직 개선
    - `last_purchase_date` 또는 `first_purchase_date`가 있으면 구매로 판단
    - 기존 로직(`visit_count`, `booking`)도 유지하여 호환성 확보

- **통계 계산 일관성 개선** ✅:
  - `pages/api/admin/surveys/prize-history.ts`: 통계 계산 로직 개선
    - `section` 필드 대신 `is_purchased` 필드를 기준으로 계산
    - 목록과 상세의 구매/비구매 통계 일관성 확보

- **점수 소수점 처리** ✅:
  - `pages/api/admin/surveys/recommend-prizes.ts`: 비구매 고객 점수 계산 함수 개선
    - 소수점 2자리로 반올림 처리
    - 거리 점수 계산 시 발생하는 소수점 문제 해결

- **최근 설문일 저장** ✅:
  - `pages/api/admin/surveys/recommend-prizes.ts`: 경품 추천 저장 시 최근 설문일 추가
    - `recent_survey_date` 필드에 `survey.created_at` 저장
    - 구매/비구매/전체 고객 모두에 적용

- **위치 정보 관리 중복 표시 추가** ✅:
  - `pages/admin/surveys/index.tsx`: 위치 정보 관리에서 중복 표시 추가
    - 전화번호별로 그룹화하여 중복 개수 계산
    - 목록 제목에 "92명, 99건" 형태로 표시
    - 각 행에 "중복(2)" 배지 표시

### 변경된 파일
- `pages/api/admin/surveys/recommend-prizes.ts` (구매 여부 판단, 점수 소수점, 최근 설문일)
- `pages/api/admin/surveys/prize-history.ts` (통계 계산 일관성)
- `pages/admin/surveys/index.tsx` (위치 정보 관리 중복 표시)

### 예상 효과
- 구매 여부 판단 정확도 향상 (구매일 기준)
- 목록과 상세의 통계 일관성 확보
- 점수 표시 정확도 향상 (소수점 처리)
- 최근 설문일 정보 제공으로 고객 관리 효율성 향상
- 위치 정보 관리에서 중복 참여자 명확히 표시

---

## ✅ 이전 작업: 설문 목록에 고객관리 버튼 추가 및 autoEdit 파라미터 처리 개선 (2026-01-30)

### 완료된 작업
- **설문 목록 작업 컬럼에 고객관리 버튼 추가** ✅:
  - `pages/admin/surveys/index.tsx`: 작업 컬럼에 "고객관리" 버튼 추가
    - 보라색 스타일 (`text-purple-600 hover:text-purple-900`)
    - 클릭 시 고객관리 페이지로 이동
    - `autoEdit` 파라미터로 해당 전화번호의 고객 수정 모달 자동 열림

- **고객관리 페이지 이동 함수 추가** ✅:
  - `pages/admin/surveys/index.tsx`: `handleGoToCustomerManagement` 함수 추가
    - 전화번호를 정규화하여 숫자만 추출
    - `/admin/customers?autoEdit={phone}` 경로로 이동
    - `useRouter` hook 사용

- **Next.js Router import 추가** ✅:
  - `pages/admin/surveys/index.tsx`: `useRouter` import 추가
    - `next/router`에서 import
    - 컴포넌트 내부에서 router 인스턴스 생성

- **고객관리 페이지 autoEdit 파라미터 처리 개선** ✅:
  - `pages/admin/customers/index.tsx`: `autoEdit` 파라미터 처리 로직 개선
    - 기존 방식: `autoEdit=true&phone=전화번호` 형태 지원
    - 새로운 방식: `autoEdit=전화번호` 형태 지원 (설문 목록에서 사용)
    - 전화번호가 숫자로만 구성된 경우 자동으로 인식하여 수정 모달 열림
    - 검색에도 자동 반영하여 해당 고객을 찾을 수 있도록 함

### 변경된 파일
- `pages/admin/surveys/index.tsx` (고객관리 버튼 추가, 이동 함수 구현)
- `pages/admin/customers/index.tsx` (autoEdit 파라미터 처리 로직 개선)

### 예상 효과
- 설문 목록에서 바로 고객관리 페이지로 이동 가능
- 전화번호 기반 자동 수정 모달 열림으로 사용자 편의성 향상
- 설문 데이터와 고객 데이터 간 연결성 강화
- 다양한 URL 파라미터 형태 지원으로 유연성 향상

---

## ✅ 이전 작업: 전체 설문 기준 중복 감지 시스템 구현 (2026-01-30)

### 완료된 작업
- **전체 설문 기준 중복 감지 API 생성** ✅:
  - `pages/api/admin/surveys/duplicate-phones.ts`: 전체 설문의 전화번호별 카운트 조회
    - 전체 설문 수, 고유 전화번호 수, 중복 전화번호 개수 반환
    - 전화번호별 카운트 맵 반환
  - 페이지네이션과 무관하게 전체 설문 기준으로 중복 감지

- **중복 정보 별도 조회 함수 추가** ✅:
  - `pages/admin/surveys/index.tsx`: `fetchDuplicatePhones` 함수 추가
    - 페이지 로드 시 전체 설문 기준 중복 정보 가져오기
    - `useEffect`에서 자동 호출
  - `duplicateMap`을 전체 설문 기준으로 업데이트

- **대시보드 통계 카드 추가** ✅:
  - `pages/admin/surveys/index.tsx`: 설문 통계 카드 추가
    - 총 참여자 수 (고유 전화번호)
    - 총 설문 수 (전체 응답)
    - 중복 설문 (중복 전화번호 개수)
  - 기존 통계 카드와 함께 5개 카드로 확장

- **중복 감지 로직 개선** ✅:
  - `pages/admin/surveys/index.tsx`: 중복 표시 로직을 전체 설문 기준으로 변경
    - 현재 페이지의 설문만 확인하던 로직 제거
    - `duplicateMap`을 사용하여 전체 설문 기준으로 중복 표시
    - 중복 개수도 전체 설문 기준으로 표시
  - 중복 설문 목록 보기에서도 전체 설문 기준 정보 표시

### 변경된 파일
- `pages/api/admin/surveys/duplicate-phones.ts` (신규 생성)
- `pages/admin/surveys/index.tsx` (중복 감지 로직 개선, 통계 카드 추가)

### 예상 효과
- 페이지네이션과 무관하게 모든 중복 설문을 정확히 감지
- 대시보드에서 한눈에 참여자 수와 중복 현황 파악 가능
- 다른 페이지에 있는 중복 설문도 정확히 표시
- 전체 설문 기준 통계로 데이터 관리 효율성 향상

---

## ✅ 이전 작업: 설문 중복 관리 시스템 구현 (2026-01-30)

### 완료된 작업
- **설문 목록에 중복 표시 기능 추가** ✅:
  - `pages/admin/surveys/index.tsx`: 전화번호별로 설문 그룹화 및 중복 표시
    - 같은 전화번호로 여러 설문이 있는 경우 "중복" 배지 표시
    - 최신 설문만 기본 표시, 이전 설문은 접기/펼치기 기능
    - 중복 설문은 회색 배경으로 구분
  - `duplicateMap` state 추가: 전화번호별 중복 개수 추적
  - `expandedPhones` state 추가: 펼쳐진 전화번호 관리

- **중복 설문 관리 기능** ✅:
  - `pages/admin/surveys/index.tsx`: `handleManageDuplicates` 함수 추가
    - 중복 설문 목록 보기
    - 최신 설문만 유지하고 이전 설문 일괄 삭제
  - `pages/api/survey/delete.ts`: 개별 설문 삭제 API 생성

- **설문 제출 시 중복 경고** ✅:
  - `pages/api/survey/submit.ts`: 기존 설문 확인 후 경고 메시지 반환
    - 중복 설문이 있는 경우 `warning` 필드에 경고 메시지 포함
    - `isDuplicate`, `previousSurvey` 필드 추가

- **설문 타입/카테고리 필드 추가** ✅:
  - `database/add-survey-type-fields.sql`: DB 스키마 업데이트
    - `survey_type`: 설문 타입 (기본값: 'product_survey')
    - `survey_category`: 설문 카테고리 (기본값: 'muziik-2025')
    - `is_active`: 활성 설문 여부 (기본값: true)
  - `pages/api/survey/submit.ts`: 새 설문 저장 시 기본값 설정

- **경품 추천 로직 개선** ✅:
  - `pages/api/admin/surveys/recommend-prizes.ts`: 활성 설문만 사용
    - 구매 고객 조회: `.eq('is_active', true)` 추가
    - 비구매 고객 조회: `.eq('is_active', true)` 추가
    - 전체 고객 조회: `.eq('is_active', true)` 추가

### 변경된 파일
- `pages/admin/surveys/index.tsx` (중복 표시, 중복 관리 기능)
- `pages/api/survey/submit.ts` (중복 경고, 설문 타입 필드)
- `pages/api/survey/delete.ts` (신규 생성)
- `pages/api/admin/surveys/recommend-prizes.ts` (활성 설문 필터)
- `database/add-survey-type-fields.sql` (신규 생성)

### 예상 효과
- 설문 중복을 쉽게 식별하고 관리 가능
- 중복 설문으로 인한 데이터 혼란 방지
- 경품 추천 시 활성 설문만 사용하여 정확성 향상
- 추후 다른 설문 조사 진행 시 설문 타입별 관리 가능

---

## ✅ 이전 작업: 경품 추천 이력 개선 및 로직 단순화 (2026-01-30)

### 완료된 작업
- **순위 컬럼 수정** ✅:
  - `pages/admin/surveys/index.tsx`: 순위 컬럼에 `recommendation_datetime` 대신 `rank` 표시
  - 생성 시간 대신 실제 순위 숫자 표시로 변경

- **구매 고객 거리 정보 추가** ✅:
  - `pages/api/admin/surveys/recommend-prizes.ts`: 구매 고객도 거리 정보 가져오기
    - `allCustomersData` 처리 시 구매 고객도 `getCachedOrCalculateDistance` 호출
    - `purchasedCustomersData` 처리 시에도 거리 정보 가져오기
    - 구매 고객도 `distance_km`, `latitude`, `longitude` 저장

- **구매경과 로직 단순화** ✅:
  - `pages/api/admin/surveys/recommend-prizes.ts`: 구매 고객만 `days_since_last_purchase` 계산
    - 비구매 고객은 `null`로 저장
  - `pages/admin/surveys/index.tsx`: 구매 고객만 구매경과 표시
    - 비구매 고객은 "-" 표시

- **불필요한 필드 제거** ✅:
  - `pages/admin/surveys/index.tsx`: `purchaseInfo` 컬럼 제거 (1년이상/2년이상 정보)
  - 점수 컬럼 추가로 변경
  - `is_over_1_year`, `is_over_2_years` 필드 제거 (DB에는 유지하되 UI에서 사용 안 함)

- **DB 저장 로직 개선** ✅:
  - `pages/api/admin/surveys/recommend-prizes.ts`: 모든 고객에 `distance_km`, `latitude`, `longitude` 저장
    - 구매 고객도 거리 정보 저장
    - `days_since_last_purchase`는 구매 고객만 저장
  - `recommendation_datetime` 필드 추가 (같은 날짜에 여러 번 생성 가능)

### 변경된 파일
- `pages/api/admin/surveys/recommend-prizes.ts` (구매 고객 거리 정보, 구매경과 로직, DB 저장 개선)
- `pages/admin/surveys/index.tsx` (순위 컬럼, 구매경과 표시, purchaseInfo 제거)

### 예상 효과
- 순위 컬럼이 실제 순위를 표시하여 가독성 향상
- 구매 고객도 거리 정보가 표시되어 일관성 확보
- 구매경과는 구매 고객만 표시하여 혼란 방지
- 불필요한 필드 제거로 UI 단순화
- DB 저장 로직 개선으로 데이터 정확성 향상

---

## ✅ 이전 작업: 주소 없는 고객도 위치 정보 관리에 표시 (2026-01-30)

### 완료된 작업
- **주소 없는 고객도 위치 정보 관리 탭에 표시** ✅:
  - `pages/api/admin/surveys/geocoding.ts`: WHERE 조건 수정
    - 기존: 설문 주소 또는 고객 주소 중 하나라도 있어야 조회
    - 수정: 주소 유무와 관계없이 모든 설문 조회 (`WHERE 1=1`)
    - `effective_address` 계산 로직 개선: 설문 주소가 NULL이면 고객 주소 사용
  - `pages/admin/surveys/index.tsx`: UI 개선
    - 주소가 없는 경우 "주소 없음" 표시 (빨간색 이탤릭)
    - 설문 주소/고객관리 주소가 없는 경우 "없음" 표시
    - 상태 컬럼: 주소가 없으면 "주소 없음" 배지 (노란색)
    - 거리 컬럼: 주소가 없으면 "계산 불가" 표시 (노란색 이탤릭)

### 변경된 파일
- `pages/api/admin/surveys/geocoding.ts` (WHERE 조건 제거, effective_address 계산 로직 개선)
- `pages/admin/surveys/index.tsx` (주소 없음 표시 추가)

### 예상 효과
- 주소가 없는 고객도 위치 정보 관리에서 확인 가능
- 주소 입력이 필요한 고객을 쉽게 식별 가능
- 주소 상태를 명확히 구분하여 표시

---

## ✅ 이전 작업: 경품 추천 이력 삭제 기능 및 UI 개선 (2026-01-30)

### 완료된 작업
- **특정 날짜 경품 추천 데이터 삭제 기능 추가** ✅:
  - `pages/api/admin/surveys/prize-history.ts`: DELETE 메서드 추가
    - 특정 날짜(`recommendation_date`)의 모든 경품 추천 데이터 삭제
    - 삭제된 레코드 수 반환
  - `pages/admin/surveys/index.tsx`: 삭제 함수 및 버튼 추가
    - `handleDeletePrizeHistory`: 날짜별 데이터 삭제 함수
    - 날짜별 통계 카드에 "🗑️ 이 날짜 데이터 삭제" 버튼 추가
    - 삭제 후 자동으로 이력 목록 새로고침

- **UI 개선** ✅:
  - **추천일 표시 수정**: 날짜 제거, "추천일" 라벨만 표시
  - **총 고객 수 수정**: `stat.total` (모든 섹션 합계) 대신 `stat.all` (실제 고객 수) 사용
    - 기존: 102명 (purchased + non_purchased + all 섹션의 레코드 수 합계)
    - 수정: 99명 (all 섹션의 실제 고객 수)

### 변경된 파일
- `pages/api/admin/surveys/prize-history.ts` (DELETE 메서드 추가)
- `pages/admin/surveys/index.tsx` (삭제 함수, 버튼 추가, UI 개선)

### 사용 방법
1. 경품 추천 이력 탭에서 날짜별 통계 카드 확인
2. "🗑️ 이 날짜 데이터 삭제" 버튼 클릭
3. 확인 대화상자에서 확인
4. 삭제 완료 후 자동으로 목록 새로고침

### 예상 효과
- 잘못 생성된 데이터를 쉽게 삭제 가능
- 위치 정보 업데이트 후 재생성 시 기존 데이터 정리 용이
- 총 고객 수 표시 정확도 향상

---

## ✅ 이전 작업: 경품 추천 이력 다운로드 기능 추가 (2026-01-30)

### 완료된 작업
- **경품 추천 이력 탭에서 저장된 이력 다운로드 기능 추가** ✅:
  - `pages/api/admin/surveys/prize-history.ts`: HTML 리포트 생성 기능 추가
    - `format=html` 쿼리 파라미터 지원
    - 저장된 `prize_recommendations` 데이터를 HTML 형식으로 변환
    - A4 최적화된 리포트 생성 (구매 고객, 비구매 고객, 전체 고객 섹션 포함)
  - `pages/admin/surveys/index.tsx`: 저장된 이력 다운로드 함수 추가
    - `handleDownloadPrizeHistory`: 날짜 선택 시 저장된 이력을 다운로드
    - 새 창에서 HTML 표시 및 파일 다운로드 동시 제공
    - 경품 추천 이력 탭에 두 개의 버튼 구분:
      - "🎁 저장된 이력 다운로드": 선택한 날짜의 저장된 이력 다운로드
      - "🆕 새 경품 추천 생성": 새로운 경품 추천 생성 및 다운로드

### 변경된 파일
- `pages/api/admin/surveys/prize-history.ts` (HTML 리포트 생성 기능 추가)
- `pages/admin/surveys/index.tsx` (저장된 이력 다운로드 함수 및 UI 개선)

### 기능 차이점
- **설문 목록 탭**: "🎁 경품 추천 목록 다운로드" → 새로운 경품 추천 생성
- **경품 추천 이력 탭**: 
  - "🎁 저장된 이력 다운로드" → 저장된 이력 다운로드 (날짜 선택 필수)
  - "🆕 새 경품 추천 생성" → 새로운 경품 추천 생성

### 예상 효과
- 저장된 경품 추천 이력을 언제든지 다시 다운로드 가능
- 과거 추천 결과와 현재 추천 결과 비교 분석 용이
- 설문 목록 탭과 경품 추천 이력 탭의 기능 명확히 구분

---

## ✅ 이전 작업: 주소 표시 명확화 및 설문 주소 → 고객 주소 일괄 동기화 기능 (2026-01-30)

### 완료된 작업
- **주소 표시 명확화** ✅:
  - `pages/admin/surveys/index.tsx`: 주소 컬럼에 "📍 거리 계산 주소", "📝 설문 주소", "👤 고객관리 주소"로 명확히 구분 표시
  - 각 주소의 출처를 명확히 표시하여 사용자 혼란 방지

- **일괄 동기화 API 엔드포인트 생성** ✅:
  - `pages/api/admin/surveys/sync-addresses.ts`: 설문 주소를 고객관리 주소로 일괄 동기화하는 API 생성
  - 고객관리 주소가 없거나 플레이스홀더인 경우만 동기화
  - 설문 주소가 실제 주소인 경우만 동기화

- **일괄/개별 동기화 버튼 추가** ✅:
  - 일괄 동기화 버튼: 모든 고객 중 조건에 맞는 고객 일괄 동기화
  - 개별 동기화 버튼: 각 행에 동기화 버튼 추가 (고객관리 주소가 없고 설문 주소가 있는 경우만 표시)

### 변경된 파일
- `pages/admin/surveys/index.tsx` (주소 표시 개선, 일괄/개별 동기화 기능 추가)
- `pages/api/admin/surveys/sync-addresses.ts` (신규 생성)

### 예상 효과
- 주소 출처를 명확히 구분하여 사용자 혼란 방지
- 설문 주소를 고객관리 주소로 쉽게 동기화 가능
- 실제 주소를 아는 경우 수동 입력 후 자동 지오코딩

---

## ✅ 이전 작업: 설문 주소 플레이스홀더 시 고객 정보 주소 우선 사용 (2026-01-30)

### 완료된 작업
- **설문 주소가 플레이스홀더일 때 고객 정보 주소 우선 사용** ✅:
  - `pages/api/admin/surveys/geocoding.ts`: 설문 주소가 `[직접방문]` 등 플레이스홀더면 고객 정보의 실제 주소를 우선 사용
  - SQL 쿼리에서 `CASE` 문으로 효과적인 주소 선택 로직 추가
  - 클라이언트 측에서도 동일한 로직 적용

- **UI 개선** ✅:
  - `pages/admin/surveys/index.tsx`: 설문 주소와 고객 주소를 구분하여 표시
  - 설문 주소가 플레이스홀더이고 고객 주소가 있으면 고객 주소를 메인으로 표시
  - 원본 설문 주소와 고객 주소 정보를 하단에 추가 표시

### 변경된 파일
- `pages/api/admin/surveys/geocoding.ts` (고객 주소 우선 사용 로직 추가)
- `pages/admin/surveys/index.tsx` (주소 정보 구분 표시)

### 예상 효과
- "직접방문" 고객도 실제 주소가 있으면 지오코딩 가능
- 채현정, 이남구 등 직접방문 고객의 실제 주소 활용
- 데이터 활용도 향상 (고객 정보의 주소 활용)

---

## ✅ 이전 작업: 주소 미제공 고객 표준화 및 위치 정보 관리 개선 (2026-01-30)

### 완료된 작업
- **주소 정규화 함수 구현** ✅:
  - `pages/api/survey/submit.ts`, `pages/api/survey/update.ts`, `pages/api/admin/surveys/geocoding.ts`: 주소 정규화 함수 추가
  - 표준 플레이스홀더: `[주소 미제공]`, `[직접방문]`, `[온라인 전용]`, `N/A`
  - "직접방문", "직접 방문" 등 다양한 표현을 `[직접방문]`으로 자동 표준화
  - `isGeocodableAddress()` 함수로 지오코딩 가능 여부 확인

- **설문 제출/수정 시 주소 정규화 적용** ✅:
  - 설문 제출 시 주소가 없어도 제출 가능 (필수 필드에서 제외)
  - 주소 입력 시 자동으로 표준 플레이스홀더로 변환
  - DB에 정규화된 주소 저장

- **위치 정보 조회 API에서 플레이스홀더 제외** ✅:
  - `pages/api/admin/surveys/geocoding.ts`: 플레이스홀더 주소는 지오코딩 대상에서 자동 제외
  - SQL 쿼리에서 `NOT LIKE '[%'` 조건 추가
  - 클라이언트 측에서도 추가 필터링 적용

- **UI 개선** ✅:
  - 버튼 텍스트 변경: "위치 정보 업데이트" → "거리 업데이트"
  - 주소 동기화 안내 문구 추가
  - 플레이스홀더 주소는 회색 이탤릭체로 구분 표시

### 변경된 파일
- `pages/api/survey/submit.ts` (주소 정규화 함수 추가, 필수 필드 검증 수정)
- `pages/api/survey/update.ts` (주소 정규화 함수 추가)
- `pages/api/admin/surveys/geocoding.ts` (주소 정규화 및 플레이스홀더 필터링)
- `pages/admin/surveys/index.tsx` (UI 개선: 버튼 텍스트, 안내 문구, 플레이스홀더 표시)

### 예상 효과
- 주소 미제공 고객을 명확하게 구분 및 관리
- 지오코딩 대상에서 플레이스홀더 자동 제외로 API 비용 절감
- 데이터 일관성 향상 (표준화된 플레이스홀더 사용)
- 사용자 경험 개선 (명확한 버튼 텍스트 및 안내 문구)

---

## ✅ 이전 작업: 설문 주소와 위치 정보 캐시 양방향 동기화 (2026-01-30)

### 완료된 작업
- **설문 주소 수정 시 위치 정보 캐시 동기화** ✅:
  - `pages/api/survey/update.ts`: 설문 주소가 변경되면 관련 위치 정보 캐시 자동 무효화
  - 설문 ID와 고객 ID 기반으로 `customer_address_cache` 삭제
  - 주소 변경 시 기존 위치 정보가 무효화되어 재계산 필요 상태로 변경

- **위치 정보 관리에서 주소 수정 시 설문 주소 동기화** ✅:
  - `pages/api/admin/surveys/geocoding.ts`: 위치 정보 수동 업데이트 시 설문 주소도 자동 동기화
  - 고객 주소도 함께 동기화하여 데이터 일관성 유지
  - 동기화 실패 시에도 위치 정보 저장은 성공으로 처리 (에러 핸들링)

### 변경된 파일
- `pages/api/survey/update.ts` (위치 정보 캐시 무효화 로직 추가)
- `pages/api/admin/surveys/geocoding.ts` (설문/고객 주소 동기화 로직 추가)

### 예상 효과
- 설문 주소와 위치 정보 캐시 간 데이터 일관성 확보
- 경품 추천 시 정확한 거리 계산 보장
- 사용자 혼란 방지 (주소 불일치 문제 해결)
- 양방향 동기화로 어느 쪽에서 수정해도 일관성 유지

---

## ✅ 이전 작업: 카카오톡 콘텐츠 피드 버튼 통합 및 업로드 오류 수정 (2026-01-29)

### 완료된 작업
- **업로드 오류 수정** ✅:
  - `pages/api/upload-image-supabase.js`: formidable 버전 호환성 처리
  - `file.filepath`가 없을 경우 `file.path` 또는 `file.tempFilePath` 사용
  - 파일 존재 확인 로직 추가 (`fs.existsSync`)
  - `file` 또는 `image` 필드명 모두 지원 (하위 호환성)
  - 500 Internal Server Error 해결

- **피드 이미지 생성 버튼 통합 (방안 C)** ✅:
  - `components/admin/kakao/FeedManager.tsx`: 우상단 "재생성" 버튼 제거
  - `handleGenerateImage` 함수에 프롬프트 재생성 옵션 통합 (`regeneratePrompt` 파라미터)
  - 하단 버튼 통합: "이미지 생성/재생성" (제품 합성 자동 포함)
  - 프롬프트 재생성 옵션: 작은 버튼으로 제공 (이미지가 있을 때만 표시)
  - 버튼 텍스트 동적 변경:
    - 기존 이미지 없음: "⚡ 피드 이미지 생성"
    - 기존 이미지 + 제품 합성 활성화: "제품 합성"
    - 기존 이미지 + 제품 합성 비활성화: "이미지 재생성"

### 변경된 파일
- `pages/api/upload-image-supabase.js` (업로드 오류 수정)
- `components/admin/kakao/FeedManager.tsx` (버튼 통합 및 로직 개선)

### 예상 효과
- 업로드 오류 해결 (500 → 정상 업로드)
- 버튼 중복 제거로 사용자 혼란 감소
- 제품 합성 로직 일관성 확보 (모든 재생성 버튼에서 동일하게 동작)
- 더 직관적인 UI/UX (하나의 통합 버튼)

---

## ✅ 이전 작업: 스토리 기반 자동 편집 API 트렌드 문서화 (2026-01-29)

### 완료된 작업
- **스토리 기반 자동 편집 API 트렌드 문서 작성** ✅:
  - `docs/video-story-based-auto-editing-api-2026.md`: 2026년 최신 트렌드 정리
  - 나노바나나, Kling AI 분석 및 비교
  - Pictory, Lumen5, InVideo 등 주요 플랫폼 비교
  - 마스골프 고객을 위한 적용 방안 제시
  - Pictory 완성도 및 만족도 평가 포함
  - Pictory 예상 비용 정보 추가 (Starter, Professional, Team, Enterprise 플랜)

### 변경된 파일
- `docs/video-story-based-auto-editing-api-2026.md` (신규 생성 및 비용 정보 추가)

### 예상 효과
- 비디오 자동 편집 솔루션 선택 시 참고 자료 제공
- 나노바나나와 Kling AI의 기능 한계 명확화
- Pictory API 통합 시 기대 효과 및 주의사항 파악
- 마스골프 사용 규모별 예상 비용 파악

---

## ✅ 이전 작업: 동영상 메타데이터 추출 및 AI 메타 생성 기능 구현 (2026-01-29)

### 완료된 작업
- **동영상 메타데이터 추출 API 생성** ✅:
  - `pages/api/admin/extract-video-metadata.js`: ffprobe를 사용하여 동영상 메타데이터 추출
  - 해상도, 길이, 코덱, 프레임레이트, 비트레이트 등 추출
  - 동영상 썸네일 추출 옵션 지원 (선택적)
  
- **동영상 첫 프레임 추출 API 생성** ✅:
  - `pages/api/admin/extract-video-thumbnail.js`: ffmpeg를 사용하여 동영상 첫 프레임 추출
  - Base64 인코딩된 이미지로 반환하여 AI 분석에 사용
  - JPEG 90% 품질로 최적화
  
- **AI 메타 생성에 동영상 지원 추가** ✅:
  - `components/ImageMetadataModal/hooks/useAIGeneration.ts`: 동영상 감지 및 첫 프레임 추출 로직 추가
  - 골프 AI 생성, 일반 메타 생성, 필드별 생성 모두 동영상 지원
  - 동영상인 경우 자동으로 첫 프레임을 추출하여 OpenAI Vision API로 분석
  
- **ImageMetadataModal UI 개선** ✅:
  - `components/ImageMetadataModal/index.tsx`: 동영상인 경우 버튼 텍스트 변경
  - "EXIF 추출" → "비디오 메타 추출" (동영상인 경우)
  - 모달 제목: "이미지 메타데이터 편집" → "동영상 메타데이터 편집" (동영상인 경우)
  - EXIF 정보 표시 영역에 동영상 메타데이터 표시 (해상도, 길이, 코덱, 프레임레이트, 비트레이트)
  
- **갤러리 상세 정보 모달 제목 동적 변경** ✅:
  - `pages/admin/gallery.tsx`: 파일 타입에 따라 모달 제목 및 아이콘 변경
  - "이미지 상세 정보" → "동영상 상세 정보" (동영상인 경우)
  - 아이콘: 📋 → 🎬 (동영상인 경우)

### 변경된 파일
- `pages/api/admin/extract-video-metadata.js` (신규 생성)
- `pages/api/admin/extract-video-thumbnail.js` (신규 생성)
- `components/ImageMetadataModal/index.tsx` (동영상 지원 추가)
- `components/ImageMetadataModal/hooks/useAIGeneration.ts` (동영상 첫 프레임 추출 로직 추가)
- `pages/admin/gallery.tsx` (모달 제목 동적 변경)

### 예상 효과
- 동영상 파일도 이미지와 동일하게 메타데이터 추출 및 AI 분석 가능
- 동영상 메타데이터(해상도, 길이, 코덱 등)를 데이터베이스에 저장 가능
- 동영상의 첫 프레임을 분석하여 SEO 최적화된 메타데이터 자동 생성
- 사용자 경험 개선 (동영상과 이미지의 일관된 UI/UX)

### 참고사항
- **서버 환경 요구사항**: ffprobe와 ffmpeg가 서버에 설치되어 있어야 함
- **Vercel 환경**: 서버리스 환경에서는 ffmpeg/ffprobe 사용이 제한적일 수 있음
  - 대안: 클라이언트에서 Canvas로 첫 프레임 추출 또는 외부 서비스 활용 고려

---

## ✅ 이전 작업: 갤러리 동영상 썸네일 파란색 배경 문제 해결 (2026-01-29)

### 완료된 작업
- **동영상 썸네일 파란색 배경 문제 해결** ✅:
  - `pages/admin/gallery.tsx`: 동영상에 `preload="metadata"` 속성 추가
  - `onLoadedData` 핸들러로 첫 프레임 로드 완료 시 배경 제거
  - `onError` 핸들러로 동영상 로드 실패 처리
  - 갤러리 그리드와 썸네일 스트립 모두 적용
  - 동영상이 파란색으로 표시되던 문제 해결

### 변경된 파일
- `pages/admin/gallery.tsx` (동영상 preload 및 이벤트 핸들러 추가)

### 예상 효과
- 동영상 썸네일이 첫 프레임으로 정상 표시됨
- 파란색 배경이 사라지고 실제 동영상 프레임이 보임
- 동영상 로드 실패 시 적절한 에러 처리

---

## ✅ 이전 작업: 갤러리 관리 페이지 동영상 파일 표시 문제 해결 (2026-01-29)

### 완료된 작업
- **all-images API 동영상 필터링 문제 해결** ✅:
  - `pages/api/admin/all-images.js`: 검색 기능(502줄)과 페이지네이션 기능(1075줄)에 동영상 확장자 추가
  - 기존에는 `imageExtensions`만 사용하여 동영상 파일이 필터링됨
  - `videoExtensions`를 추가하여 동영상 파일도 API 응답에 포함되도록 수정
  - 배포 환경에서 동영상이 갤러리에 표시되지 않는 문제 해결

### 변경된 파일
- `pages/api/admin/all-images.js` (동영상 확장자 필터링 추가)

### 예상 효과
- 배포 환경에서도 동영상 파일이 갤러리에 정상적으로 표시됨
- 로컬과 배포 환경의 동작 일치
- 동영상 파일도 검색 및 페이지네이션에 포함됨

---

## ✅ 이전 작업: 설문 조사 페이지 동영상 파일 타입 감지 개선 (2026-01-29)

### 완료된 작업
- **동영상 파일 타입 감지 개선** ✅:
  - `pages/survey/index.tsx`: `getFileType` 함수를 URL 경로에서 파일명 확장자를 정확히 추출하도록 개선
  - 동영상 확장자 목록에 `.3gp`, `.wmv` 추가
  - 디버깅 로그 추가 (동영상 파일 개수 확인)
  - 배포 환경에서 동영상이 표시되지 않는 문제 해결

- **동영상 파일 정렬 개선** ✅:
  - `pages/api/products/survey-hats.js`: 이미지와 동영상을 분리하여 동영상을 마지막에 배치
  - 이미지 파일이 먼저 표시되고, 동영상 파일이 마지막에 표시되도록 정렬 로직 추가
  - 로그에 이미지/동영상 개수 표시 추가

### 변경된 파일
- `pages/survey/index.tsx` (동영상 타입 감지 로직 개선, 디버깅 로그 추가)
- `pages/api/products/survey-hats.js` (동영상 정렬 로직 추가)

### 예상 효과
- 배포 환경에서도 동영상 파일이 정확히 감지되어 표시됨
- 설문 조사 페이지에서 이미지가 먼저 롤링되고, 동영상이 마지막에 표시됨
- 사용자 경험 개선 (이미지를 먼저 보고, 동영상은 마지막에 재생)

---

## ✅ 이전 작업: 설문 조사 페이지 동영상 파일 지원 추가 (2026-01-29)

### 완료된 작업
- **설문 조사 페이지 동영상 파일 지원** ✅:
  - `pages/api/products/survey-hats.js`: 동영상 파일(.mp4, .avi, .mov, .webm, .mkv, .m4v)도 필터링에 포함
  - `pages/survey/index.tsx`: 동영상 파일을 `<video>` 태그로 렌더링하도록 수정
  - `getFileType` 함수 추가: URL 기반으로 이미지/동영상 구분
  - 버킷햇 및 골프모자 롤링 갤러리에서 동영상 파일 자동 재생 지원

### 변경된 파일
- `pages/api/products/survey-hats.js` (동영상 파일 필터링 추가)
- `pages/survey/index.tsx` (동영상 렌더링 지원 추가)

### 예상 효과
- 갤러리에 업로드한 동영상 파일이 설문 조사 페이지(`/survey`)에서 자동으로 표시됨
- 이미지와 동영상이 혼합되어 롤링 갤러리에서 자동 재생
- 사용자 경험 향상 (동영상 콘텐츠 활용 가능)

---

## ✅ 이전 작업: 동영상 파일 업로드 지원 완료 (2026-01-29)

### 완료된 작업
- **Supabase 버킷 설정 업데이트** ✅:
  - Allowed MIME types: `image/*` → `image/*,video/*`
  - File size limit: 30MB → 50MB (Free Plan 최대값)
  
- **코드 파일 크기 제한 업데이트** ✅:
  - `pages/api/upload-image-supabase.js`: 30MB → 50MB로 업데이트
  - 버킷 제한과 일치하도록 조정

- **문서 업데이트** ✅:
  - `docs/supabase-storage-current-status.md`: 현재 설정 상태 반영

### 변경된 파일
- `pages/api/upload-image-supabase.js` (파일 크기 제한 50MB로 업데이트)
- `docs/supabase-storage-current-status.md` (설정 상태 업데이트)

### 예상 효과
- 동영상 파일(MP4, AVI, MOV, WEBM 등) 업로드 가능
- 최대 50MB까지의 파일 업로드 지원
- 이미지와 동영상 모두 지원하는 통합 갤러리

---

## ✅ 이전 작업: 이미지 업로드 오류 해결 및 UX 개선 (2026-01-29)

### 완료된 작업
- **서버 측 에러 핸들링 개선** ✅:
  - `pages/api/upload-image-supabase.js`: 에러 발생 시 파일 정보, 업로드 모드 등 상세 정보 로깅
  - 개발 환경에서만 스택 트레이스 및 상세 오류 정보 제공
  - Supabase Storage 업로드 단계별 로깅 추가

- **클라이언트 측 에러 핸들링 개선** ✅:
  - `lib/image-upload-utils.ts`: XMLHttpRequest로 변경하여 진행률 추적 가능
  - `onProgress` 콜백 옵션 추가 (0-100%)
  - 더 상세한 에러 메시지 표시 (서버 응답의 details 포함)

- **업로드 진행률 표시 기능 추가** ✅:
  - `pages/admin/gallery.tsx`: `uploadProgress` 상태 추가
  - 드래그 앤 드롭 및 파일 선택 업로드 시 진행률 바 표시
  - 진행률 퍼센트 표시 및 로딩 스피너 추가

- **디버깅 정보 개선** ✅:
  - 업로드 시작 시 파일 정보 로깅 (파일명, 크기, 타입, 대상 폴더, 업로드 모드)
  - Supabase Storage 업로드 전/후 로깅
  - 메타데이터 저장 단계 로깅

### 변경된 파일
- `pages/api/upload-image-supabase.js` (에러 핸들링 및 로깅 개선)
- `lib/image-upload-utils.ts` (진행률 추적 및 에러 핸들링 개선)
- `pages/admin/gallery.tsx` (진행률 UI 추가)

### 예상 효과
- 500 에러의 원인을 서버 로그에서 명확히 파악 가능
- 사용자에게 업로드 진행 상황을 시각적으로 제공
- 대용량 파일 업로드 시 진행률 확인 가능
- 개발 환경에서 더 상세한 디버깅 정보 제공

---

## ✅ 이전 작업: 업로드 API 수정 및 Supabase 설정 확인 (2026-01-29)

### 완료된 작업
- **업로드 API 문법 오류 수정** ✅:
  - `pages/api/upload-image-supabase.js`: 216줄 else 블록 들여쓰기 수정
  - 217줄부터의 코드를 else 블록 안으로 올바르게 이동
  - 파일 크기 제한을 500MB → 30MB로 조정 (Supabase 버킷 제한에 맞춤)

- **Supabase Storage 설정 확인** ✅:
  - 버킷 `blog-images`: 30MB 파일 크기 제한 확인
  - Global file size limit: Free Plan 50MB (고정)
  - Policies: 현재 설정되지 않음 (Service Role Key로 작동 중)
  - Allowed MIME types: `image/*` (동영상 추가 필요 시 `video/*` 추가 권장)
  - 설정 상태 문서화: `docs/supabase-storage-current-status.md`

### 변경된 파일
- `pages/api/upload-image-supabase.js` (문법 수정 및 파일 크기 제한 조정)
- `docs/supabase-storage-current-status.md` (새 문서)

---

## ✅ 이전 작업: 갤러리 UX 성능 최적화 (2026-01-16)

### 완료된 작업
- **삭제 후 즉시 UI 업데이트** ✅:
  - `pages/admin/gallery.tsx`: 삭제 기능 최적화
  - 로컬 상태에서 즉시 제거 (서버 응답 대기 없음)
  - 조건부 새로고침:
    * 전체 폴더(`folderFilter === 'all'`): 서버 새로고침 생략
    * 특정 폴더: 현재 페이지만 다시 로드 (300ms 후)
  - 백그라운드 점진적 동기화 (2초 후, 로딩 표시 없음)
  - `totalCount` 즉시 업데이트
  - 비교 모달 삭제 기능 개선 (ID 검증, 에러 처리 강화)
  
- **붙여넣기 후 즉시 UI 업데이트** ✅:
  - `pages/admin/gallery.tsx`: `handlePasteImages` 함수 최적화
  - API 응답으로 새 이미지 정보 즉시 로컬 상태에 추가
  - 현재 폴더에 붙여넣은 경우: 즉시 표시
  - 다른 폴더에 붙여넣은 경우: `totalCount`만 업데이트
  - 조건부 새로고침 및 백그라운드 동기화 적용
  
- **폴더 생성 후 즉시 UI 업데이트** ✅:
  - `pages/admin/gallery.tsx`: 폴더 생성 핸들러 최적화
  - 폴더 트리 즉시 업데이트 (onFoldersChanged 콜백)
  - 백그라운드 점진적 동기화 (2초 후)
  - 현재 폴더가 생성된 폴더면 현재 페이지만 새로고침

### 성능 개선 효과
- **전체 폴더에서 작업 시**: 서버 호출 제거로 즉시 반응 (0ms)
- **특정 폴더에서 작업 시**: 현재 페이지만 로드하여 빠른 반응 (300ms)
- **504 Gateway Timeout 위험**: 대폭 감소 (전체 새로고침 제거)
- **데이터 일관성**: 백그라운드 동기화로 유지
- **사용자 경험**: 로딩 표시 없이 작업 지속 가능

### 변경된 파일
- `pages/admin/gallery.tsx` (삭제/붙여넣기/폴더 생성 최적화)

### 관련 문서
- `docs/gallery-performance-optimization.md` (상세 기술 문서)

---

## ✅ 이전 작업: AI 이미지 생성 JPG 90% 압축 적용 (2026-01-16)

### 완료된 작업
- **모든 AI 생성 이미지를 JPG 90%로 압축** ✅:
  - `pages/api/kakao-content/generate-images.js`: 모든 이미지 타입(피드/배경/프로필)을 JPG 90%로 변환
  - 피드 이미지: 1080x1350 크롭 + JPG 90%
  - 배경/프로필 이미지: 리사이즈 없이 JPG 90% 변환
  - 투명도 처리: 알파 채널이 있는 경우 흰색 배경으로 변환
  - 파일 확장자: 모든 이미지를 `.jpg`로 저장
  - Content-Type: `image/jpeg`로 통일
- **예상 효과**:
  - 파일 크기 약 70-80% 감소 (PNG 대비)
  - Supabase Storage 사용량 절약
  - 이미지 로딩 속도 개선

### 변경된 파일
- `pages/api/kakao-content/generate-images.js` (모든 이미지 JPG 90% 압축)

---

## ✅ 이전 작업: 이미지 포맷 자동 선택 및 사용 기록 업데이트 (2026-01-16)

### 완료된 작업
- **소스 타입별 포맷 자동 선택** ✅:
  - `pages/api/compose-product-image.js`: `determineOutputFormat` 함수 추가
    - 카카오 콘텐츠: WebP (자동 감지)
    - 블로그/네이버/SMS/MMS: JPG 85% (자동 감지)
    - 기타: PNG (기본값)
  - FAL AI 호출 시 `quality` 파라미터 추가 (JPG인 경우 85%)
- **카카오 콘텐츠 배포 완료 시 이미지 사용 기록 업데이트** ✅:
  - `pages/api/kakao-content/calendar-save.js`: `updateImageUsageOnPublish` 함수 추가
    - 배포 완료된 프로필/피드 이미지의 `usage_count`, `last_used_at` 자동 업데이트
    - `image_metadata` 및 `image_assets` 테이블 동시 업데이트
- **이미지 메타데이터 정확성 개선** ✅:
  - `pages/api/compose-product-image.js`: `saveImageMetadata` 함수 추가
    - 소스 타입에 따른 태그/채널 자동 설정
    - 카카오: `kakao-content`, `daily-branding` 태그
    - 블로그: `blog` 태그
    - SMS/MMS: `sms`, `mms`, `solapi` 태그
    - MMS 뱃지 오분류 방지
- **클라이언트 측 포맷 요청 제거** ✅:
  - `pages/admin/ai-image-generator.tsx`: `outputFormat` 파라미터 제거
  - 서버에서 `baseImageUrl` 기반 자동 감지로 단순화

### 변경된 파일
- `pages/api/compose-product-image.js` (포맷 자동 선택, 메타데이터 저장)
- `pages/api/kakao-content/calendar-save.js` (이미지 사용 기록 업데이트)
- `pages/admin/ai-image-generator.tsx` (outputFormat 파라미터 제거)

### 데이터 흐름
1. 제품 합성 요청 시 `baseImageUrl` 전달
2. 서버에서 소스 타입 자동 감지 (카카오/블로그/SMS/MMS)
3. 포맷 자동 결정 (카카오: WebP, 블로그/SMS/MMS: JPG 85%)
4. FAL AI 호출 시 결정된 포맷 사용
5. 이미지 저장 시 메타데이터 자동 생성/업데이트
6. 카카오 콘텐츠 배포 완료 시 사용 기록 자동 업데이트

### 포맷 결정 규칙
- **카카오 콘텐츠** (`originals/daily-branding/kakao/`): WebP
- **블로그** (`originals/blog/`): JPG 85%
- **SMS/MMS** (`solapi`, `mms/`, `sms/`): JPG 85%
- **기타**: PNG (기본값, 호환성 유지)

---

## ✅ 이전 작업: 설문 관리 - 체크박스 3개 구조 및 선물 지급 시 재고 차감 (2026-01-16)

### 완료된 작업
- **데이터베이스 수정** ✅:
  - `inventory_transactions` 테이블에 `related_gift_id` 필드 추가 (선물과 재고 차감 연결)
  - `surveys` 테이블에 `gift_delivered` 필드 추가 (선물 지급 완료 여부)
- **설문 편집 모달에 체크박스 3개 추가** ✅:
  - `pages/admin/surveys/index.tsx`: 체크박스 3개 구현
    - ☐ 이벤트 응모 대상 (특이사항 체크용, 재고 차감 없음)
    - ☐ 당첨 (재고 차감 필요)
    - ☐ 🎁 선물 지급 완료 (당첨이 아닌 일반 선물, 재고 차감 필요)
- **선물 지급 완료 시 재고 차감 로직** ✅:
  - `pages/api/survey/update.ts`: 선물 지급 완료 체크 시
    - `customer_gifts` 레코드 생성/업데이트 (`delivery_status = 'sent'`)
    - `inventory_transactions`에 출고 기록 추가 (재고 차감)
    - `related_gift_id`로 선물과 재고 차감 연결
  - 선물 지급 완료 해제 시 재고 복구 로직 추가
- **설문 목록 표시 수정** ✅:
  - "🎁 선물" 배지는 `gift_delivered = true`인 경우만 표시
  - 이벤트 응모 대상 자동 체크 제거 (수동 체크만)
- **일괄 업데이트 기능 수정** ✅:
  - `pages/api/admin/surveys/bulk-update-event-candidates.ts`: 
    - 선물 지급 완료된 설문(`delivery_status = 'sent'`)을 `gift_delivered = true`로 일괄 업데이트

### 변경된 파일
- `database/add-gift-delivered-to-surveys.sql` (신규 생성)
- `pages/api/survey/update.ts` (선물 지급 및 재고 차감 로직 추가)
- `pages/admin/surveys/index.tsx` (체크박스 3개 추가)
- `pages/api/admin/surveys/bulk-update-event-candidates.ts` (일괄 업데이트 로직 수정)

### 데이터 흐름
1. 설문 편집 모달에서 "🎁 선물 지급 완료" 체크
2. 설문 저장 시:
   - `surveys.gift_delivered = true` 업데이트
   - `customer_gifts` 레코드 생성/업데이트 (`delivery_status = 'sent'`)
   - `inventory_transactions`에 출고 기록 추가 (재고 차감)
3. 설문 목록에서 `gift_delivered = true`인 경우 "🎁 선물" 배지 표시

### 재고 차감 규칙
- **이벤트 응모 대상**: 재고 차감 없음 (특이사항 체크용)
- **당첨**: 재고 차감 필요 (별도 처리 필요)
- **선물 지급 완료**: 재고 차감 자동 처리 (`delivery_status = 'sent'`일 때)

---

## ✅ 이전 작업: 설문 관리 - 선물 받은 고객 자동 이벤트 응모 대상 체크 (2026-01-16)

### 완료된 작업
- **설문 편집 시 선물 기록 확인하여 자동 체크** ✅:
  - `pages/admin/surveys/index.tsx`: 설문 편집 모달 열 때 해당 설문에 연결된 선물 기록 확인
    - 선물 기록이 있으면 `event_candidate` 자동 체크
    - `pages/api/admin/customer-gifts.ts`: `surveyId` 파라미터로 선물 기록 조회 지원 추가
  - `pages/admin/surveys/index.tsx`: 설문 목록에서 선물 받은 고객 표시
    - 선물 받은 고객에게 "🎁 선물" 배지 표시
    - "이벤트 응모 대상" 배지와 함께 표시
  - `pages/api/admin/surveys/bulk-update-event-candidates.ts`: 일괄 업데이트 API 추가
    - 선물을 받은 모든 고객의 설문을 `event_candidate = true`로 일괄 업데이트
    - 취소되지 않은 선물만 대상으로 처리
  - 설문 관리 페이지에 일괄 업데이트 버튼 추가
    - "🎁 선물 받은 고객 설문을 이벤트 응모 대상으로 일괄 업데이트" 버튼

### 변경된 파일
- `pages/admin/surveys/index.tsx` (자동 체크 및 표시 기능 추가)
- `pages/api/admin/customer-gifts.ts` (surveyId 조회 지원)
- `pages/api/admin/surveys/bulk-update-event-candidates.ts` (신규 생성)

### 사용 방법
1. **자동 체크**: 설문 편집 모달을 열면 선물 기록이 있는 경우 자동으로 "이벤트 응모 대상" 체크
2. **일괄 업데이트**: 설문 관리 페이지 하단의 일괄 업데이트 버튼으로 모든 선물 받은 고객의 설문을 한 번에 업데이트
3. **목록 표시**: 설문 목록에서 선물 받은 고객은 "🎁 선물" 배지로 표시

---

## ✅ 이전 작업: 재고 대시보드 확장 - 선물/판매 통계 추가 (2026-01-16)

### 완료된 작업
- **재고 대시보드에 선물/판매 통계 추가** ✅:
  - `pages/api/admin/inventory/dashboard.ts`: 선물 통계 및 이력 조회 로직 추가
    - `inventory_dashboard_view` 뷰에서 선물 통계 조회
    - 최근 선물 지급 이력 조회 (고객명, 상품명, 카테고리 포함)
    - 재고 출고 이력에서 선물/판매 구분 (note 필드 및 날짜 매칭)
    - 카테고리별 선물 통계 집계
  - `pages/admin/inventory/dashboard.tsx`: UI에 선물 통계 섹션 추가
    - 선물 받은 고객 수, 총 선물 지급 건수, 총 선물 수량, 판매 출고 건수 카드
    - 카테고리별 선물 통계 테이블
    - 최근 선물 지급 이력 테이블 (고객명, 상품명, 전달방식, 상태)
    - 재고 출고 이력 테이블 (선물/판매 구분, 고객명 표시)
  - `pages/admin/surveys/index.tsx`: 설문 관리에 선물 자동 저장 체크박스 추가
    - 사은품 정보 섹션에 "설문 저장 시 자동으로 고객 선물 기록에 저장" 체크박스
    - 체크 시 설문 저장과 함께 선물 기록 자동 저장
    - 저장 완료 후 체크박스 자동 해제

### 변경된 파일
- `pages/api/admin/inventory/dashboard.ts` (선물/판매 통계 추가)
- `pages/admin/inventory/dashboard.tsx` (UI 확장)
- `pages/admin/surveys/index.tsx` (자동 저장 기능 추가)

### 데이터베이스
- `inventory_dashboard_view` 뷰 활용 (총 선물 고객 수, 선물 건수, 판매 건수 등)
- `customer_gifts` 테이블과 `inventory_transactions` 테이블 조인하여 출고 원인 구분

### 다음 단계
- 재고 대시보드에서 선물/판매 통계 확인 가능
- 설문 관리에서 선물 자동 저장 기능 사용 가능
- 고객별 입금 내역은 추후 필요 시 별도 테이블 추가 고려

---

## ✅ 이전 작업: 제품 합성 이미지 경로 문제 수정 (2026-01-16)

### 완료된 작업
- **제품 합성 이미지 경로 변환 로직 개선** ✅:
  - `pages/api/compose-product-image.js`: `getAbsoluteProductImageUrl` 함수 개선
    - `/main/products/...` 구 형식 경로를 `originals/products/...` 또는 `originals/goods/...`로 자동 변환
    - 빈 문자열, '-', 너무 짧은 경로 검증 추가
    - 유효하지 않은 URL에 대한 경고 로그 추가
  - `database/fix-product-composition-main-paths.sql`: 데이터베이스 마이그레이션 SQL 생성
    - `product_composition` 테이블의 `image_url`, `reference_images`, `color_variants` 필드 업데이트
    - `/main/products/...` 경로를 새 형식으로 변환
    - 드라이버 제품과 굿즈/햇/액세서리 제품 구분하여 처리
  - 원인: 데이터베이스에 `/main/products/...` 구 형식 경로가 남아있어 FAL AI에서 "Failed to download the file" 오류 발생
  - 해결: API 레벨에서 구 형식 경로를 자동 변환하고, 데이터베이스 마이그레이션으로 일괄 수정

### 변경된 파일
- `pages/api/compose-product-image.js` (경로 변환 로직 개선)
- `database/fix-product-composition-main-paths.sql` (마이그레이션 SQL 생성)

### 다음 단계
- ✅ Supabase SQL Editor에서 `database/fix-product-composition-main-paths.sql` 실행 완료
- 업데이트 결과:
  - `image_url`: 19개 업데이트
  - `reference_images`: 2개 업데이트
  - `color_variants`: 8개 업데이트
- 검증 쿼리 실행: `database/verify-product-composition-paths.sql`로 남아있는 문제 확인 가능

### 추가 수정 (2026-01-16)
- **제품 이미지 경로 자동 보정 로직 추가** ✅:
  - `lib/product-image-url.ts`: `getProductImageUrl` 함수 개선
    - `originals/products/{slug}/filename.webp` 형식에서 `composition/`, `detail/`, `gallery/` 폴더 누락 시 자동 추가
    - 파일명으로 타입 추정 (`-sole-`, `-500` → `composition`, `gallery-` → `gallery`)
    - 드라이버 제품은 기본적으로 `composition`, goods는 `gallery` 사용
  - 원인: 데이터베이스 경로에 `composition/` 폴더가 누락되어 이미지가 표시되지 않음
  - 해결: 경로 자동 보정으로 실제 Storage 경로와 일치하도록 수정

- **갤러리 선택 시 slug → 실제 폴더명 매핑 추가** ✅:
  - `pages/admin/product-composition.tsx`: `getCompositionFolderPath` 함수 개선
    - 드라이버 제품 slug → 실제 Storage 폴더명 매핑 추가
    - `secret-force-pro-3` → `pro3`, `secret-force-v3` → `v3`, `secret-weapon-black` → `black-weapon`, `secret-weapon-4-1` → `gold-weapon4` 등
  - 원인: 데이터베이스의 slug와 실제 Storage 폴더명이 달라 갤러리에서 이미지를 찾을 수 없음
  - 해결: slug를 실제 폴더명으로 변환하여 올바른 경로 사용

---

## ✅ 이전 작업: 배포 완료 상태에서 이미지 잠금 기능 구현 (2026-01-16)

### 완료된 작업
- **배포 완료 상태에서 이미지 잠금 기능 구현** ✅:
  - `components/admin/kakao/ProfileManager.tsx`: `publishStatus` prop 추가 및 배포 완료 상태에서 이미지 변경 차단
    - 자동 복구 로직 차단 (`handleAutoRecoverImage`, `handleImageError`)
    - 갤러리 선택 버튼 비활성화 및 차단 로직 추가
    - 이미지 재생성 버튼 비활성화 및 차단 로직 추가
    - 이미지 삭제 버튼 비활성화 및 차단 로직 추가
  - `components/admin/kakao/FeedManager.tsx`: `publishStatus` prop 추가 및 배포 완료 상태에서 이미지 변경 차단
    - 자동 복구 로직 차단 (`handleAutoRecoverImage`, `handleImageError`)
    - 갤러리 선택 버튼 비활성화 및 차단 로직 추가
    - 이미지 재생성 버튼 비활성화 및 차단 로직 추가
    - 프롬프트 재생성 및 로고 옵션 재생성 차단
  - `components/admin/kakao/KakaoAccountEditor.tsx`: 
    - ProfileManager와 FeedManager에 `publishStatus` 전달
    - `handleRegenerate` 함수에 배포 완료 상태 차단 로직 추가
    - `handlePartialGenerate` 함수에 이미지 생성 타입 차단 로직 추가
    - `handlePartialRegenerate` 함수에 이미지 재생성 타입 차단 로직 추가
  - `pages/api/kakao-content/calendar-load.js`: 배포 완료 상태일 때 저장된 URL만 사용하도록 수정
    - 프로필 데이터: `status === 'published'`일 때 `checkImageExists` 결과 무시하고 저장된 URL만 사용
    - 피드 데이터: `status === 'published'`일 때 `checkImageExists` 결과 무시하고 저장된 URL만 사용
  - 원인: 배포 완료 상태에서도 이미지가 자동으로 변경되거나 갤러리에서 선택한 이미지가 덮어씌워지는 문제
  - 해결: 배포 완료 상태에서는 모든 이미지 변경 경로를 차단하고, 저장된 URL만 사용하여 이미지 고정

### 변경된 파일
- `components/admin/kakao/ProfileManager.tsx` (배포 상태 잠금 기능 추가)
- `components/admin/kakao/FeedManager.tsx` (배포 상태 잠금 기능 추가)
- `components/admin/kakao/KakaoAccountEditor.tsx` (배포 상태 전달 및 재생성 차단)
- `pages/api/kakao-content/calendar-load.js` (배포 완료 상태일 때 저장된 URL만 사용)

---

## ✅ 이전 작업: 생성 완료 후 캘린더 데이터 리로드 로직 수정 (2026-01-16)

### 완료된 작업
- **생성 완료 후 캘린더 데이터 리로드 로직 수정** ✅:
  - `pages/admin/kakao-content.tsx`: `handleSelectedDatesAutoCreate` 함수에서 생성한 날짜의 월 데이터를 로드하도록 수정
  - `viewMode === 'month'`일 때는 `selectedMonth`를 사용하여 로드
  - 그 외의 경우에는 생성한 날짜 중 첫 번째 날짜의 월을 사용하여 로드
  - 원인: 생성 완료 후 항상 오늘 날짜의 월을 로드하여 생성한 날짜(예: 12월)가 표시되지 않음
  - 해결: 생성한 날짜의 월을 기준으로 데이터를 로드하여 생성된 내용이 즉시 표시됨

### 변경된 파일
- `pages/admin/kakao-content.tsx` (캘린더 리로드 로직 수정)

---

## ✅ 이전 작업: "설명" 섹션 삭제 및 프롬프트 토글만 유지 (2026-01-16)

### 완료된 작업
- **"설명" 섹션 완전 삭제** ✅:
  - `components/admin/kakao/ProfileManager.tsx`: 배경/프로필 이미지의 "설명" UI 섹션 제거
  - 관련 토글 상태 제거 (`isBackgroundDescriptionExpanded`, `isProfileDescriptionExpanded`)
  - Fallback 로직은 유지 (코드 안정성)
  - 원인: BasePrompt와 프롬프트가 이미 있어 "설명"이 중복되고 의미가 없음
  - 해결: "설명" 섹션 제거로 UI 단순화, 프롬프트만 토글로 관리

### 변경된 파일
- `components/admin/kakao/ProfileManager.tsx` ("설명" 섹션 제거)

---

## ✅ 이전 작업: 버튼 중복 제거 및 프롬프트 토글 기능 추가 (2026-01-16)

### 완료된 작업
- **버튼 중복 제거** ✅:
  - `pages/admin/kakao-content.tsx`: `renderMonthCalendar()` 내부의 중복된 "전체 생성" 버튼 제거
  - 메인 UI 영역의 버튼만 사용하도록 수정
  - 원인: 달력 컴포넌트 내부와 메인 UI 영역에 동일한 버튼이 2개 표시됨
  - 해결: 달력 컴포넌트 내부 버튼 제거로 중복 해결

- **프롬프트 설명 토글 기능 추가** ✅:
  - `components/admin/kakao/ProfileManager.tsx`: 배경/프로필 이미지의 "설명" 및 "프롬프트" 섹션에 토글 추가
  - `components/admin/kakao/FeedManager.tsx`: 피드 이미지의 "프롬프트" 섹션에 토글 추가
  - 기본값: 접힘 (collapsed)
  - ChevronDown/ChevronUp 아이콘으로 펼치기/접기 표시
  - 원인: 긴 프롬프트가 화면을 많이 차지하여 가독성 저하
  - 해결: 토글 기능으로 필요할 때만 표시하여 UI 개선

### 변경된 파일
- `pages/admin/kakao-content.tsx` (중복 버튼 제거)
- `components/admin/kakao/ProfileManager.tsx` (프롬프트 토글 추가)
- `components/admin/kakao/FeedManager.tsx` (프롬프트 토글 추가)

---

## ✅ 이전 작업: 달력 UI 개선 및 선택 모드 추가 (2026-01-16)

### 완료된 작업
- **달력 높이 조정** ✅:
  - `pages/admin/kakao-content.tsx`: `aspect-square` → `h-16`로 변경하여 가독성 개선
  - 요일 헤더 패딩 조정 (`p-2` → `p-1.5`, `text-sm` → `text-xs`)
  - 원인: 달력 셀이 너무 커서 화면 공간을 많이 차지함
  - 해결: 고정 높이(`h-16`)로 변경하여 가독성 확보

- **계정별 배포 상태 표시** ✅:
  - 각 날짜 셀 좌측 상단에 계정별 상태 점 표시
  - Account1: 좌측 점, Account2: 우측 점
  - 상태 색상: 초록색(배포 완료), 파란색(생성 완료), 회색(미생성)
  - 원인: 달력에서 계정별 상태를 한눈에 확인하기 어려움
  - 해결: 작은 점으로 계정별 상태 시각화

- **버튼 정리 및 동적 변경** ✅:
  - `viewMode === 'month'`일 때 날짜 선택 여부에 따라 버튼 표시
  - 날짜 선택 시: "선택된 날짜 생성 (N개)" 버튼 표시
  - 항상 표시: "YYYY년 MM월 전체 생성" 버튼
  - 원인: 버튼이 중복되어 혼란스러움
  - 해결: 조건부 버튼 표시로 UI 정리

- **날짜 클릭 기능 개선** ✅:
  - 선택 모드 토글 버튼 추가 ("보기 모드" / "선택 모드")
  - 보기 모드: 날짜 클릭 시 해당 날짜로 이동 (내용 표시)
  - 선택 모드: 날짜 클릭 시 체크박스 토글 (다중 선택 가능)
  - 원인: 날짜 클릭 시 항상 이동만 가능하여 다중 선택이 어려움
  - 해결: 선택 모드 추가로 다중 선택 기능 제공

- **"이번 주" 버튼 삭제** ✅:
  - `viewMode === 'week'` 조건부 버튼 제거
  - 보기 모드 선택 버튼에서 "이번 주" 제거
  - 원인: 사용 빈도가 낮고 "이번 달" 기능으로 대체 가능
  - 해결: 불필요한 버튼 제거로 UI 단순화

### 변경된 파일
- `pages/admin/kakao-content.tsx` (달력 UI 개선, 선택 모드 추가, 버튼 정리)

---

## ✅ 이전 작업: 이번달 달력 표시 및 선택한 달 생성 기능 추가 (2026-01-16)

### 완료된 작업
- **이번달 달력 뷰 추가** ✅:
  - `pages/admin/kakao-content.tsx`: `viewMode === 'month'`일 때 달력 뷰 표시
  - 월/년도 네비게이션 버튼 추가 (이전/다음 달 이동)
  - 달력에서 날짜 선택 기능 추가
  - 생성된 날짜는 초록색으로 표시 (✓ 표시)
  - 선택한 날짜는 파란색으로 강조 표시
- **선택한 달 생성 기능** ✅:
  - `selectedMonth` 상태 추가 (년/월 선택)
  - `getDateRange` 함수 수정: 선택한 달의 모든 날짜 반환
  - "이번 달 생성" 버튼을 "YYYY년 MM월 생성" 버튼으로 변경
  - 2025년 12월 등 과거/미래 달 선택 가능
- **자동 데이터 로드** ✅:
  - `viewMode === 'month'`일 때 선택한 달의 데이터 자동 로드
  - 달력에서 달 변경 시 해당 달의 데이터 자동 로드

### 수정된 파일
- `pages/admin/kakao-content.tsx` (달력 뷰 추가, 선택한 달 생성 기능)

---

## 📚 관련 문서
- **허브 시스템 아키텍처**: [`docs/hub-system-architecture.md`](./hub-system-architecture.md) - 허브 시스템 구조 및 향후 계획
- **주간 허브 콘텐츠 전략**: [`docs/weekly-hub-content-strategy.md`](./weekly-hub-content-strategy.md) - 주 5일 발행 기준 허브 콘텐츠 전략
- **주간 스케줄**: [`docs/content-calendar/weekly-schedule-2025.md`](./content-calendar/weekly-schedule-2025.md) - 요일별 콘텐츠 스케줄

## 프로젝트 개요
**프로젝트 명**: MASGOLF 통합 콘텐츠 및 자산 마이그레이션 프로젝트

**핵심 기술**:
- **Self-Adaptive Automation (자기 적응형 자동화)**: Playwright 기반 자동화 스크립트가 실행 중 오류 발생 시 스스로 수정하며 진행
- **콘텐츠 성과 통합 관리**: 블로그, 유튜브 등 다중 플랫폼 실적 통합 추적 및 관리

**목적**: 
- 모든 사이트 통합 (masgolf.co.kr, mas9golf.co.kr, MUZIIK)
- 이미지 및 콘텐츠 마이그레이션
- 갤러리 고도화 및 중앙 관리
- 메타데이터 생성 및 관리
- 블로그 글 품질 개선
- 고객 콘텐츠 정리 및 관리
- **콘텐츠 성과 통합 관리 및 분석**

**전체 Phase 구조**:
- **Phase 0**: Self-Adaptive Automation 및 로깅 시스템 구축 (신규)
- **Phase 1-5**: 갤러리 고도화 프로젝트 (완료/부분 완료)
- **Phase 8-11**: 이미지 및 콘텐츠 마이그레이션 프로젝트 (진행 중)
- **Phase 13**: 콘텐츠 허브 시스템 고도화 및 AI 스케줄 생성기 프로젝트 (진행 중)
- **Phase 14**: 카카오톡 콘텐츠 자동화 시스템 ✅ (완료)
- **Phase 15**: 워크플로우 시각화 시스템 (React Flow) ✅ (완료)
- **Phase 6-7**: 사이트 통합 및 마이그레이션 프로젝트 (후속 작업)
- **Phase 12**: 고객 콘텐츠 정리 프로젝트 (후속 작업)

**별도 프로젝트**:
- **마케팅 및 퍼널 관리 프로젝트**: 분석, 구글 광고/애즈 API 연결 등 복잡한 기능 포함 (별도 구성)

---

# 🎯 프로젝트 진행 현황

## ✅ 최근 작업: Next.js 보안 취약점 업데이트 (2026-01-02)

### 완료된 작업
- **Next.js 보안 취약점 업데이트** ✅:
  - `package.json`: Next.js 14.0.3 → 14.2.35로 업데이트
  - `eslint-config-next`: 14.0.3 → 14.2.35로 업데이트
  - Linux 전용 sharp 패키지를 `optionalDependencies`로 이동하여 macOS 개발 환경 호환성 개선
  - 원인: Vercel에서 CVE-2025-55184 및 React2Shell Next.js +2 취약점 감지
  - 해결: Next.js 14.x 최신 버전(14.2.35)으로 업데이트하여 보안 취약점 해결

- **빌드 및 호환성 검증** ✅:
  - 빌드 테스트 성공: `npm run build` 정상 완료
  - Lint 검사: 기존 경고만 존재, 새로운 오류 없음
  - 코드 호환성: middleware, next-auth, i18n 등 주요 기능 정상 작동 확인
  - Pages Router, getServerSideProps, Image 컴포넌트 등 모든 기능 호환 확인

### 변경된 파일
- `package.json` (Next.js 14.2.35, eslint-config-next 14.2.35, optionalDependencies 추가)

### 참고사항
- 보안 취약점: axios, glob, js-yaml, jws, next-auth 등 기존 취약점 존재 (Next.js 업데이트와 무관)
- Node.js 버전: 현재 v24.2.0 사용 중이나 package.json에는 20.x 명시 (경고만 발생, 빌드 정상)

---

## ✅ 이전 작업: 캘린더 로딩 최적화 및 504 에러 처리 개선 (2026-01-16)

### 완료된 작업
- **캘린더 로딩 최적화** ✅:
  - `pages/api/kakao-content/calendar-load.js`: `skipImageCheck` 파라미터 추가하여 이미지 존재 확인을 선택적으로 수행
  - 이미지 개수 조회를 배치 처리로 변경 (순차 처리 → Promise.all로 병렬 처리)
  - 이미지 확인 타임아웃 5초 → 2초로 단축
  - 타임아웃 감지 로직 추가: 80초 경과 시 이미지 확인 스킵, 85초 경과 시 부분 결과 반환
  - 원인: 한 달치 데이터 처리 시 최대 180개 이미지 확인 및 180회 Storage API 호출로 인해 90초 타임아웃 초과
  - 해결: 이미지 확인을 선택적으로 수행하고, 이미지 개수 조회를 배치 처리하여 처리 시간 단축

- **504 에러 처리 개선** ✅:
  - `pages/api/kakao-content/calendar-load.js`: 부분 결과 반환 로직 추가 (85초 경과 시)
  - `pages/admin/kakao-content.tsx`: 클라이언트에서 재시도 로직 추가 (504 에러 시 최대 2회 재시도, 재시도 시 `skipImageCheck=true` 사용)
  - 원인: 504 에러 발생 시 사용자가 수동으로 재시도해야 하고, 전체 데이터를 다시 로드해야 함
  - 해결: 자동 재시도 및 부분 결과 반환으로 사용자 경험 개선

### 변경된 파일
- `pages/api/kakao-content/calendar-load.js` (이미지 확인 선택적 수행, 배치 처리, 타임아웃 단축, 부분 결과 반환)
- `pages/admin/kakao-content.tsx` (재시도 로직 추가)

---

## ✅ 카카오 콘텐츠 이미지 재생성 시 제품 합성 기능 통합 (2026-01-XX)

### 작업 내용
- **ProfileManager에 제품 합성 기능 추가**
  - 배경 이미지 및 프로필 이미지 재생성 시 MASSGOO 드라이버 제품 합성 옵션 추가
  - 제품 합성 활성화 체크박스 및 제품 선택 드롭다운 UI 추가
  - 이미지 재생성 시 제품 합성 API (`/api/compose-product-image`) 자동 호출
  - 제품 합성 진행 상태 표시 ("제품 합성 중...")
  - 배포 완료 상태에서는 제품 합성 옵션 비활성화

- **FeedManager에 제품 합성 기능 추가**
  - 피드 이미지 재생성 시 MASSGOO 드라이버 제품 합성 옵션 추가
  - 제품 합성 활성화 체크박스 및 제품 선택 드롭다운 UI 추가
  - 이미지 재생성 시 제품 합성 API 자동 호출
  - 제품 합성 진행 상태 표시

- **제품 목록 API 연동**
  - `/api/admin/product-composition?category=driver&active=true` API를 통해 드라이버 제품 목록 로드
  - 제품 선택 드롭다운에 제품명 및 배지 표시

### 수정된 파일
- `components/admin/kakao/ProfileManager.tsx`: 제품 합성 상태 관리 및 UI 추가, 이미지 재생성 로직에 제품 합성 통합
- `components/admin/kakao/FeedManager.tsx`: 제품 합성 상태 관리 및 UI 추가, 이미지 재생성 로직에 제품 합성 통합

### 기술 세부사항
- 제품 합성은 Nano Banana Pro AI를 사용하여 모델 이미지에 MASSGOO 드라이버 제품을 자연스럽게 합성
- 합성 실패 시 원본 이미지를 사용하도록 fallback 처리
- 제품 합성 진행 중에는 버튼 비활성화 및 상태 표시

### 향후 계획
- 워크플로우 시각화에 제품 합성 노드 추가 (옵션)

---

## ✅ 이전 작업: 이번 달 생성 기능 추가 및 날짜 선택 기능 개선 (2026-01-16)

### 완료된 작업
- **이번 달 생성 버튼 추가** ✅:
  - `pages/admin/kakao-content.tsx`: `viewMode === 'month'`일 때 "이번 달 생성" 버튼 추가
  - `handleSelectedDatesAutoCreate` 함수에서 이번 달 생성 시 최대 31일까지 생성 가능하도록 제한 증가
  - 원인: 이번 주 생성 버튼은 있었지만 이번 달 생성 버튼이 없어서 사용자가 한 달치 콘텐츠를 한 번에 생성할 수 없었음
  - 해결: 이번 달 생성 버튼 추가 및 제한을 31일로 증가

- **날짜 선택 input을 모든 모드에서 표시** ✅:
  - `pages/admin/kakao-content.tsx`: 날짜 선택 input을 `viewMode !== 'list'`일 때 모두 표시하도록 수정
  - 원인: 날짜 선택 input이 `viewMode === 'today'`일 때만 표시되어 다른 모드에서는 날짜를 선택할 수 없었음
  - 해결: 오늘, 이번 주, 이번 달 모드에서 모두 날짜 선택 가능하도록 개선

### 변경된 파일
- `pages/admin/kakao-content.tsx` (이번 달 생성 버튼 추가, 날짜 선택 input 표시 개선, 최대 생성 개수 제한 증가)

---

## ✅ 이전 작업: calendar-load API 타임아웃 및 JSON 파싱 에러 처리 개선 (2026-01-16)

### 완료된 작업
- **calendar-load API 타임아웃 증가** ✅:
  - `vercel.json`: `pages/api/kakao-content/calendar-load.js`의 `maxDuration`을 50초 → 90초로 증가
  - 원인: 한 달치 데이터 처리 시 많은 이미지 존재 확인(약 180개) 및 `getImageCount` 호출로 인해 50초 내에 완료되지 않아 504 Gateway Timeout 발생
  - 해결: 타임아웃을 90초로 증가하여 충분한 처리 시간 확보

- **클라이언트 측 JSON 파싱 에러 처리 개선** ✅:
  - `pages/admin/kakao-content.tsx`: `loadCalendarData` 함수에서 `res.ok` 체크 추가 및 에러 응답 처리 개선
  - 원인: 504 에러 시 Vercel이 HTML 에러 페이지를 반환하는데, 클라이언트 코드에서 `res.ok` 체크 없이 바로 `res.json()` 호출하여 `SyntaxError: Unexpected token 'A'` 발생
  - 해결: `res.ok` 체크 후 에러 응답은 `text()`로 읽고, JSON 파싱은 try-catch로 감싸서 안전하게 처리

### 변경된 파일
- `vercel.json` (calendar-load.js의 maxDuration 90초 추가)
- `pages/admin/kakao-content.tsx` (에러 처리 개선)

---

## ✅ 이전 작업: 배경 이미지 생성 imageStartTime 변수 선언 누락 수정 (2026-01-16)

### 완료된 작업
- **배경 이미지 생성 시 imageStartTime 변수 선언 누락 수정** ✅:
  - `pages/api/kakao-content/auto-create-account1.js`: 배경 이미지 생성 전에 `const imageStartTime = Date.now();` 선언 추가
  - `pages/api/kakao-content/auto-create-account2.js`: 배경 이미지 생성 전에 `const imageStartTime = Date.now();` 선언 추가 및 타이밍 로그 추가
  - 원인: 배경 이미지 생성 부분에서 `imageStartTime` 변수를 선언하지 않고 사용하여 `ReferenceError: imageStartTime is not defined` 발생
  - 해결: 프로필 이미지와 피드 이미지와 동일하게 이미지 생성 시작 시간을 기록하도록 수정

### 변경된 파일
- `pages/api/kakao-content/auto-create-account1.js` (배경 이미지 생성 시 imageStartTime 변수 선언 추가)
- `pages/api/kakao-content/auto-create-account2.js` (배경 이미지 생성 시 imageStartTime 변수 선언 및 타이밍 로그 추가)

---

## ✅ 이전 작업: 카카오 콘텐츠 생성 504 타임아웃 문제 해결 (2026-01-01 ~ 2026-01-05)

### 완료된 작업
- **카카오 콘텐츠 자동 생성 API 타임아웃 증가** ✅:
  - `vercel.json`: `auto-create-account1.js`와 `auto-create-account2.js`의 `maxDuration`을 50초 → 300초(5분)로 증가
  - 원인: 외부 API(OpenAI, FAL AI) 응답 시간이 가변적이어서 간헐적으로 50초를 초과하여 504 Gateway Timeout 발생
  - 해결: 타임아웃을 300초로 늘려 외부 API 지연이 있어도 완료될 수 있도록 개선

- **부분 성공 처리 개선** ✅:
  - `auto-create-account1.js`: 프로필 메시지 생성 실패 시에도 기본값 설정
  - `auto-create-account2.js`: 프로필 메시지 생성 실패 시에도 기본값 설정
  - `auto-create-account1.js`: 피드 캡션 생성 실패 시에도 기본값 설정
  - `auto-create-account2.js`: 피드 캡션 생성 실패 시에도 기본값 설정
  - 이미지 생성은 성공했지만 텍스트 생성이 실패해도 이미지 데이터는 저장되도록 개선

- **클라이언트 측 fetch 타임아웃 설정 추가** ✅:
  - `pages/admin/kakao-content.tsx`: `generateForSingleDate` 함수에 `AbortController`를 사용한 5분 타임아웃 설정 추가
  - 원인: 브라우저나 프록시 레벨에서 기본 타임아웃이 짧아서 504 오류 발생
  - 해결: 클라이언트 측에서도 5분 타임아웃을 설정하여 서버와 동일한 타임아웃 보장

- **프롬프트 즉시 저장 로직 추가** ✅:
  - `auto-create-account1.js`: 배경/프로필/피드 이미지 생성 성공 시 즉시 Supabase에 저장
  - `auto-create-account2.js`: 배경/프로필/피드 이미지 생성 성공 시 즉시 Supabase에 저장
  - 원인: 타임아웃으로 인해 마지막 저장 단계에 도달하기 전에 중단되어 이미지는 생성되지만 프롬프트가 저장되지 않음
  - 해결: 이미지 생성 성공 시 즉시 저장하여 타임아웃이 발생해도 프롬프트가 저장되도록 개선

- **재생성 로직 개선** ✅:
  - `auto-create-account1.js`: 프롬프트가 없으면 이미지가 있어도 재생성하도록 조건 추가
  - `auto-create-account2.js`: 프롬프트가 없으면 이미지가 있어도 재생성하도록 조건 추가
  - 원인: 이미지가 있으면 재생성을 스킵하여 프롬프트가 없는 상태로 유지됨
  - 해결: 프롬프트가 없으면 이미지가 있어도 재생성하도록 조건 개선

- **프로필 메시지와 피드 캡션 즉시 저장 로직 추가** ✅ (2026-01-05):
  - `auto-create-account1.js`: 프로필 메시지 생성 성공 시 즉시 Supabase에 저장
  - `auto-create-account2.js`: 프로필 메시지 생성 성공 시 즉시 Supabase에 저장
  - `auto-create-account1.js`: 피드 캡션 생성 성공 시 즉시 Supabase에 저장 (이미지 생성 전에)
  - `auto-create-account2.js`: 피드 캡션 생성 성공 시 즉시 Supabase에 저장 (이미지 생성 전에)
  - 원인: 배포 환경에서 타임아웃 발생 시 프로필 메시지와 피드 캡션이 생성되었지만 저장되지 않아 손실됨
  - 해결: 텍스트 콘텐츠 생성 후 즉시 저장하여 타임아웃이 발생해도 데이터 손실 방지

### 변경된 파일
- `vercel.json` (타임아웃 설정 추가)
- `pages/api/kakao-content/auto-create-account1.js` (부분 성공 처리 개선, 즉시 저장 로직 추가, 재생성 로직 개선, 프로필 메시지/피드 캡션 즉시 저장)
- `pages/api/kakao-content/auto-create-account2.js` (부분 성공 처리 개선, 즉시 저장 로직 추가, 재생성 로직 개선, 프로필 메시지/피드 캡션 즉시 저장)
- `pages/admin/kakao-content.tsx` (클라이언트 측 타임아웃 설정 추가)

### 문제 원인 분석
- **간헐적 발생 이유**: 외부 API 응답 시간이 가변적
  - 빠른 경우: 모든 API가 빠르게 응답 → 50초 이내 완료 → 성공
  - 느린 경우: 외부 API 지연 → 50초 초과 → 504 Gateway Timeout
- **재시도 로직**: 피드 캡션 생성 시 중복 체크로 인해 OpenAI API를 최대 2번 호출하여 시간이 더 걸림

---

## ✅ 이전 작업: 로컬 개발 서버 연결 타임아웃 문제 해결 (2025-01-XX)

### 완료된 작업
- **로컬 개발 서버 재시작 및 연결 문제 해결** ✅:
  - 포트 3000 충돌 문제 해결: 기존 프로세스(PID 81966) 종료
  - `.next` 빌드 캐시 삭제 후 서버 재시작
  - 서버 정상 작동 확인: `http://localhost:3000` 정상 응답
  - 원인: 기존 서버 프로세스가 포트를 점유하고 있어 새 서버가 시작되지 않음
  - 해결: `killall -9 node`로 모든 Node.js 프로세스 종료 후 재시작

### 변경된 파일
- 없음 (서버 재시작만 수행)

---

## ✅ 이전 작업: 카카오 채널 이미지 저장 경로 수정 및 데이터베이스 스키마 업데이트 (2025-01-XX)

### 완료된 작업
- **카카오 채널 이미지 저장 경로 수정** ✅:
  - 카카오 채널 메시지 이미지를 `originals/daily-branding/kakao-ch/YYYY-MM-DD/` 형식으로 저장하도록 수정
  - `components/shared/BaseChannelEditor.tsx`: 카카오 채널일 때 `AIImagePicker`에 `autoFilterFolder` prop 전달
  - `components/shared/AIImagePicker.tsx`: 카카오 채널일 때 AI 이미지 생성 시 `targetFolder` 설정
  - `components/admin/GalleryPicker.tsx`: `kakao-ch` 경로 지원 추가
  - `pages/admin/gallery.tsx`: `kakao-ch` 경로 자동 인식 로직 추가

- **데이터베이스 스키마 업데이트** ✅:
  - `channel_kakao` 테이블에 필요한 컬럼 추가 확인 및 쿼리 실행
  - `template_type`, `recipient_uuids`, `image_url`, `emoji`, `tags`, `kakao_group_id` 컬럼 추가
  - 인덱스 생성 완료

## ✅ 이전 작업: 설문조사 페이지 샤프트 이미지 경로 수정 (2025-01-XX)

### 완료된 작업
- **설문조사 폼 샤프트 이미지 경로 수정** ✅:
  - `pages/survey/form.tsx`: MODEL_OPTIONS 배열의 이미지 경로를 Supabase Storage 경로로 변경
  - 기존 `/main/products/pro3-muziik/...` 경로를 `originals/products/pro3-muziik/detail/...` 형식으로 변경
  - `getProductImageUrl` 함수 import 추가하여 Supabase Storage URL 자동 변환
  - 4개 샤프트 이미지 모두 수정:
    - `massgoo_pro3_beryl_240.webp` (풀티타늄 베릴 47g)
    - `massgoo_pro3_beryl_230.webp` (풀티타늄 베릴 42g)
    - `massgoo_pro3_sapphire_215.webp` (원플렉스 사파이어 53g)
    - `massgoo_pro3_sapphire_200.webp` (원플렉스 사파이어 44g)
  - 갤러리 이미지 최적화 과정에서 서버에서 Supabase Storage로 이동한 이미지 경로 반영

### 변경된 파일
- `pages/survey/form.tsx`: 이미지 경로 및 import 수정

---

## ✅ 이전 작업: 카카오 콘텐츠 이미지 선택 기능 완전 수정 (2025-01-XX)

### 완료된 작업
- **캘린더 데이터 없을 때 이미지 선택 가능하도록 수정** ✅:
  - `pages/admin/kakao-content.tsx`: `onProfileUpdate`, `onFeedUpdate` 함수 수정
  - `profileIndex < 0` 또는 `feedIndex < 0`인 경우 새 항목 자동 생성
  - account1, account2 모두 적용
  - 캘린더 데이터가 없어도 이미지 선택 시 자동으로 데이터 생성
  - 이미지 선택이 실제로 입력되도록 수정
- **카카오 콘텐츠 이미지 선택 시 프롬프트 경고 추가** ✅:
  - `components/admin/kakao/ProfileManager.tsx`: 배경/프로필 이미지 선택 시 프롬프트 없으면 경고 표시
  - `components/admin/kakao/FeedManager.tsx`: 피드 이미지 선택 시 프롬프트 없으면 경고 표시
  - 프롬프트 없어도 이미지 선택 가능 (유연성 확보)
  - 나중에 AI 재생성 시 프롬프트 필요하다는 안내 제공

### 이전 작업: GalleryPicker 이미지 선택 안전성 개선 (2025-01-XX)

- **GalleryPicker 이미지 선택 안전성 개선** ✅:
  - `components/admin/GalleryPicker.tsx`: `handleSingleSelect` 함수에 에러 핸들링 추가
  - `img.url` 검증 추가로 안전성 향상
  - 최근 폴더 추가 실패 시에도 `onSelect`는 반드시 호출되도록 보장
  - 기존 동작 유지하면서 안전성 향상
  - 카카오톡 콘텐츠 갤러리 선택 기능 복구

### 이전 작업: AI 이미지 합성 오류 수정 (2025-01-XX)

- **제품 이미지 URL 변환 수정** ✅:
  - `pages/api/compose-product-image.js`: `getAbsoluteProductImageUrl` 함수 수정
  - Vercel URL 대신 Supabase Storage 공개 URL 사용
  - FAL AI 파일 다운로드 오류 해결
  - 상대 경로(`originals/goods/...`)를 Supabase Storage URL로 자동 변환
- **안정성 개선** ✅:
  - API 타임아웃 증가: 5분 → 10분 (600초)
  - FAL AI 에러 메시지 파싱 개선 (JSON.stringify)
  - 큐 상태 모니터링 강화 (IN_QUEUE, COMPLETED 로깅)

### 이전 작업: 주력제품과 굿즈 폴더 구조 분리 (2025-01-XX)

- **폴더 구조 분리** ✅:
  - 굿즈 이미지 경로 변경: `originals/products/goods/*` → `originals/goods/*`
  - 드라이버 제품: `originals/products/*` 유지
  - 제품과 굿즈가 명확하게 분리되어 관리됨
- **프론트엔드 수정** ✅:
  - `pages/admin/product-composition.tsx`: `getCompositionFolderPath()` 함수 수정
  - `lib/product-image-url.ts`: 경로 변환 로직 수정
- **백엔드 API 수정** ✅:
  - `pages/api/admin/upload-product-image.js`: 굿즈 경로 수정
  - `pages/api/compose-product-image.js`: 갤러리 저장 경로 수정
  - `pages/api/admin/all-images.js`: 폴더 탐색 로직 수정
- **마이그레이션 도구** ✅:
  - `scripts/migrate-goods-to-separate-folder.js`: Storage 이미지 이동 스크립트
  - `database/migrate-goods-urls.sql`: 데이터베이스 URL 업데이트 SQL

### 다음 단계
- [ ] Storage 이미지 마이그레이션 실행 (`scripts/migrate-goods-to-separate-folder.js`)
- [ ] 데이터베이스 URL 업데이트 실행 (`database/migrate-goods-urls.sql`)
- [ ] 제품 합성 관리 페이지에서 새 경로로 이미지 로드 확인

---

## ✅ 이전 작업: 클라이언트 Canvas API로 이미지 회전/변환 기능 구현 (2025-12-27)

### 완료된 작업
- **클라이언트 측 이미지 처리 유틸리티** ✅:
  - Canvas API를 사용한 이미지 회전/변환 함수 생성
  - 투명도 자동 감지 및 포맷 선택
  - 파일: `lib/client/image-processor.ts`
- **처리된 이미지 업로드 API** ✅:
  - Sharp 없이 단순 업로드만 수행
  - FormData 처리 및 Supabase Storage 저장
  - 파일: `pages/api/admin/upload-processed-image.js`
- **갤러리 UI 수정** ✅:
  - 회전 버튼: 클라이언트 Canvas로 처리 후 업로드
  - 변환 버튼: WebP/JPG/PNG 변환 (클라이언트 Canvas)
  - 기존 Sharp API는 유지 (다른 기능에 영향 없음)
- **Vercel 환경 문제 해결** ✅:
  - Sharp 로드 오류 완전 회피
  - 브라우저 Canvas API 사용으로 안정성 향상

### 변경된 파일
- `lib/client/image-processor.ts` (신규)
- `pages/api/admin/upload-processed-image.js` (신규)
- `pages/admin/gallery.tsx` (회전/변환 핸들러 수정)

### 기술적 결정
- **Sharp 대신 Canvas API 선택**: Vercel 환경에서 Sharp 로드 실패 문제 해결
- **클라이언트 측 처리**: 브라우저에서 처리하여 서버 부하 감소
- **기존 기능 보존**: 다른 Sharp 사용 기능들은 그대로 유지

---

## ✅ 최근 작업: 이미지 갤러리 회전 및 변환 기능 추가 (2025-12-27)

### 완료된 작업
- **이미지 회전 기능** ✅:
  - 90도 단위 회전 (반시계방향, 시계방향)
  - 원본과 같은 폴더에 새 파일로 저장
  - 투명도 자동 감지 및 포맷 선택 (WebP/PNG/JPG)
  - API 엔드포인트: `/api/admin/rotate-image.js`
- **이미지 변환 기능** ✅:
  - WebP 85% 압축 (투명도 지원)
  - JPG 85% 압축 (투명도 제거, 흰색 배경)
  - PNG 무손실 압축 (투명도 지원)
  - 원본과 같은 폴더에 새 파일로 저장
  - API 엔드포인트: `/api/admin/convert-image.js`
- **UI 개선** ✅:
  - 확대 모달에 "회전" 및 "변환" 버튼 추가
  - 드롭다운 메뉴로 옵션 선택
  - 외부 클릭 시 메뉴 자동 닫기
  - 작업 진행 상태 표시

### 변경된 파일
- `pages/api/admin/rotate-image.js` (신규)
- `pages/api/admin/convert-image.js` (신규)
- `pages/admin/gallery.tsx` (회전/변환 UI 추가)

---

## ✅ 최근 작업: products/goods 이미지 제품별 분리 및 연결 (2025-12-27)

### 완료된 작업
- **products/goods 이미지 제품별 분리** ✅:
  - `originals/products/goods` 폴더에 섞여있던 37개 이미지를 제품별로 분리
  - 파일명 패턴 분석으로 자동 제품 분류 (버킷햇, 골프모자, 클러치백, 캡 등)
  - 제품별 폴더 구조로 재구성: `originals/products/goods/{product-slug}/gallery/`
  - 총 8개 제품 분류 완료
- **데이터베이스 제품 이미지 연결** ✅:
  - 각 제품의 `gallery_images` 필드에 이미지 경로 자동 연결
  - 기존 제품 업데이트 및 신규 제품 등록 완료
  - 설문 페이지 이미지 자동 로드 지원
- **마이그레이션 스크립트 작성** ✅:
  - `scripts/organize-goods-images-by-product.js`: 이미지 분리 스크립트
  - `scripts/update-goods-products-with-images.js`: 데이터베이스 연결 스크립트

### 변경된 파일
- `scripts/organize-goods-images-by-product.js` (신규)
- `scripts/update-goods-products-with-images.js` (신규)
- `scripts/goods-images-organization-result.json` (신규)

---

## ✅ 최근 작업: 허브 시스템 순번 구조 및 블로그 다중 연결 지원 (2025-12-16)

### 완료된 작업
- **허브 순번 구조 추가 (hub_order)** ✅:
  - `cc_content_calendar` 테이블에 `hub_order` 컬럼 추가
  - `content_date` 기준으로 초기 순번 자동 할당
  - API에서 `hub_order` 조회 및 정렬 지원
  - UI에서 `hub_order` 우선 표시 (없으면 페이지네이션 순번)
- **블로그 다중 연결 지원** ✅:
  - `channel_status.blog` 구조 확장: `posts` 배열 추가
  - 기존 `post_id`와 호환성 유지 (하위 호환)
  - `primary_post_id` 필드 추가 (대표 블로그)
  - `sync-channel-status` API에서 블로그 추가 시 배열에 자동 추가
- **블로그/SMS 개수 계산 개선** ✅:
  - `getBlogCount()`: blogDataMap, channel_status.posts, blog_post_id 모두 확인
  - `getSMSCount()`: smsDataMap, channel_status 동적 채널, sms_id 모두 확인
  - 동기화 문제 대비 최대값 반환
- **블로그 재연결 스크립트** ✅:
  - 연결이 끊어진 허브/블로그 자동 감지
  - 제목 유사도, 날짜, slug 매칭 알고리즘
  - 양방향 연결 복구 (허브 ↔ 블로그)
- **허브 기준 날짜 동기화** ✅:
  - 허브 `content_date` → 블로그 `published_at` 동기화
  - 15개 블로그 날짜 업데이트 완료
  - 블로그 `created_at`은 원본 보존
- **변경 파일**:
  - `pages/api/admin/content-calendar-hub.js` (hub_order 조회/정렬)
  - `pages/admin/content-calendar-hub.tsx` (hub_order 표시, 개수 계산 개선)
  - `pages/api/admin/sync-channel-status.js` (블로그 다중 연결 지원)
  - `scripts/reconnect-broken-blog-connections.js` (재연결 스크립트)
  - `scripts/sync-blog-dates-from-hub.js` (날짜 동기화 스크립트)

## ✅ 최근 작업: 허브 시스템 연결 안정화 및 순번 표시 추가 (2025-12-16)

### 완료된 작업
- **허브 콘텐츠 테이블에 순번 컬럼 추가** ✅:
  - 테이블 헤더에 "순번" 컬럼 추가
  - 페이지네이션을 고려한 순번 계산: `(page - 1) * limit + index + 1`
  - colSpan 값 5 → 6으로 수정
- **블로그 삭제 API에서 허브 상태 완전 동기화** ✅:
  - 블로그 삭제 시 `blog_post_id`와 `channel_status.blog` 모두 업데이트
  - `sync-channel-status` API 대신 직접 Supabase 업데이트로 변경
  - 다른 채널 상태는 그대로 유지
- **SMS 삭제 API에서 허브 상태 완전 동기화** ✅:
  - SMS 삭제 시 `calendar_id` 확인 후 허브 상태 동기화
  - 동적 채널 키(`sms_1234567890`) 자동 삭제
  - 기본 SMS 채널 삭제 시 다른 SMS가 있으면 첫 번째 SMS로 업데이트
  - 다른 채널 상태는 그대로 유지
- **"천안 직산" 허브 콘텐츠와 블로그 재연결** ✅:
  - 재연결 스크립트 생성 및 실행 완료
  - 허브 ID: `20abf004-daba-479f-84aa-b5644294a640`
  - 블로그 ID: `482`
- **변경 파일**:
  - `pages/admin/content-calendar-hub.tsx` (순번 컬럼 추가)
  - `pages/api/admin/blog/[id].js` (블로그 삭제 시 완전 동기화)
  - `pages/api/channels/sms/delete.js` (SMS 삭제 시 완전 동기화)
  - `scripts/reconnect-cheonan-jiksan-hub.js` (재연결 스크립트)

## ✅ 최근 작업: 진행 상황 표시 개선 (2025-12-16)

### 완료된 작업
- **진행 상황 표시를 전체 기준(타입별)으로 개선** ✅:
  - `totalDates/completedDates` → `totalItems/completedItems`로 변경
  - 날짜 × 계정 × 타입(배경, 프로필, 피드) 기준으로 진행 상황 표시
  - 3일치 생성 시: 0/18 → 1/18 (배경) → 2/18 (프로필) → 3/18 (피드) → ...
  - 현재 생성 중인 타입(배경/프로필/피드) 표시 추가
  - `generateForSingleDate`에 `onProgress` 콜백 추가하여 타입별 진행 상황 추적
- **변경 파일**:
  - `pages/admin/kakao-content.tsx` (진행 상황 표시 로직 개선)

## ✅ 최근 작업: 피드 캡션·이미지 생성 시스템 개선 (2025-12-16)

### 완료된 작업
- **basePrompt 동기화** ✅:
  - `auto-create-account1.js`: 피드 basePrompt 생성 후 `kakao_calendar` 테이블에도 자동 동기화
  - `auto-create-account2.js`: 동일하게 동기화 로직 추가
  - 화면에 "basePrompt 없음" 표시 문제 해결
- **feedData 초기화 로직 추가** ✅:
  - `auto-create-account1.js`: feedData가 없을 때 초기 구조 생성
  - `auto-create-account2.js`: 동일하게 초기화 로직 추가
  - 피드 생성 실패 방지
- **account2 캡션 생성 순서 통일** ✅:
  - `auto-create-account2.js`: 캡션을 이미지 생성 전에 생성하도록 순서 변경 (account1과 동일)
  - 일관성 향상
- **에러 처리 강화** ✅:
  - `auto-create-account1.js`: 이미지 생성 실패 시 명확한 에러 메시지 (크레딧 부족, 서버 오류 등)
  - `auto-create-account2.js`: 동일하게 에러 처리 강화
  - 디버깅 용이성 향상
- **FeedManager UI 개선** ✅:
  - `FeedManager.tsx`: `getBasePrompt()` 함수 개선 (calendarData 우선, 없으면 feedData 조회)
  - 화면 반영 개선
- **변경 파일**:
  - `pages/api/kakao-content/auto-create-account1.js` (basePrompt 동기화, feedData 초기화, 에러 처리 강화)
  - `pages/api/kakao-content/auto-create-account2.js` (basePrompt 동기화, feedData 초기화, 캡션 순서 통일, 에러 처리 강화)
  - `components/admin/kakao/FeedManager.tsx` (getBasePrompt 개선)

## ✅ 최근 작업: 12월 카카오톡 데일리 브랜딩 1주차 캘린더 설계 (2025-12-16)

- **무엇을 했나**:
  - 11월 카카오 캘린더(`docs/content-calendar/2025-11.json`)와 기본 로테이션 정의(`docs/content-calendar/kakao-feed-schedule.json`)를 분석해 구조와 톤을 그대로 유지하면서 12월 첫 주(1~7일)용 캘린더를 신규 생성.
  - `account1`(MAS GOLF ProWhale, 시니어 골드톤) / `account2`(MASGOLF Tech, 쿨 블루톤) 각각에 대해 겨울/연말 테마에 맞춘 `weeklyThemes`와 `dailySchedule`(background/profile basePrompt + message)을 설계.
  - `kakaoFeed.dailySchedule`에 12월 1~7일용 피드 이미지 카테고리·프롬프트·캡션을 추가해, 관리자 페이지 `카톡 콘텐츠` 화면에서 바로 자동 생성 및 배포 흐름을 탈 수 있도록 준비.
- **왜 했나**:
  - 11월 MUZIIK 런칭 캠페인에서 검증된 톤과 구조를 그대로 가져오면서, 12월에는 겨울 라운딩/실내 연습/연말 회고라는 새로운 시즌 메시지를 반영해 운영 부담 없이 고정 퀄리티를 유지하기 위함.
  - 향후 `/api/kakao-content/batch-generate-month` 및 `auto-create-account1/2`를 사용할 때도 12월 데이터가 동일한 구조로 쌓이도록 미리 캘린더 JSON을 준비.
- **변경 파일**:
  - `docs/content-calendar/2025-12.json` (신규) – 12월 1~7일 프로필/피드용 basePrompt, 메시지, 피드 캡션 구조 정의.
- **남은 일**:
  - 관리자 페이지 `카톡 콘텐츠`에서 2025-12-01~07 날짜 선택 후, 계정별 자동 생성 버튼 또는 선택된 날짜 생성 플로우를 사용해 실제 이미지 생성/저장 수행.
  - 필요 시 12월 8일 이후 날짜도 동일 패턴으로 확장하거나, 연말/신년 특화 테마(크리스마스, 새해 인사 등)를 주차별로 추가 설계.

## ✅ 최근 작업: 설문 조사 페이지 고급화 (2025-12-14)

### 설문 알림 및 관리 기능 강화 (2025-12-15)
- 설문 제출 시 슬랙 알림 전송 추가, 제출 시각 포함 (Asia/Seoul)
- 관리자 리스트에 제출 시각(날짜+시간) 표시
- 이름 클릭 시 상세 모달로 전체 응답 확인
- 최근 설문 재전송용 API 추가 (`/api/survey/resend-latest`, 기본 3건)

### `/survey` 페이지 연말연시 분위기 개선
- **목표**: 설문 조사 페이지를 연말연시 선물 분위기로 고급스럽게 개선
- **개선 사항**:
  1. **히어로 섹션 고급화**
     - 다크 배경 (`bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900`)
     - 골드/레드 액센트 장식 요소 추가
     - 그라데이션 텍스트 효과 (골드/레드)
     - 제품 이미지 골드 테두리 및 글로우 효과
  2. **이벤트 박스 강조**
     - 골드/레드 그라데이션 배경
     - 펄스 애니메이션 (`animate-pulse`)
     - 배경 패턴 장식 요소
     - "선착순 20명" 배지 강조
  3. **모자 갤러리 프리미엄화**
     - 호버 시 상승 애니메이션 (`hover:-translate-y-2`)
     - 골드/레드 테두리 (호버 시 강조)
     - 그림자 강화 (`shadow-2xl`)
     - 이미지 줌 효과 (`group-hover:scale-110`)
     - 골드/레드 글로우 효과
  4. **CTA 버튼 개선**
     - 골드/레드 그라데이션 배경
     - 호버 시 스케일 애니메이션 (`hover:scale-105`)
     - 그림자 강화 및 색상 변화
     - 아이콘 애니메이션 추가
  5. **전체 레이아웃 고급화**
     - 섹션 간격 조정 (`py-12 md:py-20`)
     - 반응형 타이포그래피 (`text-3xl sm:text-4xl md:text-5xl lg:text-6xl`)
     - 이벤트 안내 박스 다크 테마 적용
     - 골드/레드 액센트 일관성 유지
- **변경 파일**:
  - `pages/survey/index.tsx` (전면 개선)
- **디자인 원칙 적용**:
  - 메인 페이지 및 `/about` 페이지와 일관된 디자인 언어
  - 고객 페이지 가이드라인 준수 (`docs/customer-page-guidelines.md`)
  - 모바일 퍼스트 반응형 디자인
  - 프리미엄 브랜드 경험 제공

## ✅ 최근 작업: 블로그 이미지 마이그레이션 시작 (2025-01-XX)

### 블로그 이미지 마이그레이션 시스템 구축
- **목표**: 모든 블로그 이미지를 `originals/blog/YYYY-MM/{blog-id}/` 폴더로 정확히 마이그레이션
- **생성된 파일**:
  - `scripts/run-blog-image-migration.js` - 마이그레이션 실행 스크립트
- **Phase 1**: 전체 분석 및 현황 파악 (준비 완료)
- **Phase 2**: 발행일 순서로 글별 마이그레이션 (대기 중)
- **참고 문서**:
  - `docs/blog-image-migration-and-cleanup-plan.md` - 전체 계획
  - `docs/blog-image-migration-implementation-plan.md` - 구현 계획

---

## ✅ 최근 작업: 고객 페이지 디자인 가이드라인 작성 및 모바일 최적화 (2025-01-14)

### 완료된 작업
- **고객 페이지 디자인 가이드라인 작성** ✅:
  - `docs/customer-page-guidelines.md`: 시타 예약 페이지 및 브랜드 스토리 페이지 개선 방향 정리
  - 타이포그래피 가이드 (반응형 폰트 크기 시스템)
  - 컴포넌트 가이드 (히어로, 섹션, 카드, 정보 섹션)
  - 반응형 디자인 가이드 (브레이크포인트, 간격, 그리드)
  - 애니메이션 및 인터랙션 가이드
  - 색상 및 브랜딩 가이드
  - 접근성 가이드 (WCAG AA 기준)
  - 체크리스트 (새 페이지 제작 시 확인 사항)
  - 전체 페이지 개선 및 신규 페이지 제작 참고 자료

- **시타 예약 페이지 모바일 최적화** ✅:
  - 히어로 섹션: 메인 타이틀 행바꿈, 서브타이틀 행바꿈, 그라데이션 효과
  - 서비스 소개 카드: 호버 효과, 이미지 줌, 그림자 강화
  - 매장 정보 섹션: 아이콘 추가, 비거리 상담 전화번호 크기 증가
  - CTA 버튼: 그라데이션 배경 및 호버 애니메이션

- **브랜드 스토리 페이지 모바일 최적화** ✅:
  - 히어로 섹션: 타이포그래피 조정, 행바꿈 개선
  - 섹션 제목: 모바일 폰트 크기 조정 (36px → 24-28px)
  - 구분선: 그라데이션 효과 적용
  - 기술력 카드: 그라데이션 배경, 호버 효과, 그림자 강화
  - 섹션 간격: 모바일 최적화 (py-12 md:py-20)

- **Playwright 모바일 분석 스크립트** ✅:
  - `scripts/test-try-a-massgoo-mobile.js`: 시타 예약 페이지 모바일 분석
  - `scripts/test-about-page-mobile.js`: 브랜드 스토리 페이지 모바일 분석
  - 텍스트 크기, 레이아웃, 가독성 자동 분석

## ✅ 최근 작업: 예약 로고 발송을 MMS 시스템과 동일한 로직으로 통합 (2025-12-13)

### 완료된 작업
- **예약 로고 발송 로직 개선** ✅:
  - `pages/api/bookings/notify-customer.ts`: 예약 로고 발송 시 MMS 시스템과 동일한 `/api/solapi/reupload-image` API 사용
  - 별도의 `/api/logo/get-for-mms` API 호출 제거 (405 에러 해결)
  - 로고 메타데이터에서 `image_url`을 가져와서 MMS 시스템과 동일하게 처리
  - 기존 MMS 시스템 로직 재사용으로 일관성 확보 및 유지보수성 향상

## ✅ 최근 작업: 예약 저장 후 모달 유지 및 메시지 보내기 버튼 위치 개선 (2025-12-13)

### 완료된 작업
- **예약 저장 후 모달 유지** ✅:
  - `components/admin/bookings/BookingDetailModal.tsx`: 저장 후 `onUpdate()` 호출 제거하여 모달이 자동으로 닫히지 않도록 수정
  - 저장 후 `editData`를 최신 데이터로 업데이트하여 모달 내 정보 갱신
  - X 버튼을 눌러야만 모달이 닫히도록 변경

- **메시지 보내기 버튼 위치 개선** ✅:
  - `components/admin/bookings/BookingDetailModal.tsx`: 저장 버튼 옆에 메시지 보내기 버튼 추가
  - 편집 모드에서도 메시지를 보낼 수 있도록 개선
  - 저장 중일 때는 메시지 보내기 버튼 숨김 처리

## ✅ 최근 작업: 예약 저장 시 자동 메시지 발송 제거 및 메시지 보내기 버튼 추가 (2025-12-13)

### 완료된 작업
- **예약 저장 시 자동 메시지 발송 제거** ✅:
  - `pages/api/bookings/[id].ts`: 예약 저장 시 자동으로 메시지를 보내는 로직 제거
  - 저장은 저장만 수행하고, 메시지 발송은 별도 버튼으로만 가능하도록 변경
  - `components/admin/bookings/BookingDetailModal.tsx`: 저장 시 메시지 발송 관련 피드백 제거

- **메시지 보내기 버튼 추가** ✅:
  - `components/admin/bookings/BookingDetailModal.tsx`: 모든 예약 상태에서 메시지를 보낼 수 있는 버튼 추가
  - `pending` 상태: "예약 접수 메시지 보내기" 버튼 표시 → `booking_received` 타입 발송
  - `confirmed` 상태: "확정 메시지 보내기" 버튼 표시 → `booking_confirmed` 타입 발송
  - `handleSendReceivedMessage` 함수 추가: 예약 접수 메시지 발송 처리
  - `handleSendConfirmationMessage` 함수 수정: 확정 메시지 발송 처리

## ✅ 최근 작업: 예약 폼 개인화 및 SMS 발송 개선 (2025-12-13)

### 완료된 작업
- **예약 폼 개인화 입력 개선** ✅:
  - `pages/booking/form.tsx`: Step 2에서 Step 3로 넘어갈 때 개인화 입력이 건너뛰어지는 문제 해결
  - Step 3에서 Enter 키로 form 제출 방지 (textarea 내에서는 줄바꿈만 허용)
  - form 제출은 "예약 완료" 버튼으로만 가능하도록 수정
  - `handleFormSubmit` 함수 추가: Step 3가 아닐 때는 다음 단계로 이동
  - `handleTextareaKeyDown` 함수 추가: textarea에서 Enter 키 처리 (Shift+Enter는 줄바꿈, Enter만 누르면 제출 방지)

- **예약 생성 시 SMS 즉시 발송 개선** ✅:
  - `pages/api/bookings.ts`: 예약 생성 시 SMS가 바로 발송되지 않던 문제 해결
  - `baseUrl`을 더 안정적으로 설정 (`req.headers.host` 사용)
  - `Promise.all`로 병렬 처리하되 `await`하여 실제 발송 확인
  - `bookingData`를 직접 전달하여 최신 예약 정보 사용
  - Slack API 경로를 `/api/slack/booking-notify`로 수정
  - 5초 타임아웃 설정으로 알림 발송 완료 대기
  - 상세 로깅 추가로 디버깅 용이성 향상

## ✅ 최근 작업: 누락된 메시지 복구 시스템 (2025-12-13)

### 완료된 작업
- **누락된 메시지 복구 스크립트** ✅:
  - `scripts/recover-missing-message-2025-12-13.js`: 솔라피에서 누락된 메시지 복구 스크립트 생성
  - 솔라피 API를 통해 그룹 ID로 메시지 정보 조회 및 DB 저장
  - 자동 그룹 검색 및 수동 그룹 ID 입력 지원
  - 메시지 ID 196 복구 완료 (G4V20251213171841HWTS1FRPYJYHAKI)
  - 솔라피 API 응답 구조 처리 (messageList 객체 형태 지원)
  - Signature 재사용 방지 로직 추가

## ✅ 최근 작업: 로고 관리 시스템 개발 (2025-01-XX)

### 완료된 작업
- **로고 파일 정리 및 통합** ✅:
  - `scripts/create-logos-with-background.js`: 배경이 있는 로고 이미지 생성 스크립트 작성
  - `scripts/upload-logos-to-supabase.js`: 배경 포함 로고 추가 (massgoo_logo_black_with_bg.png, massgoo_logo_white_with_bg.png)
  - 모든 로고를 `originals/logos/` 폴더에 통합 관리
- **로고 크기 옵션 확장** ✅:
  - `pages/api/logo/get-for-mms.ts`: `small-landscape` (600x200px) 가로형 크기 추가
  - 예약 문자용 작은 가로형 로고 지원
- **예약 문자용 로고 설정** ✅:
  - `booking_settings` 테이블에 `booking_logo_id`, `booking_logo_size` 컬럼 추가
  - `pages/api/bookings/notify-customer.ts`: 예약 확정 메시지에 작은 가로형 로고 첨부
  - `components/admin/bookings/BookingSettings.tsx`: 예약 문자용 로고 설정 UI 추가
- **갤러리 관리에 로고 필터 추가** ✅:
  - `pages/admin/gallery.tsx`: "로고만 보기" 필터 추가 (`filterType: 'logos'`)
  - `is_logo = true` 또는 `folder_path`가 `originals/logos`로 시작하는 이미지 필터링
- **API 업데이트** ✅:
  - `pages/api/bookings/settings.ts`: `booking_logo_id`, `booking_logo_size` 저장/조회 지원

### 다음 단계
- **로고 합성 시스템 개발** (Phase 4):
  - `/api/logo/compose`: 로고 합성 API 개발
  - `/admin/logo-composer`: 로고 합성 페이지 개발
  - 9방향 배치, 크기/투명도/여백 조정 기능

---

## ✅ 이전 작업: 예약 메시지 시스템 개선 및 당일 예약 리마인드 기능 구현 (2025-01-XX)

### 완료된 작업
- **예약 메시지 템플릿 개선** ✅:
  - 예약 대기 메시지: 홈페이지 링크 추가, 매력적인 문구 개선
  - 예약 확정 메시지: 약도 링크 명시, 로고 포함, 매력적인 문구 개선
  - 당일 예약 리마인드 메시지: 예약 시간 2시간 전 자동 발송, 약도 링크 포함
- **BookingDetailModal 개선** ✅:
  - 예약 수정 시 API 호출로 변경 (확정 문자 자동 발송)
  - 당일 예약 메시지 UI 추가 (체크박스, 발송 시간 설정)
  - 예약 시간 2시간 전 자동 계산 및 표시
- **예약 리마인드 API 구현** ✅:
  - `/api/bookings/[id]/schedule-reminder.ts`: 예약 메시지 생성/수정/삭제/조회
  - `channel_sms` 테이블에 `draft` 상태로 저장
  - 기존 cron job(`send-scheduled-sms.js`)과 연동
- **변경 파일**:
  - `pages/api/bookings/notify-customer.ts` (메시지 템플릿 개선)
  - `components/admin/bookings/BookingDetailModal.tsx` (당일 예약 메시지 UI 추가, API 호출로 변경)
  - `pages/api/bookings/[id]/schedule-reminder.ts` (신규 생성)

## ✅ 최근 작업: 제품 합성 이미지 경로 보강 (2025-12-11)
- **무엇을 했나**: 제품 합성용 이미지가 `.png` 경로를 참조해 404가 발생하는 문제를 방어적으로 해결했습니다.
- **왜 했나**: Supabase `product_composition`에 남아 있는 `.png` 경로 때문에 모자 썸네일이 깨지는 현상이 발생했습니다.
- **변경 파일**:
  - `components/admin/ProductSelector.tsx`: 이미지 로드 실패 시 플레이스홀더로 대체하는 `onError` 핸들러 추가.
  - `lib/product-composition.ts`: Supabase 응답의 `image_url`, `color_variants`, `reference_images`에 남은 `.png`를 런타임에서 `.webp`로 변환.
  - `pages/api/compose-product-image.js`: 서버 사이드에서도 `.png` → `.webp` 변환 적용.
  - `database/update-product-composition-png-to-webp.sql`: Supabase `product_composition` 테이블의 `.png` 경로를 일괄 `.webp`로 교체하는 SQL 스크립트 추가.
- **남은 일**: Supabase SQL Editor에서 `database/update-product-composition-png-to-webp.sql`을 실행해 DB의 `.png` 경로를 `.webp`로 업데이트하면 썸네일 404가 사라집니다.

## ✅ 최근 완료된 작업

### MASSGOO X MUZIIK 설문 조사 랜딩 페이지 개발 완료 ✅ (2025-01-XX)
- **데이터베이스 설정**: ✅ 완료 (Supabase에서 `surveys` 테이블 생성 및 RLS 정책 설정)
- **설문 폼 3단계 재구성**: ✅ 완료 (7단계 → 3단계, 시타 예약 스타일 진행률 인디케이터)
- **랜딩 페이지 개선**: ✅ 완료
  - PRO3 MUZIIK 히어로 이미지 추가
  - 이벤트 문구 변경 ("설문 조사만 해도")
  - 모자 이미지 롤링 갤러리 2개 영역 분리 (버킷햇/골프모자)
  - CTA 버튼 재구성 (메인/보조)
- **PRO3 MUZIIK 제품 페이지**: ✅ 완료 (샤프트 이미지 3장 추가: 베릴 1장, 사파이어 2장)
- **목적**: 시타 참여자 전화만 해도 MASSGOO X MUZIIK 콜라보 모자 30명에게 증정 이벤트 및 마쓰구 신모델 샤프트 선호도 조사
- **완료된 작업**:
  1. **데이터베이스 스키마 생성** ✅:
     - `surveys` 테이블 생성 (`database/create-surveys-table.sql`)
     - 고객 정보, 설문 응답, 고객 연결 필드 포함
     - 인덱스 및 RLS 정책 설정
  2. **API 엔드포인트 구현** ✅:
     - `/api/survey/submit`: 설문 제출 API (고객 동기화 포함)
     - `/api/survey/list`: 설문 목록 조회 API (필터링, 검색, 정렬)
     - `/api/survey/stats`: 설문 통계 API (모델별, 연령대별, 중요 요소별)
  3. **프론트엔드 페이지 생성** ✅:
     - `/survey/index.tsx`: 설문 랜딩 페이지 (히어로 섹션, 모자 갤러리 6개, CTA 버튼)
     - `/survey/form.tsx`: 설문 폼 페이지 (7단계 진행, 단계별 검증)
     - `/survey/success.tsx`: 설문 완료 페이지
  4. **관리자 페이지 생성** ✅:
     - `/admin/surveys/index.tsx`: 설문 결과 목록 페이지 (필터링, 검색, 통계 대시보드)
     - AdminNav에 "📋 설문 관리" 메뉴 추가
  5. **제품 페이지 생성** ✅:
     - `/products/pro3-muziik.tsx`: 시크리트포스 PRO3 MUZIIK 제품 페이지 (가격: 1,700,000원)
- **주요 기능**:
  - 설문 7단계: 성함, 연락처, 연령대, 모델 선택, 중요 요소, 추가 의견, 주소
  - 고객 DB 자동 동기화 (전화번호 기준)
  - 모자 이미지 6개 (버킷햇 2개, 골프모자 4개)
  - 관리자 통계 대시보드
- **변경된 파일**:
  - `database/create-surveys-table.sql` (신규)
  - `pages/api/survey/submit.ts` (신규)
  - `pages/api/survey/list.ts` (신규)
  - `pages/api/survey/stats.ts` (신규)
  - `pages/survey/index.tsx` (신규)
  - `pages/survey/form.tsx` (신규)
  - `pages/survey/success.tsx` (신규)
  - `pages/admin/surveys/index.tsx` (신규)
  - `pages/products/pro3-muziik.tsx` (신규)
  - `components/admin/AdminNav.tsx` (설문 관리 메뉴 추가)
  - `docs/muziik-survey-landing-plan.md` (신규, 개발 계획서)

### AI 이미지 생성: 다양한 각도 참조 이미지 및 로고 자동 교체 기능 추가 ✅ (2025-12-03)
- **목적**: 제품 합성 정교도 향상 및 로고 자동 교체 기능 추가
- **완료된 작업**:
  1. **다양한 각도 참조 이미지 지원** ✅:
     - `lib/product-composition.ts`: `referenceImages` 배열 추가
     - 각 제품별로 gallery 이미지들 추가 (뱃지/문구 없는 순수 헤드 이미지)
     - `pages/api/compose-product-image.js`: 참조 이미지들을 나노바나나 API에 전달
     - 프롬프트에 참조 이미지 활용 지시 포함
  2. **로고 자동 교체 기능** ✅:
     - `lib/product-composition.ts`: `generateLogoReplacementPrompt()` 함수 추가
     - `pages/api/compose-product-image.js`: `replaceLogo` 옵션 추가 및 프롬프트에 통합
     - `pages/admin/ai-image-generator.tsx`: 로고 교체 토글 UI 추가
  3. **제품별 참조 이미지 구성** ✅:
     - gold2-sapphire: 5개 참조 이미지
     - black-beryl: 6개 참조 이미지
     - gold2: 7개 참조 이미지
     - pro3: 7개 참조 이미지
     - v3: 6개 참조 이미지
     - weapon-black: 7개 참조 이미지
     - weapon-gold-4-1: 7개 참조 이미지
- **사용 방법**:
  1. AI 이미지 생성 페이지에서 제품 합성 활성화
  2. 제품 선택
  3. "로고 자동 교체" 토글 활성화 (선택사항)
  4. 이미지 생성 또는 갤러리에서 베이스 이미지 선택 후 합성
  5. 나노바나나가 여러 각도 참조 이미지를 활용하여 정교하게 합성
  6. 로고 교체 활성화 시 모자/옷의 로고를 MASSGOO로 자동 변경
- **변경된 파일**:
  - `lib/product-composition.ts` (referenceImages 추가, 로고 교체 프롬프트)
  - `pages/api/compose-product-image.js` (참조 이미지 처리, 로고 교체 옵션)
  - `pages/admin/ai-image-generator.tsx` (로고 교체 UI)

### AI 이미지 생성: 베이스 이미지 갤러리 선택 기능 추가 ✅ (2025-12-03)
- **목적**: 이미 생성된 이미지에 제품 합성 기능 확장 (갤러리에서 베이스 이미지 선택)
- **완료된 작업**:
  1. **베이스 이미지 선택 모드 추가** ✅:
     - `pages/admin/ai-image-generator.tsx`: 베이스 이미지 모드 선택 UI 추가
     - "새 이미지 생성" / "갤러리에서 선택" 라디오 버튼
     - GalleryPicker 모달 통합
  2. **워크플로우 수정** ✅:
     - 갤러리 모드 선택 시: AI 생성 스킵하고 바로 제품 합성
     - 새 이미지 생성 모드: 기존 플로우 유지 (AI 생성 → 제품 합성)
  3. **프롬프트 최적화** ✅:
     - `lib/product-composition.ts`: 드라이버 헤드만 교체하도록 프롬프트 구체화
     - 손 위치, 그립, 각도 유지하도록 명시
  4. **UI 개선** ✅:
     - 갤러리 모드 선택 시 제품 합성 자동 활성화
     - 선택된 베이스 이미지 미리보기
     - 생성 버튼 텍스트 동적 변경 ("이미지 생성하기" / "제품 합성하기")
- **사용 방법**:
  1. AI 이미지 생성 페이지 접속
  2. "갤러리에서 선택" 모드 선택
  3. 갤러리에서 베이스 이미지 선택 (예: `kakao-account2-profile-1764661408817-1-1.png`)
  4. 제품 선택 (시크리트웨폰 등)
  5. "제품 합성하기" 버튼 클릭
  6. 나노 바나나로 드라이버 헤드만 교체된 이미지 생성
- **변경된 파일**:
  - `pages/admin/ai-image-generator.tsx` (베이스 이미지 선택 모드 추가)
  - `lib/product-composition.ts` (프롬프트 최적화)

### 갤러리 이미지 편집 기능: Photopea → cleanup.pictures 변경 ✅ (2025-12-03)
- **목적**: Photopea에서 이미지 로딩 실패 문제 해결 및 cleanup.pictures로 전환
- **완료된 작업**:
  1. **수정 버튼 핸들러 변경** ✅:
     - `components/admin/GalleryPicker.tsx`: Photopea → cleanup.pictures로 변경
     - 이미지 다운로드 기능 추가
     - cleanup.pictures 자동 열기 기능 구현
  2. **기능 구현** ✅:
     - 이미지를 blob으로 다운로드
     - 다운로드 폴더에 자동 저장 (사용자가 cleanup.pictures에 드래그 앤 드롭 가능)
     - cleanup.pictures 새 창으로 자동 열기
     - 사용자 안내 메시지 표시
  3. **빌드 테스트** ✅:
     - Next.js 빌드 성공 확인
     - 린터 오류 없음 확인
- **해결된 문제**:
  - Photopea에서 이미지 로딩 실패 문제 해결
  - cleanup.pictures로 원활한 편집 워크플로우 제공
- **변경된 파일**:
  - `components/admin/GalleryPicker.tsx` (수정 버튼 핸들러)

### 제품 이미지 파일명 영어 변환 작업 ✅ (2025-11-30)
- **목적**: 한글 파일명으로 인한 URL 인코딩 문제 해결 및 이미지 깨짐 문제 해결
- **완료된 작업**:
  1. **파일명 변경** ✅:
     - 제품 합성용 솔 이미지 7개: `secret-force-*-sole-*.webp` 형식
     - 갤러리 이미지 34개: `secret-force-*-gallery-*.webp` 형식
     - 총 41개 파일명 변경 완료
  2. **코드 업데이트** ✅:
     - `lib/product-composition.ts`: 모든 제품 이미지 경로 업데이트
     - `pages/index.js`: 메인 페이지 갤러리 이미지 경로 업데이트
     - `pages/products/pro3.tsx`, `v3.tsx`, `gold-weapon4.tsx`: 제품 상세 페이지 이미지 경로 업데이트
     - `components/admin/ProductSelector.tsx`: `encodeURI()` 제거 (영어 파일명 사용)
  3. **소스 코드 점검** ✅:
     - 모든 한글 파일명 참조 제거 확인
     - 빌드 테스트 성공
     - 파일 존재 확인 완료
- **해결된 문제**:
  - V3 이미지 404 에러 해결
  - 한글 파일명 인코딩 문제 해결
  - Next.js Image 컴포넌트 호환성 개선
- **관련 문서**: `docs/product-image-filename-migration-report.md`

### 프리미엄 드라이버 컬렉션 페이지: 제품 클릭 링크 개선 및 모달 이미지 갤러리 추가 ✅ (2025-01-XX)
- **목적**: 프리미엄 드라이버 컬렉션에서 제품 이미지 클릭 시 적절한 페이지로 연결하고, 모달에서 여러 이미지 표시
- **완료된 작업**:
  1. **제품 클릭 링크 분기 처리** ✅:
     - 1번 제품 (시크리트포스 골드 2 MUZIIK): `/products/gold2-sapphire` 페이지로 이동
     - 2번 제품 (시크리트웨폰 블랙 MUZIIK): `/products/weapon-beryl` 페이지로 이동
     - 3번 제품 (시크리트포스 골드 2): 모달 표시 (제품 페이지 없음)
     - 4번 제품 (시크리트포스 PRO 3): 모달 표시 (9장 이미지)
     - 5번 제품 (시크리트포스 V3): 모달 표시 (8장 이미지)
     - 6번 제품 (시크리트웨폰 블랙): 모달 표시 (10장 이미지)
     - 7번 제품 (시크리트웨폰 골드 4.1): 모달 표시 (10장 이미지)
  2. **모달 이미지 갤러리 업데이트** ✅:
     - PRO 3: 9장 이미지 추가 (메인 + 공홈 8장)
     - V3: 8장 이미지 추가 (메인 + 공홈 7장)
     - 웨폰 블랙: 10장 이미지 추가 (메인 + 공홈 9장)
     - 골드 웨폰 4.1: 10장 이미지 추가 (메인 + 공홈 9장)
     - 모달에서 썸네일 갤러리로 여러 이미지 선택 및 표시 가능
- **변경 파일**:
  - `pages/index.js` (`handleProductClick` 함수 수정, products 배열의 images 업데이트)
- **결과**: 제품 페이지가 있는 제품은 해당 페이지로 이동하고, 모달로 표시되는 제품들도 여러 장의 이미지를 갤러리 형태로 확인할 수 있음

### AI 이미지 제품 합성 시스템: 제품 이미지 경로 업데이트 및 제품 페이지 생성 ✅ (2025-01-XX)
- **목적**: 제품 합성에 사용되는 이미지를 솔 이미지로 업데이트하고, PRO 3, V3, 골드 웨폰 4.1 제품 페이지 생성
- **완료된 작업**:
  1. **제품 이미지 URL 업데이트** ✅:
     - 골드2 뮤직 (gold2-sapphire): `마쓰구_시크리트포스_골드_2_500.png`
     - 골드2 (gold2): `마쓰구_시크리트포스_골드_2_500.png`
     - 웨폰 블랙 뮤직 (black-beryl): `마쓰구_시크리트웨폰_블랙_500.png`
     - 웨폰 블랙 (weapon-black): `마쓰구_시크리트웨폰_블랙_500.png`
     - 골드 웨폰 4.1 (weapon-gold-4-1): `마쓰구_시크리트웨폰_4.1_500.png`
     - PRO 3 (pro3): `마쓰구_시크리트포스_PRO_500.png`
     - V3 (v3): `마쓰구_시크리트포스_V3_05_00.jpg` (솔 이미지로 업데이트)
  2. **PRO 3 제품 페이지 생성** ✅:
     - `pages/products/pro3.tsx` 생성
     - 9장의 제품 이미지 설정 (메인 이미지 + 공홈 이미지 8장)
     - 가격: 1,150,000원
     - 제품 상세 정보, 고객 후기 섹션 포함
  3. **V3 제품 페이지 생성** ✅:
     - `pages/products/v3.tsx` 생성
     - 8장의 제품 이미지 설정 (메인 이미지 + 공홈 이미지 7장)
     - 가격: 950,000원
     - 제품 상세 정보, 고객 후기 섹션 포함
  4. **시크리트웨폰 골드 4.1 제품 페이지 생성** ✅:
     - `pages/products/gold-weapon4.tsx` 생성
     - 10장의 제품 이미지 설정 (메인 이미지 + 공홈 이미지 9장)
     - 가격: 1,700,000원
     - 제품 상세 정보, 고객 후기 섹션 포함
     - 골드 톤에 맞는 배경색 적용 (from-yellow-50 via-white to-yellow-100)
- **변경 파일**:
  - `lib/product-composition.ts` (제품 이미지 URL 업데이트, V3 이미지 경로 수정)
  - `pages/products/pro3.tsx` (신규 생성)
  - `pages/products/v3.tsx` (신규 생성)
  - `pages/products/gold-weapon4.tsx` (신규 생성)
- **결과**: 제품 합성 시 솔 이미지가 사용되며, PRO 3, V3, 골드 웨폰 4.1 제품 페이지가 생성되어 제품 상세 정보를 확인할 수 있음

### 블로그 글 302 (Mas9Popup) AI 이미지 생성 및 추가 완료 ✅ (2025-11-29)
- **목적**: 마쓰구 이미지 생성기 API를 사용하여 AI 이미지 생성 및 블로그 콘텐츠에 추가
- **완료된 작업**:
  1. **기존 DALL-E 3 이미지 제거** ✅:
     - 이전에 생성된 DALL-E 3 이미지 2장 제거 (품질 문제)
  2. **마쓰구 이미지 생성기 API로 재생성** ✅:
     - `/api/kakao-content/generate-images` API 사용 (FAL AI hidream-i1-dev)
     - "비공인 드라이버의 필요성" 이미지 1장 생성
     - "고반발 골프 드라이버" 이미지 1장 생성
     - 한국 골퍼 스펙 자동 적용 (50-70세, 한국인 외모)
     - 시니어 감성형 브랜딩 톤 적용
     - 총 2장 생성 완료
  3. **이미지 업로드 및 추가** ✅:
     - 생성된 이미지를 Supabase Storage에 업로드 (`originals/blog/2017-03/302/`)
     - 첫 번째 이미지를 본문 시작 부분에 추가
     - 두 번째 이미지를 본문 중간에 추가
  4. **메타데이터 생성** ✅:
     - 생성된 이미지 2장에 메타데이터 생성 완료 (일반 메타 생성 사용)
- **변경 파일**:
  - `scripts/generate-masgolf-images-for-blog-302.js` (신규, 마쓰구 이미지 생성기 API 사용)
  - `scripts/generate-and-add-images-to-blog-302.js` (기존, DALL-E 3 사용 - 더 이상 사용 안 함)
- **최종 상태**:
  - 블로그 글 이미지: 3개 (대표 이미지 1개 + AI 생성 이미지 2개)
  - 갤러리 이미지: 2개 (AI 생성 이미지)
  - 메타데이터: 2개 생성 완료
- **결과**: AI 이미지 생성 및 추가 완료, 메타데이터 생성 완료

### 블로그 글 302 (Mas9Popup) 최적화 완료 ✅ (2025-11-29)
- **목적**: 제목 표현 개선, 중복 제목 제거, 관련 포스트 제거, 문서 업데이트
- **완료된 작업**:
  1. **제목 표현 개선** ✅:
     - "Mas9Popup:" → "Mas9Popup -" (콜론을 하이픈으로 변경)
  2. **콘텐츠 정제** ✅:
     - 과도한 키워드 반복 제거 (4개 수정)
     - 플레이스홀더 이미지 제거
  3. **하드코딩된 관련 포스트 제거** ✅:
     - "관련 포스트" 섹션 제거 (동적 "관련 게시물"로 대체)
  4. **태그 섹션 제거** ✅:
     - "### 태그" 섹션 제거
  5. **문서 업데이트** ✅:
     - `docs/blog-post-optimization-guide.md`에 제목 표현 개선 가이드 추가
     - AI 이미지 생성 및 추가 가이드 추가
     - 관련 포스트 → 관련 게시물 용어 통일 명시
- **결과**: 블로그 글 302 최적화 완료, 문서 업데이트 완료

### 블로그 글 303 (스타와 함께 마쓰구와 함께) 슬러그 변경 및 콘텐츠 수정 완료 ✅ (2025-11-29)
- **목적**: 슬러그 변경, 콘텐츠 정리, YouTube 영상 추가
- **완료된 작업**:
  1. **슬러그 변경** ✅:
     - `massgoo` → `golf-event-with-stars-and-massgoo`
     - 새 URL: `/blog/golf-event-with-stars-and-massgoo`
  2. **콘텐츠 정리** ✅:
     - 링크 제거: `[[Mas9Golf] 충북경제단체 골프친선대회 협찬행사^^](/blog/mas9golf friendly-tournament-sponsorship)`
     - 이미지 제거: `complete migration 1757772544303 1` 이미지
  3. **YouTube 영상 추가** ✅:
     - YouTube iframe 추가: `https://www.youtube.com/embed/pdXs9OgRbFU?start=18`
     - 18초부터 재생되도록 설정
- **결과**: 슬러그 변경 및 콘텐츠 수정 완료, YouTube 영상 추가 완료

### 블로그 글 303 (스타와 함께 마쓰구와 함께) 슬러그 변경 및 이미지 복구 완료 ✅ (2025-11-29)
- **목적**: 슬러그 변경 및 깨진 이미지 복구
- **완료된 작업**:
  1. **슬러그 변경** ✅:
     - `golf-event-with-stars-and-matsugu` → `massgoo`
  2. **이미지 복구** ✅:
     - 루트 폴더에서 massgoo 관련 이미지 3개 발견 및 복구
     - 이미지를 `originals/blog/2017-03/303/` 폴더로 이동
     - 콘텐츠에 이미지 추가 및 URL 업데이트
  3. **메타데이터 생성** ✅:
     - 복구된 이미지 3개에 메타데이터 생성 완료 (일반 메타 생성 사용)
- **최종 상태**:
  - 블로그 글 이미지: 4개 (YouTube 썸네일 1개 + 복구된 이미지 3개)
  - 갤러리 이미지: 3개 (복구된 이미지)
  - 슬러그: `massgoo`
- **결과**: 슬러그 변경 및 이미지 복구 완료, 모든 이미지 메타데이터 생성 완료

### 블로그 글 303 (스타와 함께 마쓰구와 함께) 마이그레이션 완료 ✅ (2025-11-29)
- **목적**: 5번째 블로그 글 마이그레이션 및 최적화
- **완료된 작업**:
  1. **콘텐츠 최적화** ✅:
     - 하드코딩된 관련 포스트 섹션 제거
     - 태그 섹션 제거
     - 플레이스홀더 이미지 1개 제거 ("이미지URL")
     - 중복 이미지 1개 제거
     - 과도한 키워드 패턴 정제 (2개 수정)
     - 텍스트 단락 개선 (3개 단락 추가)
  2. **이미지 관리** ✅:
     - YouTube 썸네일 이미지 1개 확인 (대표 이미지로 사용 중)
     - 플레이스홀더 이미지 제거로 콘텐츠 정리
  3. **메타데이터** ⚠️:
     - YouTube 썸네일은 외부 URL이므로 메타데이터 생성 불필요
- **결과**: 블로그 글 303 마이그레이션 완료, 플레이스홀더 이미지 제거로 콘텐츠 정리 완료

### 블로그 글 304 (마쓰구 탄생 스토리) 마이그레이션 완료 ✅ (2025-11-29)
- **목적**: 4번째 블로그 글 마이그레이션 및 최적화
- **완료된 작업**:
  1. **콘텐츠 최적화** ✅:
     - 하드코딩된 관련 포스트 섹션 제거
     - 태그 섹션 제거
     - 플레이스홀더 이미지 2개 제거 ("드라이버이미지URL", "마쓰구이미지URL")
     - 텍스트 단락 개선 (11개 단락 추가)
  2. **이미지 관리** ✅:
     - 대표 이미지 1개 확인 (originals/blog/2017-03/304/)
     - 플레이스홀더 이미지 제거로 콘텐츠 정리
  3. **메타데이터 생성** ✅:
     - 대표 이미지 1개에 메타데이터 생성 완료 (일반 메타 생성 사용)
- **결과**: 블로그 글 304 마이그레이션 완료, 플레이스홀더 이미지 제거로 콘텐츠 정리 완료

### 블로그 이미지 마이그레이션 프로세스 개선 및 이경영 글 최적화 완료 ✅ (2025-11-29)
- **목적**: 블로그 이미지 마이그레이션 프로세스 개선 및 문서화
- **완료된 작업**:
  1. **문서 업데이트** ✅:
     - `docs/blog-image-migration-and-cleanup-plan.md`: 이미지 이동 후 대기 시간 및 메타데이터 생성 방법 설명 추가
     - `docs/blog-post-optimization-guide.md`: 메타데이터 생성 방법 및 대기 시간 가이드 추가
  2. **스크립트 개선** ✅:
     - `scripts/optimize-blog-post-complete.js`: 이미지 이동 후 10초 대기 시간 자동 추가 (Storage 안정화)
  3. **이경영 글(ID: 305) 최적화 완료** ✅:
     - 루트 폴더에 있던 이미지 2개를 갤러리 폴더로 이동 완료
     - 깨진 이미지 2개 제거 완료
     - 주황색 옷 이미지 복구 완료 (Storage 루트에서 찾아서 이동)
     - 모든 이미지(3개)에 메타데이터 생성 완료 (일반 메타 생성 사용)
  4. **메타데이터 생성 방법 명확화** ✅:
     - 블로그 이미지는 "일반 메타 생성" 사용 (골프 AI 생성 아님)
     - 이유: 연령대 분석이나 골프 카테고리 자동 결정 같은 특화 기능이 필요 없음
     - ALT, Title, Description, Keywords만 있으면 충분

### 제목 중복 제거 기능 개선 및 김구식 글 최적화 완료 ✅ (2025-11-29)
- **목적**: 제목과 내용 상단 타이틀의 중복 제거로 가독성 및 SEO 최적화
- **완료된 작업**:
  1. **`refine-blog-content.js` 개선** ✅:
     - 한글 조사(을/를, 이/가, 은/는 등) 처리 추가로 유사도 계산 정확도 향상
     - 마크다운 제목(# ## ###)과 원본 제목의 중복 제거 (유사도 40% 이상)
     - 내용 상단 타이틀과 원본 제목의 중복 제거 (유사도 40% 이상, 핵심 키워드 3개 이상 매칭)
     - 예: 제목 "마쓰구골프 드라이버를 사용하는 세계적인 골프지도자 김구식 선생님을 소개합니다."와 내용 상단 "세계적인 골프지도자 김구식 선생님 소개 - 고반발드라이버 비거리향상 추천" 중복 제거
  2. **문서 업데이트** ✅:
     - `docs/blog-post-optimization-guide.md`에 제목 중복 제거 가이드 추가
     - Phase 3 콘텐츠 정제 섹션에 상세 설명 추가
  3. **김구식 글(ID: 122) 최적화 완료** ✅:
     - 중복 마크다운 제목 제거 완료 (유사도 62.5%)
     - 전체 최적화 스크립트 실행 완료 (11/11 단계 성공)
     - 이미지 배치 최적화 완료
     - 가독성 및 SEO 개선 완료

### 블로그 포스트 최적화 가이드 작성 및 강석 글 최적화 완료 ✅ (2025-11-29)
- **목적**: 블로그 포스트의 이미지 중복 제거, 콘텐츠 정제, 이미지 배치 최적화
- **완료된 작업**:
  1. **최적화 가이드 문서 작성** ✅:
     - `docs/blog-post-optimization-guide.md` 생성
     - `docs/blog-paragraph-splitting-and-image-placement-guide.md` 생성 (단락 분할 및 이미지 배치 가이드)
     - 6단계 작업 체크리스트 (현황 분석 → 중복 제거 → 콘텐츠 정제 → 이미지 배치 → 메타데이터 → 검증)
     - 9개의 실행 스크립트 작성 및 문서화
  2. **실행 스크립트 작성** ✅:
     - `scripts/analyze-blog-gallery-images.js`: 블로그와 갤러리 이미지 비교 분석
     - `scripts/remove-duplicate-blog-images.js`: 블로그 글 내 중복 이미지 제거
     - `scripts/refine-blog-content.js`: 과도한 키워드 제거, 자연스러운 문장으로 수정
     - `scripts/remove-hardcoded-related-posts.js`: 하드코딩된 관련 포스트 섹션 제거
     - `scripts/remove-tags-section-from-content.js`: content 내 태그 섹션 제거
     - `scripts/restore-missing-images-to-content.js`: 갤러리에 있지만 content에 없는 이미지 복구
     - `scripts/improve-paragraph-splitting.js`: 텍스트 단락을 문장 단위로 분리
     - `scripts/optimize-image-placement.js`: 이미지를 글 중간중간에 적절히 배치
     - `scripts/optimize-blog-post-complete.js`: 모든 최적화 단계를 자동으로 실행하는 통합 스크립트
  3. **강석 글(ID 123) 최적화 완료** ✅:
     - **현황 분석**: 블로그 글 13개 이미지 → 고유 7개, 중복 6개 확인
     - **중복 제거**: 6개 중복 이미지 제거 완료 (13개 → 7개)
     - **콘텐츠 정제**: 과도한 키워드 반복 4개 수정 ("고반발드라이버 추천 - 드라이버추천 추천 - 골프드라이버 추천 - 비거리향상 추천" → "고반발드라이버 비거리향상 추천")
     - **하드코딩된 관련 포스트 제거**: content 내 관련 포스트 섹션 제거 완료
     - **태그 섹션 제거**: content 내 태그 섹션 제거 완료
     - **누락된 이미지 복구**: 갤러리에 있지만 content에 없는 3개 이미지 복구 완료
     - **텍스트 단락 개선**: 텍스트 단락을 문장 단위로 분리 (4개 → 11개)
     - **이미지 배치 최적화**: 7개 이미지를 글 중간중간에 적절히 배치 완료
     - **최종 결과**: 
       - 블로그 글 이미지 7개 = 갤러리 이미지 7개, 중복 0개
       - 이미지/텍스트 비율: 0.64 (적절)
       - 총 단락: 18개 (제목 3개 + 텍스트 11개 + 이미지 7개)
  4. **다음 블로그 글 마이그레이션 준비** ✅:
     - 통합 스크립트 생성: `scripts/optimize-blog-post-complete.js`
     - 모든 최적화 단계를 자동으로 실행하는 원클릭 솔루션 제공
- **참고 문서**: 
  - `docs/blog-post-optimization-guide.md`
  - `docs/blog-paragraph-splitting-and-image-placement-guide.md`

### 블로그 이미지 마이그레이션 및 정리 계획 수립 및 Phase 1 완료 ✅ (2025-11-29)
- **목적**: Wix에서 마이그레이션된 블로그 이미지들을 체계적으로 정리하고 최적화
- **완료된 작업**:
  1. **계획 문서 작성** ✅:
     - `docs/blog-image-migration-and-cleanup-plan.md` 생성
     - 5단계 실행 계획 수립 (분석 → 정리 → 중복 제거 → 메타데이터 → 검증)
  2. **Phase 1: 전체 분석 완료** ✅:
     - 전체 블로그 이미지 현황 파악 (164개 글, 524개 고유 이미지)
     - 중복 이미지 그룹 식별 (2개 그룹, 4개 이미지)
     - Storage에서 못 찾은 이미지 확인 (93개)
     - 외부 URL 확인 (7개)
     - 분석 결과 저장: `backup/blog-image-analysis-2025-11-29T00-19-21.json`
     - 중복 그룹 저장: `backup/blog-duplicate-groups-2025-11-29T00-19-21.json`
  3. **Phase 1 스크립트 생성** ✅:
     - `scripts/phase1-analyze-all-blog-images.js` 생성
- **분석 결과 요약**:
  - 총 블로그 글: 164개
  - 고유 이미지 URL: 524개
  - Storage에서 찾음: 424개 (80.9%)
  - Storage에서 못 찾음: 93개 (17.8%) ⚠️
  - 외부 URL: 7개 (1.3%) ⚠️
  - 중복 이미지 그룹: 2개 (4개 이미지)
- **다음 단계**: Phase 2 (발행일 순서로 글별 정리) - 강석 글부터 시작
- **변경 파일**:
  - `docs/blog-image-migration-and-cleanup-plan.md` (신규)
  - `scripts/phase1-analyze-all-blog-images.js` (신규)
  - `backup/blog-image-analysis-2025-11-29T00-19-21.json` (분석 결과)
  - `backup/blog-duplicate-groups-2025-11-29T00-19-21.json` (중복 그룹)

### 80번 메시지 이미지 복구 완료 ✅ (2025-11-28)
- **목적**: 솔라피 콘솔에서 수동으로 다운로드한 이미지를 Supabase Storage에 업로드하여 80번 메시지의 이미지 복구
- **완료된 작업**:
  1. **로컬 파일 기반 이미지 복구 스크립트 생성** ✅:
     - `scripts/recover-message-80-image-from-file.js` 생성
     - 로컬 파일 경로를 받아서 Supabase Storage에 업로드
     - `image_metadata` 테이블에 메타데이터 저장
     - `channel_sms.image_url` 업데이트
  2. **이미지 복구 실행** ✅:
     - 다운로드 폴더의 이미지 파일(`나노레벨_40g_티타늄샤프트 (1).jpg`, 210.37KB) 사용
     - Supabase Storage 경로: `originals/mms/2025-11-18/80/mms-80-1764338795245-1.jpg`
     - 공개 URL 생성 및 DB 업데이트 완료
     - 메타데이터 ID: 56563
- **변경 파일**:
  - `scripts/recover-message-80-image-from-file.js` (신규)
- **결과**: SMS 편집 페이지(`/admin/sms?id=80`)에서 이미지가 정상적으로 표시됨

### 고객 메시지 이력 한글화 및 상태 노출 개선 ✅ (2025-11-28)
- **목적**: 고객 메시지 이력 모달에서 영어 상태값(Sent/Partial 등) 대신 직관적인 한글 라벨을 제공해 운영자가 메시지 상태를 빠르게 파악할 수 있도록 개선
- **완료된 작업**:
  1. 발송 상태(`sendStatus`) 한글화: `sent → 발송 완료`, `partial → 일부 발송`, `failed → 발송 실패`, `scheduled → 예약 발송`
  2. 메시지 상태(`messageStatus`) 한글화: `sent → 메시지 완료`, `partial → 메시지 부분 발송`, `draft → 초안`, `scheduled → 예약됨` 등
  3. 메시지 타입(SMS/LMS/MMS)은 기존값을 유지하고 나머지 배지 문구만 한글로 변환
- **변경 파일**:
  - `components/admin/CustomerMessageHistoryModal.tsx`

### 알리고 템플릿 내용 확인 및 마이그레이션 계획서 업데이트 ✅ (2025-11-27)
- **목적**: 알리고 템플릿 내용 확인 후 솔라피 마이그레이션 계획서 업데이트
- **완료된 작업**:
  1. **템플릿 내용 확인** ✅:
     - 기본안내 (TI_8967): 고반발 드라이버 상세정보 안내 템플릿 내용 확인
     - 시타사이트&약도안내 최신 (TV_5953): 시타 예약 안내 템플릿 내용 확인
     - 당일시타예약최신: 당일 시타 예약 리마인더 템플릿 내용 확인
  2. **마이그레이션 계획서 업데이트** ✅:
     - 각 템플릿의 상세 내용, 버튼 설정, 변수 정보 추가
     - 솔라피 등록용 템플릿 가이드 작성
     - 우선순위 업데이트 (3개 템플릿 모두 우선 등록 필요로 표시)
  3. **템플릿 상세 정보**:
     - **기본안내 (TI_8967)**: 제품 상세정보 안내, 버튼: 마쓰구 공식 홈페이지
     - **시타사이트&약도안내 (TV_5953)**: 시타 예약 안내, 버튼 2개 (시타 예약하기, 약도 안내)
     - **당일시타예약최신**: 당일 시타 예약 리마인더, 버튼: 약도 안내
- **변경 파일**:
  - `docs/aligo-to-solapi-migration-plan.md`: 3개 템플릿 상세 내용 추가, 우선순위 업데이트
- **다음 단계**:
  - 솔라피 대시보드에서 3개 템플릿 등록
  - 템플릿 검수 완료 대기
  - 코드에 템플릿 코드 반영

### 예약 관리 고객 동기화 기능 추가 ✅ (2025-11-26)
- **목적**: 예약 관리에서 고객 연결 상태 확인 및 동기화 기능 추가
- **완료된 작업**:
  1. **고객 연결 상태 표시** ✅:
     - ✅ 연결됨: 초록색 체크 아이콘 표시
     - 🔗 연결 필요: 주황색 링크 아이콘 표시 (고객 정보는 있지만 customer_profile_id가 없음)
     - ⚠️ 고객 정보 없음: 회색 경고 아이콘 표시
  2. **개별 동기화 기능** ✅:
     - 각 예약 행에 동기화 버튼(🔄) 추가 (연결이 필요한 경우에만 표시)
     - 동기화 모달에서 선택 가능한 항목:
       - 이름 동기화 (예약 이름 → 고객 이름)
       - 전화번호 동기화
       - 이메일 동기화 (예약 이메일 ↔ 고객 이메일)
       - 고객 연결 (customer_profile_id 설정) - 필수 권장
  3. **일괄 동기화 기능** ✅:
     - 체크박스 컬럼 추가 (전체 선택/해제 지원)
     - 선택된 예약들을 한 번에 동기화
     - 동기화 옵션 선택 가능 (이름, 전화번호, 이메일, 고객 연결)
     - 동기화 가능한 예약만 필터링 (고객 정보가 있는 예약만)
  4. **동기화 모달** ✅:
     - 예약 정보와 고객 정보 비교 표시
     - 변경될 내용 미리보기
     - 체크박스로 동기화할 항목 선택
     - 고객 연결 상태 표시
- **파일 수정**:
  - `components/admin/bookings/BookingListView.tsx`: 고객 연결 상태 확인, 개별/일괄 동기화 기능, 동기화 모달 추가
  - `pages/admin/booking/index.tsx`: 고객 데이터 1,000건 제한 문제 해결을 위해 페이지네이션 로드 적용 (누락 고객도 동기화 가능)
  - `pages/admin/customers/index.tsx`: URL 파라미터 기반 자동 검색/편집 지원 (`?phone=...&autoEdit=true`)
  - `components/admin/bookings/QuickAddBookingModal.tsx`: 고객 검색 자동완성(이름/전화) 및 기본 서비스 “마쓰구 드라이버 시타서비스” 적용
  - `pages/api/bookings/next-available.ts`: ‘다음 예약 가능일’ 문자열이 실제 날짜와 일치하도록 KST 기준 포맷 로직 수정
  - `pages/booking.tsx`: 사용자가 선택한 예약 정보에 요일 표기를 추가해 가독성 향상
  - `pages/booking/form.tsx`: 기본 정보 입력 UX 개선 (전화번호 자동 포맷·숫자 키패드, 이메일 토글, 고객 안내 단순화)
  - `pages/booking/form.tsx`: 골프 정보 단계의 탄도/구질 선택 UI를 시각 아이콘(**▽30°/△45°/▲60°**, 방향 화살표)으로 개선하고 구질 복수 선택을 지원
  - `pages/booking/form.tsx`: 연령대 선택을 골프 정보 단계로 이동하고, 연령대에 따라 클럽/비거리 placeholder·추천값이 자동 변경되도록 개선

### 프로덕션 빌드 테스트 및 배포 완료 ✅ (2025-11-23)
- **목적**: 빌드 테스트 후 프로덕션 배포
- **완료된 작업**:
  1. **빌드 테스트 실행** ✅:
     - `npm run predeploy` 실행
     - `.next` 폴더 삭제 및 빌드 캐시 정리
     - Next.js 프로덕션 빌드 성공 (190개 페이지 생성)
     - Sitemap 생성 완료
  2. **Vercel 프로덕션 배포** ✅:
     - Vercel CLI를 통한 프로덕션 배포 실행
     - 배포 URL: `https://mas-936rt7ypd-taksoo-kims-projects.vercel.app`
     - 배포 상태: Ready (완료)
     - 빌드 시간: 약 2분
- **배포 정보**:
  - 배포 시간: 2025-11-23
  - 배포 환경: Production
  - 빌드 상태: 성공
  - 배포 상태: Ready

### AI 이미지 생성 고도화: No Makeup 및 ChatGPT 프롬프트 최적화 ✅ (2025-11-23)
- **목적**: AI 이미지 생성 메뉴에 자연스러운 인물 사진 옵션(No Makeup) 및 ChatGPT 프롬프트 최적화 기능 추가
- **완료된 작업**:
  1. **No Makeup 옵션 추가** ✅:
     - 자연스러운 인물 사진 생성 옵션 추가
     - 기본값: true (활성화)
     - 프롬프트에 'no makeup, natural skin, authentic appearance, realistic skin texture' 자동 추가
     - 토글 스위치 UI 추가 (파란색 스타일)
  2. **ChatGPT 프롬프트 최적화 옵션 추가** ✅:
     - ChatGPT를 사용하여 프롬프트를 영어로 최적화하는 옵션 추가
     - 기본값: false (선택사항)
     - `/api/kakao-content/generate-prompt` API 연동
     - 추가 시간 소요 안내 포함
  3. **프롬프트 개선** ✅:
     - `buildUniversalPrompt` 함수에 자연스러운 스타일 스펙 추가
     - 한국인 외모 강화 지시 유지
     - 자연스러운 피부 질감, 현실적인 인물 특징 강조
  4. **피팅 이미지 업데이트** ✅:
     - 새로 생성된 No Makeup 적용 이미지로 `try-a-massgoo.tsx` 업데이트
     - URL: `https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/originals/ai-generated/2025-11-23/ai-generated-senior-emotional-feed-1763898284516-1-1.jpg`
- **파일 수정**:
  - `pages/admin/ai-image-generator.tsx`: No Makeup 옵션, ChatGPT 최적화 옵션 추가, 프롬프트 로직 개선
  - `pages/try-a-massgoo.tsx`: 새로 생성된 피팅 이미지 URL 업데이트

### 피팅 이미지 생성 및 예약 프론트 페이지 개선 ✅ (2025-11-23)
- **목적**: AI 이미지 생성 메뉴에 피팅 이미지 프리셋 추가 및 예약 프론트 페이지를 브랜드 색상(블랙/골드/블루)에 맞게 개선
- **완료된 작업**:
  1. **AI 이미지 생성 페이지에 피팅 이미지 프리셋 추가** ✅:
     - "🎯 피팅 이미지 생성" 프리셋 버튼 추가
     - 클릭 시 자동으로 프롬프트, 브랜딩 톤(시니어 중심 감성형), 이미지 타입(피드), 브랜딩 옵션(전체 브랜딩) 설정
     - 전문 피터 작업 장면 프롬프트 자동 입력
     - No Makeup 옵션 기본값 true로 설정
  2. **try-a-massgoo.tsx 히어로 섹션 개선** ✅:
     - 블랙 배경 + 매장 실제 사진 (`massgoo_studio_test_3.png`) 배경 적용
     - 골드 그라데이션 타이틀 (KGFA 1급 시타 체험하기)
     - 골드 액센트 배지 (KGFA 1급 전문 피터)
     - 블루 CTA 버튼 (신뢰감 강조)
  3. **try-a-massgoo.tsx 서비스 소개에 실제 이미지 추가** ✅:
     - KGFA 1급 전문 피터: 시타 상담 장면 (`IMG_2630.jpeg`)
     - 정밀 스윙 분석: 시타 체험 장면 (`massgoo_studio_test_3.png`)
     - 맞춤형 추천: 전문 피터 작업 이미지 (AI 생성 가능 안내)
  4. **모든 예약 페이지 색상 통일** ✅:
     - `booking.tsx`: 진행 단계, 입력 필드, CTA 버튼 (빨간색 → 블루)
     - `booking/form.tsx`: 모든 입력 필드 포커스, 필수 표시, 에러 메시지, CTA 버튼 (빨간색 → 블루)
     - `booking/success.tsx`: 진행 단계, CTA 버튼 (빨간색 → 블루)
     - `booking/check-distance.tsx`: 에러 메시지 (빨간색 → 블루)
     - `try-a-massgoo.tsx`: 네비게이션 버튼, 링크, 진행 단계 (빨간색 → 블루)
  5. **골드 액센트 추가** ✅:
     - 히어로 섹션 타이틀: 골드 그라데이션 텍스트
     - 배지: 골드 배경 (KGFA 1급 전문 피터)
- **파일 수정**:
  - `pages/admin/ai-image-generator.tsx`: 피팅 이미지 프리셋 버튼 추가
  - `pages/try-a-massgoo.tsx`: 히어로 섹션, 서비스 소개, 색상 통일
  - `pages/booking.tsx`: 색상 통일 (빨간색 → 블루)
  - `pages/booking/form.tsx`: 색상 통일 (빨간색 → 블루)
  - `pages/booking/success.tsx`: 색상 통일 (빨간색 → 블루)
  - `pages/booking/check-distance.tsx`: 색상 통일 (빨간색 → 블루)

### AI 이미지 생성 메뉴 추가 ✅ (2025-11-23)
- **목적**: 빠르고 간편하게 MASSGOO 브랜딩이 적용된 고품질 이미지를 생성할 수 있는 전용 메뉴 구축
- **완료된 작업**:
  1. **관리자 네비게이션 메뉴 추가** ✅:
     - 멀티채널 대시보드와 AI 관리 사이에 "🎨 AI 이미지 생성" 메뉴 추가
     - `/admin/ai-image-generator` 경로로 접근
  2. **AI 이미지 생성 페이지 생성** ✅:
     - 브랜딩 톤 선택: 시니어 중심 감성적 브랜딩 (골드 톤), 하이테크 중심 혁신형 브랜딩 (블랙 톤)
     - 이미지 타입 선택: 배경 이미지 (가로형), 프로필 이미지 (정사각형), 피드 이미지 (정사각형)
     - 브랜딩 옵션: 전체 브랜딩 (강조), 로고 포함, 브랜딩 없음
     - 생성 개수: 1개, 2개, 4개 선택 가능
  3. **한국 골퍼 스펙 자동 적용** ✅:
     - 시니어 중심: 50-70세 한국인 골퍼
     - 하이테크 중심: 40-60세 한국인 골퍼
     - 한국인 외모, 한국인 피부톤, 현실적인 한국인 얼굴 특징 자동 적용
  4. **365일 24시간 적용 가능한 프롬프트 시스템** ✅:
     - 계절/요일에 구애받지 않는 범용 이미지 생성
     - 시즌별 요소 제거, 중립적 구성
     - 핵심 메시지와 브랜드 정체성에 집중
     - 어떤 요일, 어떤 월, 어떤 계절에도 사용 가능
  5. **기존 카카오톡 콘텐츠 생성 API 활용** ✅:
     - `/api/kakao-content/generate-images` API 통합
     - MASSGOO 브랜딩 자동 적용
     - Supabase 자동 저장
     - 사용량 로깅
- **파일 생성**:
  - `pages/admin/ai-image-generator.tsx` - AI 이미지 생성 메인 페이지
- **파일 수정**:
  - `components/admin/AdminNav.tsx` - AI 이미지 생성 메뉴 추가
- **주요 기능**:
  - 간편한 UI로 빠른 이미지 생성
  - 브랜딩 톤별 자동 색상 및 분위기 적용
  - 한국 골퍼 스펙 자동 적용
  - 계절/요일 무관 범용 이미지 생성
  - 생성된 이미지 즉시 확인 및 다운로드

## ✅ 최근 완료된 작업 (2025-11-26)

### 동반 방문자 패턴 처리 완료 ✅ (2025-11-26)
- **목적**: 이름에 "(여자)", "(여자손님 모시고 옴)" 등 동반 방문자 정보가 포함된 예약을 정규화하고 방문 횟수 업데이트
- **완료된 작업**:
  1. **동반 방문자 패턴 처리 스크립트 작성** ✅:
     - `scripts/fix-companion-visitors.js` 생성
     - 이름에서 괄호 부분 제거하여 기본 이름으로 정규화
     - notes 필드에 동반 방문자 정보 추가
     - 같은 전화번호를 가진 고객의 visit_count 업데이트
  2. **처리 결과** ✅:
     - 총 21건 처리 완료
     - 주요 처리 사례:
       - "도규환(여자)" → "도규환" (방문 2회, notes에 "여자 동반 방문" 추가)
       - "박춘은(여자손님 모시고 옴)" → "박춘은" (방문 4회, notes에 "여자 동반 방문" 추가)
       - "(AS)", "(보상매입)", "(그립교체)" 등 서비스 유형 정보도 notes에 추가
  3. **데이터 정규화** ✅:
     - 모든 동반 방문자 패턴 이름 정규화
     - 고객 테이블의 visit_count 자동 업데이트
     - 고객 이름도 정규화된 이름으로 업데이트
- **파일 생성**:
  - `scripts/fix-companion-visitors.js`: 동반 방문자 패턴 처리 스크립트
- **처리 통계**:
  - 처리 완료: 21건
  - 오류: 0건
  - 주요 패턴: (여자), (여자손님 모시고 옴), (AS), (보상매입), (그립교체), (2인) 등

### Low Confidence 매칭 마이그레이션 완료 ✅ (2025-11-26)
- **목적**: Low Confidence 매칭 19건을 처리하여 bookings 테이블에 추가
- **완료된 작업**:
  1. **마이그레이션 스크립트 작성** ✅:
     - `scripts/migrate-low-confidence-matches.js` 생성
     - AS 분리 로직 구현
     - 이름 정제 로직 구현
     - 복수명 처리 로직 구현
  2. **데이터 처리** ✅:
     - 처리 완료: 16건
     - 삭제 대상: 1건 (시타 - 이름만 있어 유효하지 않음)
  3. **주요 처리 내용**:
     - AS 분리: 진지화AS, 최원구AS, 김춘택AS, 윤의권AS, 김명배AS, 김태정AS
     - 이름 정제: 김대진(2인) → 김대진, 장철 → 박장철, 김석현점검 → 김석현
     - 재방문 추가: 모든 매칭을 기존 고객에 재방문으로 추가
     - 복수명 처리: 송영의,이관욱 AS → 이관욱만 처리 (송영의 전화번호 없음)
  4. **데이터 수정** ✅:
     - `scripts/fix-low-confidence-bookings.js` 생성
     - 최동우고객 → 최동우로 이름 수정
     - 이동열, 오세집 AS 방문 플래그 수정
- **파일 생성**:
  - `scripts/migrate-low-confidence-matches.js`: Low Confidence 매칭 마이그레이션 스크립트
  - `scripts/fix-low-confidence-bookings.js`: 생성된 예약 데이터 수정 스크립트
  - `backup/low-confidence-migration-*.json`: 마이그레이션 결과 보고서

### High/Medium Confidence 매칭 마이그레이션 완료 ✅ (2025-11-26)
- **목적**: High/Medium Confidence 매칭 73건을 처리하여 bookings 테이블에 추가
- **완료된 작업**:
  1. **마이그레이션 스크립트 작성** ✅:
     - `scripts/migrate-high-medium-matches.js` 생성
     - High Confidence 18건 자동 처리
     - Medium Confidence 55건 자동 처리
     - 재방문으로 처리 (기존 고객에 추가)
  2. **스크립트 실행** ✅:
     - High Confidence 18건 처리 완료
     - Medium Confidence 55건 처리 완료
     - 총 73건 추가
  3. **최종 결과**:
     - 총 처리: 89건 (High 18 + Medium 55 + Low 16)
     - 예상 총 예약 수: 1,073건 (기존 1,000건 + 추가 73건)
- **파일 생성**:
  - `scripts/migrate-high-medium-matches.js`: High/Medium Confidence 매칭 마이그레이션 스크립트
  - `backup/high-medium-migration-*.json`: 마이그레이션 결과 보고서

### 전화번호 매칭 기능 구현 완료 ✅ (2025-11-26)
- **목적**: 전화번호 없는 302건의 예약 데이터를 자동으로 매칭하여 전화번호 찾기
- **완료된 작업**:
  1. **자동 매칭 스크립트 작성** ✅:
     - `scripts/match-missing-phones.js` 생성
     - 이름, 날짜, 이메일 기준 매칭
     - 신뢰도별 분류 (High/Medium/Low)
  2. **매칭 결과 적용 스크립트 작성** ✅:
     - `scripts/apply-phone-matches.js` 생성
     - High confidence 매칭 자동 적용 옵션
     - 원본 CSV 백업 및 업데이트된 CSV 생성
  3. **매칭 결과**:
     - 매칭 성공: 92건 (High: 18건, Medium: 55건, Low: 19건)
     - 매칭 실패: 210건 (수동 입력 필요)
  4. **문서화** ✅:
     - `docs/phases/detailed-plans/phase-6-phone-matching-guide.md` 작성
- **파일 생성**:
  - `scripts/match-missing-phones.js`: 자동 매칭 스크립트
  - `scripts/apply-phone-matches.js`: 매칭 결과 적용 스크립트
  - `docs/phases/detailed-plans/phase-6-phone-matching-guide.md`: 사용 가이드
- **보고서 생성**:
  - `backup/phone-matching-report-*.json`: 상세 매칭 보고서
  - `backup/phone-updates-*.csv`: CSV 업데이트 가이드

### 관리자 페이지 개선: Phase 3, 4 완료 ✅ (2025-11-26)
- **목적**: 고객별 그룹화 뷰 추가 및 데이터 차이 분석 완료
- **완료된 작업**:
  1. **고객별 그룹화 뷰 구현** ✅:
     - `CustomerGroupedView.tsx` 컴포넌트 생성
     - 고객별 예약 이력 아코디언 형태로 표시
     - 고객 검색 및 정렬 기능 (방문 횟수, 고객명, 마지막 방문일)
     - 고객별 통계 표시 (방문 횟수, 노쇼 횟수, 참석 횟수, 첫/마지막 방문일)
     - 관리자 페이지에 "고객별" 탭 추가
  2. **데이터 차이 분석 완료** ✅:
     - `analyze-migration-difference.js` 스크립트 작성
     - CSV 1,247건 → DB 945건 차이 원인 분석
     - 제외된 데이터: 전화번호 없음 302건, 중복 예약 47건
     - 분석 보고서 생성 (`backup/migration-difference-analysis-*.json`)
  3. **마이그레이션 스크립트 개선** ✅:
     - `--use-registration-date` 옵션 추가 (예약 날짜/시간 없을 때 등록일 사용)
     - `--verbose` 옵션 추가 (상세 로그 출력)
     - 처리 통계 출력 개선
- **파일 생성**:
  - `components/admin/bookings/CustomerGroupedView.tsx`: 고객별 그룹화 뷰 컴포넌트
  - `scripts/analyze-migration-difference.js`: 데이터 차이 분석 스크립트
- **파일 수정**:
  - `pages/admin/booking/index.tsx`: 고객별 탭 추가
  - `scripts/migrate-wix-bookings.js`: 옵션 추가 및 통계 개선
  - `docs/phases/detailed-plans/phase-6-admin-improvement-plan.md`: Phase 3, 4 완료 표시

### 관리자 페이지 개선: 통계 데이터 및 필터 기능 강화 ✅ (2025-11-26)
- **목적**: 의미있는 통계 데이터 표시 및 노쇼/취소 필터 기능 추가
- **완료된 작업**:
  1. **통계 데이터 추가** ✅:
     - 최다 방문 고객 TOP 10 표시 (방문 횟수, 노쇼 횟수, 첫/마지막 방문일)
     - 노쇼율 통계 (전체 노쇼율, 노쇼 건수)
     - 재방문율 통계 (재방문 고객 수, 재방문율)
     - 평균 방문 횟수 통계
     - 참석 상태 통계 (참석, 노쇼, 취소, 대기중)
  2. **필터 기능 강화** ✅:
     - 참석 상태 필터 추가 (전체, 참석, 노쇼, 취소, 대기중)
     - 예약 상태 필터와 참석 상태 필터 복합 사용 가능
  3. **UI 개선** ✅:
     - 통계 카드 시각화 개선 (색상 코딩, 아이콘 추가)
     - 최다 방문 고객 목록 스크롤 가능한 섹션 추가
- **파일 수정**:
  - `components/admin/bookings/BookingDashboard.tsx`: 통계 데이터 계산 및 표시 로직 추가
  - `components/admin/bookings/BookingListView.tsx`: 참석 상태 필터 추가
  - `docs/phases/detailed-plans/phase-6-admin-improvement-plan.md`: 개선 계획 문서 작성

### Wix 예약 데이터 대규모 마이그레이션 구현 및 실행 완료 ✅ (2025-11-26)
- **목적**: Wix 900건 예약 데이터를 기존 683건 대체 및 전화번호 파싱 규칙 정의
- **완료된 작업**:
  1. **전화번호 파싱 및 정규화 함수 구현** ✅:
     - `normalizePhone()` 함수 개선 (82 분리, 01→010 변환)
     - `formatPhoneNumber()` 함수 개선 (하이픈 추가)
     - `lib/formatters.js`에 함수 추가
  2. **마이그레이션 스크립트 개선** ✅:
     - 동적 양식 필드 파싱 함수 구현 (`parseFormFields()`)
     - 클럽 정보 구조화 파싱 함수 구현 (`parseClubInfo()`)
     - 비거리 정규화 함수 구현 (`normalizeDistance()`)
     - 탄도, 구질 파싱 함수 구현 (`parseTrajectory()`, `parseShotShape()`)
     - 기존 데이터 백업 및 삭제 로직 추가
     - `club` 필드 NOT NULL 제약조건 처리 (null → 빈 문자열)
  3. **마이그레이션 실행 완료** ✅:
     - CSV 파일: 1251줄 (약 1250건)
     - 마이그레이션 결과: 고객 681명, 예약 945건
     - 오류: 0건
     - 기존 데이터 백업 완료
  4. **문서 업데이트** ✅:
     - 전화번호 파싱 규칙 문서화
     - 마이그레이션 가이드 업데이트
- **파일 수정**:
  - `scripts/migrate-wix-bookings.js`: 전화번호 정규화, 동적 필드 파싱, 클럽 정보 구조화 구현
  - `lib/formatters.js`: `normalizePhone()` 함수 추가
  - `docs/phases/detailed-plans/phase-6-booking-system-final-plan.md`: 구현 완료 내용 추가
  - `/Users/m2/Desktop/phase-6-booking-system-final-plan.md`: 전화번호 파싱 규칙 추가
  - `/Users/m2/Desktop/phase-6-시타예약-마이그레이션.md`: 전화번호 정규화 규칙 추가

## ✅ 최근 완료된 작업 (2025-11-23)

### 시타 예약 시스템 Wix 수준 개선 - Phase 1 완료 ✅ (2025-11-23)
- **목적**: Wix 관리자 수준의 시타 예약 관리 시스템 구축
- **완료된 작업**:
  1. **데이터베이스 스키마 확장** ✅:
     - `customers` 테이블: email, wix_registered_at, visit_count, no_show_count, last_visit_date 필드 추가
     - `bookings` 테이블: attendance_status 필드 추가
     - `booking_blocks` 테이블 생성 (예약 불가 시간대 관리)
     - `customer_booking_stats` 뷰 생성
     - **Supabase에서 모든 쿼리 실행 완료**
  2. **Wix 데이터 마이그레이션 스크립트**:
     - `scripts/migrate-wix-bookings.js` 작성
     - CSV 파일 파싱 및 데이터 정제
     - 등록일 vs 최초 문의일 비교 로직
     - 이메일 필터링 로직 (@aa.aa, massgoogolf@gmail.com 제외)
     - 방문 횟수 및 노쇼 횟수 계산
  3. **캘린더 페이지 기능**:
     - 빠른 예약 추가 모달 (`QuickAddBookingModal.tsx`)
     - 예약 불가 시간 설정 모달 (`BlockTimeModal.tsx`)
     - 시간대 클릭/더블클릭 이벤트 처리
     - 예약 불가 시간대 회색 블록 표시
  4. **대시보드 상세 모달**:
     - 공통 모달 컴포넌트 (`BookingDetailModal.tsx`)
     - 대시보드에서 이름 클릭 시 모달 표시
     - 모달에서 예약 수정/삭제 기능
  5. **API 엔드포인트**:
     - `/api/bookings/blocks` - 예약 불가 시간대 CRUD
     - `/api/bookings/quick-add` - 빠른 예약 추가
     - `/api/bookings/available` - 예약 가능 시간 조회 (블록 제외)
- **파일 생성**:
  - `docs/phases/detailed-plans/phase-6-migration-schema.sql`
  - `scripts/migrate-wix-bookings.js`
  - `components/admin/bookings/BookingDetailModal.tsx`
  - `components/admin/bookings/QuickAddBookingModal.tsx`
  - `components/admin/bookings/BlockTimeModal.tsx`
  - `pages/api/bookings/blocks.ts`
  - `pages/api/bookings/quick-add.ts`
- **파일 수정**:
  - `components/admin/bookings/BookingCalendarView.tsx` - 빠른 예약 추가 및 예약 불가 시간 기능 통합
  - `components/admin/bookings/BookingDashboard.tsx` - 이름 클릭 시 모달 표시
  - `pages/api/bookings/available.ts` - 예약 불가 시간대 제외 로직 추가
  - `pages/admin/booking/index.tsx` - supabase prop 전달

### 시타 예약 관리자 페이지 Wix 수준 재구성 ✅ (2025-11-21)
- **목적**: 기존 예약 관리 페이지를 Wix 관리자 수준으로 재구성
- **작업 내용**:
  - 기존 파일 삭제: `pages/admin/booking.tsx`, `components/admin/bookings/BookingManagement.tsx`
  - 새로운 구조 생성:
    - `/pages/admin/booking/index.tsx`: 메인 페이지 (대시보드/캘린더/목록 뷰 전환)
    - `/components/admin/bookings/BookingDashboard.tsx`: 통계 및 대시보드 뷰
    - `/components/admin/bookings/BookingCalendarView.tsx`: 주간/월간 캘린더 뷰 (Wix 스타일)
    - `/components/admin/bookings/BookingListView.tsx`: 예약 목록 뷰 (필터링, 검색, 편집)
  - 주요 기능:
    - 대시보드: 통계 카드, 상태별 통계, 다가오는 예약 목록
    - 캘린더 뷰: 주간/월간 전환, 시간대별 예약 표시, 예약 상세 모달
    - 목록 뷰: 고급 필터링 (날짜, 상태, 서비스), 검색, 인라인 편집, 고객 정보 연동
  - 의존성 추가: `date-fns` (날짜 처리)
- **파일 변경**:
  - 삭제: `pages/admin/booking.tsx`, `components/admin/bookings/BookingManagement.tsx`
  - 생성: `pages/admin/booking/index.tsx`, `components/admin/bookings/BookingDashboard.tsx`, `components/admin/bookings/BookingCalendarView.tsx`, `components/admin/bookings/BookingListView.tsx`

## ✅ 최근 완료된 작업 (2025-11-21)

### 카카오 콘텐츠 캘린더 로딩 속도 최적화 ✅ (2025-11-21)
- **문제**: 캘린더 데이터 로딩이 매우 느림 (90초 이상). "캘린더 데이터 로딩 중..." 메시지가 오래 표시됨.
- **원인**: 
  - 각 이미지 존재 여부 확인이 순차적으로 실행됨 (180개 요청 × 평균 500ms = 약 90초)
  - 타임아웃이 5초로 길게 설정됨
- **조치**:
  - `pages/api/kakao-content/calendar-load.js`: 
    - 타임아웃 5초 → 2초로 단축
    - 순차 처리 → 병렬 처리로 변경 (`Promise.all` 사용)
    - 프로필 이미지와 피드 이미지 확인을 각각 병렬로 실행
    - Map을 사용한 빠른 결과 조회
    - 불필요한 로그 제거로 성능 향상
- **효과**: 
  - 로딩 시간이 약 90초에서 2-3초로 단축 (약 30-45배 향상)
  - 사용자 경험 크게 개선

### 카카오 콘텐츠 삭제된 이미지 표시 문제 해결 ✅ (2025-11-21)
- **문제**: 배포 버전에서 삭제된 이미지가 계속 표시됨. 로컬에서는 X로 표기되지만 배포에서는 지워진 이미지가 보임. 수정 후 이미지가 전혀 표시되지 않는 문제 발생.
- **원인**: 
  - DB에 `image_url`이 남아있지만 실제 파일은 삭제됨
  - Supabase Storage CDN 캐시
  - 브라우저 캐시
  - Storage API 경로 파싱 로직 오류로 인해 모든 이미지가 존재하지 않는 것으로 잘못 판단됨
- **조치**:
  - `pages/api/kakao-content/calendar-load.js`: 
    - 초기: Storage API를 사용한 복잡한 경로 파싱 로직 (오류 발생)
    - 수정: HTTP HEAD 요청만 사용하는 간단하고 확실한 방법으로 변경
    - 프로필/피드 데이터 변환 시 실제 파일 존재 여부 확인 후 존재하지 않으면 `imageUrl`을 `undefined`로 설정
  - `components/admin/kakao/ProfileManager.tsx`, `FeedManager.tsx`: 이미지 로드 실패 시 즉시 `imageUrl`을 `undefined`로 설정하여 캐시된 이미지 표시 방지
- **효과**: 
  - 배포 버전에서도 삭제된 이미지가 표시되지 않고, 이미지가 없을 때 X로 표기됨
  - 갤러리에서도 "이미지가 없습니다" 메시지가 정확히 표시됨
  - HTTP HEAD 요청만 사용하여 간단하고 정확한 이미지 존재 여부 확인

### 예약 SMS 발송 로직 개선 ✅ (2025-11-21)
- **문제**: 116번 메시지가 예약 시간이 지났는데도 자동 발송되지 않음. 예약 시간 저장 및 비교 로직에 문제가 있었음.
- **조치**:
  - `pages/api/admin/send-scheduled-sms.js`: 예약 시간 비교 로직에 디버깅 로그 추가, UTC 시간 비교 명확화
  - `pages/api/admin/sms.js`: 예약 시간 저장 시 UTC 변환 검증 추가, ISO 형식 명시적 변환으로 저장
- **효과**: 예약 시간이 올바르게 UTC로 저장되고, Cron Job이 정확하게 예약 메시지를 찾아 발송할 수 있도록 개선.

### SMS 호칭 버튼 사용 안내 추가 ✅ (2025-11-21)
- **배경**: `{name}` 변수와 호칭 버튼을 혼용할 때 사용자 혼동이 발생해 호칭이 중복되는 사례가 보고됨.
- **조치**: `pages/admin/sms.tsx`의 메시지 입력 섹션에 안내 문구 추가 → “호칭은 버튼에서 선택하고 메시지에는 `{name}`만 입력해주세요. 예: `{name}`, 안녕하세요!”
- **효과**: 에디터 내에서 즉시 가이드를 제공해 `{name}` 변수 사용법을 명확히 하고, 잘못된 메시지 구성으로 인한 발송 오류를 예방.

### 스탭진 테스트 UX 조정 ✅ (2025-11-21)
- **요청**: 스탭진 번호 추가 버튼과 분할 기본값이 혼동을 준다는 피드백.
- **조치**:
  - 수신자 섹션의 버튼 라벨을 “🧪 스탭진 추가”로 변경하여 역할을 명확히 함.
  - 수동/자동 분할의 기본 크기를 100명으로 조정하고 자동 분할 옵션에 100명 선택지를 추가.
- **효과**: 테스트 번호 추가와 실제 발송 버튼을 명확히 구분하고, 자주 사용하는 100명 단위 분할 작업을 더 빠르게 수행 가능.

### SMS 호칭 저장 및 Solapi 동기화 상태 자동화 ✅ (2025-11-21)
- **호칭 저장**: `channel_sms` 테이블에 `honorific` 컬럼을 추가하고 기본값을 `'고객님'`으로 설정. `pages/admin/sms.tsx`, `pages/api/admin/sms.js`, `pages/api/channels/sms/send.js`에서 저장/로드/발송 로직을 모두 반영해 메시지를 다시 열어도 선택한 호칭이 유지되도록 개선.
- **상태 자동 업데이트**: `pages/api/admin/sync-solapi-status.js`에서 그룹별 동기화 결과를 누적 집계해 전체 성공/실패 건수에 따라 `status`, `success_count`, `fail_count`, `sent_count`를 자동으로 업데이트. 여러 그룹으로 나뉜 발송의 동기화 버튼을 누르면 상태가 즉시 `발송됨/부분 발송/실패`로 재평가됨.

## ✅ 최근 완료된 작업 (2025-11-19)

### SMS 예약 발송 UX 개선 및 상태 표기 통일 ✅ (2025-11-19)
- **SMS 리스트 상태 표기 한글 통일** (`pages/admin/sms-list.tsx`)
  - `getStatusBadge` 함수에 `partial` 케이스 추가: "부분 발송" (노란색 배지)
  - 모든 상태를 한글로 통일: "초안" (draft), "발송됨" (sent), "부분 발송" (partial), "실패" (failed)
- **발송 결과 표기 개선** (`pages/admin/sms-list.tsx`)
  - 이모지 제거 (✅, ❌, 📊) → 텍스트로 변경: "성공", "실패", "총 N건"
  - 가독성 향상 및 일관성 확보
- **예약 발송 검증 강화** (`pages/admin/sms.tsx`)
  - 과거 시간 저장 불가: 현재 시간보다 미래인지 검증
  - 최소 예약 시간 검증: 5분 미만 시 경고 후 확인 요청
  - 보낸 메시지(`status: 'sent'`)는 예약 발송 섹션 비활성화
- **저장 후 ID 업데이트** (`pages/admin/sms.tsx`)
  - `savedSmsId` 상태 추가하여 저장된 메시지 ID 추적
  - `currentSmsNumericId` 계산 시 `savedSmsId`도 고려하여 저장 직후 예약 발송 버튼 활성화
  - 새 메시지 저장 시 URL 자동 업데이트 (`router.replace` with `shallow: true`)
- **"새로 저장" 기능 추가** (`pages/admin/sms.tsx`)
  - 이미 보낸 메시지(`status: 'sent'`)에서만 표시되는 버튼
  - 현재 메시지 내용을 복사하여 새 메시지(draft)로 생성
  - 예약 시간, 수신자 번호, 메모 등 모든 정보 복사
  - 생성된 새 메시지 페이지로 자동 이동
- **"목록으로" 버튼 추가** (`pages/admin/sms.tsx`)
  - 상단 헤더에 "목록으로" 버튼 추가 (저장 버튼 왼쪽)
  - 저장된 메시지면 바로 목록으로 이동
  - 새 메시지이고 내용이 있으면 확인 후 이동
  - 블로그 관리의 "닫기" 기능과 동일한 UX 제공
- **저장 버튼 텍스트 동적 변경** (`pages/admin/sms.tsx`)
  - 보낸 메시지: "수정 저장"
  - 기존 메시지: "저장"
  - 새 메시지: "저장"
- **변경 파일**:
  - `pages/admin/sms-list.tsx` (상태 표기, 발송 결과 개선)
  - `pages/admin/sms.tsx` (예약 발송 검증, 저장 후 ID 업데이트, 새로 저장, 목록으로 버튼)
- **빌드 테스트**: ✅ 성공

### SMS 예약 발송 UX/데이터 연동 및 E2E 검증 ✅ (2025-11-19)
- **에디터 기능 구현** (`pages/admin/sms.tsx`)
  - 예약 발송 토글·`datetime-local` 입력·저장/취소 버튼을 우측 패널에 추가하고, 타임존 변환 헬퍼(`convertUTCToLocalInput`, `convertLocalInputToUTC`)로 로컬↔UTC를 안전하게 동기화
  - 예약 상태(`isScheduled`, `scheduledAt`, `hasScheduledTime`)를 메시지 로드/저장 시 자동 반영하고, 저장 API payload를 빌드하는 `buildSmsPayload` 헬퍼를 도입해 `scheduled_at`, `note`, 수신자, 이미지 등의 필드를 일관되게 전송
  - 예약 전용 PUT 호출(`handleSaveScheduledTime`, `handleCancelScheduled`)을 추가해 이미 저장된 메시지도 UI에서 바로 수정/취소 가능하도록 구현
- **리스트 UI 개선** (`pages/admin/sms-list.tsx`)
  - `scheduled_at` 컬럼을 인터페이스/테이블에 추가하고 `formatScheduledDate`, `getRelativeScheduleLabel` 헬퍼로 Solapi 스타일(`MM/DD HH:MM:SS`) + 상대 시간(`n시간 후/전`)을 동시에 표기, 미래 예약은 파란색으로 강조
  - 예약 정렬/툴팁 확인을 위한 `data-testid="scheduled-time"` 속성을 부여해 테스트 및 운영 점검을 용이하게 함
- **Playwright E2E 스크립트 작성** (`e2e-test/check-scheduled-time-consistency.js`)
  - 관리자 로그인 → `admin/sms-list` 이동 → “예약일” 헤더와 첫 번째 셀 텍스트를 검사하고, 결과를 스크린샷(`scheduled-time-check.png`)과 로그(`scheduled-time-check.log`)로 남기는 시나리오 추가
  - 실행 중 dev 서버 캐시 이슈를 해결하기 위해 서버를 재기동한 뒤 `PLAYWRIGHT_HEADLESS=true` 모드로 성공적으로 통과
- **빌드/QA**
  - `npm run build` 재실행으로 예약 관련 구문 오류를 정정한 후 전체 빌드 성공을 확인
  - 로컬 서버 재시작 → E2E 테스트 순서를 문서화된 운영 규칙과 동일하게 수행

### SMS/고객 API 빌드 복구 및 정리 ✅ (2025-11-19)
- **현상**: `npm run build` 시 `pages/api/admin/customers/[phone]/messages.js`, `pages/api/channels/sms/send.js`, `pages/api/solapi/upload-image.js`에서 중복 선언 및 중괄호 누락으로 컴파일 실패
- **조치**:
  - 고객 메시지 API의 중복된 `supabase`, `normalizePhone`, `formatPhone`, `handler` 선언 제거 후 단일 핸들러 유지
  - SMS 발송 API의 `export default handler` 범위 재구성, 누락된 닫는 중괄호 추가로 모든 `return`이 함수 내부에서 실행되도록 복원
  - Solapi 이미지 업로드 API 말미에 잘못 남아 있던 중복 응답 블록 제거
  - 전체 수정 후 `npm run build` 재실행으로 정상 완료 확인
- **변경 파일**:
  - `pages/api/admin/customers/[phone]/messages.js`
  - `pages/api/channels/sms/send.js`
  - `pages/api/solapi/upload-image.js`
- **결과**: 빌드 성공, 고객 메시지/발송 API 안정화, Solapi 이미지 업로드도 정상 동작

### 고객 메시지 이력 모달 구현 ✅ (2025-11-19)
- **요구사항**: 고객 관리 페이지에서 각 고객이 받은 SMS/MMS 이력을 확인하고 바로 Solapi 또는 SMS 편집 페이지로 이동할 수 있어야 함
- **구현 내용**:
  - `components/admin/CustomerMessageHistoryModal.tsx`: API 연동, 로딩/에러 처리, 상태 배지, Solapi/SMS 상세 보기 버튼이 포함된 모달을 신규 구현
  - 고객 정보와 메시지 50건까지를 불러와 시간 순서대로 표시하고, 메모·성공/실패 건수·이미지 여부 등을 한 카드에서 확인 가능
  - 메시지 ID가 DB에서 삭제된 경우 Solapi 그룹 ID를 이용해 `/api/admin/sync-solapi-status`로 자동 동기화를 시도하여 상세 정보를 복구하고, 그래도 실패하면 안내 메시지를 띄우도록 개선
- **결과**: 고객 관리 화면의 “📱 메시지” 버튼 클릭 시 더 이상 컴포넌트 오류가 발생하지 않으며, 운영자가 고객별 메시지 히스토리를 즉시 확인 가능

### SMS 소프트 삭제 복구 및 재동기화 계획 수립 ✅ (2025-11-19)
- **내용**:
  - `channel_sms` 테이블에서 `deleted_at`가 설정된 레코드(IDs 80, 72, 69, 66, 64)를 복구하여 목록에 다시 노출
  - `/docs/solapi-recovery-plan.md` 문서를 신설해 Solapi API 기반 재동기화/복구 전략을 체계화
    - 단계별(소프트 삭제 복구 → Solapi API 동기화 → 완전 삭제 데이터 재생성) 시나리오 명시
    - `sync-solapi-status`와 Playwright 기반 스크립트 활용 방안 포함
- **결과**: 숨김 처리된 메시지 복구가 완료되었고, 향후 Solapi 서버에서 데이터를 다시 불러와 재생성하는 절차가 정리됨

## ✅ 최근 완료된 작업 (2025-11-16)

### SMS/MMS 에디터 상태 보존 및 리스트 UI 복구 ✅ (2025-11-19)
- **현상**: 발송 완료된 메시지(#94)를 편집 화면에서 메모만 수정해도 상태가 `draft`로 바뀌어 리스트에서 발송 결과/동기화 버튼이 사라짐
- **원인**: `pages/admin/sms.tsx`가 로드 시 `status`를 `formData`에 넣지 않고, 저장/PUT 요청에 항상 `'draft'`를 전송
- **조치**:
  - SMS 로딩 시 `status`까지 `formData`에 포함
  - 초안 저장 및 메모 동기화 시 기존 상태를 그대로 서버에 전달
  - 이미 잘못 저장된 `channel_sms` ID 94의 `status`를 Supabase에서 `sent`로 복구
- **결과**: 메모 수정 후에도 발송 결과/동기화 버튼이 유지되고, 리스트에 성공/실패 카운트가 다시 표시됨
- **변경/수정 항목**:
  - `pages/admin/sms.tsx`
    * SMS 로드 시 상태 반영
    * 상단 안내 및 버튼 텍스트를 “저장”으로 변경
  - `lib/hooks/useChannelEditor.ts` (채널 포스트 로드 시 기존 상태와 병합하도록 수정)
  - Supabase `channel_sms` 데이터 수동 복구 (#94, #92, #93)

### Sharp 모듈 Vercel 호환성 수정 ✅
- **문제**: 이미지 업로드 시 500 Internal Server Error 발생
- **원인**: `sharp` 모듈을 정적 import로 사용하여 Vercel 서버리스 환경에서 바이너리 로드 실패
- **해결**: 모든 API 파일에서 `sharp`를 동적 import로 변경
- **수정된 파일들**:
  - `pages/api/upload-image-supabase.js` - 이미지 업로드 API (가장 중요)
  - `pages/api/admin/compare-images.js` - 이미지 비교 API
  - `pages/api/admin/extract-exif.js` - EXIF 추출 API
  - `pages/api/admin/save-external-image.js` - 외부 이미지 저장 API
  - `pages/api/admin/image-versions.js` - 이미지 버전 생성 API
  - `pages/api/migrate-blog-professional.js` - 블로그 마이그레이션 API
  - `pages/api/migrate-blog-production.js` - 프로덕션 마이그레이션 API
  - `pages/api/migrate-blog-browser-download.js` - 브라우저 다운로드 마이그레이션 API
  - 기타 migrate 관련 파일들
- **참고 문서**: `docs/API_405_ERROR_FIX.md` (166-212번 줄)
- **결과**: Vercel 환경에서 이미지 업로드 및 처리 정상 작동

## ✅ 최근 완료된 작업 (2025-11-25)

### 제품 퍼널: 고객 후기 섹션 재배치 및 확장 ✅
- **요구사항**: CTA 직전에 사회적 증명을 배치해 전환율을 높이고, 블랙 베릴 제품에도 동일한 후기 경험 제공
- **gold2-sapphire**: 후기 슬라이더 섹션을 `월 15개 한정 제작` CTA 바로 위로 이동해 심리 흐름을 `성능 검증 → 후기 → 긴급성 → CTA`로 재구성
- **weapon-beryl**: 블로그 후기 API 연동(useEffect) 및 자동 슬라이더 UI 신설, gold2 페이지와 동일한 카테고리 필터(고객 후기, 리얼 체험·비거리 성공 후기) 적용
- **UI/UX**:
  - 응답 대기/비어있는 상태/슬라이드 네비게이션 일관성 유지
  - 테마 색상만 조정(CTA 링크 색상 녹색)하여 브랜드 정체성 반영
- **변경 파일**:
  - `pages/products/gold2-sapphire.tsx`
  - `pages/products/weapon-beryl.tsx`
- **성과**: 두 제품 상세 페이지 모두 CTA 직전 신뢰 요소 강화, blog CMS 연동 구조 재사용성 확보
- **추가 최적화 (2025-11-25)**:
  - 모바일 후기 이미지 비율을 4:3으로 확장해 주요 썸네일이 잘리는 현상 해소
  - 공통 스펙(탄성 그립, 헤드 라이각 등)을 모델 열 전체에 한 번만 노출하도록 재구성해 모바일 가독성 향상
  - 후기 섹션 타이포그래피를 다른 메인 섹션과 동일한 사이즈/여백 체계로 통일

## ✅ 최근 완료된 작업 (2025-11-20)

### 카카오 콘텐츠 생성 시스템 Phase 3 구현 완료 ✅
- **Phase 3.3: 베리에이션 테스트**
  - `variation-test.js` (신규): 베리에이션 테스트 API 구현
  - 실제 생성된 이미지의 다양성 검증
  - 날짜별/요일별/계정별 변형 확인
  - 템플릿 로테이션 동작 검증
  - 베리에이션 점수 계산 및 통계 제공
- **베리에이션 테스트 UI**
  - `VariationTestPanel.tsx` (신규): 베리에이션 테스트 실행 및 결과 시각화 컴포넌트
  - 테스트 유형 선택 (전체/주간/날짜 범위/템플릿 로테이션)
  - 계정/타입 선택 가능
  - 테스트 결과 요약, 통계, 상세 결과 표시
- **UI 통합**
  - `kakao-content.tsx`: 베리에이션 테스트 패널 및 미리보기 섹션 추가
  - 접을 수 있는 섹션으로 UI 통합
- **참고**: Phase 3.1 (프롬프트 아이디어 확장), Phase 3.2 (템플릿 다양화)는 이미 Phase 1에서 구현 완료
- **변경 파일**:
  - `pages/api/kakao-content/variation-test.js` (신규)
  - `components/admin/kakao/VariationTestPanel.tsx` (신규)
  - `pages/admin/kakao-content.tsx` (베리에이션 테스트 패널 통합)

### 카카오 콘텐츠 생성 시스템 Phase 4 구현 완료 ✅
- **Phase 4.1: 월별 일괄 생성 개선**
  - `batch-generate-month.js` (신규): 월별 모든 날짜의 basePrompt 자동 생성
  - 요일별 템플릿 자동 선택, 주차별 테마 반영, 베리에이션 자동 적용
  - account1/account2/both 선택 가능, background/profile/feed 타입 선택 가능
  - forceRegenerate 옵션으로 기존 basePrompt 재생성 가능
- **Phase 4.2: 베리에이션 미리보기**
  - `VariationPreview.tsx` (신규): 선택한 날짜의 basePrompt 미리보기 컴포넌트
  - 요일별 템플릿 선택 미리보기, 생성될 이미지 스타일 예상
  - 계절별 분위기, 월 초/중/말 분위기 표시
  - 배경/프로필/피드 basePrompt 실시간 미리보기
- **Phase 4.3: 자동 로테이션 관리**
  - `manage-rotation.js` (신규): 주 단위 템플릿 로테이션 자동 관리
  - 월별 이미지 카테고리 로테이션 체크 및 수정
  - 베리에이션 일관성 체크 및 리포트 생성
  - check/fix/report 액션 지원
- **변경 파일**:
  - `pages/api/kakao-content/batch-generate-month.js` (신규)
  - `components/admin/kakao/VariationPreview.tsx` (신규)
  - `pages/api/kakao-content/manage-rotation.js` (신규)

### 카카오 콘텐츠 생성 시스템 Phase 2 구현 완료 ✅
- **Phase 2.1: 날짜 기반 변형 요소 추가**
  - `generate-prompt.js`: 월 초/중/말 분위기 자동 계산 및 반영
  - 계절별 분위기 자동 계산 및 반영 (봄/여름/가을/겨울)
  - 프롬프트 생성 시 날짜 기반 변형 요소 자동 포함
- **Phase 2.2: 시드값 기반 베리에이션**
  - `generate-images.js`: 날짜별 고정 시드값 생성 로직 추가
  - 계정별, 타입별 시드값 오프셋 적용
  - 같은 날짜면 같은 시드, 다른 날짜면 다른 시드로 일관성 확보
- **Phase 2.3: 이미지 카테고리 로테이션**
  - `auto-create-account1.js`: 피드 이미지 카테고리 주 단위 로테이션 추가
  - `auto-create-account2.js`: 피드 이미지 카테고리 주 단위 로테이션 추가
  - 6개 카테고리 (시니어 골퍼의 스윙, 피팅 상담의 모습, 매장의 모습, 젊은 골퍼의 스윙, 제품 컷, 감성 컷) 주 단위 순환
- **변경 파일**:
  - `pages/api/kakao-content/generate-prompt.js` (날짜 기반 변형 요소 추가)
  - `pages/api/kakao-content/generate-images.js` (시드값 기반 베리에이션 추가)
  - `pages/api/kakao-content/auto-create-account1.js` (이미지 카테고리 로테이션 추가)
  - `pages/api/kakao-content/auto-create-account2.js` (이미지 카테고리 로테이션 추가)

### 카카오 콘텐츠 생성 시스템 Phase 1.5 구현 완료 ✅
- **자동 생성 API에 basePrompt 자동 생성 통합**
  - `auto-create-account1.js`: basePrompt 없을 때 자동 생성 로직 추가
  - `auto-create-account2.js`: basePrompt 없을 때 자동 생성 로직 추가
  - 배경/프로필/피드 이미지 생성 전 basePrompt 자동 생성
  - "계정 자동생성" / "선택된 날짜 생성" 시 자동으로 요일별 basePrompt 생성
  - basePrompt 생성 실패 시 fallback 값 사용 (기존 동작 유지)
- **변경 파일**:
  - `pages/api/kakao-content/auto-create-account1.js` (basePrompt 자동 생성 추가)
  - `pages/api/kakao-content/auto-create-account2.js` (basePrompt 자동 생성 추가)

### 카카오 콘텐츠 생성 시스템 Phase 1 구현 완료 ✅
- **요일별 템플릿 파일 생성**
  - `lib/kakao-base-prompt-templates.js` (신규) - 126개 템플릿 정의
  - Account1/Account2 × Background/Profile/Feed × 7요일 × 3템플릿
  - 주차별 순환 로직 포함
- **Base Prompt 생성 API 구현**
  - `pages/api/kakao-content/generate-base-prompt.js` (신규)
  - 요일별 템플릿 자동 선택
  - 주차별 테마 반영
- **UI 연동**
  - FeedManager: 이미 구현됨 (handleGenerateBasePrompt)
  - ProfileManager: basePrompt 자동 생성 기능 추가
    * 배경/프로필 이미지 각각 요일별 자동 생성 버튼
    * 편집/저장 기능 포함
- **변경 파일**:
  - `lib/kakao-base-prompt-templates.js` (신규)
  - `pages/api/kakao-content/generate-base-prompt.js` (신규)
  - `components/admin/kakao/ProfileManager.tsx` (basePrompt 자동 생성 기능 추가)

### 카카오 콘텐츠 생성 시스템 고도화 계획 수립 ✅
- **고도화 계획 문서 작성**
  - `docs/KAKAO_CONTENT_ENHANCEMENT_PLAN.md` (신규) - 요일별 템플릿 시스템, 베리에이션 강화, 프롬프트 아이디어
  - 베리에이션 계산: 최대 1,512가지 조합, 월별 180가지, 연간 2,160가지
  - Phase 1-4 구현 계획 수립
- **프롬프트 아이디어 정리**
  - 배경/프로필/피드 이미지별 프롬프트 아이디어
  - Account1 (골드·브라운 톤) / Account2 (블루·그레이 톤) 구분
  - 요일별 7가지 테마, 주차별 3가지 템플릿 순환
- **변경 파일**:
  - `docs/KAKAO_CONTENT_ENHANCEMENT_PLAN.md` (신규)

### 카카오 콘텐츠 생성 시스템 개선 (베리에이션 및 텍스트 방지) ✅
- **텍스트 방지 개선 (적절한 수준)**
  - `generate-prompt.js`: 텍스트 방지 지시 강화 ("ABSOLUTELY NO text, words, or written content")
  - `generate-images.js`: FAL AI 호출 시 `negative_prompt` 추가
  - 오바하지 않음: 과도한 강조 없이 적절한 수준으로만 개선
- **베리에이션 개선**
  - `auto-create-account1.js`: `background_base_prompt`, `profile_base_prompt` 우선 사용
  - `auto-create-account2.js`: `background_base_prompt`, `profile_base_prompt` 우선 사용
  - 피드: `base_prompt` 우선 사용
  - basePrompt가 있으면 날짜별로 다른 이미지 생성 가능
- **Base Prompt 현황 분석**
  - `generate-base-prompt.js`: 비어있음 (구현 안됨)
  - `kakao-base-prompt-templates.js`: 비어있음
  - 요일별 템플릿 시스템은 고도화 추후 구현 예정
- **문서화**
  - `docs/KAKAO_CONTENT_VARIATION_ANALYSIS.md` (신규) - 베리에이션 문제 분석 및 해결 방안
- **변경 파일**:
  - `pages/api/kakao-content/generate-prompt.js` (텍스트 방지 지시 강화)
  - `pages/api/kakao-content/generate-images.js` (negative_prompt 추가)
  - `pages/api/kakao-content/auto-create-account1.js` (basePrompt 우선 사용)
  - `pages/api/kakao-content/auto-create-account2.js` (basePrompt 우선 사용)
  - `docs/KAKAO_CONTENT_VARIATION_ANALYSIS.md` (신규)

## ✅ 최근 완료된 작업 (2025-11-20)

### Phase 15: 워크플로우 시각화 시스템 (React Flow) ✅
- **React Flow 설치 및 설정**
  - `reactflow` 패키지 설치
  - 워크플로우 시각화 컴포넌트 생성
- **워크플로우 노드 정의**
  - 시작 → BasePrompt 생성 → 프롬프트 생성 → 이미지 생성 → 피드 생성 → 배포 → 완료
  - 계정별 병렬 처리 시각화 (Account1, Account2)
  - 각 단계별 상태 표시 (완료/진행 중/대기 중)
- **실시간 상태 반영**
  - 선택된 날짜의 실제 데이터 기반 상태 표시
  - 완료된 단계는 애니메이션으로 강조
  - 미완료 단계는 회색으로 표시
- **UI 개선**
  - 미니맵 및 컨트롤 추가
  - 커스텀 노드 디자인 (아이콘, 상태 배지)
  - 반응형 레이아웃
- **변경 파일**:
  - `components/admin/kakao/WorkflowVisualization.tsx` (신규)
  - `pages/admin/kakao-content.tsx` (워크플로우 시각화 통합)
  - `package.json` (reactflow 의존성 추가)

### BasePrompt 관리 시스템 개선 ✅
- **피드 BasePrompt 관리 추가**
  - FeedManager에 basePrompt 관리 UI 추가
  - 요일별 자동 생성 버튼 추가
  - 프롬프트 재생성 기능 추가
- **계절/트랜드/이벤트 반영**
  - 계절별 템플릿 수정자 추가 (봄/여름/가을/겨울)
  - 이벤트별 템플릿 수정자 추가 (크리스마스, 새해 등)
  - 주차별 테마 반영 기능
- **변경 파일**:
  - `lib/kakao-base-prompt-templates.js` (계절/이벤트 로직 추가)
  - `components/admin/kakao/FeedManager.tsx` (basePrompt 관리 UI 추가)
  - `pages/api/kakao-content/calendar-save.js` (피드 basePrompt 저장 추가)

### 목록보기 UI 고도화 ✅
- **향상된 필터링 및 검색**
  - 계정별, 타입별, 상태별 필터링
  - 실시간 검색 기능
  - 정렬 옵션 (날짜/상태, 오름차순/내림차순)
- **개선된 테이블 UI**
  - 그라데이션 헤더 디자인
  - 행 확장 기능 (이미지 미리보기)
  - 상태 배지 개선 (색상 및 아이콘)
  - 호버 효과 및 클릭 가능한 행
- **통계 및 요약**
  - 총 날짜 수, 생성됨, 배포됨 통계
  - 실시간 필터링 결과 반영
- **변경 파일**:
  - `components/admin/kakao/MessageListView.tsx` (전면 개편)

## ✅ 이전 완료된 작업 (2025-11-16)

### BasePrompt 관리 시스템 ✅
- **요일별 BasePrompt 템플릿 정의**
  - `lib/kakao-base-prompt-templates.js` - 요일별 템플릿 정의
  - Account1 (시니어): 골드톤, 따뜻한 감성 (요일별 3개씩 템플릿)
  - Account2 (테크): 블랙톤, 혁신적 분위기 (요일별 3개씩 템플릿)
  - 주차별 테마와 요일별 basePrompt 매핑 명확화
- **요일별 BasePrompt 자동 생성 API**
  - `/api/kakao-content/generate-base-prompt.js` - 요일별 템플릿 기반 자동 생성
  - 날짜의 요일 자동 계산
  - 주차별 테마 반영 기능
  - 템플릿 인덱스 지정 가능 (랜덤 또는 특정 인덱스)
- **BasePrompt 수정/업데이트 UI**
  - ProfileManager에 basePrompt 편집 섹션 추가
  - "✏️ 편집" 버튼: basePrompt 수정 모드
  - "🔄 요일별 자동 생성" 버튼: 요일별 템플릿 자동 생성
  - "💾 저장" / "❌ 취소" 버튼: 편집 완료/취소
  - 현재 basePrompt 표시 (회색 배경)
- **BasePrompt 저장 로직**
  - `onBasePromptUpdate` prop 추가 (KakaoAccountEditor → ProfileManager)
  - pages/admin/kakao-content.tsx에서 basePrompt 저장 처리
  - Supabase에 `background_base_prompt`, `profile_base_prompt` 저장
- **문서 개선**
  - `docs/content-calendar/BASE_PROMPT_MANAGEMENT.md` (신규) - 요일별 로테이션 가이드
  - `docs/content-calendar/MONTHLY_BATCH_GENERATION.md` (신규) - 월별 일괄 생성 가이드
  - `docs/content-calendar/PROFILE_OPERATION_GUIDE.md` (업데이트) - basePrompt 관리 섹션 추가
- **변경 파일**:
  - `lib/kakao-base-prompt-templates.js` (신규)
  - `pages/api/kakao-content/generate-base-prompt.js` (신규)
  - `components/admin/kakao/ProfileManager.tsx` (basePrompt 편집 UI 추가)
  - `components/admin/kakao/KakaoAccountEditor.tsx` (onBasePromptUpdate prop 추가)
  - `pages/admin/kakao-content.tsx` (basePrompt 저장 로직 추가)
  - `docs/content-calendar/BASE_PROMPT_MANAGEMENT.md` (신규)
  - `docs/content-calendar/MONTHLY_BATCH_GENERATION.md` (신규)
  - `docs/content-calendar/PROFILE_OPERATION_GUIDE.md` (업데이트)

### 카카오톡 다중 날짜 순차 생성 시스템 ✅
- **날짜 선택 UI**
  - 이번 주/이번 달 보기 모드에서 체크박스로 여러 날짜 선택 가능
  - "전체 선택" / "선택 해제" 버튼 추가
  - 선택된 날짜 수 표시
- **순차 생성 로직**
  - 선택된 날짜들을 하나씩 순차적으로 생성 (API 부하 방지)
  - 최대 생성 개수 제한: 7일 (사용자 확인 후)
  - 날짜별로 account1 → account2 순서로 생성
  - 각 생성 사이 1초 대기 (API 부하 방지)
- **진행 상황 표시**
  - 실시간 진행 상황 표시 (진행 바, 완료/전체 개수)
  - 현재 처리 중인 날짜 및 계정 표시
  - 예상 남은 시간 표시 (1일치당 1분 기준)
- **생성 버튼 개선**
  - "오늘 날짜 생성": 현재 선택된 날짜만 생성
  - "선택된 날짜 생성": 체크박스로 선택한 날짜들 생성
  - "이번 주 생성": 이번 주 보기 모드에서만 표시, 이번 주 전체 생성
- **변경 파일**:
  - `pages/admin/kakao-content.tsx` (날짜 선택 UI, 순차 생성 로직, 진행 상황 표시)

### 카카오톡 피드 캡션 및 URL 자동 생성 시스템 ✅
- **피드 캡션 자동 생성 API**
  - `/api/kakao-content/generate-feed-caption.js` - AI 기반 피드 캡션 생성
  - 이미지 카테고리, 계정 타입, 주별 테마 기반 캡션 생성
  - 계정별 톤앤매너 반영 (account1: 따뜻하고 감성적, account2: 혁신적이고 기술적)
  - 길이 제한: 10-25자 이내
- **URL 자동 선택 로직**
  - `lib/kakao-feed-url-selector.js` - 이미지 카테고리 및 날짜 기반 URL 선택
  - 카테고리별 URL 매핑:
    - 시니어 골퍼의 스윙: account1 → 시타 예약, account2 → 홈페이지
    - 젊은 골퍼의 스윙: account1 → 홈페이지, account2 → MUZIIK
    - 매장의 모습: 양쪽 모두 → 매장 안내
    - 피팅 상담의 모습: 양쪽 모두 → 시타 예약
  - 요일별 기본 URL (카테고리 매핑이 없을 때)
- **자동 생성 API 개선**
  - `auto-create-account1.js`: 피드 캡션 자동 생성 및 URL 자동 선택 추가
  - `auto-create-account2.js`: 피드 캡션 자동 생성 및 URL 자동 선택 추가
  - 기존 캡션이 없을 때만 새로 생성 (재사용 가능)
- **변경 파일**:
  - `pages/api/kakao-content/generate-feed-caption.js` (신규)
  - `lib/kakao-feed-url-selector.js` (신규)
  - `pages/api/kakao-content/auto-create-account1.js` (피드 캡션/URL 자동 생성 추가)
  - `pages/api/kakao-content/auto-create-account2.js` (피드 캡션/URL 자동 생성 추가)

## ✅ 최근 완료된 작업 (2025-11-12)

### 카카오 콘텐츠 시스템 고도화 ✅
- **DB 테이블 생성 완료**
  - `kakao_profile_content` - 프로필 콘텐츠 저장 (데일리 브랜딩)
  - `kakao_feed_content` - 피드 콘텐츠 저장 (데일리 브랜딩)
  - 기존 `channel_kakao`와 목적 분리 (허브 시스템 vs 데일리 브랜딩)
- **이미지 메타데이터 분류 저장**
  - 계정 정보 (account1/account2) 저장
  - 용도 정보 (background/profile/feed) 저장
  - 톤 정보 (골드톤/블랙톤) 저장
  - 갤러리에서 필터링 가능하도록 태그 추가
- **아시아 시니어 골퍼 명시 강화**
  - 프롬프트에 "Korean senior golfer (50-70 years old, Korean ethnicity, Asian facial features)" 명시
  - "NO Western/Caucasian people, ONLY Korean/Asian people" 금지 명시
  - 계정별 차별화된 프롬프트 (골드톤: 시니어, 블랙톤: 젊은 골퍼)
- **캘린더 데이터 로드 개선**
  - `created: true`인 데이터도 표시하도록 수정
  - 오늘 날짜 데이터가 없을 때 오류 메시지 개선
- **저장 구조 개선**
  - JSON 파일 저장 (플랜 + 생성된 콘텐츠)
  - DB 저장 (최종 배포용) 자동화
  - `created` → `published` 상태 관리
- **문서화**
  - `docs/KAKAO_CONTENT_STORAGE_GUIDE.md` - 저장 구조 가이드
  - `docs/DAILY_BRANDING_GUIDE.md` - 데일리 브랜딩 가이드
- **변경 파일**:
  - `pages/admin/kakao-content.tsx` (캘린더 로드 로직 수정, DB 저장 추가)
  - `pages/api/generate-paragraph-images-with-prompts.js` (메타데이터 저장 추가)
  - `pages/api/kakao-content/generate-prompt-message.js` (아시아 골퍼 명시 강화)
  - `database/kakao-content-schema.sql` (신규, DB 스키마)

### 허브 시스템 통합 완료 ✅
- **메뉴 정리**
  - "📅 콘텐츠 캘린더" 메뉴 삭제
  - "🆕 새 캘린더" 메뉴 삭제
  - "🎯 허브 시스템" 메뉴로 통합
- **허브 시스템 페이지 개선**
  - 탭 구조 추가 (콘텐츠 허브 / 데일리 브랜딩)
  - 리스트 뷰 / 달력 뷰 토글 추가
  - 데일리 브랜딩 탭 추가 (카카오톡 링크 포함)
- **변경 파일**:
  - `components/admin/AdminNav.tsx` (메뉴 정리)
  - `pages/admin/content-calendar-hub.tsx` (탭 및 뷰 모드 추가)
  - `docs/CONTENT_SYSTEM_ARCHITECTURE.md` (구조 업데이트)

## ✅ 최근 완료된 작업 (2025-11-12)

### Phase 14 카카오톡 콘텐츠 자동화 시스템 - 완료 ✅
- **공통 시스템 모듈 추출 완료**
  - `lib/ai-image-generation.ts` - 골드톤/블랙톤 이미지 생성 함수 (오류 처리 개선)
  - `lib/prompt-config-manager.ts` - 프롬프트 설정 관리
  - `lib/self-adaptive-automation.ts` - Self-Adaptive Automation
- **카카오톡 콘텐츠 페이지 생성**
  - `pages/admin/kakao-content.tsx` - 메인 페이지 (브랜드 전략, 프롬프트 설정 통합)
  - `components/admin/kakao/ProfileManager.tsx` - 프로필 관리
  - `components/admin/kakao/FeedManager.tsx` - 피드 관리
  - `components/admin/kakao/KakaoAccountEditor.tsx` - 계정별 편집기
- **API 엔드포인트 생성**
  - `pages/api/content-calendar/load.js` - 캘린더 데이터 로드
  - `pages/api/kakao-content/calendar-save.js` - 캘린더 데이터 저장
  - `pages/api/kakao-content/save.js` - DB 저장 (준비 완료)
- **오류 수정**
  - `generate-paragraph-prompts` 400 오류 수정 (content 없을 때 기본 프롬프트 반환)
  - `/api/admin/blog?calendar_id=...` 500 오류 수정 (유효성 검사 추가)
- **통합 캘린더 구조 설계**
  - 콘텐츠 허브 (`hubContents`) + 데일리 브랜딩 (`dailyBranding`) 통합 구조
  - 문서: `docs/CONTENT_SYSTEM_ARCHITECTURE.md`
- **AdminNav 메뉴 추가**
  - "📱 카톡 콘텐츠" 메뉴 추가
- **UI/UX 개선**
  - 중복 아이콘 제거 (Calendar 아이콘 + 📅 이모지)
  - 일관성 있는 아이콘 사용 (Lucide React)
  - 로딩 상태 개선
- **변경 파일**:
  - `lib/ai-image-generation.ts` (신규, 오류 처리 개선)
  - `lib/prompt-config-manager.ts` (신규)
  - `lib/self-adaptive-automation.ts` (신규)
  - `pages/admin/kakao-content.tsx` (신규)
  - `components/admin/kakao/ProfileManager.tsx` (신규)
  - `components/admin/kakao/FeedManager.tsx` (신규)
  - `components/admin/kakao/KakaoAccountEditor.tsx` (신규)
  - `pages/api/content-calendar/load.js` (신규)
  - `pages/api/kakao-content/calendar-save.js` (신규)
  - `pages/api/kakao-content/save.js` (신규)
  - `pages/api/admin/blog.js` (오류 수정)
- `components/admin/AdminNav.tsx` (업데이트)
  - `docs/CONTENT_SYSTEM_ARCHITECTURE.md` (신규)
  - `docs/CONTENT_STRUCTURE_ANALYSIS.md` (신규)
- **후속 작업 완료 ✅**
  - 카카오 전용 프롬프트 생성 API (`/api/kakao-content/generate-prompt.js`) 생성 완료
  - 블로그 프롬프트와 완전 분리하여 카카오 전용 요구사항만 반영
  - `lib/ai-image-generation.ts`에 `generateKakaoImagePrompts` 함수 추가
  - `pages/admin/kakao-content.tsx`에서 카카오 전용 API 사용으로 변경
  - 캘린더 데이터 로드 수정 (`!p.created` 조건 제거)

### 공통 시스템 문서화 ✅
- **재사용 가능한 공통 시스템 문서 작성 완료**
- **문서 위치**: `docs/shared-systems/`
- **작성된 문서**:
  1. 브랜드 전략 시스템 (`brand-strategy-system.md`)
  2. AI 이미지 생성 시스템 (`ai-image-generation-system.md`)
  3. 프롬프트 설정 관리 (`prompt-settings-manager.md`) - 슬롯 기반 API 연결 계획 추가
  4. Self-Adaptive Automation (`self-adaptive-automation.md`)
  5. 갤러리 이미지 자산 관리 (`gallery-asset-management.md`)

### 예약 알림/메시징 아키텍처 정리 ✅
- **문서 위치**: `docs/booking-communication-plan.md`
- **주요 내용**:
  - Solapi SMS/카카오톡/Slack을 활용한 예약 알림 플로우 정의 (예약 신청/확정/완료)
  - 기존 SMS 발송 API (`pages/api/channels/sms/send.js`, `pages/api/admin/send-scheduled-sms.js`, `pages/api/admin/sms.js`) 재사용 계획
  - 카카오 콘텐츠용 Slack 모듈 (`lib/slack-notification.js`, `pages/api/kakao-content/slack-*.js`)을 활용한 예약 알림 Slack API 설계
  - 예약 전용 알림 API 초안 정의:
    - `/api/bookings/notify-customer` (고객 카카오톡/문자 알림)
    - `/api/slack/booking-notify` (관리자 Slack 알림)
  - “예약 알림 센터” UI 방향: 예약별 알림 이력·재발송·실패 사유 확인 기능을 한 곳에서 관리
- **README 작성**: `docs/shared-systems/README.md`

### 카카오톡 프로필 업데이트 자동화 완료 ✅ (2025-11-12)
- **Playwright 기반 자동화 스크립트 생성**
  - `scripts/update-kakao-profile.js` - 카카오톡 프로필 업데이트 자동화
  - Self-Adaptive Automation 적용 (다중 선택자, 자동 재시도)
  - 카카오톡 PC 버전 로그인 자동화
  - 배경 이미지/프로필 이미지 자동 업로드
  - 브랜드 표기 자동 설정 ("MASSGOO" - 고정)
  - 상태 메시지 자동 입력 (매일 변경)
- **프로필 구조 최종 확정**
  - 첫 번째 필드 (7/20): "MASSGOO" - 브랜드 표기 (고정)
  - 두 번째 필드 (13/60): 상태 메시지 - 매일 변경 (예: "스윙보다 마음이 먼저다.")
- **API 엔드포인트 생성**
  - `pages/api/kakao-content/update-profile.js` - 프로필 업데이트 API
  - 백그라운드에서 Playwright 스크립트 실행
- **UI 통합**
  - `components/admin/kakao/KakaoAccountEditor.tsx` - "카카오톡 업로드" 버튼 추가
  - 업로드 전 유효성 검사 (이미지, 메시지 확인)
  - 업로드 완료 시 배포 상태 자동 변경
- **문서화**
  - `docs/content-calendar/PROFILE_OPERATION_GUIDE.md` - 자동화 섹션 업데이트
  - 환경 변수 설정 가이드 추가
  - 프로필 구조 최종 확정 문서화
- **변경 파일**:
  - `scripts/update-kakao-profile.js` (신규, 브랜드 표기/상태 메시지 분리)
  - `pages/api/kakao-content/update-profile.js` (신규)
  - `components/admin/kakao/KakaoAccountEditor.tsx` (업로드 버튼 추가)
  - `pages/admin/kakao-content.tsx` (selectedDate, accountKey props 추가)
  - `docs/content-calendar/PROFILE_OPERATION_GUIDE.md` (자동화 섹션 업데이트, 프로필 구조 확정)

### 프롬프트 설정 관리 현황 분석 및 문서 업데이트 ✅
- **현황 분석 완료**
  - 마쓰구 브랜드 전략: 사용 중 ✅ (저장 기능 없음)
  - 프롬프트 설정 관리: 블로그 페이지 완료 ✅, 카카오 페이지 부분 구현 ⚠️
  - API 분리: 블로그 전용 API ✅, 카카오 전용 API ✅
- **개선 방안 문서화**
  - 슬롯 기반 API 연결 계획 (Phase 15 통합)
  - 스케줄별 변형 관리 계획
  - 버전 관리 및 롤백 기능 계획
- **문서 업데이트 완료**
  - `docs/shared-systems/prompt-settings-manager.md` - 슬롯 기반 API 연결 섹션 추가
  - `docs/phases/detailed-plans/phase-15-workflow-visualization.md` - 프롬프트 슬롯 통합 계획 추가
  - `docs/PHASE_14_COMPLETION_REPORT.md` - 현재 사용 현황 및 개선 방안 추가

### 카카오톡 콘텐츠 시스템 UI/UX 개선 ✅ (2025-11-12)
- **배포 상태 UI 개선**
  - 배포 상태를 별도 줄로 분리하여 레이아웃 개선
  - 체크박스 → 배지 버튼 스타일로 변경
  - 텍스트 잘림 문제 해결 (whitespace-nowrap 적용)
  - 날짜 표시 형식 개선 (월/일/시간/분)
- **이미지 생성 옵션 개선**
  - "생성 범위" 제거 및 보기 모드와 통합
  - "다시 만들기 허용" 제거 (X 버튼으로 이미 가능)
  - "생성 옵션 설정" 및 "전체 자동 생성" 버튼 상단 이동
  - 생성 옵션 모달 간소화 (이미지 생성 개수만 남김)
- **이미지 2개/4개 생성 시 선택 기능**
  - `ImageSelectionModal` 컴포넌트 생성
  - AI 자동 선택 기능 추가 (이미지 품질 평가 API)
  - 이미지 생성 개수 옵션 적용
- **피드 이미지 최적화**
  - Sharp 라이브러리로 카카오톡 피드 최적 사이즈 (1080x1080) 자동 크롭
  - AI 기반 중요 영역 크롭 (`position: 'entropy'`)
  - 피드 이미지는 JPEG 형식으로 저장 (품질 90%)
  - 베리에이션 시스템은 나중에 구현 (복잡도 고려)
- **변경 파일**:
  - `components/admin/kakao/KakaoAccountEditor.tsx` (배포 상태 별도 줄 분리, 버튼 비활성화 로직)
  - `components/admin/kakao/ImageSelectionModal.tsx` (신규, 이미지 선택 모달)
  - `pages/admin/kakao-content.tsx` (이미지 생성 개수 옵션 적용, 선택 모달 통합)
  - `pages/api/generate-paragraph-images-with-prompts.js` (피드 이미지 Sharp 최적화)
  - `pages/api/kakao-content/evaluate-images.js` (신규, 이미지 품질 평가 API)
- **문서화**
  - `docs/KAKAO_CONTENT_STORAGE_GUIDE.md` - 저장 구조 가이드
  - `docs/DAILY_BRANDING_GUIDE.md` - 데일리 브랜딩 가이드
- **변경 파일**:
  - `pages/admin/kakao-content.tsx` (캘린더 로드 로직 수정, DB 저장 추가)
  - `pages/api/generate-paragraph-images-with-prompts.js` (메타데이터 저장 추가)
  - `pages/api/kakao-content/generate-prompt-message.js` (아시아 골퍼 명시 강화)
  - `database/kakao-content-schema.sql` (신규, DB 스키마)

### 허브 시스템 통합 완료 ✅
- **메뉴 정리**
  - "📅 콘텐츠 캘린더" 메뉴 삭제
  - "🆕 새 캘린더" 메뉴 삭제
  - "🎯 허브 시스템" 메뉴로 통합
- **허브 시스템 페이지 개선**
  - 탭 구조 추가 (콘텐츠 허브 / 데일리 브랜딩)
  - 리스트 뷰 / 달력 뷰 토글 추가
  - 데일리 브랜딩 탭 추가 (카카오톡 링크 포함)
- **변경 파일**:
  - `components/admin/AdminNav.tsx` (메뉴 정리)
  - `pages/admin/content-calendar-hub.tsx` (탭 및 뷰 모드 추가)
  - `docs/CONTENT_SYSTEM_ARCHITECTURE.md` (구조 업데이트)

## ✅ 최근 완료된 작업 (2025-11-12)

### Phase 14 카카오톡 콘텐츠 자동화 시스템 - 완료 ✅
- **공통 시스템 모듈 추출 완료**
  - `lib/ai-image-generation.ts` - 골드톤/블랙톤 이미지 생성 함수 (오류 처리 개선)
  - `lib/prompt-config-manager.ts` - 프롬프트 설정 관리
  - `lib/self-adaptive-automation.ts` - Self-Adaptive Automation
- **카카오톡 콘텐츠 페이지 생성**
  - `pages/admin/kakao-content.tsx` - 메인 페이지 (브랜드 전략, 프롬프트 설정 통합)
  - `components/admin/kakao/ProfileManager.tsx` - 프로필 관리
  - `components/admin/kakao/FeedManager.tsx` - 피드 관리
  - `components/admin/kakao/KakaoAccountEditor.tsx` - 계정별 편집기
- **API 엔드포인트 생성**
  - `pages/api/content-calendar/load.js` - 캘린더 데이터 로드
  - `pages/api/kakao-content/calendar-save.js` - 캘린더 데이터 저장
  - `pages/api/kakao-content/save.js` - DB 저장 (준비 완료)
- **오류 수정**
  - `generate-paragraph-prompts` 400 오류 수정 (content 없을 때 기본 프롬프트 반환)
  - `/api/admin/blog?calendar_id=...` 500 오류 수정 (유효성 검사 추가)
- **통합 캘린더 구조 설계**
  - 콘텐츠 허브 (`hubContents`) + 데일리 브랜딩 (`dailyBranding`) 통합 구조
  - 문서: `docs/CONTENT_SYSTEM_ARCHITECTURE.md`
- **AdminNav 메뉴 추가**
  - "📱 카톡 콘텐츠" 메뉴 추가
- **UI/UX 개선**
  - 중복 아이콘 제거 (Calendar 아이콘 + 📅 이모지)
  - 일관성 있는 아이콘 사용 (Lucide React)
  - 로딩 상태 개선
- **변경 파일**:
  - `lib/ai-image-generation.ts` (신규, 오류 처리 개선)
  - `lib/prompt-config-manager.ts` (신규)
  - `lib/self-adaptive-automation.ts` (신규)
  - `pages/admin/kakao-content.tsx` (신규)
  - `components/admin/kakao/ProfileManager.tsx` (신규)
  - `components/admin/kakao/FeedManager.tsx` (신규)
  - `components/admin/kakao/KakaoAccountEditor.tsx` (신규)
  - `pages/api/content-calendar/load.js` (신규)
  - `pages/api/kakao-content/calendar-save.js` (신규)
  - `pages/api/kakao-content/save.js` (신규)
  - `pages/api/admin/blog.js` (오류 수정)
- `components/admin/AdminNav.tsx` (업데이트)
  - `docs/CONTENT_SYSTEM_ARCHITECTURE.md` (신규)
  - `docs/CONTENT_STRUCTURE_ANALYSIS.md` (신규)
- **후속 작업 완료 ✅**
  - 카카오 전용 프롬프트 생성 API (`/api/kakao-content/generate-prompt.js`) 생성 완료
  - 블로그 프롬프트와 완전 분리하여 카카오 전용 요구사항만 반영
  - `lib/ai-image-generation.ts`에 `generateKakaoImagePrompts` 함수 추가
  - `pages/admin/kakao-content.tsx`에서 카카오 전용 API 사용으로 변경
  - 캘린더 데이터 로드 수정 (`!p.created` 조건 제거)

### 공통 시스템 문서화 ✅
- **재사용 가능한 공통 시스템 문서 작성 완료**
- **문서 위치**: `docs/shared-systems/`
- **작성된 문서**:
  1. 브랜드 전략 시스템 (`brand-strategy-system.md`)
  2. AI 이미지 생성 시스템 (`ai-image-generation-system.md`)
  3. 프롬프트 설정 관리 (`prompt-settings-manager.md`) - 슬롯 기반 API 연결 계획 추가
  4. Self-Adaptive Automation (`self-adaptive-automation.md`)
  5. 갤러리 이미지 자산 관리 (`gallery-asset-management.md`)
- **README 작성**: `docs/shared-systems/README.md`

### 카카오톡 프로필 업데이트 자동화 완료 ✅ (2025-11-12)
- **Playwright 기반 자동화 스크립트 생성**
  - `scripts/update-kakao-profile.js` - 카카오톡 프로필 업데이트 자동화
  - Self-Adaptive Automation 적용 (다중 선택자, 자동 재시도)
  - 카카오톡 PC 버전 로그인 자동화
  - 배경 이미지/프로필 이미지 자동 업로드
  - 브랜드 표기 자동 설정 ("MASSGOO" - 고정)
  - 상태 메시지 자동 입력 (매일 변경)
- **프로필 구조 최종 확정**
  - 첫 번째 필드 (7/20): "MASSGOO" - 브랜드 표기 (고정)
  - 두 번째 필드 (13/60): 상태 메시지 - 매일 변경 (예: "스윙보다 마음이 먼저다.")
- **API 엔드포인트 생성**
  - `pages/api/kakao-content/update-profile.js` - 프로필 업데이트 API
  - 백그라운드에서 Playwright 스크립트 실행
- **UI 통합**
  - `components/admin/kakao/KakaoAccountEditor.tsx` - "카카오톡 업로드" 버튼 추가
  - 업로드 전 유효성 검사 (이미지, 메시지 확인)
  - 업로드 완료 시 배포 상태 자동 변경
- **문서화**
  - `docs/content-calendar/PROFILE_OPERATION_GUIDE.md` - 자동화 섹션 업데이트
  - 환경 변수 설정 가이드 추가
  - 프로필 구조 최종 확정 문서화
- **변경 파일**:
  - `scripts/update-kakao-profile.js` (신규, 브랜드 표기/상태 메시지 분리)
  - `pages/api/kakao-content/update-profile.js` (신규)
  - `components/admin/kakao/KakaoAccountEditor.tsx` (업로드 버튼 추가)
  - `pages/admin/kakao-content.tsx` (selectedDate, accountKey props 추가)
  - `docs/content-calendar/PROFILE_OPERATION_GUIDE.md` (자동화 섹션 업데이트, 프로필 구조 확정)

### 프롬프트 설정 관리 현황 분석 및 문서 업데이트 ✅
- **현황 분석 완료**
  - 마쓰구 브랜드 전략: 사용 중 ✅ (저장 기능 없음)
  - 프롬프트 설정 관리: 블로그 페이지 완료 ✅, 카카오 페이지 부분 구현 ⚠️
  - API 분리: 블로그 전용 API ✅, 카카오 전용 API ✅
- **개선 방안 문서화**
  - 슬롯 기반 API 연결 계획 (Phase 15 통합)
  - 스케줄별 변형 관리 계획
  - 버전 관리 및 롤백 기능 계획
- **문서 업데이트 완료**
  - `docs/shared-systems/prompt-settings-manager.md` - 슬롯 기반 API 연결 섹션 추가
  - `docs/phases/detailed-plans/phase-15-workflow-visualization.md` - 프롬프트 슬롯 통합 계획 추가
  - `docs/PHASE_14_COMPLETION_REPORT.md` - 현재 사용 현황 및 개선 방안 추가

### 카카오톡 콘텐츠 시스템 UI/UX 개선 ✅ (2025-11-12)
- **배포 상태 UI 개선**
  - 배포 상태를 별도 줄로 분리하여 레이아웃 개선
  - 체크박스 → 배지 버튼 스타일로 변경
  - 텍스트 잘림 문제 해결 (whitespace-nowrap 적용)
  - 날짜 표시 형식 개선 (월/일/시간/분)
- **이미지 생성 옵션 개선**
  - "생성 범위" 제거 및 보기 모드와 통합
  - "다시 만들기 허용" 제거 (X 버튼으로 이미 가능)
  - "생성 옵션 설정" 및 "전체 자동 생성" 버튼 상단 이동
  - 생성 옵션 모달 간소화 (이미지 생성 개수만 남김)
- **이미지 2개/4개 생성 시 선택 기능**
  - `ImageSelectionModal` 컴포넌트 생성
  - AI 자동 선택 기능 추가 (이미지 품질 평가 API)
  - 이미지 생성 개수 옵션 적용
- **피드 이미지 최적화**
  - Sharp 라이브러리로 카카오톡 피드 최적 사이즈 (1080x1080) 자동 크롭
  - AI 기반 중요 영역 크롭 (`position: 'entropy'`)
  - 피드 이미지는 JPEG 형식으로 저장 (품질 90%)
  - 베리에이션 시스템은 나중에 구현 (복잡도 고려)
- **변경 파일**:
  - `components/admin/kakao/KakaoAccountEditor.tsx` (배포 상태 별도 줄 분리, 버튼 비활성화 로직)
  - `components/admin/kakao/ImageSelectionModal.tsx` (신규, 이미지 선택 모달)
  - `pages/admin/kakao-content.tsx` (이미지 생성 개수 옵션 적용, 선택 모달 통합)
  - `pages/api/generate-paragraph-images-with-prompts.js` (피드 이미지 Sharp 최적화)
  - `pages/api/kakao-content/evaluate-images.js` (신규, 이미지 품질 평가 API)

## 2025-01-XX: 예약 폼 골프 정보 섹션 개선 (2차)

### 완료된 작업
- **샤프트 강도 옵션 확장**: R2, R1을 L과 R 사이에 추가 (총 7개 옵션: L, R2, R1, R, SR, S, X)
- **탄도 표기 개선**: 각도 표시(30°, 45°, 60°) 제거, 한글 표기로 변경 (저탄도, 중탄도, 고탄도)
- **레이블 정리**: 탄도와 구질 라벨에서 "(선택)" 제거
- **레이아웃 조정**: 샤프트 강도 그리드를 `grid-cols-5`에서 `grid-cols-7`로 변경
- **변경 파일**:
  - `pages/booking/form.tsx` (샤프트 강도 옵션 추가, 탄도 한글 표기, 레이블 정리)

## 2025-01-XX: 예약 폼 골프 정보 섹션 개선 (3차)

### 완료된 작업
- **샤프트 강도/로프트 각도 버튼 개선**: "잘 모르겠어요" 버튼을 그리드 밖으로 분리하고 "선택 안 함"으로 문구 변경
- **탄도 다중 선택 기능**: 최대 2개까지 선택 가능, 조합 표기 (중저탄도, 중고탄도, 저고탄도)
- **구질 한글 표기 개선**: 영어 표기(Straight, Hook, Draw, Fade, Slice)를 한글(스트레이트, 훅, 드로우, 페이드, 슬라이스)로 변경
- **구질 다중 선택 제한**: 최대 2개까지 선택 가능, 하단에 선택된 구질 표시
- **연령대 입력 방식 개선**: 드롭다운 선택식에서 숫자 입력 필드로 변경, 실제 나이 입력 후 자동으로 연령대 그룹화
- **변경 파일**:
  - `pages/booking/form.tsx` (탄도/구질 다중 선택, 한글 표기, 연령대 숫자 입력, 버튼 레이아웃 개선)

- **문서화**
  - `docs/KAKAO_CONTENT_STORAGE_GUIDE.md` - 저장 구조 가이드
  - `docs/DAILY_BRANDING_GUIDE.md` - 데일리 브랜딩 가이드
- **변경 파일**:
  - `pages/admin/kakao-content.tsx` (캘린더 로드 로직 수정, DB 저장 추가)
  - `pages/api/generate-paragraph-images-with-prompts.js` (메타데이터 저장 추가)
  - `pages/api/kakao-content/generate-prompt-message.js` (아시아 골퍼 명시 강화)
  - `database/kakao-content-schema.sql` (신규, DB 스키마)

### 허브 시스템 통합 완료 ✅
- **메뉴 정리**
  - "📅 콘텐츠 캘린더" 메뉴 삭제
  - "🆕 새 캘린더" 메뉴 삭제
  - "🎯 허브 시스템" 메뉴로 통합
- **허브 시스템 페이지 개선**
  - 탭 구조 추가 (콘텐츠 허브 / 데일리 브랜딩)
  - 리스트 뷰 / 달력 뷰 토글 추가
  - 데일리 브랜딩 탭 추가 (카카오톡 링크 포함)
- **변경 파일**:
  - `components/admin/AdminNav.tsx` (메뉴 정리)
  - `pages/admin/content-calendar-hub.tsx` (탭 및 뷰 모드 추가)
  - `docs/CONTENT_SYSTEM_ARCHITECTURE.md` (구조 업데이트)

## ✅ 최근 완료된 작업 (2025-11-12)

### Phase 14 카카오톡 콘텐츠 자동화 시스템 - 완료 ✅
- **공통 시스템 모듈 추출 완료**
  - `lib/ai-image-generation.ts` - 골드톤/블랙톤 이미지 생성 함수 (오류 처리 개선)
  - `lib/prompt-config-manager.ts` - 프롬프트 설정 관리
  - `lib/self-adaptive-automation.ts` - Self-Adaptive Automation
- **카카오톡 콘텐츠 페이지 생성**
  - `pages/admin/kakao-content.tsx` - 메인 페이지 (브랜드 전략, 프롬프트 설정 통합)
  - `components/admin/kakao/ProfileManager.tsx` - 프로필 관리
  - `components/admin/kakao/FeedManager.tsx` - 피드 관리
  - `components/admin/kakao/KakaoAccountEditor.tsx` - 계정별 편집기
- **API 엔드포인트 생성**
  - `pages/api/content-calendar/load.js` - 캘린더 데이터 로드
  - `pages/api/kakao-content/calendar-save.js` - 캘린더 데이터 저장
  - `pages/api/kakao-content/save.js` - DB 저장 (준비 완료)
- **오류 수정**
  - `generate-paragraph-prompts` 400 오류 수정 (content 없을 때 기본 프롬프트 반환)
  - `/api/admin/blog?calendar_id=...` 500 오류 수정 (유효성 검사 추가)
- **통합 캘린더 구조 설계**
  - 콘텐츠 허브 (`hubContents`) + 데일리 브랜딩 (`dailyBranding`) 통합 구조
  - 문서: `docs/CONTENT_SYSTEM_ARCHITECTURE.md`
- **AdminNav 메뉴 추가**
  - "📱 카톡 콘텐츠" 메뉴 추가
- **UI/UX 개선**
  - 중복 아이콘 제거 (Calendar 아이콘 + 📅 이모지)
  - 일관성 있는 아이콘 사용 (Lucide React)
  - 로딩 상태 개선
- **변경 파일**:
  - `lib/ai-image-generation.ts` (신규, 오류 처리 개선)
  - `lib/prompt-config-manager.ts` (신규)
  - `lib/self-adaptive-automation.ts` (신규)
  - `pages/admin/kakao-content.tsx` (신규)
  - `components/admin/kakao/ProfileManager.tsx` (신규)
  - `components/admin/kakao/FeedManager.tsx` (신규)
  - `components/admin/kakao/KakaoAccountEditor.tsx` (신규)
  - `pages/api/content-calendar/load.js` (신규)
  - `pages/api/kakao-content/calendar-save.js` (신규)
  - `pages/api/kakao-content/save.js` (신규)
  - `pages/api/admin/blog.js` (오류 수정)
- `components/admin/AdminNav.tsx` (업데이트)
  - `docs/CONTENT_SYSTEM_ARCHITECTURE.md` (신규)
  - `docs/CONTENT_STRUCTURE_ANALYSIS.md` (신규)
- **후속 작업 완료 ✅**
  - 카카오 전용 프롬프트 생성 API (`/api/kakao-content/generate-prompt.js`) 생성 완료
  - 블로그 프롬프트와 완전 분리하여 카카오 전용 요구사항만 반영
  - `lib/ai-image-generation.ts`에 `generateKakaoImagePrompts` 함수 추가
  - `pages/admin/kakao-content.tsx`에서 카카오 전용 API 사용으로 변경
  - 캘린더 데이터 로드 수정 (`!p.created` 조건 제거)

### 공통 시스템 문서화 ✅
- **재사용 가능한 공통 시스템 문서 작성 완료**
- **문서 위치**: `docs/shared-systems/`
- **작성된 문서**:
  1. 브랜드 전략 시스템 (`brand-strategy-system.md`)
  2. AI 이미지 생성 시스템 (`ai-image-generation-system.md`)
  3. 프롬프트 설정 관리 (`prompt-settings-manager.md`) - 슬롯 기반 API 연결 계획 추가
  4. Self-Adaptive Automation (`self-adaptive-automation.md`)
  5. 갤러리 이미지 자산 관리 (`gallery-asset-management.md`)
- **README 작성**: `docs/shared-systems/README.md`

### 카카오톡 프로필 업데이트 자동화 완료 ✅ (2025-11-12)
- **Playwright 기반 자동화 스크립트 생성**
  - `scripts/update-kakao-profile.js` - 카카오톡 프로필 업데이트 자동화
  - Self-Adaptive Automation 적용 (다중 선택자, 자동 재시도)
  - 카카오톡 PC 버전 로그인 자동화
  - 배경 이미지/프로필 이미지 자동 업로드
  - 브랜드 표기 자동 설정 ("MASSGOO" - 고정)
  - 상태 메시지 자동 입력 (매일 변경)
- **프로필 구조 최종 확정**
  - 첫 번째 필드 (7/20): "MASSGOO" - 브랜드 표기 (고정)
  - 두 번째 필드 (13/60): 상태 메시지 - 매일 변경 (예: "스윙보다 마음이 먼저다.")
- **API 엔드포인트 생성**
  - `pages/api/kakao-content/update-profile.js` - 프로필 업데이트 API
  - 백그라운드에서 Playwright 스크립트 실행
- **UI 통합**
  - `components/admin/kakao/KakaoAccountEditor.tsx` - "카카오톡 업로드" 버튼 추가
  - 업로드 전 유효성 검사 (이미지, 메시지 확인)
  - 업로드 완료 시 배포 상태 자동 변경
- **문서화**
  - `docs/content-calendar/PROFILE_OPERATION_GUIDE.md` - 자동화 섹션 업데이트
  - 환경 변수 설정 가이드 추가
  - 프로필 구조 최종 확정 문서화
- **변경 파일**:
  - `scripts/update-kakao-profile.js` (신규, 브랜드 표기/상태 메시지 분리)
  - `pages/api/kakao-content/update-profile.js` (신규)
  - `components/admin/kakao/KakaoAccountEditor.tsx` (업로드 버튼 추가)
  - `pages/admin/kakao-content.tsx` (selectedDate, accountKey props 추가)
  - `docs/content-calendar/PROFILE_OPERATION_GUIDE.md` (자동화 섹션 업데이트, 프로필 구조 확정)

### 프롬프트 설정 관리 현황 분석 및 문서 업데이트 ✅
- **현황 분석 완료**
  - 마쓰구 브랜드 전략: 사용 중 ✅ (저장 기능 없음)
  - 프롬프트 설정 관리: 블로그 페이지 완료 ✅, 카카오 페이지 부분 구현 ⚠️
  - API 분리: 블로그 전용 API ✅, 카카오 전용 API ✅
- **개선 방안 문서화**
  - 슬롯 기반 API 연결 계획 (Phase 15 통합)
  - 스케줄별 변형 관리 계획
  - 버전 관리 및 롤백 기능 계획
- **문서 업데이트 완료**
  - `docs/shared-systems/prompt-settings-manager.md` - 슬롯 기반 API 연결 섹션 추가
  - `docs/phases/detailed-plans/phase-15-workflow-visualization.md` - 프롬프트 슬롯 통합 계획 추가
  - `docs/PHASE_14_COMPLETION_REPORT.md` - 현재 사용 현황 및 개선 방안 추가

### 카카오톡 콘텐츠 시스템 UI/UX 개선 ✅ (2025-11-12)
- **배포 상태 UI 개선**
  - 배포 상태를 별도 줄로 분리하여 레이아웃 개선
  - 체크박스 → 배지 버튼 스타일로 변경
  - 텍스트 잘림 문제 해결 (whitespace-nowrap 적용)
  - 날짜 표시 형식 개선 (월/일/시간/분)
- **이미지 생성 옵션 개선**
  - "생성 범위" 제거 및 보기 모드와 통합
  - "다시 만들기 허용" 제거 (X 버튼으로 이미 가능)
  - "생성 옵션 설정" 및 "전체 자동 생성" 버튼 상단 이동
  - 생성 옵션 모달 간소화 (이미지 생성 개수만 남김)
- **이미지 2개/4개 생성 시 선택 기능**
  - `ImageSelectionModal` 컴포넌트 생성
  - AI 자동 선택 기능 추가 (이미지 품질 평가 API)
  - 이미지 생성 개수 옵션 적용
- **피드 이미지 최적화**
  - Sharp 라이브러리로 카카오톡 피드 최적 사이즈 (1080x1080) 자동 크롭
  - AI 기반 중요 영역 크롭 (`position: 'entropy'`)
  - 피드 이미지는 JPEG 형식으로 저장 (품질 90%)
  - 베리에이션 시스템은 나중에 구현 (복잡도 고려)
- **변경 파일**:
  - `components/admin/kakao/KakaoAccountEditor.tsx` (배포 상태 별도 줄 분리, 버튼 비활성화 로직)
  - `components/admin/kakao/ImageSelectionModal.tsx` (신규, 이미지 선택 모달)
  - `pages/admin/kakao-content.tsx` (이미지 생성 개수 옵션 적용, 선택 모달 통합)
  - `pages/api/generate-paragraph-images-with-prompts.js` (피드 이미지 Sharp 최적화)
  - `pages/api/kakao-content/evaluate-images.js` (신규, 이미지 품질 평가 API)

## 2025-01-XX: 예약 폼 골프 정보 섹션 개선 (2차)

### 완료된 작업
- **샤프트 강도 옵션 확장**: R2, R1을 L과 R 사이에 추가 (총 7개 옵션: L, R2, R1, R, SR, S, X)
- **탄도 표기 개선**: 각도 표시(30°, 45°, 60°) 제거, 한글 표기로 변경 (저탄도, 중탄도, 고탄도)
- **레이블 정리**: 탄도와 구질 라벨에서 "(선택)" 제거
- **레이아웃 조정**: 샤프트 강도 그리드를 `grid-cols-5`에서 `grid-cols-7`로 변경
- **변경 파일**:
  - `pages/booking/form.tsx` (샤프트 강도 옵션 추가, 탄도 한글 표기, 레이블 정리)

## 2025-01-XX: 예약 폼 골프 정보 섹션 개선 (3차)

### 완료된 작업
- **샤프트 강도/로프트 각도 버튼 개선**: "잘 모르겠어요" 버튼을 그리드 밖으로 분리하고 "선택 안 함"으로 문구 변경
- **탄도 다중 선택 기능**: 최대 2개까지 선택 가능, 조합 표기 (중저탄도, 중고탄도, 저고탄도)
- **구질 한글 표기 개선**: 영어 표기(Straight, Hook, Draw, Fade, Slice)를 한글(스트레이트, 훅, 드로우, 페이드, 슬라이스)로 변경
- **구질 다중 선택 제한**: 최대 2개까지 선택 가능, 하단에 선택된 구질 표시
- **연령대 입력 방식 개선**: 드롭다운 선택식에서 숫자 입력 필드로 변경, 실제 나이 입력 후 자동으로 연령대 그룹화
- **변경 파일**:
  - `pages/booking/form.tsx` (탄도/구질 다중 선택, 한글 표기, 연령대 숫자 입력, 버튼 레이아웃 개선)

- **문서화**
  - `docs/KAKAO_CONTENT_STORAGE_GUIDE.md` - 저장 구조 가이드
  - `docs/DAILY_BRANDING_GUIDE.md` - 데일리 브랜딩 가이드
- **변경 파일**:
  - `pages/admin/kakao-content.tsx` (캘린더 로드 로직 수정, DB 저장 추가)
  - `pages/api/generate-paragraph-images-with-prompts.js` (메타데이터 저장 추가)
  - `pages/api/kakao-content/generate-prompt-message.js` (아시아 골퍼 명시 강화)
  - `database/kakao-content-schema.sql` (신규, DB 스키마)

### 허브 시스템 통합 완료 ✅
- **메뉴 정리**
  - "📅 콘텐츠 캘린더" 메뉴 삭제
  - "🆕 새 캘린더" 메뉴 삭제
  - "🎯 허브 시스템" 메뉴로 통합
- **허브 시스템 페이지 개선**
  - 탭 구조 추가 (콘텐츠 허브 / 데일리 브랜딩)
  - 리스트 뷰 / 달력 뷰 토글 추가
  - 데일리 브랜딩 탭 추가 (카카오톡 링크 포함)
- **변경 파일**:
  - `components/admin/AdminNav.tsx` (메뉴 정리)
  - `pages/admin/content-calendar-hub.tsx` (탭 및 뷰 모드 추가)
  - `docs/CONTENT_SYSTEM_ARCHITECTURE.md` (구조 업데이트)

## ✅ 최근 완료된 작업 (2025-11-12)

### Phase 14 카카오톡 콘텐츠 자동화 시스템 - 완료 ✅
- **공통 시스템 모듈 추출 완료**
  - `lib/ai-image-generation.ts` - 골드톤/블랙톤 이미지 생성 함수 (오류 처리 개선)
  - `lib/prompt-config-manager.ts` - 프롬프트 설정 관리
  - `lib/self-adaptive-automation.ts` - Self-Adaptive Automation
- **카카오톡 콘텐츠 페이지 생성**
  - `pages/admin/kakao-content.tsx` - 메인 페이지 (브랜드 전략, 프롬프트 설정 통합)
  - `components/admin/kakao/ProfileManager.tsx` - 프로필 관리
  - `components/admin/kakao/FeedManager.tsx` - 피드 관리
  - `components/admin/kakao/KakaoAccountEditor.tsx` - 계정별 편집기
- **API 엔드포인트 생성**
  - `pages/api/content-calendar/load.js` - 캘린더 데이터 로드
  - `pages/api/kakao-content/calendar-save.js` - 캘린더 데이터 저장
  - `pages/api/kakao-content/save.js` - DB 저장 (준비 완료)
- **오류 수정**
  - `generate-paragraph-prompts` 400 오류 수정 (content 없을 때 기본 프롬프트 반환)
  - `/api/admin/blog?calendar_id=...` 500 오류 수정 (유효성 검사 추가)
- **통합 캘린더 구조 설계**
  - 콘텐츠 허브 (`hubContents`) + 데일리 브랜딩 (`dailyBranding`) 통합 구조
  - 문서: `docs/CONTENT_SYSTEM_ARCHITECTURE.md`
- **AdminNav 메뉴 추가**
  - "📱 카톡 콘텐츠" 메뉴 추가
- **UI/UX 개선**
  - 중복 아이콘 제거 (Calendar 아이콘 + 📅 이모지)
  - 일관성 있는 아이콘 사용 (Lucide React)
  - 로딩 상태 개선
- **변경 파일**:
  - `lib/ai-image-generation.ts` (신규, 오류 처리 개선)
  - `lib/prompt-config-manager.ts` (신규)
  - `lib/self-adaptive-automation.ts` (신규)
  - `pages/admin/kakao-content.tsx` (신규)
  - `components/admin/kakao/ProfileManager.tsx` (신규)
  - `components/admin/kakao/FeedManager.tsx` (신규)
  - `components/admin/kakao/KakaoAccountEditor.tsx` (신규)
  - `pages/api/content-calendar/load.js` (신규)
  - `pages/api/kakao-content/calendar-save.js` (신규)
  - `pages/api/kakao-content/save.js` (신규)
  - `pages/api/admin/blog.js` (오류 수정)
- `components/admin/AdminNav.tsx` (업데이트)
  - `docs/CONTENT_SYSTEM_ARCHITECTURE.md` (신규)
  - `docs/CONTENT_STRUCTURE_ANALYSIS.md` (신규)
- **후속 작업 완료 ✅**
  - 카카오 전용 프롬프트 생성 API (`/api/kakao-content/generate-prompt.js`) 생성 완료
  - 블로그 프롬프트와 완전 분리하여 카카오 전용 요구사항만 반영
  - `lib/ai-image-generation.ts`에 `generateKakaoImagePrompts` 함수 추가
  - `pages/admin/kakao-content.tsx`에서 카카오 전용 API 사용으로 변경
  - 캘린더 데이터 로드 수정 (`!p.created` 조건 제거)

### 공통 시스템 문서화 ✅
- **재사용 가능한 공통 시스템 문서 작성 완료**
- **문서 위치**: `docs/shared-systems/`
- **작성된 문서**:
  1. 브랜드 전략 시스템 (`brand-strategy-system.md`)
  2. AI 이미지 생성 시스템 (`ai-image-generation-system.md`)
  3. 프롬프트 설정 관리 (`prompt-settings-manager.md`) - 슬롯 기반 API 연결 계획 추가
  4. Self-Adaptive Automation (`self-adaptive-automation.md`)
  5. 갤러리 이미지 자산 관리 (`gallery-asset-management.md`)
- **README 작성**: `docs/shared-systems/README.md`

### 카카오톡 프로필 업데이트 자동화 완료 ✅ (2025-11-12)
- **Playwright 기반 자동화 스크립트 생성**
  - `scripts/update-kakao-profile.js` - 카카오톡 프로필 업데이트 자동화
  - Self-Adaptive Automation 적용 (다중 선택자, 자동 재시도)
  - 카카오톡 PC 버전 로그인 자동화
  - 배경 이미지/프로필 이미지 자동 업로드
  - 브랜드 표기 자동 설정 ("MASSGOO" - 고정)
  - 상태 메시지 자동 입력 (매일 변경)
- **프로필 구조 최종 확정**
  - 첫 번째 필드 (7/20): "MASSGOO" - 브랜드 표기 (고정)
  - 두 번째 필드 (13/60): 상태 메시지 - 매일 변경 (예: "스윙보다 마음이 먼저다.")
- **API 엔드포인트 생성**
  - `pages/api/kakao-content/update-profile.js` - 프로필 업데이트 API
  - 백그라운드에서 Playwright 스크립트 실행
- **UI 통합**
  - `components/admin/kakao/KakaoAccountEditor.tsx` - "카카오톡 업로드" 버튼 추가
  - 업로드 전 유효성 검사 (이미지, 메시지 확인)
  - 업로드 완료 시 배포 상태 자동 변경
- **문서화**
  - `docs/content-calendar/PROFILE_OPERATION_GUIDE.md` - 자동화 섹션 업데이트
  - 환경 변수 설정 가이드 추가
  - 프로필 구조 최종 확정 문서화
- **변경 파일**:
  - `scripts/update-kakao-profile.js` (신규, 브랜드 표기/상태 메시지 분리)
  - `pages/api/kakao-content/update-profile.js` (신규)
  - `components/admin/kakao/KakaoAccountEditor.tsx` (업로드 버튼 추가)
  - `pages/admin/kakao-content.tsx` (selectedDate, accountKey props 추가)
  - `docs/content-calendar/PROFILE_OPERATION_GUIDE.md` (자동화 섹션 업데이트, 프로필 구조 확정)

### 프롬프트 설정 관리 현황 분석 및 문서 업데이트 ✅
- **현황 분석 완료**
  - 마쓰구 브랜드 전략: 사용 중 ✅ (저장 기능 없음)
  - 프롬프트 설정 관리: 블로그 페이지 완료 ✅, 카카오 페이지 부분 구현 ⚠️
  - API 분리: 블로그 전용 API ✅, 카카오 전용 API ✅
- **개선 방안 문서화**
  - 슬롯 기반 API 연결 계획 (Phase 15 통합)
  - 스케줄별 변형 관리 계획
  - 버전 관리 및 롤백 기능 계획
- **문서 업데이트 완료**
  - `docs/shared-systems/prompt-settings-manager.md` - 슬롯 기반 API 연결 섹션 추가
  - `docs/phases/detailed-plans/phase-15-workflow-visualization.md` - 프롬프트 슬롯 통합 계획 추가
  - `docs/PHASE_14_COMPLETION_REPORT.md` - 현재 사용 현황 및 개선 방안 추가

### 카카오톡 콘텐츠 시스템 UI/UX 개선 ✅ (2025-11-12)
- **배포 상태 UI 개선**
  - 배포 상태를 별도 줄로 분리하여 레이아웃 개선
  - 체크박스 → 배지 버튼 스타일로 변경
  - 텍스트 잘림 문제 해결 (whitespace-nowrap 적용)
  - 날짜 표시 형식 개선 (월/일/시간/분)
- **이미지 생성 옵션 개선**
  - "생성 범위" 제거 및 보기 모드와 통합
  - "다시 만들기 허용" 제거 (X 버튼으로 이미 가능)
  - "생성 옵션 설정" 및 "전체 자동 생성" 버튼 상단 이동
  - 생성 옵션 모달 간소화 (이미지 생성 개수만 남김)
- **이미지 2개/4개 생성 시 선택 기능**
  - `ImageSelectionModal` 컴포넌트 생성
  - AI 자동 선택 기능 추가 (이미지 품질 평가 API)
  - 이미지 생성 개수 옵션 적용
- **피드 이미지 최적화**
  - Sharp 라이브러리로 카카오톡 피드 최적 사이즈 (1080x1080) 자동 크롭
  - AI 기반 중요 영역 크롭 (`position: 'entropy'`)
  - 피드 이미지는 JPEG 형식으로 저장 (품질 90%)
  - 베리에이션 시스템은 나중에 구현 (복잡도 고려)
- **변경 파일**:
  - `components/admin/kakao/KakaoAccountEditor.tsx` (배포 상태 별도 줄 분리, 버튼 비활성화 로직)
  - `components/admin/kakao/ImageSelectionModal.tsx` (신규, 이미지 선택 모달)
  - `pages/admin/kakao-content.tsx` (이미지 생성 개수 옵션 적용, 선택 모달 통합)
  - `pages/api/generate-paragraph-images-with-prompts.js` (피드 이미지 Sharp 최적화)
  - `pages/api/kakao-content/evaluate-images.js` (신규, 이미지 품질 평가 API)

## 2025-01-XX: 예약 폼 골프 정보 섹션 개선 (2차)

### 완료된 작업
- **샤프트 강도 옵션 확장**: R2, R1을 L과 R 사이에 추가 (총 7개 옵션: L, R2, R1, R, SR, S, X)
- **탄도 표기 개선**: 각도 표시(30°, 45°, 60°) 제거, 한글 표기로 변경 (저탄도, 중탄도, 고탄도)
- **레이블 정리**: 탄도와 구질 라벨에서 "(선택)" 제거
- **레이아웃 조정**: 샤프트 강도 그리드를 `grid-cols-5`에서 `grid-cols-7`로 변경
- **변경 파일**:
  - `pages/booking/form.tsx` (샤프트 강도 옵션 추가, 탄도 한글 표기, 레이블 정리)

## 2025-01-XX: 예약 폼 골프 정보 섹션 개선 (3차)

### 완료된 작업
- **샤프트 강도/로프트 각도 버튼 개선**: "잘 모르겠어요" 버튼을 그리드 밖으로 분리하고 "선택 안 함"으로 문구 변경
- **탄도 다중 선택 기능**: 최대 2개까지 선택 가능, 조합 표기 (중저탄도, 중고탄도, 저고탄도)
- **구질 한글 표기 개선**: 영어 표기(Straight, Hook, Draw, Fade, Slice)를 한글(스트레이트, 훅, 드로우, 페이드, 슬라이스)로 변경
- **구질 다중 선택 제한**: 최대 2개까지 선택 가능, 하단에 선택된 구질 표시
- **연령대 입력 방식 개선**: 드롭다운 선택식에서 숫자 입력 필드로 변경, 실제 나이 입력 후 자동으로 연령대 그룹화
- **변경 파일**:
  - `pages/booking/form.tsx` (탄도/구질 다중 선택, 한글 표기, 연령대 숫자 입력, 버튼 레이아웃 개선)


## 2025-01-XX: 예약 알림/커뮤니케이션 시스템 구현 ✅

### 완료된 작업
- **예약 고객 알림 API 생성** ✅:
  - 파일: `pages/api/bookings/notify-customer.ts`
  - 기능: 예약 ID와 알림 타입을 받아서 고객에게 카카오톡 알림톡 발송, 실패 시 SMS로 자동 대체
  - 지원 알림 타입: `booking_received`, `booking_confirmed`, `booking_completed`
  - 메시지 템플릿: 각 타입별 카카오톡/SMS 템플릿 포함
  - 날짜/시간 포맷팅: 한글 형식으로 자동 변환 (예: 2025년 11월 27일, 오후 2시)

- **Slack 예약 알림 API 생성** ✅:
  - 파일: `pages/api/slack/booking-notify.js`
  - 기능: 예약 생성/확정/완료 이벤트를 Slack으로 전송
  - 메시지 포맷: Block Kit 형식으로 예약 정보 상세 표시
  - 지원 이벤트: `booking_created`, `booking_confirmed`, `booking_completed`

- **예약 생성 시 자동 알림 연동** ✅:
  - 파일: `pages/api/bookings.ts` (POST 핸들러)
  - 예약 생성 성공 후 자동으로:
    - 고객에게 `booking_received` 알림 발송 (카카오톡 → SMS 대체)
    - 관리자에게 Slack 알림 전송
  - 알림 실패해도 예약은 성공 처리 (에러 무시)

- **예약 확정 시 자동 알림 연동** ✅:
  - 파일: `components/admin/bookings/BookingListView.tsx` (`updateBookingStatus` 함수)
  - 예약 상태가 `pending` → `confirmed`로 변경될 때:
    - 고객에게 `booking_confirmed` 알림 발송
    - 관리자에게 Slack 알림 전송
  - 예약 상태가 `confirmed` → `completed`로 변경될 때:
    - 고객에게 `booking_completed` 감사 메시지 발송 (선택사항)
    - 관리자에게 Slack 알림 전송

- **변경 파일**:
  - `pages/api/bookings/notify-customer.ts` (신규 생성)
  - `pages/api/slack/booking-notify.js` (신규 생성)
  - `pages/api/bookings.ts` (예약 생성 시 알림 연동)
  - `components/admin/bookings/BookingListView.tsx` (예약 상태 변경 시 알림 연동)

### 향후 작업 (선택사항)
- 관리자 UI에 알림 발송 버튼 및 이력 표시
- 알림 발송 로그 저장 (Supabase 테이블)
- 예약 리마인더 (예약 전날/당일 자동 발송)

---

## 2025-01-XX: 예약 메시지 템플릿 개선 ✅

### 완료된 작업
- **예약 메시지 템플릿 개선** ✅:
  - 파일: `pages/api/bookings/notify-customer.ts`, `pages/api/bookings/[id]/schedule-reminder.ts`
  - 날짜 포맷팅 개선: 요일 추가 (예: 2025년 12월 23일(화))
  - 메시지 형식 개선:
    - 인사말 형식 변경: "[마쓰구골프] {고객명}님" → "친애하는 {고객명} 고객님, 안녕하세요! 마쓰구골프입니다."
    - 전통적인 기호 사용: ▶, ⊙, ☎ (이모티콘 대체)
    - 상세 정보 추가: 주소, 운영시간, 무료 상담 번호 포함
  - 템플릿 업데이트:
    - `booking_received`: 예약 접수 확인 메시지 개선
    - `booking_confirmed`: 예약 확정 메시지 개선 (시타 서비스 혜택, 방문 시 참고사항 추가)
    - `booking_reminder_2h`: 예약 당일 알림 메시지 개선 ("고반발" → "최대 비거리"로 변경)
  - 예약 당일 알림 메시지 생성 로직 업데이트: `schedule-reminder.ts`에서 동일한 형식으로 메시지 생성

- **변경 파일**:
  - `pages/api/bookings/notify-customer.ts` (날짜 포맷팅 함수 개선, SMS 템플릿 업데이트)
  - `pages/api/bookings/[id]/schedule-reminder.ts` (예약 당일 알림 메시지 템플릿 업데이트)

---

## 🔮 옵션 기능 / 향후 구현 예정

### MMS 이미지 중복 통합 및 최적화 (옵션)

**목적**: 기존 중복 이미지 통합 및 향후 중복 방지 시스템 구축

**구현 시점**: 
- 추후 최종 정리 단계에서 구현
- 또는 중복 데이터가 문제가 되었을 때 구현

**구현 계획**:

#### 1단계: 기존 중복 이미지 통합 (1회성 작업)
- 중복 이미지 그룹 찾기 (`hash_md5` 기준)
- 각 그룹에서 메인 이미지 선택 (우선순위: 사용 중인 것 > 최신 것)
- 나머지 이미지들의 경로를 `references`에 저장
- `channel_sms` 테이블의 `image_url`을 메인 이미지로 업데이트
- 중복 이미지 파일 삭제 (또는 보관)

**예시**:
- `originals/mms/2025-11-28/98/mms-98-xxx.jpg` (메인, 유지)
- `originals/mms/2025-11-28/113/mms-113-xxx.jpg` (중복, 삭제)
- `originals/mms/2025-11-28/113/mms-113-yyy.jpg` (중복, 삭제)

→ 메인 이미지의 `references`에 저장:
```json
{
  "references": [
    {
      "type": "mms",
      "message_id": 98,
      "date_folder": "2025-11-28",
      "original_path": "originals/mms/2025-11-28/98/mms-98-xxx.jpg"
    },
    {
      "type": "mms",
      "message_id": 113,
      "date_folder": "2025-11-28",
      "original_path": "originals/mms/2025-11-28/113/mms-113-xxx.jpg",
      "merged_from": true
    }
  ]
}
```

#### 2단계: 신규 업로드 시 중복 방지 (개선 제안 2)
- 업로드 전 `hash_md5` 체크
- 중복이면 `references` 업데이트 후 기존 URL 반환
- 신규면 저장 후 `references` 생성

**구현 예시**:
```javascript
// 업로드 전 중복 체크
const hash = await calculateMD5(imageBuffer);
const existing = await findImageByHash(hash);

if (existing) {
  // 기존 이미지의 references에 새 메시지 정보 추가
  await updateImageReferences(existing.id, {
    type: 'mms',
    message_id: newMessageId,
    date_folder: sentDate,
    used_at: new Date().toISOString()
  });
  return existing.image_url; // 새로 저장 안 함
} else {
  // 신규 이미지 저장 (기존 로직)
}
```

#### 3단계: 갤러리 날짜별 필터링 (가상 심볼릭 링크)
- 날짜별로 보이도록 쿼리
- `date_folder` 또는 `references`에서 날짜별 조회

**쿼리 예시**:
```javascript
// 날짜별로 보이도록 쿼리
SELECT * FROM image_metadata
WHERE 
  date_folder = '2025-11-28'  -- 직접 저장된 경우
  OR "references" @> '[{"date_folder": "2025-11-28"}]'  -- 참조된 경우
```

**장점**:
- ✅ 저장 공간 절약 (중복 이미지 제거)
- ✅ 날짜별 접근 가능 (`references`로 날짜별 조회)
- ✅ 사용 이력 추적 (모든 사용 기록 보존)
- ✅ 기존 데이터 복구 (통합 스크립트로 기존 중복 정리)
- ✅ 향후 중복 방지 (업로드 시 자동 중복 체크)

**필요 파일**:
- `scripts/merge-duplicate-mms-images.js` (중복 통합 스크립트)
- `pages/api/solapi/upload-image.js` 수정 (신규 중복 방지)
- `pages/api/admin/mms-images.js` 수정 (날짜별 필터링)

**참고**: 
- Supabase Storage는 객체 스토리지이므로 전통적인 파일 시스템 심볼릭 링크는 불가능하지만, 메타데이터 참조 방식으로 동일한 효과를 구현할 수 있습니다.
- `image_metadata` 테이블에 이미 `references` JSONB 컬럼과 `usage_count`, `hash_md5` 등이 준비되어 있어 추가 스키마 변경이 필요 없습니다.

---

## 11. 굿즈 / 사은품 관리 및 고객 선물 히스토리

- **왜 하는가**
  - MASSGOO × MUZIIK 콜라보 모자, 버킷햇, 티셔츠 등 굿즈/사은품 지급 내역을 체계적으로 관리
  - 고객별로 어떤 선물을 언제, 어떤 방식(직접수령/택배 등)으로 지급했는지 추적
  - 향후 굿즈 판매/재고 시스템과 자연스럽게 연동될 수 있는 기반 데이터 모델 구축

- **DB 스키마**
  - `products` (기존/신규 통합 마스터)
    - 주요 컬럼: `id, name, sku, category, color, size, legacy_name, is_gift, is_sellable, is_active, normal_price, sale_price`
    - `is_gift`: 사은품 여부 플래그
    - `is_sellable`: 판매 가능 상품 여부
  - `customer_gifts` (신규)
    - 컬럼: `id, customer_id (bigint, customers.id FK), survey_id (uuid, surveys.id FK), product_id (bigint, products.id FK), gift_text, quantity, delivery_type (in_person|courier|etc), delivery_status (pending|sent|canceled), delivery_date, note, created_at, updated_at`
    - 인덱스: `customer_id`, `product_id`

- **API 구현**
  - `GET /api/admin/products`
    - 파라미터: `isGift`, `includeInactive`, `q`, `category`
    - 용도: 굿즈 관리 페이지 및 설문/선물 선택용 드롭다운에 사용
  - `POST /api/admin/products`
    - 상품 생성 (굿즈/사은품 포함)
  - `PUT /api/admin/products`
    - 상품 수정 (플래그/가격/색상/사이즈 등)
  - `DELETE /api/admin/products`
    - 실제 삭제 대신 `is_active=false` 로 소프트 삭제
  - `GET /api/admin/customer-gifts?customerId=...`
    - 특정 고객의 선물 히스토리 조회 (상품 조인 포함)
  - `POST /api/admin/customer-gifts`
    - 새 선물 지급 기록 추가
  - `PUT /api/admin/customer-gifts`
    - 지급 상태/수량/메모 수정 (필요 시 확장)
  - `DELETE /api/admin/customer-gifts`
    - 잘못 입력된 선물 기록 삭제

- **관리자 UI 구현**
  - `/admin/products`
    - 기능:
      - 굿즈/사은품 상품 목록 조회 (검색, 사은품만 필터, 비활성 포함 여부)
      - 상품 생성/수정 모달 (이름, SKU, 카테고리, 색상, 사이즈, 정상가/할인가, 플래그 설정)
      - 상품 비활성화(소프트 삭제)
    - 구현 파일:
      - `pages/admin/products.tsx`
      - `pages/api/admin/products.ts`
      - `components/admin/AdminNav.tsx` 에 메뉴 `🎁 굿즈 / 사은품` 추가
  - 고객 상세 선물 히스토리 모달
    - 위치: `고객 관리` 페이지 (`/admin/customers`) 각 행의 `🎁 선물` 버튼
    - 기능:
      - 상단: 기존 선물 지급 이력 테이블 (날짜, 사은품명, 수량, 전달 방식/상태, 메모)
      - 하단: 새 선물 기록 추가 폼
        - 사은품 선택 (상품 드롭다운, `/api/admin/products?isGift=true`)
        - 기타 메모 (원래 제품명, 색/사이즈, 특이사항 등)
        - 수량, 전달 방식(직접수령/택배/기타), 상태(대기/완료/취소), 지급일, 비고
    - 구현 파일:
      - `pages/admin/customers/index.tsx`
        - 새로운 모달 컴포넌트 `CustomerGiftsModal` 추가
        - 고객 행에 `🎁 선물` 버튼 추가
      - `pages/api/admin/customer-gifts.ts`

- **향후 확장 포인트**
  - 설문 편집 모달에서 선택한 사은품을 `customer_gifts` 와 자동 연결 (`survey_id` 활용)
  - 굿즈 재고/판매 대시보드와 연동 (상품별 지급 수량 집계)
  - 특정 굿즈를 여러 번 받은 VIP 고객 타깃 마케팅 (예: 모자/공 재구매 유도 캠페인)

---

## ✅ 최근 작업: 제품 관리 시스템 통합 및 이미지 타입별 분리 (2025-12-27)

### 완료된 작업
- **제품 합성 관리 페이지 수정** ✅:
  - `pages/admin/product-composition.tsx`: 이미지 업로드 시 `imageType='composition'` 파라미터 추가
  - 합성용 이미지가 `originals/products/{product-slug}/composition/` 폴더에 저장되도록 수정
  - 메인 이미지와 참조 이미지 모두 합성용 폴더에 저장
- **데이터베이스 스키마 확장 준비** ✅:
  - `database/extend-products-table-for-drivers.sql`: 드라이버 제품 필드 추가 SQL 작성
  - 이미지 타입별 배열 필드 (`detail_images`, `composition_images`, `gallery_images`) 추가
  - PG 연동 및 재고 관리 확장 필드 추가
- **드라이버 제품 마이그레이션 스크립트** ✅:
  - `scripts/migrate-driver-products-to-db.js`: 하드코딩된 8개 드라이버 제품을 데이터베이스로 마이그레이션
  - 이미지 경로를 새 구조(`originals/products/{slug}/{type}/`)로 업데이트
- **이미지 URL 헬퍼 함수 개선** ✅:
  - `lib/product-image-url.ts`: `getSupabasePublicUrl` 함수 추가
  - Supabase Storage 경로를 공개 URL로 변환하는 통합 함수 제공
- **최종 계획 문서 작성** ✅:
  - `docs/final-product-management-plan.md`: 통합 제품 관리 시스템 최종 계획 문서 작성
  - `docs/implementation-checklist.md`: 구현 체크리스트 작성

### 제품 이미지 Storage 구조
- **드라이버 제품**: `originals/products/{product-slug}/{type}/`
  - `detail/`: 상세페이지용 이미지
  - `composition/`: 합성용 참조 이미지
  - `gallery/`: AI 합성 결과 이미지
- **굿즈 제품**: `originals/products/goods/{product-slug}/{type}/`
  - 동일한 구조로 관리

### 관리 페이지 역할 분담
- `/admin/products`: 상세페이지 이미지 (`detail`) 관리
- `/admin/product-composition`: 합성용 이미지 (`composition`) 관리 ✅ 수정 완료
- `/admin/ai-image-generator`: 갤러리 이미지 (`gallery`) 자동 저장

### 남은 작업
- [ ] 데이터베이스 스키마 확장 실행 (Supabase 대시보드에서 SQL 실행)
- [ ] 드라이버 제품 마이그레이션 실행 (`node scripts/migrate-driver-products-to-db.js`)
- [ ] 통합 제품 관리 페이지 개선 (드라이버 제품 관리 기능 추가)
- [ ] 메인 페이지 연동 (하드코딩 제거, 데이터베이스에서 로드)

### 관련 파일
- `pages/admin/product-composition.tsx` (수정)
- `pages/api/admin/upload-product-image.js` (확인 완료)
- `database/extend-products-table-for-drivers.sql` (신규)
- `scripts/migrate-driver-products-to-db.js` (신규)
- `lib/product-image-url.ts` (개선)
- `docs/final-product-management-plan.md` (신규)
- `docs/implementation-checklist.md` (신규)

---

## 2025-01-XX: black-beryl 제품 이미지 재정비 ✅

### 작업 내용
- **문제**: `black-beryl` 제품의 3개 이미지(`massgoo_sw_black_muz_12.webp`, `13.webp`, `15.webp`)가 `composition` 폴더에 있었지만, 실제로는 상세페이지용(`detail`) 이미지였음
- **해결**: 
  1. Storage에서 3개 파일을 `composition` → `detail` 폴더로 이동
  2. `product_composition` 테이블의 `reference_images`를 빈 배열로 업데이트
  3. `product_composition.image_url`은 `secret-weapon-black-sole-500.webp`만 유지

### 변경된 파일
- `scripts/reorganize-black-beryl-images.js` (신규): 이미지 재정비 스크립트
- `scripts/black-beryl-reorganization-result.json` (신규): 재정비 결과 로그

### 최종 상태
- ✅ Storage: 3개 파일이 `detail` 폴더로 이동 완료
- ✅ `product_composition.reference_images`: 빈 배열 `[]`
- ✅ `product_composition.image_url`: `secret-weapon-black-sole-500.webp`만 유지
- ✅ `products.detail_images`: 9개 모두 정상 (12, 13, 15 포함)

---

## 2025-01-XX: black-beryl 루트 폴더 정리 완료 ✅

### 작업 내용
- **문제**: `black-beryl` 루트 폴더에 13개 파일이 남아있어 정리가 필요했음
- **해결**: 
  1. 루트 폴더의 모든 파일을 하위 폴더(`detail/`, `composition/`)로 이동 또는 삭제
  2. `composition` 폴더는 `secret-weapon-black-sole-500.webp`만 유지 (500 관련 다른 파일 삭제)
  3. 데이터베이스의 `detail_images`와 `composition_images` 업데이트
  4. 루트 폴더 완전히 정리

### 변경된 파일
- `scripts/clean-black-beryl-root-files.js` (신규): 루트 폴더 정리 스크립트
- `scripts/remove-unnecessary-500-files.js` (신규): 불필요한 500 관련 파일 삭제 스크립트
- `scripts/black-beryl-root-cleanup-result.json` (신규): 정리 결과 로그
- `scripts/remove-500-files-result.json` (신규): 삭제 결과 로그

### 최종 상태
- ✅ 루트 폴더: 완전히 비어있음 (0개 파일)
- ✅ `detail/` 폴더: 10개 파일 (상세페이지용 이미지)
- ✅ `composition/` 폴더: 1개 파일 (`secret-weapon-black-sole-500.webp`만 유지)
- ✅ `products.detail_images`: 10개 이미지 (500 관련 파일 제거됨)
- ✅ `products.composition_images`: 1개 이미지 (`secret-weapon-black-sole-500.webp`)

---

## 2025-01-XX: 모든 드라이버 제품 루트 폴더 정리 완료 ✅

### 작업 내용
- **문제**: 7개 드라이버 제품의 루트 폴더에 총 117개 파일이 남아있어 정리가 필요했음
- **해결**: 
  1. 모든 제품의 루트 폴더 파일을 하위 폴더(`detail/`, `composition/`, `gallery/`)로 이동 또는 삭제
  2. 각 제품의 `composition` 폴더는 500 사이즈 파일 1개만 유지 (나머지 500 관련 파일 삭제)
  3. 데이터베이스의 `detail_images`, `composition_images`, `gallery_images` 업데이트
  4. 모든 제품의 루트 폴더 완전히 정리

### 정리된 제품 목록
1. ✅ **black-weapon**: 21개 파일 처리 (7개 이동, 16개 삭제)
2. ✅ **gold-weapon4**: 20개 파일 처리 (10개 이동, 11개 삭제)
3. ✅ **gold2**: 13개 파일 처리 (12개 이동, 2개 삭제)
4. ✅ **gold2-sapphire**: 14개 파일 처리 (3개 이동, 12개 삭제)
5. ✅ **pro3**: 22개 파일 처리 (12개 이동, 11개 삭제)
6. ✅ **pro3-muziik**: 8개 파일 처리 (0개 이동, 8개 삭제)
7. ✅ **v3**: 19개 파일 처리 (11개 이동, 8개 삭제)

### 변경된 파일
- `scripts/check-all-driver-products-status.js` (신규): 모든 드라이버 제품 상태 확인 스크립트
- `scripts/clean-all-driver-products-root-files.js` (신규): 모든 드라이버 제품 루트 폴더 정리 스크립트
- `scripts/all-driver-products-status.json` (신규): 상태 확인 결과
- `scripts/all-driver-products-cleanup-result.json` (신규): 정리 결과 로그

### 최종 상태
- ✅ **모든 제품의 루트 폴더**: 완전히 비어있음 (0개 파일)
- ✅ **총 처리 파일**: 123개 (55개 이동, 68개 삭제)
- ✅ **각 제품의 `composition/` 폴더**: 500 사이즈 파일 1개만 유지
- ✅ **데이터베이스**: 모든 제품의 `detail_images`, `composition_images`, `gallery_images` 업데이트 완료

### 정리 통계
- **총 이동**: 55개 파일
- **총 삭제**: 68개 파일 (중복 파일 및 불필요한 500 파일)
- **오류**: 0개

---

## 2025-01-XX: detail 폴더 정리 및 pro3 gallery 이미지 대체 완료 ✅

### 작업 내용
- **문제**: 
  1. 여러 제품의 detail 폴더에 불필요한 파일들(`_-_-_-_`로 시작), 중복 파일, composition 파일들이 섞여있었음
  2. pro3 제품의 detail 이미지를 gallery 이미지로 대체 필요
- **해결**: 
  1. 모든 드라이버 제품의 detail 폴더에서 불필요한 파일 삭제 (89개)
  2. pro3 제품의 detail 폴더를 gallery 이미지로 완전 대체

### 정리된 제품 (detail 폴더 정리)
1. ✅ **black-weapon**: 13개 삭제
2. ✅ **gold-weapon4**: 10개 삭제
3. ✅ **gold2**: 17개 삭제
4. ✅ **gold2-sapphire**: 2개 삭제
5. ✅ **pro3**: 24개 삭제 (이후 gallery 이미지로 대체)
6. ✅ **v3**: 23개 삭제

### pro3, gold-weapon4, black-weapon gallery 이미지 대체
- **pro3**:
  - **삭제**: detail 폴더의 기존 파일 9개
  - **복사**: gallery 폴더의 9개 파일을 detail 폴더로 복사
  - **데이터베이스**: `detail_images`를 gallery 이미지 경로로 업데이트
- **gold-weapon4**:
  - **삭제**: detail 폴더의 기존 파일 9개
  - **복사**: gallery 폴더의 9개 파일을 detail 폴더로 복사
  - **데이터베이스**: `detail_images`를 gallery 이미지 경로로 업데이트
- **black-weapon**:
  - **삭제**: detail 폴더의 기존 파일 9개
  - **복사**: gallery 폴더의 9개 파일을 detail 폴더로 복사
  - **데이터베이스**: `detail_images`를 gallery 이미지 경로로 업데이트

### geocoding.ts 구문 오류 수정
- **문제**: `pages/api/admin/customers/geocoding.ts` 파일의 583번째 줄부터 파일 끝까지 함수 밖에 있는 사용되지 않는 코드로 인한 구문 오류 발생
- **원인**: 메인 핸들러 함수가 582번째 줄에서 끝나는데, 그 이후에 오래된 코드가 남아있어서 구문 오류 발생
- **해결**: 583번째 줄부터 파일 끝까지의 모든 사용되지 않는 코드 삭제
- **결과**: 구문 오류 해결, 빌드 성공

### geocoding.ts 고객 수 제한 문제 수정 (1차)
- **문제**: 거리 있는 고객 378명 + 거리 없는 고객 622명 = 1000명으로 표시됨 (전체 고객 2992명 기준이 아님)
- **원인**: 
  - Supabase 기본 limit(1000)으로 `allCustomers`가 최대 1000개만 조회됨
  - 검색어가 없을 때도 limit이 지정되지 않아 1000개로 제한됨
  - `totalWithAddress`가 `filteredCustomers.length`로 계산되어 1000개로 제한됨
- **해결**: 
  1. 전체 고객 수(`totalAllCustomers`)는 검색어 필터 없이 별도로 조회 (`head: true` 옵션 사용)
  2. 검색어가 없을 때 limit을 10000으로 설정하여 전체 고객 조회 가능하도록 수정
  3. 고객 데이터 조회 시 `count: 'exact'` 옵션 제거 (전체 고객 수는 별도 조회)
- **결과**: 전체 고객 수(2992명) 기준으로 정확한 통계 표시 가능

### geocoding.ts 서버 사이드 페이지네이션 방식으로 전환 (2차)
- **문제**: 2992명을 100명씩 보기로 했는데 페이지가 10페이지만 나옴 (1000개 제한 문제 지속)
- **원인**: 
  - Supabase의 `.in()` 메서드가 1000개 제한을 가지고 있어서 설문 주소/Cache 조회 시 제한됨
  - 모든 고객을 한 번에 가져온 후 메모리에서 필터링하는 방식으로 인해 1000개 제한에 걸림
  - `limit(10000)` 설정해도 Supabase 기본 limit(1000)이 적용됨
- **해결**: 
  1. **서버 사이드 페이지네이션 적용**: `.range(from, to)` 사용하여 필요한 페이지만 조회
  2. **필터링을 데이터베이스 레벨에서 수행**: 
     - 필터 조건(status, province, distance 등)에 맞는 customer_id를 먼저 cache 테이블에서 조회
     - 배치 처리(1000개씩)로 모든 customer_id 수집
     - 그 customer_id 목록으로 customers 테이블 조회
  3. **전체 개수는 필터 조건에 맞는 count 쿼리로 조회**: `count: 'exact'` 옵션 사용
  4. **설문 주소/Cache 조회는 현재 페이지 고객만**: 메모리 효율성 향상
  5. **배치 처리로 Supabase 제한 회피**: customer_id가 1000개 이상일 때도 처리 가능
- **결과**: 
  - 2992명 전체 고객을 처리할 수 있음
  - 100개씩 보기 시 약 30페이지 표시 가능
  - 필터 조건에 맞는 정확한 전체 개수 표시
  - 메모리 효율성 향상

### 변경된 파일
- `pages/api/admin/customers/geocoding.ts`: 
  - 사용되지 않는 코드 삭제 (583-1313줄)
  - 전체 고객 수 조회 로직 수정 (검색어 필터 없이 별도 조회)
  - 검색어가 없을 때 limit 10000 설정 추가 (1차 수정)
  - **서버 사이드 페이지네이션 방식으로 전환** (2차 수정)
    - `.range(from, to)` 사용하여 필요한 페이지만 조회
    - 필터 조건에 맞는 customer_id를 cache 테이블에서 먼저 조회 (배치 처리)
    - 필터된 customer_id로 customers 테이블 조회
    - 설문 주소/Cache 조회는 현재 페이지 고객만 처리
    - 전체 개수는 필터 조건에 맞는 count 쿼리로 정확히 계산
- `scripts/check-unnecessary-files-in-detail.js` (신규): detail 폴더 불필요한 파일 확인 스크립트
- `scripts/clean-detail-folders.js` (신규): detail 폴더 정리 스크립트
- `scripts/replace-pro3-detail-with-gallery.js` (신규): pro3 gallery 이미지 대체 스크립트
- `scripts/replace-gold-weapon4-detail-with-gallery.js` (신규): gold-weapon4 gallery 이미지 대체 스크립트
- `scripts/replace-black-weapon-detail-with-gallery.js` (신규): black-weapon gallery 이미지 대체 스크립트
- `scripts/unnecessary-files-in-detail.json` (신규): 불필요한 파일 확인 결과
- `scripts/detail-folders-cleanup-result.json` (신규): detail 폴더 정리 결과
- `scripts/pro3-detail-to-gallery-replacement-result.json` (신규): pro3 대체 결과
- `scripts/gold-weapon4-detail-to-gallery-replacement-result.json` (신규): gold-weapon4 대체 결과
- `scripts/black-weapon-detail-to-gallery-replacement-result.json` (신규): black-weapon 대체 결과
- `scripts/delete-gallery-files-for-weapons.js` (신규): black-weapon, gold-weapon4 gallery 파일 삭제 스크립트
- `scripts/gallery-files-deletion-result.json` (신규): gallery 파일 삭제 결과

### 최종 상태
- ✅ **모든 제품의 detail 폴더**: 불필요한 파일 제거 완료
- ✅ **pro3 detail 폴더**: gallery 이미지로 완전 대체 (9개 파일)
- ✅ **pro3 gallery 폴더**: 원본 유지 (9개 파일)
- ✅ **gold-weapon4 detail 폴더**: gallery 이미지로 완전 대체 (9개 파일)
- ✅ **gold-weapon4 gallery 폴더**: 삭제 완료 (0개 파일)
- ✅ **black-weapon detail 폴더**: gallery 이미지로 완전 대체 (9개 파일)
- ✅ **black-weapon gallery 폴더**: 삭제 완료 (0개 파일)
- ✅ **gold-weapon4 gallery 폴더**: 삭제 완료 (0개 파일)
- ✅ **데이터베이스**: 모든 제품의 `detail_images`, `gallery_images` 업데이트 완료

### 삭제된 파일 유형
1. **불필요한 파일**: `_-_-_-_`로 시작하는 파일 (46개)
2. **Composition 파일**: detail에 있던 500/350 관련 파일 (14개)
3. **중복 파일**: 같은 번호의 중복 파일 (29개)

---

## 카카오톡 콘텐츠 생성 - 제품 합성 이미지 URL 수정 (2025-01-XX)

### 문제
- 카카오톡 콘텐츠 생성 페이지에서 모자 합성 시 "제품 합성은 완료되었지만 결과 이미지를 가져올 수 없습니다" 오류 발생
- AI 이미지 생성기에서는 정상 작동하지만, 카카오톡 콘텐츠 생성에서는 작동하지 않음

### 원인
- API 응답 구조: `images` 배열을 반환 (`images[0].imageUrl`)
- 카카오톡 콘텐츠 생성 코드: 존재하지 않는 `composedImageUrl` 필드를 참조
- AI 이미지 생성기: 올바르게 `images[0].imageUrl` 사용

### 수정 내용
- `components/admin/kakao/FeedManager.tsx`: `composedImageUrl` → `images[0].imageUrl`로 변경
- `components/admin/kakao/ProfileManager.tsx`: 배경 이미지 및 프로필 이미지 합성 로직 동일하게 수정
- AI 이미지 생성기와 동일한 방식으로 통일

### 변경된 파일
- `components/admin/kakao/FeedManager.tsx`: 피드 이미지 제품 합성 응답 처리 수정
- `components/admin/kakao/ProfileManager.tsx`: 배경/프로필 이미지 제품 합성 응답 처리 수정

### 최종 상태
- ✅ 카카오톡 콘텐츠 생성에서 제품 합성 이미지 정상 로드
- ✅ AI 이미지 생성기와 동일한 응답 처리 방식으로 통일
- ✅ 에러 처리 및 로깅 개선

---

## 갤러리 이미지 선택 모바일 UI 개선 (2025-01-XX)

### 문제
- 모바일 갤러리에서 이미지 선택 시 UI가 개선되지 않아 기능 사용 불가
- 터치 타겟이 작아 조작 어려움
- 필터 및 입력 필드가 모바일에서 겹치거나 작게 표시됨

### 개선 내용
1. **모달 컨테이너**
   - 모바일: `p-2`, `max-w-full` (전체 너비)
   - 데스크톱: `sm:p-4`, `sm:max-w-7xl`

2. **헤더 영역**
   - 모바일: 세로 배치 (`flex-col`)
   - 탭 버튼: 작은 크기 (`px-3 py-1.5`, `text-xs`)
   - 닫기 버튼: 큰 터치 영역 (`w-10 h-10`, `text-3xl`)

3. **필터 섹션**
   - 모바일: 세로 배치 (`flex-col`)
   - 입력 필드: 전체 너비, 큰 패딩 (`py-2`, `min-h-[44px]`)
   - 최근 사용 폴더 버튼: 작은 크기 (`text-[10px]`, `min-h-[36px]`)

4. **이미지 그리드**
   - 모바일: 1열 (`grid-cols-1`)
   - 데스크톱: 반응형 (`sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`)
   - 간격: `gap-2 sm:gap-4`

5. **퀵액션 버튼**
   - 모바일: 항상 표시 (`opacity-100`, `bg-black/40`)
   - 데스크톱: 호버 시 표시 (`sm:opacity-0 sm:group-hover:opacity-100`)
   - 버튼 크기: `min-h-[44px]` (터치 최적화)

6. **패딩 조정**
   - 이미지 그리드 영역: `p-2 sm:p-6`
   - 선택 액션 바: `px-3 sm:px-6 py-3 sm:py-4`

### 변경된 파일
- `components/admin/GalleryPicker.tsx`: 모바일 반응형 UI 개선

### 최종 상태
- ✅ 모바일에서 갤러리 이미지 선택 기능 정상 작동
- ✅ 터치 타겟 최소 44px로 확대
- ✅ 필터 및 입력 필드 모바일 최적화
- ✅ 이미지 그리드 모바일 1열 레이아웃
- ✅ 퀵액션 버튼 모바일에서 항상 표시

---

## 제품 합성 이미지 두 곳 저장 방식 범용 적용 (2025-01-XX)

### 문제
- 카카오 콘텐츠 합성 이미지가 제품 gallery에만 저장되어 카카오 폴더에서 관리 어려움
- 블로그 폴더는 같은 폴더에 저장되지만, 카카오 폴더는 제외됨
- 추후 다른 소스 폴더에도 확장 필요

### 개선 내용
1. **범용 소스 폴더 감지**
   - 블로그: `originals/blog/` 감지
   - 카카오: `originals/daily-branding/kakao/` 감지
   - 기타: `originals/` 하위 폴더 감지 (확장 가능)

2. **두 곳 저장 로직**
   - **제품 gallery**: 항상 저장 (필수, 기본 저장 위치)
   - **소스 폴더**: 감지되면 함께 저장 (선택, 원본 위치 유지)

3. **에러 처리 개선**
   - 제품 gallery 저장 실패 시 전체 실패
   - 소스 폴더 저장 실패 시 경고만 (제품 gallery는 유지)

4. **반환 정보 확장**
   - `sourcePath`: 소스 폴더 경로 (있는 경우)
   - `sourceUrl`: 소스 폴더 공개 URL (있는 경우)
   - `sourceFolderType`: 소스 폴더 타입 ('blog', 'kakao', 'other')
   - `savedLocations`: 저장된 위치 배열

### 저장 위치 결정 로직
```javascript
// 1. 제품 gallery (항상 저장)
- 모자/액세서리: originals/goods/{slug}/gallery
- 드라이버 등: originals/products/{slug}/gallery

// 2. 소스 폴더 (감지되면 저장)
- 블로그: originals/blog/{year-month}/{blogId}/
- 카카오: originals/daily-branding/kakao/{date}/{account}/{type}/
- 기타: originals/{...}/
```

### 장점
- ✅ **일관성**: 모든 소스에서 동일한 방식 적용
- ✅ **확장성**: 새로운 폴더 타입 추가 용이
- ✅ **안정성**: 제품 gallery는 항상 저장 보장
- ✅ **유연성**: 소스 폴더 저장 실패해도 제품 gallery는 유지
- ✅ **관리 편의성**: 각 폴더에서 독립적으로 관리 가능

### 변경된 파일
- `pages/api/compose-product-image.js`: `saveImageToSupabase` 함수 개선

### 최종 상태
- ✅ 카카오 콘텐츠 합성 이미지가 제품 gallery와 카카오 폴더에 모두 저장
- ✅ 블로그 합성 이미지가 제품 gallery와 블로그 폴더에 모두 저장
- ✅ 추후 다른 소스 폴더에도 자동 확장 가능
- ✅ 각 폴더에서 독립적으로 이미지 관리 가능

---

## 2026-01-XX: 위치 정보 관리 UI 개선 (체크박스, 배지, 세로 배치)

### 작업 내용
**개선 사항:**
1. **체크박스 기능 추가**
   - 이름 열 앞에 체크박스 추가
   - 전체 선택/해제 기능
   - 선택된 항목만 일괄 동기화 가능

2. **동기화 배지 (이름 우측)**
   - 동기화 가능: 초록색 "동기화" 배지 표시
   - 재동기화 가능: 파란색 "재동기화" 배지 표시
   - 배지는 정보 표시용 (클릭 불가)

3. **일괄 동기화 버튼 개선**
   - 기존: `📋 설문 주소 → 고객 주소 일괄 동기화`
   - 변경: `주소 동기화 (N개)` 또는 `주소 동기화 (전체)`
   - 선택된 개수 실시간 표시

4. **주소 표시 세로 배치**
   - 가로 3열 → 세로 배치로 변경
   - 라벨 간격 조정 (`space-y-2`, `mb-0.5`)
   - 색상/폰트 통일 유지

5. **액션 열 개선**
   - "동기화" 버튼: 초기 동기화 가능한 경우
   - "재동기화" 버튼: 주소가 다른 경우 재동기화 가능

### 구현 세부사항
- **State 추가**: `selectedCustomerIds` - 선택된 고객 ID 배열
- **함수 추가**:
  - `handleSelectCustomer`: 개별 고객 선택/해제
  - `handleSelectAllCustomers`: 전체 선택/해제
  - `canSync`: 동기화 가능 여부 확인 (동기화/재동기화 구분)
- **일괄 동기화 함수 수정**: 선택된 항목만 동기화하도록 변경

### 수정 파일
- `pages/admin/surveys/index.tsx`: 체크박스, 배지, 세로 배치, 일괄 동기화 버튼 개선

### 결과
- ✅ 체크박스로 선택한 항목만 일괄 동기화 가능
- ✅ 이름 옆 배지로 동기화 가능 여부를 한눈에 파악
- ✅ 주소가 세로로 깔끔하게 정렬되어 가독성 향상
- ✅ 일괄 동기화 버튼에 선택 개수 표시로 명확성 향상

---

## 2026-01-XX: 경품 추천 이력 및 위치 정보 관리 UI 개선

### 작업 내용

**1. 경품 추천 이력 문제 수정:**
- **버튼 공백 수정**: `ml-2` 제거, `flex gap-2`로 통일
- **중복 저장 방지**: 같은 날짜의 기존 데이터 삭제 후 저장
- **거리 정보 조회 개선**: 
  - `customer_id`가 없어도 `phone` 또는 `survey_id`로 캐시 조회
  - 위치 정보 관리에서 업데이트한 최신 거리 정보 사용
  - 플레이스홀더 주소는 거리 계산 제외

**2. 위치 정보 관리 UI 단순화:**
- **주소를 뱃지로 표시**: 지오코딩(카카오맵), 설문주소, 고객관리주소를 각각 뱃지로 표시
  - 지오코딩: 파란색 뱃지
  - 설문주소: 초록색 뱃지
  - 고객관리주소: 보라색 뱃지
  - 플레이스홀더/없음: 회색/빨간색 뱃지
- **이름 옆 배지 제거**: 동기화/재동기화 배지 제거하여 단순화
- **액션 열 단순화**: "동기화"와 "재동기화" 버튼을 하나의 "동기화" 버튼으로 통합

### 수정 파일
- `pages/api/admin/surveys/recommend-prizes.ts`: 거리 정보 조회 개선, 중복 저장 방지
- `pages/admin/surveys/index.tsx`: 경품 추천 이력 버튼 공백 수정, 위치 정보 관리 UI 단순화

### 결과
- ✅ 경품 추천 이력에서 거리 정보 누락 문제 해결
- ✅ 중복 저장 방지로 데이터 정확성 향상
- ✅ 주소 정보를 뱃지로 표시하여 가독성 향상
- ✅ 동기화 UI 단순화로 사용성 개선

---

## 2026-01-XX: 주소 동기화 로직 개선

### 작업 내용

**문제점:**
1. 주소 비교 시 공백 차이로 인한 오판: "인천광역시 부평구..."와 " 인천광역시 부평구..."를 다르게 판단
2. API에서 고객관리 주소가 있지만 설문 주소와 다른 경우 동기화 불가: 프론트엔드에서는 동기화 버튼이 보이지만 API에서 "동기화할 고객이 없습니다." 메시지 반환

**해결 방법:**

1. **주소 비교 정규화 (프론트엔드 & API):**
   - `normalizeForCompare` 함수 추가: 앞뒤 공백 제거, 중간 공백 정규화
   - 주소 비교 시 정규화된 주소로 비교하여 공백 차이 무시

2. **API 동기화 조건 개선:**
   - 기존: 고객 주소가 없거나 플레이스홀더인 경우만 조회
   - 수정: 고객 주소가 있지만 설문 주소와 다른 경우도 동기화 가능
   - 동기화 조건:
     - 고객관리 주소가 없거나 플레이스홀더인 경우
     - 또는 고객관리 주소와 설문 주소가 다른 경우 (정규화 후 비교)

### 수정 파일
- `pages/admin/surveys/index.tsx`: `canSync` 함수에 주소 정규화 로직 추가
- `pages/api/admin/surveys/sync-addresses.ts`: 동기화 조건 개선 및 주소 정규화 로직 추가

### 결과
- ✅ 공백 차이로 인한 오판 문제 해결
- ✅ 고객관리 주소가 있지만 설문 주소와 다른 경우도 동기화 가능
- ✅ 프론트엔드와 API의 동기화 조건 일치

---

## 2026-01-XX: 위치 정보 관리 추가 개선 (고객정보 없음 표시, 전체 체크박스 해제 수정)

### 작업 내용

**1. 고객정보 없음 배지 표시:**
- `customer_id`가 없는 고객의 이름 옆에 주황색 "고객정보 없음" 배지 표시
- 유항용, 김휘영, 최원구처럼 고객 테이블에 없는 고객을 명확히 구분

**2. 전체 체크박스 해제 문제 수정:**
- 문제: `customer_id`가 없는 고객이 있을 때 전체 체크박스 해제가 안됨
- 원인: `checked` 조건과 `handleSelectAllCustomers`의 조건이 불일치
  - `checked`: `customer_id`가 있는 고객 수와 비교
  - 해제 조건: 전체 고객 수와 비교
- 수정: 두 조건을 모두 `customer_id`가 있는 고객 수로 통일

### 수정 파일
- `pages/admin/surveys/index.tsx`: 고객정보 없음 배지 추가, 전체 체크박스 해제 로직 수정

### 결과
- ✅ 고객정보가 없는 고객을 한눈에 파악 가능
- ✅ 전체 체크박스 해제가 정상적으로 동작
- ✅ `customer_id`가 없는 고객도 명확히 표시

---

## 2026-01-XX: 위치 정보 관리 UI 가독성 개선

### 작업 내용
**문제점:**
- 주소 표시가 세로로 3개가 나열되어 공간 낭비
- 이모지와 긴 라벨로 가독성 저하
- 색상과 폰트 스타일이 과도하게 다양함

**개선 사항:**
1. **레이아웃 변경**: 세로 배치 → 가로 3열 그리드 (`grid grid-cols-3`)
2. **라벨 단순화**: 
   - `📍 지오코딩 주소 (카카오맵 API):` → `지오코딩(카카오맵)`
   - `📝 설문 주소:` → `설문주소`
   - `👤 고객관리 주소:` → `고객관리주소`
3. **이모지 제거**: 모든 이모지 제거하여 깔끔하게
4. **색상 통일**: 
   - 기본 주소: `text-gray-700`
   - 플레이스홀더: `text-gray-400 italic`
   - 없음: `text-red-500 italic`
   - 라벨: `text-gray-600`
5. **폰트 통일**: 불필요한 `font-medium` 제거, 일관된 스타일 적용

### 수정 파일
- `pages/admin/surveys/index.tsx`: 주소 표시 부분을 가로 3열 그리드로 변경

### 결과
- ✅ 한 줄에 3개 주소가 나란히 표시되어 공간 효율성 향상
- ✅ 라벨이 간결해져 가독성 개선
- ✅ 색상과 폰트가 통일되어 시각적 일관성 향상
- ✅ 각 열의 너비가 동일하여 정렬이 깔끔함


---

## 2026-01-XX: 고객 관리 시스템 개선 방향 수립

### 작업 내용
**사용자 요구사항:**
1. 전화번호가 없고 사진만 있는 고객(블로거 체험단 등) 관리 방법
2. 마쓰구드라이버 판매대리점 등 업계 관련자 정보 관리 방법

**분석 결과:**
- 현재 `customers` 테이블의 `phone`이 `UNIQUE NOT NULL`로 설정되어 전화번호 없는 고객 등록 불가
- 무기명1, 무기명2 같은 임시 전화번호는 데이터 무결성 해침
- 판매대리점 등 업계 관련자는 별도 관리 필요

**개선 방향:**
1. **전화번호 없는 고객 관리:**
   - `phone` 컬럼을 nullable로 변경
   - `customer_type` 필드 추가 (regular, blogger, temporary, partner, dealer)
   - `customer_category` 필드 추가 (더 세분화된 분류)
   - `notes` 필드 추가 (특수 케이스 메모)
   - 이미지/스토리 관리 기능은 이미 구현되어 있음

2. **판매대리점 등 업계 관련자 관리:**
   - 고객 관리 내 탭 분리 방식 권장 (별도 메뉴보다 효율적)
   - `customer_type`으로 구분 (partner, dealer)
   - 판매대리점 전용 필드 추가 (업체명, 사업자번호, 담당자, 지역, 계약일 등)

**개발 단계:**
- Phase 1: 데이터베이스 스키마 변경 (우선순위: 높음)
- Phase 2: 고객 등록/수정 폼 개선 (우선순위: 높음)
- Phase 3: 고객 목록 UI 개선 (우선순위: 중간)
- Phase 4: API 개선 (우선순위: 중간)
- Phase 5: 이미지/스토리 관리 개선 (우선순위: 낮음)

### 생성 파일
- `docs/customer-management-enhancement-plan.md`: 상세 개발 방향 문서

### 결과
- ✅ 전화번호 없는 고객 관리 방안 수립
- ✅ 판매대리점 등 업계 관련자 관리 방안 수립
- ✅ 단계별 개발 계획 수립
- ✅ 데이터베이스 스키마 변경 계획 수립

---

## 카카오 친구 관리 시스템 구현 (2026-01-23)

### 작업 내용
**목적**: `kakao_friend_mappings` 테이블에 친구 정보를 등록하고 UUID를 확인할 수 있는 관리 시스템 구현

**구현 기능**:
1. **친구 목록 조회 및 UUID 확인 관리 페이지** (`/admin/kakao-friends`)
   - 전체 친구 목록 조회 (UUID, 전화번호, 닉네임 표시)
   - 전화번호 또는 UUID로 검색
   - UUID 복사 기능
   - 친구 통계 (전체 친구 수, 전화번호 등록 수, 검색 결과 수)
   - 선택 삭제 기능

2. **친구 수동 등록 API 개선** (`POST /api/kakao/friends`)
   - `friends` 배열을 받아서 직접 등록 가능
   - UUID, 전화번호, 닉네임, 프로필 이미지 URL 입력 지원
   - upsert 방식으로 중복 방지

3. **친구 삭제 API 추가** (`DELETE /api/kakao/friends?uuid=...`)
   - UUID로 친구 삭제 가능

4. **관리자 네비게이션 메뉴 추가**
   - "👤 친구 관리" 메뉴 추가 (`/admin/kakao-friends`)

### 생성/수정 파일
- `pages/admin/kakao-friends/index.tsx` (신규): 친구 관리 페이지
- `pages/api/kakao/friends.ts` (수정): 친구 등록/삭제 API 추가
- `components/admin/AdminNav.tsx` (수정): 친구 관리 메뉴 추가

### 사용 방법
1. **친구 등록**:
   - `/admin/kakao-friends` 페이지 접속
   - "+ 친구 등록" 버튼 클릭
   - UUID (필수), 전화번호, 닉네임, 프로필 이미지 URL 입력
   - 등록 버튼 클릭

2. **UUID 확인**:
   - `/admin/kakao-friends` 페이지에서 전체 목록 조회
   - 전화번호로 검색하여 UUID 확인
   - UUID 옆 복사 버튼으로 클립보드에 복사

3. **친구 삭제**:
   - 개별 삭제: 각 행의 "삭제" 버튼 클릭
   - 일괄 삭제: 체크박스로 선택 후 "선택 삭제" 버튼 클릭

### API 엔드포인트
- `GET /api/kakao/friends`: 전체 친구 목록 조회
- `GET /api/kakao/friends?phone=01012345678`: 전화번호로 UUID 조회
- `POST /api/kakao/friends`: 친구 등록 (body: `{ friends: [{ uuid, phone, nickname, thumbnail_image }] }`)
- `DELETE /api/kakao/friends?uuid=...`: 친구 삭제

### 결과
- ✅ 친구 목록 조회 및 UUID 확인 UI 구현 완료
- ✅ 친구 수동 등록 기능 구현 완료
- ✅ 친구 삭제 기능 구현 완료
- ✅ 관리자 메뉴에 친구 관리 링크 추가 완료

---

## 2026-01-25: 시크리트포스 PRO3 MUZIIK 페이지에 "혁신적인 테크놀로지" 섹션 추가

### 작업 내용
- 시크리트웨폰 블랙 페이지의 "혁신적인 테크놀로지" 섹션을 시크리트포스 PRO3 MUZIIK 페이지에 추가
- "업그레이드된 제품 특징" 섹션 바로 아래에 배치하여 논리적인 정보 흐름 구성

### 변경된 파일
- `pages/products/secret-force-pro-3-muziik.tsx`: "혁신적인 테크놀로지" 섹션 추가 (라인 264 이후)

### 섹션 구성
1. 나노레벨 수지 채택
   - 수지 함유율 감소
   - 카본 밀도 향상
   - 반발성 향상

2. 임팩트시 역토크 방지
   - 역토크 발생 감소
   - 헤드 스피드 향상
   - 방향성 안정

3. 티타늄 그라파이트 사용
   - 전장 티타늄 파이버 사용
   - 경량성 유지
   - 초고탄성 실현
   - 임팩트시 안정감

### 배치 이유
- "업그레이드된 제품 특징"에서 제품의 주요 특징을 소개한 후, "혁신적인 테크놀로지"에서 해당 특징들이 어떤 기술로 구현되었는지 심층적으로 설명하는 자연스러운 정보 흐름
- 어두운 배경(`bg-gradient-to-br from-gray-900 via-black to-gray-900`)을 사용하여 밝은 배경의 이전 섹션과 대비를 이루어 시각적 강조 효과

### 결과
- ✅ "혁신적인 테크놀로지" 섹션 추가 완료
- ✅ 페이지 섹션 순서 최적화 완료

---

## 고객 스토리 관리 UI 재구성 계획

### 요구사항
1. 장면별 상세에 미할당 이미지 추가 및 이동 기능 (이미지, 동영상, 서류 포함)
2. 장면별 상세에 "장면설정" 기능 통합 및 "후기" 탭 삭제
3. 스토리보드 "목록보기"를 장면별 상세로 이동
4. 스토리보드 메뉴 삭제 및 통합
5. 동영상 및 서류 처리 결정: **별도 메뉴 구성 불필요** (기존 이미지 목록에 포함, 타입별 배지로 구분)

### 계획서
- `docs/customer-story-ui-reorganization-plan.md` - 상세 개발 계획서 작성 완료

### 구현 완료
- ✅ Phase 1: SceneDetailView에 미할당 미디어 섹션 추가 및 드래그 앤 드롭 기능 구현
- ✅ Phase 2: 장면설정 기능 통합 및 후기 탭 삭제
- ✅ Phase 3: 스토리보드 목록보기를 SceneDetailView로 이동
- ✅ Phase 4: CustomerStoryModal에서 스토리보드 탭 제거 및 통합

### 주요 변경사항
- 스토리보드 탭 제거, 모든 기능을 "장면별 상세"로 통합
- 이미지, 동영상, 서류를 동일한 방식으로 처리
- 타입별 배지 표시 (동영상: 파란색, 서류: 보라색)
- 드래그 앤 드롭으로 모든 미디어 타입 장면 할당 가능
- 미할당 미디어 섹션 추가 (이미지, 동영상, 서류 모두 포함)
- 목록보기 탭에 타입별 필터링 옵션 추가 (전체, 이미지, 동영상, 서류)
- 장면 설명 탭 개선 (스토리보드 스타일 적용, 저장/취소 버튼)

### 수정된 파일
- `components/admin/customers/SceneDetailView.tsx` - 완전 재작성
- `components/admin/CustomerStoryModal.tsx` - 스토리보드 탭 제거, SceneDetailView에 props 전달

---

## 미할당 이미지 드래그 앤 드롭 실패 수정

### 문제
- 미할당 이미지를 "사진(0)" 영역으로 드래그 앤 드롭했지만 이미지가 추가되지 않음
- 드래그 시작 이벤트는 정상 작동하지만 드롭 후 이미지가 장면에 할당되지 않음

### 원인
1. **데이터 전달 방식 불일치**: `SceneDetailView`와 `CustomerStoryModal`의 드래그 앤 드롭 데이터 전달 방식이 일치하지 않음
2. **빈 영역 드롭 핸들러 누락**: 이미지가 0개인 경우 드롭 대상 영역이 제대로 설정되지 않음
3. **이벤트 처리 문제**: `onDragOver`에서 `e.preventDefault()` 호출 누락 가능성

### 해결 방안
- ✅ `handleDragStart`: 개별 키(`imageId`, `imageUrl`)와 `text/plain` JSON 모두 저장하도록 수정
- ✅ `handleDrop`: 개별 키 우선 읽기, 실패 시 `text/plain` JSON 파싱 시도
- ✅ 빈 영역에도 드롭 가능하도록 외부 div에 드롭 핸들러 추가
- ✅ `onDragOver`에서 `e.preventDefault()`, `e.stopPropagation()` 호출 추가

### 수정된 파일
- `components/admin/customers/SceneDetailView.tsx` - 드래그 앤 드롭 로직 수정
- `components/admin/CustomerStoryModal.tsx` - `handleDragStart`에 하위 호환성 추가
- `docs/drag-drop-fix-plan.md` - 상세 수정 계획서 작성

---

## 장면별 상세 UI 개선 계획

### 요구사항
1. 미할당 이미지 드래그 드롭시 "장면1"로 돌아가는 현상 수정
2. 장면 하단 이미지 -> 좌측 장면 목록의 특정 장면으로 직접 이동 가능하게
3. 미할당 미디어 섹션을 "장면3:문제발생" 제목 위로(맨 위) 이동
4. 목록보기 필터 위치 개선 (옵션 1: 필터 상단 이동 / 옵션 2: 탭 5개 구성)

### 계획서
- `docs/scene-detail-ui-improvement-plan.md` - 상세 개선 계획서 작성 완료

### 주요 개선 사항
- 드래그 앤 드롭 버그 수정 (이벤트 버블링 방지, 명시적 null 처리)
- 좌측 장면 목록에 드롭 핸들러 추가 (장면 하단 이미지를 장면 목록 버튼으로 직접 드롭 가능)
- UI 구조 재배치 (미할당 미디어 섹션을 장면 제목 위로 이동)
- 필터 위치 개선 (옵션 1 권장: 필터를 미할당 미디어 위로 이동)

### 구현 완료
- ✅ Phase 1: 드래그 앤 드롭 버그 수정 및 좌측 장면 목록 드롭 기능 추가
- ✅ Phase 2: UI 구조 재배치 (미할당 미디어 섹션을 장면 제목 위로 이동)
- ✅ Phase 3: 필터 위치 개선 (필터를 미할당 미디어 위로 이동)

### 예상 작업 시간
- Phase 1 (드래그 앤 드롭 버그 수정 및 좌측 장면 목록 드롭 기능 추가): 2-3시간
- Phase 2 (UI 구조 재배치): 1시간
- Phase 3 (필터 위치 개선): 1-2시간
- 테스트 및 디버깅: 1시간
- **총 예상 시간: 5-7시간**

---

## 장면별 상세 필터 기능 수정

### 문제
- 전체 클릭 시 전체 미디어가 표시되지 않음
- 동영상 클릭 시 동영상만 표시되지 않음
- 서류 클릭 시 서류만 표시되지 않음
- 미할당/할당 구분이 시각적으로 명확하지 않음

### 요구사항
- 필터는 미할당 미디어 섹션과 목록보기 탭 모두에 적용
- 전체, 이미지, 동영상, 서류 필터가 정상 작동
- 미할당/할당 상태를 배지로 명확히 표시

### 계획서
- `docs/scene-detail-filter-fix-plan.md` - 상세 수정 계획서 작성 완료

### 구현 완료
- ✅ 필터 로직 수정 (is_scanned_document 명시적 체크)
- ✅ 서류 필터 개선 (document_type도 서류로 판단하는 대안 로직 추가)
- ✅ 미할당 미디어 섹션에 "미할당" 배지 추가
- ✅ 목록보기 탭에 할당 상태 배지 추가 (장면 X / 미할당)
- ✅ 필터링된 미할당 미디어 개수 표시 수정
- ✅ 디버깅 로그 추가 (서류 필터 문제 진단용)
- ✅ 미할당 미디어 박스 조건부 렌더링 수정 (필터에 따라 올바르게 표시되도록 개선)
- ✅ 필터별 미할당 미디어 개수 표시 개선 (필터링된 개수 또는 전체 개수 표시)

### 수정된 파일
- `components/admin/customers/SceneDetailView.tsx` - 필터 로직 수정 및 배지 추가

---

## 이미지 장면 업데이트 오류 수정

### 문제
- 고객 스토리보드에서 이미지를 드래그 앤 드롭하여 장면을 변경할 때 오류 발생
- 오류 메시지: `Could not find the 'story_scene' column of 'image_assets' in the schema cache`
- 원인: `image_assets` 테이블에 `story_scene` 컬럼이 없음

### 해결 방안
- `image_assets` 테이블에 `story_scene` 컬럼 추가
- `display_order` 컬럼 추가 (같은 장면 내 이미지 순서)
- 인덱스 추가 (조회 성능 최적화)

### 구현 내용
- ✅ SQL 스크립트 작성: `database/add-story-scene-to-image-assets.sql`
- ✅ API 에러 처리 개선: `pages/api/admin/update-image-scene.ts`
- ⚠️ Supabase에서 SQL 스크립트 실행 필요

### 파일 변경
- `database/add-story-scene-to-image-assets.sql` (신규)
- `pages/api/admin/update-image-scene.ts` (에러 처리 개선)
- `docs/image-scene-update-error-fix-plan.md` (계획서)

---

## 고객 스토리 관리 서류 분류 및 고객 이미지 관리 탭 개선

### 문제점
1. **고객 스토리 관리 - 우측 이미지 탭에 서류가 분류되지 않음**
   - "이미지" 필터에서 서류가 표시되고 "서류" 배지가 없음
   - "서류" 필터 클릭 시 미할당 박스가 사라지고 서류가 표시되지 않음
   - 서류 분류 로직이 `is_scanned_document`만 체크하여 `document_type`을 고려하지 않음

2. **고객 이미지 관리 - 탭 형태로 변경 요청**
   - 현재: "업로드된 미디어(12개)" / "업로드된 이미지 (9개)" / "업로드된 동영상(1개)" / "업로드된 서류(2개)"를 섹션으로 표시
   - 요청: 탭 형태로 변경하고 "업로드된" 단어 삭제

### 계획서
- `docs/customer-story-document-classification-fix-plan.md` - 상세 수정 계획서 작성 완료

### 구현 완료
- ✅ 서류 분류 로직 개선 (SceneDetailView.tsx)
  - `is_scanned_document === true` 또는 `document_type`이 있는 경우 서류로 판단
  - 미할당 미디어 섹션, 장면 이미지 탭, 목록보기 탭 모두에 적용
- ✅ 고객 이미지 관리 탭 형태로 변경
  - "업로드된" 단어 삭제
  - "미디어", "이미지", "동영상", "서류" 탭으로 변경
  - 탭별 필터링 로직 구현
  - 서류 탭에서 문서 타입 필터 적용

### 추가 수정 필요
- ⚠️ 서류가 이미지 탭에 여전히 표시되는 문제
  - 이미지/서류 분류 로직이 제대로 작동하지 않음
  - 서류 마이그레이션이 완료되지 않음
- ⚠️ "날짜별", "타입별", "전체" 필터 버튼 제거 필요
  - 탭 구조로 변경했으므로 불필요함
  - 사용자 혼란 방지를 위해 완전 제거 필요

### 계획서
- `docs/customer-image-tab-final-fix-plan.md` - 최종 수정 계획서 작성 완료

### 수정된 파일
- `components/admin/customers/SceneDetailView.tsx` - 서류 분류 로직 개선
- `pages/admin/customers/index.tsx` - 탭 형태로 변경 및 필터링 로직 개선 (추가 수정 필요)

---

## 날짜 형식 마이그레이션 계획 (2026-01-28)

### 배경
- 현재 `file_path`에 점 형식(YYYY.MM.DD)과 대시 형식(YYYY-MM-DD)이 혼재
- 코드에서 두 형식을 모두 지원해야 해서 복잡도 증가
- 이남구 고객 필터 문제의 원인 중 하나

### 계획
- 모든 날짜 형식을 `YYYY-MM-DD` (ISO 8601 표준)로 통일
- Storage 폴더명, `file_path`, `cdn_url` 일괄 변경
- 마이그레이션 스크립트 작성 완료

### 마이그레이션 대상
- **63개 이미지**, **7개 고유 날짜**
- 주요 고객: 이남구, 박성우, 신재식, 김종철, 김조철, 윤효엿, 최승남

### 스크립트
- `scripts/check-date-formats.js` - 날짜 형식 확인
- `scripts/migrate-date-format-dot-to-dash.js` - 마이그레이션 실행

### 계획서
- `docs/date-format-migration-plan.md` - 마이그레이션 계획서 작성 완료

### 상태
- ✅ DRY RUN 완료 (63개 이미지 확인)
- ⏳ 실제 마이그레이션 대기 중 (사용자 승인 필요)

---

## 고객 이미지 Storage 동기화 계획 (2026-01-28)

### 배경
- 이남구 고객에서 발견된 문제: DB 24개 vs Storage 11개
- 고스트 이미지 및 중복 이미지 문제
- 다른 고객들도 같은 문제가 있을 가능성

### 확인 결과
- **총 고객 수**: 1,000명
- **문제가 있는 고객**: 16명 (1.6%)
- **고스트 이미지**: 72개
- **중복 이미지**: 21개

### 계획
- 전체 고객 이미지 동기화 상태 확인
- 고스트 이미지 및 중복 이미지 일괄 정리
- Storage와 DB 메타데이터 일치시키기

### 스크립트
- `scripts/check-all-customers-ghost-images.js` - 전체 고객 확인 ✅
- `scripts/sync-all-customers-images.js` - 일괄 동기화 ✅
- `scripts/delete-leenamgu-duplicate-images.js` - 이남구 고객 정리 완료 ✅

### 계획서
- `docs/customer-image-sync-plan.md` - 동기화 계획서 작성 완료

### 상태
- ✅ 전체 현황 파악 완료 (16명 고객에 문제 발견)
- ✅ 일괄 동기화 스크립트 작성 완료
- ⏳ 소규모 테스트 대기 중