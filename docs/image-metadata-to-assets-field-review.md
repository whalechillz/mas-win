# image_metadata → image_assets 마이그레이션 필드 검토

## 1. 저장 실패(405) 원인 및 수정

### 원인
- 고객 페이지에서 메타데이터 편집 후 **저장** 시 `PUT /api/admin/upload-customer-image` 호출
- `upload-customer-image.js`는 **GET**(목록 조회), **POST**(업로드)만 처리하고 **PUT** 미지원 → **405 Method Not Allowed**

### 수정 내용
- **파일**: `pages/api/admin/upload-customer-image.js`
- **PUT** 핸들러 추가: `imageId` + `metadata`(alt_text, keywords, title, description, ocr_text)로 `image_assets` 업데이트
- 요청 본문: `{ imageId: string|number, metadata: { alt_text?, keywords?, title?, description?, ocr_text? } }`
- 응답: `{ success: true, image: updatedRow }` / 실패 시 400·404·500

---

## 2. image_metadata vs image_assets 필드 매핑 (개별 저장·조회 기준)

### 2.1 공통 식별·URL
| image_metadata (구) | image_assets (현) | 비고 |
|--------------------|------------------|------|
| id (SERIAL) | id (UUID) | 마이그레이션 시 매핑 필요 |
| image_url | cdn_url | 동일 의미, 개별 저장 시 사용 |

### 2.2 파일·경로
| image_metadata | image_assets | 비고 |
|----------------|--------------|------|
| (file_name 등) | filename | 필수 |
| - | original_filename | 필수 |
| folder_path / original_path | file_path | 경로 통합 |
| - | file_size, mime_type, format | 필수 |

### 2.3 메타데이터 (편집 모달에서 저장되는 항목)
| image_metadata | image_assets | 개별 저장 반영 |
|----------------|--------------|----------------|
| alt_text | alt_text | ✅ PUT upload-customer-image |
| title | title | ✅ PUT upload-customer-image |
| description | description | ✅ PUT upload-customer-image |
| tags / keywords | ai_tags (JSONB 배열) | ✅ PUT upload-customer-image (keywords → ai_tags) |
| - | ocr_text | ✅ PUT upload-customer-image |
| - | ocr_extracted, ocr_confidence, ocr_processed_at, ocr_fulltextannotation | API에서 선택적 사용 |

### 2.4 고객·스토리·분류 (마이그레이션·스키마 추가분)
| image_metadata | image_assets | 비고 |
|----------------|--------------|------|
| (고객 연결) | ai_tags `customer-{id}` | 고객 연결용 |
| story_scene | story_scene | add-story-scene-to-image-assets.sql |
| - | display_order | 동일 마이그레이션 |
| (대표 이미지) | is_customer_representative | add-customer-representative-image.sql |
| - | is_scanned_document, document_type | create-scanned-documents-schema.sql |

### 2.5 기타
| image_metadata | image_assets | 비고 |
|----------------|--------------|------|
| is_liked | is_liked | add-is-liked-column-to-image-assets.sql (마이그레이션 시 누락 가능성 문서화됨) |
| - | status, upload_source, created_at, updated_at | image_assets 기본 필드 |

---

## 3. 개별 저장 시 사용하는 API·필드 정리

| API | 메서드 | 식별자 | 업데이트 필드 (image_assets) |
|-----|--------|--------|------------------------------|
| /api/admin/upload-customer-image | PUT | imageId | alt_text, title, description, ai_tags, ocr_text, updated_at |
| /api/admin/image-metadata | PUT | imageName + imageUrl (cdn_url) | alt_text, title, description, ai_tags, ocr_* 등 |
| /api/admin/image-metadata | PATCH | imageId | story_scene, is_scene_representative 등 (image_assets에 컬럼 없으면 400 등 처리) |

- 고객 이미지 **메타데이터 편집 저장**은 위 PUT `/api/admin/upload-customer-image`만 사용하면 되며, 이제 405 없이 동작합니다.

---

## 4. 덤프 마이그레이션 시 점검 권장 사항

1. **식별자**: image_metadata.id → image_assets.id 로 직접 이전하지 않음 (SERIAL vs UUID). 프론트/API는 **image_assets.id(UUID)** 또는 **cdn_url** 기준 사용.
2. **is_liked**: 마이그레이션 스크립트에서 image_metadata.is_liked → image_assets.is_liked 반영 여부 확인 (URL 매칭: image_url = cdn_url).
3. **story_scene, display_order**: image_assets에 컬럼 추가 마이그레이션 적용 후, 기존 image_metadata 데이터 이전 여부 확인.
4. **고객 연결**: image_metadata에 customer 관련 컬럼이 있었다면, image_assets에서는 ai_tags `customer-{id}` 및 file_path(고객 폴더)로 보완되었는지 확인.

이 문서는 “저장 업데이트 실패(405)” 수정과, image_metadata → image_assets 전환 시 **개별 저장**에 쓰이는 필드를 기준으로 한 검토입니다.
