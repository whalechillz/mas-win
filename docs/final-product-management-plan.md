# 제품 관리 시스템 최종 계획

## 📋 개요

드라이버 제품과 굿즈/사은품을 통합 관리하고, 이미지 타입별(detail, composition, gallery)로 분리하여 관리하는 시스템 구축 계획입니다.

---

## 🎯 목표

1. **통합 제품 관리**: 드라이버와 굿즈를 하나의 시스템에서 관리
2. **이미지 타입별 분리**: 상세페이지용, 합성용, 갤러리 이미지를 명확히 구분
3. **확장성**: PG 연동 및 재고 관리 확장 가능한 구조
4. **데이터 일관성**: 하드코딩 제거, 모든 제품 정보를 데이터베이스에 저장

---

## 📁 Supabase Storage 구조

### 제품별 폴더 구조

```
originals/products/
├── {product-slug}/              # 드라이버 제품
│   ├── detail/                  # 상세페이지용 이미지 (배경 있는 이미지)
│   ├── composition/             # 합성용 참조 이미지 (배경 없는 순수 제품)
│   └── gallery/                 # AI 합성 결과 이미지
│
└── goods/                       # 굿즈/사은품
    ├── {product-slug}/
    │   ├── detail/
    │   ├── composition/
    │   └── gallery/
    └── ...
```

### 예시

**드라이버 제품:**
- `originals/products/gold2-sapphire/detail/` - 상세페이지 이미지
- `originals/products/gold2-sapphire/composition/` - 합성용 이미지
- `originals/products/gold2-sapphire/gallery/` - AI 생성 이미지

**굿즈 제품:**
- `originals/products/goods/bucket-hat-muziik-1/detail/` - 상세페이지 이미지
- `originals/products/goods/bucket-hat-muziik-1/composition/` - 합성용 이미지
- `originals/products/goods/bucket-hat-muziik-1/gallery/` - AI 생성 이미지

---

## 🗄️ 데이터베이스 스키마

### products 테이블 확장

```sql
-- 제품 타입 구분
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type VARCHAR(50) DEFAULT 'goods';
-- 'goods', 'driver', 'component'

-- 드라이버 제품 필드
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS subtitle VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS badge_left VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS badge_right VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS badge_left_color VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS badge_right_color VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS border_color VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS specifications JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- 이미지 관리 (타입별 분리)
ALTER TABLE products ADD COLUMN IF NOT EXISTS detail_images JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS composition_images JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]';

-- PG 연동 필드 (추후 확장)
ALTER TABLE products ADD COLUMN IF NOT EXISTS pg_product_id VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS pg_price_id VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS payment_enabled BOOLEAN DEFAULT false;

-- 재고 관리 확장 (추후 확장)
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS max_stock_level INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS auto_reorder BOOLEAN DEFAULT false;
```

---

## 🔄 관리 페이지 역할 분담

### 1. `/admin/products` - 통합 제품 관리

**역할**: 모든 제품(드라이버 + 굿즈)의 기본 정보 및 상세페이지 이미지 관리

**기능**:
- 제품 타입별 필터링 (드라이버 / 굿즈)
- 제품 기본 정보 관리 (이름, 가격, 카테고리 등)
- **상세페이지 이미지** (`detail`) 업로드/삭제/순서 변경
- 재고 관리 (굿즈만)
- PG 연동 설정 (추후)

**이미지 업로드 경로**:
- 드라이버: `originals/products/{product-slug}/detail/`
- 굿즈: `originals/products/goods/{product-slug}/detail/`

---

### 2. `/admin/product-composition` - 합성용 이미지 관리

**역할**: AI 이미지 합성에 사용할 참조 이미지 관리

**기능**:
- **합성용 이미지** (`composition`) 업로드/삭제
- 제품별 합성 타겟 설정 (hands, head, body 등)
- 참조 이미지 관리

**이미지 업로드 경로**:
- 드라이버: `originals/products/{product-slug}/composition/`
- 굿즈: `originals/products/goods/{product-slug}/composition/`

**중요**: 
- ✅ **제품별 폴더로 업로드됨** (`getProductStoragePath` 함수 사용)
- ✅ 갤러리 구조와 Supabase 구조 모두 제품별 폴더 사용
- ✅ `imageType` 파라미터로 `composition` 지정 시 합성용 폴더에 저장

---

### 3. `/admin/ai-image-generator` - 갤러리 이미지 생성

**역할**: AI 합성 결과 이미지 자동 저장

**기능**:
- 제품 합성 실행
- 합성 결과를 **갤러리 폴더** (`gallery`)에 자동 저장
- 저장된 이미지 조회

