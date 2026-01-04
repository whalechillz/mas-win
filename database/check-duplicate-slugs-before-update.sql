-- 업데이트 전 중복 slug 확인 및 해결 방안

-- 1. 현재 중복 slug 확인
SELECT 
  slug,
  COUNT(*) as count,
  array_agg(id ORDER BY id) as product_ids,
  array_agg(name ORDER BY id) as product_names,
  array_agg(sku ORDER BY id) as product_skus
FROM products
WHERE slug IS NOT NULL 
  AND slug != ''
  AND category IN ('cap', 'bucket_hat', 'hat')
GROUP BY slug
HAVING COUNT(*) > 1
ORDER BY slug;

-- 2. product_composition의 slug와 매칭되지 않은 products 확인
SELECT 
  p.id,
  p.name,
  p.sku,
  p.slug,
  p.category,
  pc.id as composition_id,
  pc.name as composition_name,
  pc.slug as composition_slug,
  pc.product_id
FROM products p
LEFT JOIN product_composition pc ON pc.product_id = p.id OR pc.slug = p.slug
WHERE p.category IN ('cap', 'bucket_hat', 'hat')
  AND (p.slug IS NULL OR p.slug = '' OR p.sku IS NULL OR p.sku = '')
ORDER BY p.name;

-- 3. 중복 slug 해결: 기존 slug를 가진 제품 중 하나만 유지하고 나머지는 NULL로 설정
-- (수동으로 확인 후 실행)
-- 예시: mas-limited-cap-gray가 중복인 경우
-- UPDATE products
-- SET slug = NULL, updated_at = NOW()
-- WHERE id IN (
--   SELECT id FROM products
--   WHERE slug = 'mas-limited-cap-gray'
--   AND category IN ('cap', 'bucket_hat', 'hat')
--   ORDER BY id
--   OFFSET 1  -- 첫 번째 제품 제외하고 나머지 slug 제거
-- );

