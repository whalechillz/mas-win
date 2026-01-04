-- 버킷햇 중복 제품 확인 및 정리
-- 1. product_composition 테이블에서 버킷햇 제품 확인
-- 2. products 테이블과 매칭 상태 확인
-- 3. 중복 제품 식별

-- ============================================
-- 1. product_composition 테이블: 버킷햇 제품 확인
-- ============================================

SELECT 
  pc.id,
  pc.name,
  pc.slug,
  pc.category,
  pc.is_active,
  pc.product_id,
  pc.image_url,
  pc.display_order,
  p.id as products_id,
  p.name as products_name,
  p.sku as products_sku,
  p.slug as products_slug
FROM product_composition pc
LEFT JOIN products p ON pc.product_id = p.id
WHERE pc.category = 'hat'
  AND (pc.name LIKE '%버킷%' OR pc.slug LIKE '%bucket%')
ORDER BY pc.display_order, pc.name;

-- ============================================
-- 2. products 테이블: 버킷햇 제품 확인
-- ============================================

SELECT 
  id,
  name,
  sku,
  slug,
  category,
  is_active,
  jsonb_array_length(COALESCE(gallery_images, '[]'::jsonb)) as gallery_count
FROM products
WHERE category = 'bucket_hat'
  OR sku LIKE '%BUCKET%'
ORDER BY slug;

-- ============================================
-- 3. 중복 제품 식별
-- ============================================
-- 
-- 구식 제품 (삭제 대상):
-- - "MASSGOO 버킷햇 (화이트)" (slug: hat-white-bucket)
-- - "MASSGOO 버킷햇 (블랙)" (slug: hat-black-bucket)
--
-- 새 제품 (유지):
-- - "MASSGOO × MUZIIK 스타일리시 버킷햇(화이트)" (slug: bucket-hat-muziik-white, product_id → MZ_BUCKET_WHITE)
-- - "MASSGOO × MUZIIK 스타일리시 버킷햇(블랙)" (slug: bucket-hat-muziik-black, product_id → MZ_BUCKET_BLACK)