**이미지 저장 경로**:
- 드라이버: `originals/products/{product-slug}/gallery/composed-{productId}-{timestamp}.png`
- 굿즈: `originals/products/goods/{product-slug}/gallery/composed-{productId}-{timestamp}.png`

---

## 📤 이미지 업로드 플로우

### 제품 합성 관리에서 합성용 이미지 업로드

```typescript
// pages/admin/product-composition.tsx

const handleImageUpload = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('productSlug', formData.slug);      // 예: 'gold2-sapphire'
  formData.append('category', formData.category);     // 예: 'driver'
  formData.append('imageType', 'composition');         // ✅ 합성용으로 지정

  const response = await fetch('/api/admin/upload-product-image', {
    method: 'POST',
    body: formData,
  });
  
  // 결과: originals/products/gold2-sapphire/composition/image.webp
};
```

---

## 🗂️ 데이터 마이그레이션 계획

### Phase 1: 드라이버 제품 데이터베이스 저장

**현재 상태**: `pages/index.js`에 하드코딩된 8개 드라이버 제품

**마이그레이션 대상**:
1. 시크리트포스 골드 2 MUZIIK (`gold2-sapphire`)
2. 시크리트웨폰 블랙 MUZIIK (`black-beryl`)
3. 시크리트포스 PRO 3 MUZIIK (`pro3-muziik`)
4. 시크리트포스 골드 2 (`gold2`)
5. 시크리트포스 PRO 3 (`pro3`)
6. 시크리트포스 V3 (`v3`)
7. 시크리트웨폰 블랙 (`weapon-black` → `black-weapon`)
8. 시크리트웨폰 골드 4.1 (`weapon-gold-4-1` → `gold-weapon4`)

---

## 📊 구현 단계

### Phase 1: 데이터베이스 확장 (완료)
- [x] `products` 테이블에 드라이버 제품 필드 추가
- [x] 이미지 타입별 배열 필드 추가

### Phase 2: 제품 합성 관리 수정 (진행 중)
- [ ] 제품 합성 관리 페이지에서 `imageType='composition'` 파라미터 추가
- [ ] 합성용 이미지가 올바른 폴더에 저장되는지 검증

### Phase 3: 드라이버 제품 마이그레이션 (예정)
- [ ] 드라이버 제품 8개 데이터베이스에 저장
- [ ] 이미지 경로를 새 구조로 업데이트

### Phase 4: 통합 관리 페이지 (예정)
- [ ] 제품 타입별 필터 추가
- [ ] 드라이버 제품 관리 기능 추가
- [ ] 이미지 타입별 탭 구조 구현

### Phase 5: 메인 페이지 연동 (예정)
- [ ] 하드코딩 제거
- [ ] 데이터베이스에서 제품 로드
- [ ] 이미지 경로를 Supabase Storage URL로 변경

---

## ✅ 확인 사항

### Q: 제품 합성 관리에서 이미지를 업로드하면 제품별 폴더로 저장되나요?

**A: 네, 맞습니다.**

1. **업로드 API**: `/api/admin/upload-product-image.js`
   - `getProductStoragePath(productSlug, category, imageType)` 함수 사용
   - `imageType='composition'` 전달 시 → `originals/products/{product-slug}/composition/` 폴더에 저장

2. **제품 합성 관리 페이지**: `/admin/product-composition`
   - 이미지 업로드 시 `imageType='composition'` 파라미터 전달 필요
   - 현재 코드 수정 필요

3. **갤러리 구조**:
   - Supabase Storage: `originals/products/{product-slug}/composition/`
   - 갤러리 관리 페이지: 동일한 구조로 표시

---

## 🎯 최종 구조 요약

### 이미지 관리 흐름

```
[관리자 페이지]
    │
    ├─ /admin/products
    │   └─ 상세페이지 이미지 (detail) 업로드
    │       └─ originals/products/{slug}/detail/
    │
    ├─ /admin/product-composition
    │   └─ 합성용 이미지 (composition) 업로드
    │       └─ originals/products/{slug}/composition/
    │
    └─ /admin/ai-image-generator
        └─ AI 합성 결과 (gallery) 자동 저장
            └─ originals/products/{slug}/gallery/
```

### 데이터베이스 구조

```sql
products 테이블
├─ product_type: 'driver' | 'goods'
├─ detail_images: JSONB[]      -- 상세페이지 이미지 URL 배열
├─ composition_images: JSONB[]  -- 합성용 이미지 URL 배열
└─ gallery_images: JSONB[]      -- 갤러리 이미지 URL 배열
```

