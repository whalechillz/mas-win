# 📊 갤러리 데이터베이스 스키마 중요 사항

## ✅ 완료된 작업 (2025-11-02)

### image_metadata 테이블 확장 완료
- **10개 새 컬럼 추가 완료**
  - `original_path` (TEXT) - 실제 Storage 경로
  - `internal_id` (VARCHAR(255)) - 내부 고유 ID (UUID)
  - `"references"` (JSONB) - 참조 정보 배열 (예약어이므로 따옴표 사용)
  - `blog_posts` (INTEGER[]) - 연결된 블로그 글 ID 배열
  - `variants` (JSONB) - 베리에이션 경로 정보
  - `usage_type` (VARCHAR(50)) - 사용 유형 (product_studio, customer_testimonial 등)
  - `product_slug` (VARCHAR(100)) - 제품 이미지용
  - `customer_id` (VARCHAR(50)) - 고객 콘텐츠용
  - `consent_status` (VARCHAR(20)) - 고객 동의 상태
  - `privacy_level` (VARCHAR(20)) - 프라이버시 레벨

## 🚨 중요 사항

### `references` 컬럼 사용 시 주의사항

**문제**: `references`는 PostgreSQL의 예약어(reserved keyword)입니다.

**해결책**: 항상 따옴표로 감싸서 사용해야 합니다.

#### ✅ 올바른 사용법

```sql
-- 컬럼 생성
ALTER TABLE image_metadata
ADD COLUMN IF NOT EXISTS "references" JSONB DEFAULT '[]';

-- 컬럼 조회
SELECT "references" FROM image_metadata;

-- 컬럼 업데이트
UPDATE image_metadata 
SET "references" = '[{"type": "blog", "post_id": 309}]' 
WHERE id = 1;

-- 함수 내 사용
CREATE OR REPLACE FUNCTION update_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- NEW."references" 사용
  SELECT COUNT(*) FROM jsonb_array_elements(NEW."references");
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거
CREATE TRIGGER trigger_update
  AFTER UPDATE OF "references" ON image_metadata
  FOR EACH ROW
  WHEN (OLD."references" IS DISTINCT FROM NEW."references")
  EXECUTE FUNCTION update_usage();

-- 주석
COMMENT ON COLUMN image_metadata."references" IS '참조 정보 배열';
```

#### ❌ 잘못된 사용법

```sql
-- 따옴표 없이 사용하면 에러 발생
ALTER TABLE image_metadata
ADD COLUMN IF NOT EXISTS references JSONB DEFAULT '[]';  -- ❌ 에러!

-- 함수 내에서도 따옴표 필요
IF v_image.references IS NOT NULL THEN  -- ❌ 에러!
```

#### JavaScript/Supabase 클라이언트에서 사용

```javascript
// Supabase 클라이언트에서 사용 시
const { data } = await supabase
  .from('image_metadata')
  .select('id, "references", blog_posts')  // 따옴표 사용
  .eq('id', 1);

// 업데이트 시
await supabase
  .from('image_metadata')
  .update({ "references": [{ type: 'blog', post_id: 309 }] })  // 따옴표 사용
  .eq('id', 1);
```

## 📝 파일 업데이트 내역

### database/gallery-storage-schema.sql
- ✅ `ADD COLUMN IF NOT EXISTS "references"` 수정 완료
- ✅ 함수 내 `NEW."references"`, `OLD."references"` 수정 완료
- ✅ 트리거 `AFTER UPDATE OF "references"` 수정 완료
- ✅ `COMMENT ON COLUMN image_metadata."references"` 수정 완료

## 🧪 확인 방법

### 컬럼 확인
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'image_metadata'
  AND column_name = 'references';
```

### 값 확인
```sql
SELECT id, "references" FROM image_metadata LIMIT 10;
```

## 📚 관련 문서
- `docs/gallery-architecture-principles.md` - 아키텍처 원칙
- `docs/gallery-migration-priority-plan.md` - 마이그레이션 계획
- `database/gallery-storage-schema.sql` - 전체 스키마

