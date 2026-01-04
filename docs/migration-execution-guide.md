# 마이그레이션 실행 가이드

## ✅ 완료된 작업

### 1. 이미지 이동 완료
- ✅ 버킷햇: 7개 → 블랙, 8개 → 화이트
- ✅ 골프모자: 2개 → 베이지, 5개 → 화이트

### 2. SQL 파일 수정 완료
- ✅ `database/convert-image-urls-to-full-urls.sql` - 타입 에러 수정
- ✅ `database/migrate-hat-products-by-color.sql` - 외래키 제약 조건 에러 수정

## 📋 Supabase SQL Editor에서 실행 순서

### Step 1: 이미지 URL 전체 URL로 변환

**파일**: `database/convert-image-urls-to-full-urls.sql`

**실행 방법**:
1. Supabase Dashboard → SQL Editor 열기
2. `database/convert-image-urls-to-full-urls.sql` 파일 내용 복사
3. SQL Editor에 붙여넣기
4. "Run" 버튼 클릭

**주요 변경사항**:
- `reference_images` 업데이트 시 `jsonb_array_elements_text` → `jsonb_array_elements`로 변경
- 모든 CASE 분기가 `jsonb` 타입 반환하도록 수정

### Step 2: 제품 색상별 분리 마이그레이션

**파일**: `database/migrate-hat-products-by-color.sql`

**실행 방법**:
1. SQL Editor에서 새 쿼리 탭 열기
2. `database/migrate-hat-products-by-color.sql` 파일 내용 복사
3. SQL Editor에 붙여넣기
4. "Run" 버튼 클릭

**주요 변경사항**:
- `product_composition`의 `product_id`를 먼저 NULL로 설정하여 외래키 제약 조건 해결
- 그 다음 `products` 테이블에서 기존 제품 삭제
- 색상별 `product_composition` 항목 생성

## ⚠️ 주의사항

1. **외래키 제약 조건**: 
   - `product_composition` 테이블이 `products` 테이블을 참조하므로, 삭제 전에 참조를 먼저 제거해야 합니다.
   - 수정된 SQL은 이미 이 순서를 반영했습니다.

2. **이미지 URL 형식**:
   - 모든 이미지 URL이 전체 Supabase URL로 변환됩니다.
   - 형식: `https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/originals/...`

3. **제품 삭제**:
   - `bucket-hat-muziik`, `golf-hat-muziik` 제품이 삭제됩니다.
   - 색상별 제품 (`bucket-hat-muziik-black`, `bucket-hat-muziik-white` 등)은 새로 생성됩니다.

## 🔍 실행 후 확인

### 1. product_composition 테이블 확인
```sql
SELECT 
  id,
  name,
  slug,
  category,
  is_active,
  product_id,
  image_url
FROM product_composition
WHERE slug IN (
  'bucket-hat-muziik-black', 
  'bucket-hat-muziik-white', 
  'golf-hat-muziik-black', 
  'golf-hat-muziik-white', 
  'golf-hat-muziik-navy', 
  'golf-hat-muziik-beige'
)
ORDER BY display_order;
```

### 2. 이미지 URL 형식 확인
```sql
SELECT 
  slug,
  image_url,
  CASE 
    WHEN image_url LIKE 'https://%' THEN '✅ 전체 URL'
    ELSE '⚠️ 상대 경로'
  END as url_status
FROM product_composition
WHERE category = 'hat'
ORDER BY display_order;
```

### 3. products 테이블 확인
```sql
SELECT 
  id,
  name,
  sku,
  slug,
  category,
  is_active
FROM products
WHERE sku IN ('MZ_BUCKET_BLACK', 'MZ_BUCKET_WHITE', 'MZ_CAP_BLACK', 'MZ_CAP_WHITE', 'MZ_CAP_NAVY', 'MZ_CAP_BEIGE')
ORDER BY sku;
```

## 📁 이미지 폴더 구조 (최종)

```
originals/goods/
├── bucket-hat-muziik-black/
│   ├── gallery/     ✅ 7개 이미지
│   └── composition/ ✅ 완료
├── bucket-hat-muziik-white/
│   ├── gallery/     ✅ 8개 이미지
│   └── composition/ ✅ 완료
├── golf-hat-muziik-black/
│   ├── gallery/     (비어있음)
│   └── composition/ ✅ 완료
├── golf-hat-muziik-white/
│   ├── gallery/     ✅ 5개 이미지
│   └── composition/ ✅ 완료
├── golf-hat-muziik-navy/
│   ├── gallery/     (비어있음)
│   └── composition/ ✅ 완료
└── golf-hat-muziik-beige/
    ├── gallery/     ✅ 2개 이미지
    └── composition/ ✅ 완료
```

## 🎯 다음 단계

1. ✅ 이미지 이동 완료
2. ⏳ SQL 마이그레이션 실행 (Supabase에서)
3. ⏳ Survey 페이지 테스트
4. ⏳ 제품 합성 관리 페이지 테스트

