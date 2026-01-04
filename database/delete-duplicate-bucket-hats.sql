-- 구식 중복 버킷햇 제품 삭제
-- hat-white-bucket, hat-black-bucket 제품을 product_composition 테이블에서 삭제

-- ============================================
-- 1. 삭제 전 확인
-- ============================================

SELECT 
  id,
  name,
  slug,
  category,
  is_active,
  product_id,
  image_url,
  display_order
FROM product_composition
WHERE slug IN ('hat-white-bucket', 'hat-black-bucket')
ORDER BY slug;

-- ============================================
-- 2. 구식 제품 삭제
-- ============================================

DELETE FROM product_composition
WHERE slug IN ('hat-white-bucket', 'hat-black-bucket');

-- ============================================
-- 3. 삭제 후 확인
-- ============================================

-- 활성화된 버킷햇 제품만 확인
SELECT 
  pc.id,
  pc.name,
  pc.slug,
  pc.is_active,
  pc.product_id,
  pc.display_order,
  p.sku as products_sku,
  p.name as products_name
FROM product_composition pc
LEFT JOIN products p ON pc.product_id = p.id
WHERE pc.category = 'hat'
  AND (pc.name LIKE '%버킷%' OR pc.slug LIKE '%bucket%')
  AND pc.is_active = true
ORDER BY pc.display_order;

