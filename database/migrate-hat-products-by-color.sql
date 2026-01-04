-- 모자 제품 색상별 분리 마이그레이션
-- 1. products 테이블: 기존 제품 삭제, 새 제품 확인
-- 2. product_composition 테이블: 새 제품 생성

-- ============================================
-- 1. 현재 상태 확인
-- ============================================

-- 1-1. products 테이블 확인
SELECT 
  id,
  name,
  sku,
  slug,
  category,
  is_active,
  jsonb_array_length(COALESCE(gallery_images, '[]'::jsonb)) as gallery_count
FROM products
WHERE slug IN ('bucket-hat-muziik', 'golf-hat-muziik')
   OR sku IN ('BUCKET_HAT_MUZIIK', 'GOLF_HAT_MUZIIK', 'MZ_BUCKET_BLACK', 'MZ_BUCKET_WHITE', 'MZ_CAP_BLACK', 'MZ_CAP_WHITE', 'MZ_CAP_NAVY', 'MZ_CAP_BEIGE')
ORDER BY slug;

-- 1-2. product_composition 테이블 확인
SELECT 
  id,
  name,
  slug,
  category,
  is_active,
  product_id
FROM product_composition
WHERE slug IN ('bucket-hat-muziik', 'golf-hat-muziik', 'bucket-hat-muziik-black', 'bucket-hat-muziik-white', 'golf-hat-muziik-black', 'golf-hat-muziik-white', 'golf-hat-muziik-navy', 'golf-hat-muziik-beige')
ORDER BY slug;

-- ============================================
-- 2. products 테이블: 기존 제품 삭제 (외래키 제약 조건 고려)
-- ============================================

-- 2-0. product_composition의 product_id를 NULL로 설정 (참조 제거)
UPDATE product_composition
SET product_id = NULL,
    updated_at = NOW()
WHERE product_id IN (
  SELECT id FROM products 
  WHERE slug IN ('bucket-hat-muziik', 'golf-hat-muziik')
     OR sku IN ('BUCKET_HAT_MUZIIK', 'GOLF_HAT_MUZIIK')
);

-- 2-1. bucket-hat-muziik 제품 삭제
DELETE FROM products 
WHERE slug = 'bucket-hat-muziik' 
   OR sku = 'BUCKET_HAT_MUZIIK';

-- 2-2. golf-hat-muziik 제품 삭제
DELETE FROM products 
WHERE slug = 'golf-hat-muziik' 
   OR sku = 'GOLF_HAT_MUZIIK';

-- ============================================
-- 3. product_composition 테이블: 기존 제품 비활성화 및 새 제품 생성
-- ============================================

-- 3-1. 기존 제품 비활성화
UPDATE product_composition 
SET is_active = false,
    updated_at = NOW()
WHERE slug IN ('bucket-hat-muziik', 'golf-hat-muziik');

