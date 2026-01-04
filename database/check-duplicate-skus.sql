-- 중복 SKU 확인 및 해결 방안

-- 1. 현재 중복 SKU 확인
SELECT 
  sku,
  COUNT(*) as count,
  array_agg(id ORDER BY id) as product_ids,
  array_agg(name ORDER BY id) as product_names,
  array_agg(slug ORDER BY id) as product_slugs
FROM products
WHERE sku IS NOT NULL 
  AND sku != ''
  AND category IN ('cap', 'bucket_hat', 'hat')
GROUP BY sku
HAVING COUNT(*) > 1
ORDER BY sku;

-- 2. 중복 SKU 해결: 기존 SKU를 가진 제품 중 하나만 유지하고 나머지는 NULL로 설정
-- (수동으로 확인 후 실행)
-- 예시: MAS_LIMITED_CAP_GRAY가 중복인 경우
-- UPDATE products
-- SET sku = NULL, updated_at = NOW()
-- WHERE id IN (
--   SELECT id FROM products
--   WHERE sku = 'MAS_LIMITED_CAP_GRAY'
--   AND category IN ('cap', 'bucket_hat', 'hat')
--   ORDER BY id
--   OFFSET 1  -- 첫 번째 제품 제외하고 나머지 SKU 제거
-- );

-- 3. 중복 SKU가 있는 제품 상세 확인
SELECT 
  p1.id as product_id_1,
  p1.name as product_name_1,
  p1.sku,
  p1.slug as slug_1,
  p2.id as product_id_2,
  p2.name as product_name_2,
  p2.slug as slug_2
FROM products p1
INNER JOIN products p2 ON p1.sku = p2.sku AND p1.id < p2.id
WHERE p1.sku IS NOT NULL 
  AND p1.sku != ''
  AND p1.category IN ('cap', 'bucket_hat', 'hat')
  AND p2.category IN ('cap', 'bucket_hat', 'hat')
ORDER BY p1.sku, p1.id;

