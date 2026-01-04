-- MAS 한정판 모자 제품들의 SKU 확인 및 업데이트

-- 1. 현재 상태 확인
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
WHERE p.name LIKE '%MAS%한정판%'
ORDER BY p.name;

-- 2. SKU가 없는 경우 slug에서 SKU 생성하여 업데이트
UPDATE products p
SET 
  sku = UPPER(REPLACE(p.slug, '-', '_')),
  updated_at = NOW()
WHERE (p.sku IS NULL OR p.sku = '')
  AND p.slug IS NOT NULL
  AND p.slug != ''
  AND p.name LIKE '%MAS%한정판%'
  -- 중복 방지: 해당 SKU가 다른 제품에 사용되지 않는 경우만 업데이트
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.sku = UPPER(REPLACE(p.slug, '-', '_'))
      AND p2.id != p.id
  );

-- 3. 업데이트 결과 확인
SELECT 
  p.id,
  p.name,
  p.sku,
  p.slug,
  p.category
FROM products p
WHERE p.name LIKE '%MAS%한정판%'
ORDER BY p.name;