-- 3-2. 버킷햇 블랙 생성
INSERT INTO product_composition (
  name,
  slug,
  category,
  composition_target,
  image_url,
  reference_images,
  is_active,
  display_order,
  product_id
) VALUES (
  'MASSGOO × MUZIIK 스타일리시 버킷햇(블랙)',
  'bucket-hat-muziik-black',
  'hat',
  'head',
  'originals/goods/bucket-hat-muziik-black/composition/bucket-hat-black.webp',
  '[]'::jsonb,
  true,
  10,
  (SELECT id FROM products WHERE sku = 'MZ_BUCKET_BLACK' LIMIT 1)
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  composition_target = EXCLUDED.composition_target,
  product_id = EXCLUDED.product_id,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 3-3. 버킷햇 화이트 생성
INSERT INTO product_composition (
  name,
  slug,
  category,
  composition_target,
  image_url,
  reference_images,
  is_active,
  display_order,
  product_id
) VALUES (
  'MASSGOO × MUZIIK 스타일리시 버킷햇(화이트)',
  'bucket-hat-muziik-white',
  'hat',
  'head',
  'originals/goods/bucket-hat-muziik-white/composition/bucket-hat-white.webp',
  '[]'::jsonb,
  true,
  11,
  (SELECT id FROM products WHERE sku = 'MZ_BUCKET_WHITE' LIMIT 1)
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  composition_target = EXCLUDED.composition_target,
  product_id = EXCLUDED.product_id,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 3-4. 골프모자 블랙 생성
INSERT INTO product_composition (
  name,
  slug,
  category,
  composition_target,
  image_url,
  reference_images,
  is_active,
  display_order,
  product_id
) VALUES (
  'MASSGOO × MUZIIK 콜라보 골프모자 (블랙)',
  'golf-hat-muziik-black',
  'hat',
  'head',
  'originals/goods/golf-hat-muziik-black/composition/golf-hat-black.webp',
  '[]'::jsonb,
  true,
  12,
  (SELECT id FROM products WHERE sku = 'MZ_CAP_BLACK' LIMIT 1)
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  composition_target = EXCLUDED.composition_target,
  product_id = EXCLUDED.product_id,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 3-5. 골프모자 화이트 생성
INSERT INTO product_composition (
  name,
  slug,
  category,
  composition_target,
  image_url,
  reference_images,
  is_active,
  display_order,
  product_id
) VALUES (
  'MASSGOO × MUZIIK 콜라보 골프모자 (화이트)',
  'golf-hat-muziik-white',
  'hat',
  'head',
  'originals/goods/golf-hat-muziik-white/composition/golf-hat-white.webp',
  '[]'::jsonb,
  true,
  13,
  (SELECT id FROM products WHERE sku = 'MZ_CAP_WHITE' LIMIT 1)
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  composition_target = EXCLUDED.composition_target,
  product_id = EXCLUDED.product_id,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 3-6. 골프모자 네이비 생성
INSERT INTO product_composition (
  name,
  slug,
  category,
  composition_target,
  image_url,
  reference_images,
  is_active,
  display_order,
  product_id
) VALUES (
  'MASSGOO × MUZIIK 콜라보 골프모자 (네이비)',
  'golf-hat-muziik-navy',
  'hat',
  'head',
  'originals/goods/golf-hat-muziik-navy/composition/golf-hat-navy.webp',
  '[]'::jsonb,
  true,
  14,
  (SELECT id FROM products WHERE sku = 'MZ_CAP_NAVY' LIMIT 1)
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  composition_target = EXCLUDED.composition_target,
  product_id = EXCLUDED.product_id,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 3-7. 골프모자 베이지 생성
INSERT INTO product_composition (
  name,
  slug,
  category,
  composition_target,
  image_url,
  reference_images,
  is_active,
  display_order,
  product_id
) VALUES (
  'MASSGOO × MUZIIK 콜라보 골프모자 (베이지)',
  'golf-hat-muziik-beige',
  'hat',
  'head',
  'originals/goods/golf-hat-muziik-beige/composition/golf-hat-beige.webp',
  '[]'::jsonb,
  true,
  15,
  (SELECT id FROM products WHERE sku = 'MZ_CAP_BEIGE' LIMIT 1)
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  composition_target = EXCLUDED.composition_target,
  product_id = EXCLUDED.product_id,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================
-- 4. 최종 확인
-- ============================================

-- 4-1. product_composition 테이블 확인
SELECT 
  id,
  name,
  slug,
  category,
  is_active,
  product_id,
  (SELECT name FROM products WHERE id = product_id) as product_name,
  (SELECT sku FROM products WHERE id = product_id) as product_sku
FROM product_composition
WHERE slug IN ('bucket-hat-muziik-black', 'bucket-hat-muziik-white', 'golf-hat-muziik-black', 'golf-hat-muziik-white', 'golf-hat-muziik-navy', 'golf-hat-muziik-beige')
ORDER BY display_order;

